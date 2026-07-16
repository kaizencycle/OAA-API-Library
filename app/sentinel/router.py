import logging

from fastapi import APIRouter, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app.sentinel import adapters, attestations
from app.sentinel.auth import verify_agent_hmac
from app.sentinel.constants import PROMPT_VERSION
from app.sentinel.models import SentinelReviewRequest, SentinelReviewResponse, SentinelVerdict

logger = logging.getLogger("oaa.sentinel.router")

router = APIRouter(prefix="/sentinel", tags=["sentinel-broker"])


@router.post("/review", response_model=SentinelReviewResponse)
async def sentinel_review(request: Request) -> SentinelReviewResponse:
    """
    Floor 1 broker — isolated from tutor/wallet/learning routes.
    Logical-not-physical floor separation (C-374): Authority endpoint coexists
  with Academy tenants in one deploy; no shared state with wallet paths.
    """
    raw_body = await request.body()
    agent_id = await verify_agent_hmac(request, raw_body)

    try:
        payload = SentinelReviewRequest.model_validate_json(raw_body)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid request body: {exc}") from exc

    if payload.prompt_version != PROMPT_VERSION:
        raise HTTPException(
            status_code=400,
            detail=f"prompt_version must be '{PROMPT_VERSION}'",
        )

    if not payload.sentinels:
        raise HTTPException(status_code=400, detail="sentinels must be non-empty")

    verdicts: list[SentinelVerdict] = []
    any_persisted = False

    for raw_name in payload.sentinels:
        name = adapters.normalize_sentinel_name(raw_name)
        if name == "aurea":
            verdict = await run_in_threadpool(adapters.review_aurea, payload.context)
        elif name == "atlas":
            verdict = await run_in_threadpool(adapters.review_atlas, payload.context)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown sentinel: {raw_name}")

        attestation_id, persisted = await run_in_threadpool(
            attestations.persist_attestation,
            sentinel=verdict.sentinel,
            context_hash=payload.context_hash,
            verdict=verdict.verdict,
            skip_reason=verdict.skip_reason,
            model=verdict.model,
            prompt_version=PROMPT_VERSION,
            agent_id=agent_id,
            payload={
                "task": payload.task,
                "tier": payload.tier,
                "policy_ref": payload.policy_ref,
                "summary": verdict.summary,
                "blocking": verdict.blocking,
                "non_blocking": verdict.non_blocking,
            },
        )
        any_persisted = any_persisted or persisted
        verdicts.append(
            SentinelVerdict(
                **verdict.model_dump(exclude={"attestation"}),
                attestation=attestation_id,
            )
        )

    if not any_persisted:
        logger.warning(
            "DATABASE_URL not wired — attestations returned as IDs only (not persisted)"
        )

    return SentinelReviewResponse(
        verdicts=verdicts,
        prompt_version=PROMPT_VERSION,
        attestations_persisted=any_persisted,
    )

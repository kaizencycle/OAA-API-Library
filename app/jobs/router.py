from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.jobs.models import (
    ActiveJobsResponse,
    JobClaimRequest,
    JobClaimResponse,
    JobHeartbeatRequest,
    JobLease,
    JobReleaseRequest,
)
from app.jobs.store import (
    ActiveClaimConflict,
    LeaseNotActive,
    claim_job,
    heartbeat_job,
    list_active_jobs,
    release_job,
)
from app.sentinel.auth import verify_agent_hmac

router = APIRouter(prefix="/jobs", tags=["atomic-job-broker"])


@router.post("/claim", response_model=JobClaimResponse)
async def claim(request: Request) -> JobClaimResponse:
    raw_body = await request.body()
    agent_id = await verify_agent_hmac(request, raw_body)
    try:
        payload = JobClaimRequest.model_validate_json(raw_body)
        lease = await run_in_threadpool(claim_job, agent_id=agent_id, payload=payload.model_dump())
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_url=False)) from exc
    except ActiveClaimConflict as exc:
        raise HTTPException(
            status_code=409,
            detail={"code": "ACTIVE_CLAIM_CONFLICT", "incumbent": exc.incumbent},
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return JobClaimResponse(lease=JobLease.model_validate(lease))


@router.post("/heartbeat", response_model=JobClaimResponse)
async def heartbeat(request: Request) -> JobClaimResponse:
    raw_body = await request.body()
    agent_id = await verify_agent_hmac(request, raw_body)
    try:
        payload = JobHeartbeatRequest.model_validate_json(raw_body)
        lease = await run_in_threadpool(
            heartbeat_job,
            agent_id=agent_id,
            claim_id=payload.claim_id,
            lease_seconds=payload.lease_seconds,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_url=False)) from exc
    except LeaseNotActive as exc:
        raise HTTPException(status_code=409, detail={"code": "LEASE_NOT_ACTIVE"}) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return JobClaimResponse(lease=JobLease.model_validate(lease))


@router.post("/release", response_model=JobClaimResponse)
async def release(request: Request) -> JobClaimResponse:
    raw_body = await request.body()
    agent_id = await verify_agent_hmac(request, raw_body)
    try:
        payload = JobReleaseRequest.model_validate_json(raw_body)
        lease = await run_in_threadpool(release_job, agent_id=agent_id, payload=payload.model_dump())
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors(include_url=False)) from exc
    except LeaseNotActive as exc:
        raise HTTPException(status_code=409, detail={"code": "LEASE_NOT_ACTIVE"}) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return JobClaimResponse(lease=JobLease.model_validate(lease))


@router.get("/active", response_model=ActiveJobsResponse)
async def active(request: Request, job_id: str | None = Query(default=None, max_length=128)) -> ActiveJobsResponse:
    agent_id = await verify_agent_hmac(request, b"")
    del agent_id  # authentication is required; identity is not used to filter the shared board
    try:
        jobs = await run_in_threadpool(list_active_jobs, job_id=job_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return ActiveJobsResponse(jobs=[JobLease.model_validate(job) for job in jobs])

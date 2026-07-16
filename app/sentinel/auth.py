import hashlib
import hmac
import os
import time

from fastapi import HTTPException, Request

from app.sentinel.constants import (
    AGENT_HMAC_ENV_SUFFIX,
    AGENT_ID_PREFIX,
    LEGACY_SENTINEL_HMAC_ENV,
    TIMESTAMP_WINDOW_SEC,
)


def agent_env_key(agent_id: str) -> str:
    """Map x-oaa-agent to env var: mobius-ci-sentinel -> MOBIUS_CI_SENTINEL_HMAC_KEY."""
    normalized = agent_id.upper().replace("-", "_")
    return f"{normalized}{AGENT_HMAC_ENV_SUFFIX}"


def resolve_agent_hmac_secret(agent_id: str) -> str | None:
    """
    Per-agent HMAC lookup. Phase 1 ships one consumer (mobius-ci-sentinel);
    key-per-agent is additive — new agents get their own *_HMAC_KEY env vars.
    """
    per_agent = os.getenv(agent_env_key(agent_id), "").strip()
    if per_agent:
        return per_agent
    return os.getenv(LEGACY_SENTINEL_HMAC_ENV, "").strip() or None


async def verify_agent_hmac(request: Request, raw_body: bytes) -> str:
    agent_id = (request.headers.get("x-oaa-agent") or "").strip()
    timestamp = (request.headers.get("x-oaa-timestamp") or "").strip()
    signature = (request.headers.get("x-oaa-signature") or "").strip().lower()

    if not agent_id.startswith(AGENT_ID_PREFIX):
        raise HTTPException(
            status_code=401,
            detail=f"x-oaa-agent must carry '{AGENT_ID_PREFIX}' prefix",
        )

    secret = resolve_agent_hmac_secret(agent_id)
    if not secret:
        raise HTTPException(
            status_code=401,
            detail=f"No HMAC secret configured for agent '{agent_id}'",
        )

    if not timestamp or not signature:
        raise HTTPException(status_code=401, detail="Missing x-oaa-timestamp or x-oaa-signature")

    try:
        ts_int = int(timestamp)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid x-oaa-timestamp") from exc

    now = int(time.time())
    if abs(now - ts_int) > TIMESTAMP_WINDOW_SEC:
        raise HTTPException(status_code=401, detail="x-oaa-timestamp outside allowed window")

    body_text = raw_body.decode("utf-8")
    payload = f"{timestamp}.{body_text}"
    expected = hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")

    return agent_id

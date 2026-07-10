# app/auth/identity.py
"""
Mobius Identity Service JWT verification for mint and wallet paths.

Prefers local HS256 verification (MOBIUS_IDENTITY_JWT_SECRET / JWT_SECRET / SECRET_KEY),
then falls back to GET /auth/introspect on the identity service.
"""

import os
from typing import Optional

import httpx
import jwt as pyjwt

from .jwt import AuthClaims

_DEV_SECRETS = frozenset(
    {
        "oaa-dev-secret-change-in-production",
        "dev-secret-change-in-production",
    }
)


def _configured_secrets() -> list[str]:
    secrets: list[str] = []
    for key in ("MOBIUS_IDENTITY_JWT_SECRET", "JWT_SECRET", "SECRET_KEY"):
        value = (os.getenv(key) or "").strip()
        if value and value not in _DEV_SECRETS:
            secrets.append(value)
    return secrets


def jwt_configured() -> bool:
    """True when identity verification is wired (local secret, JWKS, or introspect)."""
    if _configured_secrets():
        return True
    if (os.getenv("MOBIUS_IDENTITY_JWKS_URL") or "").strip():
        return True
    # Introspect delegation to mobius-identity-service is always wired in production
    # (see verify_identity_via_introspect default base URL).
    return True


def _claims_from_payload(payload: dict) -> Optional[AuthClaims]:
    user_id = payload.get("user_id") or payload.get("sub") or payload.get("userId")
    if not user_id:
        return None
    return AuthClaims(
        user_id=str(user_id),
        handle=str(payload.get("handle") or payload.get("name") or ""),
        email=payload.get("email"),
        wallet_address=payload.get("walletAddress") or payload.get("civic_id"),
        iat=payload.get("iat"),
        exp=payload.get("exp"),
    )


def verify_identity_jwt(token: str) -> Optional[AuthClaims]:
    """Verify HS256 tokens issued by mobius-identity-service (or compatible issuers)."""
    for secret in _configured_secrets():
        try:
            payload = pyjwt.decode(token, secret, algorithms=["HS256"])
            return _claims_from_payload(payload)
        except pyjwt.PyJWTError:
            continue
    return None


async def verify_identity_via_introspect(token: str) -> Optional[AuthClaims]:
    """Delegate verification to mobius-identity-service /auth/introspect."""
    base = (
        os.getenv("MOBIUS_IDENTITY_INTROSPECT_URL")
        or os.getenv("IDENTITY_API_BASE")
        or "https://mobius-identity-service.onrender.com"
    ).rstrip("/")
    url = f"{base}/auth/introspect"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
            )
        if response.status_code != 200:
            return None
        data = response.json()
        return _claims_from_payload(data)
    except Exception:
        return None


async def resolve_identity(token: str) -> Optional[AuthClaims]:
    """Resolve verified subject claims for mint/wallet enforcement."""
    local = verify_identity_jwt(token)
    if local:
        return local
    return await verify_identity_via_introspect(token)

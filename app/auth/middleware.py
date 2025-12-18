# app/auth/middleware.py
"""
Authentication Middleware for FastAPI

Provides require_auth dependency for protected routes.
Extracts user identity from JWT Bearer token.
"""

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from dataclasses import dataclass

from .jwt import verify_jwt, extract_bearer_token, AuthClaims


# FastAPI security scheme
security = HTTPBearer(auto_error=False)


@dataclass
class AuthedRequest:
    """
    Authenticated request context.
    
    Contains verified user information extracted from JWT.
    Available in route handlers via Depends(require_auth).
    """
    user_id: str      # Canonical subject_id - use this for all DB operations
    handle: str       # User handle (username)
    email: Optional[str] = None
    wallet_address: Optional[str] = None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthedRequest]:
    """
    Get current authenticated user from request.
    
    Returns None if no valid auth token is present.
    Use this when auth is optional.
    """
    # Try Authorization header first
    if credentials and credentials.credentials:
        claims = verify_jwt(credentials.credentials)
        if claims:
            return AuthedRequest(
                user_id=claims.user_id,
                handle=claims.handle,
                email=claims.email,
                wallet_address=claims.wallet_address
            )
    
    # Fallback: Check raw Authorization header
    auth_header = request.headers.get("Authorization")
    token = extract_bearer_token(auth_header)
    
    if token:
        claims = verify_jwt(token)
        if claims:
            return AuthedRequest(
                user_id=claims.user_id,
                handle=claims.handle,
                email=claims.email,
                wallet_address=claims.wallet_address
            )
    
    return None


async def require_auth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthedRequest:
    """
    Require authenticated user for protected routes.
    
    Usage:
        @app.post("/api/protected")
        async def protected_route(auth: AuthedRequest = Depends(require_auth)):
            user_id = auth.user_id  # Canonical subject_id
            ...
    
    Raises:
        HTTPException 401 if not authenticated
    """
    user = await get_current_user(request, credentials)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "missing_or_invalid_token",
                "message": "Authentication required. Provide valid Bearer token."
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def optional_auth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthedRequest]:
    """
    Optional authentication - doesn't raise error if not authenticated.
    
    Use this for routes that behave differently for logged-in users
    but still work for anonymous users.
    
    Usage:
        @app.get("/api/modules")
        async def list_modules(auth: Optional[AuthedRequest] = Depends(optional_auth)):
            if auth:
                # Personalize for logged-in user
                user_id = auth.user_id
            else:
                # Anonymous access
                ...
    """
    return await get_current_user(request, credentials)

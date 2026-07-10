# app/auth/__init__.py
"""
OAA Auth Module - JWT verification and authentication middleware
"""

from .jwt import verify_jwt, AuthClaims
from .identity import jwt_configured, resolve_identity, verify_identity_jwt
from .middleware import (
    require_auth,
    require_identity_auth,
    optional_auth,
    AuthedRequest,
    get_current_user,
)

__all__ = [
    'verify_jwt',
    'AuthClaims',
    'jwt_configured',
    'resolve_identity',
    'verify_identity_jwt',
    'require_auth',
    'require_identity_auth',
    'optional_auth',
    'AuthedRequest',
    'get_current_user',
]

# app/auth/__init__.py
"""
OAA Auth Module - JWT verification and authentication middleware
"""

from .jwt import verify_jwt, AuthClaims
from .middleware import require_auth, optional_auth, AuthedRequest, get_current_user

__all__ = [
    'verify_jwt',
    'AuthClaims',
    'require_auth',
    'optional_auth',
    'AuthedRequest',
    'get_current_user',
]

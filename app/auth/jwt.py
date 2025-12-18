# app/auth/jwt.py
"""
JWT Token Verification for OAA Auth System

Compatible with the TypeScript JWT implementation in src/lib/auth/jwt.ts
Uses HMAC-SHA256 signature verification.
"""

import os
import hmac
import hashlib
import base64
import json
import time
from dataclasses import dataclass
from typing import Optional

# JWT secret - must match the TypeScript JWT_SECRET
JWT_SECRET = os.getenv("JWT_SECRET", "oaa-dev-secret-change-in-production")

if JWT_SECRET == "oaa-dev-secret-change-in-production":
    import warnings
    warnings.warn("JWT_SECRET is using default value. Set JWT_SECRET in production!")


@dataclass
class AuthClaims:
    """Authenticated user claims from JWT"""
    user_id: str  # 'sub' field in JWT (subject_id)
    handle: str
    email: Optional[str] = None
    wallet_address: Optional[str] = None
    iat: Optional[int] = None  # Issued at timestamp (ms)
    exp: Optional[int] = None  # Expiration timestamp (ms)


def base64url_encode(data: bytes) -> str:
    """Base64URL encode (JWT-safe, no padding)"""
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def base64url_decode(data: str) -> bytes:
    """Base64URL decode with padding handling"""
    # Add padding if needed
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)


def generate_hmac(data: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature (hex)"""
    return hmac.new(
        secret.encode('utf-8'),
        data.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def verify_jwt(token: str) -> Optional[AuthClaims]:
    """
    Verify and decode JWT token.
    
    Compatible with TypeScript JWT from src/lib/auth/jwt.ts
    Returns AuthClaims if valid, None if invalid or expired.
    
    Args:
        token: JWT string in format "header.payload.signature"
        
    Returns:
        AuthClaims if token is valid, None otherwise
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify signature
        expected_sig = base64url_encode(
            bytes.fromhex(generate_hmac(f"{header_b64}.{payload_b64}", JWT_SECRET))
        )
        
        if signature_b64 != expected_sig:
            return None
        
        # Decode payload
        payload_json = base64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Check expiration (exp is in milliseconds)
        exp = payload.get('exp')
        if exp and exp < int(time.time() * 1000):
            return None
        
        # Extract claims
        return AuthClaims(
            user_id=payload.get('userId', ''),
            handle=payload.get('handle', ''),
            email=payload.get('email'),
            wallet_address=payload.get('walletAddress'),
            iat=payload.get('iat'),
            exp=exp
        )
        
    except Exception as e:
        # Log for debugging but don't expose details
        import sys
        print(f"JWT verification failed: {e}", file=sys.stderr)
        return None


def decode_jwt_unsafe(token: str) -> Optional[dict]:
    """
    Decode JWT without verification (for debugging only).
    
    WARNING: This does NOT verify the signature!
    Never trust data from this function for authentication.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        payload_json = base64url_decode(parts[1]).decode('utf-8')
        return json.loads(payload_json)
    except Exception:
        return None


def is_token_expired(token: str) -> bool:
    """Check if token is expired without full verification"""
    payload = decode_jwt_unsafe(token)
    if not payload:
        return True
    
    exp = payload.get('exp')
    if not exp:
        return True
    
    return exp < int(time.time() * 1000)


def extract_bearer_token(auth_header: Optional[str]) -> Optional[str]:
    """
    Extract JWT from Authorization header.
    
    Args:
        auth_header: Authorization header value (e.g., "Bearer xyz...")
        
    Returns:
        Token string or None if not present/invalid format
    """
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    return auth_header[7:]  # Remove "Bearer " prefix

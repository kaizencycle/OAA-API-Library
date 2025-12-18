# app/security/password.py
"""
Password Hashing Utilities for OAA Auth System

Uses bcrypt for password hashing (industry standard).
Falls back to PBKDF2-SHA512 if bcrypt is not available.

Compatible with TypeScript implementation in src/lib/crypto/hash.ts
"""

import hashlib
import secrets
import hmac
from typing import Tuple

# Try to import bcrypt, fallback to native crypto
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False
    import warnings
    warnings.warn(
        "bcrypt not installed. Using PBKDF2 fallback. "
        "Install bcrypt for production: pip install bcrypt"
    )


# PBKDF2 configuration (matches TypeScript fallback)
PBKDF2_ITERATIONS = 100000
PBKDF2_KEY_LENGTH = 64  # bytes
PBKDF2_HASH_FUNC = 'sha512'

# Bcrypt configuration
BCRYPT_ROUNDS = 12


async def hash_password(password: str) -> str:
    """
    Hash password securely.
    
    Uses bcrypt if available, otherwise PBKDF2-SHA512.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string (bcrypt format or salt:hash format)
    """
    if BCRYPT_AVAILABLE:
        # Use bcrypt (preferred)
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    else:
        # Fallback: PBKDF2-SHA512 (compatible with TypeScript)
        salt = secrets.token_hex(16)
        hash_bytes = hashlib.pbkdf2_hmac(
            PBKDF2_HASH_FUNC,
            password.encode('utf-8'),
            salt.encode('utf-8'),
            PBKDF2_ITERATIONS,
            dklen=PBKDF2_KEY_LENGTH
        )
        return f"{salt}:{hash_bytes.hex()}"


async def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verify password against stored hash.
    
    Automatically detects bcrypt vs PBKDF2 format.
    
    Args:
        password: Plain text password to verify
        stored_hash: Previously hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        if stored_hash.startswith('$2'):
            # Bcrypt format
            if not BCRYPT_AVAILABLE:
                raise RuntimeError("bcrypt not available to verify bcrypt hash")
            return bcrypt.checkpw(
                password.encode('utf-8'),
                stored_hash.encode('utf-8')
            )
        else:
            # PBKDF2 format (salt:hash)
            parts = stored_hash.split(':')
            if len(parts) != 2:
                return False
            
            salt, expected_hash = parts
            
            # Compute hash with same parameters
            computed_hash = hashlib.pbkdf2_hmac(
                PBKDF2_HASH_FUNC,
                password.encode('utf-8'),
                salt.encode('utf-8'),
                PBKDF2_ITERATIONS,
                dklen=PBKDF2_KEY_LENGTH
            ).hex()
            
            # Constant-time comparison
            return hmac.compare_digest(computed_hash, expected_hash)
            
    except Exception:
        return False


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.
    
    Args:
        length: Number of random bytes (default 32)
        
    Returns:
        Hex-encoded random string (2x length characters)
    """
    return secrets.token_hex(length)


def sha256(data: str) -> str:
    """
    Generate SHA256 hash of data.
    
    Args:
        data: String to hash
        
    Returns:
        Hex-encoded SHA256 hash
    """
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

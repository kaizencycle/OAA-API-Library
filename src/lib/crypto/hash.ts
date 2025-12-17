// Cryptographic hashing utilities for OAA Auth + Wallet System
// Provides SHA256, bcrypt, and HMAC functions

import * as crypto from 'crypto';

/**
 * Generate SHA256 hash of data (without 0x prefix)
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate SHA256 hash with 0x prefix (for blockchain compatibility)
 */
export function sha256hex(data: string | Buffer): string {
  return '0x' + sha256(data);
}

/**
 * Generate secure random token
 * @param bytes Number of random bytes (default 32)
 * @returns Hex-encoded random string
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash password using bcrypt-compatible algorithm
 * Note: Using native crypto for broader compatibility
 * For production with bcrypt, use the async bcrypt functions below
 */
export function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash (sync version)
 */
export function verifyPasswordSync(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

// Bcrypt-compatible async functions (require bcryptjs)
let bcrypt: typeof import('bcryptjs') | null = null;

async function loadBcrypt() {
  if (!bcrypt) {
    try {
      bcrypt = await import('bcryptjs');
    } catch {
      // bcryptjs not installed, will use native crypto
      bcrypt = null;
    }
  }
  return bcrypt;
}

/**
 * Hash password with bcrypt (async)
 * Falls back to native crypto if bcryptjs not installed
 */
export async function hashPassword(password: string): Promise<string> {
  const bc = await loadBcrypt();
  if (bc) {
    return bc.hash(password, 12);
  }
  return hashPasswordSync(password);
}

/**
 * Verify password against hash (async)
 * Falls back to native crypto if bcryptjs not installed
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bc = await loadBcrypt();
  if (bc && hash.startsWith('$2')) {
    // bcrypt hash format
    return bc.compare(password, hash);
  }
  // Native crypto format
  return verifyPasswordSync(password, hash);
}

/**
 * Generate HMAC signature
 */
export function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature (timing-safe)
 */
export function verifyHMAC(
  data: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateHMAC(data, secret);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * Generate a secure UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

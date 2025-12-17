// JWT token generation and verification for OAA Auth System
// Provides stateless session tokens with configurable expiry

import { generateHMAC, generateToken } from '../crypto/hash';

const JWT_SECRET = process.env.JWT_SECRET || 'oaa-dev-secret-change-in-production';
const JWT_EXPIRES_IN_DAYS = 30;
const JWT_EXPIRES_IN_MS = JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId: string;
  handle: string;
  email?: string;
  walletAddress?: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Base64URL encode (JWT-safe)
 */
function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(data: string): string {
  const padded = data + '==='.slice(0, (4 - (data.length % 4)) % 4);
  return Buffer.from(
    padded.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString();
}

/**
 * Generate JWT access token
 */
export function generateJWT(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const now = Date.now();
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRES_IN_MS,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = base64UrlEncode(generateHMAC(`${header}.${body}`, JWT_SECRET));

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode JWT token
 * Returns null if invalid or expired
 */
export function verifyJWT(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    // Verify signature
    const expectedSignature = base64UrlEncode(
      generateHMAC(`${header}.${body}`, JWT_SECRET)
    );
    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload: TokenPayload = JSON.parse(base64UrlDecode(body));

    // Check expiration
    if (payload.exp && payload.exp < Date.now()) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging only)
 */
export function decodeJWT(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    return JSON.parse(base64UrlDecode(parts[1]));
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpiring(token: string, bufferMs: number = 60000): boolean {
  const payload = verifyJWT(token);
  if (!payload || !payload.exp) return true;
  return payload.exp - Date.now() < bufferMs;
}

/**
 * Generate a refresh token (longer-lived, stored in DB)
 */
export function generateRefreshToken(): string {
  return generateToken(48); // 384 bits of entropy
}

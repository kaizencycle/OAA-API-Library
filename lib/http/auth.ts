import type { NextApiRequest } from "next";
import { createHash, timingSafeEqual } from "crypto";

const READ_TOKEN_ENVS = [
  "OAA_READ_TOKEN",
  "OAA_SERVICE_TOKEN",
  "AGENT_SERVICE_TOKEN",
  "KV_HMAC_SECRET",
  "MEMORY_HMAC_SECRET",
  "OAA_HMAC_SECRET"
] as const;

function normalizeTokenMaterial(value?: string | null): string | null {
  if (!value) return null;
  let normalized = value.trim();
  if (!normalized) return null;

  const bearerMatch = normalized.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) normalized = bearerMatch[1].trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized || null;
}

function configuredReadTokens(): string[] {
  return READ_TOKEN_ENVS
    .map((key) => normalizeTokenMaterial(process.env[key]))
    .filter((value): value is string => Boolean(value));
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function hasConfiguredReadToken(): boolean {
  return configuredReadTokens().length > 0;
}

export function verifyReadToken(candidate?: string | null): boolean {
  const normalizedCandidate = normalizeTokenMaterial(candidate);
  if (!normalizedCandidate) return false;
  const tokens = configuredReadTokens();
  if (tokens.length === 0) return false;
  const candidateDigest = digest(normalizedCandidate);
  return tokens.some((token) => timingSafeEqual(candidateDigest, digest(token)));
}

export function extractReadToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();

  const headerValue =
    req.headers["x-oaa-read-token"] ??
    req.headers["x-oaa-service-token"] ??
    req.headers["x-agent-service-token"];

  if (Array.isArray(headerValue)) return headerValue[0] ?? null;
  return headerValue ?? null;
}

export function requireReadAuth(req: NextApiRequest): { ok: true } | { ok: false; status: number; code: string } {
  if (!hasConfiguredReadToken()) {
    return { ok: false, status: 503, code: "read_auth_not_configured" };
  }
  if (!verifyReadToken(extractReadToken(req))) {
    return { ok: false, status: 401, code: "read_auth_required" };
  }
  return { ok: true };
}

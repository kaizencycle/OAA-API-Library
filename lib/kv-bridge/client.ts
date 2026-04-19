/**
 * Client for Terminal warm KV bridge — call from mobius-civic-ai-terminal fallback layer.
 * Set OAA_API_BASE_URL (or OAA_API_BASE) and KV_BRIDGE_SECRET on the caller.
 */

const OAA_BASE = process.env.OAA_API_BASE_URL ?? process.env.OAA_API_BASE ?? "";
const KV_BRIDGE_SECRET = process.env.KV_BRIDGE_SECRET ?? "";

function withTimeout(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

export interface KvBridgeReadResult {
  ok: boolean;
  key: string;
  value: unknown;
  written_at: string;
  source: string;
  schema?: string;
}

export async function kvBridgeWrite(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<boolean> {
  if (!OAA_BASE || !KV_BRIDGE_SECRET) return false;
  try {
    const res = await fetch(`${OAA_BASE.replace(/\/$/, "")}/api/kv-bridge/write`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KV_BRIDGE_SECRET}`
      },
      body: JSON.stringify({
        key,
        value,
        ttl_seconds: ttlSeconds,
        source: "terminal"
      }),
      signal: withTimeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function kvBridgeRead(key: string): Promise<KvBridgeReadResult | null> {
  if (!OAA_BASE) return null;
  try {
    const base = OAA_BASE.replace(/\/$/, "");
    const res = await fetch(
      `${base}/api/kv-bridge/read?key=${encodeURIComponent(key)}`,
      {
        signal: withTimeout(3000)
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as KvBridgeReadResult;
  } catch {
    return null;
  }
}

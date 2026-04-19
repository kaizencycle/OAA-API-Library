import type { NextApiRequest, NextApiResponse } from "next";
import { loadKvBridgeStore } from "../../../lib/kv-bridge/store";
import type { KvBridgeEntry } from "../../../lib/kv-bridge/types";

function isEntry(v: unknown): v is KvBridgeEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as KvBridgeEntry;
  return typeof o.written_at === "string" && "value" in o;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const keyParam = req.query.key;
  const key = typeof keyParam === "string" ? keyParam : undefined;

  const store = loadKvBridgeStore();

  if (!key) {
    const summary = Object.fromEntries(
      Object.entries(store).map(([k, v]) => [
        k,
        isEntry(v)
          ? {
              written_at: v.written_at,
              source: v.source,
              has_value: v.value !== null && v.value !== undefined
            }
          : { written_at: null, source: null, has_value: false }
      ])
    );
    return res.status(200).json({
      ok: true,
      keys: summary,
      count: Object.keys(store).length
    });
  }

  const raw = store[key];
  if (!raw || !isEntry(raw)) {
    return res.status(404).json({ ok: false, error: "key_not_found", key });
  }

  if (typeof raw.ttl_seconds === "number" && raw.ttl_seconds > 0) {
    const age = (Date.now() - new Date(raw.written_at).getTime()) / 1000;
    if (age > raw.ttl_seconds) {
      return res.status(404).json({
        ok: false,
        error: "key_expired",
        key,
        age_seconds: Math.round(age),
        ttl_seconds: raw.ttl_seconds
      });
    }
  }

  return res.status(200).json({
    ok: true,
    key,
    value: raw.value,
    written_at: raw.written_at,
    source: raw.source ?? "terminal-fallback",
    schema: "KV_BRIDGE_V1"
  });
}

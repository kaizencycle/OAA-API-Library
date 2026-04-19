import type { NextApiRequest, NextApiResponse } from "next";
import { kvBridgeAuthOk } from "../../../lib/kv-bridge/auth";
import { KV_BRIDGE_ALLOWED_KEYS } from "../../../lib/kv-bridge/constants";
import { appendGiBridgeMemoryNote } from "../../../lib/kv-bridge/giMemoryNote";
import { loadKvBridgeStore, saveKvBridgeStore } from "../../../lib/kv-bridge/store";
import type { KvBridgeEntry } from "../../../lib/kv-bridge/types";

type WriteBody = {
  key?: string;
  value?: unknown;
  ttl_seconds?: number;
  source?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const secret = process.env.KV_BRIDGE_SECRET;
  if (!secret) {
    return res.status(500).json({ ok: false, error: "KV_BRIDGE_SECRET not configured" });
  }

  const auth = (req.headers.authorization as string | undefined) ?? "";
  const hmacHeader = (req.headers["x-hmac-sha256"] as string | undefined) ?? "";
  const bodyStr = JSON.stringify(req.body);

  if (!kvBridgeAuthOk(secret, auth, hmacHeader, bodyStr)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { key, value, ttl_seconds, source } = req.body as WriteBody;

  if (!key || value === undefined) {
    return res.status(400).json({ ok: false, error: "key and value required" });
  }

  if (!KV_BRIDGE_ALLOWED_KEYS.has(key)) {
    return res.status(400).json({ ok: false, error: `key_not_allowed: ${key}` });
  }

  const store = loadKvBridgeStore();
  const entry: KvBridgeEntry = {
    value,
    written_at: new Date().toISOString(),
    source: source ?? "terminal-fallback",
    ...(typeof ttl_seconds === "number" && ttl_seconds > 0 ? { ttl_seconds } : {})
  };
  store[key] = entry;
  saveKvBridgeStore(store);

  if (key === "GI_STATE") {
    appendGiBridgeMemoryNote(value);
  }

  return res.status(200).json({
    ok: true,
    key,
    written_at: entry.written_at
  });
}

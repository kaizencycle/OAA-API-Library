import type { NextApiRequest, NextApiResponse } from "next";
import { appendMemoryEntry, getLatestHash, readMemoryEntriesByPrefix } from "../../../lib/kv/store";
import { verifyHmac } from "../../../lib/crypto/hmac";
import { canonicalJson } from "../../../lib/crypto/canonicalJson";
import { sealToLedger } from "../../../lib/ledger/bridge";
import type { AgentKVPayload } from "../../../types/oaa-kv";

function resolveKvSecret(): string {
  return (
    process.env.KV_HMAC_SECRET ||
    process.env.MEMORY_HMAC_SECRET ||
    process.env.OAA_HMAC_SECRET ||
    ""
  );
}

function isPayload(body: unknown): body is AgentKVPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as AgentKVPayload;
  return (
    typeof b.key === "string" &&
    "value" in b &&
    typeof b.agent === "string" &&
    typeof b.cycle === "string" &&
    typeof b.signature === "string"
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const prefix = typeof req.query.prefix === "string" ? req.query.prefix : "";
    const notes = await readMemoryEntriesByPrefix(prefix);
    return res.status(200).json({ ok: true, notes });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const KV_HMAC_SECRET = resolveKvSecret();
  if (!KV_HMAC_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "KV_HMAC_SECRET (or MEMORY_HMAC_SECRET / OAA_HMAC_SECRET) missing"
    });
  }

  const body = req.body;
  if (!isPayload(body)) {
    return res.status(400).json({ ok: false, error: "Invalid or incomplete payload" });
  }

  const { key, value, agent, cycle, intent, signature } = body;

  let previousHash: string | null;
  if (body.previousHash !== undefined) {
    previousHash = body.previousHash;
  } else {
    previousHash = await getLatestHash();
  }

  const signable = canonicalJson({
    key,
    value,
    agent,
    cycle,
    intent: intent ?? null,
    previousHash
  });

  if (!verifyHmac(signable, signature, KV_HMAC_SECRET)) {
    return res.status(403).json({ ok: false, error: "Invalid signature" });
  }

  const entry = await appendMemoryEntry({
    note: `KV: ${key}`,
    tag: `kv:${agent}`,
    agent,
    cycle,
    intent,
    data: { key, value },
    previous_hash: previousHash,
    type: "OAA_MEMORY_ENTRY_V1"
  });

  void sealToLedger(entry).catch(() => {
    /* async ledger bridge — swallow to avoid unhandled rejection */
  });

  return res.status(200).json({
    ok: true,
    accepted: true,
    hash: entry.hash,
    previous_hash: entry.previous_hash,
    ts: entry.ts
  });
}

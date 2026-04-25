import type { NextApiRequest, NextApiResponse } from "next";
import { appendMemoryEntry, getLatestHash, readMemoryEntriesByPrefix } from "../../../lib/kv/store";
import { verifyHmac } from "../../../lib/crypto/hmac";
import { canonicalJson } from "../../../lib/crypto/canonicalJson";
import { sealToLedger } from "../../../lib/ledger/bridge";
import { requireReadAuth } from "../../../lib/http/auth";
import type { AgentKVPayload, OaaMemoryEntry } from "../../../types/oaa-kv";

const DEFAULT_PUBLIC_LIMIT = 10;
const MAX_PUBLIC_LIMIT = 25;
const DEFAULT_PRIVATE_LIMIT = 50;
const MAX_PRIVATE_LIMIT = 100;
const MIN_PRIVATE_PREFIX_LENGTH = 3;
const ALLOW_UNSCOPED_PRIVATE_READS = process.env.OAA_ALLOW_UNSCOPED_PRIVATE_READS === "true";

function resolveKvSecret(): string {
  return (
    process.env.KV_HMAC_SECRET ||
    process.env.MEMORY_HMAC_SECRET ||
    process.env.OAA_HMAC_SECRET ||
    ""
  );
}

function parseLimit(value: string | string[] | undefined, fallback: number, max: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

function boolQuery(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true" || raw === "yes";
}

function sanitizeEntry(entry: OaaMemoryEntry) {
  return {
    type: entry.type,
    hash: entry.hash,
    previous_hash: entry.previous_hash ?? null,
    ts: entry.ts,
    agent: entry.agent,
    cycle: entry.cycle,
    intent: entry.intent ?? null,
    key: entry.data.key,
  };
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

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const privateRead = boolQuery(req.query.private) || boolQuery(req.query.raw);
  const prefix = typeof req.query.prefix === "string" ? req.query.prefix.trim() : "";

  if (!privateRead) {
    const limit = parseLimit(req.query.limit, DEFAULT_PUBLIC_LIMIT, MAX_PUBLIC_LIMIT);
    const notes = await readMemoryEntriesByPrefix(prefix);
    const publicNotes = notes
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit)
      .map(sanitizeEntry);

    return res.status(200).json({
      ok: true,
      mode: "public_summary",
      notes: publicNotes,
      count: publicNotes.length,
      raw_available: false,
      raw_requires: "private=true plus read auth",
    });
  }

  const auth = requireReadAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.code });
  }

  if (!prefix && !ALLOW_UNSCOPED_PRIVATE_READS) {
    return res.status(400).json({
      ok: false,
      error: "prefix_required",
      message: "Private memory reads require a prefix unless OAA_ALLOW_UNSCOPED_PRIVATE_READS=true.",
    });
  }

  if (prefix && prefix.length < MIN_PRIVATE_PREFIX_LENGTH) {
    return res.status(400).json({
      ok: false,
      error: "prefix_too_short",
      minPrefixLength: MIN_PRIVATE_PREFIX_LENGTH,
    });
  }

  const limit = parseLimit(req.query.limit, DEFAULT_PRIVATE_LIMIT, MAX_PRIVATE_LIMIT);
  const notes = await readMemoryEntriesByPrefix(prefix);
  return res.status(200).json({
    ok: true,
    mode: "private_raw",
    notes: notes.sort((a, b) => b.ts - a.ts).slice(0, limit),
    count: Math.min(notes.length, limit),
    prefix,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return handleGet(req, res);
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

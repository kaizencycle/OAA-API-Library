#!/usr/bin/env node
/**
 * C-292 / Phase 3 mesh workflow: forward recent OAA_MEMORY_ENTRY_V1 rows to Civic Core /mesh/ingest.
 * Uses OAA_MEMORY.json on disk (CI checkout). Set CIVIC_LEDGER_URL + CIVIC_LEDGER_TOKEN (or LEDGER_*).
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const MEMORY_PATH = process.env.OAA_MEMORY_PATH || path.join(repoRoot, "OAA_MEMORY.json");

const LEDGER_URL = (process.env.CIVIC_LEDGER_URL || process.env.LEDGER_BASE_URL || "").replace(/\/$/, "");
const LEDGER_TOKEN = process.env.CIVIC_LEDGER_TOKEN || process.env.LEDGER_ADMIN_TOKEN || "";
const LOOKBACK = Math.max(1, parseInt(process.env.OAA_SEAL_LOOKBACK || "50", 10) || 50);
const SEALED_PATH = process.env.OAA_SEALED_INDEX_PATH || path.join(repoRoot, "ledger", "oaa-sealed-memory.json");

function isOaaMemoryEntry(n) {
  return (
    n &&
    typeof n === "object" &&
    n.type === "OAA_MEMORY_ENTRY_V1" &&
    typeof n.hash === "string" &&
    typeof n.ts === "number" &&
    n.data &&
    typeof n.data === "object" &&
    typeof n.data.key === "string"
  );
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sourceHash(entry) {
  return sha256(JSON.stringify({
    node_id: "oaa-api-library",
    event_type: "OAA_MEMORY_ENTRY_V1",
    hash: entry.hash,
    previous_hash: entry.previous_hash,
    key: entry.data.key,
    ts: entry.ts,
  }));
}

function idempotencyKey(entry, hash) {
  const cycle = entry.cycle || "C-—";
  return `oaa-api-library:OAA_MEMORY_ENTRY_V1:${cycle}:${hash.slice(0, 16)}:seal-memory`;
}

function buildBody(entry) {
  const hash = sourceHash(entry);
  return {
    type: "OAA_MEMORY_ENTRY_V1",
    schema: "OAA_MEMORY_ENTRY_V1",
    node_id: "oaa-api-library",
    event_type: "OAA_MEMORY_ENTRY_V1",
    workflow_id: "seal-memory",
    source_hash: hash,
    idempotency_key: idempotencyKey(entry, hash),
    agent: entry.agent,
    cycle: entry.cycle,
    key: entry.data.key,
    intent: entry.intent ?? null,
    hash: entry.hash,
    previous_hash: entry.previous_hash,
    timestamp: new Date(entry.ts).toISOString()
  };
}

function readSealedIndex() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SEALED_PATH, "utf8"));
    return {
      schema: parsed.schema || "OAA_SEALED_MEMORY_INDEX_V1",
      node_id: parsed.node_id || "oaa-api-library",
      sealed: Array.isArray(parsed.sealed) ? parsed.sealed : [],
    };
  } catch {
    return { schema: "OAA_SEALED_MEMORY_INDEX_V1", node_id: "oaa-api-library", sealed: [] };
  }
}

function writeSealedIndex(index) {
  fs.mkdirSync(path.dirname(SEALED_PATH), { recursive: true });
  fs.writeFileSync(SEALED_PATH, JSON.stringify(index, null, 2) + "\n", "utf8");
}

async function main() {
  if (!LEDGER_URL || !LEDGER_TOKEN) {
    console.log("[seal-memory] skip: CIVIC_LEDGER_URL/LEDGER_BASE_URL or token not set");
    process.exit(0);
  }

  let mem;
  try {
    mem = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8"));
  } catch (e) {
    console.error("[seal-memory] cannot read memory:", e.message);
    process.exit(1);
  }

  const notes = Array.isArray(mem.notes) ? mem.notes : [];
  const journal = notes.filter(isOaaMemoryEntry);
  const slice = journal.slice(-LOOKBACK);
  const sealedIndex = readSealedIndex();
  const sealedKeys = new Set(sealedIndex.sealed.map((row) => row && row.idempotency_key).filter(Boolean));

  let ok = 0;
  let skipped = 0;
  let fail = 0;
  const ingestUrl = `${LEDGER_URL}/mesh/ingest`;

  for (const entry of slice) {
    const body = buildBody(entry);
    if (sealedKeys.has(body.idempotency_key)) {
      skipped += 1;
      continue;
    }

    try {
      const res = await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LEDGER_TOKEN}`,
          "X-MNS-Node": "oaa-api-library",
          "Idempotency-Key": body.idempotency_key,
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        ok += 1;
        sealedKeys.add(body.idempotency_key);
        sealedIndex.sealed.unshift({
          idempotency_key: body.idempotency_key,
          source_hash: body.source_hash,
          hash: entry.hash,
          key: entry.data.key,
          cycle: entry.cycle || null,
          sealed_at: new Date().toISOString(),
        });
      } else {
        fail += 1;
        const t = await res.text();
        console.warn(`[seal-memory] ${entry.hash.slice(0, 8)}… HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
    } catch (e) {
      fail += 1;
      console.warn(`[seal-memory] ${entry.hash.slice(0, 8)}…`, e.message);
    }
  }

  sealedIndex.sealed = sealedIndex.sealed.slice(0, 500);
  sealedIndex.updated_at = new Date().toISOString();
  writeSealedIndex(sealedIndex);

  console.log(`[seal-memory] forwarded ${ok}/${slice.length} entries (${skipped} skipped duplicate, ${fail} failed)`);
  process.exit(0);
}

main();

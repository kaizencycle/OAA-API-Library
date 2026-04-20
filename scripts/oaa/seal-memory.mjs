#!/usr/bin/env node
/**
 * C-287 / mesh workflow: forward recent OAA_MEMORY_ENTRY_V1 rows to Civic Core /mesh/ingest.
 * Uses OAA_MEMORY.json on disk (CI checkout). Set CIVIC_LEDGER_URL + CIVIC_LEDGER_TOKEN (or LEDGER_*).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const MEMORY_PATH = process.env.OAA_MEMORY_PATH || path.join(repoRoot, "OAA_MEMORY.json");

const LEDGER_URL = (process.env.CIVIC_LEDGER_URL || process.env.LEDGER_BASE_URL || "").replace(
  /\/$/,
  ""
);
const LEDGER_TOKEN = process.env.CIVIC_LEDGER_TOKEN || process.env.LEDGER_ADMIN_TOKEN || "";
const LOOKBACK = Math.max(1, parseInt(process.env.OAA_SEAL_LOOKBACK || "50", 10) || 50);

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

function buildBody(entry) {
  return {
    type: "OAA_MEMORY_ENTRY_V1",
    agent: entry.agent,
    cycle: entry.cycle,
    key: entry.data.key,
    intent: entry.intent ?? null,
    hash: entry.hash,
    previous_hash: entry.previous_hash,
    timestamp: new Date(entry.ts).toISOString()
  };
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

  let ok = 0;
  let fail = 0;
  const ingestUrl = `${LEDGER_URL}/mesh/ingest`;

  for (const entry of slice) {
    try {
      const res = await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LEDGER_TOKEN}`,
          "X-MNS-Node": "oaa-api-library"
        },
        body: JSON.stringify(buildBody(entry))
      });
      if (res.ok) ok += 1;
      else {
        fail += 1;
        const t = await res.text();
        console.warn(`[seal-memory] ${entry.hash.slice(0, 8)}… HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
    } catch (e) {
      fail += 1;
      console.warn(`[seal-memory] ${entry.hash.slice(0, 8)}…`, e.message);
    }
  }

  console.log(`[seal-memory] forwarded ${ok}/${slice.length} entries (${fail} failed)`);
  // Do not fail the workflow on partial ingest errors (ledger may be down); operators use logs.
  process.exit(0);
}

main();

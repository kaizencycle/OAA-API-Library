import type { OaaMemoryEntry } from "../../types/oaa-kv";

const LEDGER_URL =
  process.env.CIVIC_LEDGER_URL || process.env.LEDGER_BASE_URL || "";
const LEDGER_TOKEN =
  process.env.CIVIC_LEDGER_TOKEN || process.env.LEDGER_ADMIN_TOKEN || "";

export async function sealToLedger(entry: OaaMemoryEntry): Promise<void> {
  if (!LEDGER_URL || !LEDGER_TOKEN) {
    return;
  }

  const base = LEDGER_URL.replace(/\/$/, "");
  const ingestUrl = `${base}/mesh/ingest`;

  await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LEDGER_TOKEN}`,
      "X-MNS-Node": "oaa-api-library"
    },
    body: JSON.stringify({
      type: "OAA_MEMORY_ENTRY_V1",
      agent: entry.agent,
      cycle: entry.cycle,
      key: entry.data.key,
      intent: entry.intent ?? null,
      hash: entry.hash,
      previous_hash: entry.previous_hash,
      timestamp: new Date(entry.ts).toISOString()
    })
  });
}

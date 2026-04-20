import type { OaaMemoryEntry } from "../../types/oaa-kv";

/** Civic Core /mesh/ingest body for OAA journal entries. */
export function buildOaaMemoryIngestBody(entry: OaaMemoryEntry): Record<string, unknown> {
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

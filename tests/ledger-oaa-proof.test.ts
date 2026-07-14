import { describe, expect, it } from "vitest";
import { buildOaaMemoryIngestBody } from "../lib/ledger/oaaProof";
import type { OaaMemoryEntry } from "../types/oaa-kv";

describe("buildOaaMemoryIngestBody", () => {
  it("maps journal entry fields for civic ledger ingest", () => {
    const entry: OaaMemoryEntry = {
      ts: 1_700_000_000_000,
      note: "n",
      tag: "t",
      agent: "ATLAS",
      cycle: "C-371",
      intent: "intent-1",
      data: { key: "GI_STATE", value: { global_integrity: 0.9 } },
      hash: "abc",
      previous_hash: "prev",
      type: "OAA_MEMORY_ENTRY_V1",
    };

    expect(buildOaaMemoryIngestBody(entry)).toEqual({
      type: "OAA_MEMORY_ENTRY_V1",
      agent: "ATLAS",
      cycle: "C-371",
      key: "GI_STATE",
      intent: "intent-1",
      hash: "abc",
      previous_hash: "prev",
      timestamp: new Date(entry.ts).toISOString(),
    });
  });

  it("defaults intent to null when absent", () => {
    const entry: OaaMemoryEntry = {
      ts: 1,
      note: "n",
      tag: "t",
      agent: "A",
      cycle: "C-1",
      data: { key: "k", value: 1 },
      hash: "h",
      previous_hash: null,
      type: "OAA_MEMORY_ENTRY_V1",
    };

    expect(buildOaaMemoryIngestBody(entry).intent).toBeNull();
  });
});

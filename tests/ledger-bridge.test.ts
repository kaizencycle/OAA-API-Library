import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OaaMemoryEntry } from "../types/oaa-kv";

const entry: OaaMemoryEntry = {
  ts: 1,
  note: "n",
  tag: "t",
  agent: "ATLAS",
  cycle: "C-371",
  data: { key: "GI_STATE", value: 1 },
  hash: "hash",
  previous_hash: null,
  type: "OAA_MEMORY_ENTRY_V1",
};

describe("sealToLedger", () => {
  const envKeys = ["CIVIC_LEDGER_URL", "LEDGER_BASE_URL", "CIVIC_LEDGER_TOKEN", "LEDGER_ADMIN_TOKEN"] as const;
  let saved: Record<string, string | undefined>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saved = {};
    for (const key of envKeys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of envKeys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("no-ops when ledger env is missing", async () => {
    const { sealToLedger } = await import("../lib/ledger/bridge");
    await sealToLedger(entry);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts ingest body when ledger env is configured", async () => {
    process.env.CIVIC_LEDGER_URL = "https://ledger.example/";
    process.env.CIVIC_LEDGER_TOKEN = "ledger-token";

    const { sealToLedger } = await import("../lib/ledger/bridge");
    await sealToLedger(entry);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://ledger.example/mesh/ingest",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer ledger-token",
          "X-MNS-Node": "oaa-api-library",
        }),
      })
    );
  });
});

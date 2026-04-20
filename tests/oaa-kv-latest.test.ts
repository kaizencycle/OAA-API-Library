import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getLatestJournalEntriesByKeys } from "../lib/kv/store";

describe("getLatestJournalEntriesByKeys", () => {
  let tmp: string;
  let prev: string | undefined;

  beforeEach(() => {
    tmp = path.join(os.tmpdir(), `oaa-memory-${Date.now()}.json`);
    prev = process.env.OAA_MEMORY_PATH;
    process.env.OAA_MEMORY_PATH = tmp;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.OAA_MEMORY_PATH;
    else process.env.OAA_MEMORY_PATH = prev;
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  });

  it("returns newest entry per key", async () => {
    const mem = {
      version: "v1",
      notes: [
        {
          ts: 100,
          note: "old",
          tag: "t",
          agent: "A",
          cycle: "C-1",
          data: { key: "k1", value: 1 },
          hash: "h1",
          previous_hash: null,
          type: "OAA_MEMORY_ENTRY_V1"
        },
        {
          ts: 200,
          note: "new",
          tag: "t",
          agent: "A",
          cycle: "C-1",
          data: { key: "k1", value: 2 },
          hash: "h2",
          previous_hash: "h1",
          type: "OAA_MEMORY_ENTRY_V1"
        }
      ]
    };
    fs.writeFileSync(tmp, JSON.stringify(mem), "utf8");

    const r = await getLatestJournalEntriesByKeys(["k1", "missing"]);
    expect(r.k1?.data.value).toBe(2);
    expect(r.missing).toBeNull();
  });
});

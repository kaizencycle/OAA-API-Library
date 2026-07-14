import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendMemoryEntry,
  getLatestHash,
  readMemoryEntriesByPrefix,
} from "../lib/kv/store";

describe("kv store journal", () => {
  let tmp: string;
  let prev: string | undefined;

  beforeEach(() => {
    tmp = path.join(os.tmpdir(), `oaa-memory-store-${Date.now()}.json`);
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

  it("appendMemoryEntry hashes and persists entries", async () => {
    const entry = await appendMemoryEntry({
      note: "test",
      tag: "t",
      agent: "ATLAS",
      cycle: "C-371",
      data: { key: "GI_STATE", value: 1 },
      previous_hash: null,
      type: "OAA_MEMORY_ENTRY_V1",
    });

    expect(entry.hash).toMatch(/^[a-f0-9]{64}$/);
    const raw = JSON.parse(fs.readFileSync(tmp, "utf8")) as {
      notes: Array<{ hash: string }>;
    };
    expect(raw.notes).toHaveLength(1);
    expect(raw.notes[0].hash).toBe(entry.hash);
  });

  it("readMemoryEntriesByPrefix filters by key prefix", async () => {
    await appendMemoryEntry({
      note: "a",
      tag: "t",
      agent: "A",
      cycle: "C-1",
      data: { key: "GI_STATE", value: 1 },
      previous_hash: null,
      type: "OAA_MEMORY_ENTRY_V1",
    });
    await appendMemoryEntry({
      note: "b",
      tag: "t",
      agent: "A",
      cycle: "C-1",
      data: { key: "OTHER", value: 2 },
      previous_hash: null,
      type: "OAA_MEMORY_ENTRY_V1",
    });

    const gi = await readMemoryEntriesByPrefix("GI_");
    expect(gi).toHaveLength(1);
    expect(gi[0].data.key).toBe("GI_STATE");
  });

  it("getLatestHash returns most recent journal hash", async () => {
    expect(await getLatestHash()).toBeNull();

    const first = await appendMemoryEntry({
      note: "a",
      tag: "t",
      agent: "A",
      cycle: "C-1",
      data: { key: "k1", value: 1 },
      previous_hash: null,
      type: "OAA_MEMORY_ENTRY_V1",
    });
    const second = await appendMemoryEntry({
      note: "b",
      tag: "t",
      agent: "A",
      cycle: "C-1",
      data: { key: "k2", value: 2 },
      previous_hash: first.hash,
      type: "OAA_MEMORY_ENTRY_V1",
    });

    expect(await getLatestHash()).toBe(second.hash);
  });
});

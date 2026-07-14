import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appendGiBridgeMemoryNote } from "../lib/kv-bridge/giMemoryNote";

describe("appendGiBridgeMemoryNote", () => {
  let tmp: string;
  let prev: string | undefined;

  beforeEach(() => {
    tmp = path.join(os.tmpdir(), `oaa-gi-bridge-${Date.now()}.json`);
    prev = process.env.OAA_MEMORY_PATH;
    process.env.OAA_MEMORY_PATH = tmp;
    fs.writeFileSync(tmp, JSON.stringify({ notes: [] }), "utf8");
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

  it("no-ops for invalid GI payloads", () => {
    appendGiBridgeMemoryNote("bad");
    appendGiBridgeMemoryNote({ mode: "degraded" });
    const mem = JSON.parse(fs.readFileSync(tmp, "utf8")) as { notes: unknown[] };
    expect(mem.notes).toHaveLength(0);
  });

  it("appends bridge note when global_integrity is present", () => {
    appendGiBridgeMemoryNote({ global_integrity: 0.91, mode: "fallback" });
    const mem = JSON.parse(fs.readFileSync(tmp, "utf8")) as {
      notes: Array<{ tag: string; note: string }>;
      updatedAt?: string;
    };
    expect(mem.notes).toHaveLength(1);
    expect(mem.notes[0].tag).toBe("terminal-bridge");
    expect(mem.notes[0].note).toContain("0.91");
    expect(mem.updatedAt).toBeTruthy();
  });
});

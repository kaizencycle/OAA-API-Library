import fs from "fs";
import path from "path";

/**
 * When GI_STATE is mirrored to the bridge, append a short civic note to OAA_MEMORY.json
 * so cycle tracking can observe Terminal health during KV degradation.
 */
export function appendGiBridgeMemoryNote(value: unknown): void {
  if (typeof value !== "object" || value === null) return;

  const gi = (value as Record<string, unknown>).global_integrity;
  const mode = (value as Record<string, unknown>).mode;

  if (gi === null || gi === undefined) return;

  const memPath = process.env.OAA_MEMORY_PATH ?? path.join(process.cwd(), "OAA_MEMORY.json");

  try {
    const raw = fs.readFileSync(memPath, "utf8");
    const mem = JSON.parse(raw) as {
      notes?: Array<Record<string, unknown>>;
      updatedAt?: string;
    };
    mem.notes = mem.notes ?? [];
    mem.notes.push({
      ts: Date.now(),
      note: `Terminal GI bridge: ${String(gi)} (${String(mode ?? "unknown")}) — KV fallback active`,
      tag: "terminal-bridge",
      source: "kv-bridge"
    });
    mem.updatedAt = new Date().toISOString();
    if (mem.notes.length > 200) {
      mem.notes.splice(0, mem.notes.length - 200);
    }
    fs.writeFileSync(memPath, JSON.stringify(mem, null, 2), "utf8");
  } catch {
    /* non-blocking */
  }
}

import fs from "fs/promises";
import path from "path";
import type { OaaMemoryEntry } from "../../types/oaa-kv";
import { canonicalJson } from "../crypto/canonicalJson";
import { sha256Hex } from "../crypto/hmac";

const MEMORY_PATH =
  process.env.OAA_MEMORY_PATH || path.join(process.cwd(), "OAA_MEMORY.json");

type MemoryFile = {
  version?: string;
  updatedAt?: string;
  notes: Array<OaaMemoryEntry | Record<string, unknown>>;
  companions?: string[];
  repos?: string[];
  queue?: { name: string };
  ethics?: { accords: string; epoch: string };
};

async function readMemoryFile(): Promise<MemoryFile> {
  try {
    const raw = await fs.readFile(MEMORY_PATH, "utf8");
    return JSON.parse(raw) as MemoryFile;
  } catch {
    return {
      version: "v1",
      updatedAt: new Date().toISOString(),
      notes: [],
      companions: ["jade", "eve", "zeus", "hermes"],
      repos: ["OAA-API-Library", "gic-gateway-service", "gic-registry-contracts"],
      queue: { name: "publishEvents" },
      ethics: { accords: "Virtue Accords", epoch: "Cycle 0" }
    };
  }
}

async function writeMemoryFile(data: MemoryFile): Promise<void> {
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(MEMORY_PATH, JSON.stringify(data, null, 2), "utf8");
}

function isOaaMemoryEntry(n: unknown): n is OaaMemoryEntry {
  if (!n || typeof n !== "object") return false;
  const o = n as OaaMemoryEntry;
  return (
    o.type === "OAA_MEMORY_ENTRY_V1" &&
    typeof o.hash === "string" &&
    typeof o.ts === "number" &&
    o.data != null &&
    typeof o.data === "object" &&
    typeof (o.data as { key?: string }).key === "string"
  );
}

export async function appendMemoryEntry(
  input: Omit<OaaMemoryEntry, "hash" | "ts">
): Promise<OaaMemoryEntry> {
  const db = await readMemoryFile();
  if (!Array.isArray(db.notes)) {
    db.notes = [];
  }

  const ts = Date.now();
  const preHash: Omit<OaaMemoryEntry, "hash"> = {
    ...input,
    ts
  };

  const hash = sha256Hex(canonicalJson(preHash));

  const entry: OaaMemoryEntry = {
    ...preHash,
    hash
  };

  db.notes.push(entry);
  await writeMemoryFile(db);

  return entry;
}

export async function readMemoryEntriesByPrefix(prefix: string): Promise<OaaMemoryEntry[]> {
  const db = await readMemoryFile();
  const notes = Array.isArray(db.notes) ? db.notes : [];
  return notes.filter((n): n is OaaMemoryEntry => {
    if (!isOaaMemoryEntry(n)) return false;
    if (!prefix) return true;
    return n.data.key.startsWith(prefix);
  });
}

export async function getLatestHash(): Promise<string | null> {
  const db = await readMemoryFile();
  const notes = Array.isArray(db.notes) ? db.notes : [];
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    if (isOaaMemoryEntry(n)) {
      return n.hash;
    }
  }
  return null;
}

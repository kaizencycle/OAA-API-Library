import fs from "fs";
import path from "path";
import type { KvBridgeStore } from "./types";

export function getKvBridgePath(): string {
  return process.env.KV_BRIDGE_PATH ?? path.join(process.cwd(), "data", "kv-bridge.json");
}

export function loadKvBridgeStore(): KvBridgeStore {
  const storePath = getKvBridgePath();
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as KvBridgeStore;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveKvBridgeStore(store: KvBridgeStore): void {
  const storePath = getKvBridgePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

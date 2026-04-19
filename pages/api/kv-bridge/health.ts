import type { NextApiRequest, NextApiResponse } from "next";
import { getKvBridgePath, loadKvBridgeStore } from "../../../lib/kv-bridge/store";
import type { KvBridgeEntry } from "../../../lib/kv-bridge/types";

function isEntry(v: unknown): v is KvBridgeEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as KvBridgeEntry;
  return typeof o.written_at === "string";
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const storePath = getKvBridgePath();
  let storeSize = 0;
  let lastWrite: string | null = null;

  try {
    const store = loadKvBridgeStore();
    storeSize = Object.keys(store).length;
    const times = Object.values(store)
      .filter(isEntry)
      .map((v) => v.written_at)
      .sort();
    lastWrite = times[times.length - 1] ?? null;
  } catch {
    /* empty store */
  }

  return res.status(200).json({
    ok: true,
    schema: "KV_BRIDGE_V1",
    store_path: storePath,
    key_count: storeSize,
    last_write: lastWrite,
    timestamp: new Date().toISOString()
  });
}

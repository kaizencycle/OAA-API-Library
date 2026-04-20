import type { NextApiRequest, NextApiResponse } from "next";
import { getLatestJournalEntriesByKeys } from "../../../lib/kv/store";

const DEFAULT_KEYS = [
  "vault:status",
  "mic:readiness",
  "heartbeat:terminal",
  "GI_STATE",
  "SIGNAL_SNAPSHOT"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const raw = req.query.keys;
  let keys: string[];
  if (typeof raw === "string" && raw.trim()) {
    keys = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  } else {
    keys = [...DEFAULT_KEYS];
  }

  const entries = await getLatestJournalEntriesByKeys(keys);

  return res.status(200).json({
    ok: true,
    schema: "OAA_KV_LATEST_V1",
    keys_requested: keys,
    latest: entries,
    timestamp: new Date().toISOString()
  });
}

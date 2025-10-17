import type { NextApiRequest, NextApiResponse } from "next";
import { readMemory, writeMemory } from "../../../../lib/memory/fileStore";
import { hmacValid } from "../../../../lib/crypto/hmac";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const m = readMemory();
      // optional filter ?q=
      const q = String(req.query.q || "").toLowerCase();
      const notes = q ? (m.notes || []).filter((n: any) => String(n.note).toLowerCase().includes(q)) : (m.notes || []);
      return res.status(200).json({ ok: true, version: m.version || "v1", updatedAt: m.updatedAt, notes });
    }

    if (req.method === "POST") {
      // DEV guard optional; keep route usable in prod with HMAC
      const secret = process.env.MEMORY_HMAC_SECRET || "";
      const provided = (req.headers["x-hmac-sha256"] as string) || "";
      const raw = JSON.stringify(req.body || {});
      if (!hmacValid(raw, secret, provided)) {
        return res.status(401).json({ ok: false, error: "invalid_hmac" });
      }

      const { note, tag } = req.body || {};
      if (!note || typeof note !== "string" || note.trim().length < 3) {
        return res.status(400).json({ ok: false, error: "note_too_short" });
      }
      const m = readMemory();
      m.notes = m.notes || [];
      m.notes.unshift({ note: String(note), tag: tag ? String(tag) : undefined, ts: Date.now() });
      writeMemory(m);
      return res.status(200).json({ ok: true, count: m.notes.length, updatedAt: m.updatedAt });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "memory_api_error" });
  }
}
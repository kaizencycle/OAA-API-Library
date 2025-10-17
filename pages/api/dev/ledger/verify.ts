import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.DEV_MODE !== "1") {
    return res.status(403).json({ ok: false, error: "dev_routes_disabled" });
  }
  const sha = String(req.query.sha || "").trim();
  if (!sha) return res.status(400).json({ ok: false, error: "missing_sha" });

  try {
    const r = await fetch(`${process.env.LEDGER_BASE_URL}/verify?sha=${encodeURIComponent(sha)}`, {
      headers: { authorization: `Bearer ${process.env.LEDGER_ADMIN_TOKEN || ""}` }
    });
    const j = await r.json().catch(()=> ({}));
    if (!r.ok) return res.status(502).json({ ok: false, error: j?.error || "upstream_failed" });
    return res.status(200).json({ ok: true, result: j });
  } catch (e:any) {
    return res.status(500).json({ ok: false, error: e?.message || "verify_error" });
  }
}
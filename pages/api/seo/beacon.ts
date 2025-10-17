import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || req.query.path || "").trim();
  const feedPath = path.join(process.cwd(), "public", "ai-seo", "index.jsonld");
  if (!id || !fs.existsSync(feedPath)) {
    return res.status(200).json({ ok:false, error:"missing_id_or_feed" });
  }
  try {
    const feed = JSON.parse(fs.readFileSync(feedPath,"utf8"));
    const items = Array.isArray(feed?.dataFeedElement) ? feed.dataFeedElement : [];
    // match by id or url ending in the requested path
    const match = items.find((x:any) => x.id === id || (typeof x.url==="string" && (x.url.endsWith(id) || x.url.includes(id))));
    if (!match) return res.status(200).json({ ok:false, error:"not_found" });
    res.setHeader("Content-Type","application/ld+json; charset=utf-8");
    res.setHeader("Cache-Control","no-store");
    return res.status(200).send(JSON.stringify(match,null,2));
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || "beacon_error" });
  }
}

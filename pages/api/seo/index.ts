import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(_req:NextApiRequest, res:NextApiResponse){
  const p = path.join(process.cwd(), "public", "ai-seo", "index.jsonld");
  if (!fs.existsSync(p)) return res.status(200).json({ ok:false, error:"not_generated" });
  res.setHeader("Content-Type","application/ld+json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  return res.status(200).send(fs.readFileSync(p, "utf8"));
}
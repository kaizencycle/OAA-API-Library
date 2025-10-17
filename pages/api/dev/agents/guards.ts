import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type Guard = { enabled:boolean; lastHash:string; noopCount:number; maxNoop:number };
type Cool = { nextAllowedAt:number; cooldownSec:number };

function readJSON<T>(p:string, fallback:T): T {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

export default async function handler(_req:NextApiRequest, res:NextApiResponse){
  if (process.env.DEV_MODE !== "1") {
    return res.status(403).json({ ok:false, error:"dev_routes_disabled" });
  }
  const root = process.cwd();
  const guard = readJSON<Guard>(path.join(root, "dev", "loop_guard.json"), {enabled:false,lastHash:"",noopCount:0,maxNoop:3});
  const cool  = readJSON<Cool >(path.join(root, "dev", "agent_cooldown.json"), {nextAllowedAt:0,cooldownSec:240});

  const now = Math.floor(Date.now()/1000);
  const remainingSec = Math.max(0, (cool.nextAllowedAt||0) - now);
  res.setHeader("Cache-Control","no-store");
  res.status(200).json({ ok:true, guard, cooldown:cool, now, remainingSec });
}

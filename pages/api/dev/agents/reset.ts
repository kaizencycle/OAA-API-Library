import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

function readJSON<T>(p:string, fallback:T): T {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
function writeJSON(p:string, obj:any) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

export default async function handler(req:NextApiRequest, res:NextApiResponse){
  if (process.env.DEV_MODE !== "1") return res.status(403).json({ ok:false, error:"dev_routes_disabled" });
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).json({ ok:false, error:"method_not_allowed" }); }

  // Simple gate: require DEV_SIGN_SECRET in header
  const key = (req.headers["x-dev-key"] as string) || "";
  if (!key || key !== (process.env.DEV_SIGN_SECRET || "")) {
    return res.status(401).json({ ok:false, error:"invalid_dev_key" });
  }

  const root = process.cwd();
  const guardPath = path.join(root, "dev", "loop_guard.json");
  const coolPath  = path.join(root, "dev", "agent_cooldown.json");

  const guard = readJSON(guardPath, { enabled:true, lastHash:"", noopCount:0, maxNoop:3 });
  guard.noopCount = 0;
  guard.lastHash = "";
  writeJSON(guardPath, guard);

  const now = Math.floor(Date.now()/1000);
  const cool = readJSON(coolPath, { nextAllowedAt:0, cooldownSec:240 });
  cool.nextAllowedAt = Math.min(cool.nextAllowedAt, now); // make ready
  writeJSON(coolPath, cool);

  return res.status(200).json({ ok:true, guard, cooldown: cool });
}
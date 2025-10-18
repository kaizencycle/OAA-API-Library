import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAgentGuards } from "../../../../lib/dev/agentsGuard";

export default async function handler(_req:NextApiRequest, res:NextApiResponse){
  if (process.env.DEV_MODE !== "1") {
    return res.status(403).json({ ok:false, error:"dev_routes_disabled" });
  }
  const { smoked, guard, cooldown, now, remainingSec } = ensureAgentGuards(process.cwd());
  res.setHeader("Cache-Control","no-store");
  return res.status(200).json({ ok:true, smoked, guard, cooldown, now, remainingSec });
}

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { readMemory, writeMemory } from "../../../lib/memory/fileStore";
import { sha256hex } from "../../../lib/crypto/sha";

function hmacValid(raw: string, secret: string, provided?: string | null) {
  if (!secret || !provided) return false;
  const sig = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function sealToLedger(sha256: string, meta: { companion: string; cycle: string; }) {
  const base = process.env.LEDGER_BASE_URL!;
  const token = process.env.LEDGER_ADMIN_TOKEN || "";
  const body = { title:`Eve Clock-in ${meta.cycle}`, slug:`clockin-${meta.cycle}`, companion:meta.companion, sha256 };
  const r = await fetch(`${base}/seal`, {
    method:"POST", headers:{ "content-type":"application/json", "authorization":`Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(()=>({}));
  if(!r.ok||!j?.ok) throw new Error(String(j?.error||`seal_failed_${r.status}`));
  return j;
}

/**
 * POST /api/eve/clockin
 * Headers: x-hmac-sha256 signature of raw JSON body
 * Body: { "cycle":"C-108", "companion":"eve", "intent":["..."], "meta":{"tz":"ET"} }
 */
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({ok:false,error:"method_not_allowed"});}
  try{
    const raw = JSON.stringify(req.body||{});
    const okSig = hmacValid(raw,process.env.EVE_HMAC_SECRET||"",req.headers["x-hmac-sha256"] as string);
    if(!okSig) return res.status(401).json({ok:false,error:"invalid_hmac"});
    const { cycle, companion="eve", intent=[], meta={} } = req.body||{};
    if(!cycle) return res.status(400).json({ok:false,error:"missing_cycle"});
    const now=new Date().toISOString();
    const digest=`# Eve Clock-in — ${cycle}\nat: ${now}\nintent:\n${intent.map((i:string)=>`- ${i}`).join("\n")||"- (none)"}`;
    const sha=sha256hex(digest);
    const m=readMemory();
    m.notes.unshift({type:"eve.clockin",cycle,companion,sha256:sha,ts:Date.now(),digest});
    writeMemory(m);
    const seal=await sealToLedger(sha,{companion,cycle});
    return res.status(200).json({ok:true,cycle,sha256:sha,proof:seal.proof,ts:seal.ts||now});
  }catch(e:any){
    return res.status(500).json({ok:false,error:e?.message||"clockin_error"});
  }
}
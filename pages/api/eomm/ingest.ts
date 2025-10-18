import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { readMemory, writeMemory } from "../../../lib/memory/fileStore";
import { sha256hex } from "../../../lib/crypto/sha";

// HMAC verification function
function verifyHmac(sig: string, body: string): boolean {
  const SHARED = process.env.EOMM_INGEST_HMAC_SECRET || "";
  if (!SHARED) return false;
  
  const mac = crypto.createHmac("sha256", SHARED).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig || "", "hex"), Buffer.from(mac, "hex"));
}

// GitHub mode: save to data/eomm/*.json files
async function saveToGitHub(entry: any) {
  const filename = `eomm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
  const content = JSON.stringify(entry, null, 2);
  
  // For now, we'll save to memory and let the CI handle the GitHub push
  // In a real implementation, this would use the GitHub API
  const memory = readMemory();
  if (!memory.eomm) memory.eomm = [];
  memory.eomm.push({
    filename,
    content,
    timestamp: new Date().toISOString(),
    sha256: sha256hex(content)
  });
  writeMemory(memory);
  
  return { filename, sha256: sha256hex(content) };
}

/**
 * POST /api/eomm/ingest
 * Headers: x-eomm-hmac signature of raw JSON body
 * Body: { "title": "C-108 Clock-Out", "timestamp": "...", "agent": "eve", "cycle": "C-108", "content": "...", "tags": [...] }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    // Get raw body for HMAC verification
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    const sig = req.headers["x-eomm-hmac"] as string | undefined;
    
    // Verify HMAC signature
    if (!process.env.EOMM_INGEST_HMAC_SECRET || !sig || !verifyHmac(sig, raw)) {
      return res.status(401).json({ ok: false, error: "bad_signature" });
    }

    const { title, timestamp, agent, cycle, content, tags = [] } = req.body || {};
    
    if (!title || !timestamp || !agent || !cycle) {
      return res.status(400).json({ 
        ok: false, 
        error: "missing_required_fields",
        required: ["title", "timestamp", "agent", "cycle"]
      });
    }

    // Create the entry
    const entry = {
      title,
      timestamp,
      agent,
      cycle,
      content,
      tags,
      id: `eomm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    // Save to GitHub mode (via memory for now)
    const result = await saveToGitHub(entry);

    // Return success with canonical filename and sha256
    return res.status(200).json({
      ok: true,
      filename: result.filename,
      sha256: result.sha256,
      id: entry.id,
      message: "Entry ingested successfully"
    });

  } catch (e: any) {
    console.error("EOMM ingest error:", e);
    return res.status(500).json({ 
      ok: false, 
      error: e?.message || "ingest_error" 
    });
  }
}
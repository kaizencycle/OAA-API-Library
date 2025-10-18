import crypto from "crypto";

const OAA_INGEST = process.env.OAA_INGEST_URL || "http://localhost:3000/api/eomm/ingest";
const SHARED = process.env.EOMM_INGEST_HMAC_SECRET || "";

function sign(body: string): string {
  return crypto.createHmac("sha256", SHARED).update(body).digest("hex");
}

export interface EommEntry {
  title: string;
  timestamp: string;
  agent: string;
  cycle: string;
  content: string | object;
  tags: string[];
}

export async function postEomm(entry: EommEntry): Promise<{ ok: boolean; filename?: string; sha256?: string; id?: string; error?: string }> {
  if (!SHARED) {
    throw new Error("EOMM_INGEST_HMAC_SECRET not configured");
  }

  const body = JSON.stringify(entry);
  const signature = sign(body);

  try {
    const response = await fetch(OAA_INGEST, {
      method: "POST",
      headers: { 
        "content-type": "application/json", 
        "x-eomm-hmac": signature 
      },
      body
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error: any) {
    console.error("Failed to post EOMM entry:", error);
    return { 
      ok: false, 
      error: error.message || "post_failed" 
    };
  }
}

// Helper function to create EOMM entry from Lab7 cycle data
export function createEommEntry(
  cycle: string, 
  kind: "clock-in" | "clock-out", 
  content: string | object,
  agent: string = "eve"
): EommEntry {
  return {
    title: `Cycle ${cycle} ${kind}`,
    timestamp: new Date().toISOString(),
    agent,
    cycle,
    content,
    tags: [kind.toLowerCase(), "reflection"]
  };
}
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs"; 
import path from "path"; 
import crypto from "crypto";

const GH_TOKEN   = process.env.GITHUB_TOKEN || "";
const GH_REPO    = process.env.GITHUB_REPO  || ""; // e.g. "kaizencycle/OAA-API-Library"
const GH_BRANCH  = process.env.GITHUB_BRANCH || "main";
const WRITE_MODE = process.env.EOMM_WRITE_MODE || "disk"; // "disk" | "github"

function validateEntry(entry: any): string[] {
  const errs: string[] = [];
  if (!entry || typeof entry !== "object") { errs.push("not_an_object"); return errs; }
  for (const k of ["title","timestamp","agent","cycle","content"]) {
    if (!entry[k] || String(entry[k]).trim().length === 0) errs.push(`missing_${k}`);
  }
  return errs;
}
function sha256Hex(s: string) { return crypto.createHash("sha256").update(s).digest("hex"); }
function slugify(s: string) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }

async function writeToDisk(relPath: string, body: string) {
  const abs = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
  return abs;
}

async function writeToGitHub(relPath: string, body: string) {
  if (!GH_TOKEN || !GH_REPO) throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO");
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${relPath}`;
  const get = await fetch(`${url}?ref=${encodeURIComponent(GH_BRANCH)}`, { headers: { authorization: `Bearer ${GH_TOKEN}` }});
  const exists = get.ok ? await get.json().catch(()=>null) : null;
  const sha = exists?.sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: { "authorization": `Bearer ${GH_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: `chore(eomm): ingest ${relPath}`,
      content: Buffer.from(body, "utf8").toString("base64"),
      branch: GH_BRANCH,
      sha
    })
  });
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`);
  return relPath;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method_not_allowed" });

  const entry = typeof req.body === "object" ? req.body : (() => { try { return JSON.parse(String(req.body||"{}")); } catch { return null; }})();
  if (!entry) return res.status(200).json({ ok:false, verdict:"quarantine", errors:["invalid_json"] });

  const errors = validateEntry(entry);
  if (errors.length) return res.status(200).json({ ok:false, verdict:"quarantine", errors });

  const sha = sha256Hex(JSON.stringify(entry));
  const ts  = (entry.timestamp || new Date().toISOString()).replace(/[:]/g,"").slice(0,15); // YYYY-MM-DDTHHMM
  const name = `${ts}-${entry.cycle || "C-XXX"}-${slugify(entry.title || "entry")}.json`;
  const relPath = `data/eomm/${name}`;
  const body = JSON.stringify(entry, null, 2);

  try {
    if (WRITE_MODE === "github") {
      await writeToGitHub(relPath, body);
    } else {
      await writeToDisk(relPath, body);
    }
    return res.status(200).json({ ok:true, verdict:"pass", sha256: sha, file: relPath });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: String(e.message || e) });
  }
}
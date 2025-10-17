import { useEffect, useState } from "react";
import DevLayout from "../components/DevLayout";

export default function DevSEO(){
  const [j,setJ]=useState<any>(null); const [err,setErr]=useState<string|null>(null);
  async function load(){
    try{
      const r = await fetch("/api/seo/index", { cache:"no-store" });
      const txt = await r.text();
      try { setJ(JSON.parse(txt)); setErr(null); }
      catch { setErr("not_generated"); setJ(null); }
    }catch(e:any){ setErr(e?.message||"load_failed"); }
  }
  useEffect(()=>{ load(); },[]);
  return (
    <DevLayout>
      <h2>AI SEO — Integrity Feed</h2>
      <p>Publishes <code>public/ai-seo/index.jsonld</code> for machine-native discovery.</p>
      <div style={{display:"flex", gap:8}}>
        <button onClick={load}>Refresh</button>
        <a href="/api/seo/index" target="_blank" rel="noreferrer">Open JSON-LD</a>
      </div>
      {err && <p style={{color:"#ff6a6a"}}>{err === "not_generated" ? "Feed not generated yet — run the workflow or local scripts." : err}</p>}
      {j && <pre style={{background:"#0b1020", padding:12, borderRadius:8}}>{JSON.stringify(j,null,2)}</pre>}
    </DevLayout>
  );
}
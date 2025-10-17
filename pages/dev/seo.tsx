import { useEffect, useState } from "react";
import DevLayout from "../../components/DevLayout";

export default function DevSEO(){
  const [feed,setFeed]=useState<any>(null);
  const [id,setId]=useState<string>("/dev/memory");
  const [beacon,setBeacon]=useState<any>(null);
  const [msg,setMsg]=useState<string>("");

  async function loadFeed(){
    const r = await fetch("/api/seo/index", { cache:"no-store" });
    const t = await r.text();
    try { setFeed(JSON.parse(t)); } catch { setFeed(null); }
  }
  async function loadBeacon(){
    const r = await fetch(`/api/seo/beacon?id=${encodeURIComponent(id)}`, { cache:"no-store" });
    const t = await r.text();
    try { const j = JSON.parse(t); if (j.ok===false) setMsg(j.error); else { setMsg(""); setBeacon(j); } } catch { setMsg("not_generated"); }
  }

  useEffect(()=>{ loadFeed(); },[]);
  return (
    <DevLayout>
      <h2>AI SEO — Integrity Feed & Beacons</h2>
      <div style={{display:"flex", gap:8, marginBottom:10}}>
        <button onClick={loadFeed}>Refresh Feed</button>
        <a href="/api/seo/index" target="_blank" rel="noreferrer">Open Feed JSON-LD</a>
      </div>
      {feed && <pre style={{background:"#0b1020", padding:12, borderRadius:8, maxHeight:320, overflow:"auto"}}>{JSON.stringify(feed,null,2)}</pre>}

      <h3>Beacon Lookup</h3>
      <div style={{display:"flex", gap:8}}>
        <input value={id} onChange={e=>setId(e.target.value)} placeholder="id or path (e.g., /dev/memory)" style={{padding:8, border:"1px solid #1b2440", borderRadius:8, width:"100%"}}/>
        <button onClick={loadBeacon}>Fetch</button>
      </div>
      {msg && <p style={{color:"#ff6a6a"}}>{msg}</p>}
      {beacon && <pre style={{background:"#0b1020", padding:12, borderRadius:8}}>{JSON.stringify(beacon,null,2)}</pre>}
    </DevLayout>
  );
}

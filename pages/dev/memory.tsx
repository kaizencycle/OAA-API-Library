import { useEffect, useState } from "react";
import DevLayout from "../../components/DevLayout";

export default function DevMemory() {
  const [q, setQ] = useState(""); const [list, setList] = useState<any[]>([]);
  const [hmac, setHmac] = useState(""); const [text, setText] = useState("");
  const [meta, setMeta] = useState<{updatedAt?: string}>({});

  async function load() {
    const r = await fetch(`/api/oaa/memory${q ? `?q=${encodeURIComponent(q)}` : ""}`, { cache: "no-store" });
    const j = await r.json(); setList(j.notes || []); setMeta({ updatedAt: j.updatedAt });
  }
  useEffect(() => { load(); }, []); // initial

  async function add() {
    const body = { note: text.trim(), tag: "dev" };
    const r = await fetch("/api/oaa/memory", {
      method: "POST", headers: { "content-type": "application/json", "x-hmac-sha256": hmac },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.ok) { alert(`Add failed: ${j.error}`); return; }
    setText(""); load();
  }

  return (
    <DevLayout>
      <section style={{display:"grid", gap:12}}>
        <h2 style={{margin:"8px 0"}}>Memory (Durable Notes)</h2>
        <div style={{opacity:.8, fontSize:13}}>updatedAt: {meta.updatedAt || "—"}</div>

        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="filter (q)"
            style={{padding:8, border:"1px solid #1b2440", borderRadius:8}} />
          <button onClick={load}>Search</button>
        </div>

        <div style={{padding:12, border:"1px solid #1b2440", borderRadius:8, background:"#0b1020"}}>
          <div style={{fontWeight:700, marginBottom:6}}>Append note</div>
          <input value={hmac} onChange={e=>setHmac(e.target.value)} placeholder="x-hmac-sha256"
            style={{padding:8, width:"100%", border:"1px solid #1b2440", borderRadius:8, marginBottom:8}} />
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="note (min 3 chars)"
            style={{padding:8, width:"100%", minHeight:90, border:"1px solid #1b2440", borderRadius:8}} />
          <div style={{marginTop:8}}><button onClick={add} disabled={!text.trim() || !hmac}>Add</button></div>
          <p style={{opacity:.8, fontSize:12, marginTop:6}}>HMAC is required (see curl below).</p>
        </div>

        <div style={{display:"grid", gap:8}}>
          {list.map((n, i) => (
            <article key={i} style={{padding:12, border:"1px solid #1b2440", borderRadius:8, background:"#0b1020"}}>
              <div style={{opacity:.7, fontSize:12}}>{new Date(n.ts).toLocaleString()} {n.tag ? `• ${n.tag}` : ""}</div>
              <div style={{marginTop:4, whiteSpace:"pre-wrap"}}>{n.note}</div>
            </article>
          ))}
        </div>
      </section>
    </DevLayout>
  );
}
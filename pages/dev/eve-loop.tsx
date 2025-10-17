import { useEffect, useMemo, useState } from "react";
import DevLayout from "../../components/DevLayout";

type Note = { type:string; cycle:string; companion?:string; sha256?:string; ts:number; digest?:string; proof?:string; };

export default function EveLoop(){
  const [mem,setMem]=useState<{notes:Note[];updatedAt?:string}>({notes:[]});
  const [cycle,setCycle]=useState("");
  const [intent,setIntent]=useState("- stabilize queue\n- publish citizen shield UI");
  const [wins,setWins]=useState("- shipped sentinel suite\n- green badge");
  const [blocks,setBlocks]=useState("");
  const [ti,setTi]=useState("- finalize incident digest");
  const [hmacIn,setHmacIn]=useState("");   // x-hmac for clock-in
  const [hmacOut,setHmacOut]=useState(""); // x-hmac for clock-out
  const [busy,setBusy]=useState<string>(""); const [out,setOut]=useState<any>(null);
  const [verifySha,setVerifySha]=useState(""); const [verifyRes,setVerifyRes]=useState<any>(null);

  // Load memory (for cycle detection + recent items)
  async function load() {
    const j = await fetch("/api/oaa/memory?limit=200", { cache:"no-store" }).then(r=>r.json()).catch(()=>({notes:[]}));
    setMem({ notes: j.notes || [], updatedAt: j.updatedAt });
  }
  useEffect(()=>{ load(); },[]);

  // Smart default cycle: max seen number from notes, +1 for next stub / or keep last for out
  const detectedCycle = useMemo(()=>{
    const nums = (mem.notes||[])
      .map(n => n.cycle).filter(Boolean)
      .map(c => Number(String(c).match(/C-(\d+)/)?.[1]||"0"));
    const max = nums.length ? Math.max(...nums) : 0;
    return `C-${Math.max(1, max)}`; // default to current max for Out; you can +1 for future stub
  }, [mem.notes]);

  useEffect(()=>{ if(!cycle) setCycle(detectedCycle); },[detectedCycle, cycle]);

  async function post(path:string, sig:string, body:any) {
    setBusy(path);
    try{
      const r = await fetch(path, { method:"POST", headers:{
        "content-type":"application/json", "x-hmac-sha256": sig
      }, body: JSON.stringify(body)});
      const j = await r.json(); setOut(j);
      if(!j.ok) alert(j.error||"failed");
      await load();
    } finally { setBusy(""); }
  }

  function parseLines(v:string){ return v.split("\n").map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/^\-\s*/, "")); }

  async function doClockIn(){
    const body = {
      cycle: cycle || detectedCycle,
      companion: "eve",
      intent: parseLines(intent),
      meta: { at: new Date().toISOString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "local" }
    };
    await post("/api/eve/clockin", hmacIn, body);
  }
  async function doClockOut(){
    const body = {
      cycle: cycle || detectedCycle,
      companion: "eve",
      wins: parseLines(wins),
      blocks: parseLines(blocks),
      tomorrowIntent: parseLines(ti),
      meta: { at: new Date().toISOString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "local" }
    };
    await post("/api/eve/clockout", hmacOut, body);
  }

  async function verify(){
    const sha = (verifySha || "").trim() || (mem.notes.find(n=>n.type==="eve.clockout")?.sha256 || "");
    if(!sha) { alert("No SHA to verify"); return; }
    const j = await fetch(`/api/dev/ledger/verify?sha=${encodeURIComponent(sha)}`).then(r=>r.json()).catch(()=>null);
    setVerifyRes(j);
  }

  return (
    <DevLayout>
      <section style={{display:"grid", gap:16, maxWidth:980}}>
        <h2 style={{margin:"8px 0"}}>Eve — Daily Loop</h2>
        <div style={{opacity:.8, fontSize:13}}>memory updatedAt: {mem.updatedAt || "—"}</div>

        <div style={{display:"grid", gap:8, gridTemplateColumns:"1fr 1fr"}}>
          {/* Clock-In */}
          <div style={{padding:12, border:"1px solid #1b2440", borderRadius:10, background:"#0b1020"}}>
            <h3 style={{marginTop:0}}>Clock-In</h3>
            <label>Cycle</label>
            <input value={cycle} onChange={e=>setCycle(e.target.value)}
              placeholder="C-108" style={inp}/>
            <label>Intent (one per line)</label>
            <textarea value={intent} onChange={e=>setIntent(e.target.value)} style={ta}/>
            <label>x-hmac-sha256</label>
            <input value={hmacIn} onChange={e=>setHmacIn(e.target.value)} placeholder="signature" style={inp}/>
            <div><button onClick={doClockIn} disabled={!hmacIn || busy!==""} >{busy==="/api/eve/clockin"?"Sealing…":"Seal Clock-In"}</button></div>
          </div>

          {/* Clock-Out */}
          <div style={{padding:12, border:"1px solid #1b2440", borderRadius:10, background:"#0b1020"}}>
            <h3 style={{marginTop:0}}>Clock-Out</h3>
            <label>Cycle</label>
            <input value={cycle} onChange={e=>setCycle(e.target.value)}
              placeholder="C-108" style={inp}/>
            <label>Wins</label>
            <textarea value={wins} onChange={e=>setWins(e.target.value)} style={ta}/>
            <label>Blocks</label>
            <textarea value={blocks} onChange={e=>setBlocks(e.target.value)} style={ta}/>
            <label>Tomorrow Intent</label>
            <textarea value={ti} onChange={e=>setTi(e.target.value)} style={ta}/>
            <label>x-hmac-sha256</label>
            <input value={hmacOut} onChange={e=>setHmacOut(e.target.value)} placeholder="signature" style={inp}/>
            <div><button onClick={doClockOut} disabled={!hmacOut || busy!==""}>{busy==="/api/eve/clockout"?"Sealing…":"Seal Clock-Out"}</button></div>
          </div>
        </div>

        {/* Output from last action */}
        {out && (
          <pre style={{background:"#0b1020", padding:12, borderRadius:8, marginTop:4}}>{JSON.stringify(out,null,2)}</pre>
        )}

        {/* Verify section */}
        <div style={{padding:12, border:"1px solid #1b2440", borderRadius:10, background:"#0b1020"}}>
          <h3 style={{marginTop:0}}>Verify Proof</h3>
          <input value={verifySha} onChange={e=>setVerifySha(e.target.value)} placeholder="sha256 (0x…)"
            style={{...inp, width:"100%"}}/>
          <div style={{marginTop:8, display:"flex", gap:8}}>
            <button onClick={verify}>Verify</button>
            <button onClick={()=>{ setVerifySha(""); setVerifyRes(null); }}>Clear</button>
          </div>
          {verifyRes && (
            <pre style={{background:"#0b1020", padding:12, borderRadius:8, marginTop:8}}>{JSON.stringify(verifyRes, null, 2)}</pre>
          )}
        </div>

        {/* Recent entries */}
        <div>
          <h3 style={{margin:"8px 0"}}>Recent Eve Entries</h3>
          <div style={{display:"grid", gap:8}}>
            {(mem.notes||[]).filter(n=>n.type?.startsWith("eve.")).slice(0,20).map((n,i)=>(
              <article key={i} style={{padding:12, border:"1px solid #1b2440", borderRadius:8, background:"#0b1020"}}>
                <div style={{fontSize:12, opacity:.75}}>
                  {n.type} • {n.cycle} • {new Date(n.ts).toLocaleString()}
                </div>
                <div style={{marginTop:6, whiteSpace:"pre-wrap"}}>{n.digest || "(no digest stored)"}</div>
                {n.sha256 && <div style={{marginTop:6, fontFamily:"monospace"}}>sha256: {n.sha256}</div>}
                {n.proof && <div style={{marginTop:6}}>
                  proof: <a href={n.proof} target="_blank" rel="noreferrer">open</a>
                </div>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </DevLayout>
  );
}

const inp:React.CSSProperties = { padding:8, border:"1px solid #1b2440", borderRadius:8, width:"100%", margin:"4px 0 10px" };
const ta:React.CSSProperties = { ...inp, minHeight:80 };
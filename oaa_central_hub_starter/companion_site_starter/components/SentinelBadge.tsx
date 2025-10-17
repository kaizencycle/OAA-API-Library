import { useEffect, useState } from "react";

type Status = {
  ok: boolean;
  state?: "green" | "amber" | "red";
  run?: { html_url: string; status: string; conclusion: string | null; updated_at: string };
  pr?: { html_url: string; number: number; title: string; head?: string; created_at: string };
  repo?: { owner: string; repo: string; workflow: string };
  ts?: number;
  error?: string;
};

type Vitals = { 
  ok: boolean; 
  state: "green" | "amber" | "red"; 
  depth: number; 
  failRate: number; 
  windowMin: number;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
};

export default function SentinelBadge() {
  const [s, setS] = useState<Status>({ ok: false });
  const [v, setV] = useState<Vitals | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [status, vitals] = await Promise.all([
          fetch("/api/dev/sentinel/status").then(r=>r.json()),
          fetch("/api/dev/sentinel/vitals").then(r=>r.json()).catch(()=>null)
        ]);
        if (!alive) return;
        setS(status);
        if (vitals?.ok) setV(vitals);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // choose the worst state between CI status and runtime vitals
  const rank = (x?: string) => x==="red"?2 : x==="amber"?1 : 0;
  const worst = rank(s.state) >= rank(v?.state) ? s.state : v?.state;
  const color = worst==="green" ? "#1ecb6b" : worst==="red" ? "#ff5a5a" : "#f5b942";

  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 12px",
      border:"1px solid #1b2440",borderRadius:10,background:"#0b1020",color:"#cfe0ff"}}>
      <span style={{width:10,height:10,borderRadius:999,background:color,boxShadow:`0 0 10px ${color}`}}/>
      <strong>Sentinel</strong>
      <span style={{opacity:.85}}>{(worst||"...").toUpperCase()}</span>
      {s.run?.html_url && <a href={s.run.html_url} target="_blank" rel="noreferrer" style={{color:"#9fd1ff"}}>last run</a>}
      {s.pr?.html_url && <a href={s.pr.html_url} target="_blank" rel="noreferrer" style={{color:"#9fd1ff"}}>PR #{s.pr.number}</a>}
      {v && (
        <span style={{opacity:.85}}>
          • depth {v.depth} • fail {(v.failRate*100).toFixed(1)}% / {v.windowMin}m
        </span>
      )}
    </div>
  );
}
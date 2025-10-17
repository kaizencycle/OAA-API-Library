import { useOaaContext } from "../../lib/context/useOaaContext";
import SentinelBadge from "../../components/SentinelBadge";

export default function DevContext() {
  const ctx = useOaaContext();
  
  if (ctx.status === "loading") {
    return (
      <main style={{ maxWidth: 980, margin: "40px auto", padding: "0 20px" }}>
        <h1>OAA Context</h1>
        <p>Loading...</p>
      </main>
    );
  }
  
  if (ctx.status === "error") {
    return (
      <main style={{ maxWidth: 980, margin: "40px auto", padding: "0 20px" }}>
        <h1>OAA Context</h1>
        <p style={{ color: "#ff6a6a" }}>Error: {ctx.error}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", padding: "0 20px" }}>
      <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:16}}>
        <h1>OAA Context</h1>
        <SentinelBadge />
      </div>
      <p>Canonical context data for the OAA system.</p>
      
      <div style={{ marginTop: 20 }}>
        <h2>Raw Context Data</h2>
        <pre style={{ 
          padding: 16, 
          background: "#0b1020", 
          border: "1px solid #1b2440", 
          borderRadius: 8,
          overflow: "auto",
          fontSize: 12
        }}>
          {JSON.stringify(ctx.data, null, 2)}
        </pre>
      </div>
    </main>
  );
}
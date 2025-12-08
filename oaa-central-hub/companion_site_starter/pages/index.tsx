import Link from "next/link";

export default function Home(){
  return (
    <main style={{minHeight:'100vh',background:'#050914',color:'#cfe0ff',display:'grid',placeItems:'center',padding:20}}>
      <div style={{maxWidth:720}}>
        <h1>Companion Site Starter</h1>
        <p>This is your AI companion's home on the web.</p>
        
        <div style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
          <Link href="/jade" style={{
            display:'flex',alignItems:'center',gap:12,
            padding:'16px 20px',
            background:'linear-gradient(135deg, rgba(0,60,40,0.4) 0%, rgba(0,40,30,0.4) 100%)',
            border:'1px solid rgba(0,255,170,0.3)',
            borderRadius:12,
            color:'#00ffaa',
            textDecoration:'none',
            transition:'all 0.2s ease'
          }}>
            <span style={{fontSize:24}}>🌀</span>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>JADE Chamber</div>
              <div style={{fontSize:12,color:'#6a9a8a',marginTop:2}}>Pattern Oracle • Voice & Holographic Interface</div>
            </div>
          </Link>
          
          <Link href="/holo" style={{
            display:'flex',alignItems:'center',gap:12,
            padding:'16px 20px',
            background:'rgba(20,30,50,0.4)',
            border:'1px solid rgba(100,150,255,0.2)',
            borderRadius:12,
            color:'#9fd1ff',
            textDecoration:'none'
          }}>
            <span style={{fontSize:24}}>💎</span>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>Hologram Lab</div>
              <div style={{fontSize:12,color:'#6080a0',marginTop:2}}>3D Memory Visualization</div>
            </div>
          </Link>
          
          <Link href="/civic" style={{
            display:'flex',alignItems:'center',gap:12,
            padding:'16px 20px',
            background:'rgba(20,30,50,0.4)',
            border:'1px solid rgba(100,150,255,0.2)',
            borderRadius:12,
            color:'#9fd1ff',
            textDecoration:'none'
          }}>
            <span style={{fontSize:24}}>🏛️</span>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>Civic Dashboard</div>
              <div style={{fontSize:12,color:'#6080a0',marginTop:2}}>Registry & GIC Status</div>
            </div>
          </Link>
        </div>
        
        <p style={{marginTop:24,fontSize:13,color:'#4a6080'}}>
          API tools: <code style={{color:'#6080a0'}}>/api/tools/ping</code>, <code style={{color:'#6080a0'}}>/api/tools/status</code>, <code style={{color:'#00aa88'}}>/api/jade</code>
        </p>
      </div>
    </main>
  );
}

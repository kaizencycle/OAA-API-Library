import IntegrityBeacon from "../components/IntegrityBeacon";

export default function Home(){
  return (
    <>
      <IntegrityBeacon
        id="home"
        url="/"
        name="OAA Hub"
        description="Open Autonomous Academy — integrity-first AI governance loop."
        keywords={["OAA","AI SEO","GIC","Virtue Accords","Ledger"]}
        oaa={{
          kind: "page",
          gicScore: 0.85,
          accordsScore: 0.92,
          freshnessScore: 0.98,
          integrityScore: 0.91
        }}
      />
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <h1>OAA Hub</h1>
        <p>Welcome to the Open Autonomous Academy — a civic neural network where every repo, API, and agent contributes to collective intelligence.</p>
        
        <h2>Trinity Stack</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ padding: "1rem", border: "1px solid #1b2440", borderRadius: "8px" }}>
            <h3>🧭 SEO</h3>
            <p>Search Engine Optimization makes content visible to AIs and humans.</p>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #1b2440", borderRadius: "8px" }}>
            <h3>🧠 AEO</h3>
            <p>Agentic Engine Optimization teaches agents to self-index and collaborate.</p>
          </div>
          <div style={{ padding: "1rem", border: "1px solid #1b2440", borderRadius: "8px" }}>
            <h3>🌐 GEO</h3>
            <p>Governance Engine Optimization synchronizes rules and ethics across nodes.</p>
          </div>
        </div>

        <h2>Integrity Beacons</h2>
        <p>Every page now emits machine-readable JSON-LD with integrity scores, making the entire OAA constellation discoverable and trustable.</p>
        
        <div style={{ marginTop: "2rem" }}>
          <a href="/dev/seo" style={{ color: "#4a9eff", textDecoration: "none" }}>
            → View SEO Feed & Beacon Tester
          </a>
        </div>
      </div>
    </>
  );
}

# Civic AI Native Stack — Attestation Protocol

**Spec Version:** 0.1.0  
**Last updated:** 2025-10-18  

---

## 1. Definition

An **Attestation** is a verifiable record binding a human, an agent, and a reflection to the Civic Ledger.  
It proves:
- who initiated (identity)
- what occurred (event)
- how it was validated (integrity)
- where it is anchored (GEO)
- why it matters (civic impact)

---

## 2. Data Model (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Cycle C-108 Clock-In",
  "author": "Michael Judan",
  "agent": "eve",
  "dateCreated": "2025-10-18T07:58:00-04:00",
  "text": "Intent: merge beacon validation PRs; start Gate v0; sweep OAA→DVA.",
  "integrityHash": "sha256-…",
  "attestation": { "signer": "oaa_hub", "signature": "sha256-…" },
  "oaa": { "kind": "memory", "cycle": "C-108", "companion": "eve" },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "location": {
    "@type": "AdministrativeArea",
    "name": "New York City, USA"
  },
  "jurisdiction": {
    "@type": "GovernmentOrganization",
    "name": "Civic DAO – Northeast Cluster",
    "code": "US-NE"
  },
  "timezone": "America/New_York"
}
```

---

## 3. Verification Pipeline

1. **Hash Compute** → sha256(JSON.stringify(entry))
2. **Signer Seal** → OAA hub signs the hash with its keypair
3. **Copilot Cross-Check** → verifies that the commit or PR content matches attested data
4. **Ledger Post** → POST /ledger/attest with signature & hash
5. **Public Beacon** → writes to /public/ai-seo/beacons/ for crawlability
6. **Audit Ping** → Integrity Auditor confirms Merkle link & GEO routing

---

## 4. Integrity Levels

| Level | Verification Depth | Description |
|-------|-------------------|-------------|
| 0 | basic hash only | local cache or test entry |
| 1 | human + agent signatures | standard reflection |
| 2 | ledger confirmation | sealed on-chain |
| 3 | cross-domain GEO proof | audited by regional DAO |
| 4 | multi-agent consensus | ASI-grade network integrity |

---

## 5. Governance and Revocation

- **Amendments:** Any entry can be superseded by a new attestation with supersedes = <hash>
- **Revocations:** Issued via /ledger/revoke with proof of error or ethical breach
- **Transparency:** Ledger keeps revoked = true but retains original hash for audit

---

## 6. Example Use Case

A student completes an OAA lesson on AI ethics.
The OAA agent creates a reflection entry, computes its hash, and submits an attestation.
The Civic Ledger records it under the jurisdiction "Education DAO – Global".
The student earns 0.25 GIC for verified integrity participation.

---

**Guiding Quote**

> "Proof of Integrity is the currency of civilization."  
> — Civic AI Manifest v0.1.0
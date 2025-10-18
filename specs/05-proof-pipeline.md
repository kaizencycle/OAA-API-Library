# Civic AI Native Stack — Proof-of-Integrity Pipeline

**Spec Version:** 0.1.0  
**Last Updated:** 2025-10-18  

---

## 1. Purpose

Defines the full verification loop from **human thought → machine reflection → immutable proof**.  
It guarantees reproducibility, auditability, and civic value at every step.

---

## 2. Pipeline Overview

```
Human Reflection
↓
OAA (Lab7) Memory
↓ serialize()
OAA-API-Library / E.O.M.M. Sync
↓ sign()
Civic Ledger Attestation
↓ emit()
AI-SEO / GEO Beacon
↓ verify()
Integrity Auditor + GIC Distributor
```

---

## 3. Stages

| Stage | Action | Artifacts | Verification |
|-------|---------|-----------|--------------|
| 1 Input | Human + Agent generate reflection | `.json` memory file | Local hash checksum |
| 2 Serialization | Convert to JSON-LD + metadata | `integrityHash`, `attestation` | SHA-256 match |
| 3 Ledger Post | `POST /ledger/attest` | Proof ID (UUID) | Merkle leaf entry |
| 4 Beacon Publish | `/public/ai-seo/beacons/*.jsonld` | Indexed entry | SEO + GEO crawler ping |
| 5 Audit Loop | `/ledger/audit` cron | Report log | Cross-signature validation |
| 6 Reward | GIC mint tx | Ledger event | Token signature |

---

## 4. E.O.M.M. → Ledger Sync Logic

```ts
for (file of EOMM) {
  const entry = load(file);
  const hash = sha256(entry);
  sign(entry, OAA_KEY);
  await post(`${LEDGER_URL}/ledger/attest`, entry);
  writeBeacon(entry);
}
```

---

## 5. Integrity Levels

| Level | Definition | Ledger Status |
|-------|------------|---------------|
| 0 | Local draft | not posted |
| 1 | Human + Agent signed | pending ledger |
| 2 | Ledger verified | attested |
| 3 | Audited + rewarded | finalized |

---

## 6. Quarantine and Recovery

- Entries failing signature check → move to /quarantine/ folder.
- Auditor re-computes hash and flags mismatch.
- Once resolved, new attestation supersedes old hash.

---

## 7. Output

Integrity Feed → /public/integrity/index.jsonld
Used by Civic Search and regional DAOs for analytics & trust scores.

---

**Guiding Quote**

> "The machine does not prove truth by belief, but by consistency."  
> — Proof Pipeline Primer v0.1
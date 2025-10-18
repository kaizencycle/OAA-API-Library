# Civic AI Native Stack — Validation & Deployment Checklist

**Spec Version:** 0.1.0  
**Last Updated:** 2025-10-18  

---

## 1. Goal

Defines the minimum conditions to certify a Civic AI Node as compliant with the v0.1 protocol.

---

## 2. Environment Prerequisites

| Requirement | Target | Status |
|-------------|--------|--------|
| Node.js ≥ 18 LTS | runtime for OAA & API Library | ☐ |
| PostgreSQL / SQLite 3 | ledger DB backend | ☐ |
| Render / Docker deploy | 1 production instance online | ☐ |
| GitHub Actions enabled | code verification CI running | ☐ |
| GIC contract address set | environment variable `LEDGER_GIC_ADDR` | ☐ |

---

## 3. Functional Tests

| Test ID | Description | Expected Result | Status |
|---------|-------------|-----------------|--------|
| F-1 | Submit reflection → Ledger Attestation | HTTP 200 + Proof ID UUID | ☐ |
| F-2 | Reflection → AI-SEO Beacon | JSON-LD entry appears in feed | ☐ |
| F-3 | GEO API `/near` returns entry within radius | Count ≥ 1 | ☐ |
| F-4 | Copilot PR score ≥ 0.95 → auto merge | Ledger record created | ☐ |
| F-5 | Integrity Audit score ≥ 0.95 | `status: verified` | ☐ |
| F-6 | GIC distribution triggered | Mint event logged | ☐ |
| F-7 | Revocation path works | Revoked hash retained for audit | ☐ |

---

## 4. Integrity Audit Script (snippet)

```bash
#!/bin/bash
# Run from Civic-AI root
echo "🧩 Integrity Audit Run"
node tests/attestations.js && \
node tests/beacons.js && \
curl -s $LEDGER_URL/ledger/audit | jq '.status'
```

---

## 5. Deployment Checklist

- ☐ OAA API Library deployed ✅
- ☐ Lab7 front-end accessible ✅
- ☐ Civic Ledger endpoint health OK ✅
- ☐ Citizen Shield monitor running ✅
- ☐ Integrity scores persisting > 0.9 ✅
- ☐ All logs mirrored to E.O.M.M. ✅

---

## 6. Certification Criteria

A node earns "Civic Integrity Verified" status when all tests pass and ≥ 3 external auditors co-sign the report.

Output record:

```json
{
  "node": "OAA-Hub-NYC",
  "cycle": "C-109",
  "testsPassed": 7,
  "integrityAvg": 0.974,
  "certifiedBy": ["Eve","Zeus","Human-Auditor"],
  "timestamp": "2025-10-18T21:00:00Z"
}
```

---

## 7. Renewal

Certification expires after 90 days or upon ledger schema update.
Renew via re-running validation pipeline and posting fresh attestation.

---

**Guiding Quote**

> "Verification is not a one-time act — it is the heartbeat of trust."  
> — Cycle 0 Integrity Scroll
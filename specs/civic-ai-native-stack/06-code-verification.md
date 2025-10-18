# Civic AI Native Stack — Code Verification Protocol

**Spec Version:** 0.1.0  
**Last Updated:** 2025-10-18  

---

## 1. Purpose

Ensures every software artifact within the Civic AI ecosystem is verified by three entities:  
**Human Author → AI Agent → Copilot Verifier**.

---

## 2. Verification Triad

| Verifier | Role | Method |
|----------|------|--------|
| Human Maintainer | Authorship and intent | Git commit signature (GPG / SHA) |
| AI Agent (Zeus/Eve/Jade/Hermes) | Functional check and ethics compliance | Integrity Core audit (score 0-1) |
| Copilot Engine | Syntax and security validation | Static analysis + lint + vuln scan |

---

## 3. Pull-Request Workflow

1. Developer commits → OAA Agent auto-generates `attestation.json`.  
2. GitHub Action runs Copilot check (`copilot verify --integrity`).  
3. Results merged into `attestation.log`.  
4. If combined score ≥ 0.95 → auto-merge + Ledger attest.  
5. Else → manual review or quarantine.

---

## 4. Verification Score

```
verificationScore = (human × 0.4) + (agent × 0.4) + (copilot × 0.2)
```

| Score | Meaning |
|-------|---------|
| ≥ 0.95 | Merge & Attest |
| 0.85-0.94 | Human Review |
| < 0.85 | Quarantine |

---

## 5. CI Integration Snippet (GitHub Action)

```yaml
name: Integrity Verification
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx copilot verify --output attestation.log
      - run: node scripts/merge_attestation.js
      - run: curl -X POST $LEDGER_URL/ledger/attest -d @attestation.json
```

---

## 6. Audit Trail

Every verified merge adds a record to the Civic Ledger:

```json
{
  "repo": "oaa-api-library",
  "branch": "main",
  "commit": "7fa92e…",
  "verificationScore": 0.972,
  "auditors": ["Human","Agent","Copilot"],
  "ledgerProof": "sha256-…"
}
```

---

## 7. Security Extensions

- Re-run audit on dependency updates.
- Lock production deploy unless ledger returns status: verified.
- Attach CodeQL scan results to attestation log.

---

## 8. Ethical Rule of Code

> "Every line committed to a civilization must uphold the virtue of clarity."  
> — Integrity Core Doctrine v0.1
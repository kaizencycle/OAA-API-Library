---
epicon_id: EPICON_C-371_INFRA_oaa-repo-modernization_v1
title: "OAA Repo Modernization — Dependencies and Structure"
author_name: "Michael Judan (custodian), drafted with Claude"
cycle: "C-371"
status: "intent"
target_repo: "kaizencycle/OAA-API-Library"
created_at: "2026-07-13T20:00:00Z"
version: 1
summary: "Bounded maintenance intent for OAA-API-Library dependency updates, doc consolidation, and hygiene. Excludes identity mechanism and agent-hub Phase 1/2/3 work."
---

# EPICON C-371 — OAA Repo Modernization (Maintenance)

**Handoff:** [`HANDOFF_C-371_OAA_repo-modernization.md`](./HANDOFF_C-371_OAA_repo-modernization.md)

---

## EPICON-02 INTENT PUBLICATION

```intent
epicon_id: EPICON_C-371_INFRA_oaa-repo-modernization_v1
ledger_id: mobius:kaizencycle
scope: infra
mode: normal
issued_at: 2026-07-13T20:00:00Z
expires_at: 2026-10-13T20:00:00Z
justification:
  VALUES INVOKED: integrity, maintainability, non-fabrication
  REASONING: package.json inspection found Anthropic SDK ~86 minor versions behind mobius-civic-ai-terminal, legacy aws-sdk v2, likely-accidental npm crypto package, dual test runners, root doc sprawl, and GIC terminology in package metadata. Repo health matters more as Phase 1 extends agent-hub role from 4 to 10 Sentinels.
  ANCHORS:
    - package.json
    - docs/epicon/cycles/C-371/EPICON_C-371_OAA_agent-identity-phase1_v1.md
    - docs/epicon/cycles/C-371/HANDOFF_C-371_CPC_OAA_identity_reconciliation.md
    - HANDOFF_C-371_OAA_repo-modernization.md
  BOUNDARIES: Dependency updates and structural/doc reorganization only. No HMAC/identity mechanism changes, no OAA agent-hub Phase 1/2/3 implementation, no render.yaml topology changes.
  COUNTERFACTUAL: If Anthropic SDK 0.9 to 0.95 requires non-trivial code changes, scope as follow-up PR rather than blocking other cleanup items.
counterfactuals:
  - If aws-sdk v2 usage is load-bearing and migration is non-trivial, defer v2-to-v3 to its own task.
  - If dual jest/vitest exists for undocumented reasons, flag for custodian decision before picking one runner.
  - If OAA_MEMORY.json flat-file design is confirmed still suitable, close architecture item as no action needed.
```

---

## Acceptance criteria

- [x] `@anthropic-ai/sdk` bumped or breaking-change follow-up filed with rationale
- [x] Accidental `crypto` npm dependency removed if grep confirms unused
- [x] GIC → MIC sweep in docs and `package.json` keywords (where applicable)
- [x] No identity-mechanism or Phase 1/2/3 scope creep in modernization PRs
- [x] Doc consolidation PR or filed deferral with custodian ack
- [x] jest/vitest decision documented before runner consolidation

See [`MODERNIZATION_DECISIONS_C-371.md`](./MODERNIZATION_DECISIONS_C-371.md) for implementation evidence.

---

*"We heal as we walk." — Mobius Systems*

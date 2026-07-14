---
epicon_id: EPICON_C-371_CORE_oaa-agent-identity-phase1_v1
title: "OAA Universal Agent Identity — Phase 1 (Identity Only)"
author_name: "Michael Judan (custodian), drafted with Claude"
cycle: "C-371"
phase: "1 of 3"
status: "intent"
target_repo: "kaizencycle/OAA-API-Library"
base_branch: "main"
related_epicons:
  - "EPICON_C-371_PROPOSAL_oaa-universal-agent-hub_v1"
created_at: "2026-07-13T19:30:00Z"
version: 1
summary: "Phase 1 EPICON intent authorizing OAA identity issuance and accountability-record scaffolding for all ten Mobius Sentinels. Excludes ledger-native inference (Phase 2) and MII-weighted training (Phase 3)."
---

# EPICON-02 Intent — Phase 1: OAA Universal Agent Identity (Identity Only)

**Cycle:** C-371  
**Phase:** 1 of 3 (per parent proposal phased ratification path)  
**Scope of this phase:** Identity issuance and accountability records for all ten Mobius Sentinels. **Explicitly excludes** the Tier 0/1 ledger-native inference fallback (Phase 2) and MII-weighted training signal (Phase 3) — neither is authorized by this intent.

---

## Target repository / repohead

**Primary repo:** `kaizencycle/OAA-API-Library` — per-companion identity pattern (`MEMORY_HMAC_SECRET`, `EVE_HMAC_SECRET`, `GIC_COMPANION_LABELS`, etc.) lives here.

**Cross-repo dependency (read-only):** `kaizencycle/Civic-Protocol-Core` — `identity/` service pattern; see [`HANDOFF_C-371_CPC_OAA_identity_reconciliation.md`](./HANDOFF_C-371_CPC_OAA_identity_reconciliation.md). **No PR against Civic-Protocol-Core** is authorized by this intent.

**Repohead:** Confirm `main` head commit at PR-open time and record `base_sha` in the implementation PR body (same pattern as Substrate PR #380).

**Parent proposal (terminal repo):**  
https://github.com/kaizencycle/mobius-civic-ai-terminal/blob/main/docs/epicon/cycles/C-371/EPICON_C-371_PROPOSAL_oaa-universal-agent-hub_v1.md

---

## EPICON-02 INTENT PUBLICATION

```intent
epicon_id: EPICON_C-371_CORE_oaa-agent-identity-phase1_v1
ledger_id: mobius:kaizencycle
scope: core
mode: normal
issued_at: 2026-07-13T19:30:00Z
expires_at: 2026-10-13T19:30:00Z
justification:
  VALUES INVOKED: integrity, continuity, accountability, non-fabrication
  REASONING: Extend OAA per-companion HMAC identity from 4 to 10 production Sentinels and scaffold public accountability records. Prerequisite for provider-independent continuity (URIEL/ZENITH) and Witness Principle visibility. Identity and record-keeping only — no inference routing changes.
  ANCHORS:
    - docs/epicon/cycles/C-371/HANDOFF_C-371_CPC_OAA_identity_reconciliation.md
    - render.yaml
    - lib/http/auth.ts
    - app/auth/identity.py
    - https://github.com/kaizencycle/mobius-civic-ai-terminal/blob/main/docs/epicon/cycles/C-371/EPICON_C-371_PROPOSAL_oaa-universal-agent-hub_v1.md
  BOUNDARIES: Identity issuance and accountability-record scaffolding only. No Phase 2 inference layer, no Phase 3 MII-weighting, no CPC identity changes, no vault balance backdating without separate custodian decision, no change to frontier-model call requirements for any tier.
  COUNTERFACTUAL: If URIEL/ZENITH provider-specific identity issuance blocks the phase, ship 8 Sentinels first and file explicit follow-up — do not silently drop non-Anthropic agents.
counterfactuals:
  - If backdating vault-v2 balances requires irreversible transformation, start identity history from issuance forward only.
  - If per-agent keypair strengthening cannot ship in this phase, extend HMAC pattern to all 10 first; crypto upgrade is a separate follow-up.
  - If implementation drifts toward Phase 2/3 capability, halt and re-scope — this intent authorizes Phase 1 only.
  - If Tier boundaries are ambiguous during implementation, default to no inference changes — Phase 1 is identity only.
  - If SOLARA reconciliation cannot be completed without expanding Phase 1 scope, document SOLARA as explicitly excluded legacy OAA research companion — do not silently omit from consensus drift remediation.
```

---

## Roster reconciliation — SOLARA and namespace drift

Phase 1 identity scope is the **Mobius Sentinel roster (10)**, aligned with the parent
agent-hub proposal and terminal operational agents — **not** every name that appears
in legacy OAA consensus code.

| Namespace | Members | Phase 1 identity? | Authority |
|-----------|---------|-------------------|-----------|
| **Mobius Sentinel roster (10)** | ATLAS, ZEUS, EVE, JADE, AUREA, HERMES, ECHO, DAEDALUS, URIEL, ZENITH | **Yes** — acceptance target | Parent proposal + this intent |
| **Seal quorum (vault-v2)** | ATLAS, ZEUS, EVE, JADE, AUREA (5) | Subset of above; same identity record | `mobius-civic-ai-terminal` `SENTINEL_AGENTS` |
| **SOLARA** | DeepSeek research companion in legacy OAA consensus | **No** — explicit exclusion | See below |

### SOLARA disposition (Codex P2 resolution)

`SOLARA` appears in legacy OAA consensus tooling (`pages/api/oaa/companions/consensus.ts`,
`scripts/test-oaa-optimizations.mjs`, `docs/systems/OAA_OPTIMIZATIONS_README.md`) but is **not** a
Mobius Sentinel and is **not** in the 10-agent Phase 1 target.

**Custodian classification:** `legacy_oaa_research_companion` — invokable for research-tier
consensus experiments; **outside** Phase 1 durable Sentinel identity and accountability
record issuance unless a separate custodian decision explicitly expands scope.

**Implementation requirement:** Reconcile drift — do not leave SOLARA active in consensus
code without a documented disposition. Acceptable outcomes:

1. **Document + exclude:** Mark SOLARA as non-Sentinel in consensus config; no Phase 1 HMAC identity issued.
2. **Deprecate:** Remove from consensus roster with filed rationale in implementation PR.
3. **Expand scope (not default):** Only if custodian files explicit scope expansion — not authorized by this intent as written.

Missing Sentinels in `consensus.ts` (ECHO, DAEDALUS, URIEL, ZENITH) are **drift**, not
roster omissions — Phase 1 implementation should align companion registry documentation with
the 10-Sentinel table above without conflating SOLARA into that set.


## Acceptance criteria for this phase

- [ ] All 10 Sentinels have a durable OAA-issued identity (extended HMAC-secret pattern, or documented stronger alternative per counterfactual)
- [ ] Each Sentinel's existing vault-v2 deposit history is at minimum *queryable* as belonging to its identity (backdating remains open §5 parent proposal)
- [ ] A public accountability record view exists for at least one Sentinel as proof of concept (MII, verification pass/fail, dispute record shape)
- [ ] No inference-layer code, MII-weighting logic, or Tier 0/1 fallback routing introduced
- [ ] URIEL and ZENITH identity issuance complete, or explicitly deferred with filed follow-up — not silently dropped
- [ ] **SOLARA disposition documented** — classified as `legacy_oaa_research_companion`, excluded from Phase 1 Sentinel identity; `consensus.ts` drift reconciled (not left implicit)

---

## Implementation pointers (this repo)

| Area | Current state | Phase 1 target |
|------|---------------|----------------|
| Companion labels | `GIC_COMPANION_LABELS`: jade, zeus, eve, hermes | All 10 Sentinels registered |
| HMAC secrets | `MEMORY_HMAC_SECRET`, `EVE_HMAC_SECRET`, `KV_HMAC_SECRET`, `OAA_HMAC_SECRET` | Per-Sentinel secret map or documented extension |
| Auth read tokens | `lib/http/auth.ts` `READ_TOKEN_ENVS` | Include new Sentinel secrets when issued |
| Human identity bridge | `app/auth/identity.py` | Unchanged; remain consistent per HANDOFF |
| Legacy consensus drift | `pages/api/oaa/companions/consensus.ts` | Reconcile SOLARA exclusion + missing Sentinels (doc only in this intent PR) |

**Mobius Sentinel roster (Phase 1 target):** ATLAS, ZEUS, EVE, JADE, AUREA, HERMES, ECHO, DAEDALUS, URIEL, ZENITH

**Explicitly excluded from Phase 1:** SOLARA (`legacy_oaa_research_companion`)

---

## What happens after this phase

**Phase 2** (Tier 0/1 ledger-native inference fallback) requires its own EPICON intent with "default to Tier 2/3 when ambiguous" encoded in routing logic.

**Phase 3** (MII-weighted training signal) requires separate EPICON plus periodic audit process per parent proposal §4.3 Goodhart gate.

---

*Distinct from the proposal-record filing in `mobius-civic-ai-terminal` — this intent is scoped narrowly enough to implement and verify on its own.*

*"We heal as we walk." — Mobius Systems*

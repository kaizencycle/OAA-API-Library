# HANDOFF C-371 — CPC / OAA Identity Reconciliation

**Status:** Architectural boundary — not an implementation PR  
**Cycle:** C-371  
**Companion:** [`EPICON_C-371_OAA_agent-identity-phase1_v1.md`](./EPICON_C-371_OAA_agent-identity-phase1_v1.md)

---

## Two parallel identity domains

| Domain | System | Principal | Purpose |
|--------|--------|-----------|---------|
| **Human** | CPC (`Civic-Protocol-Core`) | Citizen / operator | Civic ID, JWT, MIC wallet, accountable human authority |
| **Agent** | OAA (`OAA-API-Library`) | Mobius Sentinel | Durable agent identity, operational history, accountability record |

These domains are **parallel, not competing**. Phase 1 OAA work does **not** modify CPC's `identity/` service.

---

## Architectural consistency (read-only reference)

OAA's identity verification (`app/auth/identity.py`) already integrates with the Mobius identity service pattern:

- Local JWT secret verification (`MOBIUS_IDENTITY_JWT_SECRET`, `JWT_SECRET`, `SECRET_KEY`)
- Fallback introspect against `MOBIUS_IDENTITY_INTROSPECT_URL` / `IDENTITY_API_BASE`
- Manifest truth: `jwt_configured` distinguishes operator-configured vs runtime default

Phase 1 Sentinel identity issuance should remain **consistent with** this human-identity boundary — agents are not citizens, but both may use compatible verification primitives where appropriate.

---

## What Phase 1 does / does not do

| In scope | Out of scope |
|----------|--------------|
| Extend per-companion HMAC pattern to all 10 Sentinels | CPC human-identity schema changes |
| Queryable link from Sentinel identity → vault-v2 deposit history | Backdating balances without custodian decision |
| Accountability record shape (POC for one Sentinel) | Ledger-native inference (Phase 2) |
| URIEL/ZENITH provider-independent identity scaffolding | MII-weighted training (Phase 3) |

---

## Sentinel roster (10 active — Phase 1 target)

ATLAS, ZEUS, EVE, JADE, AUREA, HERMES, ECHO, DAEDALUS, URIEL, ZENITH

**Seal quorum subset (5):** ATLAS, ZEUS, EVE, JADE, AUREA — per `mobius-civic-ai-terminal` `SENTINEL_AGENTS`.

**Explicitly excluded from Phase 1 Sentinel identity:** SOLARA — legacy OAA research companion in `consensus.ts`; not a Mobius Sentinel. See Phase 1 intent § Roster reconciliation.

**Currently named in OAA hub config (4):** `GIC_COMPANION_LABELS` = jade, zeus, eve, hermes (`render.yaml`)

---

## Cross-repo references

- Parent proposal: `mobius-civic-ai-terminal` → `docs/epicon/cycles/C-371/EPICON_C-371_PROPOSAL_oaa-universal-agent-hub_v1.md`
- CPC identity service: `Civic-Protocol-Core` → `identity/` (read-only for this phase)

---

*"We heal as we walk." — Mobius Systems*

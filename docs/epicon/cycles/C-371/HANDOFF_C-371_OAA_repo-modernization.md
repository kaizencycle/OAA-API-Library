# Handoff — OAA-API-Library Organization & Dependency Modernization

**To:** ATLAS  
**From:** Michael Judan (custodian)  
**Cycle:** C-371  
**Repo:** `kaizencycle/OAA-API-Library`  
**Type:** Bounded maintenance task — dependency updates + structural cleanup  
**Related:** [`EPICON_C-371_OAA_agent-identity-phase1_v1.md`](./EPICON_C-371_OAA_agent-identity-phase1_v1.md) (PR #54) — independent of Phase 1 identity work; can proceed in parallel. Phase 1's expansion to 10 agents is part of why repo health now matters more than at 4-companion scale.

---

## 1. Scope and boundaries

Maintenance/hygiene task — not feature or identity-architecture change.

**Explicitly out of scope:** OAA agent-hub Phase 1/2/3 implementation, `render.yaml` service topology changes, HMAC/identity mechanism changes.

---

## 2. Dependency findings (from direct `package.json` inspection)

### Priority 1 — likely blocking better agent behavior

- **`@anthropic-ai/sdk: ^0.9.0`** — critically stale. `mobius-civic-ai-terminal` runs `@anthropic-ai/sdk@0.95.1`, ~86 minor versions ahead. OAA is the Sentinel/agent hub — this gap likely means missing API surface, tool-use behavior, and model support. **Bump first** — check breaking changes across 0.9→0.95 before blind merge.

### Priority 2 — legacy/deprecated

- **`aws-sdk: ^2.1500.0`** — v2 maintenance mode; v3 is active line. Grep for load-bearing usage before migrate vs. dead dependency.
- **`"crypto": "^1.0.1"`** — likely accidental npm package shadowing Node built-in `crypto`. Grep imports; remove from `package.json` if unused.

### Priority 3 — routine currency

- `typescript ^5.0.0` → toward terminal's `5.9.3`
- `eslint ^8.0.0` → ESLint 9 is a real config migration, not trivial
- `prisma ^5.7.0` → verify current major

### Priority 4 — structural decision needed

- **Both `jest` and `vitest` configured** — pick one runner or document why both exist (in-progress migration). Do not leave implicit.

---

## 3. Structural / organizational findings

### 3.1 Root-level doc sprawl

Substantial docs at repo root should consolidate into `docs/` (pattern established by `docs/epicon/cycles/C-371/`):

```text
docs/
  epicon/cycles/          # established
  systems/                # AGENT_LOOP_GUARD, BEACON, CITATION, EOMM, JADE
  deployment/             # RENDER_DEPLOYMENT, COPILOT_VERIFICATION
```

Keep `README.md` at root.

### 3.2 `OAA_MEMORY.json` at repo root

Confirm flat JSON file remains suitable at 10-agent scale (write frequency, merge conflicts) before Phase 1 increases write volume. Decision point — may close as "confirmed, no action."

### 3.3 `founder:generate` script

`scripts/generate-founder-wallet.ts` — confirm not hooked to `postinstall`/`predev`/`prestart` (currently isn't) and access is documented.

### 3.4 Terminology: GIC → MIC

`"gic"` in `package.json` `keywords` — sweep docs + metadata in same cleanup pass (low-risk).

---

## 4. Suggested execution order

1. `@anthropic-ai/sdk` bump (P1) — check breaking changes first
2. `crypto` npm package removal if unused (trivial)
3. GIC → MIC sweep (docs + `package.json` keywords)
4. Doc consolidation into `docs/` (own PR OK)
5. `aws-sdk` v2→v3 — separate scoped task after usage confirmed
6. jest vs vitest — custodian decision if reason not in git history
7. `OAA_MEMORY.json` architecture confirmation — before Phase 1 write volume increases

---

## 5. EPICON Intent (maintenance-scoped)

See [`EPICON_C-371_INFRA_oaa-repo-modernization_v1.md`](./EPICON_C-371_INFRA_oaa-repo-modernization_v1.md) for guard-compliant intent block.

---

*Priority 1 and trivial items can ship fast. P4/P5 items need investigation or custodian decision — don't block fast wins.*

*"We heal as we walk." — Mobius Systems*

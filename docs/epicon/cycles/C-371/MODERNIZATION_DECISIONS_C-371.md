# C-371 OAA Repo Modernization — Implementation Decisions

**Cycle:** C-371  
**Repo:** `kaizencycle/OAA-API-Library`  
**Intent:** [`EPICON_C-371_INFRA_oaa-repo-modernization_v1.md`](./EPICON_C-371_INFRA_oaa-repo-modernization_v1.md)  
**Status:** Fast wins shipped; deferred items documented below.

---

## Shipped in this PR

| Item | Decision | Evidence |
|------|----------|----------|
| `@anthropic-ai/sdk` | Bumped `^0.9.0` → `^0.95.1` (parity with `mobius-civic-ai-terminal`) | No SDK imports in codebase — Anthropic calls use raw `fetch()` in `pages/api/inquiry/chat.ts` and `pages/api/oaa/companions/consensus.ts`. Bump is dependency hygiene only; no code changes required. |
| npm `crypto` package | **Removed** | All `crypto` imports resolve to Node built-in (`lib/crypto/hmac.ts`, `lib/http/auth.ts`, `scripts/generate-founder-wallet.ts`). Zero npm `crypto` imports. |
| `aws-sdk` v2 | **Removed from root `package.json`** | Grep found zero `aws-sdk` v2 imports. `src/packs/voice-polly` uses `@aws-sdk/client-polly` (v3) separately. v2 was a dead root dependency. |
| GIC → MIC (metadata) | `package.json` keyword `gic` → `mic` | Legacy `gic-indexer/` subsystem names unchanged — separate scoped rename if custodian wants full subsystem migration. |
| Doc consolidation | Root system/deployment docs moved to `docs/systems/` and `docs/deployment/` | See directory listing in PR. `README.md` stays at root. |
| Test runner | **Consolidated to Vitest** | All 3 test files live under `tests/` and run via Vitest (`vitest.config.ts`). Jest had zero test files and no `jest.config`. `npm test` now runs `vitest run`. Jest, `@types/jest`, and `ts-jest` removed. |
| TypeScript | Bumped `^5.0.0` → `^5.9.3` | Routine currency toward terminal parity. |

---

## Deferred — no action in this PR

### ESLint 8 → 9

ESLint 9 requires flat config migration. Out of scope for this bounded pass — file separate intent if custodian wants it.

### Prisma major

`^5.7.0` is current within Prisma 5 line. No bump needed now.

### `gic-indexer/` subsystem rename

Historical GIC naming persists in `gic-indexer/`, `src/gic/`, and specs. CPC rename to MIC applies to package metadata and new docs; full subsystem rename is a larger scoped task.

---

## Architecture confirmations

### `OAA_MEMORY.json` flat-file store

**Confirmed suitable for Phase 1.** The file is the intentional durable memory store (`lib/kv/store.ts`, `lib/kv-bridge/giMemoryNote.ts`, `pages/api/oaa/memory.ts`, `mobius.yaml`). At 10-agent scale:

- Write path is append-only with HMAC-gated POST
- Concurrent write conflicts are possible but manageable at current frequency
- Phase 1 identity work increases agent count, not necessarily write frequency per agent

**Monitor:** If merge conflicts or file-size growth become operational issues post-Phase-1, file a follow-up intent for KV-backed memory or per-agent shard files. No architecture change required now.

### `founder:generate` script

**Confirmed appropriately gated.**

- Exposed only as explicit `npm run founder:generate` — not hooked to `postinstall`, `predev`, or `prestart`
- Script header documents one-time local use, paper-key storage, and abort-on-existing-founder guard
- No change needed

---

*"We heal as we walk." — Mobius Systems*

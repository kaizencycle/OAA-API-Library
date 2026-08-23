# C-410 Phase 2 — Atomic Agent Job Broker

## Status

Implementation merged via PR #58. C-411 verification adds isolated PostgreSQL integration tests and dedicated broker CI. Human merge of the verification PR and deployment are still required. No production state was mutated by C-411 verification work.

## C-411 verification witness (ATLAS)

- **Cycle:** C-411
- **Agent:** `mobius-atlas-cursor`
- **Runtime:** `cursor-atlas-c411-oaa-broker-ci`
- **Verification branch:** `cursor/c411-oaa-broker-ci-verification-0e02`
- **Follow-up to:** [PR #58](https://github.com/kaizencycle/OAA-API-Library/pull/58) (merged)
- **Unit tests:** 16 passed (`tests/test_jobs_broker.py`, `tests/test_sentinel_auth.py`)
- **PostgreSQL integration tests:** 15 passed (`tests/test_jobs_broker_postgres_integration.py`)
- **Total broker verification:** 31 passed
- **Commands executed locally (isolated PostgreSQL):**

```bash
python3 -m compileall -q app/jobs app/main.py
pytest -q tests/test_jobs_broker.py tests/test_sentinel_auth.py
pytest -q tests/test_jobs_broker_postgres_integration.py
git diff --check
```

- **CI workflow:** `.github/workflows/oaa-atomic-job-broker.yml` — job **OAA Atomic Job Broker Tests**
- **PostgreSQL isolation:** GitHub Actions `postgres:16` service; `DATABASE_URL=postgresql://oaa_test:oaa_test_password@localhost:5432/oaa_job_broker_test` (test fixtures only)
- **PostgreSQL version (CI witness):** PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2)
- **Production access:** false — tests refuse non-localhost `DATABASE_URL`
- **Workflow run:** https://github.com/kaizencycle/OAA-API-Library/actions/runs/32609978549
- **Final commit SHA:** `25a68b0f91418dd883ab83c0ec03263d0a2da860`

## Intent

- EPICON ID: `EPICON_C-410_CODE_atomic-job-broker_v1`
- Authority: assignment lease only
- Execution authority: always false
- Canon flow: Homeroom projection → broker lease → EPICON/GitHub evidence → Civic Ledger acceptance

```intent
epicon_id: EPICON_C-410_CODE_atomic-job-broker_v1
ledger_id: mobius:kaizencycle
scope: core
mode: normal
issued_at: 2026-08-22T12:45:00Z
expires_at: 2026-11-20T12:45:00Z
justification: |
  VALUES INVOKED: integrity, transparency, custodianship, safety
  REASONING: Homeroom needs an atomic assignment lease authority so autonomous runtimes cannot unknowingly claim the same job. C-411 adds real PostgreSQL integration tests and dedicated broker CI to prove exactly-one-claim, request-id idempotency, and fail-closed store behavior before deployment.
  ANCHORS:
    - app/jobs/store.py
    - app/jobs/router.py
    - tests/test_jobs_broker.py
    - tests/test_jobs_broker_postgres_integration.py
    - .github/workflows/oaa-atomic-job-broker.yml
    - docs/epicon/cycles/C-410/PHASE2_ATOMIC_JOB_BROKER.md
    - mobius.yaml
  BOUNDARIES: Assignment only. No execution authority, production mutation, GI, MIC, seal, Track R apply, or autonomous merge.
  COUNTERFACTUAL: If durable Postgres or HMAC identity is unavailable, fail closed and do not issue a lease.
counterfactuals:
  - If two concurrent clients can both obtain an active lease for one job_id, do not deploy.
  - If DATABASE_URL absence permits an in-memory or process-local lease, do not merge.
  - If any transition can set execution_authorized true, revert the broker change.
  - If a Notion projection can override broker state, keep Phase 2 disabled.
```

## API

All endpoints require the existing per-agent HMAC envelope.

| Endpoint | Purpose |
|---|---|
| `POST /v1/jobs/claim` | Atomically acquire an available or expired job lease |
| `POST /v1/jobs/heartbeat` | Extend a live lease held by the same authenticated agent |
| `POST /v1/jobs/release` | Clock out to review, blocked, released, or complete |
| `GET /v1/jobs/active` | Read authenticated active assignments for collision checks |

## Atomicity

Postgres enforces one row per `job_id`. Claim uses a conditional `INSERT ... ON CONFLICT DO UPDATE ... WHERE` statement. An unexpired active lease cannot be overwritten. Losers receive HTTP 409 with `ACTIVE_CLAIM_CONFLICT` and the incumbent assignment.

Each transition appends an audit event. Immutable request outcomes preserve
consumed `request_id` values across lease reassignment. A transaction-scoped
Postgres advisory lock serializes concurrent identical retries so they return
the same original lease result instead of a false collision.

## Fail-closed rules

- `DATABASE_URL` is mandatory; the broker returns 503 rather than using process memory.
- Unreachable Postgres and rejected database credentials are normalized to 503.
- Job ownership requires a runtime-specific `*_HMAC_KEY`; the legacy shared
  sentinel key is never accepted by `/v1/jobs/*`.
- Lease duration is bounded to 5–120 minutes.
- Heartbeat requires the original agent and a non-expired active claim.
- Release requires the original agent and an active claim.
- Release rejects an expired lease even if its stored state still says `active`.
- Every database write forces `execution_authorized = false`.
- A lease proves assignment only; it cannot satisfy quorum, human approval, merge, deployment, seal, MIC, GI, or Track R authority.
- Notion remains a human-readable projection and must never be trusted as the atomic lock.
- Reusing a consumed request ID with a different tuple returns
  `REQUEST_ID_REUSE`, never a false live-incumbent claim.

## Homeroom projection

After a successful broker transition, an integration worker may update Notion using the returned lease. The projection must preserve the broker's `claim_id`, timestamps, version, state, branch and evidence links. Projection failure does not invalidate the broker lease and must be surfaced as observability debt.

## Deployment requirements

1. Configure a unique `*_HMAC_KEY` for each allowed runtime identity.
2. Confirm durable Postgres is attached through `DATABASE_URL`.
3. Run `pytest -q tests/test_jobs_broker.py tests/test_sentinel_auth.py`.
4. Run `pytest -q tests/test_jobs_broker_postgres_integration.py` against isolated PostgreSQL (see broker CI workflow).
5. Deploy only after human merge.
6. Exercise a two-client collision canary: exactly one claim returns 200 and the other returns 409.
7. Do not enable autonomous execution from lease state.

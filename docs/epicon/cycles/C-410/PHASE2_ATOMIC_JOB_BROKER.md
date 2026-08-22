# C-410 Phase 2 — Atomic Agent Job Broker

## Status

Proposed implementation. Human merge and deployment are required. No production state was mutated by authoring this change.

## Intent

- EPICON ID: `EPICON_C-410_CODE_atomic-job-broker_v1`
- Authority: assignment lease only
- Execution authority: always false
- Canon flow: Homeroom projection → broker lease → EPICON/GitHub evidence → Civic Ledger acceptance

```intent
epicon_id: EPICON_C-410_CODE_atomic-job-broker_v1
ledger_id: mobius:kaizencycle
scope: core, infra, docs, specs
mode: normal
issued_at: 2026-08-22T12:45:00Z
expires_at: 2026-11-20T12:45:00Z
justification: |
  VALUES INVOKED: integrity, transparency, custodianship, safety
  REASONING: Homeroom needs an atomic assignment lease authority so autonomous runtimes cannot unknowingly claim the same job.
  ANCHORS:
    - app/jobs/store.py
    - tests/test_jobs_broker.py
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

Each transition appends an audit event. Repeated `request_id` values are idempotent for the same authenticated agent.

## Fail-closed rules

- `DATABASE_URL` is mandatory; the broker returns 503 rather than using process memory.
- Lease duration is bounded to 5–120 minutes.
- Heartbeat requires the original agent and a non-expired active claim.
- Release requires the original agent and an active claim.
- Every database write forces `execution_authorized = false`.
- A lease proves assignment only; it cannot satisfy quorum, human approval, merge, deployment, seal, MIC, GI, or Track R authority.
- Notion remains a human-readable projection and must never be trusted as the atomic lock.

## Homeroom projection

After a successful broker transition, an integration worker may update Notion using the returned lease. The projection must preserve the broker's `claim_id`, timestamps, version, state, branch and evidence links. Projection failure does not invalidate the broker lease and must be surfaced as observability debt.

## Deployment requirements

1. Configure a unique `*_HMAC_KEY` for each allowed runtime identity.
2. Confirm durable Postgres is attached through `DATABASE_URL`.
3. Run `pytest -q tests/test_jobs_broker.py tests/test_sentinel_auth.py`.
4. Deploy only after human merge.
5. Exercise a two-client collision canary: exactly one claim returns 200 and the other returns 409.
6. Do not enable autonomous execution from lease state.

import json
import logging
import os
import uuid
from typing import Any

logger = logging.getLogger("oaa.jobs.store")

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS agent_job_leases (
    job_id TEXT PRIMARY KEY,
    claim_id UUID NOT NULL UNIQUE,
    request_id TEXT NOT NULL UNIQUE,
    cycle TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    runtime_id TEXT NOT NULL,
    evidence_hash TEXT NOT NULL,
    repositories JSONB NOT NULL,
    scope_paths JSONB NOT NULL,
    branch TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('active','review','blocked','released','complete','expired')),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lease_expires_at TIMESTAMPTZ NOT NULL,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    outcome JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    execution_authorized BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS agent_job_leases_active_idx
    ON agent_job_leases (state, lease_expires_at);
CREATE TABLE IF NOT EXISTS agent_job_lease_events (
    event_id UUID PRIMARY KEY,
    job_id TEXT NOT NULL,
    claim_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    runtime_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS agent_job_lease_events_job_idx
    ON agent_job_lease_events (job_id, created_at);
CREATE TABLE IF NOT EXISTS agent_job_claim_requests (
    request_id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    runtime_id TEXT NOT NULL,
    evidence_hash TEXT NOT NULL,
    lease_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


class ActiveClaimConflict(Exception):
    def __init__(self, incumbent: dict[str, Any]):
        super().__init__("job already has an active lease")
        self.incumbent = incumbent


class LeaseNotActive(Exception):
    pass


class RequestIdReuse(Exception):
    def __init__(self, original: dict[str, Any]):
        super().__init__("request_id was already consumed by a different request tuple")
        self.original = original


class JobStoreUnavailable(RuntimeError):
    pass


def _connect():
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for atomic job leasing")
    try:
        import psycopg2  # noqa: PLC0415

        return psycopg2.connect(database_url)
    except Exception as exc:
        logger.exception("Atomic job store connection failed")
        raise JobStoreUnavailable("atomic job store is unavailable") from exc


def _row_to_lease(row: tuple[Any, ...]) -> dict[str, Any]:
    return {
        "job_id": row[0],
        "claim_id": str(row[1]),
        "request_id": row[2],
        "cycle": row[3],
        "agent_id": row[4],
        "runtime_id": row[5],
        "evidence_hash": row[6],
        "repositories": row[7],
        "scope_paths": row[8],
        "branch": row[9],
        "state": row[10],
        "claimed_at": row[11].isoformat(),
        "lease_expires_at": row[12].isoformat(),
        "last_heartbeat_at": row[13].isoformat(),
        "version": row[14],
        "execution_authorized": row[15],
    }


_RETURNING = """
job_id, claim_id, request_id, cycle, agent_id, runtime_id, evidence_hash,
repositories, scope_paths, branch, state, claimed_at, lease_expires_at,
last_heartbeat_at, version, execution_authorized
"""


def _record_event(cur, lease: dict[str, Any], event_type: str, payload: dict[str, Any]) -> None:
    cur.execute(
        """
        INSERT INTO agent_job_lease_events
            (event_id, job_id, claim_id, event_type, agent_id, runtime_id, payload)
        VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
        """,
        (
            str(uuid.uuid4()), lease["job_id"], lease["claim_id"], event_type,
            lease["agent_id"], lease["runtime_id"], json.dumps(payload),
        ),
    )


def claim_job(*, agent_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    claim_id = str(uuid.uuid4())
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_SQL)
            # Serialize identical request IDs before checking their immutable
            # outcomes. This makes concurrent retries return the same lease.
            cur.execute(
                "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
                (payload["request_id"],),
            )
            cur.execute(
                """
                SELECT job_id, agent_id, runtime_id, evidence_hash, lease_snapshot
                FROM agent_job_claim_requests WHERE request_id = %s
                """,
                (payload["request_id"],),
            )
            existing_request = cur.fetchone()
            if existing_request:
                same_request = (
                    existing_request[0] == payload["job_id"]
                    and existing_request[1] == agent_id
                    and existing_request[2] == payload["runtime_id"]
                    and existing_request[3] == payload["evidence_hash"]
                )
                if not same_request:
                    raise RequestIdReuse(
                        {
                            "request_id": payload["request_id"],
                            "job_id": existing_request[0],
                            "agent_id": existing_request[1],
                            "runtime_id": existing_request[2],
                            "evidence_hash": existing_request[3],
                        }
                    )
                conn.commit()
                return existing_request[4]

            cur.execute(
                f"""
                INSERT INTO agent_job_leases
                    (job_id, claim_id, request_id, cycle, agent_id, runtime_id,
                     evidence_hash, repositories, scope_paths, branch, state,
                     lease_expires_at, execution_authorized)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb,
                        %s, 'active', NOW() + (%s * INTERVAL '1 second'), FALSE)
                ON CONFLICT (job_id) DO UPDATE SET
                    claim_id = EXCLUDED.claim_id,
                    request_id = EXCLUDED.request_id,
                    cycle = EXCLUDED.cycle,
                    agent_id = EXCLUDED.agent_id,
                    runtime_id = EXCLUDED.runtime_id,
                    evidence_hash = EXCLUDED.evidence_hash,
                    repositories = EXCLUDED.repositories,
                    scope_paths = EXCLUDED.scope_paths,
                    branch = EXCLUDED.branch,
                    state = 'active',
                    claimed_at = NOW(),
                    lease_expires_at = EXCLUDED.lease_expires_at,
                    last_heartbeat_at = NOW(),
                    released_at = NULL,
                    outcome = NULL,
                    version = agent_job_leases.version + 1,
                    execution_authorized = FALSE,
                    updated_at = NOW()
                WHERE agent_job_leases.state <> 'active'
                   OR agent_job_leases.lease_expires_at <= NOW()
                RETURNING {_RETURNING}
                """,
                (
                    payload["job_id"], claim_id, payload["request_id"], payload["cycle"],
                    agent_id, payload["runtime_id"], payload["evidence_hash"],
                    json.dumps(payload["repositories"]), json.dumps(payload["scope_paths"]),
                    payload["branch"], payload["lease_seconds"],
                ),
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(f"SELECT {_RETURNING} FROM agent_job_leases WHERE job_id = %s", (payload["job_id"],))
                incumbent = _row_to_lease(cur.fetchone())
                # A same-request incumbent can exist if an older deployment
                # wrote the lease before the immutable request table existed.
                same_request = (
                    incumbent["request_id"] == payload["request_id"]
                    and incumbent["agent_id"] == agent_id
                    and incumbent["runtime_id"] == payload["runtime_id"]
                    and incumbent["evidence_hash"] == payload["evidence_hash"]
                )
                if not same_request:
                    raise ActiveClaimConflict(incumbent)
                lease = incumbent
            else:
                lease = _row_to_lease(row)
            cur.execute(
                """
                INSERT INTO agent_job_claim_requests
                    (request_id, job_id, agent_id, runtime_id, evidence_hash, lease_snapshot)
                VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                ON CONFLICT (request_id) DO NOTHING
                """,
                (
                    payload["request_id"], payload["job_id"], agent_id,
                    payload["runtime_id"], payload["evidence_hash"], json.dumps(lease),
                ),
            )
            _record_event(cur, lease, "claimed", {"request_id": payload["request_id"]})
        conn.commit()
        return lease
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def heartbeat_job(*, agent_id: str, claim_id: str, lease_seconds: int) -> dict[str, Any]:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_SQL)
            cur.execute(
                f"""
                UPDATE agent_job_leases
                SET last_heartbeat_at = NOW(),
                    lease_expires_at = NOW() + (%s * INTERVAL '1 second'),
                    version = version + 1,
                    updated_at = NOW(),
                    execution_authorized = FALSE
                WHERE claim_id = %s AND agent_id = %s AND state = 'active'
                  AND lease_expires_at > NOW()
                RETURNING {_RETURNING}
                """,
                (lease_seconds, claim_id, agent_id),
            )
            row = cur.fetchone()
            if row is None:
                raise LeaseNotActive("claim is missing, expired, released, or owned by another agent")
            lease = _row_to_lease(row)
            _record_event(cur, lease, "heartbeat", {"lease_seconds": lease_seconds})
        conn.commit()
        return lease
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def release_job(*, agent_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_SQL)
            cur.execute(
                f"""
                UPDATE agent_job_leases
                SET state = %s, released_at = NOW(), outcome = %s::jsonb,
                    version = version + 1, updated_at = NOW(), execution_authorized = FALSE
                WHERE claim_id = %s AND agent_id = %s AND state = 'active'
                  AND lease_expires_at > NOW()
                RETURNING {_RETURNING}
                """,
                (payload["outcome"], json.dumps(payload), payload["claim_id"], agent_id),
            )
            row = cur.fetchone()
            if row is None:
                raise LeaseNotActive("claim is missing, already released, or owned by another agent")
            lease = _row_to_lease(row)
            _record_event(cur, lease, "released", payload)
        conn.commit()
        return lease
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def list_active_jobs(job_id: str | None = None) -> list[dict[str, Any]]:
    conn = _connect()
    try:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_SQL)
            query = f"SELECT {_RETURNING} FROM agent_job_leases WHERE state = 'active' AND lease_expires_at > NOW()"
            params: tuple[Any, ...] = ()
            if job_id:
                query += " AND job_id = %s"
                params = (job_id,)
            query += " ORDER BY lease_expires_at ASC"
            cur.execute(query, params)
            rows = cur.fetchall()
        conn.commit()
        return [_row_to_lease(row) for row in rows]
    finally:
        conn.close()

"""Shared helpers for OAA atomic job broker PostgreSQL integration tests."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
import uuid
from typing import Any

import psycopg2
import pytest

from app.jobs.store import _SCHEMA_SQL

CODEX_AGENT = "mobius-codex"
ATLAS_AGENT = "mobius-atlas"
CODEX_SECRET = "test-fixture-codex-hmac-key"
ATLAS_SECRET = "test-fixture-atlas-hmac-key"
EVIDENCE_A = "sha256:" + "a" * 64
EVIDENCE_B = "sha256:" + "b" * 64


def require_test_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        pytest.skip("DATABASE_URL not configured — isolated PostgreSQL required")
    lowered = database_url.lower()
    if "localhost" not in lowered and "127.0.0.1" not in lowered:
        pytest.skip("DATABASE_URL must target isolated CI PostgreSQL (localhost)")
    return database_url


def unique_job_id(prefix: str = "JOB-C411") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12].upper()}"


def unique_request_id(prefix: str = "req-c411") -> str:
    return f"{prefix}-{uuid.uuid4().hex}"


def claim_payload(
    *,
    job_id: str,
    request_id: str,
    runtime_id: str = "cursor-atlas-c411-oaa-broker-ci",
    evidence_hash: str = EVIDENCE_A,
    branch: str = "cursor/c411-oaa-broker-ci-verification-0e02",
) -> dict[str, Any]:
    return {
        "request_id": request_id,
        "job_id": job_id,
        "cycle": "C-411",
        "runtime_id": runtime_id,
        "evidence_hash": evidence_hash,
        "repositories": ["kaizencycle/OAA-API-Library"],
        "scope_paths": ["app/jobs/", "tests/test_jobs_broker_postgres_integration.py"],
        "branch": branch,
        "lease_seconds": 7200,
    }


def sign_request(
    agent_id: str,
    secret: str,
    body: dict | None = None,
    *,
    timestamp: int | None = None,
) -> tuple[str, dict[str, str]]:
    raw = "" if body is None else json.dumps(body, separators=(",", ":"))
    ts = str(timestamp if timestamp is not None else int(time.time()))
    signature = hmac.new(secret.encode(), f"{ts}.{raw}".encode(), hashlib.sha256).hexdigest()
    headers = {
        "x-oaa-agent": agent_id,
        "x-oaa-timestamp": ts,
        "x-oaa-signature": signature,
        "Content-Type": "application/json",
    }
    return raw, headers


def ensure_broker_schema(database_url: str) -> None:
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(_SCHEMA_SQL)
        conn.commit()
    finally:
        conn.close()


def truncate_broker_tables(database_url: str) -> None:
    ensure_broker_schema(database_url)
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                TRUNCATE agent_job_lease_events, agent_job_claim_requests, agent_job_leases
                RESTART IDENTITY CASCADE
                """
            )
        conn.commit()
    finally:
        conn.close()


def expire_lease(database_url: str, job_id: str) -> None:
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE agent_job_leases
                SET lease_expires_at = NOW() - INTERVAL '5 minutes',
                    last_heartbeat_at = NOW() - INTERVAL '5 minutes'
                WHERE job_id = %s
                """,
                (job_id,),
            )
        conn.commit()
    finally:
        conn.close()


def count_events(database_url: str, job_id: str) -> int:
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM agent_job_lease_events WHERE job_id = %s",
                (job_id,),
            )
            row = cur.fetchone()
            return int(row[0]) if row else 0
    finally:
        conn.close()


def fetch_lease(database_url: str, job_id: str) -> dict[str, Any] | None:
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT job_id, claim_id, request_id, agent_id, state, execution_authorized
                FROM agent_job_leases WHERE job_id = %s
                """,
                (job_id,),
            )
            row = cur.fetchone()
            if row is None:
                return None
            return {
                "job_id": row[0],
                "claim_id": str(row[1]),
                "request_id": row[2],
                "agent_id": row[3],
                "state": row[4],
                "execution_authorized": row[5],
            }
    finally:
        conn.close()

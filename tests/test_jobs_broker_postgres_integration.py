"""C-411 PostgreSQL integration tests for the atomic job broker."""

from __future__ import annotations

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest
from fastapi.testclient import TestClient

from app.jobs.store import ActiveClaimConflict, claim_job, heartbeat_job, release_job
from app.main import app
from tests.postgres_broker_helpers import (
    ATLAS_AGENT,
    ATLAS_SECRET,
    CODEX_AGENT,
    CODEX_SECRET,
    EVIDENCE_A,
    EVIDENCE_B,
    claim_payload,
    count_events,
    expire_lease,
    fetch_lease,
    require_test_database_url,
    sign_request,
    truncate_broker_tables,
    unique_job_id,
    unique_request_id,
)

client = TestClient(app)


@pytest.fixture(scope="module")
def database_url() -> str:
    return require_test_database_url()


@pytest.fixture(autouse=True)
def broker_env(database_url: str, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("MOBIUS_CODEX_HMAC_KEY", CODEX_SECRET)
    monkeypatch.setenv("MOBIUS_ATLAS_HMAC_KEY", ATLAS_SECRET)
    truncate_broker_tables(database_url)


def _post_claim(agent_id: str, secret: str, body: dict) -> tuple[int, dict]:
    raw, headers = sign_request(agent_id, secret, body)
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    try:
        payload = response.json()
    except Exception:
        payload = {"raw": response.text}
    return response.status_code, payload


def test_concurrent_claims_one_success_one_conflict(database_url: str):
    job_id = unique_job_id()
    body_a = claim_payload(job_id=job_id, request_id=unique_request_id("req-a"))
    body_b = claim_payload(job_id=job_id, request_id=unique_request_id("req-b"))

    def attempt(payload: dict, agent: str) -> tuple[str, int]:
        if agent == CODEX_AGENT:
            status, _ = _post_claim(CODEX_AGENT, CODEX_SECRET, payload)
        else:
            status, _ = _post_claim(ATLAS_AGENT, ATLAS_SECRET, payload)
        return agent, status

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [
            pool.submit(attempt, body_a, CODEX_AGENT),
            pool.submit(attempt, body_b, ATLAS_AGENT),
        ]
        statuses = [future.result()[1] for future in as_completed(futures)]

    assert sorted(statuses) == [200, 409]
    lease = fetch_lease(database_url, job_id)
    assert lease is not None
    assert lease["execution_authorized"] is False


def test_concurrent_identical_request_id_returns_same_claim(database_url: str):
    job_id = unique_job_id()
    request_id = unique_request_id("req-idempotent")
    body = claim_payload(job_id=job_id, request_id=request_id)

    def attempt() -> dict:
        status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
        assert status == 200
        return payload["lease"]

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(attempt) for _ in range(2)]
        leases = [future.result() for future in futures]

    assert leases[0]["claim_id"] == leases[1]["claim_id"]
    assert fetch_lease(database_url, job_id)["claim_id"] == leases[0]["claim_id"]


def test_idempotent_retry_after_release_returns_terminal_state(database_url: str):
    job_id = unique_job_id()
    request_id = unique_request_id("req-released-retry")
    body = claim_payload(job_id=job_id, request_id=request_id)
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert status == 200
    claim_id = payload["lease"]["claim_id"]

    release_body = {
        "claim_id": claim_id,
        "outcome": "released",
        "note": "terminal state check",
    }
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, release_body)
    assert client.post("/v1/jobs/release", content=raw, headers=headers).status_code == 200

    retry_status, retry_payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert retry_status == 200
    assert retry_payload["lease"]["state"] == "released"
    assert retry_payload["lease"]["claim_id"] == claim_id


def test_request_id_reuse_with_different_tuple(database_url: str):
    job_id = unique_job_id()
    request_id = unique_request_id("req-reuse")
    first = claim_payload(job_id=job_id, request_id=request_id)
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, first)
    assert status == 200

    second = claim_payload(
        job_id=unique_job_id("JOB-C411-OTHER"),
        request_id=request_id,
        evidence_hash=EVIDENCE_B,
    )
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, second)
    assert status == 409
    assert payload["detail"]["code"] == "REQUEST_ID_REUSE"
    assert "incumbent" not in payload["detail"]
    assert fetch_lease(database_url, second["job_id"]) is None


def test_released_job_reassignment_preserves_original_request(database_url: str):
    job_id = unique_job_id()
    original_request = unique_request_id("req-original")
    body = claim_payload(job_id=job_id, request_id=original_request)
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert status == 200
    claim_id = payload["lease"]["claim_id"]

    release_body = {
        "claim_id": claim_id,
        "outcome": "released",
        "note": "integration test release",
    }
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, release_body)
    release_response = client.post("/v1/jobs/release", content=raw, headers=headers)
    assert release_response.status_code == 200

    reassigned = claim_payload(job_id=job_id, request_id=unique_request_id("req-new"))
    status, payload = _post_claim(ATLAS_AGENT, ATLAS_SECRET, reassigned)
    assert status == 200
    assert payload["lease"]["agent_id"] == ATLAS_AGENT

    retry_raw, retry_headers = sign_request(CODEX_AGENT, CODEX_SECRET, body)
    retry_response = client.post("/v1/jobs/claim", content=retry_raw, headers=retry_headers)
    assert retry_response.status_code == 409
    assert retry_response.json()["detail"]["code"] == "ACTIVE_CLAIM_CONFLICT"


def test_expired_lease_cannot_heartbeat_or_release(database_url: str):
    job_id = unique_job_id()
    body = claim_payload(job_id=job_id, request_id=unique_request_id("req-expire"))
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert status == 200
    claim_id = payload["lease"]["claim_id"]

    expire_lease(database_url, job_id)

    heartbeat_body = {"claim_id": claim_id, "lease_seconds": 7200}
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, heartbeat_body)
    heartbeat_response = client.post("/v1/jobs/heartbeat", content=raw, headers=headers)
    assert heartbeat_response.status_code == 409
    assert heartbeat_response.json()["detail"]["code"] == "LEASE_NOT_ACTIVE"

    release_body = {"claim_id": claim_id, "outcome": "review"}
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, release_body)
    release_response = client.post("/v1/jobs/release", content=raw, headers=headers)
    assert release_response.status_code == 409

    replacement = claim_payload(job_id=job_id, request_id=unique_request_id("req-replace"))
    status, payload = _post_claim(ATLAS_AGENT, ATLAS_SECRET, replacement)
    assert status == 200
    assert payload["lease"]["agent_id"] == ATLAS_AGENT


def test_foreign_agent_cannot_heartbeat_or_release(database_url: str):
    job_id = unique_job_id()
    body = claim_payload(job_id=job_id, request_id=unique_request_id("req-owner"))
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert status == 200
    claim_id = payload["lease"]["claim_id"]

    heartbeat_body = {"claim_id": claim_id, "lease_seconds": 7200}
    raw, headers = sign_request(ATLAS_AGENT, ATLAS_SECRET, heartbeat_body)
    heartbeat_response = client.post("/v1/jobs/heartbeat", content=raw, headers=headers)
    assert heartbeat_response.status_code == 409

    release_body = {"claim_id": claim_id, "outcome": "blocked"}
    raw, headers = sign_request(ATLAS_AGENT, ATLAS_SECRET, release_body)
    release_response = client.post("/v1/jobs/release", content=raw, headers=headers)
    assert release_response.status_code == 409


def test_database_unavailable_returns_503_without_credentials(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    body = claim_payload(job_id=unique_job_id(), request_id=unique_request_id("req-503"))
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, body)
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 503
    assert "password" not in response.text.lower()
    assert "postgresql://" not in response.text.lower()


def test_release_records_audit_event_and_execution_stays_false(database_url: str):
    job_id = unique_job_id()
    body = claim_payload(job_id=job_id, request_id=unique_request_id("req-audit"))
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert status == 200
    claim_id = payload["lease"]["claim_id"]
    assert payload["lease"]["execution_authorized"] is False

    release_body = {
        "claim_id": claim_id,
        "outcome": "complete",
        "note": "audit trail check",
    }
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, release_body)
    release_response = client.post("/v1/jobs/release", content=raw, headers=headers)
    assert release_response.status_code == 200
    assert release_response.json()["lease"]["execution_authorized"] is False

    events = count_events(database_url, job_id)
    assert events >= 2
    lease = fetch_lease(database_url, job_id)
    assert lease is not None
    assert lease["execution_authorized"] is False


def test_store_level_concurrent_claim_conflict(database_url: str):
    job_id = unique_job_id()
    payload = claim_payload(job_id=job_id, request_id=unique_request_id("req-store"))

    def store_claim(agent: str) -> str:
        try:
            claim_job(agent_id=agent, payload={**payload, "request_id": unique_request_id("req-store")})
            return "ok"
        except ActiveClaimConflict:
            return "conflict"

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(store_claim, [CODEX_AGENT, ATLAS_AGENT]))

    assert results.count("ok") == 1
    assert results.count("conflict") == 1


def test_valid_runtime_specific_key_accepted(database_url: str):
    body = claim_payload(job_id=unique_job_id(), request_id=unique_request_id("req-auth-ok"))
    status, payload = _post_claim(CODEX_AGENT, CODEX_SECRET, body)
    assert status == 200
    assert payload["authority"] == "assignment_only"


def test_missing_key_returns_401(database_url: str, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("MOBIUS_CODEX_HMAC_KEY", raising=False)
    body = claim_payload(job_id=unique_job_id(), request_id=unique_request_id("req-no-key"))
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, body)
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 401


def test_bad_signature_returns_401(database_url: str):
    body = claim_payload(job_id=unique_job_id(), request_id=unique_request_id("req-bad-sig"))
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, body)
    headers["x-oaa-signature"] = "deadbeef" * 8
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 401


def test_stale_timestamp_returns_401(database_url: str):
    body = claim_payload(job_id=unique_job_id(), request_id=unique_request_id("req-stale"))
    stale_ts = int(time.time()) - 600
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, body, timestamp=stale_ts)
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 401


def test_legacy_sentinel_key_rejected_on_jobs_routes(database_url: str, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("MOBIUS_CODEX_HMAC_KEY", raising=False)
    monkeypatch.setenv("OAA_SENTINEL_HMAC_KEY", CODEX_SECRET)
    body = claim_payload(job_id=unique_job_id(), request_id=unique_request_id("req-legacy"))
    raw, headers = sign_request(CODEX_AGENT, CODEX_SECRET, body)
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 401

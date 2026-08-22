"""C-410 Phase 2 atomic job broker API contract tests."""

import hashlib
import hmac
import json
import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.jobs.store import ActiveClaimConflict, JobStoreUnavailable, LeaseNotActive, RequestIdReuse
from app.main import app

client = TestClient(app)
AGENT_ID = "mobius-codex"
SECRET = "test-job-broker-secret"


def _sign(body: dict | None = None) -> tuple[str, dict[str, str]]:
    raw = "" if body is None else json.dumps(body, separators=(",", ":"))
    ts = str(int(time.time()))
    signature = hmac.new(SECRET.encode(), f"{ts}.{raw}".encode(), hashlib.sha256).hexdigest()
    return raw, {
        "x-oaa-agent": AGENT_ID,
        "x-oaa-timestamp": ts,
        "x-oaa-signature": signature,
        "Content-Type": "application/json",
    }


def _claim_body() -> dict:
    return {
        "request_id": "request-c410-0001",
        "job_id": "JOB-C410-001",
        "cycle": "C-410",
        "runtime_id": "codex-workmode-001",
        "evidence_hash": "sha256:" + "a" * 64,
        "repositories": ["kaizencycle/OAA-API-Library"],
        "scope_paths": ["app/jobs/", "tests/test_jobs_broker.py"],
        "branch": "codex/c410-phase2-atomic-job-broker",
        "lease_seconds": 7200,
    }


def _lease(state: str = "active") -> dict:
    return {
        **_claim_body(),
        "claim_id": "12345678-1234-1234-1234-123456789abc",
        "agent_id": AGENT_ID,
        "state": state,
        "claimed_at": "2026-08-22T12:00:00+00:00",
        "lease_expires_at": "2026-08-22T14:00:00+00:00",
        "last_heartbeat_at": "2026-08-22T12:00:00+00:00",
        "version": 1,
        "execution_authorized": False,
    }


@pytest.fixture(autouse=True)
def _env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MOBIUS_CODEX_HMAC_KEY", SECRET)


@patch("app.jobs.router.claim_job")
def test_claim_returns_assignment_only_and_never_execution_authority(mock_claim):
    mock_claim.return_value = _lease()
    raw, headers = _sign(_claim_body())
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 200
    assert response.json()["authority"] == "assignment_only"
    assert response.json()["lease"]["execution_authorized"] is False


@patch("app.jobs.router.claim_job")
def test_active_claim_conflict_is_409_and_discloses_incumbent(mock_claim):
    mock_claim.side_effect = ActiveClaimConflict(_lease())
    raw, headers = _sign(_claim_body())
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "ACTIVE_CLAIM_CONFLICT"
    assert response.json()["detail"]["incumbent"]["job_id"] == "JOB-C410-001"


@patch("app.jobs.router.heartbeat_job")
def test_heartbeat_rejects_inactive_or_foreign_claim(mock_heartbeat):
    mock_heartbeat.side_effect = LeaseNotActive()
    body = {"claim_id": "12345678-1234-1234-1234-123456789abc", "lease_seconds": 7200}
    raw, headers = _sign(body)
    response = client.post("/v1/jobs/heartbeat", content=raw, headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "LEASE_NOT_ACTIVE"


@patch("app.jobs.router.release_job")
def test_release_preserves_execution_false(mock_release):
    mock_release.return_value = _lease("review")
    body = {
        "claim_id": "12345678-1234-1234-1234-123456789abc",
        "outcome": "review",
        "pull_request_url": "https://github.com/kaizencycle/OAA-API-Library/pull/1",
    }
    raw, headers = _sign(body)
    response = client.post("/v1/jobs/release", content=raw, headers=headers)
    assert response.status_code == 200
    assert response.json()["lease"]["state"] == "review"
    assert response.json()["lease"]["execution_authorized"] is False


@patch("app.jobs.router.list_active_jobs")
def test_active_list_requires_hmac_and_returns_shared_claims(mock_list):
    mock_list.return_value = [_lease()]
    unauthenticated = client.get("/v1/jobs/active")
    assert unauthenticated.status_code == 401

    _, headers = _sign(None)
    response = client.get("/v1/jobs/active", headers=headers)
    assert response.status_code == 200
    assert response.json()["jobs"][0]["job_id"] == "JOB-C410-001"


def test_claim_rejects_invalid_hash_before_store():
    body = _claim_body()
    body["evidence_hash"] = "not-a-hash"
    raw, headers = _sign(body)
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 422


@patch("app.jobs.router.claim_job")
def test_request_id_reuse_is_not_reported_as_live_incumbent(mock_claim):
    mock_claim.side_effect = RequestIdReuse(
        {
            "request_id": "request-c410-0001",
            "job_id": "JOB-C410-OLD",
            "agent_id": "mobius-atlas",
            "runtime_id": "atlas-old",
            "evidence_hash": "sha256:" + "b" * 64,
        }
    )
    raw, headers = _sign(_claim_body())
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "REQUEST_ID_REUSE"
    assert "incumbent" not in response.json()["detail"]


@patch("app.jobs.router.claim_job")
def test_store_outage_is_service_unavailable(mock_claim):
    mock_claim.side_effect = JobStoreUnavailable("atomic job store is unavailable")
    raw, headers = _sign(_claim_body())
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 503


def test_job_routes_reject_legacy_shared_sentinel_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("MOBIUS_CODEX_HMAC_KEY", raising=False)
    monkeypatch.setenv("OAA_SENTINEL_HMAC_KEY", SECRET)
    raw, headers = _sign(_claim_body())
    response = client.post("/v1/jobs/claim", content=raw, headers=headers)
    assert response.status_code == 401


def test_store_preserves_request_outcomes_and_serializes_retries():
    source = open("app/jobs/store.py", encoding="utf-8").read()
    assert "CREATE TABLE IF NOT EXISTS agent_job_claim_requests" in source
    assert "pg_advisory_xact_lock(hashtextextended" in source
    assert "lease_snapshot JSONB NOT NULL" in source
    assert "ON CONFLICT (request_id) DO NOTHING" in source


def test_release_requires_unexpired_lease():
    source = open("app/jobs/store.py", encoding="utf-8").read()
    release_section = source.split("def release_job", 1)[1].split("def list_active_jobs", 1)[0]
    assert "lease_expires_at > NOW()" in release_section

"""HMAC negative tests — C-373 Phase 1 acceptance (no vendor calls on 401)."""

import hashlib
import hmac
import json
import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.sentinel.constants import PROMPT_VERSION
from app.sentinel.models import SentinelVerdict

client = TestClient(app)

AGENT_ID = "mobius-ci-sentinel"
SECRET = "test-hmac-secret-phase1"


def _sign(body: dict, *, secret: str = SECRET, timestamp: int | None = None) -> tuple[str, dict[str, str]]:
    ts = str(timestamp if timestamp is not None else int(time.time()))
    raw = json.dumps(body, separators=(",", ":"))
    payload = f"{ts}.{raw}"
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    headers = {
        "x-oaa-agent": AGENT_ID,
        "x-oaa-timestamp": ts,
        "x-oaa-signature": sig,
        "Content-Type": "application/json",
    }
    return raw, headers


def _sample_body() -> dict:
    return {
        "task": "pr_sentinel_review",
        "sentinels": ["aurea"],
        "tier": 1,
        "policy_ref": "base",
        "context_hash": "abc123",
        "context": {"meta": {}, "files": "", "diff": ""},
        "prompt_version": PROMPT_VERSION,
    }


@pytest.fixture(autouse=True)
def _env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("MOBIUS_CI_SENTINEL_HMAC_KEY", SECRET)


@patch("app.sentinel.router.adapters.review_aurea")
def test_sentinel_review_success(mock_review):
    mock_review.return_value = SentinelVerdict(
        sentinel="aurea",
        verdict="pass",
        blocking=[],
        non_blocking=[],
        summary="ok",
        model="gpt-4o-mini",
        cached=False,
    )

    body = _sample_body()
    raw, headers = _sign(body)
    res = client.post("/v1/sentinel/review", content=raw, headers=headers)
    assert res.status_code == 200
    assert res.json()["verdicts"][0]["verdict"] == "pass"
    mock_review.assert_called_once()


def test_bad_signature_returns_401_no_vendor():
    body = _sample_body()
    raw, headers = _sign(body)
    headers["x-oaa-signature"] = "deadbeef" * 8

    with patch("app.sentinel.router.adapters.review_aurea") as mock_review:
        res = client.post("/v1/sentinel/review", content=raw, headers=headers)
        assert res.status_code == 401
        mock_review.assert_not_called()


def test_stale_timestamp_returns_401_no_vendor():
    body = _sample_body()
    stale = int(time.time()) - 600
    raw, headers = _sign(body, timestamp=stale)

    with patch("app.sentinel.router.adapters.review_aurea") as mock_review:
        res = client.post("/v1/sentinel/review", content=raw, headers=headers)
        assert res.status_code == 401
        mock_review.assert_not_called()


def test_wrong_agent_prefix_returns_401_no_vendor():
    body = _sample_body()
    raw, headers = _sign(body)
    headers["x-oaa-agent"] = "evil-agent"

    with patch("app.sentinel.router.adapters.review_aurea") as mock_review:
        res = client.post("/v1/sentinel/review", content=raw, headers=headers)
        assert res.status_code == 401
        mock_review.assert_not_called()


def test_prompt_version_mismatch_returns_400():
    body = _sample_body()
    body["prompt_version"] = "wrong-version"
    raw, headers = _sign(body)

    with patch("app.sentinel.router.adapters.review_aurea") as mock_review:
        res = client.post("/v1/sentinel/review", content=raw, headers=headers)
        assert res.status_code == 400
        mock_review.assert_not_called()

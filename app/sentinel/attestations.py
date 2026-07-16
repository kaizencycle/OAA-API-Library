import json
import logging
import os
import uuid
from typing import Any

logger = logging.getLogger("oaa.sentinel.attestations")

_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS sentinel_review_attestations (
    id UUID PRIMARY KEY,
    sentinel TEXT NOT NULL,
    context_hash TEXT NOT NULL,
    verdict TEXT NOT NULL,
    skip_reason TEXT,
    model TEXT,
    prompt_version TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


def _get_connection():
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        return None
    try:
        import psycopg2  # noqa: PLC0415 — optional dep, only when DATABASE_URL set
    except ImportError:
        logger.warning("psycopg2 not installed; attestations will not persist")
        return None
    return psycopg2.connect(database_url)


def ensure_table() -> bool:
    conn = _get_connection()
    if conn is None:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute(_TABLE_SQL)
        conn.commit()
        return True
    except Exception:
        logger.exception("Failed to ensure sentinel_review_attestations table")
        return False
    finally:
        conn.close()


def persist_attestation(
    *,
    sentinel: str,
    context_hash: str,
    verdict: str,
    skip_reason: str | None,
    model: str | None,
    prompt_version: str,
    agent_id: str,
    payload: dict[str, Any],
) -> tuple[str, bool]:
    """
    Buffer attestation to Postgres when DATABASE_URL is wired.
    Returns (attestation_id, persisted).
    """
    attestation_id = str(uuid.uuid4())
    conn = _get_connection()
    if conn is None:
        return attestation_id, False

    try:
        ensure_table()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sentinel_review_attestations
                    (id, sentinel, context_hash, verdict, skip_reason, model,
                     prompt_version, agent_id, payload)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                """,
                (
                    attestation_id,
                    sentinel,
                    context_hash,
                    verdict,
                    skip_reason,
                    model,
                    prompt_version,
                    agent_id,
                    json.dumps(payload),
                ),
            )
        conn.commit()
        return attestation_id, True
    except Exception:
        logger.exception("Attestation persist failed; returning in-memory id only")
        return attestation_id, False
    finally:
        conn.close()

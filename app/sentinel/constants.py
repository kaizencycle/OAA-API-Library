"""Sentinel review broker — Floor 1 (Authority) constants. Isolated from wallet/tutor paths."""

# Pinned both sides — broker rejects mismatch with HTTP 400.
PROMPT_VERSION = "c373-v1"

# Agent-plane HMAC window (seconds).
TIMESTAMP_WINDOW_SEC = 300

# Required prefix for x-oaa-agent (C-371 agent-plane convention).
AGENT_ID_PREFIX = "mobius-"

# Per-agent HMAC secret env var suffix: MOBIUS_CI_SENTINEL -> MOBIUS_CI_SENTINEL_HMAC_KEY
AGENT_HMAC_ENV_SUFFIX = "_HMAC_KEY"

# Phase 1 fallback when per-agent key not set (documented for migration only).
LEGACY_SENTINEL_HMAC_ENV = "OAA_SENTINEL_HMAC_KEY"

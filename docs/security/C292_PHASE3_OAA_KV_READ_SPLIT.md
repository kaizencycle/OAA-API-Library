# C-292 Phase 3 — OAA KV Public / Private Read Split

## Scope

Phase 3 hardens OAA sovereign memory reads.

The previous behavior allowed:

```txt
GET /api/oaa/kv?prefix=
```

to return broad raw memory entries publicly.

## New behavior

### Public summary read

```txt
GET /api/oaa/kv?prefix=<optional>&limit=<1-25>
```

Returns sanitized metadata only:

```txt
type
hash
previous_hash
ts
agent
cycle
intent
key
```

It does **not** return raw `value` payloads.

### Private raw read

```txt
GET /api/oaa/kv?private=true&prefix=<required>&limit=<1-100>
```

Requires read auth.

Accepted auth headers:

```txt
Authorization: Bearer <token>
x-oaa-read-token: <token>
x-oaa-service-token: <token>
x-agent-service-token: <token>
```

Configured env token sources:

```txt
OAA_READ_TOKEN
OAA_SERVICE_TOKEN
AGENT_SERVICE_TOKEN
KV_HMAC_SECRET
MEMORY_HMAC_SECRET
OAA_HMAC_SECRET
```

## Guardrails

Private reads require:

```txt
prefix length >= 3
```

Unscoped private reads are blocked unless explicitly enabled:

```txt
OAA_ALLOW_UNSCOPED_PRIVATE_READS=true
```

## Why this matters

OAA is sovereign memory. Public endpoints may expose proofs and summaries, but raw memory payloads must be intentional, authenticated, scoped, and capped.

## Canon

Public reads show proof metadata.
Private reads require authorization.
Sovereign memory must not leak raw payloads.

We heal as we walk.

# Phase 3 — OAA Memory Seal Contract

## Purpose

OAA is the sovereign memory bridge of the Civic Mesh.

It preserves OAA memory locally and seals proof-worthy memory into Civic Protocol Core.

## Flow

```txt
OAA_MEMORY.json
  ↓
seal-memory workflow
  ↓
OAA_MEMORY_ENTRY_V1 packet
  ↓
Civic Ledger /mesh/ingest
  ↓
ledger/oaa-sealed-memory.json index
```

## Responsibilities

OAA reads:

```txt
OAA_MEMORY.json
Terminal snapshot-lite
Substrate mobius-pulse
```

OAA writes:

```txt
Civic Ledger /mesh/ingest
ledger/oaa-sealed-memory.json
```

## Idempotency

Each sealed packet includes:

```txt
node_id
event_type
cycle
source_hash
workflow_id
idempotency_key
```

The workflow tracks sealed keys in:

```txt
ledger/oaa-sealed-memory.json
```

Duplicate policy:

```txt
skip_previously_sealed_hash
```

## Safety

OAA does not send every scratchpad loop as canon.

It forwards structured `OAA_MEMORY_ENTRY_V1` rows and relies on Civic Ledger proof policy for durable proof.

## Canon

OAA remembers sovereign context.
Substrate stores mesh memory.
Civic Ledger proves what mattered.

We heal as we walk.

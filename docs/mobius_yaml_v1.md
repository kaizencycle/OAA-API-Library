# mobius.yaml v1 — node declaration contract

`mobius.yaml` is the **declaration contract** for a Mobius node. It states who the node is, what it emits (`pulse`), where it publishes, where durable writes are routed (`ingest`), and trust boundaries (`policy`). **It does not execute writes** — runtime writers read this config (or equivalent) and POST to declared targets.

## Write path (canon)

```
KV / runtime state
  → writer / orchestrator
  → declared ingest target (e.g. Civic Protocol Core)
  → durable ledger
  → optional feed mirror
```

## Schema v1 (fields)

| Block | Purpose |
|--------|--------|
| `mesh` | Node identity, tier, role, repository, discovery |
| `pulse` | What the node exposes for health, feeds, snapshots; lanes; `authoritative_for`; `emits` flags |
| `ingest` | How the node participates in writes: `mode`, optional `write_url` / `auth` / `accepts`, and/or `targets[]` for client forwarding |
| `mcp` | MCP server and discovery URLs when the node exposes tools |
| `policy` | Canonical ledger node, hashing, mirroring, local truth |

### `mesh.tier`

Suggested values: `sentinel`, `operator`, `ledger`, `client`, `service`.

### `mesh.role`

Suggested values: `protocol_cortex`, `operator_console`, `ledger_node`, `citizen_shell`, `service_node`.

### `ingest.mode`

| Mode | Use |
|------|-----|
| `ledger_target` | **Only** canonical ledger nodes — this node accepts durable ingest |
| `client_of_other_node` | Operator / service nodes — forward or orchestrate writes to another node’s `write_url` |
| `aggregator_only` | Pulse / mesh aggregation — no durable ingest on this node |

**Rule:** Only ledger nodes use `ledger_target`. Operator nodes must not set themselves as `canonical_ledger_node` for network truth.

### Pulse lanes (vocabulary)

Canonical lane names to use across repos:

- `integrity`
- `signals`
- `tripwire`
- `heartbeat`
- `mic_readiness`
- `vault`
- `ledger`
- `mesh`
- `mcp`

### Payload types (tight v1 list)

Declare under `ingest.targets[].accepts` or ledger `ingest.accepts` as appropriate:

- `EPICON_ENTRY_V1`
- `MIC_READINESS_V1`
- `MIC_SEAL_V1`
- `MIC_RESERVE_RECONCILIATION_V1`
- `MIC_GENESIS_BLOCK`
- `MOBIUS_PULSE_V1`
- `OAA_MEMORY_ENTRY_V1` (sovereign memory journal / proofs from OAA)

## Three-node alignment (Substrate / Terminal / Civic Core)

| Repo | Typical `mesh.role` | `pulse` | `ingest` |
|------|---------------------|---------|----------|
| **Mobius-Substrate** | `protocol_cortex` | Aggregated feeds, doctrine | `aggregator_only`, `enabled: false` for durable ingest |
| **mobius-civic-ai-terminal** | `operator_console` | Operator surfaces, heartbeat | `client_of_other_node` → Civic Core |
| **Civic-Protocol-Core** | `ledger_node` | Ledger / EPICON | `ledger_target`, accepts listed payloads |

## This repository (`OAA-API-Library`)

Root [`mobius.yaml`](../mobius.yaml) declares **OAA** as a **`service_node`**: append-only memory (`/api/oaa/kv`), optional warm **KV bridge** (`/api/kv-bridge/*`), and **client** forwarding of proofs to **`civic-protocol-core`** (`/mesh/ingest`). Relative URLs in `pulse` are resolved against the deployed hub base URL.

For the full cross-repo rollout (Terminal writer + Substrate spec authority + Civic `mobius.yaml`), apply the same schema in those repositories on their own branches.

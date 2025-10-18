# Civic AI Native Stack Specification

**Version:** v0.1.0  
**Author:** Michael Judan  
**Last Updated:** 2025-10-18  

---

## Overview

The Civic AI Native Stack defines an integrated architecture for ethical, verifiable, and economically-aligned AI systems. This specification provides the technical foundation for implementing AI agents that operate within a shared moral framework while maintaining cryptographic proof of their actions.

## Core Innovation

This stack represents the first cohesive implementation of:
- **Agents with inherited ethics** → Founders (Jade/Eve/Zeus/Hermes) spawning sub-agents carrying Integrity Core + Logic Engine + Attestation
- **Attested working memory** → E.O.M.M. → OAA serializer → Ledger seal (idempotent by sha256) with quarantine and schema hygiene
- **Tri-verification on code** → human + agent + Copilot overlap proof, sealed to the Ledger
- **AI-SEO → GEO → AEO** → public JSON-LD beacons + geocivic metadata + region/jurisdiction routing
- **GIC incentive** → reward tied to Proof-of-Integrity, not just activity
- **Ops reality** → Render-deployable APIs, GitHub Actions, and Cursor pulses already wired

## Specification Documents

| Document | Description | Status |
|----------|-------------|--------|
| [01-overview.md](./01-overview.md) | Architecture layers, data flow, and core concepts | ✅ Complete |
| [02-attestations.md](./02-attestations.md) | JSON-LD schema, verification pipeline, integrity levels | ✅ Complete |
| [03-agent-ethics.md](./03-agent-ethics.md) | Integrity Core, Virtue Accords, ethical evaluation | ✅ Complete |
| [04-ai-seo-geo.md](./04-ai-seo-geo.md) | Beacon model, discovery APIs, ranking logic | ✅ Complete |
| [05-proof-pipeline.md](./05-proof-pipeline.md) | E.O.M.M. → OAA → Ledger workflow and verification | ✅ Complete |
| [06-code-verification.md](./06-code-verification.md) | Tri-verification protocol, CI integration | ✅ Complete |
| [07-incentives-gic.md](./07-incentives-gic.md) | GIC economic model, reward categories, governance | ✅ Complete |
| [08-validation-checklist.md](./08-validation-checklist.md) | Deployment tests, certification criteria | ✅ Complete |

## Quick Start

1. **Review the Overview** - Start with [01-overview.md](./01-overview.md) to understand the architecture
2. **Understand Attestations** - Read [02-attestations.md](./02-attestations.md) for the core data model
3. **Check Implementation** - Use [08-validation-checklist.md](./08-validation-checklist.md) to verify compliance

## Reference Implementations

- **OAA-API-Library** - Core API and memory management
- **Lab7-proof** - Frontend and user interface
- **Civic Ledger Core** - Blockchain and attestation storage
- **Citizen Shield** - Security and trust infrastructure

## Open Standards Compatibility

- **DID/VC** - Decentralized identity and verifiable credentials
- **ActivityPub/ATProto** - Optional social protocol bridges
- **Schema.org** - Semantic web standards for beacons
- **JSON-LD** - Linked data format for attestations

## Versioning

This specification follows Semantic Versioning (SemVer):
- **Major** - Breaking changes to core protocols
- **Minor** - New features, backward compatible
- **Patch** - Bug fixes, documentation updates

## Contributing

This is an open specification. Contributions are welcome through:
1. GitHub Issues for discussion
2. Pull Requests for specification updates
3. Reference implementation contributions

## License

Creative Commons Attribution 4.0 International (CC BY 4.0)

---

**Motto:**  
> "Integrity is the new compute."  
> — Civic AI Founders
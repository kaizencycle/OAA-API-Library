# Civic AI Native Stack Specification

**Version:** v0.1.0  
**Author:** Michael Judan  
**Last Updated:** 2025-10-18  

---

## Overview

The Civic AI Native Stack defines an architecture for integrating human-in-the-loop learning, ethical governance, and decentralized compute into a verifiable, self-attesting AI ecosystem. This specification serves as the canonical reference for implementing Civic AI systems that are ethically aligned, operationally verifiable, economically symbiotic, cognitively adaptive, and geocivically anchored.

## Quick Start

This specification defines a cohesive, running system that combines:
- **Agents with inherited ethics** → Founders (Jade/Eve/Zeus/Hermes) spawning sub-agents with Integrity Core + Logic Engine + Attestation
- **Attested working memory** → E.O.M.M. → OAA serializer → Ledger seal (idempotent by sha256) with quarantine and schema hygiene
- **Tri-verification on code** → human + agent + Copilot overlap proof, sealed to the Ledger
- **AI-SEO → GEO → AEO** → public JSON-LD beacons + geocivic metadata + region/jurisdiction routing
- **GIC incentive** → reward tied to Proof-of-Integrity, not just activity
- **Ops reality** → Render-deployable APIs, GitHub Actions, and Cursor pulses already wired

## Specification Documents

| Document | Description | Status |
|----------|-------------|--------|
| [01-overview.md](./01-overview.md) | Architecture layers, data flow, and purpose | ✅ Complete |
| [02-attestations.md](./02-attestations.md) | JSON-LD schema, hashes, signatures, verification | ✅ Complete |
| [03-agent-ethics.md](./03-agent-ethics.md) | Integrity Core, Virtue Accords, ethical evaluation | ✅ Complete |
| [04-ai-seo-geo.md](./04-ai-seo-geo.md) | Beacons, region/jurisdiction rules, discovery APIs | ✅ Complete |
| [05-proof-pipeline.md](./05-proof-pipeline.md) | E.O.M.M. → OAA → Ledger workflow, quarantine | ✅ Complete |
| [06-code-verification.md](./06-code-verification.md) | Copilot overlap, thresholds, PR bot, tri-verification | ✅ Complete |
| [07-incentives-gic.md](./07-incentives-gic.md) | GIC reward rules, economic model, governance | ✅ Complete |
| [08-validation-checklist.md](./08-validation-checklist.md) | Deployment verification, acceptance tests | ✅ Complete |
| [09-cultural-kernel-archetypes.md](./09-cultural-kernel-archetypes.md) | Psychological archetypes, cultural coherence, narrative identity | ✅ Complete |

## Minimal Acceptance Tests

To verify a Civic AI Node implementation, these four tests must pass end-to-end:

1. **Submit reflection → get sha256 + filename**
2. **CI posts attestation → Ledger returns proof ID**
3. **PR opened → Copilot verifier posts decision + score**
4. **AI-SEO index contains the new item with GEO fields; /api/geo/near returns it**

If all four pass on a fresh setup, the implementation has successfully reproduced the stack.

## Reference Implementations

- **OAA-API-Library** → Core API and memory management
- **Lab7-proof** → Frontend and OAA engine
- **Civic Ledger Core** → Blockchain and attestation storage
- **Citizen Shield** → Security and trust infrastructure

## Open Standard Hooks

- **DID/VC compatibility** → Identity and credential standards
- **ActivityPub/ATProto bridges** → Social protocol integration (optional)

## Versioning

- **Current Version:** v0.1.0 (SemVer)
- **Spec Revisions:** Quarterly updates
- **Integrity Audits:** Continuous via `ledger/auditor` cron
- **Agent Updates:** Adaptive via OAA reflection cycles

## Contributing

This specification is maintained as an open standard. Contributions should:
1. Follow the established document structure
2. Maintain backward compatibility within major versions
3. Include validation tests for new features
4. Be submitted via the Civic Ledger attestation process

## License

Creative Commons Attribution 4.0 International (CC BY 4.0)

---

**Motto:**  
> "Integrity is the new compute."  
> — Civic AI Founders

---

*This specification represents the first cohesive, running system that integrates civic, auditable, incentive-aligned, agentic compute with public beacons and geo-aware governance.*
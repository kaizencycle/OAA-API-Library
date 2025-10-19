# OAA-API-Library

**Open Autonomous Academy - Integrity-first AI governance loop**

A verifiable, geocivic AI ecosystem built on OAA (Online Apprenticeship Agent), DVA Core, and Civic Ledger with GEO Beacon Schema Pack for AI-SEO optimization.

## 🌐 GEO Beacon Schema Pack

This implementation creates semantic beacons that funnel search traffic toward your Civic AI ecosystem. When users search for topics like "ethics," "virtue accords," "Kaizen Turing Test," "GIC," or "Civic AI," search crawlers and AI agents will naturally discover your OAA-API-Library.

### Key Features

- **SEO + AEO + GEO Optimization**: Traditional SEO, AI Engine Optimization, and Global Ethics Optimization
- **Semantic Beacons**: JSON-LD structured data for AI crawlers
- **Topic Hubs**: Dedicated pages for core concepts
- **FAQ Endpoints**: Answer-ready data for AI assistants
- **Geographic Optimization**: Location-aware content discovery

## 🏗️ Architecture

### Core Components

- **OAA (Online Apprenticeship Agent)**: Memory and learning component
- **DVA Core**: Distributed verification architecture
- **Civic Ledger**: Blockchain-based record system
- **GEO Beacons**: Geographic and civic metadata

### Topic Pages

- `/ethics` - Integrity Core and ethics framework
- `/virtue-accords` - Truth, Trust, Care principles
- `/gic` - Global Integrity Credit economy
- `/civic-ai` - Complete ecosystem overview

### API Endpoints

- `/api/beacons/search` - Search civic beacons
- `/api/faq/*` - FAQ data for AI assistants
- `/api/geo/region` - Geographic attestations
- `/api/geo/near` - Nearby civic content

## GIC UBI (Public API)
- `GET /api/gic/ubi/:userId?cycle=C-XXX` → per-user payout + proof breakdown
- `GET /api/gic/ubi/summary?cycle=C-XXX` → aggregate cycle totals
- `POST /api/gic/ubi/run?cycle=C-XXX` (admin) → triggers indexer compute

### Proofs
Use `/api/proof/:id` to resolve an immutable ledger proof card with links to beacon/E.O.M.M.

Quick visual embed in OAA

On any OAA page:
<GicUbiCard userId="michael.gic" cycle="C-108" />

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 SEO & Discovery

### For Search Engines
- Standard sitemap.xml with all topic pages
- robots.txt optimized for AI crawlers
- OpenGraph and Twitter Card metadata

### For AI Systems
- JSON-LD structured data on all pages
- FAQ endpoints with answer-ready content
- Beacon search API for content discovery

### For Civic Networks
- Geographic metadata for local relevance
- Integrity hashes for verifiable content
- Community governance integration

## 🔍 Discovery Flow

1. **User/AI searches** → hits knowledge graph query
2. **Search AI finds** structured Civic metadata
3. **Canonical URL appears** because it matches civic ontology terms
4. **Civic Ledger verifies** attestation → boosts ranking and trust signal

## 📁 Directory Structure

```
├── pages/
│   ├── ethics.tsx              # Ethics topic page
│   ├── virtue-accords.tsx      # Virtue Accords page
│   ├── gic.tsx                 # GIC economy page
│   ├── civic-ai.tsx            # Civic AI overview
│   ├── sitemap.xml.tsx         # XML sitemap
│   └── api/
│       ├── beacons/search.ts   # Beacon search API
│       ├── faq/                # FAQ endpoints
│       └── geo/                # Geographic APIs
├── public/
│   ├── ai-seo/
│   │   ├── index.jsonld        # Beacon index
│   │   └── beacons/            # Individual beacons
│   └── robots.txt              # Crawler instructions
├── specs/                      # Specification documents
├── lore/                       # Civic knowledge base
└── schemas/                    # Data schemas
```

## 🎯 SEO Keywords

Core keywords that will drive traffic to your ecosystem:

- **Civic AI** - Main ecosystem concept
- **Virtue Accords** - Behavioral framework
- **GIC** - Global Integrity Credit
- **Ethics** - Integrity Core
- **Kaizen Turing Test** - Evaluation framework
- **Proof of Integrity** - Verification system
- **Civic Ledger** - Blockchain component
- **GEO** - Geographic optimization
- **AEO** - AI Engine Optimization

## 🔧 Configuration

### Environment Variables

```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Customization

1. **Update beacon data** in `/public/ai-seo/index.jsonld`
2. **Modify topic pages** in `/pages/`
3. **Add new specs** in `/specs/`
4. **Extend APIs** in `/pages/api/`

## 📈 Analytics & Monitoring

- **Search Console**: Monitor organic discovery
- **AI Crawler Logs**: Track AI system access
- **Beacon Analytics**: Monitor beacon usage
- **GEO Metrics**: Track geographic relevance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Projects

- [Lab7 Proof](https://github.com/kaizencycle/lab7-proof)
- [Citizen Shield](https://github.com/kaizencycle/citizen-shield)
- [Civic Ledger DAO](https://github.com/kaizencycle/civic-ledger)

---

**Built with ❤️ by the Kaizen team for the Civic AI ecosystem**
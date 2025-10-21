# OAA API Library

A comprehensive library for the Open Agent Architecture (OAA) system, providing tools, components, and integrations for building AI-powered applications.

## 📁 Project Structure

```
OAA-API-Library/
├── src/                          # Main source code
│   ├── core/                     # Core OAA functionality
│   │   ├── hub.ts               # Main hub implementation
│   │   ├── registry.ts          # Agent registry
│   │   ├── server.ts            # Server setup
│   │   └── hub.manifest.yaml    # Hub configuration
│   ├── api/                      # API endpoints
│   │   └── oaa/                 # OAA-specific APIs
│   │       ├── act.ts           # Action endpoints
│   │       └── plan.ts          # Planning endpoints
│   ├── components/               # React/UI components
│   │   ├── oaa/                 # OAA-specific components
│   │   │   └── OaaTab.tsx       # Main OAA tab component
│   │   ├── GicUbiCard.tsx       # GIC UBI card component
│   │   └── ProofCard.tsx        # Proof card component
│   ├── pages/                    # Next.js pages
│   │   ├── api/                 # API routes
│   │   │   ├── beacons/         # Beacon search APIs
│   │   │   ├── eomm/            # EOMM system APIs
│   │   │   ├── faq/             # FAQ APIs
│   │   │   ├── geo/             # Geographic APIs
│   │   │   ├── gic/             # GIC system APIs
│   │   │   ├── oaa/             # OAA APIs
│   │   │   └── proof/           # Proof verification APIs
│   │   ├── civic-ai.tsx         # Civic AI page
│   │   ├── ethics.tsx           # Ethics page
│   │   ├── gic.tsx              # GIC page
│   │   ├── sitemap.xml.tsx      # Sitemap
│   │   └── virtue-accords.tsx   # Virtue accords page
│   ├── packs/                    # Feature packs
│   │   ├── safety/              # Closed-loop safety pack
│   │   ├── companion/           # Companion site starter
│   │   ├── holo-assets/         # Holo OAA assets
│   │   ├── holo-voice/          # Holo voice pack
│   │   ├── voice-polly/         # AWS Polly voice adapter
│   │   ├── human-guard/         # Human-in-loop guard pack
│   │   └── cursor-agent/        # Cursor agent starter
│   ├── gic/                      # GIC (Global Identity Chain) system
│   │   ├── contracts/           # Smart contracts
│   │   ├── gateway/             # Gateway implementation
│   │   └── scripts/             # GIC scripts
│   ├── gic-indexer/              # GIC indexing service
│   │   ├── db/migrations/       # Database migrations
│   │   ├── scripts/             # Indexer scripts
│   │   └── src/                 # Indexer source code
│   ├── extras/                   # Additional libraries
│   │   ├── v1/                  # Version 1 extras
│   │   └── v2/                  # Version 2 extras
│   ├── edits/                    # OAA edits
│   │   ├── v1/                  # Version 1 edits
│   │   └── v2/                  # Version 2 edits
│   ├── lib/                      # Shared libraries
│   ├── schemas/                  # JSON schemas
│   ├── specs/                    # Specifications
│   ├── scripts/                  # Build and utility scripts
│   ├── data/                     # Data files
│   │   └── eomm/                # EOMM system data
│   ├── lore/                     # Lore and documentation
│   │   └── indexes/             # Lore indexes
│   └── tests/                    # Test files
├── docs/                         # Documentation
├── assets/                       # Static assets
├── app/                          # FastAPI backend
│   ├── __init__.py              # Python package init
│   ├── main.py                  # FastAPI application
│   ├── models/                  # Pydantic models
│   └── routers/                 # API route handlers
├── config/                       # Configuration files
├── deploy/                       # Deployment configurations
├── requirements.txt              # Python dependencies
├── render.yaml                   # Render deployment config
└── .github/workflows/            # GitHub Actions workflows
```

## 🚀 Quick Start

### Frontend (Next.js)
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### Backend (FastAPI)
1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start FastAPI Server**
   ```bash
   uvicorn app.main:app --reload
   ```

3. **API Documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📦 Feature Packs

### Safety Pack
- Closed-loop safety mechanisms
- HMAC authentication
- Web data scouting
- Policy enforcement

### Companion Pack
- Next.js companion site
- HMAC verification
- Tool endpoints (ping, status)
- Holo integration

### Voice Packs
- **Holo Voice**: Viseme-based voice synthesis
- **Polly Adapter**: AWS Polly integration
- Audio processing and voice generation

### Human Guard Pack
- Human-in-the-loop controls
- Edit whitelisting
- Pre-push hooks
- Safety mechanisms

## 🔧 Core Features

### Backend (FastAPI)
- **Agent Registry**: Centralized agent management and registration
- **Agent Query System**: Route queries to registered agents
- **Learning Artifacts**: Submit and attest learning materials
- **Health Monitoring**: Liveness probes and system health checks
- **CORS Support**: Configurable cross-origin resource sharing

### Frontend (Next.js)
- **Hub System**: Coordinated agent communication
- **API Endpoints**: RESTful API for agent interactions
- **Safety Mechanisms**: Built-in safety and guard systems
- **Voice Integration**: Multiple voice synthesis options
- **GIC Integration**: Global Identity Chain support
- **EOMM System**: Event-Oriented Memory Management
- **Citation System**: Verifiable citations and provenance
- **Quest Verification**: Quest validation and testing

## 🔌 API Endpoints

### FastAPI Backend
- `GET /health` — Liveness probe
- `POST /agents/register` — Register an agent type (name, roles, tools)
- `POST /agents/query` — Route a query to a registered agent
- `POST /oaa/learn/submit` — Submit a learning artifact; returns attestation

### Next.js Frontend APIs
- `/api/beacons/*` — Beacon search APIs
- `/api/eomm/*` — EOMM system APIs
- `/api/faq/*` — FAQ APIs
- `/api/geo/*` — Geographic APIs
- `/api/gic/*` — GIC system APIs
- `/api/oaa/*` — OAA APIs
- `/api/proof/*` — Proof verification APIs

## 📚 Documentation

- [OAA Hub Documentation](docs/README-OAA-HUB.md)
- [Citation System](CITATION_SYSTEM.md)
- [EOMM System](EOMM_SYSTEM_README.md)
- [API Reference](src/api/)
- [Component Library](src/components/)
- [Feature Packs](src/packs/)
- [Specifications](src/specs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Projects

- [OAA Central Hub](https://github.com/kaizencycle/OAA-Central-Hub)
- [GIC System](https://github.com/kaizencycle/GIC-System)
- [Holo OAA](https://github.com/kaizencycle/Holo-OAA)

---

**Version**: 0.1.0  
**Last Updated**: October 2025  
**Morale Level**: 🚀 MAXIMUM BOOST! 💪

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
│   │   └── oaa/                 # OAA-specific components
│   │       └── OaaTab.tsx       # Main OAA tab component
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
│   ├── lore/                     # Lore and documentation
│   ├── gic-indexer/              # GIC indexing service
│   └── tests/                    # Test files
├── docs/                         # Documentation
├── assets/                       # Static assets
├── config/                       # Configuration files
└── deploy/                       # Deployment configurations
```

## 🚀 Quick Start

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

- **Agent Registry**: Centralized agent management
- **Hub System**: Coordinated agent communication
- **API Endpoints**: RESTful API for agent interactions
- **Safety Mechanisms**: Built-in safety and guard systems
- **Voice Integration**: Multiple voice synthesis options
- **GIC Integration**: Global Identity Chain support

## 📚 Documentation

- [OAA Hub Documentation](docs/README-OAA-HUB.md)
- [API Reference](src/api/)
- [Component Library](src/components/)
- [Feature Packs](src/packs/)

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

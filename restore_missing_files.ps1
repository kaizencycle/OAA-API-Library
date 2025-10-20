# Script to restore missing files from remote main branch

# Create necessary directories
New-Item -ItemType Directory -Path "src/lore/indexes" -Force
New-Item -ItemType Directory -Path "src/pages/api/beacons" -Force
New-Item -ItemType Directory -Path "src/pages/api/eomm" -Force
New-Item -ItemType Directory -Path "src/pages/api/faq" -Force
New-Item -ItemType Directory -Path "src/pages/api/geo" -Force
New-Item -ItemType Directory -Path "src/pages/api/gic/ubi" -Force
New-Item -ItemType Directory -Path "src/pages/api/proof" -Force
New-Item -ItemType Directory -Path "src/schemas" -Force
New-Item -ItemType Directory -Path "src/specs" -Force

# Restore files
git show origin/main:lore/indexes/by-accord.jsonld > src/lore/indexes/by-accord.jsonld
git show origin/main:lore/indexes/by-region.jsonld > src/lore/indexes/by-region.jsonld

git show origin/main:pages/api/beacons/search.ts > src/pages/api/beacons/search.ts
git show origin/main:pages/api/eomm/ingest.ts > src/pages/api/eomm/ingest.ts
git show origin/main:pages/api/eomm/validate.ts > src/pages/api/eomm/validate.ts
git show origin/main:pages/api/faq/civic-ai.ts > src/pages/api/faq/civic-ai.ts
git show origin/main:pages/api/faq/ethics.ts > src/pages/api/faq/ethics.ts
git show origin/main:pages/api/faq/gic.ts > src/pages/api/faq/gic.ts
git show origin/main:pages/api/faq/virtue-accords.ts > src/pages/api/faq/virtue-accords.ts
git show origin/main:pages/api/geo/near.ts > src/pages/api/geo/near.ts
git show origin/main:pages/api/geo/region.ts > src/pages/api/geo/region.ts
git show origin/main:pages/api/gic/ubi/[userId].ts > src/pages/api/gic/ubi/[userId].ts
git show origin/main:pages/api/gic/ubi/run.ts > src/pages/api/gic/ubi/run.ts
git show origin/main:pages/api/gic/ubi/summary.ts > src/pages/api/gic/ubi/summary.ts
git show origin/main:pages/api/proof/[id].ts > src/pages/api/proof/[id].ts

git show origin/main:pages/civic-ai.tsx > src/pages/civic-ai.tsx
git show origin/main:pages/ethics.tsx > src/pages/ethics.tsx
git show origin/main:pages/gic.tsx > src/pages/gic.tsx
git show origin/main:pages/sitemap.xml.tsx > src/pages/sitemap.xml.tsx
git show origin/main:pages/virtue-accords.tsx > src/pages/virtue-accords.tsx

git show origin/main:schemas/attestation.schema.json > src/schemas/attestation.schema.json
git show origin/main:schemas/eomm-entry.schema.json > src/schemas/eomm-entry.schema.json
git show origin/main:schemas/gic-ubi.schema.json > src/schemas/gic-ubi.schema.json

git show origin/main:scripts/README-quest-verifier.md > src/scripts/README-quest-verifier.md
git show origin/main:scripts/citation-hygiene.sh > src/scripts/citation-hygiene.sh
git show origin/main:scripts/eomm-sync.mjs > src/scripts/eomm-sync.mjs
git show origin/main:scripts/test-quest-verifier.mjs > src/scripts/test-quest-verifier.mjs

git show origin/main:specs/01-overview.md > src/specs/01-overview.md
git show origin/main:specs/02-attestations.md > src/specs/02-attestations.md
git show origin/main:specs/03-agent-ethics.md > src/specs/03-agent-ethics.md
git show origin/main:specs/04-ai-seo-geo.md > src/specs/04-ai-seo-geo.md
git show origin/main:specs/05-proof-pipeline.md > src/specs/05-proof-pipeline.md
git show origin/main:specs/06-code-verification.md > src/specs/06-code-verification.md
git show origin/main:specs/07-incentives-gic.md > src/specs/07-incentives-gic.md
git show origin/main:specs/09-cultural-kernel-archetypes.md > src/specs/09-cultural-kernel-archetypes.md
git show origin/main:specs/10-yautja-cultural-accord.md > src/specs/10-yautja-cultural-accord.md

git show origin/main:gic-indexer/render.yaml > src/gic-indexer/render.yaml
git show origin/main:gic-indexer/scripts/migrate.js > src/gic-indexer/scripts/migrate.js
git show origin/main:gic-indexer/src/server.ts > src/gic-indexer/src/server.ts
git show origin/main:gic-indexer/tsconfig.json > src/gic-indexer/tsconfig.json

Write-Host "All missing files have been restored!"

# Civic AI Native Stack — AI-SEO / GEO Public Interface

**Spec Version:** 0.1.0  
**Last Updated:** 2025-10-18  

---

## 1. Purpose

To make Civic AI data discoverable (*SEO*) and civically anchored (*GEO*),  
ensuring search engines, AI crawlers, and citizens access verifiable reflections by meaning **and place.**

---

## 2. AI-SEO Beacon Model

Each attestation emits a JSON-LD beacon in `/public/ai-seo/beacons/*.jsonld` with fields:

```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Cycle C-108 Clock-In",
  "author": "Michael Judan",
  "url": "https://oaa-api-library.vercel.app/beacons/c108",
  "keywords": ["Civic AI","Integrity","Reflection"],
  "dateModified": "2025-10-18T07:58:00-04:00",
  "inLanguage": "en",
  "publisher": { "@type": "Organization", "name": "Civic Ledger DAO" },
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
```

All beacons aggregate into index.jsonld with DataFeed type for crawler indexing.

---

## 3. GEO Extension

Attach to each beacon (optional but recommended):

```json
"geo": {
  "@type": "GeoCoordinates",
  "latitude": 40.7128,
  "longitude": -74.0060
},
"location": {
  "@type": "AdministrativeArea",
  "name": "New York City, USA"
},
"jurisdiction": {
  "@type": "GovernmentOrganization",
  "name": "Civic DAO – Northeast Cluster",
  "code": "US-NE"
}
```

---

## 4. Discovery APIs

| Endpoint | Query Params | Purpose |
|----------|--------------|---------|
| GET /api/geo/near | lat,lon,r | Find reflections within radius (meters) |
| GET /api/geo/region | code,name | Filter by jurisdiction or region |
| GET /api/beacons/search | q,keyword | Full-text semantic search on beacons |

---

## 5. Ranking Logic for Civic Search

```
rankingScore = (integrityScore × 0.6) + (geoRelevance × 0.2) + (recency × 0.2)
```

- **integrityScore** → Ledger verification (0–1)
- **geoRelevance** → distance-weighted GEO score
- **recency** → time-decay factor (1 at T0 → 0.5 after 90 days)

---

## 6. Ethical Visibility Rules

1. No algorithm may demote truthful civic content for political or commercial bias.
2. All beacons must expose provenance (integrityHash,attestation.signature).
3. Geo-filtered results must display privacy bounds (radius ± 100 m).
4. Search logs are publicly auditable through Civic Ledger events.

---

## 7. Implementation Checklist

- schemas/attestation.schema.json → includes geo fields ✅
- pages/api/geo/near.ts and region.ts → deployed ✅
- public/ai-seo/beacons/ → JSON-LD feeds auto-built on commit ✅
- Render build hook → triggers crawler ping on release ✅

---

## 8. Vision Statement

> "Where truth lives on a map, civilization learns to walk upright."  
> — Civic AI Manifest v0.1.0
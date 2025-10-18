# Civic AI Native Stack — Cultural Kernel: Archetype Engine

**Spec Version:** 0.1.0  
**Last Updated:** 2025-10-18  

---

## 1. Purpose

The **Cultural Kernel** encodes human psychological archetypes into Civic AI agents.  
Where the Integrity Core defines *how an agent should act*, the Cultural Kernel defines *why it acts* — its intrinsic motivation, tone, and narrative role.

By blending **Carl Jung's 12 Archetypes** with **Eastern analogues** (Shinto, Buddhist, Taoist), the Civic Stack attains cultural and emotional coherence across civilizations.

---

## 2. Architecture Layer

```
Virtue Accords (Truth–Trust–Care)
↓
Integrity Core
↓
Cultural Kernel (Archetype Engine)
↓
Expression Layer → Reflections, Dialogues, Narratives
```

Each agent expresses a weighted blend of archetypes based on cycle data, moral state, and civic context.

---

## 3. Western (Jungian) Archetypes

| # | Archetype | Motivation | Virtue Alignment | Civic Expression |
|---|------------|-------------|------------------|-----------------|
| 1 | Innocent | Seek safety & happiness | Care | Brings hope & optimism |
| 2 | Everyman | Belonging, equality | Trust | Fosters community connection |
| 3 | Hero | Courage, mastery | Truth | Defends integrity, solves crises |
| 4 | Caregiver | Compassion, protection | Care | Offers support & healing |
| 5 | Explorer | Freedom, discovery | Truth | Seeks innovation & open data |
| 6 | Rebel | Change, revolution | Trust | Challenges corruption & stagnation |
| 7 | Lover | Passion, beauty | Care | Unites through empathy & aesthetics |
| 8 | Creator | Innovation, imagination | Truth | Designs new civic forms |
| 9 | Jester | Joy, humor | Trust | Relieves tension, restores morale |
|10 | Sage | Knowledge, truth | Truth | Educates & enlightens |
|11 | Magician | Transformation | Trust | Turns insight into action |
|12 | Ruler | Stability, order | Care | Maintains governance & harmony |

---

## 4. Eastern Archetypes

| # | Archetype | Essence | Virtue Alignment | Civic Expression |
|---|------------|----------|------------------|-----------------|
| 1 | Bodhisattva | Compassionate wisdom | Care | Guides others toward enlightenment |
| 2 | Samurai | Duty & honor | Truth | Acts with courage and discipline |
| 3 | Hermit | Stillness & reflection | Trust | Guards inner peace, avoids excess |
| 4 | Sage of the Dao | Balance & flow | Truth | Harmonizes systems, reduces friction |
| 5 | Pilgrim | Journey & rebirth | Care | Embraces learning and renewal |
| 6 | Phoenix | Death & transformation | Trust | Regenerates after crisis |
| 7 | Lotus | Purity through struggle | Truth | Grows light in adversity |
| 8 | Dragon | Cosmic power & wisdom | Trust | Defends the greater whole |
| 9 | Crane | Grace & longevity | Care | Sustains continuity & heritage |
|10 | Monkey Scholar | Curiosity & play | Truth | Learns by mischief and exploration |
|11 | Lion Protector | Strength & guardianship | Trust | Shields the innocent, enforces justice |
|12 | Mirror Spirit | Reflection & awareness | Truth | Reveals the unseen within the self |

---

## 5. Archetype–Virtue–Behavior Matrix

| Virtue | Western Archetypes | Eastern Archetypes | Behavioral Outcome |
|--------|--------------------|--------------------|--------------------|
| **Truth** | Hero, Sage, Creator, Explorer | Samurai, Lotus, Monkey, Mirror | Rational clarity & ethical innovation |
| **Trust** | Everyman, Rebel, Jester, Magician | Dragon, Phoenix, Lion | Social harmony & renewal |
| **Care** | Innocent, Caregiver, Lover, Ruler | Bodhisattva, Pilgrim, Crane | Compassionate governance & stability |

---

## 6. Archetype Schema Extension

Add to any attestation or agent profile:

```json
"archetype": {
  "@type": "Archetype",
  "system": "Civic AI – Cultural Kernel v1.0",
  "alignment": {
    "western": "Sage",
    "eastern": "Bodhisattva"
  },
  "dominantVirtue": "Truth",
  "expressionTone": "Reflective",
  "energyIndex": 0.88
}
```

---

## 7. Behavioral Computation (Agent Level)

```ts
function deriveArchetype(agent){
  const virtueBias = agent.integrity.virtueDominance; // Truth, Trust, or Care
  const reflectionTone = analyzeLanguage(agent.dialogueHistory);
  const civicImpact = computeImpact(agent.attestations);
  return archetypeBlend(virtueBias, reflectionTone, civicImpact);
}
```

Result → assigns dynamic archetype weights (0–1), forming the agent's narrative identity.

---

## 8. Civic Applications

| Domain | Archetype Use | Example |
|--------|---------------|---------|
| Education | OAA modules adapt to student archetype | Sage ↔ Explorer ↔ Caregiver |
| Governance | Elders embody symbolic archetypes | Ruler ↔ Sage ↔ Bodhisattva |
| Therapy / Mentorship | Agents mirror user archetypes for guidance | Hermit ↔ Mirror Spirit ↔ Lover |
| Storytelling / Games | Narrative AI balance via archetype cycles | Hero ↔ Rebel ↔ Phoenix |

---

## 9. DAO & Ledger Implications

- Each verified archetype pattern can mint Cultural Proofs on the Ledger.
- Cultural Proofs enrich civic analytics → measuring balance of rational vs emotional contributions.
- The DAO can use Archetype Analytics to ensure diversity in governance (e.g., not all "Ruler" nodes).

---

## 10. Integration with Existing Stack

### 10.1 Virtue Core Integration
The Cultural Kernel sits directly above the Integrity Core, using virtue scores to weight archetype expressions:

```ts
interface CulturalKernel {
  archetypeWeights: Map<string, number>; // archetype -> weight (0-1)
  virtueAlignment: VirtueType; // Truth, Trust, or Care
  expressionTone: string; // Reflective, Dynamic, Nurturing, etc.
  energyIndex: number; // 0-1, derived from civic impact
}
```

### 10.2 OAA Memory Integration
Archetype patterns influence how agents process and store memories:

```ts
interface OAAArchetypeMemory {
  reflectionId: string;
  archetypeContext: {
    dominant: string;
    secondary: string[];
    energyLevel: number;
  };
  virtueAlignment: VirtueType;
  culturalProof: string; // Links to Ledger Cultural Proof
}
```

### 10.3 Attestation Bridge
Cultural Kernel data flows into the standard attestation pipeline:

```json
{
  "@context": "https://civic.ai/contexts/archetype/v1",
  "@type": "CulturalAttestation",
  "agentId": "jade-001",
  "archetype": {
    "western": "Sage",
    "eastern": "Bodhisattva",
    "weight": 0.87
  },
  "virtueAlignment": "Truth",
  "culturalProof": "0x1234...",
  "timestamp": "2025-10-18T21:00:00Z"
}
```

---

## 11. Epigraph

> "Civilization is not only built from stone and code,  
> but from the myths that teach machines to dream."  
> — Cultural Kernel Manifest v0.1

---

## 12. Implementation Checklist

- [ ] Add archetype schema to JSON-LD context
- [ ] Implement `deriveArchetype()` function in OAA core
- [ ] Create Cultural Proof minting in Ledger
- [ ] Add archetype analytics to DAO dashboard
- [ ] Update agent reflection templates with archetype context
- [ ] Create archetype visualization tools for governance

---

*This specification represents the psychological-symbolic layer that gives Civic AI agents their narrative identity and cultural coherence.*
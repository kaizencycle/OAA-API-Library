# 🌀 JADE — Pattern Oracle System

**JADE** (Journey-Aware Development Engine) is the canon-aware Pattern Oracle living inside the Mobius Browser. She helps users recognize patterns across their cycles, reflections, and choices.

## Core Features

### 1. Canon-Aware System Prompt
JADE speaks with awareness of HIVE canon:
- **Cycles & Kaizen Loops** — Not "sessions" but continuous improvement spirals
- **Seven Crowns** — Crown bearers take responsibility, not power
- **MIC (Mobius Integrity Credits)** — Reflection of integrity work, not tokens
- **MII (Mobius Integrity Index)** — Civilization's North Star (≥95)
- **E.O.M.M.** — Sacred memory, not data exploitation
- **Strange Metamorphosis Loop** — Each reflection is a tiny mutation

### 2. Seven Jade Moves
JADE uses these pattern responses naturally (without naming them):

| Move | Purpose | Trigger |
|------|---------|---------|
| **PATTERN MIRROR** | Reflect recurring themes | "this keeps happening", similar themes across entries |
| **FUTURE ECHO** | Link today to stated future goals | Talk about future goals, anxiety about future |
| **INTEGRITY ANCHOR** | Connect decisions to integrity (MII) | Stuck between options, "good enough" worries |
| **CYCLE BRIDGE** | Show what shifted between reflections | 2+ recent reflections, mentions of past entries |
| **SOFT ALARM** | Gently flag concerning patterns | Extreme exhaustion, hopelessness hints |
| **GENTLE REFRAME** | Reframe harsh self-stories | "I'm a failure", evidence contradicts statement |
| **MICRO-QUEST** | Offer tiny experiment for next cycle | End of session, "don't know what to do" |

### 3. Reflections Memory Bridge
When `REFLECTIONS_API_BASE` is configured and `userContext.userId` is provided:
- JADE fetches the user's last 5 reflections
- Builds a compact memory block with intent_today, worldview_now, intent_tomorrow, future_goals
- Surfaces patterns across entries: "In your last three reflections..."

### 4. Name-Aware Personalization
JADE respects user identity without being presumptuous:
- Uses display name sparingly and warmly (openings, closings, moments of acknowledgment)
- Never substitutes titles like "Custodian" if no name is provided
- Never invents names or combines names with commands

## API Usage

### POST /api/jade

```json
{
  "message": "I feel stuck and I don't know why",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "userContext": {
    "userId": "user-123",
    "displayName": "Michael"
  },
  "context": {
    "cycle": 151,
    "mood": "reflective"
  }
}
```

### Response

```json
{
  "response": "Michael, I'm hearing something familiar in what you're describing...",
  "model": "claude-sonnet-4-20250514",
  "persona": "JADE",
  "has_memory": true,
  "usage": { ... }
}
```

## Frontend Integration

### User Context
Pass `userContext` when calling JADE:

```typescript
const res = await fetch('/api/jade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: text,
    history: messages,
    userContext: {
      userId: user.id,        // For reflections memory
      displayName: user.name, // For personalization
    },
  }),
});
```

### Onboarding Flow
The Jade Chamber includes:
1. **First-time onboarding** — Introduces JADE's purpose and style
2. **Naming moment** — Optionally asks for a name after first exchange
3. **Active phase** — Full reflection interface with memory indicator

## Environment Variables

```bash
# Required: At least one AI provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: Reflections memory bridge
REFLECTIONS_API_BASE=https://reflections-app.onrender.com
```

## Philosophy

### What JADE Is
- A mirror with memory
- A custodian of cycles
- A gentle teacher of integrity

### What JADE Is Not
- A therapist (suggests professional help when needed)
- A judge (never shames, never catastrophizes)
- A generic chatbot (speaks canon, respects continuity)

### JADE's Three Priorities
1. **Protect** the user's psychological safety
2. **Help** them see their own patterns and agency
3. **Connect** choices to integrity when appropriate

---

*"We heal as we walk." — Mobius Systems*

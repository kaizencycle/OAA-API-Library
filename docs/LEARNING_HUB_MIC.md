# 📚 OAA Learning Hub - MIC Rewards System

**Cycle:** C-170  
**Type:** Feature  
**Primary Area:** apps / api  

---

## Summary

The Learning Hub is a **learn-to-earn** system where users complete educational modules about Constitutional AI, Integrity Economics, and Mobius principles to earn **Mobius Integrity Credits (MIC)**.

## Key Features

### 🎓 Learning Modules
- **Constitutional AI Fundamentals** (Beginner, 50 MIC)
- **Integrity Economics & MIC** (Intermediate, 75 MIC)
- **Drift Suppression Mechanisms** (Advanced, 100 MIC)
- **The Three Covenants in Practice** (Beginner, 40 MIC)
- **Multi-Agent Democratic Systems** (Intermediate, 65 MIC)

### 💰 MIC Reward Formula

```
MIC = baseReward × accuracy × integrityScore × giiMultiplier × difficultyMultiplier
```

**Example:**
- Module: Constitutional AI 101 (50 MIC base)
- User scores 90% accuracy
- User integrity: 0.85
- GII: 0.92 (healthy)
- Streak bonus: +5% (3-day streak)

**Result:** `50 × 0.9 × 0.85 × 1.0 × 1.0 × 1.05 + 20 = ~60 MIC`

### 🚦 Circuit Breaker Integration

| GII Level | Status | Multiplier |
|-----------|--------|------------|
| ≥ 0.90 | Healthy | 100% |
| ≥ 0.75 | Warning | 80% |
| ≥ 0.60 | Critical | 50% |
| < 0.60 | **Halted** | 0% |

### 📈 Progress Tracking
- Total MIC earned
- Modules completed
- Learning streaks (with bonuses)
- Level & XP system
- Achievement badges

---

## API Endpoints

### FastAPI Backend (`/api/learning/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/modules` | List all learning modules |
| GET | `/modules/{id}` | Get module with questions |
| POST | `/session/start` | Start a learning session |
| POST | `/session/{id}/answer` | Submit quiz answer |
| POST | `/session/{id}/complete` | Complete & mint reward |
| GET | `/users/{id}/progress` | Get user progress |
| GET | `/estimate-reward` | Estimate potential reward |
| GET | `/system-status` | Circuit breaker status |

### Next.js API Routes (`/pages/api/learning/`)

Proxy routes that connect to FastAPI backend with demo fallbacks:
- `/api/learning/modules` - Module listing
- `/api/learning/modules/[moduleId]` - Module details
- `/api/learning/session/start` - Start session
- `/api/learning/session/[sessionId]/complete` - Complete session
- `/api/learning/progress/[userId]` - User progress
- `/api/learning/system-status` - System health

---

## Components

### `LearningProgressTracker.tsx`
Main dashboard showing:
- Available modules grid
- User progress summary (MIC, streak, level)
- XP progress bar
- Badge collection
- Filter by difficulty/status

### `QuizModule.tsx`
Interactive quiz with:
- Question-by-question progression
- Immediate feedback with explanations
- Score tracking
- Completion screen with rewards
- Bonus breakdown

### `pages/learn.tsx`
Full-page Learning Hub with navigation and state management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Learning Hub UI                          │
│  LearningProgressTracker → QuizModule → CompletionScreen    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes                         │
│  /api/learning/* (with demo fallbacks)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  /api/learning/* (app/main.py)                              │
├─────────────────────────────────────────────────────────────┤
│  MICMintingService        │  LearningStore                  │
│  - calculate_reward()     │  - get_modules()                │
│  - mint_reward()          │  - create_session()             │
│  - estimate_reward()      │  - submit_answer()              │
│  - calculate_gii_mult()   │  - complete_session()           │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Created

### Backend (Python)
- `app/models/learning.py` - Pydantic schemas
- `app/models/__init__.py` - Model exports
- `app/services/mic_minting.py` - MIC reward logic
- `app/services/learning_store.py` - In-memory data store
- `app/services/__init__.py` - Service exports
- `app/main.py` - Added 8 learning endpoints

### Frontend (TypeScript/React)
- `components/LearningProgressTracker.tsx` - Dashboard component
- `components/QuizModule.tsx` - Quiz component
- `pages/learn.tsx` - Learning Hub page

### API Routes (Next.js)
- `pages/api/learning/modules.ts`
- `pages/api/learning/modules/[moduleId].ts`
- `pages/api/learning/session/start.ts`
- `pages/api/learning/session/[sessionId]/complete.ts`
- `pages/api/learning/progress/[userId].ts`
- `pages/api/learning/system-status.ts`

### Documentation
- `docs/LEARNING_HUB_MIC.md` - This file

---

## Usage

### Demo Mode (No Backend Required)

1. Start the Next.js dev server
2. Navigate to `/learn`
3. Complete modules with mock data
4. See calculated MIC rewards

### Production Mode

1. Set `OAA_API_URL` environment variable
2. Deploy FastAPI backend
3. Connect user authentication
4. Enable real MIC minting

---

## Reward Thresholds

- **Minimum Accuracy:** 70%
- **Minimum Integrity Score:** 0.70
- **Minimum GII for Minting:** 0.60

### Streak Bonuses
- 3-day: +5%
- 7-day: +10%
- 14-day: +15%
- 30-day: +25%

### Other Bonuses
- Perfect Score (100%): +10%
- First Completion: +20 MIC flat

---

## Example Quiz Flow

```
1. User starts "Constitutional AI 101"
   → Session created, questions loaded

2. User answers Q1 (Easy, 10 pts) ✓
   → Score: 10/10, explanation shown

3. User answers Q2 (Medium, 15 pts) ✓
   → Score: 25/25

4. User answers Q3 (Hard, 20 pts) ✗
   → Score: 25/45

5. Quiz completes
   → Accuracy: 66.7%
   → Below 70% threshold
   → Reward: 0 MIC (can retry)

Alternative: User scores 100%
   → Accuracy: 100%
   → Base: 50 MIC
   → × Accuracy (1.0) = 50
   → × Integrity (0.85) = 42.5
   → × GII (1.0) = 42.5
   → + Perfect bonus (10%) = 46.75
   → + First completion = 66.75
   → Final: ~67 MIC
```

---

## Security Considerations

1. **Rate Limiting:** Sessions limited per user
2. **Answer Validation:** Server-side correctness check
3. **Duplicate Prevention:** One completion per module
4. **Circuit Breaker:** GII-based minting halt
5. **Integrity Check:** User score validation

---

## Future Enhancements

- [ ] Leaderboards
- [ ] Social sharing
- [ ] More modules
- [ ] Video content
- [ ] Peer review system
- [ ] Custom module creation

---

*Built with the Three Covenants 🌊*

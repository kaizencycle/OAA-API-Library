# Agent Operating Rules (Anti-Loop Kit)

This repo uses a loop guard + cooldown pattern for all background agents.

## Hard stops
- **Max steps:** 12
- **Timeout:** 180s
- **Abort phrases:**
  - "I think the issue is with the parameter names"
  - "Let me check the function definition again"
  - "retrying the same action"
  - "diff is empty"

## Guard files
- `dev/loop_guard.json`
  - Tracks the last change hash and a `noopCount`.
  - If a proposed change has the **same hash** or **empty diff**, increment `noopCount`.  
    When `noopCount >= maxNoop`, **exit**.
- `dev/agent_cooldown.json`
  - Enforces a minimum interval between runs.
  - If `Date.now() < nextAllowedAt`, **exit**; otherwise set `nextAllowedAt = now + cooldownSec`.

## Required agent preflight (put this in your task prompt)
1. Read `dev/agent_cooldown.json`. If now < `nextAllowedAt` → **STOP** (write nothing).
2. Plan changes. Compute a `planHash` = sha256 of the planned diff (or "no-diff").
3. Read `dev/loop_guard.json`.
   - If diff is empty **or** `planHash === lastHash` → `noopCount++`.  
     - If `noopCount >= maxNoop` → **STOP** with message `noop limit reached`.
     - Else write updated `noopCount` and **STOP**.
   - Else apply changes → set `lastHash = planHash` and `noopCount = 0`.
4. Commit only if `git status --porcelain` is non-empty.
5. Update cooldown: set `nextAllowedAt = now + cooldownSec`.

## Idempotent edits
- Parse → modify → serialize JSON/YAML. Never append duplicate blocks.
- If the output equals the current file, **do not commit**.

## Git hygiene
- Work on a dedicated branch (e.g., `chore/incident-bot`).
- Use PRs; avoid force pushes from agents.

## Agent Task Prompt Template

```
PRE-FLIGHT
1) Read dev/agent_cooldown.json → if Date.now() < nextAllowedAt → STOP (no changes).
2) Plan changes and produce a single stringified "plan" (the diff or intent).
3) node scripts/planHash.mjs "<path-to-plan-file-or-string>" → get PLAN_HASH.
4) Read dev/loop_guard.json:
   - If no diff or PLAN_HASH === lastHash:
       - node scripts/loopGuardUpdate.mjs noop → if noop >= maxNoop → STOP.
       - STOP with message "noop; backoff".
   - Else continue.

APPLY
5) Make idempotent edits (parse/modify/serialize).
6) If git status is empty → node scripts/loopGuardUpdate.mjs noop → STOP.

COMMIT + COOLDOWN
7) git add -A && git commit -m "chore(agent): <summary>" && git push (PR only).
8) node scripts/loopGuardUpdate.mjs "hash:PLAN_HASH"
9) node scripts/loopGuardUpdate.mjs cooldown
10) STOP with a brief SUMMARY of changed files.
```

## Success Criteria Pattern

At the top of any background task prompt, add:

```
YOU MUST STOP when:
- All target files exist with the required keys/fields, AND
- `git status --porcelain` is empty after format & lint, AND
- The last two tool logs are identical.

Hard limits: ≤12 steps, ≤3 minutes. If limits reached → STOP with SUMMARY.
```
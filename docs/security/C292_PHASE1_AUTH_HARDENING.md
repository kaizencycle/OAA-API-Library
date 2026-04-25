# C-292 Phase 1 — OAA Auth Hardening

## Scope

Phase 1 addresses the highest-risk OAA authentication issues from the C-292 mesh cleanup tracker.

## Changes

### JWT secret fail-closed

`src/lib/auth/jwt.ts` now:

- Requires `JWT_SECRET` in production.
- Rejects secrets shorter than 32 characters.
- Rejects the development fallback secret in production.
- Keeps the development fallback only for non-production local work.

### Magic link token logging removed

`src/lib/auth/authService.ts` now:

- Stops logging full magic login URLs by default.
- Logs only an email hash, token hash prefix, and expiration metadata.
- Allows full URL logging only in non-production with `ALLOW_DEV_MAGIC_LINK_LOGS=true`.

## Operator requirements

Production must set:

```txt
JWT_SECRET=<random 32+ character secret>
```

Recommended generation:

```bash
openssl rand -base64 48
```

Do not enable `ALLOW_DEV_MAGIC_LINK_LOGS` in production.

## Canon

Authentication must fail closed.

Magic links are credentials.
Credentials must not enter hosted logs.

We heal as we walk.

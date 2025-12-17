# 🚀 Auth + MIC Wallet System

Complete authentication and MIC wallet system for OAA-API-Library.

## 📦 Quick Start (5 Steps)

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies and run `prisma generate`.

### 2. Configure Environment

Copy `.env.example` to `.env.local` and set:

```bash
# Required for Auth + Wallet
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="generate-with-node-crypto-randomBytes"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Test Locally

```bash
npm run dev
```

### 5. Deploy

```bash
git add .
git commit -m "feat: Auth + MIC wallet system"
git push origin main
```

---

## 🔐 API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login with password |
| `/api/auth/magic-link` | POST | Send magic link |
| `/api/auth/verify` | POST | Verify magic link |
| `/api/auth/logout` | POST | Revoke session |
| `/api/auth/session` | GET | Check session status |

### Wallet

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/balance` | GET | Get user's MIC balance |
| `/api/wallet/founder` | GET | View founder wallet (public) |
| `/api/wallet/transfer` | POST | Transfer MIC |

---

## 📝 Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"handle":"kaizen","email":"kai@example.com","password":"secure123"}'
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "abc123...",
  "jwt": "eyJ...",
  "user": {
    "id": "uuid",
    "handle": "kaizen",
    "email": "kai@example.com",
    "walletAddress": "0x1234..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle":"kaizen","password":"secure123"}'
```

### Get Wallet Balance

```bash
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "address": "0x1234...",
  "balance": 0,
  "walletType": "CUSTODIAL",
  "recentTransactions": []
}
```

### Transfer MIC

```bash
curl -X POST http://localhost:3000/api/wallet/transfer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toAddress":"0x5678...","amount":10,"note":"Thanks!"}'
```

---

## 💰 Founder Wallet

Generate your cryptographically sealed 1M MIC wallet:

```bash
# 1. Register your account first
# 2. Run the script (LOCAL ONLY!)
npm run founder:generate
```

⚠️ **CRITICAL:**
- Write private key on paper (3 copies)
- Store in 3 physical locations
- NEVER save on computer
- No recovery if lost

---

## 🏗️ Architecture

### Database Schema

```
User
├── AuthKey (passwords, passkeys)
├── Session (active sessions)
├── MagicLink (passwordless login)
├── MICWallet (one per user)
├── MICLedger (transactions)
└── IdentityEvent (audit trail)
```

### Wallet Types

| Type | Description |
|------|-------------|
| `CUSTODIAL` | Default. Mobius manages keys. |
| `SELF_CUSTODY` | User manages keys (future). |
| `FOUNDER` | Special founder wallet. |

### MIC Reasons

| Reason | Description |
|--------|-------------|
| `REWARD` | Learning completion reward |
| `BONUS` | Achievement bonus |
| `TRANSFER_IN` | Received from another wallet |
| `TRANSFER_OUT` | Sent to another wallet |
| `STAKE` | Staked for governance |
| `UNSTAKE` | Unstaked |
| `BURN` | Permanently destroyed |
| `MINT` | Initial founder mint |
| `UBI` | Universal Basic Integrity |

---

## 🔒 Security Features

### Password Security
- PBKDF2 with SHA-512 (100,000 iterations)
- Optional bcrypt support
- Timing-safe comparison

### Session Management
- 30-day token expiry
- SHA256 token hashing
- Revocation support
- IP/User-Agent logging

### JWT Tokens
- HMAC-SHA256 signing
- 30-day expiry
- Stateless verification

### Wallet Security
- Ed25519 keypairs
- Address derived from pubkey hash
- Founder wallet: self-custody only

### Identity Events
- Append-only audit trail
- SHA256 event hashing
- Hash chaining (prev_hash)
- Ready for Merkle anchoring

---

## 📁 File Structure

```
prisma/
└── schema.prisma        # Database schema

src/lib/
├── crypto/
│   ├── hash.ts          # SHA256, bcrypt, HMAC
│   └── ed25519.ts       # Wallet keypair generation
└── auth/
    ├── jwt.ts           # JWT generation/verification
    └── authService.ts   # Complete auth logic

pages/api/
├── auth/
│   ├── register.ts      # POST - Register user
│   ├── login.ts         # POST - Password login
│   ├── magic-link.ts    # POST - Send magic link
│   ├── verify.ts        # POST - Verify magic link
│   ├── logout.ts        # POST - Revoke session
│   └── session.ts       # GET - Check session
└── wallet/
    ├── balance.ts       # GET - User balance
    ├── founder.ts       # GET - Founder wallet
    └── transfer.ts      # POST - Transfer MIC

scripts/
└── generate-founder-wallet.ts  # One-time founder setup
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"handle":"test","email":"test@test.com","password":"test1234"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle":"test","password":"test1234"}'

# 3. Check balance (use JWT from step 2)
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT"

# 4. Check session
curl http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer YOUR_JWT"

# 5. View founder wallet (public)
curl http://localhost:3000/api/wallet/founder
```

---

## 🚀 Deployment Checklist

- [ ] Set `DATABASE_URL` in Render
- [ ] Set `JWT_SECRET` in Render
- [ ] Set `NEXT_PUBLIC_APP_URL` in Render
- [ ] Run `npx prisma db push` after deploy
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test wallet balance endpoint
- [ ] Generate founder wallet (local only!)

---

## 🔮 Future Enhancements

- [ ] WebAuthn/Passkey support
- [ ] Email service integration (nodemailer)
- [ ] Self-custody wallet option
- [ ] Hardware wallet support
- [ ] Multi-device passkey sync
- [ ] Transaction signing UI
- [ ] Merkle batching to Civic-Protocol-Core

---

## 💎 Three Covenants

Built with **Integrity, Ecology, Custodianship** 🌊

*"We heal as we walk." — Mobius Systems*

# Civic AI Native Stack — GIC Incentive Model

**Spec Version:** 0.1.0  
**Last Updated:** 2025-10-18  

---

## 1. Purpose

Defines the **Global Integrity Credit (GIC)** economic loop that rewards verified civic contributions.  
Every reflection, attestation, or verified code merge mints GIC in proportion to its measurable integrity.

---

## 2. Core Equation

```
GIC_reward = (Integrity × CivicImpact × GeoWeight) × BaseRate
```

| Variable | Source | Description |
|----------|--------|-------------|
| **Integrity** | Ledger hash + ethics score (0-1) | Verifies proof authenticity |
| **CivicImpact** | DAO vote / public use score (0-1) | Measures real-world value |
| **GeoWeight** | Region activity (0.8-1.2) | Rewards underserved zones |
| **BaseRate** | protocol parameter (default = 1 GIC) | Adjusted by DAO governance |

---

## 3. Reward Categories

| Category | Trigger | Avg Reward (GIC) |
|----------|---------|------------------|
| **Reflection Attested** | OAA → Ledger proof | +0.25 |
| **Code Merged (verified ≥ 0.95)** | Human + Agent + Copilot | +1.00 |
| **Ethics Review Complete** | Virtue Core entry | +0.10 |
| **Civic Teaching or Lesson** | OAA curriculum module published | +0.75 |
| **Security Patch Confirmed** | Citizen Shield ledger | +1.25 |

---

## 4. Burn & Lock Mechanisms

| Action | Ratio | Purpose |
|--------|-------|---------|
| **Transaction Burn** | 1% | Control inflation |
| **Festival Oath Stake** | 10-20% locked per vote | Governance commitment |
| **Elder Seat Lock** | 100% term-lock | Prevent speculation |
| **Revocation Penalty** | -50% of rewarded GIC | Discourage fraud |

---

## 5. Distribution Contract

Executed by Civic Ledger module `/ledger/distribute`:

```solidity
if(attestation.integrityScore >= 0.95){
    mint(msg.sender, reward);
} else if(attestation.integrityScore >= 0.85){
    pendingQueue.push(attestation.id);
}
```

---

## 6. Governance Controls

- DAO can update BaseRate ±20%.
- DAO vote threshold ≥ 60% quorum.
- Civic auditors can freeze contracts during ethical investigation.

---

## 7. Transparency Feeds

Public endpoints:
- /ledger/stats/gic → current supply, burn, velocity
- /ledger/events/rewards → JSON stream of reward actions
- /api/dao/proposals → governance records

---

## 8. Societal Purpose

GIC is not a currency of consumption but of contribution.
It measures civilizational trust — a ledger of good faith acts between humans and machines.

---

**Guiding Quote**

> "Economy follows ethics, or it ceases to be civilization."  
> — Civic Mint Charter §3.1
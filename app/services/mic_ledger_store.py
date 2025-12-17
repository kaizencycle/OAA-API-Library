# app/services/mic_ledger_store.py
"""
MIC Ledger Store - Append-only ledger for MIC transactions

This is the SINGLE SOURCE OF TRUTH for MIC balances.
Wallet balance is DERIVED from the ledger, never stored separately.

Architecture:
- Append-only: entries are never modified or deleted
- Auditable: full transaction history preserved
- Derived balance: SUM(amount) = wallet balance
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.models.learning import MICReason, MICLedgerEntry


class MICLedgerStore:
    """
    In-memory append-only MIC ledger
    
    In production, replace with database (PostgreSQL recommended)
    with proper indexes on user_id and created_at
    """
    
    def __init__(self):
        # Append-only ledger: list of all MIC transactions
        # Key: ledger_entry_id, Value: MICLedgerEntry dict
        self._ledger: List[dict] = []
        
        # Index for fast user lookups (user_id -> list of entry indices)
        self._user_index: Dict[str, List[int]] = {}
    
    def append_entry(
        self,
        user_id: str,
        amount: float,
        reason: MICReason,
        integrity_score: float,
        gii: Optional[float] = None,
        module_id: Optional[str] = None,
        session_id: Optional[str] = None,
        transaction_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> MICLedgerEntry:
        """
        Append a new entry to the MIC ledger.
        
        This is the ONLY way to modify MIC balances.
        Entries are immutable once created.
        
        Args:
            user_id: User receiving/losing MIC
            amount: MIC amount (positive = credit, negative = debit)
            reason: Why this transaction occurred
            integrity_score: User's integrity score at transaction time
            gii: Global Integrity Index at transaction time
            module_id: Associated learning module (if LEARN)
            session_id: Associated session (if applicable)
            transaction_id: External transaction reference
            metadata: Additional context
            
        Returns:
            The created ledger entry
        """
        entry_id = f"mic_ledger_{uuid.uuid4().hex[:12]}_{int(datetime.utcnow().timestamp())}"
        
        entry_dict = {
            "id": entry_id,
            "user_id": user_id,
            "amount": round(amount, 2),
            "reason": reason.value,
            "integrity_score": round(integrity_score, 4),
            "gii": round(gii, 4) if gii else None,
            "module_id": module_id,
            "session_id": session_id,
            "transaction_id": transaction_id,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Append to ledger (immutable after this point)
        entry_index = len(self._ledger)
        self._ledger.append(entry_dict)
        
        # Update user index
        if user_id not in self._user_index:
            self._user_index[user_id] = []
        self._user_index[user_id].append(entry_index)
        
        return MICLedgerEntry(
            id=entry_dict["id"],
            user_id=entry_dict["user_id"],
            amount=entry_dict["amount"],
            reason=MICReason(entry_dict["reason"]),
            integrity_score=entry_dict["integrity_score"],
            gii=entry_dict["gii"],
            module_id=entry_dict["module_id"],
            session_id=entry_dict["session_id"],
            transaction_id=entry_dict["transaction_id"],
            metadata=entry_dict["metadata"],
            created_at=datetime.fromisoformat(entry_dict["created_at"])
        )
    
    def get_balance(self, user_id: str) -> float:
        """
        Calculate user's MIC balance from ledger.
        
        Balance = SUM(all entry amounts for user)
        
        This is the DERIVED balance, never stored separately.
        """
        if user_id not in self._user_index:
            return 0.0
        
        total = 0.0
        for idx in self._user_index[user_id]:
            total += self._ledger[idx]["amount"]
        
        return round(total, 2)
    
    def get_recent_entries(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[MICLedgerEntry]:
        """
        Get most recent ledger entries for a user.
        
        Returns entries in reverse chronological order.
        """
        if user_id not in self._user_index:
            return []
        
        # Get indices in reverse order (most recent first)
        indices = self._user_index[user_id][-limit:][::-1]
        
        entries = []
        for idx in indices:
            entry_dict = self._ledger[idx]
            entries.append(MICLedgerEntry(
                id=entry_dict["id"],
                user_id=entry_dict["user_id"],
                amount=entry_dict["amount"],
                reason=MICReason(entry_dict["reason"]),
                integrity_score=entry_dict["integrity_score"],
                gii=entry_dict["gii"],
                module_id=entry_dict["module_id"],
                session_id=entry_dict["session_id"],
                transaction_id=entry_dict["transaction_id"],
                metadata=entry_dict["metadata"],
                created_at=datetime.fromisoformat(entry_dict["created_at"])
            ))
        
        return entries
    
    def get_ledger(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[int, List[MICLedgerEntry]]:
        """
        Get paginated ledger entries for a user.
        
        Returns (total_count, entries) in reverse chronological order.
        """
        if user_id not in self._user_index:
            return 0, []
        
        all_indices = self._user_index[user_id]
        total = len(all_indices)
        
        # Paginate in reverse order
        start = max(0, total - offset - limit)
        end = total - offset
        indices = all_indices[start:end][::-1]
        
        entries = []
        for idx in indices:
            entry_dict = self._ledger[idx]
            entries.append(MICLedgerEntry(
                id=entry_dict["id"],
                user_id=entry_dict["user_id"],
                amount=entry_dict["amount"],
                reason=MICReason(entry_dict["reason"]),
                integrity_score=entry_dict["integrity_score"],
                gii=entry_dict["gii"],
                module_id=entry_dict["module_id"],
                session_id=entry_dict["session_id"],
                transaction_id=entry_dict["transaction_id"],
                metadata=entry_dict["metadata"],
                created_at=datetime.fromisoformat(entry_dict["created_at"])
            ))
        
        return total, entries
    
    def get_last_entry(self, user_id: str) -> Optional[MICLedgerEntry]:
        """Get the most recent ledger entry for a user."""
        if user_id not in self._user_index or not self._user_index[user_id]:
            return None
        
        idx = self._user_index[user_id][-1]
        entry_dict = self._ledger[idx]
        
        return MICLedgerEntry(
            id=entry_dict["id"],
            user_id=entry_dict["user_id"],
            amount=entry_dict["amount"],
            reason=MICReason(entry_dict["reason"]),
            integrity_score=entry_dict["integrity_score"],
            gii=entry_dict["gii"],
            module_id=entry_dict["module_id"],
            session_id=entry_dict["session_id"],
            transaction_id=entry_dict["transaction_id"],
            metadata=entry_dict["metadata"],
            created_at=datetime.fromisoformat(entry_dict["created_at"])
        )
    
    def get_total_entries_count(self, user_id: str) -> int:
        """Get total number of ledger entries for a user."""
        return len(self._user_index.get(user_id, []))
    
    def get_entries_by_reason(
        self,
        user_id: str,
        reason: MICReason
    ) -> List[MICLedgerEntry]:
        """Get all entries for a user filtered by reason."""
        if user_id not in self._user_index:
            return []
        
        entries = []
        for idx in self._user_index[user_id]:
            entry_dict = self._ledger[idx]
            if entry_dict["reason"] == reason.value:
                entries.append(MICLedgerEntry(
                    id=entry_dict["id"],
                    user_id=entry_dict["user_id"],
                    amount=entry_dict["amount"],
                    reason=MICReason(entry_dict["reason"]),
                    integrity_score=entry_dict["integrity_score"],
                    gii=entry_dict["gii"],
                    module_id=entry_dict["module_id"],
                    session_id=entry_dict["session_id"],
                    transaction_id=entry_dict["transaction_id"],
                    metadata=entry_dict["metadata"],
                    created_at=datetime.fromisoformat(entry_dict["created_at"])
                ))
        
        return entries
    
    def get_balance_breakdown(self, user_id: str) -> Dict[str, float]:
        """
        Get balance breakdown by reason type.
        
        Returns dict like:
        {
            "LEARN": 150.0,
            "BONUS": 25.0,
            "CORRECTION": -5.0,
            "total": 170.0
        }
        """
        if user_id not in self._user_index:
            return {"total": 0.0}
        
        breakdown: Dict[str, float] = {}
        total = 0.0
        
        for idx in self._user_index[user_id]:
            entry = self._ledger[idx]
            reason = entry["reason"]
            amount = entry["amount"]
            
            if reason not in breakdown:
                breakdown[reason] = 0.0
            breakdown[reason] += amount
            total += amount
        
        breakdown["total"] = round(total, 2)
        
        # Round all values
        for key in breakdown:
            breakdown[key] = round(breakdown[key], 2)
        
        return breakdown


# Global singleton instance
mic_ledger_store = MICLedgerStore()

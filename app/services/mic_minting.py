# app/services/mic_minting.py
"""
MIC Minting Service for Learning Rewards
Handles the minting of Mobius Integrity Credits based on learning achievements

CRITICAL: All MIC rewards are written to the MIC Ledger (append-only).
The wallet balance is DERIVED from the ledger, never stored separately.
"""

import logging
import os
from typing import Dict, Any, Tuple
from datetime import datetime
import uuid

from app.models.learning import MICReason
from app.services.mic_ledger_store import mic_ledger_store

logger = logging.getLogger(__name__)


class MICMintingService:
    """
    Service for minting MIC rewards
    
    MIC Reward Formula:
    MIC = baseReward × accuracy × integrityScore × giiMultiplier
    
    Integrates with:
    - Circuit breaker for system health
    - User integrity scores
    - Streak bonuses
    """
    
    # Minimum thresholds
    MIN_INTEGRITY_SCORE = 0.70
    MIN_ACCURACY = 0.70
    MIN_GII_FOR_MINTING = 0.60
    
    # Difficulty multipliers
    DIFFICULTY_MULTIPLIERS = {
        "beginner": 1.0,
        "intermediate": 1.2,
        "advanced": 1.5
    }
    
    # Streak bonuses
    STREAK_BONUSES = {
        3: 0.05,   # 5% bonus for 3-day streak
        7: 0.10,   # 10% bonus for 7-day streak
        14: 0.15,  # 15% bonus for 14-day streak
        30: 0.25   # 25% bonus for 30-day streak
    }
    
    def __init__(self):
        self.gii_override = os.getenv("GII_OVERRIDE")  # For testing
        
    def get_global_integrity_index(self) -> float:
        """
        Get the current Global Integrity Index (GII)
        In production, this would query the Mobius integrity system
        """
        if self.gii_override:
            return float(self.gii_override)
        
        # TODO: Fetch from Mobius integrity service
        # For now, return a healthy default
        return 0.92
    
    def get_user_integrity_score(self, user_id: str) -> float:
        """
        Get the user's integrity score
        In production, this would query the user's profile
        """
        # TODO: Fetch from user service
        # For now, return a default good score
        return 0.88
    
    def calculate_gii_multiplier(self, gii: float) -> Tuple[float, str]:
        """
        Calculate reward multiplier based on system health (GII)
        
        Returns (multiplier, status)
        """
        if gii >= 0.90:
            return 1.0, "healthy"
        elif gii >= 0.75:
            return 0.8, "warning"
        elif gii >= 0.60:
            return 0.5, "critical"
        else:
            return 0.0, "circuit_breaker_active"
    
    def calculate_streak_bonus(self, streak_days: int) -> float:
        """Calculate streak bonus based on consecutive learning days"""
        bonus = 0.0
        for threshold, b in sorted(self.STREAK_BONUSES.items()):
            if streak_days >= threshold:
                bonus = b
        return bonus
    
    def calculate_reward(
        self,
        base_reward: int,
        accuracy: float,
        integrity_score: float,
        difficulty: str = "beginner",
        streak_days: int = 0,
        is_perfect_score: bool = False,
        is_first_completion: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate the full MIC reward with all bonuses
        
        Args:
            base_reward: Module's base MIC reward
            accuracy: User's accuracy (0.0 to 1.0)
            integrity_score: User's integrity score (0.0 to 1.0)
            difficulty: Module difficulty level
            streak_days: User's current streak
            is_perfect_score: True if 100% accuracy
            is_first_completion: True if first time completing this module
            
        Returns:
            Dictionary with reward breakdown
        """
        gii = self.get_global_integrity_index()
        gii_multiplier, system_status = self.calculate_gii_multiplier(gii)
        
        # Check if minting is allowed
        can_mint = (
            gii >= self.MIN_GII_FOR_MINTING and
            integrity_score >= self.MIN_INTEGRITY_SCORE and
            accuracy >= self.MIN_ACCURACY
        )
        
        if not can_mint:
            return {
                "mic_earned": 0,
                "can_mint": False,
                "reason": self._get_rejection_reason(gii, integrity_score, accuracy),
                "system_status": system_status,
                "gii": gii,
                "breakdown": {}
            }
        
        # Clamp accuracy to minimum threshold
        accuracy_multiplier = max(accuracy, self.MIN_ACCURACY)
        
        # Get difficulty multiplier
        difficulty_multiplier = self.DIFFICULTY_MULTIPLIERS.get(difficulty, 1.0)
        
        # Calculate base MIC
        base_mic = base_reward * accuracy_multiplier * integrity_score * gii_multiplier * difficulty_multiplier
        
        # Apply bonuses
        streak_bonus = self.calculate_streak_bonus(streak_days)
        perfect_bonus = 0.10 if is_perfect_score else 0.0
        first_completion_bonus = 20 if is_first_completion else 0
        
        # Calculate final reward
        total_bonus_multiplier = 1 + streak_bonus + perfect_bonus
        final_mic = int(base_mic * total_bonus_multiplier) + first_completion_bonus
        
        return {
            "mic_earned": final_mic,
            "can_mint": True,
            "system_status": system_status,
            "gii": gii,
            "breakdown": {
                "base_reward": base_reward,
                "accuracy_multiplier": accuracy_multiplier,
                "integrity_multiplier": integrity_score,
                "gii_multiplier": gii_multiplier,
                "difficulty_multiplier": difficulty_multiplier,
                "streak_bonus": streak_bonus,
                "perfect_bonus": perfect_bonus,
                "first_completion_bonus": first_completion_bonus
            }
        }
    
    def _get_rejection_reason(self, gii: float, integrity_score: float, accuracy: float) -> str:
        """Get human-readable rejection reason"""
        reasons = []
        
        if gii < self.MIN_GII_FOR_MINTING:
            reasons.append(f"System integrity too low (GII: {gii:.2f}, required: {self.MIN_GII_FOR_MINTING})")
        if integrity_score < self.MIN_INTEGRITY_SCORE:
            reasons.append(f"User integrity score too low ({integrity_score:.2f}, required: {self.MIN_INTEGRITY_SCORE})")
        if accuracy < self.MIN_ACCURACY:
            reasons.append(f"Accuracy too low ({accuracy:.2%}, required: {self.MIN_ACCURACY:.0%})")
        
        return "; ".join(reasons) if reasons else "Unknown"
    
    async def mint_reward(
        self,
        user_id: str,
        module_id: str,
        session_id: str,
        mic_amount: int,
        accuracy: float,
        integrity_score: float
    ) -> Dict[str, Any]:
        """
        Mint MIC reward for completing a learning module.
        
        CRITICAL: This method writes to the MIC Ledger (append-only).
        The wallet balance is DERIVED from the ledger.
        
        Args:
            user_id: User receiving the reward
            module_id: Module that was completed
            session_id: Learning session ID
            mic_amount: Amount of MIC to mint
            accuracy: User's accuracy score
            integrity_score: User's integrity score
            
        Returns:
            Transaction details including ledger entry and new balance
        """
        gii = self.get_global_integrity_index()
        gii_multiplier, system_status = self.calculate_gii_multiplier(gii)
        
        # Verify minting is allowed
        if gii < self.MIN_GII_FOR_MINTING:
            raise ValueError(f"Circuit breaker active. GII: {gii:.2f}")
        
        if integrity_score < self.MIN_INTEGRITY_SCORE:
            raise ValueError(f"Integrity score too low: {integrity_score:.2f}")
        
        if accuracy < self.MIN_ACCURACY:
            raise ValueError(f"Accuracy too low: {accuracy:.2%}")
        
        # Generate transaction ID
        transaction_id = f"tx_mic_{uuid.uuid4().hex[:12]}_{int(datetime.utcnow().timestamp())}"
        
        # 🔥 CRITICAL: Write to MIC Ledger (append-only)
        # This is the source of truth for wallet balance
        ledger_entry = mic_ledger_store.append_entry(
            user_id=user_id,
            amount=float(mic_amount),
            reason=MICReason.LEARN,
            integrity_score=integrity_score,
            gii=gii,
            module_id=module_id,
            session_id=session_id,
            transaction_id=transaction_id,
            metadata={
                "accuracy": accuracy,
                "gii_multiplier": gii_multiplier,
                "system_status": system_status
            }
        )
        
        # Get DERIVED balance from ledger (never stored separately)
        new_balance = mic_ledger_store.get_balance(user_id)
        
        logger.info(
            f"MIC minted to ledger: user={user_id}, amount={mic_amount}, "
            f"module={module_id}, tx={transaction_id}, new_balance={new_balance}"
        )
        
        return {
            "transaction_id": transaction_id,
            "ledger_id": ledger_entry.id,
            "user_id": user_id,
            "module_id": module_id,
            "session_id": session_id,
            "mic_minted": mic_amount,
            "new_balance": new_balance,  # Derived from ledger
            "integrity_score_used": integrity_score,
            "circuit_breaker_status": system_status,
            "global_integrity_index": gii,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def estimate_reward(
        self,
        base_reward: int,
        expected_accuracy: float,
        user_id: str,
        difficulty: str = "beginner",
        streak_days: int = 0
    ) -> Dict[str, Any]:
        """
        Estimate potential MIC reward before starting a module
        
        Returns detailed breakdown of expected reward
        """
        integrity_score = self.get_user_integrity_score(user_id)
        gii = self.get_global_integrity_index()
        gii_multiplier, system_status = self.calculate_gii_multiplier(gii)
        
        # Calculate estimate
        accuracy_multiplier = max(expected_accuracy, self.MIN_ACCURACY)
        difficulty_multiplier = self.DIFFICULTY_MULTIPLIERS.get(difficulty, 1.0)
        streak_bonus = self.calculate_streak_bonus(streak_days)
        
        estimated = int(
            base_reward * 
            accuracy_multiplier * 
            integrity_score * 
            gii_multiplier * 
            difficulty_multiplier *
            (1 + streak_bonus)
        )
        
        can_mint = (
            gii >= self.MIN_GII_FOR_MINTING and
            integrity_score >= self.MIN_INTEGRITY_SCORE
        )
        
        return {
            "estimated_mic": estimated,
            "can_mint": can_mint,
            "system_status": system_status,
            "gii_multiplier": gii_multiplier,
            "breakdown": {
                "base_reward": base_reward,
                "accuracy_assumption": expected_accuracy,
                "integrity_score": integrity_score,
                "gii": gii,
                "difficulty_multiplier": difficulty_multiplier,
                "streak_bonus": streak_bonus
            }
        }

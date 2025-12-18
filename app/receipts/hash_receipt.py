# app/receipts/hash_receipt.py
"""
Hash Receipt Generation for MIC Transactions

Provides deterministic hashing of transaction data for:
- Verifiable proof of transaction
- Future Merkle tree anchoring
- Audit trail integrity

Each receipt creates a SHA256 hash of canonicalized JSON payload,
which can later be anchored to a Merkle tree or blockchain.
"""

import hashlib
import json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional


def canonical_json(obj: Any) -> str:
    """
    Generate canonical (deterministic) JSON representation.
    
    Rules:
    - Keys are sorted alphabetically
    - No whitespace
    - Consistent formatting
    
    This ensures the same data always produces the same hash.
    
    Args:
        obj: Python object to serialize
        
    Returns:
        Canonical JSON string
    """
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), default=str)


def sha256(input_str: str) -> str:
    """
    Generate SHA256 hash of input string.
    
    Args:
        input_str: String to hash
        
    Returns:
        Hex-encoded SHA256 hash (64 characters)
    """
    return hashlib.sha256(input_str.encode('utf-8')).hexdigest()


def generate_receipt_hash(payload: Dict[str, Any]) -> str:
    """
    Generate receipt hash from payload.
    
    Process:
    1. Canonicalize JSON (sorted keys, no whitespace)
    2. SHA256 hash the canonical JSON
    
    Args:
        payload: Transaction payload dict
        
    Returns:
        SHA256 hash of canonical JSON (hex string)
    """
    canonical = canonical_json(payload)
    return sha256(canonical)


@dataclass
class MintReceipt:
    """
    Receipt for MIC minting transaction.
    
    Contains all data needed to verify and audit a mint operation.
    The receipt_hash can be anchored to Merkle trees for proof.
    """
    kind: str                    # Receipt type (e.g., "LEARN_MINT")
    subject_id: str              # User ID (canonical identity)
    learning_session_id: str     # Learning session that triggered mint
    module_id: str               # Module completed
    minted_mic: float            # Amount minted
    accuracy: float              # Completion accuracy
    integrity_score: float       # User's integrity score at mint time
    gii: float                   # Global Integrity Index at mint time
    timestamp: str               # ISO timestamp
    receipt_hash: str            # SHA256 of canonical payload
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage/response"""
        return asdict(self)


def create_mint_receipt(
    subject_id: str,
    session_id: str,
    module_id: str,
    minted_mic: float,
    accuracy: float,
    integrity_score: float,
    gii: float,
    timestamp: Optional[datetime] = None
) -> MintReceipt:
    """
    Create a mint receipt for learning completion.
    
    This generates a verifiable receipt that can be:
    - Stored in the Receipt table
    - Used to verify transaction integrity
    - Anchored to Merkle tree / blockchain
    
    Args:
        subject_id: User ID (canonical identity spine)
        session_id: Learning session ID
        module_id: Module that was completed
        minted_mic: Amount of MIC minted
        accuracy: Completion accuracy (0.0 to 1.0)
        integrity_score: User's integrity score
        gii: Global Integrity Index at mint time
        timestamp: Optional timestamp (defaults to now)
        
    Returns:
        MintReceipt with calculated hash
    """
    ts = timestamp or datetime.utcnow()
    ts_str = ts.isoformat() + 'Z' if not ts.isoformat().endswith('Z') else ts.isoformat()
    
    # Create payload for hashing
    # Note: order doesn't matter because we use canonical_json (sorted keys)
    payload = {
        "kind": "LEARN_MINT",
        "subject_id": subject_id,
        "learning_session_id": session_id,
        "module_id": module_id,
        "minted_mic": round(minted_mic, 2),
        "accuracy": round(accuracy, 4),
        "integrity_score": round(integrity_score, 4),
        "gii": round(gii, 4),
        "ts": ts_str,
    }
    
    # Generate deterministic hash
    receipt_hash = generate_receipt_hash(payload)
    
    return MintReceipt(
        kind="LEARN_MINT",
        subject_id=subject_id,
        learning_session_id=session_id,
        module_id=module_id,
        minted_mic=round(minted_mic, 2),
        accuracy=round(accuracy, 4),
        integrity_score=round(integrity_score, 4),
        gii=round(gii, 4),
        timestamp=ts_str,
        receipt_hash=receipt_hash,
    )


def verify_receipt(receipt: MintReceipt) -> bool:
    """
    Verify that a receipt's hash is valid.
    
    Re-computes the hash from the receipt data and compares.
    
    Args:
        receipt: MintReceipt to verify
        
    Returns:
        True if hash matches, False if tampered
    """
    # Reconstruct payload
    payload = {
        "kind": receipt.kind,
        "subject_id": receipt.subject_id,
        "learning_session_id": receipt.learning_session_id,
        "module_id": receipt.module_id,
        "minted_mic": receipt.minted_mic,
        "accuracy": receipt.accuracy,
        "integrity_score": receipt.integrity_score,
        "gii": receipt.gii,
        "ts": receipt.timestamp,
    }
    
    # Verify hash
    expected_hash = generate_receipt_hash(payload)
    return expected_hash == receipt.receipt_hash

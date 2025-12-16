# app/models/learning.py
"""
Pydantic schemas for OAA Learning Hub API
Request and response validation for learning rewards system (MIC)
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class CircuitBreakerStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    CIRCUIT_BREAKER_ACTIVE = "circuit_breaker_active"


# Question Schema
# ================

class QuestionSchema(BaseModel):
    """Individual quiz question"""
    id: str
    question: str
    options: List[str]
    correct_answer: int = Field(..., ge=0)
    explanation: str
    difficulty: str = "easy"
    points: int = Field(default=10, gt=0)
    
    @field_validator('correct_answer')
    @classmethod
    def validate_correct_answer(cls, v: int, info) -> int:
        # Will be validated against options length when module is used
        return v


# Module Schemas
# ===============

class LearningModuleBase(BaseModel):
    """Base module information"""
    id: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1, max_length=2000)
    difficulty: DifficultyLevel
    estimated_minutes: int = Field(..., gt=0)
    mic_reward: int = Field(..., gt=0)
    topics: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)


class LearningModuleCreate(LearningModuleBase):
    """Request to create a new module"""
    questions: List[QuestionSchema]
    is_active: bool = True
    order: int = 0


class LearningModuleResponse(LearningModuleBase):
    """Module information response"""
    questions_count: int
    is_active: bool = True
    completed: bool = False
    progress: float = 0.0
    
    class Config:
        from_attributes = True


class ModuleDetailResponse(LearningModuleBase):
    """Detailed module information including questions"""
    questions: List[QuestionSchema]
    is_active: bool = True
    
    class Config:
        from_attributes = True


class ModuleListResponse(BaseModel):
    """List of available modules"""
    modules: List[LearningModuleResponse]
    total: int
    page: int = 1
    page_size: int = 20


# Session Management Schemas
# ===========================

class SessionStartRequest(BaseModel):
    """Request to start a learning session"""
    module_id: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(..., min_length=1, max_length=255)
    timestamp: Optional[datetime] = None


class SessionStartResponse(BaseModel):
    """Response after starting a session"""
    session_id: str
    module_id: str
    start_time: datetime
    status: SessionStatus
    module: Optional[ModuleDetailResponse] = None
    
    class Config:
        from_attributes = True


class AnswerSubmitRequest(BaseModel):
    """Request to submit a quiz answer"""
    question_id: str = Field(..., min_length=1)
    selected_answer: int = Field(..., ge=0)
    time_spent_seconds: int = Field(default=0, ge=0)


class AnswerSubmitResponse(BaseModel):
    """Response after submitting an answer"""
    question_id: str
    correct: bool
    points_earned: int
    explanation: str
    cumulative_score: int
    questions_remaining: int


class SessionCompleteRequest(BaseModel):
    """Request to complete a module"""
    session_id: str
    questions_answered: int = Field(..., ge=1)
    correct_answers: int = Field(..., ge=0)
    total_points: int = Field(..., ge=0)
    earned_points: int = Field(..., ge=0)
    accuracy: float = Field(..., ge=0.0, le=1.0)
    time_spent_minutes: int = Field(..., ge=0)
    
    @field_validator('correct_answers')
    @classmethod
    def validate_correct_answers(cls, v: int, info) -> int:
        questions_answered = info.data.get('questions_answered', 0)
        if v > questions_answered:
            raise ValueError('correct_answers cannot exceed questions_answered')
        return v


class SessionCompleteResponse(BaseModel):
    """Response after completing a module"""
    session_id: str
    module_id: str
    accuracy: float
    mic_earned: int
    xp_earned: int
    new_level: int
    integrity_score: float
    transaction_id: Optional[str] = None
    status: SessionStatus
    rewards: Dict[str, int]
    bonuses: Dict[str, float]
    circuit_breaker_status: CircuitBreakerStatus
    
    class Config:
        from_attributes = True


# User Progress Schemas
# ======================

class CompletedModuleInfo(BaseModel):
    """Information about a completed module"""
    module_id: str
    completed_at: str
    accuracy: float
    mic_earned: int


class BadgeInfo(BaseModel):
    """Information about a badge"""
    id: str
    name: str
    description: str
    icon: str
    earned_at: str
    rarity: str = "common"


class UserProgressResponse(BaseModel):
    """Complete user progress information"""
    user_id: str
    total_mic_earned: int
    modules_completed: int
    current_streak: int
    longest_streak: int
    total_learning_minutes: int
    level: int
    experience_points: int
    next_level_xp: int
    integrity_score: float
    badges: List[BadgeInfo]
    completed_modules: List[CompletedModuleInfo]
    
    class Config:
        from_attributes = True


# MIC Minting Schemas
# ====================

class MICMintRequest(BaseModel):
    """Request to mint MIC reward"""
    user_id: str
    module_id: str
    session_id: str
    mic_amount: int = Field(..., gt=0)
    accuracy: float = Field(..., ge=0.0, le=1.0)
    integrity_score: float = Field(..., ge=0.0, le=1.0)


class MICMintResponse(BaseModel):
    """Response after minting MIC"""
    transaction_id: str
    user_id: str
    mic_minted: int
    new_balance: int
    integrity_score_used: float
    circuit_breaker_status: CircuitBreakerStatus
    global_integrity_index: float
    timestamp: datetime


class RewardEstimate(BaseModel):
    """Estimated MIC reward before completion"""
    estimated_mic: int
    breakdown: Dict[str, float]
    system_status: CircuitBreakerStatus
    can_mint: bool
    gii_multiplier: float


# Analytics Schemas
# ==================

class LearningAnalytics(BaseModel):
    """Learning analytics data"""
    total_sessions: int
    total_completions: int
    average_accuracy: float
    total_mic_distributed: int
    active_learners: int
    popular_modules: List[Dict[str, Any]]


class ModuleAnalytics(BaseModel):
    """Analytics for a specific module"""
    module_id: str
    total_attempts: int
    total_completions: int
    average_accuracy: float
    average_time_minutes: int
    completion_rate: float
    mic_distributed: int


# Error Response
# ===============

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

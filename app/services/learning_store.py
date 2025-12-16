# app/services/learning_store.py
"""
In-memory Learning Store
Manages learning modules, sessions, and user progress
Replace with database integration for production
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.models.learning import (
    QuestionSchema,
    LearningModuleResponse,
    ModuleDetailResponse,
    SessionStatus,
    DifficultyLevel,
    CompletedModuleInfo,
    BadgeInfo,
)


class LearningStore:
    """
    In-memory store for learning data
    
    In production, replace with database queries
    """
    
    def __init__(self):
        # Initialize with sample modules
        self.modules: Dict[str, dict] = self._init_sample_modules()
        self.sessions: Dict[str, dict] = {}
        self.user_progress: Dict[str, dict] = {}
        self.completions: Dict[str, List[dict]] = {}  # user_id -> list of completions
        self.badges: Dict[str, dict] = self._init_badges()
        self.user_badges: Dict[str, List[str]] = {}  # user_id -> list of badge_ids
    
    def _init_sample_modules(self) -> Dict[str, dict]:
        """Initialize sample Constitutional AI learning modules"""
        return {
            "constitutional-ai-101": {
                "id": "constitutional-ai-101",
                "title": "Constitutional AI Fundamentals",
                "description": "Learn how AI systems can be constrained by constitutional principles to serve humanity.",
                "difficulty": "beginner",
                "estimated_minutes": 30,
                "mic_reward": 50,
                "topics": ["AI Alignment", "Constitutional Constraints", "Three Covenants"],
                "prerequisites": [],
                "is_active": True,
                "order": 1,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is the primary purpose of Constitutional AI?",
                        "options": [
                            "To make AI systems faster",
                            "To constrain AI behavior with explicit principles and values",
                            "To make AI systems cheaper to run",
                            "To replace human decision-making"
                        ],
                        "correct_answer": 1,
                        "explanation": "Constitutional AI constrains AI systems with explicit constitutional principles, ensuring they operate within defined ethical boundaries and serve human values.",
                        "difficulty": "easy",
                        "points": 10
                    },
                    {
                        "id": "q2",
                        "question": "Which of the Three Covenants emphasizes long-term responsibility over short-term gains?",
                        "options": [
                            "Integrity",
                            "Ecology",
                            "Custodianship",
                            "All of the above"
                        ],
                        "correct_answer": 2,
                        "explanation": "Custodianship emphasizes intergenerational responsibility and long-term stewardship over short-term extraction.",
                        "difficulty": "medium",
                        "points": 15
                    },
                    {
                        "id": "q3",
                        "question": "How does Constitutional AI differ from traditional AI alignment approaches?",
                        "options": [
                            "It uses more training data",
                            "It embeds constraints at the reasoning substrate level",
                            "It requires less compute power",
                            "It works without human oversight"
                        ],
                        "correct_answer": 1,
                        "explanation": "Constitutional AI embeds constraints at the substrate level of AI reasoning, making constitutional principles fundamental to how the AI thinks, not just what it outputs.",
                        "difficulty": "hard",
                        "points": 20
                    }
                ]
            },
            "integrity-economics": {
                "id": "integrity-economics",
                "title": "Integrity Economics & MIC",
                "description": "Understanding how integrity-backed currency creates sustainable economic systems.",
                "difficulty": "intermediate",
                "estimated_minutes": 45,
                "mic_reward": 75,
                "topics": ["MIC Tokenomics", "Circuit Breakers", "Time Security"],
                "prerequisites": ["constitutional-ai-101"],
                "is_active": True,
                "order": 2,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What does MIC stand for in the Mobius ecosystem?",
                        "options": [
                            "Monetary Investment Certificate",
                            "Mobius Integrity Credits",
                            "Multi-Instance Currency",
                            "Machine Intelligence Coin"
                        ],
                        "correct_answer": 1,
                        "explanation": "MIC stands for Mobius Integrity Credits - a currency backed by verified integrity work within the ecosystem.",
                        "difficulty": "easy",
                        "points": 10
                    },
                    {
                        "id": "q2",
                        "question": "What triggers a circuit breaker in the MIC minting system?",
                        "options": [
                            "High transaction volume",
                            "Low Global Integrity Index (GII)",
                            "Server maintenance",
                            "User request"
                        ],
                        "correct_answer": 1,
                        "explanation": "Circuit breakers activate when the Global Integrity Index falls below threshold (typically 0.60), halting minting to protect system integrity.",
                        "difficulty": "medium",
                        "points": 15
                    },
                    {
                        "id": "q3",
                        "question": "How is the MIC reward calculated for learning modules?",
                        "options": [
                            "Fixed amount per module",
                            "Based on time spent only",
                            "Base reward × accuracy × integrity score × GII multiplier",
                            "Random distribution"
                        ],
                        "correct_answer": 2,
                        "explanation": "MIC rewards are calculated using the formula: Base × Accuracy × Integrity × GII, ensuring rewards align with demonstrated learning and system health.",
                        "difficulty": "hard",
                        "points": 20
                    }
                ]
            },
            "drift-suppression": {
                "id": "drift-suppression",
                "title": "Drift Suppression Mechanisms",
                "description": "Understanding how Mobius prevents value drift and maintains alignment over time.",
                "difficulty": "advanced",
                "estimated_minutes": 60,
                "mic_reward": 100,
                "topics": ["Value Alignment", "Drift Detection", "Correction Mechanisms"],
                "prerequisites": ["constitutional-ai-101", "integrity-economics"],
                "is_active": True,
                "order": 3,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is 'value drift' in the context of AI systems?",
                        "options": [
                            "Gradual improvement in AI performance",
                            "Slow deviation from intended values and behaviors over time",
                            "Changes in cryptocurrency prices",
                            "Hardware degradation"
                        ],
                        "correct_answer": 1,
                        "explanation": "Value drift refers to the gradual deviation of AI systems from their intended values and behaviors, which can occur through updates, new data, or emergent behaviors.",
                        "difficulty": "easy",
                        "points": 10
                    },
                    {
                        "id": "q2",
                        "question": "Which mechanism helps detect drift early in Mobius systems?",
                        "options": [
                            "Annual audits",
                            "User complaints",
                            "Sentinel monitoring and MII tracking",
                            "Random sampling"
                        ],
                        "correct_answer": 2,
                        "explanation": "Sentinel systems continuously monitor behavior patterns while the Mobius Integrity Index (MII) tracks system-wide health, enabling early drift detection.",
                        "difficulty": "medium",
                        "points": 15
                    },
                    {
                        "id": "q3",
                        "question": "What is the relationship between GII and drift suppression?",
                        "options": [
                            "GII measures drift severity and triggers corrections when thresholds are crossed",
                            "GII has no relationship to drift",
                            "GII causes drift",
                            "GII only measures economic factors"
                        ],
                        "correct_answer": 0,
                        "explanation": "The Global Integrity Index serves as a holistic measure of system alignment. When GII drops, it indicates potential drift and activates graduated response mechanisms.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            "three-covenants": {
                "id": "three-covenants",
                "title": "The Three Covenants in Practice",
                "description": "Deep dive into Integrity, Ecology, and Custodianship as operational principles.",
                "difficulty": "beginner",
                "estimated_minutes": 25,
                "mic_reward": 40,
                "topics": ["Integrity", "Ecology", "Custodianship", "Ethics"],
                "prerequisites": [],
                "is_active": True,
                "order": 4,
                "questions": [
                    {
                        "id": "q1",
                        "question": "The Integrity Covenant primarily focuses on:",
                        "options": [
                            "Financial returns",
                            "Truthfulness, consistency, and alignment between stated and actual values",
                            "Speed of processing",
                            "User interface design"
                        ],
                        "correct_answer": 1,
                        "explanation": "The Integrity Covenant ensures that systems maintain truthfulness and consistency between what they claim to value and how they actually behave.",
                        "difficulty": "easy",
                        "points": 10
                    },
                    {
                        "id": "q2",
                        "question": "How does the Ecology Covenant influence system design?",
                        "options": [
                            "It requires solar-powered servers",
                            "It emphasizes sustainable, non-extractive relationships with all stakeholders",
                            "It bans all carbon emissions",
                            "It only applies to environmental organizations"
                        ],
                        "correct_answer": 1,
                        "explanation": "The Ecology Covenant promotes sustainable, regenerative relationships rather than extractive ones - applying to human, economic, and environmental ecosystems.",
                        "difficulty": "medium",
                        "points": 15
                    },
                    {
                        "id": "q3",
                        "question": "What distinguishes Custodianship from ownership in the Mobius context?",
                        "options": [
                            "Custodians earn more MIC",
                            "Custodianship implies responsibility to future generations, not just current rights",
                            "There is no difference",
                            "Custodians have fewer permissions"
                        ],
                        "correct_answer": 1,
                        "explanation": "Custodianship reframes the relationship from 'ownership with rights' to 'stewardship with responsibilities' - caring for resources on behalf of future generations.",
                        "difficulty": "medium",
                        "points": 15
                    }
                ]
            },
            "multi-agent-democracy": {
                "id": "multi-agent-democracy",
                "title": "Multi-Agent Democratic Systems",
                "description": "How multiple AI agents can participate in democratic decision-making processes.",
                "difficulty": "intermediate",
                "estimated_minutes": 40,
                "mic_reward": 65,
                "topics": ["Agent Coordination", "Voting Mechanisms", "Consensus"],
                "prerequisites": ["constitutional-ai-101"],
                "is_active": True,
                "order": 5,
                "questions": [
                    {
                        "id": "q1",
                        "question": "Why might multiple AI agents be preferable to a single powerful AI?",
                        "options": [
                            "Multiple agents are always faster",
                            "Diversity of perspectives and natural checks and balances",
                            "They use less compute",
                            "They are easier to build"
                        ],
                        "correct_answer": 1,
                        "explanation": "Multiple agents provide diverse perspectives and create natural checks and balances, reducing the risk of a single point of failure in reasoning or values.",
                        "difficulty": "easy",
                        "points": 10
                    },
                    {
                        "id": "q2",
                        "question": "What is 'agent consensus' in multi-agent systems?",
                        "options": [
                            "When agents agree on hardware specifications",
                            "A process where agents reach agreement on decisions through structured deliberation",
                            "When agents share the same code",
                            "Automatic agreement on all topics"
                        ],
                        "correct_answer": 1,
                        "explanation": "Agent consensus involves structured processes where multiple agents deliberate, share reasoning, and reach collective decisions - similar to human democratic processes.",
                        "difficulty": "medium",
                        "points": 15
                    },
                    {
                        "id": "q3",
                        "question": "How does the HIVE model prevent 'tyranny of the majority' among agents?",
                        "options": [
                            "By giving some agents more votes",
                            "Through constitutional constraints that protect core principles regardless of vote outcomes",
                            "By limiting the number of agents",
                            "By requiring unanimous agreement"
                        ],
                        "correct_answer": 1,
                        "explanation": "Constitutional constraints in the HIVE model ensure that certain core principles (like the Three Covenants) cannot be violated even by majority vote.",
                        "difficulty": "hard",
                        "points": 20
                    }
                ]
            }
        }
    
    def _init_badges(self) -> Dict[str, dict]:
        """Initialize available badges"""
        return {
            "first-module": {
                "id": "first-module",
                "name": "Getting Started",
                "description": "Completed your first learning module",
                "icon": "🎓",
                "rarity": "common"
            },
            "perfect-score": {
                "id": "perfect-score",
                "name": "Perfectionist",
                "description": "Achieved 100% accuracy on a module",
                "icon": "💯",
                "rarity": "rare"
            },
            "week-streak": {
                "id": "week-streak",
                "name": "Dedicated Learner",
                "description": "Maintained a 7-day learning streak",
                "icon": "🔥",
                "rarity": "epic"
            },
            "all-beginner": {
                "id": "all-beginner",
                "name": "Foundation Builder",
                "description": "Completed all beginner modules",
                "icon": "🏗️",
                "rarity": "epic"
            },
            "constitutional-scholar": {
                "id": "constitutional-scholar",
                "name": "Constitutional Scholar",
                "description": "Completed Constitutional AI 101 with 90%+ accuracy",
                "icon": "📜",
                "rarity": "rare"
            },
            "mic-centurion": {
                "id": "mic-centurion",
                "name": "MIC Centurion",
                "description": "Earned 100+ MIC through learning",
                "icon": "💰",
                "rarity": "rare"
            }
        }
    
    # Module Operations
    # =================
    
    def get_modules(
        self,
        difficulty: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[LearningModuleResponse]:
        """Get all active modules, optionally filtered"""
        modules = []
        user_completions = self.completions.get(user_id, []) if user_id else []
        completed_ids = {c["module_id"] for c in user_completions}
        
        for m in self.modules.values():
            if not m.get("is_active", True):
                continue
            if difficulty and m["difficulty"] != difficulty:
                continue
            
            modules.append(LearningModuleResponse(
                id=m["id"],
                title=m["title"],
                description=m["description"],
                difficulty=DifficultyLevel(m["difficulty"]),
                estimated_minutes=m["estimated_minutes"],
                mic_reward=m["mic_reward"],
                topics=m["topics"],
                prerequisites=m["prerequisites"],
                questions_count=len(m.get("questions", [])),
                is_active=m.get("is_active", True),
                completed=m["id"] in completed_ids,
                progress=1.0 if m["id"] in completed_ids else 0.0
            ))
        
        return sorted(modules, key=lambda x: x.mic_reward)
    
    def get_module(self, module_id: str) -> Optional[ModuleDetailResponse]:
        """Get a specific module with questions"""
        m = self.modules.get(module_id)
        if not m or not m.get("is_active", True):
            return None
        
        questions = [QuestionSchema(**q) for q in m.get("questions", [])]
        
        return ModuleDetailResponse(
            id=m["id"],
            title=m["title"],
            description=m["description"],
            difficulty=DifficultyLevel(m["difficulty"]),
            estimated_minutes=m["estimated_minutes"],
            mic_reward=m["mic_reward"],
            topics=m["topics"],
            prerequisites=m["prerequisites"],
            questions=questions,
            is_active=m.get("is_active", True)
        )
    
    # Session Operations
    # ==================
    
    def create_session(self, user_id: str, module_id: str) -> Optional[dict]:
        """Create a new learning session"""
        module = self.modules.get(module_id)
        if not module:
            return None
        
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        
        session = {
            "id": session_id,
            "user_id": user_id,
            "module_id": module_id,
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "status": "active",
            "questions_answered": 0,
            "correct_answers": 0,
            "current_score": 0,
            "answers": {}  # question_id -> selected_answer
        }
        
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get a session by ID"""
        return self.sessions.get(session_id)
    
    def get_active_session(self, user_id: str, module_id: str) -> Optional[dict]:
        """Get user's active session for a module"""
        for session in self.sessions.values():
            if (session["user_id"] == user_id and 
                session["module_id"] == module_id and
                session["status"] == "active"):
                return session
        return None
    
    def submit_answer(
        self,
        session_id: str,
        question_id: str,
        selected_answer: int
    ) -> Optional[dict]:
        """Submit an answer for a session"""
        session = self.sessions.get(session_id)
        if not session or session["status"] != "active":
            return None
        
        module = self.modules.get(session["module_id"])
        if not module:
            return None
        
        # Find the question
        question = None
        for q in module.get("questions", []):
            if q["id"] == question_id:
                question = q
                break
        
        if not question:
            return None
        
        # Check if already answered
        if question_id in session["answers"]:
            return None
        
        # Record answer
        correct = selected_answer == question["correct_answer"]
        points = question["points"] if correct else 0
        
        session["answers"][question_id] = {
            "selected": selected_answer,
            "correct": correct,
            "points": points
        }
        session["questions_answered"] += 1
        if correct:
            session["correct_answers"] += 1
        session["current_score"] += points
        
        remaining = len(module["questions"]) - session["questions_answered"]
        
        return {
            "question_id": question_id,
            "correct": correct,
            "points_earned": points,
            "explanation": question["explanation"],
            "cumulative_score": session["current_score"],
            "questions_remaining": remaining
        }
    
    def complete_session(self, session_id: str) -> Optional[dict]:
        """Mark a session as completed"""
        session = self.sessions.get(session_id)
        if not session or session["status"] != "active":
            return None
        
        session["status"] = "completed"
        session["completed_at"] = datetime.utcnow().isoformat()
        
        return session
    
    # User Progress Operations
    # ========================
    
    def get_user_progress(self, user_id: str) -> dict:
        """Get or create user progress"""
        if user_id not in self.user_progress:
            self.user_progress[user_id] = {
                "user_id": user_id,
                "total_mic_earned": 0,
                "modules_completed": 0,
                "current_streak": 0,
                "longest_streak": 0,
                "total_learning_minutes": 0,
                "level": 1,
                "experience_points": 0,
                "last_activity": None,
                "integrity_score": 0.85  # Default
            }
        return self.user_progress[user_id]
    
    def update_user_progress(
        self,
        user_id: str,
        mic_earned: int,
        xp_earned: int,
        minutes_spent: int
    ) -> dict:
        """Update user progress after module completion"""
        progress = self.get_user_progress(user_id)
        
        progress["total_mic_earned"] += mic_earned
        progress["modules_completed"] += 1
        progress["total_learning_minutes"] += minutes_spent
        progress["experience_points"] += xp_earned
        
        # Update streak
        today = datetime.utcnow().date()
        if progress["last_activity"]:
            last = datetime.fromisoformat(progress["last_activity"]).date()
            if (today - last).days == 1:
                progress["current_streak"] += 1
            elif (today - last).days > 1:
                progress["current_streak"] = 1
        else:
            progress["current_streak"] = 1
        
        progress["longest_streak"] = max(
            progress["longest_streak"],
            progress["current_streak"]
        )
        progress["last_activity"] = datetime.utcnow().isoformat()
        
        # Level up check
        xp = progress["experience_points"]
        level = 1
        thresholds = [100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6500]
        for i, threshold in enumerate(thresholds):
            if xp >= threshold:
                level = i + 2
        progress["level"] = level
        
        return progress
    
    def record_completion(
        self,
        user_id: str,
        module_id: str,
        accuracy: float,
        mic_earned: int
    ) -> None:
        """Record a module completion"""
        if user_id not in self.completions:
            self.completions[user_id] = []
        
        self.completions[user_id].append({
            "module_id": module_id,
            "completed_at": datetime.utcnow().isoformat(),
            "accuracy": accuracy,
            "mic_earned": mic_earned
        })
    
    def has_completed_module(self, user_id: str, module_id: str) -> bool:
        """Check if user has already completed a module"""
        completions = self.completions.get(user_id, [])
        return any(c["module_id"] == module_id for c in completions)
    
    def get_completed_modules(self, user_id: str) -> List[CompletedModuleInfo]:
        """Get user's completed modules"""
        completions = self.completions.get(user_id, [])
        return [
            CompletedModuleInfo(
                module_id=c["module_id"],
                completed_at=c["completed_at"],
                accuracy=c["accuracy"],
                mic_earned=c["mic_earned"]
            )
            for c in completions
        ]
    
    # Badge Operations
    # ================
    
    def check_and_award_badges(
        self,
        user_id: str,
        module_id: str,
        accuracy: float,
        is_first_module: bool
    ) -> List[BadgeInfo]:
        """Check and award badges based on achievement"""
        awarded = []
        now = datetime.utcnow().isoformat()
        
        if user_id not in self.user_badges:
            self.user_badges[user_id] = []
        
        existing = set(self.user_badges[user_id])
        
        # First module badge
        if is_first_module and "first-module" not in existing:
            self.user_badges[user_id].append("first-module")
            badge = self.badges["first-module"]
            awarded.append(BadgeInfo(
                id=badge["id"],
                name=badge["name"],
                description=badge["description"],
                icon=badge["icon"],
                earned_at=now,
                rarity=badge["rarity"]
            ))
        
        # Perfect score badge
        if accuracy >= 1.0 and "perfect-score" not in existing:
            self.user_badges[user_id].append("perfect-score")
            badge = self.badges["perfect-score"]
            awarded.append(BadgeInfo(
                id=badge["id"],
                name=badge["name"],
                description=badge["description"],
                icon=badge["icon"],
                earned_at=now,
                rarity=badge["rarity"]
            ))
        
        # Constitutional scholar badge
        if (module_id == "constitutional-ai-101" and 
            accuracy >= 0.9 and 
            "constitutional-scholar" not in existing):
            self.user_badges[user_id].append("constitutional-scholar")
            badge = self.badges["constitutional-scholar"]
            awarded.append(BadgeInfo(
                id=badge["id"],
                name=badge["name"],
                description=badge["description"],
                icon=badge["icon"],
                earned_at=now,
                rarity=badge["rarity"]
            ))
        
        # Check MIC centurion
        progress = self.get_user_progress(user_id)
        if (progress["total_mic_earned"] >= 100 and 
            "mic-centurion" not in existing):
            self.user_badges[user_id].append("mic-centurion")
            badge = self.badges["mic-centurion"]
            awarded.append(BadgeInfo(
                id=badge["id"],
                name=badge["name"],
                description=badge["description"],
                icon=badge["icon"],
                earned_at=now,
                rarity=badge["rarity"]
            ))
        
        # Check week streak
        if (progress["current_streak"] >= 7 and 
            "week-streak" not in existing):
            self.user_badges[user_id].append("week-streak")
            badge = self.badges["week-streak"]
            awarded.append(BadgeInfo(
                id=badge["id"],
                name=badge["name"],
                description=badge["description"],
                icon=badge["icon"],
                earned_at=now,
                rarity=badge["rarity"]
            ))
        
        return awarded
    
    def get_user_badges(self, user_id: str) -> List[BadgeInfo]:
        """Get all badges for a user"""
        badge_ids = self.user_badges.get(user_id, [])
        badges = []
        
        for bid in badge_ids:
            if bid in self.badges:
                b = self.badges[bid]
                badges.append(BadgeInfo(
                    id=b["id"],
                    name=b["name"],
                    description=b["description"],
                    icon=b["icon"],
                    earned_at="",  # Would need to store earned_at per user
                    rarity=b["rarity"]
                ))
        
        return badges
    
    def calculate_xp(self, accuracy: float, difficulty: str, time_minutes: int) -> int:
        """Calculate XP earned from module completion"""
        base_xp = {
            "beginner": 25,
            "intermediate": 50,
            "advanced": 100
        }.get(difficulty, 25)
        
        accuracy_bonus = int(base_xp * accuracy * 0.5)
        time_bonus = min(time_minutes, 60) // 10 * 5
        
        return base_xp + accuracy_bonus + time_bonus
    
    def get_next_level_xp(self, current_level: int) -> int:
        """Get XP needed for next level"""
        thresholds = [100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6500]
        if current_level <= len(thresholds):
            return thresholds[current_level - 1]
        return thresholds[-1] + (current_level - len(thresholds)) * 1500


# Global instance
learning_store = LearningStore()

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
        """Initialize sample Constitutional AI learning modules and STEM modules"""
        # Core Mobius modules
        core_modules = {
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
        
        # STEM Learning Modules - 15 comprehensive modules
        stem_modules = self._init_stem_modules()
        
        # Combine all modules
        all_modules = {**core_modules, **stem_modules}
        return all_modules
    
    def _init_stem_modules(self) -> Dict[str, dict]:
        """
        Initialize 15 STEM Learning Modules
        
        Categories:
        - Mathematics (3 modules): Calculus, Linear Algebra, Statistics
        - Computer Science (3 modules): Algorithms, Data Structures, Cryptography
        - AI (3 modules): Neural Networks, Transformers, Reinforcement Learning
        - Physics/Engineering (3 modules): Quantum Computing, Network Theory, Information Theory
        - Science (3 modules): Molecular Biology, Climate Science, Bioinformatics
        
        Total potential earnings: 1,465 MIC
        """
        return {
            # ===================
            # MATHEMATICS (3 modules • 275 MIC)
            # ===================
            "calculus-fundamentals": {
                "id": "calculus-fundamentals",
                "title": "Calculus I: Limits and Derivatives",
                "description": "Master the foundational concepts of calculus including limits, continuity, and differentiation. Learn how rates of change power modern AI and optimization.",
                "difficulty": "intermediate",
                "estimated_minutes": 60,
                "mic_reward": 100,
                "topics": ["Calculus", "Derivatives", "Limits", "Mathematics"],
                "prerequisites": [],
                "is_active": True,
                "order": 10,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is the derivative of f(x) = x²?",
                        "options": ["x", "2x", "x²/2", "2"],
                        "correct_answer": 1,
                        "explanation": "Using the power rule, d/dx(x²) = 2x¹ = 2x. This represents the instantaneous rate of change of the function.",
                        "difficulty": "easy",
                        "points": 15
                    },
                    {
                        "id": "q2",
                        "question": "The limit of (sin x)/x as x approaches 0 equals:",
                        "options": ["0", "1", "∞", "undefined"],
                        "correct_answer": 1,
                        "explanation": "This is a fundamental limit in calculus: lim(x→0) sin(x)/x = 1. This limit is crucial for deriving the derivative of sine.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q3",
                        "question": "In gradient descent optimization (used in AI), why do we need derivatives?",
                        "options": [
                            "To calculate final values",
                            "To find the direction of steepest descent",
                            "To measure computation time",
                            "To store model weights"
                        ],
                        "correct_answer": 1,
                        "explanation": "Derivatives tell us the direction of steepest descent, allowing AI models to minimize loss functions efficiently during training.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            "linear-algebra-ml": {
                "id": "linear-algebra-ml",
                "title": "Linear Algebra for Machine Learning",
                "description": "Understand matrices, vectors, and transformations that power modern AI systems. Learn how neural networks use linear algebra at their core.",
                "difficulty": "intermediate",
                "estimated_minutes": 50,
                "mic_reward": 90,
                "topics": ["Linear Algebra", "Machine Learning", "Mathematics", "AI"],
                "prerequisites": [],
                "is_active": True,
                "order": 11,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is a matrix multiplication's primary use in neural networks?",
                        "options": [
                            "Storing data",
                            "Computing weighted sums of inputs",
                            "Displaying results",
                            "Saving models"
                        ],
                        "correct_answer": 1,
                        "explanation": "Matrix multiplication computes weighted sums efficiently, which is the core operation in every layer of a neural network.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "An eigenvector represents:",
                        "options": [
                            "A direction that doesn't change under transformation",
                            "The largest value in a matrix",
                            "The sum of matrix elements",
                            "A random vector"
                        ],
                        "correct_answer": 0,
                        "explanation": "Eigenvectors are special vectors that only get scaled (not rotated) when a linear transformation is applied. They're crucial for PCA and understanding data structure.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            "probability-statistics-ai": {
                "id": "probability-statistics-ai",
                "title": "Probability & Statistics for AI",
                "description": "Master probability theory and statistical methods that underpin machine learning, from Bayes' theorem to confidence intervals.",
                "difficulty": "intermediate",
                "estimated_minutes": 55,
                "mic_reward": 85,
                "topics": ["Probability", "Statistics", "Machine Learning", "Data Science"],
                "prerequisites": [],
                "is_active": True,
                "order": 12,
                "questions": [
                    {
                        "id": "q1",
                        "question": "Bayes' theorem allows us to:",
                        "options": [
                            "Add probabilities",
                            "Update beliefs based on new evidence",
                            "Calculate averages",
                            "Multiply matrices"
                        ],
                        "correct_answer": 1,
                        "explanation": "Bayes' theorem mathematically describes how to update probability estimates as new evidence becomes available - fundamental to AI reasoning.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "Why is the Central Limit Theorem important for AI?",
                        "options": [
                            "It makes code run faster",
                            "It explains why many distributions become normal with large samples",
                            "It reduces memory usage",
                            "It improves accuracy automatically"
                        ],
                        "correct_answer": 1,
                        "explanation": "The CLT explains why normal distributions appear everywhere in nature and AI, enabling many statistical methods and inference techniques.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            # ===================
            # COMPUTER SCIENCE (3 modules • 285 MIC)
            # ===================
            "algorithms-complexity": {
                "id": "algorithms-complexity",
                "title": "Algorithms & Complexity Theory",
                "description": "Learn algorithmic thinking, Big O notation, and computational complexity. Understand why some problems are hard and how to design efficient solutions.",
                "difficulty": "intermediate",
                "estimated_minutes": 65,
                "mic_reward": 95,
                "topics": ["Algorithms", "Computer Science", "Complexity", "Optimization"],
                "prerequisites": [],
                "is_active": True,
                "order": 20,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is the time complexity of binary search?",
                        "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
                        "correct_answer": 1,
                        "explanation": "Binary search halves the search space each step, giving O(log n) complexity. This is why it's much faster than linear search for sorted data.",
                        "difficulty": "easy",
                        "points": 15
                    },
                    {
                        "id": "q2",
                        "question": "Why can't NP-complete problems be solved efficiently?",
                        "options": [
                            "They require too much memory",
                            "No polynomial-time algorithm is known to exist",
                            "They are impossible to solve",
                            "They require quantum computers"
                        ],
                        "correct_answer": 1,
                        "explanation": "NP-complete problems have no known polynomial-time solutions. Finding one would prove P=NP, one of computer science's biggest open questions.",
                        "difficulty": "hard",
                        "points": 30
                    }
                ]
            },
            
            "data-structures-fundamentals": {
                "id": "data-structures-fundamentals",
                "title": "Data Structures Fundamentals",
                "description": "Master essential data structures: arrays, linked lists, trees, graphs, hash tables. Learn when and why to use each structure.",
                "difficulty": "beginner",
                "estimated_minutes": 45,
                "mic_reward": 70,
                "topics": ["Data Structures", "Computer Science", "Programming"],
                "prerequisites": [],
                "is_active": True,
                "order": 21,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What's the main advantage of a hash table?",
                        "options": [
                            "Uses less memory",
                            "O(1) average lookup time",
                            "Maintains sorted order",
                            "Thread-safe by default"
                        ],
                        "correct_answer": 1,
                        "explanation": "Hash tables provide O(1) average-case lookup, insertion, and deletion - making them ideal for caches, databases, and dictionaries.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "When would you choose a tree over an array?",
                        "options": [
                            "When you need random access",
                            "When you need hierarchical relationships",
                            "When memory is limited",
                            "When you need to append data"
                        ],
                        "correct_answer": 1,
                        "explanation": "Trees excel at representing hierarchical data (file systems, DOM, decision trees) and maintaining sorted order with efficient operations.",
                        "difficulty": "medium",
                        "points": 20
                    }
                ]
            },
            
            "cryptography-blockchain": {
                "id": "cryptography-blockchain",
                "title": "Cryptography & Blockchain Fundamentals",
                "description": "Understand cryptographic primitives, hash functions, public-key cryptography, and how blockchains ensure integrity and decentralization.",
                "difficulty": "advanced",
                "estimated_minutes": 70,
                "mic_reward": 120,
                "topics": ["Cryptography", "Blockchain", "Security", "Distributed Systems"],
                "prerequisites": ["algorithms-complexity"],
                "is_active": True,
                "order": 22,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What property makes SHA-256 suitable for blockchain?",
                        "options": [
                            "It's fast to compute",
                            "It's collision-resistant and deterministic",
                            "It produces short hashes",
                            "It's reversible"
                        ],
                        "correct_answer": 1,
                        "explanation": "SHA-256 is collision-resistant (hard to find two inputs with same output) and deterministic (same input always gives same output), making it perfect for ensuring data integrity.",
                        "difficulty": "medium",
                        "points": 25
                    },
                    {
                        "id": "q2",
                        "question": "How do Byzantine Fault Tolerant systems relate to integrity economics?",
                        "options": [
                            "They prevent all attacks",
                            "They tolerate up to 33% malicious nodes while maintaining consensus",
                            "They eliminate the need for incentives",
                            "They require trusted leaders"
                        ],
                        "correct_answer": 1,
                        "explanation": "BFT systems can reach consensus even when up to 1/3 of nodes are malicious - this mathematical guarantee is crucial for integrity-backed currencies like MIC.",
                        "difficulty": "hard",
                        "points": 30
                    }
                ]
            },
            
            # ===================
            # ARTIFICIAL INTELLIGENCE (3 modules • 340 MIC)
            # ===================
            "neural-networks-intro": {
                "id": "neural-networks-intro",
                "title": "Introduction to Neural Networks",
                "description": "Understand how artificial neural networks learn from data. Master backpropagation, activation functions, and network architectures.",
                "difficulty": "intermediate",
                "estimated_minutes": 60,
                "mic_reward": 100,
                "topics": ["Neural Networks", "Deep Learning", "AI", "Machine Learning"],
                "prerequisites": ["linear-algebra-ml", "calculus-fundamentals"],
                "is_active": True,
                "order": 30,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is the purpose of an activation function?",
                        "options": [
                            "To speed up training",
                            "To introduce non-linearity",
                            "To reduce overfitting",
                            "To initialize weights"
                        ],
                        "correct_answer": 1,
                        "explanation": "Activation functions introduce non-linearity, allowing neural networks to learn complex patterns. Without them, any neural network would be equivalent to linear regression.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "Backpropagation uses which calculus concept?",
                        "options": [
                            "Integration",
                            "Chain rule for derivatives",
                            "Limit theorems",
                            "Differential equations"
                        ],
                        "correct_answer": 1,
                        "explanation": "Backpropagation applies the chain rule to efficiently compute gradients layer by layer, allowing networks to learn from errors.",
                        "difficulty": "hard",
                        "points": 25
                    },
                    {
                        "id": "q3",
                        "question": "How does dropout prevent overfitting?",
                        "options": [
                            "By removing neurons permanently",
                            "By randomly disabling neurons during training",
                            "By reducing learning rate",
                            "By adding more data"
                        ],
                        "correct_answer": 1,
                        "explanation": "Dropout randomly disables neurons during training, forcing the network to learn robust features that don't depend on any single neuron - reducing overfitting.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            "transformers-attention": {
                "id": "transformers-attention",
                "title": "Transformers & Attention Mechanisms",
                "description": "Learn the architecture behind GPT, BERT, and Claude. Understand self-attention, positional encoding, and why transformers revolutionized AI.",
                "difficulty": "advanced",
                "estimated_minutes": 75,
                "mic_reward": 130,
                "topics": ["Transformers", "Attention", "NLP", "Deep Learning"],
                "prerequisites": ["neural-networks-intro"],
                "is_active": True,
                "order": 31,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What problem do attention mechanisms solve?",
                        "options": [
                            "Memory limitations",
                            "Long-range dependencies in sequences",
                            "Training speed",
                            "Model size"
                        ],
                        "correct_answer": 1,
                        "explanation": "Attention allows models to focus on relevant parts of input regardless of distance, solving the long-range dependency problem that plagued RNNs.",
                        "difficulty": "medium",
                        "points": 25
                    },
                    {
                        "id": "q2",
                        "question": "Why do transformers need positional encoding?",
                        "options": [
                            "To reduce computation",
                            "Because attention has no inherent sense of position",
                            "To prevent overfitting",
                            "To initialize weights"
                        ],
                        "correct_answer": 1,
                        "explanation": "Unlike RNNs, attention operations are permutation-invariant. Positional encodings inject information about token order into the model.",
                        "difficulty": "hard",
                        "points": 30
                    }
                ]
            },
            
            "reinforcement-learning": {
                "id": "reinforcement-learning",
                "title": "Reinforcement Learning Fundamentals",
                "description": "Master RL concepts: agents, environments, rewards, Q-learning, policy gradients. Learn how AI systems learn optimal behavior through trial and error.",
                "difficulty": "advanced",
                "estimated_minutes": 65,
                "mic_reward": 110,
                "topics": ["Reinforcement Learning", "AI", "Optimization", "Game Theory"],
                "prerequisites": ["probability-statistics-ai"],
                "is_active": True,
                "order": 32,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is the exploration-exploitation tradeoff?",
                        "options": [
                            "Balancing model size and speed",
                            "Balancing trying new actions vs. using known good actions",
                            "Balancing training and inference time",
                            "Balancing accuracy and interpretability"
                        ],
                        "correct_answer": 1,
                        "explanation": "Agents must balance exploring new actions (to discover better strategies) with exploiting known good actions (to maximize immediate reward).",
                        "difficulty": "medium",
                        "points": 25
                    },
                    {
                        "id": "q2",
                        "question": "How does RL relate to integrity economics in Mobius?",
                        "options": [
                            "It doesn't relate",
                            "Agents learn optimal behavior through reward signals tied to integrity",
                            "It only applies to games",
                            "It replaces human decision-making"
                        ],
                        "correct_answer": 1,
                        "explanation": "In Mobius, MIC rewards create RL-like dynamics where agents (users, AI systems) learn behaviors that maintain system integrity through feedback loops.",
                        "difficulty": "hard",
                        "points": 30
                    }
                ]
            },
            
            # ===================
            # PHYSICS & ENGINEERING (3 modules • 320 MIC)
            # ===================
            "quantum-computing-intro": {
                "id": "quantum-computing-intro",
                "title": "Quantum Computing Fundamentals",
                "description": "Introduction to qubits, superposition, entanglement, and quantum algorithms. Understand how quantum computers will impact AI and cryptography.",
                "difficulty": "advanced",
                "estimated_minutes": 70,
                "mic_reward": 125,
                "topics": ["Quantum Computing", "Physics", "Computer Science"],
                "prerequisites": ["linear-algebra-ml"],
                "is_active": True,
                "order": 40,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is quantum superposition?",
                        "options": [
                            "Adding quantum states together",
                            "A qubit existing in multiple states simultaneously",
                            "Quantum computers being faster",
                            "A type of quantum algorithm"
                        ],
                        "correct_answer": 1,
                        "explanation": "Superposition allows qubits to exist in multiple states (0 and 1) simultaneously until measured, enabling quantum parallelism.",
                        "difficulty": "medium",
                        "points": 25
                    },
                    {
                        "id": "q2",
                        "question": "Why are quantum computers a threat to current cryptography?",
                        "options": [
                            "They're just faster",
                            "Shor's algorithm can factor large numbers efficiently",
                            "They can brute force any password",
                            "They can break any encryption instantly"
                        ],
                        "correct_answer": 1,
                        "explanation": "Shor's algorithm can factor large numbers in polynomial time on quantum computers, breaking RSA encryption which relies on factoring difficulty.",
                        "difficulty": "hard",
                        "points": 30
                    }
                ]
            },
            
            "network-theory-systems": {
                "id": "network-theory-systems",
                "title": "Network Theory & Complex Systems",
                "description": "Study how networks behave, from social graphs to neural networks. Learn about emergence, scale-free networks, and system dynamics.",
                "difficulty": "intermediate",
                "estimated_minutes": 55,
                "mic_reward": 90,
                "topics": ["Network Theory", "Complex Systems", "Graph Theory", "Systems Science"],
                "prerequisites": [],
                "is_active": True,
                "order": 41,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is a scale-free network?",
                        "options": [
                            "A network with no size limit",
                            "A network where degree distribution follows a power law",
                            "A network without hierarchy",
                            "A network that scales linearly"
                        ],
                        "correct_answer": 1,
                        "explanation": "Scale-free networks have a few highly connected hubs and many nodes with few connections - seen in the web, social networks, and protein interactions.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "How do network effects relate to Mobius' integrity systems?",
                        "options": [
                            "They don't relate",
                            "Integrity spreads through networks, creating positive feedback loops",
                            "Networks always reduce integrity",
                            "Only centralized networks matter"
                        ],
                        "correct_answer": 1,
                        "explanation": "In Mobius, integrity creates network effects: as more nodes maintain high integrity, the Global Integrity Index rises, rewarding everyone - a regenerative feedback loop.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            "information-theory": {
                "id": "information-theory",
                "title": "Information Theory & Entropy",
                "description": "Learn Shannon entropy, information content, compression, and how information theory connects to AI, cryptography, and thermodynamics.",
                "difficulty": "advanced",
                "estimated_minutes": 60,
                "mic_reward": 105,
                "topics": ["Information Theory", "Entropy", "Computer Science", "Physics"],
                "prerequisites": ["probability-statistics-ai"],
                "is_active": True,
                "order": 42,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What does Shannon entropy measure?",
                        "options": [
                            "Temperature of information",
                            "Average information content or uncertainty",
                            "Speed of data transfer",
                            "Computational complexity"
                        ],
                        "correct_answer": 1,
                        "explanation": "Shannon entropy quantifies the average information content or uncertainty in a random variable - fundamental to compression, cryptography, and ML.",
                        "difficulty": "medium",
                        "points": 25
                    },
                    {
                        "id": "q2",
                        "question": "Why is cross-entropy loss used in classification?",
                        "options": [
                            "It's easier to compute",
                            "It measures the difference between predicted and true probability distributions",
                            "It's always positive",
                            "It's differentiable"
                        ],
                        "correct_answer": 1,
                        "explanation": "Cross-entropy loss measures how well predicted probabilities match true labels - a direct application of information theory to machine learning.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            # ===================
            # BIOLOGY & SCIENCE (3 modules • 290 MIC)
            # ===================
            "molecular-biology-ai": {
                "id": "molecular-biology-ai",
                "title": "Molecular Biology & AI Applications",
                "description": "Understand DNA, proteins, and cellular systems. Learn how AI is revolutionizing drug discovery, protein folding, and genomics.",
                "difficulty": "intermediate",
                "estimated_minutes": 50,
                "mic_reward": 85,
                "topics": ["Biology", "Bioinformatics", "AI Applications", "Healthcare"],
                "prerequisites": [],
                "is_active": True,
                "order": 50,
                "questions": [
                    {
                        "id": "q1",
                        "question": "How did AlphaFold revolutionize biology?",
                        "options": [
                            "It sequenced genomes faster",
                            "It predicted 3D protein structure from amino acid sequences",
                            "It created new proteins",
                            "It cured diseases"
                        ],
                        "correct_answer": 1,
                        "explanation": "AlphaFold solved the 50-year protein folding problem using AI, enabling researchers to predict protein structures that took decades to determine experimentally.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "Why is CRISPR gene editing revolutionary?",
                        "options": [
                            "It's cheaper than other methods",
                            "It allows precise, targeted DNA editing",
                            "It works on all organisms",
                            "It's completely safe"
                        ],
                        "correct_answer": 1,
                        "explanation": "CRISPR enables precise, targeted gene editing using RNA-guided enzymes, opening possibilities for treating genetic diseases and advancing biotechnology.",
                        "difficulty": "medium",
                        "points": 20
                    }
                ]
            },
            
            "climate-science-ai": {
                "id": "climate-science-ai",
                "title": "Climate Science & AI Modeling",
                "description": "Learn climate system dynamics, carbon cycles, and how AI helps model and mitigate climate change.",
                "difficulty": "intermediate",
                "estimated_minutes": 55,
                "mic_reward": 90,
                "topics": ["Climate Science", "Environmental Science", "AI Applications", "Ecology"],
                "prerequisites": [],
                "is_active": True,
                "order": 51,
                "questions": [
                    {
                        "id": "q1",
                        "question": "How does AI improve climate modeling?",
                        "options": [
                            "It eliminates uncertainty",
                            "It identifies patterns in complex datasets and improves prediction accuracy",
                            "It replaces physical models entirely",
                            "It controls the weather"
                        ],
                        "correct_answer": 1,
                        "explanation": "AI/ML helps identify non-linear patterns in climate data, improve parameterization of physical models, and increase prediction accuracy for regional climate impacts.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "How does the Ecology Covenant relate to climate science?",
                        "options": [
                            "It doesn't relate",
                            "It mandates regenerative systems that restore rather than extract",
                            "It only applies to software",
                            "It requires carbon credits"
                        ],
                        "correct_answer": 1,
                        "explanation": "The Ecology Covenant ensures Mobius systems are regenerative by design - creating positive environmental feedback loops rather than extractive ones.",
                        "difficulty": "hard",
                        "points": 25
                    }
                ]
            },
            
            "bioinformatics-genomics": {
                "id": "bioinformatics-genomics",
                "title": "Bioinformatics & Genomics",
                "description": "Explore computational approaches to biological data. Learn sequence alignment, genome analysis, and AI-driven drug discovery.",
                "difficulty": "advanced",
                "estimated_minutes": 65,
                "mic_reward": 115,
                "topics": ["Bioinformatics", "Genomics", "AI", "Computational Biology"],
                "prerequisites": ["molecular-biology-ai"],
                "is_active": True,
                "order": 52,
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is sequence alignment used for?",
                        "options": [
                            "Making DNA longer",
                            "Finding similarities between genetic sequences",
                            "Storing genetic data",
                            "Creating new genes"
                        ],
                        "correct_answer": 1,
                        "explanation": "Sequence alignment compares DNA, RNA, or protein sequences to identify regions of similarity that may indicate functional, structural, or evolutionary relationships.",
                        "difficulty": "medium",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "question": "How do AI models accelerate drug discovery?",
                        "options": [
                            "They replace clinical trials",
                            "They predict molecular interactions and filter candidates efficiently",
                            "They manufacture drugs faster",
                            "They eliminate side effects"
                        ],
                        "correct_answer": 1,
                        "explanation": "AI models can predict how molecules interact with proteins, filter millions of candidates quickly, and identify promising drug targets - reducing discovery time from years to months.",
                        "difficulty": "hard",
                        "points": 25
                    },
                    {
                        "id": "q3",
                        "question": "What makes genomic data particularly suited for AI analysis?",
                        "options": [
                            "Its simplicity",
                            "High dimensionality and complex patterns beyond human comprehension",
                            "Small dataset sizes",
                            "Lack of noise"
                        ],
                        "correct_answer": 1,
                        "explanation": "Genomic data has high dimensionality with subtle patterns across millions of base pairs. AI excels at finding these complex patterns that humans cannot easily perceive.",
                        "difficulty": "hard",
                        "points": 30
                    }
                ]
            }
        }
    
    def _init_badges(self) -> Dict[str, dict]:
        """Initialize available badges"""
        return {
            # Core Learning Badges
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
            },
            
            # STEM Learning Badges
            "math-master": {
                "id": "math-master",
                "name": "Math Master",
                "description": "Completed all 3 Mathematics modules (Calculus, Linear Algebra, Statistics)",
                "icon": "📐",
                "rarity": "epic"
            },
            "algorithm-ace": {
                "id": "algorithm-ace",
                "name": "Algorithm Ace",
                "description": "Completed all 3 Computer Science modules with 90%+ accuracy",
                "icon": "⚡",
                "rarity": "epic"
            },
            "ai-architect": {
                "id": "ai-architect",
                "name": "AI Architect",
                "description": "Completed all 3 AI modules (Neural Networks, Transformers, RL)",
                "icon": "🤖",
                "rarity": "legendary"
            },
            "quantum-pioneer": {
                "id": "quantum-pioneer",
                "name": "Quantum Pioneer",
                "description": "Completed Quantum Computing Fundamentals with 90%+ accuracy",
                "icon": "⚛️",
                "rarity": "legendary"
            },
            "crypto-guardian": {
                "id": "crypto-guardian",
                "name": "Crypto Guardian",
                "description": "Completed Cryptography & Blockchain with 90%+ accuracy",
                "icon": "🔐",
                "rarity": "epic"
            },
            "bio-innovator": {
                "id": "bio-innovator",
                "name": "Bio Innovator",
                "description": "Completed all Science modules (Molecular Biology, Climate Science, Bioinformatics)",
                "icon": "🧬",
                "rarity": "epic"
            },
            "climate-champion": {
                "id": "climate-champion",
                "name": "Climate Champion",
                "description": "Completed Climate Science & AI Modeling with 90%+ accuracy",
                "icon": "🌍",
                "rarity": "rare"
            },
            "stem-scholar": {
                "id": "stem-scholar",
                "name": "STEM Scholar",
                "description": "Completed all 15 STEM modules",
                "icon": "🧪",
                "rarity": "legendary"
            },
            "neural-navigator": {
                "id": "neural-navigator",
                "name": "Neural Navigator",
                "description": "Completed Neural Networks with perfect score",
                "icon": "🧠",
                "rarity": "epic"
            },
            "transformer-titan": {
                "id": "transformer-titan",
                "name": "Transformer Titan",
                "description": "Completed Transformers & Attention with 90%+ accuracy",
                "icon": "🤖",
                "rarity": "legendary"
            },
            "data-detective": {
                "id": "data-detective",
                "name": "Data Detective",
                "description": "Completed Data Structures and Algorithms modules",
                "icon": "🔍",
                "rarity": "rare"
            },
            "mic-millionaire": {
                "id": "mic-millionaire",
                "name": "MIC Millionaire",
                "description": "Earned 1000+ MIC through learning",
                "icon": "💎",
                "rarity": "legendary"
            },
            "information-theorist": {
                "id": "information-theorist",
                "name": "Information Theorist",
                "description": "Completed Information Theory & Entropy with 90%+ accuracy",
                "icon": "📡",
                "rarity": "epic"
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
        
        def award_badge(badge_id: str) -> None:
            """Helper to award a badge if not already owned"""
            if badge_id not in existing and badge_id in self.badges:
                self.user_badges[user_id].append(badge_id)
                badge = self.badges[badge_id]
                awarded.append(BadgeInfo(
                    id=badge["id"],
                    name=badge["name"],
                    description=badge["description"],
                    icon=badge["icon"],
                    earned_at=now,
                    rarity=badge["rarity"]
                ))
        
        # First module badge
        if is_first_module:
            award_badge("first-module")
        
        # Perfect score badge
        if accuracy >= 1.0:
            award_badge("perfect-score")
        
        # Constitutional scholar badge
        if module_id == "constitutional-ai-101" and accuracy >= 0.9:
            award_badge("constitutional-scholar")
        
        # Get user progress for MIC and streak checks
        progress = self.get_user_progress(user_id)
        user_completions = self.completions.get(user_id, [])
        completed_ids = {c["module_id"] for c in user_completions}
        
        # MIC achievement badges
        if progress["total_mic_earned"] >= 100:
            award_badge("mic-centurion")
        if progress["total_mic_earned"] >= 1000:
            award_badge("mic-millionaire")
        
        # Week streak badge
        if progress["current_streak"] >= 7:
            award_badge("week-streak")
        
        # ===================
        # STEM Module Badges
        # ===================
        
        # Mathematics badges
        math_modules = {"calculus-fundamentals", "linear-algebra-ml", "probability-statistics-ai"}
        if math_modules.issubset(completed_ids):
            award_badge("math-master")
        
        # Computer Science badges
        cs_modules = {"algorithms-complexity", "data-structures-fundamentals", "cryptography-blockchain"}
        if cs_modules.issubset(completed_ids):
            award_badge("algorithm-ace")
        
        # Data detective (algorithms + data structures)
        data_modules = {"algorithms-complexity", "data-structures-fundamentals"}
        if data_modules.issubset(completed_ids):
            award_badge("data-detective")
        
        # AI badges
        ai_modules = {"neural-networks-intro", "transformers-attention", "reinforcement-learning"}
        if ai_modules.issubset(completed_ids):
            award_badge("ai-architect")
        
        # Neural navigator (perfect score on neural networks)
        if module_id == "neural-networks-intro" and accuracy >= 1.0:
            award_badge("neural-navigator")
        
        # Transformer titan (90%+ on transformers)
        if module_id == "transformers-attention" and accuracy >= 0.9:
            award_badge("transformer-titan")
        
        # Science badges
        science_modules = {"molecular-biology-ai", "climate-science-ai", "bioinformatics-genomics"}
        if science_modules.issubset(completed_ids):
            award_badge("bio-innovator")
        
        # Climate champion (90%+ on climate science)
        if module_id == "climate-science-ai" and accuracy >= 0.9:
            award_badge("climate-champion")
        
        # Quantum pioneer (90%+ on quantum computing)
        if module_id == "quantum-computing-intro" and accuracy >= 0.9:
            award_badge("quantum-pioneer")
        
        # Crypto guardian (90%+ on cryptography)
        if module_id == "cryptography-blockchain" and accuracy >= 0.9:
            award_badge("crypto-guardian")
        
        # Information theorist (90%+ on information theory)
        if module_id == "information-theory" and accuracy >= 0.9:
            award_badge("information-theorist")
        
        # STEM Scholar - completed all 15 STEM modules
        stem_modules = {
            # Mathematics
            "calculus-fundamentals", "linear-algebra-ml", "probability-statistics-ai",
            # Computer Science
            "algorithms-complexity", "data-structures-fundamentals", "cryptography-blockchain",
            # AI
            "neural-networks-intro", "transformers-attention", "reinforcement-learning",
            # Physics & Engineering
            "quantum-computing-intro", "network-theory-systems", "information-theory",
            # Science
            "molecular-biology-ai", "climate-science-ai", "bioinformatics-genomics"
        }
        if stem_modules.issubset(completed_ids):
            award_badge("stem-scholar")
        
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

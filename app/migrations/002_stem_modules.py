"""
Add STEM Learning Modules

This migration adds 15 comprehensive STEM modules to the learning system:
- 3 Mathematics modules (Calculus, Linear Algebra, Statistics)
- 3 Computer Science modules (Algorithms, Data Structures, Cryptography)
- 3 AI modules (Neural Networks, Transformers, Reinforcement Learning)
- 3 Physics/Engineering modules (Quantum Computing, Network Theory, Information Theory)
- 3 Science modules (Molecular Biology, Climate Science, Bioinformatics)

Total potential earnings: 1,465 MIC across all STEM modules

Revision ID: 002_stem_modules
Revises: 001_learning_tables
Create Date: 2025-12-16
"""

from alembic import op
import sqlalchemy as sa


revision = '002_stem_modules'
down_revision = '001_learning_tables'
branch_labels = None
depends_on = None


def upgrade():
    """Add STEM learning modules"""
    
    # Mathematics Modules
    op.execute("""
        INSERT INTO learning_modules (id, title, description, difficulty, estimated_minutes, mic_reward, topics, questions, "order") VALUES
        
        -- Calculus
        ('calculus-fundamentals',
         'Calculus I: Limits and Derivatives',
         'Master the foundational concepts of calculus including limits, continuity, and differentiation. Learn how rates of change power modern AI and optimization.',
         'intermediate',
         60,
         100,
         ARRAY['Calculus', 'Derivatives', 'Limits', 'Mathematics'],
         '[
            {"id": "q1", "question": "What is the derivative of f(x) = x²?", "options": ["x", "2x", "x²/2", "2"], "correct_answer": 1, "explanation": "Using the power rule, d/dx(x²) = 2x¹ = 2x. This represents the instantaneous rate of change of the function.", "difficulty": "easy", "points": 15},
            {"id": "q2", "question": "The limit of (sin x)/x as x approaches 0 equals:", "options": ["0", "1", "∞", "undefined"], "correct_answer": 1, "explanation": "This is a fundamental limit in calculus: lim(x→0) sin(x)/x = 1. This limit is crucial for deriving the derivative of sine.", "difficulty": "medium", "points": 20},
            {"id": "q3", "question": "In gradient descent optimization (used in AI), why do we need derivatives?", "options": ["To calculate final values", "To find the direction of steepest descent", "To measure computation time", "To store model weights"], "correct_answer": 1, "explanation": "Derivatives tell us the direction of steepest descent, allowing AI models to minimize loss functions efficiently during training.", "difficulty": "hard", "points": 25}
         ]'::json,
         10),
         
        -- Linear Algebra
        ('linear-algebra-ml',
         'Linear Algebra for Machine Learning',
         'Understand matrices, vectors, and transformations that power modern AI systems. Learn how neural networks use linear algebra at their core.',
         'intermediate',
         50,
         90,
         ARRAY['Linear Algebra', 'Machine Learning', 'Mathematics', 'AI'],
         '[
            {"id": "q1", "question": "What is a matrix multiplication''s primary use in neural networks?", "options": ["Storing data", "Computing weighted sums of inputs", "Displaying results", "Saving models"], "correct_answer": 1, "explanation": "Matrix multiplication computes weighted sums efficiently, which is the core operation in every layer of a neural network.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "An eigenvector represents:", "options": ["A direction that doesn''t change under transformation", "The largest value in a matrix", "The sum of matrix elements", "A random vector"], "correct_answer": 0, "explanation": "Eigenvectors are special vectors that only get scaled (not rotated) when a linear transformation is applied. They''re crucial for PCA and understanding data structure.", "difficulty": "hard", "points": 25}
         ]'::json,
         11),
         
        -- Probability & Statistics
        ('probability-statistics-ai',
         'Probability & Statistics for AI',
         'Master probability theory and statistical methods that underpin machine learning, from Bayes'' theorem to confidence intervals.',
         'intermediate',
         55,
         85,
         ARRAY['Probability', 'Statistics', 'Machine Learning', 'Data Science'],
         '[
            {"id": "q1", "question": "Bayes'' theorem allows us to:", "options": ["Add probabilities", "Update beliefs based on new evidence", "Calculate averages", "Multiply matrices"], "correct_answer": 1, "explanation": "Bayes'' theorem mathematically describes how to update probability estimates as new evidence becomes available - fundamental to AI reasoning.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "Why is the Central Limit Theorem important for AI?", "options": ["It makes code run faster", "It explains why many distributions become normal with large samples", "It reduces memory usage", "It improves accuracy automatically"], "correct_answer": 1, "explanation": "The CLT explains why normal distributions appear everywhere in nature and AI, enabling many statistical methods and inference techniques.", "difficulty": "hard", "points": 25}
         ]'::json,
         12)
    """)
    
    # Computer Science Modules
    op.execute("""
        INSERT INTO learning_modules (id, title, description, difficulty, estimated_minutes, mic_reward, topics, questions, "order") VALUES
        
        -- Algorithms
        ('algorithms-complexity',
         'Algorithms & Complexity Theory',
         'Learn algorithmic thinking, Big O notation, and computational complexity. Understand why some problems are hard and how to design efficient solutions.',
         'intermediate',
         65,
         95,
         ARRAY['Algorithms', 'Computer Science', 'Complexity', 'Optimization'],
         '[
            {"id": "q1", "question": "What is the time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"], "correct_answer": 1, "explanation": "Binary search halves the search space each step, giving O(log n) complexity. This is why it''s much faster than linear search for sorted data.", "difficulty": "easy", "points": 15},
            {"id": "q2", "question": "Why can''t NP-complete problems be solved efficiently?", "options": ["They require too much memory", "No polynomial-time algorithm is known to exist", "They are impossible to solve", "They require quantum computers"], "correct_answer": 1, "explanation": "NP-complete problems have no known polynomial-time solutions. Finding one would prove P=NP, one of computer science''s biggest open questions.", "difficulty": "hard", "points": 30}
         ]'::json,
         20),
         
        -- Data Structures
        ('data-structures-fundamentals',
         'Data Structures Fundamentals',
         'Master essential data structures: arrays, linked lists, trees, graphs, hash tables. Learn when and why to use each structure.',
         'beginner',
         45,
         70,
         ARRAY['Data Structures', 'Computer Science', 'Programming'],
         '[
            {"id": "q1", "question": "What''s the main advantage of a hash table?", "options": ["Uses less memory", "O(1) average lookup time", "Maintains sorted order", "Thread-safe by default"], "correct_answer": 1, "explanation": "Hash tables provide O(1) average-case lookup, insertion, and deletion - making them ideal for caches, databases, and dictionaries.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "When would you choose a tree over an array?", "options": ["When you need random access", "When you need hierarchical relationships", "When memory is limited", "When you need to append data"], "correct_answer": 1, "explanation": "Trees excel at representing hierarchical data (file systems, DOM, decision trees) and maintaining sorted order with efficient operations.", "difficulty": "medium", "points": 20}
         ]'::json,
         21),
         
        -- Cryptography
        ('cryptography-blockchain',
         'Cryptography & Blockchain Fundamentals',
         'Understand cryptographic primitives, hash functions, public-key cryptography, and how blockchains ensure integrity and decentralization.',
         'advanced',
         70,
         120,
         ARRAY['Cryptography', 'Blockchain', 'Security', 'Distributed Systems'],
         '[
            {"id": "q1", "question": "What property makes SHA-256 suitable for blockchain?", "options": ["It''s fast to compute", "It''s collision-resistant and deterministic", "It produces short hashes", "It''s reversible"], "correct_answer": 1, "explanation": "SHA-256 is collision-resistant (hard to find two inputs with same output) and deterministic (same input always gives same output), making it perfect for ensuring data integrity.", "difficulty": "medium", "points": 25},
            {"id": "q2", "question": "How do Byzantine Fault Tolerant systems relate to integrity economics?", "options": ["They prevent all attacks", "They tolerate up to 33% malicious nodes while maintaining consensus", "They eliminate the need for incentives", "They require trusted leaders"], "correct_answer": 1, "explanation": "BFT systems can reach consensus even when up to 1/3 of nodes are malicious - this mathematical guarantee is crucial for integrity-backed currencies like MIC.", "difficulty": "hard", "points": 30}
         ]'::json,
         22)
    """)
    
    # AI Modules
    op.execute("""
        INSERT INTO learning_modules (id, title, description, difficulty, estimated_minutes, mic_reward, topics, questions, "order") VALUES
        
        -- Neural Networks
        ('neural-networks-intro',
         'Introduction to Neural Networks',
         'Understand how artificial neural networks learn from data. Master backpropagation, activation functions, and network architectures.',
         'intermediate',
         60,
         100,
         ARRAY['Neural Networks', 'Deep Learning', 'AI', 'Machine Learning'],
         '[
            {"id": "q1", "question": "What is the purpose of an activation function?", "options": ["To speed up training", "To introduce non-linearity", "To reduce overfitting", "To initialize weights"], "correct_answer": 1, "explanation": "Activation functions introduce non-linearity, allowing neural networks to learn complex patterns. Without them, any neural network would be equivalent to linear regression.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "Backpropagation uses which calculus concept?", "options": ["Integration", "Chain rule for derivatives", "Limit theorems", "Differential equations"], "correct_answer": 1, "explanation": "Backpropagation applies the chain rule to efficiently compute gradients layer by layer, allowing networks to learn from errors.", "difficulty": "hard", "points": 25},
            {"id": "q3", "question": "How does dropout prevent overfitting?", "options": ["By removing neurons permanently", "By randomly disabling neurons during training", "By reducing learning rate", "By adding more data"], "correct_answer": 1, "explanation": "Dropout randomly disables neurons during training, forcing the network to learn robust features that don''t depend on any single neuron - reducing overfitting.", "difficulty": "hard", "points": 25}
         ]'::json,
         30),
         
        -- Transformers
        ('transformers-attention',
         'Transformers & Attention Mechanisms',
         'Learn the architecture behind GPT, BERT, and Claude. Understand self-attention, positional encoding, and why transformers revolutionized AI.',
         'advanced',
         75,
         130,
         ARRAY['Transformers', 'Attention', 'NLP', 'Deep Learning'],
         '[
            {"id": "q1", "question": "What problem do attention mechanisms solve?", "options": ["Memory limitations", "Long-range dependencies in sequences", "Training speed", "Model size"], "correct_answer": 1, "explanation": "Attention allows models to focus on relevant parts of input regardless of distance, solving the long-range dependency problem that plagued RNNs.", "difficulty": "medium", "points": 25},
            {"id": "q2", "question": "Why do transformers need positional encoding?", "options": ["To reduce computation", "Because attention has no inherent sense of position", "To prevent overfitting", "To initialize weights"], "correct_answer": 1, "explanation": "Unlike RNNs, attention operations are permutation-invariant. Positional encodings inject information about token order into the model.", "difficulty": "hard", "points": 30}
         ]'::json,
         31),
         
        -- Reinforcement Learning
        ('reinforcement-learning',
         'Reinforcement Learning Fundamentals',
         'Master RL concepts: agents, environments, rewards, Q-learning, policy gradients. Learn how AI systems learn optimal behavior through trial and error.',
         'advanced',
         65,
         110,
         ARRAY['Reinforcement Learning', 'AI', 'Optimization', 'Game Theory'],
         '[
            {"id": "q1", "question": "What is the exploration-exploitation tradeoff?", "options": ["Balancing model size and speed", "Balancing trying new actions vs. using known good actions", "Balancing training and inference time", "Balancing accuracy and interpretability"], "correct_answer": 1, "explanation": "Agents must balance exploring new actions (to discover better strategies) with exploiting known good actions (to maximize immediate reward).", "difficulty": "medium", "points": 25},
            {"id": "q2", "question": "How does RL relate to integrity economics in Mobius?", "options": ["It doesn''t relate", "Agents learn optimal behavior through reward signals tied to integrity", "It only applies to games", "It replaces human decision-making"], "correct_answer": 1, "explanation": "In Mobius, MIC rewards create RL-like dynamics where agents (users, AI systems) learn behaviors that maintain system integrity through feedback loops.", "difficulty": "hard", "points": 30}
         ]'::json,
         32)
    """)
    
    # Physics & Engineering Modules
    op.execute("""
        INSERT INTO learning_modules (id, title, description, difficulty, estimated_minutes, mic_reward, topics, questions, "order") VALUES
        
        -- Quantum Computing
        ('quantum-computing-intro',
         'Quantum Computing Fundamentals',
         'Introduction to qubits, superposition, entanglement, and quantum algorithms. Understand how quantum computers will impact AI and cryptography.',
         'advanced',
         70,
         125,
         ARRAY['Quantum Computing', 'Physics', 'Computer Science'],
         '[
            {"id": "q1", "question": "What is quantum superposition?", "options": ["Adding quantum states together", "A qubit existing in multiple states simultaneously", "Quantum computers being faster", "A type of quantum algorithm"], "correct_answer": 1, "explanation": "Superposition allows qubits to exist in multiple states (0 and 1) simultaneously until measured, enabling quantum parallelism.", "difficulty": "medium", "points": 25},
            {"id": "q2", "question": "Why are quantum computers a threat to current cryptography?", "options": ["They''re just faster", "Shor''s algorithm can factor large numbers efficiently", "They can brute force any password", "They can break any encryption instantly"], "correct_answer": 1, "explanation": "Shor''s algorithm can factor large numbers in polynomial time on quantum computers, breaking RSA encryption which relies on factoring difficulty.", "difficulty": "hard", "points": 30}
         ]'::json,
         40),
         
        -- Network Theory
        ('network-theory-systems',
         'Network Theory & Complex Systems',
         'Study how networks behave, from social graphs to neural networks. Learn about emergence, scale-free networks, and system dynamics.',
         'intermediate',
         55,
         90,
         ARRAY['Network Theory', 'Complex Systems', 'Graph Theory', 'Systems Science'],
         '[
            {"id": "q1", "question": "What is a scale-free network?", "options": ["A network with no size limit", "A network where degree distribution follows a power law", "A network without hierarchy", "A network that scales linearly"], "correct_answer": 1, "explanation": "Scale-free networks have a few highly connected hubs and many nodes with few connections - seen in the web, social networks, and protein interactions.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "How do network effects relate to Mobius'' integrity systems?", "options": ["They don''t relate", "Integrity spreads through networks, creating positive feedback loops", "Networks always reduce integrity", "Only centralized networks matter"], "correct_answer": 1, "explanation": "In Mobius, integrity creates network effects: as more nodes maintain high integrity, the Global Integrity Index rises, rewarding everyone - a regenerative feedback loop.", "difficulty": "hard", "points": 25}
         ]'::json,
         41),
         
        -- Information Theory
        ('information-theory',
         'Information Theory & Entropy',
         'Learn Shannon entropy, information content, compression, and how information theory connects to AI, cryptography, and thermodynamics.',
         'advanced',
         60,
         105,
         ARRAY['Information Theory', 'Entropy', 'Computer Science', 'Physics'],
         '[
            {"id": "q1", "question": "What does Shannon entropy measure?", "options": ["Temperature of information", "Average information content or uncertainty", "Speed of data transfer", "Computational complexity"], "correct_answer": 1, "explanation": "Shannon entropy quantifies the average information content or uncertainty in a random variable - fundamental to compression, cryptography, and ML.", "difficulty": "medium", "points": 25},
            {"id": "q2", "question": "Why is cross-entropy loss used in classification?", "options": ["It''s easier to compute", "It measures the difference between predicted and true probability distributions", "It''s always positive", "It''s differentiable"], "correct_answer": 1, "explanation": "Cross-entropy loss measures how well predicted probabilities match true labels - a direct application of information theory to machine learning.", "difficulty": "hard", "points": 25}
         ]'::json,
         42)
    """)
    
    # Biology & Science Modules
    op.execute("""
        INSERT INTO learning_modules (id, title, description, difficulty, estimated_minutes, mic_reward, topics, questions, "order") VALUES
        
        -- Molecular Biology
        ('molecular-biology-ai',
         'Molecular Biology & AI Applications',
         'Understand DNA, proteins, and cellular systems. Learn how AI is revolutionizing drug discovery, protein folding, and genomics.',
         'intermediate',
         50,
         85,
         ARRAY['Biology', 'Bioinformatics', 'AI Applications', 'Healthcare'],
         '[
            {"id": "q1", "question": "How did AlphaFold revolutionize biology?", "options": ["It sequenced genomes faster", "It predicted 3D protein structure from amino acid sequences", "It created new proteins", "It cured diseases"], "correct_answer": 1, "explanation": "AlphaFold solved the 50-year protein folding problem using AI, enabling researchers to predict protein structures that took decades to determine experimentally.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "Why is CRISPR gene editing revolutionary?", "options": ["It''s cheaper than other methods", "It allows precise, targeted DNA editing", "It works on all organisms", "It''s completely safe"], "correct_answer": 1, "explanation": "CRISPR enables precise, targeted gene editing using RNA-guided enzymes, opening possibilities for treating genetic diseases and advancing biotechnology.", "difficulty": "medium", "points": 20}
         ]'::json,
         50),
         
        -- Climate Science
        ('climate-science-ai',
         'Climate Science & AI Modeling',
         'Learn climate system dynamics, carbon cycles, and how AI helps model and mitigate climate change.',
         'intermediate',
         55,
         90,
         ARRAY['Climate Science', 'Environmental Science', 'AI Applications', 'Ecology'],
         '[
            {"id": "q1", "question": "How does AI improve climate modeling?", "options": ["It eliminates uncertainty", "It identifies patterns in complex datasets and improves prediction accuracy", "It replaces physical models entirely", "It controls the weather"], "correct_answer": 1, "explanation": "AI/ML helps identify non-linear patterns in climate data, improve parameterization of physical models, and increase prediction accuracy for regional climate impacts.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "How does the Ecology Covenant relate to climate science?", "options": ["It doesn''t relate", "It mandates regenerative systems that restore rather than extract", "It only applies to software", "It requires carbon credits"], "correct_answer": 1, "explanation": "The Ecology Covenant ensures Mobius systems are regenerative by design - creating positive environmental feedback loops rather than extractive ones.", "difficulty": "hard", "points": 25}
         ]'::json,
         51),
         
        -- Bioinformatics (15th module to complete the set)
        ('bioinformatics-genomics',
         'Bioinformatics & Genomics',
         'Explore computational approaches to biological data. Learn sequence alignment, genome analysis, and AI-driven drug discovery.',
         'advanced',
         65,
         115,
         ARRAY['Bioinformatics', 'Genomics', 'AI', 'Computational Biology'],
         '[
            {"id": "q1", "question": "What is sequence alignment used for?", "options": ["Making DNA longer", "Finding similarities between genetic sequences", "Storing genetic data", "Creating new genes"], "correct_answer": 1, "explanation": "Sequence alignment compares DNA, RNA, or protein sequences to identify regions of similarity that may indicate functional, structural, or evolutionary relationships.", "difficulty": "medium", "points": 20},
            {"id": "q2", "question": "How do AI models accelerate drug discovery?", "options": ["They replace clinical trials", "They predict molecular interactions and filter candidates efficiently", "They manufacture drugs faster", "They eliminate side effects"], "correct_answer": 1, "explanation": "AI models can predict how molecules interact with proteins, filter millions of candidates quickly, and identify promising drug targets - reducing discovery time from years to months.", "difficulty": "hard", "points": 25},
            {"id": "q3", "question": "What makes genomic data particularly suited for AI analysis?", "options": ["Its simplicity", "High dimensionality and complex patterns beyond human comprehension", "Small dataset sizes", "Lack of noise"], "correct_answer": 1, "explanation": "Genomic data has high dimensionality with subtle patterns across millions of base pairs. AI excels at finding these complex patterns that humans cannot easily perceive.", "difficulty": "hard", "points": 30}
         ]'::json,
         52)
    """)


def downgrade():
    """Remove STEM learning modules"""
    op.execute("""
        DELETE FROM learning_modules WHERE id IN (
            -- Mathematics
            'calculus-fundamentals',
            'linear-algebra-ml',
            'probability-statistics-ai',
            -- Computer Science
            'algorithms-complexity',
            'data-structures-fundamentals',
            'cryptography-blockchain',
            -- AI
            'neural-networks-intro',
            'transformers-attention',
            'reinforcement-learning',
            -- Physics & Engineering
            'quantum-computing-intro',
            'network-theory-systems',
            'information-theory',
            -- Biology & Science
            'molecular-biology-ai',
            'climate-science-ai',
            'bioinformatics-genomics'
        )
    """)

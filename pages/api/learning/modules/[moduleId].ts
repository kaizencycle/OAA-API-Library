/**
 * Learning Module Detail API
 * GET /api/learning/modules/[moduleId]
 * 
 * Get detailed module information including questions
 */

import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = process.env.OAA_API_URL || "https://oaa-api-library.onrender.com";

// Sample module details with questions
const MODULE_DETAILS: Record<string, any> = {
  "constitutional-ai-101": {
    id: "constitutional-ai-101",
    title: "Constitutional AI Fundamentals",
    description: "Learn how AI systems can be constrained by constitutional principles to serve humanity.",
    difficulty: "beginner",
    estimated_minutes: 30,
    mic_reward: 50,
    topics: ["AI Alignment", "Constitutional Constraints", "Three Covenants"],
    prerequisites: [],
    is_active: true,
    questions: [
      {
        id: "q1",
        question: "What is the primary purpose of Constitutional AI?",
        options: [
          "To make AI systems faster",
          "To constrain AI behavior with explicit principles and values",
          "To make AI systems cheaper to run",
          "To replace human decision-making"
        ],
        correct_answer: 1,
        explanation: "Constitutional AI constrains AI systems with explicit constitutional principles, ensuring they operate within defined ethical boundaries and serve human values.",
        difficulty: "easy",
        points: 10
      },
      {
        id: "q2",
        question: "Which of the Three Covenants emphasizes long-term responsibility over short-term gains?",
        options: [
          "Integrity",
          "Ecology",
          "Custodianship",
          "All of the above"
        ],
        correct_answer: 2,
        explanation: "Custodianship emphasizes intergenerational responsibility and long-term stewardship over short-term extraction.",
        difficulty: "medium",
        points: 15
      },
      {
        id: "q3",
        question: "How does Constitutional AI differ from traditional AI alignment approaches?",
        options: [
          "It uses more training data",
          "It embeds constraints at the reasoning substrate level",
          "It requires less compute power",
          "It works without human oversight"
        ],
        correct_answer: 1,
        explanation: "Constitutional AI embeds constraints at the substrate level of AI reasoning, making constitutional principles fundamental to how the AI thinks, not just what it outputs.",
        difficulty: "hard",
        points: 20
      }
    ]
  },
  "integrity-economics": {
    id: "integrity-economics",
    title: "Integrity Economics & MIC",
    description: "Understanding how integrity-backed currency creates sustainable economic systems.",
    difficulty: "intermediate",
    estimated_minutes: 45,
    mic_reward: 75,
    topics: ["MIC Tokenomics", "Circuit Breakers", "Time Security"],
    prerequisites: ["constitutional-ai-101"],
    is_active: true,
    questions: [
      {
        id: "q1",
        question: "What does MIC stand for in the Mobius ecosystem?",
        options: [
          "Monetary Investment Certificate",
          "Mobius Integrity Credits",
          "Multi-Instance Currency",
          "Machine Intelligence Coin"
        ],
        correct_answer: 1,
        explanation: "MIC stands for Mobius Integrity Credits - a currency backed by verified integrity work within the ecosystem.",
        difficulty: "easy",
        points: 10
      },
      {
        id: "q2",
        question: "What triggers a circuit breaker in the MIC minting system?",
        options: [
          "High transaction volume",
          "Low Global Integrity Index (GII)",
          "Server maintenance",
          "User request"
        ],
        correct_answer: 1,
        explanation: "Circuit breakers activate when the Global Integrity Index falls below threshold (typically 0.60), halting minting to protect system integrity.",
        difficulty: "medium",
        points: 15
      },
      {
        id: "q3",
        question: "How is the MIC reward calculated for learning modules?",
        options: [
          "Fixed amount per module",
          "Based on time spent only",
          "Base reward × accuracy × integrity score × GII multiplier",
          "Random distribution"
        ],
        correct_answer: 2,
        explanation: "MIC rewards are calculated using the formula: Base × Accuracy × Integrity × GII, ensuring rewards align with demonstrated learning and system health.",
        difficulty: "hard",
        points: 20
      }
    ]
  },
  "three-covenants": {
    id: "three-covenants",
    title: "The Three Covenants in Practice",
    description: "Deep dive into Integrity, Ecology, and Custodianship as operational principles.",
    difficulty: "beginner",
    estimated_minutes: 25,
    mic_reward: 40,
    topics: ["Integrity", "Ecology", "Custodianship", "Ethics"],
    prerequisites: [],
    is_active: true,
    questions: [
      {
        id: "q1",
        question: "The Integrity Covenant primarily focuses on:",
        options: [
          "Financial returns",
          "Truthfulness, consistency, and alignment between stated and actual values",
          "Speed of processing",
          "User interface design"
        ],
        correct_answer: 1,
        explanation: "The Integrity Covenant ensures that systems maintain truthfulness and consistency between what they claim to value and how they actually behave.",
        difficulty: "easy",
        points: 10
      },
      {
        id: "q2",
        question: "How does the Ecology Covenant influence system design?",
        options: [
          "It requires solar-powered servers",
          "It emphasizes sustainable, non-extractive relationships with all stakeholders",
          "It bans all carbon emissions",
          "It only applies to environmental organizations"
        ],
        correct_answer: 1,
        explanation: "The Ecology Covenant promotes sustainable, regenerative relationships rather than extractive ones - applying to human, economic, and environmental ecosystems.",
        difficulty: "medium",
        points: 15
      },
      {
        id: "q3",
        question: "What distinguishes Custodianship from ownership in the Mobius context?",
        options: [
          "Custodians earn more MIC",
          "Custodianship implies responsibility to future generations, not just current rights",
          "There is no difference",
          "Custodians have fewer permissions"
        ],
        correct_answer: 1,
        explanation: "Custodianship reframes the relationship from 'ownership with rights' to 'stewardship with responsibilities' - caring for resources on behalf of future generations.",
        difficulty: "medium",
        points: 15
      }
    ]
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { moduleId } = req.query;
  const id = String(moduleId);

  try {
    const response = await fetch(`${API_BASE}/api/learning/modules/${id}`, {
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ ok: true, module: data });
    }
  } catch (error: any) {
    console.warn("Failed to fetch module from API:", error.message);
  }

  // Fallback to sample data
  const module = MODULE_DETAILS[id];
  
  if (!module) {
    return res.status(404).json({ ok: false, error: "module_not_found" });
  }

  return res.status(200).json({ ok: true, module, source: "demo" });
}

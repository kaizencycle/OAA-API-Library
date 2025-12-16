/**
 * Learning Modules API
 * GET /api/learning/modules
 * 
 * Lists available learning modules with MIC rewards
 */

import type { NextApiRequest, NextApiResponse } from "next";

// API base URL (configure via environment)
const API_BASE = process.env.OAA_API_URL || "https://oaa-api-library.onrender.com";

// Sample modules for demo/fallback mode
const SAMPLE_MODULES = [
  {
    id: "constitutional-ai-101",
    title: "Constitutional AI Fundamentals",
    description: "Learn how AI systems can be constrained by constitutional principles to serve humanity.",
    difficulty: "beginner",
    estimated_minutes: 30,
    mic_reward: 50,
    topics: ["AI Alignment", "Constitutional Constraints", "Three Covenants"],
    prerequisites: [],
    questions_count: 3,
    is_active: true,
    completed: false,
    progress: 0
  },
  {
    id: "integrity-economics",
    title: "Integrity Economics & MIC",
    description: "Understanding how integrity-backed currency creates sustainable economic systems.",
    difficulty: "intermediate",
    estimated_minutes: 45,
    mic_reward: 75,
    topics: ["MIC Tokenomics", "Circuit Breakers", "Time Security"],
    prerequisites: ["constitutional-ai-101"],
    questions_count: 3,
    is_active: true,
    completed: false,
    progress: 0
  },
  {
    id: "drift-suppression",
    title: "Drift Suppression Mechanisms",
    description: "Understanding how Mobius prevents value drift and maintains alignment over time.",
    difficulty: "advanced",
    estimated_minutes: 60,
    mic_reward: 100,
    topics: ["Value Alignment", "Drift Detection", "Correction Mechanisms"],
    prerequisites: ["constitutional-ai-101", "integrity-economics"],
    questions_count: 3,
    is_active: true,
    completed: false,
    progress: 0
  },
  {
    id: "three-covenants",
    title: "The Three Covenants in Practice",
    description: "Deep dive into Integrity, Ecology, and Custodianship as operational principles.",
    difficulty: "beginner",
    estimated_minutes: 25,
    mic_reward: 40,
    topics: ["Integrity", "Ecology", "Custodianship", "Ethics"],
    prerequisites: [],
    questions_count: 3,
    is_active: true,
    completed: false,
    progress: 0
  },
  {
    id: "multi-agent-democracy",
    title: "Multi-Agent Democratic Systems",
    description: "How multiple AI agents can participate in democratic decision-making processes.",
    difficulty: "intermediate",
    estimated_minutes: 40,
    mic_reward: 65,
    topics: ["Agent Coordination", "Voting Mechanisms", "Consensus"],
    prerequisites: ["constitutional-ai-101"],
    questions_count: 3,
    is_active: true,
    completed: false,
    progress: 0
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { difficulty, user_id } = req.query;

  try {
    // Try to fetch from backend API
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", String(difficulty));
    if (user_id) params.set("user_id", String(user_id));

    const url = `${API_BASE}/api/learning/modules${params.toString() ? `?${params}` : ""}`;
    
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.status(200).json({ ok: true, ...data });
    }

    // Fallback to sample data if API unavailable
    console.warn("Learning API unavailable, using sample data");
  } catch (error: any) {
    console.warn("Failed to fetch from API:", error.message);
  }

  // Return sample modules as fallback
  let modules = [...SAMPLE_MODULES];
  
  if (difficulty) {
    modules = modules.filter(m => m.difficulty === difficulty);
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  return res.status(200).json({
    ok: true,
    modules,
    total: modules.length,
    page: 1,
    page_size: modules.length,
    source: "demo"
  });
}

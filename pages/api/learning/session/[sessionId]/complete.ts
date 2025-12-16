/**
 * Complete Learning Session API
 * POST /api/learning/session/[sessionId]/complete
 * 
 * Completes a learning session and mints MIC rewards
 */

import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = process.env.OAA_API_URL || "https://oaa-api-library.onrender.com";

// MIC calculation constants
const MIN_ACCURACY = 0.70;
const MIN_INTEGRITY = 0.70;

interface CompletionRequest {
  questions_answered: number;
  correct_answers: number;
  total_points: number;
  earned_points: number;
  accuracy: number;
  time_spent_minutes: number;
  module_id: string;
  user_id: string;
}

function calculateMicReward(
  baseReward: number,
  accuracy: number,
  integrityScore: number = 0.85,
  giiMultiplier: number = 1.0,
  difficultyMultiplier: number = 1.0,
  streakBonus: number = 0,
  isFirstCompletion: boolean = false
): number {
  // Clamp accuracy to minimum
  const accuracyMult = Math.max(accuracy, MIN_ACCURACY);
  
  // Calculate base MIC
  const baseMic = baseReward * accuracyMult * integrityScore * giiMultiplier * difficultyMultiplier;
  
  // Apply streak bonus
  const withBonus = baseMic * (1 + streakBonus);
  
  // Add first completion bonus
  const firstBonus = isFirstCompletion ? 20 : 0;
  
  return Math.floor(withBonus) + firstBonus;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { sessionId } = req.query;
  const data: CompletionRequest = req.body;

  // Validate required fields
  if (!data.questions_answered || data.accuracy === undefined) {
    return res.status(400).json({
      ok: false,
      error: "missing_fields",
      message: "questions_answered and accuracy are required"
    });
  }

  // Validate accuracy threshold
  if (data.accuracy < MIN_ACCURACY) {
    return res.status(402).json({
      ok: false,
      error: "accuracy_too_low",
      message: `Minimum ${MIN_ACCURACY * 100}% accuracy required for MIC rewards`,
      accuracy: data.accuracy
    });
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/learning/session/${sessionId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          ...data
        })
      }
    );

    if (response.ok) {
      const result = await response.json();
      return res.status(200).json({ ok: true, ...result });
    }

    const error = await response.json();
    return res.status(response.status).json({ ok: false, ...error });
  } catch (error: any) {
    console.warn("Failed to complete session via API:", error.message);
    
    // Demo mode: calculate rewards locally
    const baseRewards: Record<string, number> = {
      "constitutional-ai-101": 50,
      "integrity-economics": 75,
      "drift-suppression": 100,
      "three-covenants": 40,
      "multi-agent-democracy": 65
    };
    
    const difficultyMultipliers: Record<string, number> = {
      beginner: 1.0,
      intermediate: 1.2,
      advanced: 1.5
    };

    const moduleId = data.module_id || "constitutional-ai-101";
    const baseReward = baseRewards[moduleId] || 50;
    
    const micEarned = calculateMicReward(
      baseReward,
      data.accuracy,
      0.85,  // Demo integrity score
      1.0,   // Healthy system (GII multiplier)
      1.0,   // Default difficulty
      0,     // No streak bonus in demo
      true   // First completion
    );

    const xpEarned = Math.floor(25 + (data.accuracy * 25) + (data.time_spent_minutes / 2));

    return res.status(200).json({
      ok: true,
      session_id: sessionId,
      module_id: moduleId,
      accuracy: data.accuracy,
      mic_earned: micEarned,
      xp_earned: xpEarned,
      new_level: 1,
      integrity_score: 0.85,
      transaction_id: `demo_tx_${Date.now()}`,
      status: "completed",
      rewards: {
        mic: micEarned,
        xp: xpEarned,
        badges: data.accuracy >= 1.0 ? 1 : 0
      },
      bonuses: {
        base_reward: baseReward,
        accuracy_multiplier: Math.max(data.accuracy, MIN_ACCURACY),
        integrity_multiplier: 0.85,
        gii_multiplier: 1.0,
        difficulty_multiplier: 1.0,
        streak_bonus: 0,
        perfect_bonus: data.accuracy >= 1.0 ? 0.1 : 0,
        first_completion_bonus: 20
      },
      circuit_breaker_status: "healthy",
      source: "demo"
    });
  }
}

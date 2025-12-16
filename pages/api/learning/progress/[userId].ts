/**
 * User Learning Progress API
 * GET /api/learning/progress/[userId]
 * 
 * Get comprehensive learning progress for a user
 */

import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = process.env.OAA_API_URL || "https://oaa-api-library.onrender.com";

// Demo progress data
const DEMO_PROGRESS = {
  total_mic_earned: 0,
  modules_completed: 0,
  current_streak: 0,
  longest_streak: 0,
  total_learning_minutes: 0,
  level: 1,
  experience_points: 0,
  next_level_xp: 100,
  integrity_score: 0.85,
  badges: [],
  completed_modules: []
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { userId } = req.query;
  const id = String(userId);

  try {
    const response = await fetch(
      `${API_BASE}/api/learning/users/${id}/progress`,
      {
        headers: { "Accept": "application/json" }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ ok: true, ...data });
    }
  } catch (error: any) {
    console.warn("Failed to fetch progress from API:", error.message);
  }

  // Return demo progress
  return res.status(200).json({
    ok: true,
    user_id: id,
    ...DEMO_PROGRESS,
    source: "demo"
  });
}

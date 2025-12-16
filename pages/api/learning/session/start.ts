/**
 * Start Learning Session API
 * POST /api/learning/session/start
 * 
 * Creates a new learning session and returns module questions
 */

import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = process.env.OAA_API_URL || "https://oaa-api-library.onrender.com";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const { module_id, user_id } = req.body;

  if (!module_id || !user_id) {
    return res.status(400).json({
      ok: false,
      error: "missing_fields",
      message: "module_id and user_id are required"
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/learning/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        module_id,
        user_id,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(201).json({ ok: true, ...data });
    }

    const error = await response.json();
    return res.status(response.status).json({ ok: false, ...error });
  } catch (error: any) {
    console.error("Failed to start session:", error.message);
    
    // Fallback to demo session
    const sessionId = `demo_session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    
    return res.status(201).json({
      ok: true,
      session_id: sessionId,
      module_id,
      start_time: new Date().toISOString(),
      status: "active",
      source: "demo"
    });
  }
}

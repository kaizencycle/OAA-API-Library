/**
 * Learning System Status API
 * GET /api/learning/system-status
 * 
 * Get current system status including circuit breaker state
 */

import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = process.env.OAA_API_URL || "https://oaa-api-library.onrender.com";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const response = await fetch(`${API_BASE}/api/learning/system-status`, {
      headers: { "Accept": "application/json" }
    });

    if (response.ok) {
      const data = await response.json();
      res.setHeader("Cache-Control", "public, max-age=30");
      return res.status(200).json({ ok: true, ...data });
    }
  } catch (error: any) {
    console.warn("Failed to fetch system status:", error.message);
  }

  // Demo system status (healthy)
  res.setHeader("Cache-Control", "public, max-age=30");
  return res.status(200).json({
    ok: true,
    global_integrity_index: 0.92,
    circuit_breaker_status: "healthy",
    gii_multiplier: 1.0,
    minting_enabled: true,
    thresholds: {
      healthy: 0.90,
      warning: 0.75,
      critical: 0.60,
      circuit_breaker: 0.60
    },
    source: "demo"
  });
}

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * JADE Pattern Oracle API Route
 * 
 * This route acts as a proxy to the main OAA API /api/jade endpoint.
 * Now with Reflections memory bridge and name-aware personalization.
 * 
 * POST /api/jade
 * Body: { 
 *   message: string, 
 *   history: Array<{role: string, content: string}>, 
 *   context?: object,
 *   userContext?: { userId?: string, displayName?: string }
 * }
 */

const OAA_API_URL = process.env.OAA_API_URL || 'https://oaa-api-library.onrender.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      endpoint: '/api/jade',
      method: 'POST',
      description: 'JADE Pattern Oracle - Canon-Aware Reflection Guide',
      proxy_target: OAA_API_URL,
      request_format: {
        message: 'string (your reflection or question)',
        history: 'array of {role: "user"|"assistant", content: string}',
        context: 'optional object with additional context (reflections, cycle data)',
        userContext: 'optional { userId?: string, displayName?: string } for memory bridge'
      },
      features: [
        'Canon-aware HIVE integration',
        'Seven Jade Moves (pattern responses)',
        'Reflections memory bridge',
        'Name-aware personalization',
        'Strange Metamorphosis Loop awareness'
      ],
      persona: 'Pattern Oracle and Reflection Guide'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history, context, userContext } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Empty message' });
    }

    // Forward request to OAA API with userContext
    const response = await fetch(`${OAA_API_URL}/api/jade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        history: history || [],
        context: context || null,
        userContext: userContext || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('JADE API error:', data);
      return res.status(response.status).json({
        error: data.detail || 'Failed to reach JADE',
        upstream_status: response.status,
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('JADE proxy error:', error);
    return res.status(502).json({
      error: 'Failed to connect to JADE service',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

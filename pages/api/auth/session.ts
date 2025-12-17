// GET /api/auth/session - Get current session info
// Validates session token and returns user info

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';
import { verifyJWT, extractBearerToken } from '../../../src/lib/auth/jwt';

interface SessionResponse {
  success: boolean;
  authenticated: boolean;
  user?: {
    id: string;
    handle: string;
    email: string | null;
    walletAddress?: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SessionResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      authenticated: false,
      error: 'Use GET to check session',
    });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(200).json({
        success: true,
        authenticated: false,
      });
    }

    // Try JWT first (stateless, faster)
    const jwtPayload = verifyJWT(token);
    if (jwtPayload) {
      return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          id: jwtPayload.userId,
          handle: jwtPayload.handle,
          email: jwtPayload.email || null,
          walletAddress: jwtPayload.walletAddress,
        },
      });
    }

    // Fall back to session token (stateful, DB lookup)
    try {
      const session = await AuthService.verifySession(token);
      return res.status(200).json({
        success: true,
        authenticated: true,
        user: session.user,
      });
    } catch {
      // Invalid session
      return res.status(200).json({
        success: true,
        authenticated: false,
      });
    }
  } catch (error: any) {
    console.error('[Auth/Session] Error:', error);

    return res.status(500).json({
      success: false,
      authenticated: false,
      error: error.message,
    });
  }
}

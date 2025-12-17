// POST /api/auth/logout - Revoke session
// Invalidates the current session token

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';

interface LogoutResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Use POST to logout',
    });
  }

  try {
    // Get token from Authorization header or body
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.body?.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token required',
        error: 'Session token must be provided in Authorization header or body',
      });
    }

    // Revoke session
    await AuthService.logout(token);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('[Auth/Logout] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
}

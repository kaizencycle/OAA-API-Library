// POST /api/auth/verify - Verify magic link token
// Creates session after successful verification

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';

interface VerifyBody {
  token: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  token?: string;
  jwt?: string;
  expiresAt?: string;
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
  res: NextApiResponse<VerifyResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Use POST to verify magic link',
    });
  }

  try {
    const { token } = req.body as VerifyBody;

    // Validate token
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Token required',
        error: 'Magic link token must be provided',
      });
    }

    // Verify magic link and create session
    const session = await AuthService.verifyMagicLink(token);

    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      token: session.token,
      jwt: session.jwt,
      expiresAt: session.expiresAt.toISOString(),
      user: session.user,
    });
  } catch (error: any) {
    console.error('[Auth/Verify] Error:', error);

    // Map error messages to appropriate status codes
    let statusCode = 400;
    let message = error.message;

    if (message.includes('expired')) {
      statusCode = 410; // Gone
      message = 'Magic link has expired. Please request a new one.';
    } else if (message.includes('Invalid')) {
      statusCode = 401; // Unauthorized
      message = 'Invalid magic link. Please request a new one.';
    } else if (message.includes('already used')) {
      statusCode = 409; // Conflict
      message = 'This magic link has already been used.';
    }

    return res.status(statusCode).json({
      success: false,
      message: 'Verification failed',
      error: message,
    });
  }
}

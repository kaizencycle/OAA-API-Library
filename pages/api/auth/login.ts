// POST /api/auth/login - Login with password
// Returns session token and JWT for authenticated requests

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';

interface LoginBody {
  handle: string;
  password: string;
}

interface LoginResponse {
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
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Use POST to login',
    });
  }

  try {
    const { handle, password } = req.body as LoginBody;

    // Validate inputs
    if (!handle || typeof handle !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Handle required',
        error: 'Handle must be provided',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password required',
        error: 'Password must be provided',
      });
    }

    // Attempt login
    const session = await AuthService.loginWithPassword(
      handle.toLowerCase(),
      password
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: session.token,
      jwt: session.jwt,
      expiresAt: session.expiresAt.toISOString(),
      user: session.user,
    });
  } catch (error: any) {
    console.error('[Auth/Login] Error:', error);

    // Don't reveal which field was wrong
    return res.status(401).json({
      success: false,
      message: 'Login failed',
      error: 'Invalid handle or password',
    });
  }
}

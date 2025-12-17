// POST /api/auth/register - Register new user account
// Creates user with optional password and auto-generated MIC wallet

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';

interface RegisterBody {
  handle: string;
  email: string;
  password?: string;
}

interface RegisterResponse {
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
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Use POST to register',
    });
  }

  try {
    const { handle, email, password } = req.body as RegisterBody;

    // Validate handle
    if (!handle || typeof handle !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Handle required',
        error: 'Handle must be a non-empty string',
      });
    }

    // Validate handle format (alphanumeric, underscore, hyphen, 3-20 chars)
    const handleRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!handleRegex.test(handle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid handle format',
        error: 'Handle must be 3-20 characters, alphanumeric with _ or -',
      });
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email required',
        error: 'Email must be a non-empty string',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Please provide a valid email address',
      });
    }

    // Validate password if provided
    if (password && typeof password === 'string') {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password too short',
          error: 'Password must be at least 8 characters',
        });
      }
    }

    // Register user
    const user = await AuthService.register({
      handle: handle.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });

    // Get request metadata
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress;

    // Create session
    const session = await AuthService.createSession(user.id, {
      userAgent,
      ipAddress,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: session.token,
      jwt: session.jwt,
      expiresAt: session.expiresAt.toISOString(),
      user: session.user,
    });
  } catch (error: any) {
    console.error('[Auth/Register] Error:', error);

    // Handle specific errors
    if (error.message.includes('Handle already taken')) {
      return res.status(409).json({
        success: false,
        message: 'Handle unavailable',
        error: 'This handle is already taken',
      });
    }

    if (error.message.includes('Email already registered')) {
      return res.status(409).json({
        success: false,
        message: 'Email in use',
        error: 'This email is already registered',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
}

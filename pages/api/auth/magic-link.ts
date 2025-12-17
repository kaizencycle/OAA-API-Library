// POST /api/auth/magic-link - Send magic link for passwordless login
// Generates secure token and (TODO) sends email

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';

interface MagicLinkBody {
  email: string;
}

interface MagicLinkResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  error?: string;
  // DEV ONLY: Include link in development
  devLink?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MagicLinkResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Use POST to request magic link',
    });
  }

  try {
    const { email } = req.body as MagicLinkBody;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email required',
        error: 'Please provide an email address',
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

    // Generate and send magic link
    const result = await AuthService.sendMagicLink(email.toLowerCase());

    const response: MagicLinkResponse = {
      success: true,
      message: 'Magic link sent to your email',
      expiresAt: result.expiresAt.toISOString(),
    };

    // In development, we could return the link for testing
    // Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      response.message = 'Magic link generated (check server logs in dev mode)';
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('[Auth/MagicLink] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send magic link',
      error: error.message,
    });
  }
}

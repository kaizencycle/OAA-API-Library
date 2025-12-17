// GET /api/wallet/balance - Get user's MIC wallet balance
// Requires authentication via Bearer token

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';
import { verifyJWT, extractBearerToken } from '../../../src/lib/auth/jwt';

// Lazy load Prisma client
let prisma: any = null;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  integrityScore: number;
  gii: number | null;
  moduleId: string | null;
  createdAt: string;
}

interface BalanceResponse {
  success: boolean;
  address?: string;
  balance?: number;
  walletType?: string;
  recentTransactions?: Transaction[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BalanceResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Use GET to fetch balance',
    });
  }

  try {
    // Extract and validate token
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required. Provide Bearer token.',
      });
    }

    // Try JWT first
    let userId: string | null = null;
    const jwtPayload = verifyJWT(token);

    if (jwtPayload) {
      userId = jwtPayload.userId;
    } else {
      // Fall back to session token
      try {
        const session = await AuthService.verifySession(token);
        userId = session.user.id;
      } catch {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session',
        });
      }
    }

    const db = await getPrisma();

    // Get wallet
    const wallet = await db.mICWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found. Contact support.',
      });
    }

    // Calculate balance from ledger (source of truth)
    const result = await db.mICLedger.aggregate({
      where: { walletAddress: wallet.address },
      _sum: { amount: true },
    });

    const balance = result._sum.amount || 0;

    // Get recent transactions
    const recentTransactions = await db.mICLedger.findMany({
      where: { walletAddress: wallet.address },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.status(200).json({
      success: true,
      address: wallet.address,
      balance: Number(balance),
      walletType: wallet.walletType,
      recentTransactions: recentTransactions.map((tx: any) => ({
        id: tx.id,
        amount: Number(tx.amount),
        reason: tx.reason,
        integrityScore: Number(tx.integrityScore),
        gii: tx.gii ? Number(tx.gii) : null,
        moduleId: tx.moduleId,
        createdAt: tx.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('[Wallet/Balance] Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch balance',
    });
  }
}

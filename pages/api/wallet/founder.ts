// GET /api/wallet/founder - Public endpoint to view founder wallet
// Read-only access to founder wallet balance and stats

import type { NextApiRequest, NextApiResponse } from 'next';

// Lazy load Prisma client
let prisma: any = null;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

interface FounderWalletResponse {
  success: boolean;
  address?: string;
  balance?: number;
  walletType?: string;
  transactionCount?: number;
  note?: string;
  createdAt?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FounderWalletResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Use GET to view founder wallet',
    });
  }

  try {
    const db = await getPrisma();

    // Get founder wallet
    const founderWallet = await db.mICWallet.findFirst({
      where: { walletType: 'FOUNDER' },
    });

    if (!founderWallet) {
      return res.status(404).json({
        success: false,
        error: 'Founder wallet not yet initialized',
      });
    }

    // Calculate balance from ledger
    const result = await db.mICLedger.aggregate({
      where: { walletAddress: founderWallet.address },
      _sum: { amount: true },
    });

    const balance = result._sum.amount || 0;

    // Get transaction count
    const txCount = await db.mICLedger.count({
      where: { walletAddress: founderWallet.address },
    });

    return res.status(200).json({
      success: true,
      address: founderWallet.address,
      balance: Number(balance),
      walletType: 'FOUNDER',
      transactionCount: txCount,
      note: 'Cryptographically sealed - only founder can sign transactions',
      createdAt: founderWallet.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[Wallet/Founder] Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch founder wallet',
    });
  }
}

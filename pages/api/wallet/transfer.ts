// POST /api/wallet/transfer - Transfer MIC between wallets
// Requires authentication and sufficient balance

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../src/lib/auth/authService';
import { verifyJWT, extractBearerToken } from '../../../src/lib/auth/jwt';
import { sha256 } from '../../../src/lib/crypto/hash';
import { isValidAddress } from '../../../src/lib/crypto/ed25519';

// Lazy load Prisma client
let prisma: any = null;

async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

interface TransferBody {
  toAddress: string;
  amount: number;
  note?: string;
}

interface TransferResponse {
  success: boolean;
  message?: string;
  txId?: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: number;
  newBalance?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TransferResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Use POST to transfer MIC',
    });
  }

  try {
    // Extract and validate token
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required',
      });
    }

    // Authenticate user
    let userId: string | null = null;
    const jwtPayload = verifyJWT(token);

    if (jwtPayload) {
      userId = jwtPayload.userId;
    } else {
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

    const { toAddress, amount, note } = req.body as TransferBody;

    // Validate inputs
    if (!toAddress || !isValidAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address',
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }

    if (amount < 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Minimum transfer amount is 0.01 MIC',
      });
    }

    const db = await getPrisma();

    // Get sender's wallet
    const senderWallet = await db.mICWallet.findUnique({
      where: { userId },
    });

    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        error: 'Sender wallet not found',
      });
    }

    // Can't transfer to self
    if (senderWallet.address === toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer to own wallet',
      });
    }

    // Verify recipient wallet exists
    const recipientWallet = await db.mICWallet.findUnique({
      where: { address: toAddress },
    });

    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        error: 'Recipient wallet not found',
      });
    }

    // Calculate sender's balance
    const balanceResult = await db.mICLedger.aggregate({
      where: { walletAddress: senderWallet.address },
      _sum: { amount: true },
    });

    const currentBalance = Number(balanceResult._sum.amount || 0);

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${currentBalance} MIC`,
      });
    }

    // Create transfer transactions (atomic)
    const txHash = sha256(
      JSON.stringify({
        from: senderWallet.address,
        to: toAddress,
        amount,
        timestamp: Date.now(),
      })
    );

    // Debit sender
    await db.mICLedger.create({
      data: {
        userId,
        walletAddress: senderWallet.address,
        amount: -amount, // Negative for outgoing
        reason: 'TRANSFER_OUT',
        integrityScore: 1.0,
        metadata: {
          type: 'transfer',
          to: toAddress,
          txHash,
          note: note || 'MIC transfer',
        },
      },
    });

    // Credit recipient
    await db.mICLedger.create({
      data: {
        userId: recipientWallet.userId,
        walletAddress: toAddress,
        amount, // Positive for incoming
        reason: 'TRANSFER_IN',
        integrityScore: 1.0,
        metadata: {
          type: 'transfer',
          from: senderWallet.address,
          txHash,
          note: note || 'MIC transfer',
        },
      },
    });

    // Log identity event
    await AuthService.logIdentityEvent(userId, 'MIC_TRANSFERRED', {
      from: senderWallet.address,
      to: toAddress,
      amount,
      txHash,
    });

    // Get new balance
    const newBalanceResult = await db.mICLedger.aggregate({
      where: { walletAddress: senderWallet.address },
      _sum: { amount: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer successful',
      txId: txHash,
      fromAddress: senderWallet.address,
      toAddress,
      amount,
      newBalance: Number(newBalanceResult._sum.amount || 0),
    });
  } catch (error: any) {
    console.error('[Wallet/Transfer] Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Transfer failed',
    });
  }
}

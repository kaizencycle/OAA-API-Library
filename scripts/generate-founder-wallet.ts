#!/usr/bin/env npx ts-node

/**
 * ONE-TIME USE: Generate founder's cryptographically sealed wallet
 * 
 * ⚠️  CRITICAL: RUN THIS LOCALLY, NEVER ON SERVER!
 * 
 * This script:
 * 1. Generates a new Ed25519 keypair
 * 2. Creates a FOUNDER wallet in the database
 * 3. Credits 1,000,000 MIC to the wallet
 * 
 * The private key is displayed ONCE and should be:
 * - Written on paper (3 copies)
 * - Stored in 3 different physical locations
 * - NEVER saved on any computer
 * 
 * Usage:
 *   npx ts-node scripts/generate-founder-wallet.ts
 * 
 * Or with environment variables:
 *   DATABASE_URL=postgresql://... npx ts-node scripts/generate-founder-wallet.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Simple SHA256 (avoid importing from lib to keep script standalone)
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Generate Ed25519 keypair using Node.js crypto
function generateKeyPair() {
  // Try tweetnacl first
  try {
    const nacl = require('tweetnacl');
    const keypair = nacl.sign.keyPair();
    
    const publicKey = Buffer.from(keypair.publicKey).toString('hex');
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');
    const address = '0x' + sha256(publicKey).substring(0, 40);
    
    return { publicKey, privateKey, address };
  } catch {
    // Fallback to Node.js crypto
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    
    const pubKeyHex = publicKey.toString('hex');
    const privKeyHex = privateKey.toString('hex');
    const address = '0x' + sha256(pubKeyHex).substring(0, 40);
    
    return { publicKey: pubKeyHex, privateKey: privKeyHex, address };
  }
}

// ANSI colors for terminal
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

async function main() {
  const prisma = new PrismaClient();

  console.log('\n' + '='.repeat(70));
  console.log(`${BOLD}${YELLOW}⚠️  FOUNDER WALLET GENERATION - ONE-TIME OPERATION${RESET}`);
  console.log('='.repeat(70) + '\n');

  // Check for existing founder wallet
  const existingFounder = await prisma.mICWallet.findFirst({
    where: { walletType: 'FOUNDER' },
  });

  if (existingFounder) {
    console.log(`${RED}ERROR: Founder wallet already exists!${RESET}`);
    console.log(`Address: ${existingFounder.address}`);
    console.log('\nFounder wallet can only be created once.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Get founder handle from env or prompt
  const founderHandle = process.env.FOUNDER_HANDLE || 'kaizen';
  
  console.log(`Looking for user with handle: ${CYAN}${founderHandle}${RESET}\n`);

  const founderUser = await prisma.user.findUnique({
    where: { handle: founderHandle },
  });

  if (!founderUser) {
    console.log(`${RED}ERROR: User '${founderHandle}' not found!${RESET}`);
    console.log('\nPlease register your account first:');
    console.log(`  curl -X POST http://localhost:3000/api/auth/register \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"handle":"${founderHandle}","email":"your@email.com","password":"secure"}'`);
    console.log('\nOr set FOUNDER_HANDLE environment variable to use a different handle.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`${GREEN}✓ Found user: ${founderUser.handle} (${founderUser.email})${RESET}\n`);

  // Check if user already has a wallet
  const existingWallet = await prisma.mICWallet.findUnique({
    where: { userId: founderUser.id },
  });

  if (existingWallet) {
    console.log(`${YELLOW}Note: User already has a ${existingWallet.walletType} wallet.${RESET}`);
    console.log(`Upgrading to FOUNDER wallet...\n`);
  }

  // Generate keypair
  console.log('Generating Ed25519 keypair...\n');
  const wallet = generateKeyPair();

  // Display critical warning
  console.log('='.repeat(70));
  console.log(`${BOLD}${RED}⚠️  CRITICAL SECURITY WARNING ⚠️${RESET}`);
  console.log('='.repeat(70));
  console.log(`
${YELLOW}This is your FOUNDER WALLET private key.${RESET}

${BOLD}1. Write this private key on PAPER (3 copies)${RESET}
${BOLD}2. Store in 3 DIFFERENT physical locations${RESET}
${BOLD}3. NEVER save this in any computer${RESET}
${BOLD}4. DELETE this from your screen after writing${RESET}
${BOLD}5. If you lose this key, 1M MIC is LOST FOREVER${RESET}
`);

  console.log('='.repeat(70));
  console.log(`${CYAN}PRIVATE KEY:${RESET}`);
  console.log(`${BOLD}${wallet.privateKey}${RESET}`);
  console.log('='.repeat(70));
  console.log(`${CYAN}PUBLIC KEY:${RESET} ${wallet.publicKey}`);
  console.log(`${CYAN}ADDRESS:${RESET} ${wallet.address}`);
  console.log('='.repeat(70));
  console.log(`\n${RED}NO RECOVERY IS POSSIBLE!${RESET}\n`);

  // Wait for user confirmation
  console.log('='.repeat(70));
  console.log(`${BOLD}${YELLOW}Have you saved the private key on paper?${RESET}`);
  console.log('='.repeat(70));
  console.log(`
1. Written on paper (3 copies)?
2. Stored in 3 physical locations?
3. Ready to DELETE from this computer?

${GREEN}Press ENTER to save to database...${RESET}
${RED}Press Ctrl+C to abort!${RESET}
`);

  // Wait for user input
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  console.log('\nSaving to database...');

  // Delete existing wallet if upgrading
  if (existingWallet) {
    await prisma.mICWallet.delete({
      where: { id: existingWallet.id },
    });
  }

  // Create founder wallet
  await prisma.mICWallet.create({
    data: {
      userId: founderUser.id,
      address: wallet.address,
      publicKey: wallet.publicKey,
      walletType: 'FOUNDER',
      metadata: {
        initialBalance: 1000000,
        note: 'Founder wallet - cryptographically sealed',
        createdAt: new Date().toISOString(),
        createdBy: 'generate-founder-wallet script',
      },
    },
  });

  // Credit initial 1M MIC
  await prisma.mICLedger.create({
    data: {
      userId: founderUser.id,
      walletAddress: wallet.address,
      amount: 1000000,
      reason: 'MINT',
      integrityScore: 1.0,
      metadata: {
        type: 'founder_initial_balance',
        note: 'Initial 1M MIC allocation - genesis mint',
      },
    },
  });

  // Log identity event
  await prisma.identityEvent.create({
    data: {
      userId: founderUser.id,
      eventType: 'WALLET_CREATED',
      eventPayload: {
        walletType: 'FOUNDER',
        address: wallet.address,
        initialBalance: 1000000,
      },
      eventHash: sha256(JSON.stringify({
        userId: founderUser.id,
        walletType: 'FOUNDER',
        address: wallet.address,
        timestamp: new Date().toISOString(),
      })),
    },
  });

  console.log(`
${GREEN}✅ Founder wallet created successfully!${RESET}

${CYAN}Address:${RESET} ${wallet.address}
${CYAN}Balance:${RESET} 1,000,000 MIC
${CYAN}Owner:${RESET} ${founderUser.handle}

`);

  console.log('='.repeat(70));
  console.log(`${BOLD}${RED}FINAL STEP: DELETE THIS SCRIPT OUTPUT${RESET}`);
  console.log('='.repeat(70));
  console.log(`
Clear your terminal history:
  - Mac/Linux: ${CYAN}history -c && clear${RESET}
  - Windows: ${CYAN}Clear-History${RESET}

The private key should ${BOLD}ONLY${RESET} exist on paper now!
`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(`${RED}Error:${RESET}`, error.message);
  process.exit(1);
});

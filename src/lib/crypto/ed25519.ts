// Ed25519 cryptographic key utilities for MIC wallets
// Provides wallet generation, signing, and verification

import * as crypto from 'crypto';
import { sha256 } from './hash';

export interface KeyPair {
  publicKey: string;  // Hex encoded
  privateKey: string; // Hex encoded (64 bytes = 128 hex chars for Ed25519)
  address: string;    // 0x + first 40 chars of pubkey hash
}

// Dynamic import for tweetnacl
let nacl: typeof import('tweetnacl') | null = null;

async function loadNacl() {
  if (!nacl) {
    try {
      nacl = await import('tweetnacl');
    } catch {
      throw new Error('tweetnacl not installed. Run: npm install tweetnacl tweetnacl-util');
    }
  }
  return nacl;
}

/**
 * Generate new Ed25519 keypair for wallet
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const naclLib = await loadNacl();
  const keypair = naclLib.sign.keyPair();

  const publicKey = Buffer.from(keypair.publicKey).toString('hex');
  const privateKey = Buffer.from(keypair.secretKey).toString('hex');

  // Derive address from public key hash (Ethereum-style)
  const address = '0x' + sha256(publicKey).substring(0, 40);

  return {
    publicKey,
    privateKey,
    address,
  };
}

/**
 * Generate keypair synchronously (for scripts)
 * Uses Node.js crypto as fallback
 */
export function generateKeyPairSync(): KeyPair {
  try {
    // Try tweetnacl first (if already loaded)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const naclLib = require('tweetnacl');
    const keypair = naclLib.sign.keyPair();

    const publicKey = Buffer.from(keypair.publicKey).toString('hex');
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');
    const address = '0x' + sha256(publicKey).substring(0, 40);

    return { publicKey, privateKey, address };
  } catch {
    // Fallback to Node.js crypto (Ed25519 support)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    const pubKeyHex = (publicKey as Buffer).toString('hex');
    const privKeyHex = (privateKey as Buffer).toString('hex');
    const address = '0x' + sha256(pubKeyHex).substring(0, 40);

    return {
      publicKey: pubKeyHex,
      privateKey: privKeyHex,
      address,
    };
  }
}

/**
 * Generate wallet address from public key
 */
export function getAddressFromPublicKey(publicKeyHex: string): string {
  return '0x' + sha256(publicKeyHex).substring(0, 40);
}

/**
 * Sign message with private key
 */
export async function signMessage(
  message: string,
  privateKeyHex: string
): Promise<string> {
  const naclLib = await loadNacl();
  const secretKey = Buffer.from(privateKeyHex, 'hex');
  const messageBytes = Buffer.from(message);

  const signature = naclLib.sign.detached(
    new Uint8Array(messageBytes),
    new Uint8Array(secretKey)
  );

  return Buffer.from(signature).toString('hex');
}

/**
 * Verify signature against public key
 */
export async function verifySignature(
  message: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const naclLib = await loadNacl();
    const publicKey = new Uint8Array(Buffer.from(publicKeyHex, 'hex'));
    const signature = new Uint8Array(Buffer.from(signatureHex, 'hex'));
    const messageBytes = new Uint8Array(Buffer.from(message));

    return naclLib.sign.detached.verify(messageBytes, signature, publicKey);
  } catch (error) {
    return false;
  }
}

/**
 * Generate founder wallet (one-time use!)
 * SAVE THE PRIVATE KEY SECURELY!
 */
export async function generateFounderWallet(): Promise<KeyPair & { warning: string }> {
  const wallet = await generateKeyPair();

  return {
    ...wallet,
    warning: `
⚠️  CRITICAL SECURITY WARNING ⚠️

This is your FOUNDER WALLET private key.

1. Write this private key on paper (3 copies)
2. Store in 3 different physical locations
3. NEVER save this in any computer
4. DELETE this from your screen after writing
5. If you lose this key, 1M MIC is LOST FOREVER

Private Key: ${wallet.privateKey}
Public Key: ${wallet.publicKey}
Address: ${wallet.address}

NO RECOVERY IS POSSIBLE!
    `.trim(),
  };
}

/**
 * Validate address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate public key format (64 bytes hex = 128 chars for Ed25519)
 */
export function isValidPublicKey(publicKey: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(publicKey);
}

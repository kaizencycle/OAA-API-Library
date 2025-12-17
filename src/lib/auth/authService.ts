// Complete authentication service for OAA
// Handles registration, login, sessions, magic links, and identity events

import { sha256, generateToken, hashPassword, verifyPassword } from '../crypto/hash';
import { generateJWT } from './jwt';
import { generateKeyPair, getAddressFromPublicKey } from '../crypto/ed25519';

// Type imports - these will be available after prisma generate
type PrismaClient = any;
type User = any;
type AuthKey = any;
type Session = any;
type MagicLink = any;
type MICWallet = any;
type IdentityEventType = string;

// Lazy-loaded Prisma client
let prisma: PrismaClient | null = null;

async function getPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient();
    } catch (error) {
      throw new Error('Prisma client not available. Run: npx prisma generate');
    }
  }
  return prisma;
}

export interface RegisterInput {
  handle: string;
  email: string;
  password?: string;
}

export interface LoginResult {
  token: string;
  jwt: string;
  expiresAt: Date;
  user: {
    id: string;
    handle: string;
    email: string | null;
    walletAddress?: string;
  };
}

export class AuthService {
  /**
   * Register new user with email
   */
  static async register(data: RegisterInput): Promise<User> {
    const db = await getPrisma();

    // Check if handle exists
    const existingHandle = await db.user.findUnique({
      where: { handle: data.handle },
    });
    if (existingHandle) {
      throw new Error('Handle already taken');
    }

    // Check if email exists
    if (data.email) {
      const existingEmail = await db.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }

    // Create user
    const user = await db.user.create({
      data: {
        handle: data.handle,
        email: data.email,
      },
    });

    // Create password auth key if provided
    if (data.password) {
      const passwordHash = await hashPassword(data.password);
      await db.authKey.create({
        data: {
          userId: user.id,
          type: 'PASSWORD',
          passwordHash,
        },
      });
    }

    // Create custodial MIC wallet
    const wallet = await generateKeyPair();
    await db.mICWallet.create({
      data: {
        userId: user.id,
        address: wallet.address,
        publicKey: wallet.publicKey,
        walletType: 'CUSTODIAL',
        metadata: {
          createdVia: 'registration',
          note: 'Custodial wallet - Mobius manages keys',
        },
      },
    });

    // Log identity event
    await this.logIdentityEvent(user.id, 'REGISTERED', {
      handle: data.handle,
      email: data.email,
      authMethod: data.password ? 'password' : 'magic_link',
    });

    return user;
  }

  /**
   * Login with password
   */
  static async loginWithPassword(
    handle: string,
    password: string
  ): Promise<LoginResult> {
    const db = await getPrisma();

    const user = await db.user.findUnique({
      where: { handle },
      include: {
        authKeys: {
          where: {
            type: 'PASSWORD',
            isActive: true,
          },
        },
      },
    });

    if (!user || user.authKeys.length === 0) {
      await this.logFailedLogin(handle, 'invalid_credentials');
      throw new Error('Invalid credentials');
    }

    const authKey = user.authKeys[0];
    const valid = await verifyPassword(password, authKey.passwordHash!);

    if (!valid) {
      await this.logFailedLogin(handle, 'invalid_password');
      throw new Error('Invalid credentials');
    }

    // Update last used
    await db.authKey.update({
      where: { id: authKey.id },
      data: { lastUsedAt: new Date() },
    });

    // Log success
    await this.logIdentityEvent(user.id, 'LOGIN_SUCCESS', {
      method: 'password',
    });

    // Create session
    return this.createSession(user.id);
  }

  /**
   * Send magic link to email
   */
  static async sendMagicLink(email: string): Promise<{ success: boolean; expiresAt: Date }> {
    const db = await getPrisma();

    // Generate secure token
    const token = generateToken();
    const tokenHash = sha256(token);

    // Create magic link record (15 minutes expiry)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.magicLink.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    // Build magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicUrl = `${baseUrl}/auth/verify?token=${token}`;

    // Log for development (TODO: integrate actual email service)
    console.log(`[MagicLink] Generated for ${email}: ${magicUrl}`);

    // TODO: Send email via nodemailer or your email service
    // await sendEmail({ to: email, subject: 'Sign in to Mobius', body: magicUrl });

    // Log event (if user exists)
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      await this.logIdentityEvent(user.id, 'MAGIC_LINK_SENT', {
        email,
        expiresIn: '15m',
      });
    }

    return { success: true, expiresAt };
  }

  /**
   * Verify magic link token
   */
  static async verifyMagicLink(token: string): Promise<LoginResult> {
    const db = await getPrisma();
    const tokenHash = sha256(token);

    const magicLink = await db.magicLink.findUnique({
      where: { tokenHash },
    });

    if (!magicLink) {
      throw new Error('Invalid magic link');
    }

    if (magicLink.used) {
      throw new Error('Magic link already used');
    }

    if (new Date() > magicLink.expiresAt) {
      throw new Error('Magic link expired');
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: magicLink.email },
    });

    if (!user) {
      // Auto-register user with derived handle
      const handle =
        magicLink.email.split('@')[0] +
        '_' +
        Math.random().toString(36).substring(2, 8);
      user = await this.register({
        handle,
        email: magicLink.email,
      });
    }

    // Mark magic link as used
    await db.magicLink.update({
      where: { id: magicLink.id },
      data: {
        used: true,
        userId: user.id,
      },
    });

    // Log events
    await this.logIdentityEvent(user.id, 'MAGIC_LINK_USED', {
      email: magicLink.email,
    });

    await this.logIdentityEvent(user.id, 'LOGIN_SUCCESS', {
      method: 'magic_link',
    });

    // Create session
    return this.createSession(user.id);
  }

  /**
   * Create session for user
   */
  static async createSession(
    userId: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<LoginResult> {
    const db = await getPrisma();

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        micWallet: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate session token
    const token = generateToken();
    const tokenHash = sha256(token);

    // Create session in database (30 days expiry)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      },
    });

    // Generate JWT
    const jwt = generateJWT({
      userId: user.id,
      handle: user.handle,
      email: user.email || undefined,
      walletAddress: user.micWallet?.address,
    });

    // Log session creation
    await this.logIdentityEvent(userId, 'SESSION_CREATED', {
      expiresAt: expiresAt.toISOString(),
    });

    return {
      token,
      jwt,
      expiresAt,
      user: {
        id: user.id,
        handle: user.handle,
        email: user.email,
        walletAddress: user.micWallet?.address,
      },
    };
  }

  /**
   * Verify session token
   */
  static async verifySession(token: string): Promise<{
    user: {
      id: string;
      handle: string;
      email: string | null;
      walletAddress?: string;
    };
  }> {
    const db = await getPrisma();
    const tokenHash = sha256(token);

    const session = await db.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            micWallet: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Invalid session');
    }

    if (session.revokedAt) {
      throw new Error('Session revoked');
    }

    if (new Date() > session.expiresAt) {
      throw new Error('Session expired');
    }

    return {
      user: {
        id: session.user.id,
        handle: session.user.handle,
        email: session.user.email,
        walletAddress: session.user.micWallet?.address,
      },
    };
  }

  /**
   * Logout (revoke session)
   */
  static async logout(token: string): Promise<{ success: boolean }> {
    const db = await getPrisma();
    const tokenHash = sha256(token);

    const session = await db.session.findUnique({
      where: { tokenHash },
    });

    if (session) {
      await db.session.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });

      await this.logIdentityEvent(session.userId, 'SESSION_REVOKED', {});
    }

    return { success: true };
  }

  /**
   * Log identity event (append-only audit trail)
   */
  static async logIdentityEvent(
    userId: string,
    eventType: IdentityEventType,
    payload: Record<string, any>
  ): Promise<void> {
    const db = await getPrisma();

    const eventPayload = {
      userId,
      eventType,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    const eventHash = sha256(JSON.stringify(eventPayload));

    // Get previous event hash for chaining
    const prevEvent = await db.identityEvent.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    await db.identityEvent.create({
      data: {
        userId,
        eventType,
        eventPayload,
        eventHash,
        prevHash: prevEvent?.eventHash,
      },
    });
  }

  /**
   * Log failed login attempt
   */
  private static async logFailedLogin(
    handle: string,
    reason: string
  ): Promise<void> {
    const db = await getPrisma();
    const user = await db.user.findUnique({ where: { handle } });
    if (user) {
      await this.logIdentityEvent(user.id, 'LOGIN_FAILED', {
        handle,
        reason,
      });
    }
  }

  /**
   * Get user by handle
   */
  static async getUserByHandle(handle: string): Promise<User | null> {
    const db = await getPrisma();
    return db.user.findUnique({
      where: { handle },
      include: { micWallet: true },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const db = await getPrisma();
    return db.user.findUnique({
      where: { email },
      include: { micWallet: true },
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    const db = await getPrisma();
    return db.user.findUnique({
      where: { id },
      include: { micWallet: true },
    });
  }
}

export default AuthService;

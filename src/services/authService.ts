/**
 * Authentication Service
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginDto, ResetPasswordDto } from '../dtos/auth.dto';
import { UserRole } from '../constants/enums';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  accountId?: number | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  // Type assertion helper for Prisma models
  private get platformUser() {
    return (this.prisma as any).platformUser;
  }

  /**
   * Authenticate user with email and password
   */
  async login(dto: LoginDto): Promise<{ user: unknown; tokens: AuthTokens }> {
    let user;
    
    if (dto.email) {
      user = await this.platformUser.findUnique({
        where: { email: dto.email },
        include: {
          accounts: {
            take: 1, // Get first account if exists
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } else if (dto.document) {
      user = await this.platformUser.findUnique({
        where: { document: dto.document },
        include: {
          accounts: {
            take: 1, // Get first account if exists
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new Error('Account has been deleted');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    if (!user.passwordHash) {
      throw new Error('Password not set. Please reset your password.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.platformUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accountId = user.accounts.length > 0 ? user.accounts[0].id : null;
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      accountId: accountId,
    });

    // Remove sensitive data
    const { passwordHash, passwordResetToken, passwordResetExpires, ...userWithoutSensitive } = user;

    return {
      user: userWithoutSensitive,
      tokens,
    };
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    // Calculate expires in seconds
    const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Parse expires in string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET as string) as { userId: number };

      const user = await this.platformUser.findUnique({
        where: { id: decoded.userId },
        include: {
          accounts: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user || user.deletedAt || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const accountId = user.accounts.length > 0 ? user.accounts[0].id : null;
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        accountId: accountId,
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Get user by ID (for middleware)
   */
  async getUserById(userId: number) {
    return this.platformUser.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.platformUser.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      // Don't reveal if user exists for security
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user.id, type: 'password-reset' }, JWT_SECRET as string, {
      expiresIn: '1h',
    });

    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await this.platformUser.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send email with reset link
    // await emailService.sendPasswordReset(user.email, resetToken);
  }

  /**
   * Reset password with token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      const decoded = jwt.verify(dto.token, JWT_SECRET as string) as { userId: number; type: string };

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      const user = await this.platformUser.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.deletedAt) {
        throw new Error('User not found');
      }

      if (!user.passwordResetToken || user.passwordResetToken !== dto.token) {
        throw new Error('Invalid reset token');
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new Error('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Update password and clear reset token
      await this.platformUser.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Check if user is admin
   */
  isAdmin(role: string): boolean {
    return role === UserRole.ADMIN;
  }

  /**
   * Check if user is owner or admin
   */
  isOwnerOrAdmin(role: string): boolean {
    return role === UserRole.OWNER || role === UserRole.ADMIN;
  }

  /**
   * Check if user has access to account
   */
  hasAccountAccess(userRole: string, userAccountId: number | null | undefined, requestedAccountId?: number): boolean {
    // Admin has access to everything
    if (this.isAdmin(userRole)) {
      return true;
    }

    // If no specific account requested, allow (admin-only endpoints)
    if (!requestedAccountId) {
      return false;
    }

    // Owner/Agent/Viewer need to have access to the requested account
    return userAccountId === requestedAccountId;
  }
}

export default AuthService;



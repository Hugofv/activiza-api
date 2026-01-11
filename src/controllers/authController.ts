/**
 * Authentication Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { AuthService } from '../services/authService';
import { serializeBigInt } from '../utils/serializeBigInt';

export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  async login(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const result = await this.authService.login(req.body as any);
      this.ok({
        user: serializeBigInt(result.user),
        ...result.tokens,
      });
    } catch (error) {
      this.unauthorized(error instanceof Error ? error.message : 'Invalid credentials');
    }
  }

  async refresh(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const refreshToken = req.body.refreshToken as string;
      const tokens = await this.authService.refreshToken(refreshToken);
      this.ok(tokens);
    } catch (error) {
      this.unauthorized(error instanceof Error ? error.message : 'Invalid refresh token');
    }
  }

  async me(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    if (!req.user) {
      this.unauthorized();
      return;
    }

    try {
      const user = await this.authService.getUserById(req.user.id);
      if (!user || user.deletedAt || !user.isActive) {
        this.unauthorized('User not found or inactive');
        return;
      }

      const { passwordHash, passwordResetToken, passwordResetExpires, ...userWithoutSensitive } = user;
      this.ok(serializeBigInt(userWithoutSensitive));
    } catch (error) {
      this.internalServerError();
    }
  }

  async forgotPassword(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const email = req.body.email as string;
      await this.authService.forgotPassword(email);
      // Always return success to prevent email enumeration
      this.ok({ message: 'If the email exists, a password reset link has been sent' });
    } catch (error) {
      // Still return success for security
      this.ok({ message: 'If the email exists, a password reset link has been sent' });
    }
  }

  async resetPassword(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      await this.authService.resetPassword(req.body as any);
      this.ok({ message: 'Password has been reset successfully' });
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Invalid or expired token');
    }
  }

  async logout(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    // JWT is stateless, so logout is handled client-side by removing the token
    // Optionally, you could implement a token blacklist here
    this.ok({ message: 'Logged out successfully' });
  }

  async register(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const { email, password, name } = req.body as { email: string; password: string; name?: string };
      const result = await this.authService.register(email, password, name);
      this.ok({
        user: serializeBigInt(result.user),
        ...result.tokens,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already registered')) {
        res.status(409).json({
          success: false,
          error: { message: error.message, code: 'EMAIL_ALREADY_EXISTS' },
        });
        return;
      }
      this.badRequest(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async checkEmail(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const email = req.query.email as string;
      
      if (!email) {
        this.badRequest('Email is required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.badRequest('Invalid email format');
        return;
      }

      const result = await this.authService.checkEmail(email);
      this.ok(result);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to check email');
    }
  }
}


/**
 * Verification Service
 * Handles phone and email verification for clients
 */

import { PrismaClient } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';
import {
  SendPhoneVerificationDto,
  VerifyPhoneDto,
  SendEmailVerificationDto,
  VerifyEmailDto,
} from '../dtos/verification.dto';

export class VerificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a random verification code
   */
  private generateCode(length: number = 6): string {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  /**
   * Get phone number from various formats
   */
  private extractPhoneNumber(phone: string | { phoneNumber?: string; formattedPhoneNumber?: string } | undefined): string | null {
    if (!phone) return null;
    if (typeof phone === 'string') return phone;
    return phone.formattedPhoneNumber || phone.phoneNumber || null;
  }

  /**
   * Send verification code to phone (WhatsApp)
   */
  async sendPhoneVerification(clientId: number, dto: SendPhoneVerificationDto): Promise<{ success: boolean; message: string }> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Get phone number from dto or existing client
    const phoneNumber = dto.phone
      ? this.extractPhoneNumber(dto.phone)
      : client.phone;

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Generate verification code
    const code = this.generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get existing meta or create new
    const meta = (client.meta as Record<string, unknown>) || {};
    const verification = (meta.verification as Record<string, unknown>) || {};

    // Store code and expiration
    verification.phoneCode = code;
    verification.phoneCodeExpires = expiresAt.toISOString();
    meta.verification = verification;

    // Update client with verification code
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        meta: meta as InputJsonValue,
        // Update phone if provided
        ...(dto.phone && { phone: this.extractPhoneNumber(dto.phone) }),
      },
    });

    // TODO: Send code via WhatsApp API
    // await whatsappService.send(phoneNumber, `Your verification code is: ${code}`);

    // In development, log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Phone verification code for ${phoneNumber}: ${code}`);
    }

    return {
      success: true,
      message: 'Verification code sent to phone',
    };
  }

  /**
   * Verify phone code
   */
  async verifyPhone(clientId: number, dto: VerifyPhoneDto): Promise<{ success: boolean; verified: boolean }> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const meta = (client.meta as Record<string, unknown>) || {};
    const verification = (meta.verification as Record<string, unknown>) || {};

    const storedCode = verification.phoneCode as string | undefined;
    const expiresAt = verification.phoneCodeExpires as string | undefined;
    const isVerified = verification.phoneVerified as boolean | undefined;

    // Check if already verified
    if (isVerified) {
      return { success: true, verified: true };
    }

    // Check if code exists
    if (!storedCode || !expiresAt) {
      throw new Error('No verification code found. Please request a new code.');
    }

    // Check if code expired
    if (new Date(expiresAt) < new Date()) {
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // Verify code
    if (storedCode !== dto.code) {
      throw new Error('Invalid verification code');
    }

    // Mark as verified and clear code
    verification.phoneVerified = true;
    verification.phoneVerifiedAt = new Date().toISOString();
    delete verification.phoneCode;
    delete verification.phoneCodeExpires;
    meta.verification = verification;

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        meta: meta as InputJsonValue,
      },
    });

    return { success: true, verified: true };
  }

  /**
   * Send verification code to email
   */
  async sendEmailVerification(clientId: number, dto: SendEmailVerificationDto): Promise<{ success: boolean; message: string }> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Get email from dto or existing client
    const email = dto.email || client.email;

    if (!email) {
      throw new Error('Email is required');
    }

    // Generate verification code
    const code = this.generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get existing meta or create new
    const meta = (client.meta as Record<string, unknown>) || {};
    const verification = (meta.verification as Record<string, unknown>) || {};

    // Store code and expiration
    verification.emailCode = code;
    verification.emailCodeExpires = expiresAt.toISOString();
    meta.verification = verification;

    // Update client with verification code
    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        meta: meta as InputJsonValue,
        // Update email if provided
        ...(dto.email && { email: dto.email }),
      },
    });

    // TODO: Send code via email service
    // await emailService.send({
    //   to: email,
    //   subject: 'Verification Code',
    //   body: `Your verification code is: ${code}`,
    // });

    // In development, log the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Email verification code for ${email}: ${code}`);
    }

    return {
      success: true,
      message: 'Verification code sent to email',
    };
  }

  /**
   * Verify email code
   */
  async verifyEmail(clientId: number, dto: VerifyEmailDto): Promise<{ success: boolean; verified: boolean }> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const meta = (client.meta as Record<string, unknown>) || {};
    const verification = (meta.verification as Record<string, unknown>) || {};

    const storedCode = verification.emailCode as string | undefined;
    const expiresAt = verification.emailCodeExpires as string | undefined;
    const isVerified = verification.emailVerified as boolean | undefined;

    // Check if already verified
    if (isVerified) {
      return { success: true, verified: true };
    }

    // Check if code exists
    if (!storedCode || !expiresAt) {
      throw new Error('No verification code found. Please request a new code.');
    }

    // Check if code expired
    if (new Date(expiresAt) < new Date()) {
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // Verify code
    if (storedCode !== dto.code) {
      throw new Error('Invalid verification code');
    }

    // Mark as verified and clear code
    verification.emailVerified = true;
    verification.emailVerifiedAt = new Date().toISOString();
    delete verification.emailCode;
    delete verification.emailCodeExpires;
    meta.verification = verification;

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        meta: meta as InputJsonValue,
      },
    });

    return { success: true, verified: true };
  }

  /**
   * Get verification status for a client
   */
  async getVerificationStatus(clientId: number): Promise<{
    phoneVerified: boolean;
    emailVerified: boolean;
    phoneVerifiedAt?: string;
    emailVerifiedAt?: string;
  }> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { meta: true },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const meta = (client.meta as Record<string, unknown>) || {};
    const verification = (meta.verification as Record<string, unknown>) || {};

    return {
      phoneVerified: (verification.phoneVerified as boolean) || false,
      emailVerified: (verification.emailVerified as boolean) || false,
      phoneVerifiedAt: verification.phoneVerifiedAt as string | undefined,
      emailVerifiedAt: verification.emailVerifiedAt as string | undefined,
    };
  }
}


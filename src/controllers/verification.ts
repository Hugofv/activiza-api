/**
 * Verification Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { VerificationService } from '../services/verification';

export class VerificationController extends BaseController {
  constructor(private verificationService: VerificationService) {
    super();
  }

  /**
   * Send verification code to phone (WhatsApp)
   * POST /api/clients/:id/verify/phone/send
   */
  async sendPhoneVerification(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const clientId = Number(req.params.id);
      const result = await this.verificationService.sendPhoneVerification(clientId, {
        phone: req.body.phone as string | { phoneNumber?: string; formattedPhoneNumber?: string; countryCode?: string } | undefined,
      });
      this.ok(result);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to send verification code');
    }
  }

  /**
   * Verify phone code
   * POST /api/clients/:id/verify/phone
   */
  async verifyPhone(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const clientId = Number(req.params.id);
      const result = await this.verificationService.verifyPhone(clientId, {
        code: req.body.code as string,
      });
      this.ok(result);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to verify code');
    }
  }

  /**
   * Send verification code to email
   * POST /api/clients/:id/verify/email/send
   */
  async sendEmailVerification(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const clientId = Number(req.params.id);
      const result = await this.verificationService.sendEmailVerification(clientId, {
        email: req.body.email as string | undefined,
      });
      this.ok(result);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to send verification code');
    }
  }

  /**
   * Verify email code
   * POST /api/clients/:id/verify/email
   */
  async verifyEmail(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const clientId = Number(req.params.id);
      const result = await this.verificationService.verifyEmail(clientId, {
        code: req.body.code as string,
      });
      this.ok(result);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to verify code');
    }
  }

  /**
   * Get verification status
   * GET /api/clients/:id/verify/status
   */
  async getVerificationStatus(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const clientId = Number(req.params.id);
      const status = await this.verificationService.getVerificationStatus(clientId);
      this.ok(status);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to get verification status');
    }
  }
}


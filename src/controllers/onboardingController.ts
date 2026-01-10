/**
 * Onboarding Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { OnboardingService } from '../services/onboardingService';
import { ClientsService } from '../services/clientsService';
import { AccountsService } from '../services/accountsService';
import { VerificationService } from '../services/verificationService';
import { 
  EmailAlreadyExistsError, 
  DocumentAlreadyExistsError, 
  InvalidDocumentError, 
  MissingRequiredFieldsError, 
  WeakPasswordError,
  EmailNotVerifiedError,
  PhoneNotVerifiedError,
} from '../common/classes';
import HttpStatusCodes from '../common/HttpStatusCodes';

export class OnboardingController extends BaseController {
  private onboardingService: OnboardingService;
  
  constructor({
    onboardingService,
    clientsService,
    accountsService,
    verificationService,
  }: {
    onboardingService: OnboardingService;
    clientsService: ClientsService;
    accountsService: AccountsService;
    verificationService: VerificationService;
  }) {
    super();
    this.onboardingService = onboardingService;
  }

  /**
   * Save onboarding data (progressive submission)
   * POST /api/onboarding/save
   */
  async save(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const result = await this.onboardingService.saveOnboardingData(req.body as any);
      this.ok(result);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        this.setResponse(res);
        res.status(HttpStatusCodes.CONFLICT).json({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: error.message,
          code: HttpStatusCodes.CONFLICT,
        });
        return;
      }
      this.badRequest(error instanceof Error ? error.message : 'Failed to save onboarding data');
    }
  }

  /**
   * Submit onboarding - finalize registration (99% - Options screen)
   * POST /api/onboarding/submit
   */
  async submit(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const result = await this.onboardingService.submitOnboarding(req.body as any);
      this.ok(result);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        res.status(HttpStatusCodes.CONFLICT).json({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: error.message,
          code: HttpStatusCodes.CONFLICT,
        });
        return;
      }
      if (error instanceof DocumentAlreadyExistsError) {
        res.status(HttpStatusCodes.CONFLICT).json({
          success: false,
          error: 'DOCUMENT_ALREADY_EXISTS',
          message: error.message,
          code: HttpStatusCodes.CONFLICT,
          details: error.details,
        });
        return;
      }
      if (error instanceof InvalidDocumentError) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'INVALID_DOCUMENT',
          message: error.message,
          code: HttpStatusCodes.BAD_REQUEST,
          details: error.details,
        });
        return;
      }
      if (error instanceof MissingRequiredFieldsError) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: error.message,
          code: HttpStatusCodes.BAD_REQUEST,
          missingFields: error.missingFields,
        });
        return;
      }
      if (error instanceof WeakPasswordError) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'WEAK_PASSWORD',
          message: error.message,
          code: HttpStatusCodes.BAD_REQUEST,
        });
        return;
      }
      if (error instanceof EmailNotVerifiedError) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: error.message,
          code: HttpStatusCodes.BAD_REQUEST,
        });
        return;
      }
      if (error instanceof PhoneNotVerifiedError) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'PHONE_NOT_VERIFIED',
          message: error.message,
          code: HttpStatusCodes.BAD_REQUEST,
        });
        return;
      }
      this.badRequest(error instanceof Error ? error.message : 'Failed to submit onboarding');
    }
  }

  /**
   * Get onboarding progress (by email or document)
   * GET /api/onboarding/progress?email=xxx or ?document=xxx
   */
  async getProgress(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const email = req.query.email as string;
      const document = req.query.document as string;
      
      if (!email && !document) {
        this.badRequest('Email or document is required');
        return;
      }
      
      // Priority: email first, then document
      const identifier = email || document;
      const progress = await this.onboardingService.getOnboardingProgress(identifier);
      this.ok(progress);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to get progress');
    }
  }

  /**
   * Get recommended plans based on business metrics
   * GET /api/onboarding/plans?activeCustomers=...&financialOperations=...
   */
  async getPlans(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const query = {
        activeCustomers: req.query.activeCustomers ? parseInt(req.query.activeCustomers as string) : undefined,
        financialOperations: req.query.financialOperations ? parseInt(req.query.financialOperations as string) : undefined,
        workingCapital: req.query.workingCapital ? parseInt(req.query.workingCapital as string) : undefined,
        businessDuration: req.query.businessDuration ? parseInt(req.query.businessDuration as string) : undefined,
      };
      
      const result = await this.onboardingService.getRecommendedPlans(query);
      this.ok(result);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to get recommended plans');
    }
  }
}


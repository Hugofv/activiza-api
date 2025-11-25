/**
 * Onboarding Controller
 */

import { IReq, IRes } from '../common/types';
import { BaseController } from '../common/BaseController';
import { OnboardingService } from '../services/onboarding';

export class OnboardingController extends BaseController {
  constructor(private onboardingService: OnboardingService) {
    super();
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
      this.badRequest(error instanceof Error ? error.message : 'Failed to save onboarding data');
    }
  }

  /**
   * Get onboarding progress
   * GET /api/onboarding/progress?document=xxx
   */
  async getProgress(req: IReq, res: IRes): Promise<void> {
    this.setResponse(res);
    try {
      const document = req.query.document as string;
      if (!document) {
        this.badRequest('Document is required');
        return;
      }
      const progress = await this.onboardingService.getOnboardingProgress(document);
      this.ok(progress);
    } catch (error) {
      this.badRequest(error instanceof Error ? error.message : 'Failed to get progress');
    }
  }
}


/**
 * Feature-based access control middleware
 */

import { Request, Response, NextFunction } from 'express';
import HttpStatusCodes from '../common/HttpStatusCodes';
import { PrismaClient } from '@prisma/client';
import FeatureAuthorizationService from '../services/featureAuthorizationService';

// Store prisma instance (should be injected via DI in production)
let prismaInstance: PrismaClient | null = null;

export function setPrismaInstance(prisma: PrismaClient): void {
  prismaInstance = prisma;
}

/**
 * Require a specific feature to be enabled in the user's plan
 * @param featureKey - The feature key to check
 * @param checkLimit - Whether to check operation limits (default: false, only checks if enabled)
 */
export function requireFeature(featureKey: string, checkLimit = false) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(HttpStatusCodes.UNAUTHORIZED).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
      return;
    }

    // Admin bypass
    if (req.user.isAdmin) {
      return next();
    }

    if (!req.user.accountId) {
      res.status(HttpStatusCodes.FORBIDDEN).json({
        success: false,
        error: {
          message: 'Account access required',
          code: 'FORBIDDEN',
        },
      });
      return;
    }

    if (!prismaInstance) {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    }

    const featureAuthService = new FeatureAuthorizationService({ prisma: prismaInstance });

    try {
      // Get feature by key
      const feature = await prismaInstance.feature.findUnique({
        where: { key: featureKey },
        include: {
          module: true,
        },
      });

      if (!feature || !feature.isActive) {
        res.status(HttpStatusCodes.FORBIDDEN).json({
          success: false,
          error: {
            message: `Feature "${featureKey}" is not available`,
            code: 'FEATURE_NOT_AVAILABLE',
          },
        });
        return;
      }

      // Get account's plan feature
      const account = await prismaInstance.account.findUnique({
        where: { id: req.user.accountId },
        include: {
          plan: {
            include: {
              features: {
                where: { featureId: feature.id },
                include: {
                  feature: true,
                },
              },
            },
          },
        },
      });

      if (!account || !account.plan) {
        res.status(HttpStatusCodes.FORBIDDEN).json({
          success: false,
          error: {
            message: 'No plan assigned to account',
            code: 'NO_PLAN',
          },
        });
        return;
      }

      const planFeature = account.plan.features[0];

      if (!planFeature || !planFeature.isEnabled) {
        res.status(HttpStatusCodes.FORBIDDEN).json({
          success: false,
          error: {
            message: `Feature "${feature.name}" is not enabled in your plan. Please upgrade your plan.`,
            code: 'FEATURE_NOT_ENABLED',
          },
        });
        return;
      }

      // Check limits if requested
      const operationLimit = (planFeature as any).operationLimit;
      const resetPeriod = (planFeature as any).resetPeriod || 'MONTHLY';
      
      if (checkLimit && operationLimit !== null && operationLimit !== undefined) {
        const currentUsage = await featureAuthService['getCurrentUsage'](
          req.user.accountId,
          planFeature.id,
          resetPeriod
        );

        if (currentUsage >= operationLimit) {
          const periodText = resetPeriod === 'MONTHLY' 
            ? 'this month' 
            : planFeature.resetPeriod === 'YEARLY' 
            ? 'this year' 
            : '';
          
          res.status(HttpStatusCodes.FORBIDDEN).json({
            success: false,
            error: {
              message: `Operation limit reached for "${feature.name}". Your plan allows ${operationLimit} operations ${periodText}. Please upgrade your plan.`,
              code: 'FEATURE_LIMIT_REACHED',
              data: {
                current: currentUsage,
                limit: operationLimit,
                feature: feature.name,
              },
            },
          });
          return;
        }
      }

      // Store feature info in request for use in controllers
      req.feature = {
        id: feature.id,
        key: feature.key,
        name: feature.name,
        planFeatureId: planFeature.id,
        operationLimit: operationLimit,
        resetPeriod: resetPeriod,
      };

      next();
    } catch (error) {
      console.error('Feature middleware error:', error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: 'Error checking feature access',
          code: 'FEATURE_CHECK_ERROR',
        },
      });
    }
  };
}

// Extend Express Request type to include feature info
declare global {
  namespace Express {
    interface Request {
      feature?: {
        id: number;
        key: string;
        name: string;
        planFeatureId: number;
        operationLimit: number | null;
        resetPeriod: string;
      };
    }
  }
}


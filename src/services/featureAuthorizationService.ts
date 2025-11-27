/**
 * Feature Authorization Service
 * Handles feature-based operation limits and usage tracking
 */

import { PrismaClient } from '@prisma/client';

export interface FeatureLimitCheck {
  allowed: boolean;
  current: number;
  limit: number | null;
  message?: string;
  featureKey?: string;
  featureName?: string;
}

export interface OperationTypeMapping {
  [key: string]: string; // operation type -> module key
}

// Default mapping: Operation type to Module key
const DEFAULT_OPERATION_TYPE_MAPPING: OperationTypeMapping = {
  LOAN: 'loan',
  RENTAL: 'rent_room', // Default rental, can be overridden by meta
  OTHER: 'other',
};

export class FeatureAuthorizationService {
  private prisma: PrismaClient;
  private operationTypeMapping: OperationTypeMapping;

  constructor({ 
    prisma, 
    operationTypeMapping 
  }: { 
    prisma: PrismaClient;
    operationTypeMapping?: OperationTypeMapping;
  }) {
    this.prisma = prisma;
    this.operationTypeMapping = operationTypeMapping || DEFAULT_OPERATION_TYPE_MAPPING;
  }

  /**
   * Map operation type to module key
   * Can be overridden by operation meta if needed
   */
  private getModuleKeyFromOperationType(
    operationType: string, 
    operationMeta?: Record<string, unknown> | null
  ): string {
    // Check if meta specifies module
    if (operationMeta?.moduleKey && typeof operationMeta.moduleKey === 'string') {
      return operationMeta.moduleKey as string;
    }

    // Use default mapping
    return this.operationTypeMapping[operationType] || 'other';
  }

  /**
   * Get feature for a given module key
   */
  async getFeatureByModuleKey(moduleKey: string): Promise<{ id: number; key: string; name: string } | null> {
    const module = await this.prisma.module.findUnique({
      where: { key: moduleKey },
      include: {
        features: {
          where: { 
            isActive: true,
            deletedAt: null,
          },
          take: 1, // Get first active feature for this module
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!module || !module.features.length) {
      return null;
    }

    const feature = module.features[0];
    return {
      id: feature.id,
      key: feature.key,
      name: feature.name,
    };
  }

  /**
   * Get plan feature configuration for account
   */
  async getPlanFeature(accountId: number, featureId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        plan: {
          include: {
            features: {
              where: { featureId },
              include: {
                feature: true,
              },
            },
          },
        },
      },
    });

    if (!account || !account.plan) {
      return null;
    }

    return account.plan.features[0] || null;
  }

  /**
   * Get current usage count for a feature in the current period
   */
  async getCurrentUsage(
    accountId: number, 
    planFeatureId: number, 
    resetPeriod: string
  ): Promise<number> {
    const period = this.getCurrentPeriod(resetPeriod);
    
    const count = await (this.prisma as any).featureUsage.count({
      where: {
        accountId,
        planFeatureId,
        period,
      },
    });

    return count;
  }

  /**
   * Get current period string based on reset period type
   */
  private getCurrentPeriod(resetPeriod: string): string {
    const now = new Date();
    
    switch (resetPeriod) {
      case 'MONTHLY':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      case 'YEARLY':
        return String(now.getFullYear());
      case 'LIFETIME':
        return 'lifetime';
      default:
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * Check if account can create operation for a given feature
   */
  async checkFeatureOperationLimit(
    accountId: number,
    operationType: string,
    operationMeta?: Record<string, unknown> | null
  ): Promise<FeatureLimitCheck> {
    // 1. Map operation type to module key
    const moduleKey = this.getModuleKeyFromOperationType(operationType, operationMeta);
    
    // 2. Get feature for this module
    const feature = await this.getFeatureByModuleKey(moduleKey);
    if (!feature) {
      return {
        allowed: false,
        current: 0,
        limit: null,
        message: `No feature found for module: ${moduleKey}`,
      };
    }

    // 3. Get plan feature configuration
    const planFeature = await this.getPlanFeature(accountId, feature.id);
    if (!planFeature) {
      return {
        allowed: false,
        current: 0,
        limit: null,
        featureKey: feature.key,
        featureName: feature.name,
        message: `Feature "${feature.name}" is not enabled in your plan. Please upgrade your plan.`,
      };
    }

    // 4. Check if feature is enabled
    if (!planFeature.isEnabled) {
      return {
        allowed: false,
        current: 0,
        limit: null,
        featureKey: feature.key,
        featureName: feature.name,
        message: `Feature "${feature.name}" is disabled in your plan.`,
      };
    }

    // 5. If no limit, allow unlimited
    const operationLimit = (planFeature as any).operationLimit;
    if (operationLimit === null || operationLimit === undefined) {
      return {
        allowed: true,
        current: 0,
        limit: null,
        featureKey: feature.key,
        featureName: feature.name,
      };
    }

    // 6. Check current usage
    const resetPeriod = (planFeature as any).resetPeriod || 'MONTHLY';
    const currentUsage = await this.getCurrentUsage(
      accountId,
      planFeature.id,
      resetPeriod
    );

    // 7. Check if limit reached
    if (currentUsage >= operationLimit) {
      const periodText = resetPeriod === 'MONTHLY' 
        ? 'this month' 
        : resetPeriod === 'YEARLY' 
        ? 'this year' 
        : '';
      
      return {
        allowed: false,
        current: currentUsage,
        limit: operationLimit,
        featureKey: feature.key,
        featureName: feature.name,
        message: `Operation limit reached for "${feature.name}". Your plan allows ${operationLimit} operations ${periodText}. Please upgrade your plan.`,
      };
    }

    return {
      allowed: true,
      current: currentUsage,
      limit: operationLimit,
      featureKey: feature.key,
      featureName: feature.name,
    };
  }

  /**
   * Record feature usage after operation creation
   */
  async recordFeatureUsage(
    accountId: number,
    operationId: bigint,
    operationType: string,
    operationMeta?: Record<string, unknown> | null
  ): Promise<void> {
    // 1. Map operation type to module key
    const moduleKey = this.getModuleKeyFromOperationType(operationType, operationMeta);
    
    // 2. Get feature for this module
    const feature = await this.getFeatureByModuleKey(moduleKey);
    if (!feature) {
      // No feature found, skip tracking
      return;
    }

    // 3. Get plan feature configuration
    const planFeature = await this.getPlanFeature(accountId, feature.id);
    if (!planFeature) {
      // Feature not in plan, skip tracking
      return;
    }

    // 4. Record usage
    const resetPeriod = (planFeature as any).resetPeriod || 'MONTHLY';
    const period = this.getCurrentPeriod(resetPeriod);
    
    await (this.prisma as any).featureUsage.create({
      data: {
        accountId,
        planFeatureId: planFeature.id,
        operationId,
        period,
        usageDate: new Date(),
      },
    });
  }

  /**
   * Get all feature limits for an account
   */
  async getAccountFeatureLimits(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        plan: {
          include: {
            features: {
              where: { isEnabled: true },
              include: {
                feature: {
                  include: {
                    module: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account || !account.plan) {
      return [];
    }

    // Get usage for each feature
    const featuresWithUsage = await Promise.all(
      account.plan.features.map(async (planFeature) => {
        const operationLimit = (planFeature as any).operationLimit;
        const resetPeriod = (planFeature as any).resetPeriod || 'MONTHLY';
        const currentUsage = operationLimit !== null && operationLimit !== undefined
          ? await this.getCurrentUsage(accountId, planFeature.id, resetPeriod)
          : 0;

        return {
          featureId: planFeature.feature.id,
          featureKey: planFeature.feature.key,
          featureName: planFeature.feature.name,
          moduleKey: planFeature.feature.module?.key || null,
          moduleName: planFeature.feature.module?.name || null,
          operationLimit: operationLimit,
          resetPeriod: resetPeriod,
          currentUsage,
          remaining: operationLimit !== null && operationLimit !== undefined
            ? Math.max(0, operationLimit - currentUsage)
            : null,
        };
      })
    );

    return featuresWithUsage;
  }

  /**
   * Reset usage for a specific period (for admin/cron jobs)
   */
  async resetFeatureUsage(accountId: number, planFeatureId: number, period: string): Promise<void> {
    await (this.prisma as any).featureUsage.deleteMany({
      where: {
        accountId,
        planFeatureId,
        period,
      },
    });
  }
}

export default FeatureAuthorizationService;


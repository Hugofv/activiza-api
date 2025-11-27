/**
 * Plans Service
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { CreatePlanDto, UpdatePlanDto } from '../dtos/plans.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PaginationResult } from '~@/utils/pagination';

export class PlansService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { 
    page?: number; 
    limit?: number; 
    isActive?: boolean; 
    isPublic?: boolean;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, isActive, isPublic, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip,
        take: limit,
        include: {
          features: {
            include: {
              feature: true,
              prices: true, // Include plan feature prices
            } as any,
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.plan.count({ where }),
    ]);

    // Calculate prices for each plan
    const resultsWithPrices = data.map((plan: any) => ({
      ...plan,
      prices: this.calculatePlanPrices(plan),
    }));

    return {
      results: resultsWithPrices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    } as PaginationResult<any>;
  }

  async findById(id: number, includeDeleted = false) {
    const where: Record<string, unknown> = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    const plan = await (this.prisma.plan.findFirst as any)({
      where,
      include: {
        features: {
          include: {
            feature: true,
            prices: true, // Include plan feature prices
          },
        },
        accounts: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!plan) {
      return null;
    }

    // Add calculated prices
    return {
      ...plan,
      prices: this.calculatePlanPrices(plan),
    };
  }

  /**
   * Calculate total plan price per currency from enabled features
   */
  calculatePlanPrices(plan: any): Array<{ currency: string; price: number; isDefault: boolean }> {
    if (!plan.features || !Array.isArray(plan.features)) {
      return [];
    }

    const priceMap: Record<string, { total: number; isDefault: boolean }> = {};

    // Sum prices from all enabled features
    for (const planFeature of plan.features) {
      if (!planFeature.isEnabled || !planFeature.prices || !Array.isArray(planFeature.prices)) {
        continue;
      }

      for (const featurePrice of planFeature.prices) {
        const currency = featurePrice.currency;
        const price = Number(featurePrice.price);

        if (!priceMap[currency]) {
          priceMap[currency] = { total: 0, isDefault: featurePrice.isDefault };
        }

        priceMap[currency].total += price;
        // If any feature price is default, mark currency as default
        if (featurePrice.isDefault) {
          priceMap[currency].isDefault = true;
        }
      }
    }

    // Convert to array
    return Object.entries(priceMap).map(([currency, data]) => ({
      currency,
      price: Number(data.total.toFixed(2)),
      isDefault: data.isDefault,
    }));
  }

  async create(dto: CreatePlanDto, createdBy?: string) {
    const { featureIds, features, ...planData } = dto;

    // Create plan (no base price - calculated from features)
    const plan = await this.prisma.plan.create({
      data: {
        ...planData,
        meta: planData.meta as unknown as InputJsonValue,
        ...(createdBy !== undefined && { createdBy }),
      } as any,
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
    });

    // Add features if provided
    if (features && features.length > 0) {
      // Use detailed feature configuration
      for (const featureConfig of features) {
        const planFeature = await (this.prisma.planFeature.create as any)({
          data: {
            planId: plan.id,
            featureId: featureConfig.featureId,
            isEnabled: featureConfig.isEnabled !== undefined ? featureConfig.isEnabled : true,
            operationLimit: featureConfig.operationLimit ?? null,
            resetPeriod: featureConfig.resetPeriod || 'LIFETIME',
            ...(featureConfig.prices && featureConfig.prices.length > 0 && {
              prices: {
                create: featureConfig.prices.map((price: any) => ({
                  currency: price.currency,
                  price: new Prisma.Decimal(price.price),
                  isDefault: price.isDefault || false,
                })),
              },
            }),
          },
        });
      }
    } else if (featureIds && featureIds.length > 0) {
      // Fallback to simple featureIds array (backward compatibility)
      await this.prisma.planFeature.createMany({
        data: featureIds.map((featureId: number) => ({
          planId: plan.id,
          featureId,
          isEnabled: true,
          operationLimit: null, // No limit by default
          resetPeriod: 'LIFETIME',
        })),
        skipDuplicates: true,
      });
    }

    const createdPlan = await this.findById(plan.id);
    return createdPlan;
  }

  async update(id: number, dto: UpdatePlanDto, updatedBy?: string) {
    const { featureIds, features, ...planData } = dto;

    const updateData: any = {};
    
    if (planData.name !== undefined) updateData.name = planData.name;
    if (planData.description !== undefined) updateData.description = planData.description;
    if (planData.billingPeriod !== undefined) updateData.billingPeriod = planData.billingPeriod;
    if (planData.isActive !== undefined) updateData.isActive = planData.isActive;
    if (planData.isPublic !== undefined) updateData.isPublic = planData.isPublic;
    if (planData.sortOrder !== undefined) updateData.sortOrder = planData.sortOrder;
    if (planData.maxOperations !== undefined) updateData.maxOperations = planData.maxOperations;
    if (planData.maxClients !== undefined) updateData.maxClients = planData.maxClients;
    if (planData.maxUsers !== undefined) updateData.maxUsers = planData.maxUsers;
    if (planData.maxStorage !== undefined) updateData.maxStorage = planData.maxStorage;
    if (planData.meta !== undefined) updateData.meta = planData.meta as unknown as InputJsonValue;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;

    // Update plan
    await this.prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Update features if provided
    if (features !== undefined) {
      // Remove all existing features (cascade will delete prices)
      await this.prisma.planFeature.deleteMany({
        where: { planId: id },
      });

      // Add new features with detailed configuration
      if (features.length > 0) {
        for (const featureConfig of features) {
          const planFeature = await (this.prisma.planFeature.create as any)({
            data: {
              planId: id,
              featureId: featureConfig.featureId,
              isEnabled: featureConfig.isEnabled !== undefined ? featureConfig.isEnabled : true,
              operationLimit: featureConfig.operationLimit ?? null,
              resetPeriod: featureConfig.resetPeriod || 'LIFETIME',
              ...(featureConfig.prices && featureConfig.prices.length > 0 && {
                prices: {
                  create: featureConfig.prices.map((price: any) => ({
                    currency: price.currency,
                    price: new Prisma.Decimal(price.price),
                    isDefault: price.isDefault || false,
                  })),
                },
              }),
            },
          });
        }
      }
    } else if (featureIds !== undefined) {
      // Fallback to simple featureIds array (backward compatibility)
      // Remove all existing features
      await this.prisma.planFeature.deleteMany({
        where: { planId: id },
      });

      // Add new features
      if (featureIds.length > 0) {
        await this.prisma.planFeature.createMany({
          data: featureIds.map((featureId: number) => ({
            planId: id,
            featureId,
            isEnabled: true,
            operationLimit: null,
            resetPeriod: 'LIFETIME',
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: number) {
    // Soft delete
    return this.prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get recommended plans based on qualification answers
   */
  async getRecommendedPlans(qualificationAnswers: Array<{ questionKey: string; answer: unknown }>) {
    // Get all active public plans
    const plans = await this.prisma.plan.findMany({
      where: {
        isActive: true,
        isPublic: true,
        deletedAt: null,
      },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    });

    // Simple scoring algorithm - can be enhanced
    const scoredPlans = plans.map((plan: any) => {
      let score = 0;

      // Check monthly operations
      const monthlyOpsAnswer = qualificationAnswers.find(q => q.questionKey === 'monthly_operations');
      if (monthlyOpsAnswer) {
        const ops = typeof monthlyOpsAnswer.answer === 'number' ? monthlyOpsAnswer.answer : 0;
        if (plan.maxOperations === null || plan.maxOperations >= ops) {
          score += 10;
        }
      }

      // Check business type
      const businessTypeAnswer = qualificationAnswers.find(q => q.questionKey === 'business_type');
      if (businessTypeAnswer) {
        // Add custom logic based on business type
        score += 5;
      }

      return {
        ...plan,
        recommendationScore: score,
      };
    });

    // Sort by score and return top 3
    return scoredPlans
      .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
      .slice(0, 3);
  }
}

export default PlansService;



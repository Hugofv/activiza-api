/**
 * Plans Service
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { CreatePlanDto, UpdatePlanDto } from '../dtos/plans.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';

export class PlansService {
  constructor(private prisma: PrismaClient) {
    
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
            },
          },
          creator: true,
          updater: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number, includeDeleted = false) {
    const where: Record<string, unknown> = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return this.prisma.plan.findFirst({
      where,
      include: {
        features: {
          include: {
            feature: true,
          },
        },
        accounts: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: true,
        updater: true,
      },
    });
  }

  async create(dto: CreatePlanDto, createdBy?: string) {
    const { featureIds, featurePricing, ...planData } = dto;

    // Create plan
    const plan = await this.prisma.plan.create({
      data: {
        ...planData,
        price: new Prisma.Decimal(planData.price),
        featurePricing: featurePricing as unknown as InputJsonValue,
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
    if (featureIds && featureIds.length > 0) {
      await this.prisma.planFeature.createMany({
        data: featureIds.map((featureId: number) => ({
          planId: plan.id,
          featureId,
          isEnabled: true,
        })),
        skipDuplicates: true,
      });
    }

    return this.findById(plan.id);
  }

  async update(id: number, dto: UpdatePlanDto, updatedBy?: string) {
    const { featureIds, featurePricing, ...planData } = dto;

    const updateData: any = {};
    
    if (planData.name !== undefined) updateData.name = planData.name;
    if (planData.description !== undefined) updateData.description = planData.description;
    if (planData.price !== undefined) updateData.price = new Prisma.Decimal(planData.price);
    if (planData.currency !== undefined) updateData.currency = planData.currency;
    if (planData.billingPeriod !== undefined) updateData.billingPeriod = planData.billingPeriod;
    if (planData.isActive !== undefined) updateData.isActive = planData.isActive;
    if (planData.isPublic !== undefined) updateData.isPublic = planData.isPublic;
    if (planData.sortOrder !== undefined) updateData.sortOrder = planData.sortOrder;
    if (planData.maxOperations !== undefined) updateData.maxOperations = planData.maxOperations;
    if (planData.maxClients !== undefined) updateData.maxClients = planData.maxClients;
    if (planData.maxUsers !== undefined) updateData.maxUsers = planData.maxUsers;
    if (planData.maxStorage !== undefined) updateData.maxStorage = planData.maxStorage;
    if (featurePricing !== undefined) updateData.featurePricing = featurePricing as unknown as InputJsonValue;
    if (planData.meta !== undefined) updateData.meta = planData.meta as unknown as InputJsonValue;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;

    // Update plan
    await this.prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Update features if provided
    if (featureIds !== undefined) {
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


/**
 * Features Service
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { CreateFeatureDto, UpdateFeatureDto } from '../dtos/features.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';

export class FeaturesService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { 
    page?: number; 
    limit?: number; 
    category?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, category, isActive, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (category) {
      where.category = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      (this.prisma.feature.findMany as any)({
        where,
        skip,
        take: limit,
        include: {
          plans: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          prices: true, // Include feature prices
        },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.feature.count({ where }),
    ]);

    return {
      results: data,
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
    return (this.prisma.feature.findFirst as any)({
      where,
      include: {
        plans: {
          include: {
            plan: true,
          },
        },
        prices: true, // Include feature prices
      },
    });
  }

  async findByKey(key: string) {
    return (this.prisma.feature.findUnique as any)({
      where: { key },
      include: {
        plans: {
          include: {
            plan: true,
          },
        },
        prices: true, // Include feature prices
      },
    });
  }

  async create(dto: CreateFeatureDto, createdBy?: string) {
    const { prices, meta, ...rest } = dto;
    return (this.prisma.feature.create as any)({
      data: {
        ...rest,
        ...(meta !== undefined && { meta: meta as unknown as InputJsonValue }),
        ...(createdBy !== undefined && { createdBy }),
        ...(prices && prices.length > 0 && {
          prices: {
            create: prices.map(p => ({
              currency: p.currency,
              price: new Prisma.Decimal(p.price),
              isDefault: p.isDefault,
            })),
          },
        }),
      },
      include: {
        plans: {
          include: {
            plan: true,
          },
        },
        prices: true, // Include feature prices
      },
    });
  }

  async update(id: number, dto: UpdateFeatureDto, updatedBy?: string) {
    const { prices, meta, ...rest } = dto;
    const updateData: any = {};
    
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.category !== undefined) updateData.category = rest.category;
    if (rest.isActive !== undefined) updateData.isActive = rest.isActive;
    if (rest.sortOrder !== undefined) updateData.sortOrder = rest.sortOrder;
    if (meta !== undefined) updateData.meta = meta as unknown as InputJsonValue;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;
    
    // Handle prices update
    if (prices !== undefined) {
      // Delete existing prices
      await (this.prisma as any).featurePrice.deleteMany({
        where: { featureId: id },
      });
      
      // Create new prices if provided
      if (prices.length > 0) {
        updateData.prices = {
          create: prices.map(p => ({
            currency: p.currency,
            price: new Prisma.Decimal(p.price),
            isDefault: p.isDefault,
          })),
        };
      }
    }
    
    return (this.prisma.feature.update as any)({
      where: { id },
      data: updateData,
      include: {
        plans: {
          include: {
            plan: true,
          },
        },
        prices: true, // Include feature prices
      },
    });
  }

  async delete(id: number) {
    // Soft delete
    return this.prisma.feature.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default FeaturesService;



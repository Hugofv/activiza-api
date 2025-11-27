/**
 * Features Service
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { CreateFeatureDto, UpdateFeatureDto } from '../dtos/features.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PaginationResult } from '~@/utils/pagination';

export class FeaturesService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { 
    page?: number; 
    limit?: number; 
    category?: string;
    moduleId?: number;
    isActive?: boolean;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, category, moduleId, isActive, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (category) {
      where.category = category;
    }
    if (moduleId !== undefined) {
      where.moduleId = moduleId;
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
          module: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
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
    } as PaginationResult<any>;
  }

  async findById(id: number, includeDeleted = false) {
    const where: Record<string, unknown> = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return (this.prisma.feature.findFirst as any)({
      where,
      include: {
        module: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        plans: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async findByKey(key: string) {
    return (this.prisma.feature.findUnique as any)({
      where: { key },
      include: {
        module: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        plans: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async create(dto: CreateFeatureDto, createdBy?: string) {
    const { meta, module, ...rest } = dto;
    const moduleId = module?.value;
    
    return (this.prisma.feature.create as any)({
      data: {
        ...rest,
        ...(moduleId !== undefined && { moduleId }),
        ...(meta !== undefined && { meta: meta as unknown as InputJsonValue }),
        ...(createdBy !== undefined && { createdBy }),
      },
      include: {
        module: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        plans: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateFeatureDto, updatedBy?: string) {
    const { meta, module, ...rest } = dto;
    const updateData: any = {};
    
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.category !== undefined) updateData.category = rest.category;
    // Extract moduleId from module object if provided
    if (module !== undefined) {
      updateData.moduleId = module?.value ?? null;
    }
    if (rest.isActive !== undefined) updateData.isActive = rest.isActive;
    if (rest.sortOrder !== undefined) updateData.sortOrder = rest.sortOrder;
    if (meta !== undefined) updateData.meta = meta as unknown as InputJsonValue;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;
    
    return (this.prisma.feature.update as any)({
      where: { id },
      data: updateData,
      include: {
        module: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        plans: {
          include: {
            plan: true,
          },
        },
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



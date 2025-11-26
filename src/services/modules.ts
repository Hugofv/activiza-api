/**
 * Modules Service
 */

import { PrismaClient } from '@prisma/client';
import { CreateModuleDto, UpdateModuleDto } from '../dtos/modules.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';

export class ModulesService {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, isActive, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const prismaAny = this.prisma as any;

    const [data, total] = await Promise.all([
      prismaAny.module.findMany({
        where,
        skip,
        take: limit,
        include: {
          features: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prismaAny.module.count({ where }),
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
    const prismaAny = this.prisma as any;
    return prismaAny.module.findFirst({
      where,
      include: {
        features: true,
      },
    });
  }

  async create(dto: CreateModuleDto, createdBy?: string) {
    const { meta, ...rest } = dto;
    const prismaAny = this.prisma as any;
    return prismaAny.module.create({
      data: {
        ...rest,
        ...(meta !== undefined && { meta: meta as unknown as InputJsonValue }),
        ...(createdBy !== undefined && { createdBy }),
      },
      include: {
        features: true,
      },
    });
  }

  async update(id: number, dto: UpdateModuleDto, updatedBy?: string) {
    const { meta, ...rest } = dto;
    const updateData: any = {};

    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.category !== undefined) updateData.category = rest.category;
    if (rest.isActive !== undefined) updateData.isActive = rest.isActive;
    if (rest.sortOrder !== undefined) updateData.sortOrder = rest.sortOrder;
    if (meta !== undefined) updateData.meta = meta as unknown as InputJsonValue;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;

    const prismaAny = this.prisma as any;
    return prismaAny.module.update({
      where: { id },
      data: updateData,
      include: {
        features: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete
    const prismaAny = this.prisma as any;
    return prismaAny.module.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
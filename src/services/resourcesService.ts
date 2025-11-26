/**
 * Resources Service
 */

import { PrismaClient } from '@prisma/client';
import { ResourceType } from '../constants/enums';
import { InputJsonValue } from '@prisma/client/runtime/library';

export interface CreateResourceDto {
  accountId: number;
  type: string;
  title: string;
  description?: string;
  addressId?: number;
  photos?: unknown;
  meta?: Record<string, unknown>;
}

export interface UpdateResourceDto {
  type?: string;
  title?: string;
  description?: string;
  addressId?: number;
  photos?: unknown;
  meta?: Record<string, unknown>;
}

export class ResourcesService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { page?: number; limit?: number; accountId?: number; type?: string; includeDeleted?: boolean }) {
    const { page = 1, limit = 20, accountId, type, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (accountId) where.accountId = accountId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resource.count({ where }),
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
    return this.prisma.resource.findFirst({
      where,
      include: {
        account: true,
        address: true,
        operations: true,
      },
    });
  }

  async create(dto: CreateResourceDto) {
    if (dto.type && !Object.values(ResourceType).includes(dto.type as ResourceType)) {
      throw new Error(`Invalid resource type: ${dto.type}`);
    }

    return this.prisma.resource.create({
      data: {
        accountId: dto.accountId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        addressId: dto.addressId,
        photos: dto.photos as unknown as InputJsonValue,
        meta: dto.meta as unknown as InputJsonValue,
      },
      include: {
        account: true,
        address: true,
      },
    });
  }

  async update(id: number, dto: UpdateResourceDto) {
    if (dto.type && !Object.values(ResourceType).includes(dto.type as ResourceType)) {
      throw new Error(`Invalid resource type: ${dto.type}`);
    }

    return this.prisma.resource.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        addressId: dto.addressId,
        photos: dto.photos as unknown as InputJsonValue,
        meta: dto.meta as unknown as InputJsonValue,
      },
      include: {
        account: true,
        address: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default ResourcesService;



/**
 * Settings Service
 */

import { PrismaClient } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PaginationResult } from '~@/utils/pagination';

export interface CreateSettingDto {
  accountId?: number;
  key: string;
  value?: unknown;
}

export interface UpdateSettingDto {
  value?: unknown;
}

export class SettingsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { page?: number; limit?: number; accountId?: number; includeDeleted?: boolean }) {
    const { page = 1, limit = 20, accountId, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (accountId !== undefined) {
      where.accountId = accountId;
    }

    const [data, total] = await Promise.all([
      this.prisma.setting.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.setting.count({ where }),
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

  async findByKey(accountId: number | null, key: string) {
    return this.prisma.setting.findUnique({
      where: {
        accountId_key: {
          accountId: accountId ?? 0,
          key,
        },
      },
      include: {
        account: true,
      },
    });
  }

  async create(dto: CreateSettingDto) {
    return this.prisma.setting.create({
      data: {
        accountId: dto.accountId,
        key: dto.key,
        value: dto.value as unknown as InputJsonValue,
      },
      include: {
        account: true,
      },
    });
  }

  async update(accountId: number | null, key: string, dto: UpdateSettingDto) {
    return this.prisma.setting.update({
      where: {
        accountId_key: {
          accountId: accountId ?? 0,
          key,
        },
      },
      data: {
        value: dto.value as unknown as InputJsonValue,
      },
      include: {
        account: true,
      },
    });
  }

  async upsert(accountId: number | null, key: string, value: unknown) {
    return this.prisma.setting.upsert({
      where: {
        accountId_key: {
          accountId: accountId ?? 0,
          key,
        },
      },
      update: { value: value as unknown as InputJsonValue },
      create: {
        accountId: accountId ?? 0,
        key,
        value: value as unknown as InputJsonValue,
      },
      include: {
        account: true,
      },
    });
  }

  async delete(accountId: number | null, key: string) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.setting.update({
      where: {
        accountId_key: {
          accountId: accountId ?? 0,
          key,
        },
      },
      data: { deletedAt: new Date() },
    });
  }
}

export default SettingsService;



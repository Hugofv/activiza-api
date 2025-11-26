/**
 * Alerts Service
 */

import { PrismaClient } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';

export interface CreateAlertDto {
  operationId: bigint;
  type: string;
  sendAt?: Date;
  template?: string;
  enabled?: boolean;
  meta?: Record<string, unknown>;
}

export interface UpdateAlertDto {
  type?: string;
  sendAt?: Date;
  template?: string;
  enabled?: boolean;
  meta?: Record<string, unknown>;
}

export class AlertsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { page?: number; limit?: number; operationId?: bigint; enabled?: boolean; includeDeleted?: boolean }) {
    const { page = 1, limit = 20, operationId, enabled, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (operationId) where.operationId = operationId;
    if (enabled !== undefined) where.enabled = enabled;

    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        skip,
        take: limit,
        include: {
          operation: {
            include: {
              client: true,
              account: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.alert.count({ where }),
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
    return this.prisma.alert.findFirst({
      where,
      include: {
        operation: {
          include: {
            client: true,
            account: true,
            installmentsList: true,
          },
        },
      },
    });
  }

  async create(dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: {
        operationId: dto.operationId,
        type: dto.type,
        sendAt: dto.sendAt,
        template: dto.template,
        enabled: dto.enabled !== undefined ? dto.enabled : true,
        meta: dto.meta as unknown as InputJsonValue,
      },
      include: {
        operation: true,
      },
    });
  }

  async update(id: number, dto: UpdateAlertDto) {
    return this.prisma.alert.update({
      where: { id },
      data: {
        type: dto.type,
        sendAt: dto.sendAt,
        template: dto.template,
        enabled: dto.enabled,
        meta: dto.meta as unknown as InputJsonValue,
      },
      include: {
        operation: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.alert.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default AlertsService;



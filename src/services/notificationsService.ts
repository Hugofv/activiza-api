/**
 * Notifications Service
 */

import { PrismaClient } from '@prisma/client';
import { NotificationChannel } from '../constants/enums';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PaginationResult } from '~@/utils/pagination';

export interface CreateNotificationDto {
  userId: number;
  title: string;
  body: string;
  channel?: string;
  meta?: Record<string, unknown>;
}

export interface UpdateNotificationDto {
  title?: string;
  body?: string;
  read?: boolean;
  sentAt?: Date;
  meta?: Record<string, unknown>;
}

export class NotificationsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    userId?: number;
    read?: boolean;
    channel?: string;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, userId, read, channel, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (userId) where.userId = userId;
    if (read !== undefined) where.read = read;
    if (channel) where.channel = channel;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
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
    return this.prisma.notification.findFirst({
      where,
      include: {
        user: true,
      },
    });
  }

  async create(dto: CreateNotificationDto) {
    if (dto.channel && !Object.values(NotificationChannel).includes(dto.channel as NotificationChannel)) {
      throw new Error(`Invalid notification channel: ${dto.channel}`);
    }

    // TODO: Send notification via provider (WhatsApp, Push, etc.)
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        channel: dto.channel,
        meta: dto.meta as unknown as InputJsonValue,
        sentAt: new Date(), // TODO: Set based on provider response
      },
      include: {
        user: true,
      },
    });

    // TODO: Integrate with notification provider
    // await notificationProvider.send(notification);

    return notification;
  }

  async update(id: number, dto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        read: dto.read,
        sentAt: dto.sentAt,
        meta: dto.meta as unknown as InputJsonValue,
      },
      include: {
        user: true,
      },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async delete(id: number) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default NotificationsService;



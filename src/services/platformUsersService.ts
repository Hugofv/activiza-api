/**
 * Platform Users Service
 */

import { PrismaClient } from '@prisma/client';
import { UserRole } from '../constants/enums';

export interface CreatePlatformUserDto {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role?: string;
  twoFa?: boolean;
}

export interface UpdatePlatformUserDto {
  name?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role?: string;
  twoFa?: boolean;
}

export class PlatformUsersService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { page?: number; limit?: number; role?: string; q?: string; includeDeleted?: boolean }) {
    const { page = 1, limit = 20, role, q, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.platformUser.findMany({
        where,
        skip,
        take: limit,
        include: {
          accounts: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.platformUser.count({ where }),
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
    return this.prisma.platformUser.findFirst({
      where,
      include: {
        accounts: true,
        notificationUser: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.platformUser.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });
  }

  async create(dto: CreatePlatformUserDto) {
    if (dto.role && !Object.values(UserRole).includes(dto.role as UserRole)) {
      throw new Error(`Invalid user role: ${dto.role}`);
    }

    return this.prisma.platformUser.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash: dto.passwordHash,
        role: dto.role || UserRole.AGENT,
        twoFa: dto.twoFa || false,
      },
      include: {
        accounts: true,
      },
    });
  }

  async update(id: number, dto: UpdatePlatformUserDto) {
    if (dto.role && !Object.values(UserRole).includes(dto.role as UserRole)) {
      throw new Error(`Invalid user role: ${dto.role}`);
    }

    return this.prisma.platformUser.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash: dto.passwordHash,
        role: dto.role,
        twoFa: dto.twoFa,
      },
      include: {
        accounts: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.platformUser.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default PlatformUsersService;



/**
 * Accounts Service
 */

import { PrismaClient } from '@prisma/client';
import { CreateAccountDto, UpdateAccountDto } from '../dtos/accounts.dto';
import { Currency, UserRole } from '../constants/enums';
import { InputJsonValue } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';

export class AccountsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    q?: string;
    ownerId?: number;
    includeDeleted?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      q,
      ownerId,
      includeDeleted = false,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count({ where }),
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
    return this.prisma.account.findFirst({
      where,
      include: {
        owner: true,
        address: true,
        clients: true,
      },
    });
  }

  async create(dto: CreateAccountDto, createdBy?: string) {
    // Validate currency
    if (
      dto.currency &&
      !Object.values(Currency).includes(dto.currency as Currency)
    ) {
      throw new Error(`Invalid currency: ${dto.currency}`);
    }

    let ownerId = dto.ownerId;

    // If ownerId is not provided, automatically create PlatformUser (owner) from account data
    if (!ownerId) {
      // Check if owner with this email already exists
      const existingOwner = await this.prisma.platformUser.findUnique({
        where: { email: dto.email },
        select: { id: true, deletedAt: true },
      });

      if (existingOwner) {
        if (existingOwner.deletedAt) {
          throw new Error(
            'A deleted user with this email exists. Please contact support.'
          );
        }
        // Use existing owner
        ownerId = existingOwner.id;
      } else {
        // Password is required when creating new owner
        if (!dto.password) {
          throw new Error('Password is required to create account owner');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create PlatformUser (owner) automatically from account data
        const newOwner = await this.prisma.platformUser.create({
          data: {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            role: UserRole.OWNER,
            isActive: true,
          },
        });

        ownerId = newOwner.id;
      }
    }

    return this.prisma.account.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        document: dto.document,
        status: dto.status || 'ACTIVE',
        currency: dto.currency || Currency.BRL,
        planId: (dto as any).planId || undefined, // Use planId instead of plan string
        meta: dto.meta as unknown as InputJsonValue,
        ownerId,
        ...(createdBy !== undefined && { createdBy }),
      } as any,
      include: {
        owner: true,
        address: true,
        plan: true,
      },
    });
  }

  async update(id: number, dto: UpdateAccountDto) {
    if (
      dto.currency &&
      !Object.values(Currency).includes(dto.currency as Currency)
    ) {
      throw new Error(`Invalid currency: ${dto.currency}`);
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        document: dto.document,
        status: dto.status,
        currency: dto.currency,
        planId: dto.planId,
        meta: dto.meta as unknown as InputJsonValue,
      },
      include: {
        owner: true,
        address: true,
        plan: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default AccountsService;


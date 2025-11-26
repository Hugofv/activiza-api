/**
 * Payments Service
 */

import { PrismaClient } from '@prisma/client';
import { CreatePaymentDto } from '../dtos/payments.dto';
import { InstallmentStatus } from '../constants/enums';
import { PaginationResult } from '~@/utils/pagination';

export class PaymentsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  // Type assertion helpers for Prisma models
  private get payment() {
    return (this.prisma as any).payment;
  }

  private get installment() {
    return (this.prisma as any).installment;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    clientId?: number;
    operationId?: bigint;
    from?: Date;
    to?: Date;
  }) {
    const { page = 1, limit = 20, clientId, operationId, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (operationId) where.operationId = operationId;
    if (from || to) {
      where.paidAt = {};
      if (from) where.paidAt.gte = from;
      if (to) where.paidAt.lte = to;
    }

    const [data, total] = await Promise.all([
      this.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          operation: {
            include: {
              account: true,
            },
          },
          installment: true,
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.payment.count({ where }),
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

  async findById(id: bigint) {
    return this.payment.findUnique({
      where: { id },
      include: {
        client: true,
        operation: {
          include: {
            account: true,
            client: true,
          },
        },
        installment: true,
      },
    });
  }

  async create(dto: CreatePaymentDto) {
    const operationId = typeof dto.operationId === 'string' 
      ? BigInt(dto.operationId) 
      : BigInt(dto.operationId);
    const installmentId = dto.installmentId 
      ? (typeof dto.installmentId === 'string' 
          ? BigInt(dto.installmentId) 
          : BigInt(dto.installmentId))
      : null;
    const amount = typeof dto.amount === 'string' 
      ? parseFloat(dto.amount) 
      : dto.amount;
    const paidAt = dto.paidAt 
      ? (typeof dto.paidAt === 'string' ? new Date(dto.paidAt) : dto.paidAt)
      : new Date();

    const payment = await this.payment.create({
      data: {
        clientId: dto.clientId,
        operationId: operationId,
        installmentId: installmentId,
        amount: amount,
        currency: dto.currency || 'BRL',
        paidAt: paidAt,
        method: dto.method,
        reference: dto.reference,
        meta: dto.meta,
      },
      include: {
        client: true,
        operation: true,
        installment: true,
      },
    });

    // Update installment status if linked
    if (installmentId) {
      const installment = await this.installment.findUnique({
        where: { id: installmentId },
        include: { payments: true },
      });

      if (installment) {
        const totalPaid = installment.payments.reduce(
          (sum: number, p: any) => sum + Number(p.amount),
          0
        );

        if (totalPaid >= Number(installment.amount)) {
          await this.installment.update({
            where: { id: installmentId },
            data: {
              status: InstallmentStatus.PAID,
              paidAt: paidAt,
            },
          });
        }
      }
    }

    return payment;
  }
}

export default PaymentsService;



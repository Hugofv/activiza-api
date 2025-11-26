/**
 * Installments Service
 */

import { PrismaClient } from '@prisma/client';
import { UpdateInstallmentDto } from '../dtos/installments.dto';
import { InstallmentStatus } from '../constants/enums';

export class InstallmentsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    operationId?: bigint;
    status?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
  }) {
    const { page = 1, limit = 20, operationId, status, dueDateFrom, dueDateTo } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (operationId) where.operationId = operationId;
    if (status) where.status = status;
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) (where.dueDate as any).gte = dueDateFrom;
      if (dueDateTo) (where.dueDate as any).lte = dueDateTo;
    }

    const [data, total] = await Promise.all([
      this.prisma.installment.findMany({
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
          payments: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.installment.count({ where }),
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

  async findById(id: bigint) {
    return this.prisma.installment.findUnique({
      where: { id },
      include: {
        operation: {
          include: {
            client: true,
            account: true,
          },
        },
        payments: true,
      },
    });
  }

  async update(id: bigint, dto: UpdateInstallmentDto) {
    const updateData: Record<string, unknown> = {};
    
    if (dto.dueDate !== undefined) {
      updateData.dueDate = typeof dto.dueDate === 'string' 
        ? new Date(dto.dueDate) 
        : dto.dueDate;
    }
    if (dto.amount !== undefined) {
      updateData.amount = typeof dto.amount === 'string' 
        ? parseFloat(dto.amount) 
        : dto.amount;
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status !== undefined) updateData.status = dto.status;

    return this.prisma.installment.update({
      where: { id },
      data: updateData,
      include: {
        operation: true,
        payments: true,
      },
    });
  }

  async markPaid(id: bigint, paymentData?: {
    amount?: number;
    method?: string;
    clientId?: number;
    operationId?: bigint;
  }) {
    const installment = await this.findById(id);
    if (!installment) {
      throw new Error('Installment not found');
    }

    // Create payment if provided
    if (paymentData && paymentData.amount && paymentData.clientId && paymentData.operationId) {
      await this.prisma.payment.create({
        data: {
          clientId: paymentData.clientId,
          operationId: paymentData.operationId,
          installmentId: id,
          amount: paymentData.amount,
          currency: installment.operation.currency,
          method: paymentData.method,
        },
      });
    }

    // Update installment status
    return this.prisma.installment.update({
      where: { id },
      data: {
        status: InstallmentStatus.PAID,
        paidAt: new Date(),
      },
      include: {
        operation: true,
        payments: true,
      },
    });
  }
}

export default InstallmentsService;



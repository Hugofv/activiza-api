/**
 * Operations Service
 * Handles operation creation and installment generation
 */

import { PrismaClient } from '@prisma/client';
import { CreateOperationDto, UpdateOperationDto } from '../dtos/operations.dto';
import { calculateNextDueDate, roundToTwoDecimals } from '../utils/dateHelpers';
import { InstallmentStatus } from '../constants/enums';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PaginationResult } from '~@/utils/pagination';

export class OperationsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  /**
   * Check if account can create more operations based on plan limits
   */
  async checkOperationLimit(accountId: number): Promise<{ allowed: boolean; current: number; limit: number | null; message?: string }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        plan: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Count current operations
    const currentOperations = await this.prisma.operation.count({
      where: {
        accountId,
        deletedAt: null,
      },
    });

    const plan = account.plan;
    const limit = plan?.maxOperations ?? null;

    if (limit === null) {
      return { allowed: true, current: currentOperations, limit: null };
    }

    if (currentOperations >= limit) {
      return {
        allowed: false,
        current: currentOperations,
        limit,
        message: `Operation limit reached. Your plan allows ${limit} operations. Please upgrade your plan.`,
      };
    }

    return { allowed: true, current: currentOperations, limit };
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    accountId?: number;
    clientId?: number;
    status?: string;
    type?: string;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, accountId, clientId, status, type, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (accountId) where.accountId = accountId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.operation.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: true,
          client: true,
          installmentsList: true,
          resource: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operation.count({ where }),
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

  async findById(id: bigint, includeDeleted = false) {
    const where: Record<string, unknown> = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return this.prisma.operation.findFirst({
      where,
      include: {
        account: true,
        client: true,
        installmentsList: {
          orderBy: { dueDate: 'asc' },
        },
        resource: true,
        photos: true,
        alerts: true,
      },
    });
  }

  async create(dto: CreateOperationDto) {
    // Check plan operation limit
    const limitCheck = await this.checkOperationLimit(dto.accountId);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message || 'Operation limit reached');
    }

    const principalAmount = typeof dto.principalAmount === 'string' 
      ? parseFloat(dto.principalAmount) 
      : dto.principalAmount;
    const entryAmount = dto.entryAmount 
      ? (typeof dto.entryAmount === 'string' ? parseFloat(dto.entryAmount) : dto.entryAmount)
      : 0;
    const interestRate = dto.interestRate 
      ? (typeof dto.interestRate === 'string' ? parseFloat(dto.interestRate) : dto.interestRate)
      : 0;
    const installmentsCount = dto.installments || 1;
    const frequency = dto.frequency || 'MONTHLY';
    
    const startDate = typeof dto.startDate === 'string' 
      ? new Date(dto.startDate) 
      : dto.startDate;
    const dueDate = dto.dueDate 
      ? (typeof dto.dueDate === 'string' ? new Date(dto.dueDate) : dto.dueDate)
      : null;

    // Calculate amount per installment
    const totalAmount = principalAmount - entryAmount;
    const installmentAmount = roundToTwoDecimals(totalAmount / installmentsCount);

    // Create operation with installments
    const operation = await this.prisma.operation.create({
      data: {
        accountId: dto.accountId,
        clientId: dto.clientId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        principalAmount: principalAmount,
        currency: dto.currency || 'BRL',
        startDate: startDate,
        dueDate: dueDate,
        frequency: frequency,
        interestRate: interestRate > 0 ? interestRate : null,
        entryAmount: entryAmount > 0 ? entryAmount : null,
        installments: installmentsCount,
        depositAmount: dto.depositAmount 
          ? (typeof dto.depositAmount === 'string' ? parseFloat(dto.depositAmount) : dto.depositAmount)
          : null,
        collateralMeta: dto.collateralMeta as unknown as InputJsonValue,
        meta: dto.meta as unknown as InputJsonValue,
        status: dto.status,
        resourceId: dto.resourceId,
        installmentsList: {
          create: this.generateInstallments(
            startDate,
            frequency,
            installmentsCount,
            installmentAmount,
            principalAmount,
            interestRate
          ),
        },
      },
      include: {
        installmentsList: true,
        account: true,
        client: true,
      },
    });

    return operation;
  }

  private generateInstallments(
    startDate: Date,
    frequency: string,
    count: number,
    baseAmount: number,
    principalAmount: number,
    interestRate: number
  ) {
    const installments = [];
    const principalPerInstallment = roundToTwoDecimals(principalAmount / count);
    const interestPerInstallment = interestRate > 0 
      ? roundToTwoDecimals((principalAmount * interestRate / 100) / count)
      : 0;

    for (let i = 1; i <= count; i++) {
      const dueDate = calculateNextDueDate(startDate, frequency, i);
      installments.push({
        dueDate,
        amount: roundToTwoDecimals(baseAmount + interestPerInstallment),
        principal: principalPerInstallment,
        interest: interestPerInstallment > 0 ? interestPerInstallment : null,
        status: InstallmentStatus.PENDING,
      });
    }

    return installments;
  }

  async update(id: bigint, dto: UpdateOperationDto) {
    // Prevent updating installments-related fields after creation
    // If needed, regenerate installments separately
    const updateData: Record<string, unknown> = {};
    
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.meta !== undefined) updateData.meta = dto.meta as unknown as InputJsonValue;
    if (dto.resourceId !== undefined) updateData.resourceId = dto.resourceId;
    if (dto.dueDate !== undefined) {
      updateData.dueDate = typeof dto.dueDate === 'string' 
        ? new Date(dto.dueDate) 
        : dto.dueDate;
    }

    return this.prisma.operation.update({
      where: { id },
      data: updateData,
      include: {
        installmentsList: true,
        account: true,
        client: true,
      },
    });
  }

  async delete(id: bigint) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.operation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async registerPayment(operationId: bigint, paymentData: {
    amount: number;
    method?: string;
    installmentId?: bigint;
    clientId: number;
    reference?: string;
    meta?: Record<string, unknown>;
  }) {
    const operation = await this.findById(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        clientId: paymentData.clientId,
        operationId: operationId,
        installmentId: paymentData.installmentId,
        amount: paymentData.amount,
        currency: operation.currency,
        method: paymentData.method,
        reference: paymentData.reference,
        meta: paymentData.meta as unknown as InputJsonValue,
      },
    });

    // If installmentId provided, update installment status
    if (paymentData.installmentId) {
      const installment = await this.prisma.installment.findUnique({
        where: { id: paymentData.installmentId },
        include: { payments: true },
      });

      if (installment) {
        const totalPaid = installment.payments.reduce(
          (sum: number, p: { amount: unknown }) => sum + Number(p.amount),
          Number(payment.amount)
        );

        if (totalPaid >= Number(installment.amount)) {
          // Fully paid
          await this.prisma.installment.update({
            where: { id: paymentData.installmentId },
            data: {
              status: InstallmentStatus.PAID,
              paidAt: new Date(),
            },
          });
        }
        // Partial payments are tracked via payments relationship
      }
    }

    return payment;
  }

  async triggerAlert(operationId: bigint, alertData: {
    type: string;
    template?: string;
    sendAt?: Date;
  }) {
    // TODO: Integrate with notification provider (WhatsApp, etc.)
    const alert = await this.prisma.alert.create({
      data: {
        operationId: operationId,
        type: alertData.type,
        template: alertData.template,
        sendAt: alertData.sendAt || new Date(),
        enabled: true,
      },
    });

    // TODO: Send notification via provider
    // await notificationService.send(alert);

    return alert;
  }
}


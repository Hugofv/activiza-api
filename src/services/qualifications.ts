/**
 * Lead Qualifications Service
 */

import { PrismaClient } from '@prisma/client';
import { 
  CreateQualificationDto, 
  UpdateQualificationDto,
  SaveQualificationAnswersDto 
} from '../dtos/qualifications.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';

export class QualificationsService {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters: { 
    page?: number; 
    limit?: number; 
    accountId?: number;
    clientId?: number;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, accountId, clientId, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (accountId) {
      where.accountId = accountId;
    }
    if (clientId) {
      where.clientId = clientId;
    }

    const [data, total] = await Promise.all([
      this.prisma.leadQualification.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: {
            select: {
              id: true,
              name: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: true,
          updater: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leadQualification.count({ where }),
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
    return this.prisma.leadQualification.findFirst({
      where,
      include: {
        account: true,
        client: true,
        creator: true,
        updater: true,
      },
    });
  }

  async findByAccount(accountId: number) {
    return this.prisma.leadQualification.findMany({
      where: {
        accountId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: number) {
    return this.prisma.leadQualification.findMany({
      where: {
        clientId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateQualificationDto, createdBy?: number) {
    return this.prisma.leadQualification.create({
      data: {
        ...dto,
        answer: dto.answer as unknown as InputJsonValue,
        metadata: dto.metadata as unknown as InputJsonValue,
        createdBy,
      },
      include: {
        account: true,
        client: true,
      },
    });
  }

  async saveAnswers(dto: SaveQualificationAnswersDto, createdBy?: number) {
    const { accountId, clientId, answers } = dto;

    // Delete existing answers for this account/client
    await this.prisma.leadQualification.updateMany({
      where: {
        ...(accountId && { accountId }),
        ...(clientId && { clientId }),
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create new answers
    const qualifications = await Promise.all(
      answers.map(answer =>
        this.prisma.leadQualification.create({
          data: {
            accountId,
            clientId,
            questionKey: answer.questionKey,
            question: answer.questionKey, // Will be filled from template
            answer: answer.answer as unknown as InputJsonValue,
            score: answer.score,
            createdBy,
          },
        })
      )
    );

    return qualifications;
  }

  async update(id: number, dto: UpdateQualificationDto, updatedBy?: number) {
    const updateData: any = {};
    
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.questionKey !== undefined) updateData.questionKey = dto.questionKey;
    if (dto.question !== undefined) updateData.question = dto.question;
    if (dto.answer !== undefined) updateData.answer = dto.answer as unknown as InputJsonValue;
    if (dto.score !== undefined) updateData.score = dto.score;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata as unknown as InputJsonValue;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;
    
    return this.prisma.leadQualification.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        client: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete
    return this.prisma.leadQualification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}


/**
 * Clients Service
 */

import { PrismaClient } from '@prisma/client';
import { CreateClientDto, UpdateClientDto } from '../dtos/clients.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PaginationResult } from '~@/utils/pagination';

export class ClientsService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async findAll(filters: { page?: number; limit?: number; accountId?: number; q?: string; includeDeleted?: boolean }) {
    const { page = 1, limit = 20, accountId, q, includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (accountId) {
      where.accountId = accountId;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          account: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
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
    return this.prisma.client.findFirst({
      where,
      include: {
        account: true,
        address: true,
        operations: {
          include: {
            installmentsList: true,
          },
        },
      },
    });
  }

  async findByDocument(document: string, includeDeleted = false) {
    const where: Record<string, unknown> = { document };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return this.prisma.client.findFirst({
      where: where as any, // Type assertion until migration is applied
      include: {
        account: true,
        address: true,
      },
    });
  }

  async findByEmail(email: string, includeDeleted = false) {
    const where: Record<string, unknown> = { email };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return this.prisma.client.findFirst({
      where: where as any,
      include: {
        account: true,
        address: true,
      },
    });
  }

  async create(dto: CreateClientDto, createdBy?: string) {
    // Validate email is provided (required for onboarding)
    if (!dto.email) {
      throw new Error('Email is required');
    }

    // Check if email already exists (in Client or PlatformUser)
    const existingClientByEmail = await this.prisma.client.findFirst({
      where: { 
        email: dto.email,
        deletedAt: null,
      } as any,
      select: { id: true },
    });

    if (existingClientByEmail) {
      throw new Error('Client with this email already exists');
    }

    // Check if PlatformUser with this email exists
    const existingPlatformUser = await this.prisma.platformUser.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingPlatformUser) {
      throw new Error('A user with this email already exists');
    }

    // Check if document is provided and validate uniqueness by country
    if (dto.document) {
      // For now, we'll validate document uniqueness globally
      // The unique index by country will be enforced at database level
      const existingClientByDocument = await this.prisma.client.findFirst({
        where: { 
          document: dto.document as any,
          deletedAt: null,
        } as any,
        select: { id: true },
      });

      if (existingClientByDocument) {
        throw new Error('Client with this document already exists');
      }
    }

    // Extract phone from nested object if provided
    let phoneString: string | undefined;
    if (typeof dto.phone === 'string') {
      phoneString = dto.phone;
    } else if (dto.phone && typeof dto.phone === 'object') {
      // Use formattedPhoneNumber if available, otherwise phoneNumber
      phoneString = dto.phone.formattedPhoneNumber || dto.phone.phoneNumber || undefined;
    }

    // Prepare meta object with additional fields
    const metaData: Record<string, unknown> = {
      ...(dto.meta || {}),
    };

    // Store code in meta if provided
    if (dto.code) {
      metaData.code = dto.code;
    }

    // Store phone metadata if it was an object
    if (dto.phone && typeof dto.phone === 'object') {
      metaData.phoneMeta = {
        country: dto.phone.country,
        countryCode: dto.phone.countryCode,
        formattedPhoneNumber: dto.phone.formattedPhoneNumber,
        phoneNumber: dto.phone.phoneNumber,
      };
    }

    // Prepare address data if provided
    const addressData = dto.address ? {
      street: dto.address.street,
      number: dto.address.number,
      complement: dto.address.complement,
      neighborhood: dto.address.neighborhood,
      city: dto.address.city,
      state: dto.address.state,
      country: dto.address.country || dto.address.countryCode || 'BR',
      zip: dto.address.postalCode || dto.address.zip,
      createdBy,
    } : undefined;

    return this.prisma.client.create({
      data: {
        email: dto.email, // Required field
        ...(dto.document && { document: dto.document as any }), // Optional
        ...(dto.accountId && { accountId: dto.accountId }), // Optional during onboarding
        ...(dto.name && { name: dto.name }), // Optional during onboarding
        ...(phoneString && { phone: phoneString }),
        ...(Object.keys(metaData).length > 0 && { meta: metaData as unknown as InputJsonValue }),
        ...(addressData && {
          address: {
            create: addressData,
          },
        }),
        ...(createdBy && { createdBy }),
      } as any, // Type assertion until migration is applied
      include: {
        account: true,
        address: true,
      },
    });
  }

  async update(id: number, dto: UpdateClientDto, updatedBy?: string) {
    // Check if email is being updated and if it already exists
    if (dto.email) {
      const existingClientByEmail = await this.prisma.client.findFirst({
        where: { 
          email: dto.email,
          deletedAt: null,
        } as any,
        select: { id: true },
      });

      if (existingClientByEmail && existingClientByEmail.id !== id) {
        throw new Error('Client with this email already exists');
      }

      // Check if PlatformUser with this email exists
      const existingPlatformUser = await this.prisma.platformUser.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existingPlatformUser) {
        throw new Error('A user with this email already exists');
      }
    }

    // Check if document is being updated and if it already exists
    if (dto.document) {
      const existingClient = await this.prisma.client.findFirst({
        where: { 
          document: dto.document as any, // Type assertion until migration is applied
          deletedAt: null,
        } as any,
        select: { id: true },
      });

      if (existingClient && existingClient.id !== id) {
        throw new Error('Client with this document already exists');
      }
    }

    // Extract phone from nested object if provided
    let phoneString: string | undefined;
    if (typeof dto.phone === 'string') {
      phoneString = dto.phone;
    } else if (dto.phone && typeof dto.phone === 'object') {
      phoneString = dto.phone.formattedPhoneNumber || dto.phone.phoneNumber || undefined;
    } else if (dto.phone === null) {
      phoneString = null as any;
    }

    // Prepare meta object with additional fields
    const metaData: Record<string, unknown> = {
      ...(dto.meta || {}),
    };

    // Store code in meta if provided
    if (dto.code !== undefined) {
      metaData.code = dto.code;
    }

    // Store phone metadata if it was an object
    if (dto.phone && typeof dto.phone === 'object') {
      metaData.phoneMeta = {
        country: dto.phone.country,
        countryCode: dto.phone.countryCode,
        formattedPhoneNumber: dto.phone.formattedPhoneNumber,
        phoneNumber: dto.phone.phoneNumber,
      };
    }

    // Prepare address data if provided
    const addressData = dto.address ? {
      street: dto.address.street,
      number: dto.address.number,
      complement: dto.address.complement,
      neighborhood: dto.address.neighborhood,
      city: dto.address.city,
      state: dto.address.state,
      country: dto.address.country || dto.address.countryCode || 'BR',
      zip: dto.address.postalCode || dto.address.zip,
      updatedBy,
    } : undefined;

    // Build update data
    const updateData: any = {};
    if (dto.document !== undefined) updateData.document = dto.document;
    if ((dto as any).documentType !== undefined) updateData.documentType = (dto as any).documentType;
    if ((dto as any).documentCountryCode !== undefined) updateData.documentCountryCode = (dto as any).documentCountryCode;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (phoneString !== undefined) updateData.phone = phoneString;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (Object.keys(metaData).length > 0 || dto.meta !== undefined) {
      updateData.meta = Object.keys(metaData).length > 0 ? (metaData as unknown as InputJsonValue) : dto.meta as unknown as InputJsonValue;
    }
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;

    // Handle address update (upsert)
    if (addressData) {
      updateData.address = {
        upsert: {
          create: addressData,
          update: addressData,
        },
      };
    }

    return this.prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        address: true,
      },
    });
  }

  async delete(id: number) {
    // Soft delete: set deletedAt timestamp
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default ClientsService;



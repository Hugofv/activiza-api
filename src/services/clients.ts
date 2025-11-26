/**
 * Clients Service
 */

import { PrismaClient } from '@prisma/client';
import { CreateClientDto, UpdateClientDto } from '../dtos/clients.dto';
import { InputJsonValue } from '@prisma/client/runtime/library';

export class ClientsService {
  constructor(private prisma: PrismaClient) {}

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

  async create(dto: CreateClientDto, createdBy?: string) {
    // Check if document already exists
    const existingClient = await this.prisma.client.findFirst({
      where: { 
        document: dto.document as any, // Type assertion until migration is applied
        deletedAt: null,
      } as any,
      select: { id: true },
    });

    if (existingClient) {
      throw new Error('Client with this document already exists');
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
        document: dto.document as any, // Required field - type assertion until migration is applied
        ...(dto.accountId && { accountId: dto.accountId }), // Optional during onboarding
        ...(dto.name && { name: dto.name }), // Optional during onboarding
        ...(phoneString && { phone: phoneString }),
        ...(dto.email && { email: dto.email }),
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


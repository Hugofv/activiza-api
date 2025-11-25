/**
 * Onboarding Service
 * Handles step-by-step client and account creation during onboarding
 */

import { PrismaClient } from '@prisma/client';
import { OnboardingSaveDto } from '../dtos/onboarding.dto';
import { ClientsService } from './clients';
import { AccountsService } from './accounts';
import { VerificationService } from './verification';
import { UserRole } from '../constants/enums';
import bcrypt from 'bcrypt';

export class OnboardingService {
  constructor(
    private prisma: PrismaClient,
    private clientsService: ClientsService,
    private accountsService: AccountsService,
    private verificationService: VerificationService
  ) {}

  /**
   * Save onboarding data - handles progressive data submission
   * Creates/updates client and account as user progresses through steps
   */
  async saveOnboardingData(dto: OnboardingSaveDto): Promise<{
    clientId?: number;
    accountId?: number;
    ownerId?: number;
    step: string;
    message: string;
  }> {
    // Step 1: Find or create client by document
    let client = await this.prisma.client.findFirst({
      where: { document: dto.document as any, deletedAt: null } as any,
      include: { account: true, address: true },
    });

    // If client doesn't exist, create it with just document
    if (!client) {
      client = await this.clientsService.create(
        {
          document: dto.document,
          // accountId will be set later when account is created
        } as any,
        undefined
      );
    }

    const clientId = client.id;

    // Step 2: Update name if provided
    if (dto.name && dto.name !== client.name) {
      client = await this.clientsService.update(
        clientId,
        { name: dto.name } as any,
        undefined
      );
    }

    // Step 3: Update phone if provided and send verification code if not verified
    if (dto.phone) {
      const phoneString = dto.phone.formattedPhoneNumber || dto.phone.phoneNumber;
      if (phoneString && phoneString !== client.phone) {
        client = await this.clientsService.update(
          clientId,
          { phone: dto.phone } as any,
          undefined
        );
        // Send verification code automatically when phone is updated
        const phoneForVerification = dto.phone.country !== null && dto.phone.country !== undefined
          ? dto.phone
          : { ...dto.phone, country: undefined };
        await this.verificationService.sendPhoneVerification(clientId, { 
          phone: phoneForVerification as any
        });
      }
    }

    // Step 4-5: Handle phone verification
    if (dto.code) {
      try {
        await this.verificationService.verifyPhone(clientId, { code: dto.code });
      } catch (error) {
        throw new Error(`Phone verification failed: ${error instanceof Error ? error.message : 'Invalid code'}`);
      }
    }

    // Step 6: Update email if provided and send verification code if not verified
    if (dto.email && dto.email !== client.email) {
      client = await this.clientsService.update(
        clientId,
        { email: dto.email } as any,
        undefined
      );
      // Send verification code automatically when email is updated
      await this.verificationService.sendEmailVerification(clientId, { email: dto.email });
    }

    // Step 7-8: Handle email verification
    if (dto.emailCode) {
      try {
        await this.verificationService.verifyEmail(clientId, { code: dto.emailCode });
      } catch (error) {
        throw new Error(`Email verification failed: ${error instanceof Error ? error.message : 'Invalid code'}`);
      }
    }

    // Step 9: Password is handled when creating account/owner
    // Step 10-13: Update address if provided
    if (dto.address) {
      client = await this.clientsService.update(
        clientId,
        {
          address: {
            street: dto.address.street,
            number: dto.address.number,
            complement: dto.address.complement,
            neighborhood: dto.address.neighborhood,
            city: dto.address.city,
            state: dto.address.state,
            country: dto.address.country || dto.address.countryCode || 'BR',
            postalCode: dto.address.postalCode,
            zip: dto.address.postalCode,
          },
        } as any,
        undefined
      );
    }

    // Step 14: Final step - create account and owner if terms are accepted
    let accountId: number | undefined;
    let ownerId: number | undefined;

    if (dto.termsAccepted && dto.privacyAccepted) {
      // Get verification status
      const verificationStatus = await this.verificationService.getVerificationStatus(clientId);

      // Verify that phone and email are verified
      if (!verificationStatus.phoneVerified) {
        throw new Error('Phone must be verified before completing registration');
      }
      if (!verificationStatus.emailVerified) {
        throw new Error('Email must be verified before completing registration');
      }

      // Verify required fields
      if (!dto.name) {
        throw new Error('Name is required');
      }
      if (!dto.email) {
        throw new Error('Email is required');
      }
      if (!dto.password) {
        throw new Error('Password is required');
      }

      // Check if account already exists for this client
      if (client.accountId) {
        accountId = client.accountId;
        const account = await this.prisma.account.findUnique({
          where: { id: accountId },
          select: { ownerId: true },
        });
        ownerId = account?.ownerId || undefined;
      } else {
        // Create account with owner automatically
        // Use client data for account creation
        const accountData = {
          name: dto.accountName || dto.name || 'My Account',
          email: dto.accountEmail || dto.email,
          phone: dto.phone?.formattedPhoneNumber || dto.phone?.phoneNumber,
          document: dto.document,
          password: dto.password, // Will be used to create owner
        };

        const account = await this.accountsService.create(accountData as any, undefined);
        accountId = account.id;
        ownerId = account.ownerId || undefined;

        // Link client to account
        await this.clientsService.update(
          clientId,
          { accountId } as any,
          undefined
        );
      }
    }

    // Determine current step
    let step = 'document';
    if (dto.termsAccepted && dto.privacyAccepted) {
      step = 'completed';
    } else if (dto.address) {
      step = 'address';
    } else if (dto.password) {
      step = 'password';
    } else if (dto.emailCode) {
      step = 'email_verification';
    } else if (dto.email) {
      step = 'email';
    } else if (dto.code) {
      step = 'phone_verification';
    } else if (dto.phone) {
      step = 'phone';
    } else if (dto.name) {
      step = 'name';
    }

    return {
      clientId,
      accountId,
      ownerId,
      step,
      message: step === 'completed' 
        ? 'Registration completed successfully' 
        : 'Data saved successfully',
    };
  }

  /**
   * Get onboarding progress for a client
   */
  async getOnboardingProgress(document: string): Promise<{
    clientId?: number;
    accountId?: number;
    step: string;
    data: {
      document: string;
      name?: string;
      phone?: string;
      email?: string;
      phoneVerified: boolean;
      emailVerified: boolean;
      address?: any;
      termsAccepted?: boolean;
    };
  }> {
    const client = await this.prisma.client.findFirst({
      where: { document: document as any, deletedAt: null } as any,
      include: {
        account: true,
        address: true,
      },
    });

    if (!client) {
      return {
        step: 'document',
        data: { document, phoneVerified: false, emailVerified: false },
      };
    }

    const verificationStatus = await this.verificationService.getVerificationStatus(client.id);

    let step = 'document';
    if (client.accountId) {
      step = 'completed';
    } else if (client.address) {
      step = 'address';
    } else if (verificationStatus.emailVerified) {
      step = 'email_verification';
    } else if (client.email) {
      step = 'email';
    } else if (verificationStatus.phoneVerified) {
      step = 'phone_verification';
    } else if (client.phone) {
      step = 'phone';
    } else if (client.name) {
      step = 'name';
    }

    const clientWithAddress = client as any; // Type assertion until migration is applied

    return {
      clientId: client.id,
      accountId: client.accountId || undefined,
      step,
      data: {
        document: clientWithAddress.document || document,
        name: client.name || undefined,
        phone: client.phone || undefined,
        email: client.email || undefined,
        phoneVerified: verificationStatus.phoneVerified,
        emailVerified: verificationStatus.emailVerified,
        address: clientWithAddress.address ? {
          street: clientWithAddress.address.street,
          number: clientWithAddress.address.number,
          complement: clientWithAddress.address.complement,
          neighborhood: clientWithAddress.address.neighborhood,
          city: clientWithAddress.address.city,
          state: clientWithAddress.address.state,
          country: clientWithAddress.address.country,
          postalCode: clientWithAddress.address.zip,
        } : undefined,
      },
    };
  }
}


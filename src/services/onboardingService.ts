/**
 * Onboarding Service
 * Handles step-by-step client and account creation during onboarding
 */

import { PrismaClient } from '@prisma/client';
import { OnboardingSaveDto, OnboardingSubmitDto, OnboardingPlansQueryDto } from '../dtos/onboarding.dto';
import { ClientsService } from './clientsService';
import { AccountsService } from './accountsService';
import { VerificationService } from './verificationService';
import { QualificationsService } from './qualificationsService';
import { OnboardingStatus } from '../constants/enums';
import { validateDocument, normalizeDocument } from '../utils/documentValidator';
import { EmailAlreadyExistsError, DocumentAlreadyExistsError, InvalidDocumentError, MissingRequiredFieldsError, WeakPasswordError, EmailNotVerifiedError, PhoneNotVerifiedError } from '../common/classes';
import { AuthService } from './authService';
import { PlansService } from './plansService';
import bcrypt from 'bcrypt';
import { UserRole } from '../constants/enums';

export class OnboardingService {
  private prisma: PrismaClient;
  private clientsService: ClientsService;
  private accountsService: AccountsService;
  private verificationService: VerificationService;
  private qualificationsService: QualificationsService;
  private authService: AuthService;
  private plansService: PlansService;

  constructor({ prisma, clientsService, accountsService, verificationService, qualificationsService, authService, plansService }: {
    prisma: PrismaClient;
    clientsService: ClientsService;
    accountsService: AccountsService;
    verificationService: VerificationService;
    qualificationsService: QualificationsService;
    authService: AuthService;
    plansService: PlansService;
  }) {
    this.prisma = prisma;
    this.clientsService = clientsService;
    this.accountsService = accountsService;
    this.verificationService = verificationService;
    this.qualificationsService = qualificationsService;
    this.authService = authService;
    this.plansService = plansService;
  }

  /**
   * Save onboarding data - handles progressive data submission
   * Creates/updates client and account as user progresses through steps
   * Email is now the primary identifier
   */
  async saveOnboardingData(dto: OnboardingSaveDto): Promise<{
    clientId?: number;
    accountId?: number;
    ownerId?: number;
    step: string;
    message: string;
    savedFields?: string[];
  }> {
    // Step 1: Find or create client by email (primary identifier)
    let client = await this.clientsService.findByEmail(dto.email);

    const savedFields: string[] = [];

    // If client doesn't exist, create it with email
    if (!client) {
      try {
        client = await this.clientsService.create(
          {
            email: dto.email,
            document: dto.document,
            name: dto.name,
            phone: dto.phone,
          } as any,
          undefined
        );
        savedFields.push('email');
        if (dto.document) savedFields.push('document');
        if (dto.name) savedFields.push('name');
        if (dto.phone) savedFields.push('phone');
      } catch (error) {
        if (error instanceof Error && error.message.includes('email already exists')) {
          throw new EmailAlreadyExistsError(dto.email);
        }
        throw error;
      }
    }

    const clientId = client.id;

    // Step 2: Update name if provided
    if (dto.name && dto.name !== client.name) {
      client = await this.clientsService.update(
        clientId,
        { name: dto.name } as any,
        undefined
      );
      if (!savedFields.includes('name')) savedFields.push('name');
    }

    // Update document, documentType, and documentCountryCode if provided
    if (dto.document) {
      const updateData: any = {
        document: dto.document,
      };
      if (dto.documentType) updateData.documentType = dto.documentType;
      if (dto.documentCountryCode) updateData.documentCountryCode = dto.documentCountryCode;

      client = await this.clientsService.update(
        clientId,
        updateData,
        undefined
      );
      if (!savedFields.includes('document')) savedFields.push('document');
      if (dto.documentType && !savedFields.includes('documentType')) savedFields.push('documentType');
      if (dto.documentCountryCode && !savedFields.includes('documentCountryCode')) savedFields.push('documentCountryCode');
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
        if (!savedFields.includes('phone')) savedFields.push('phone');
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

    // Step 6: Send verification code if email is new or not verified
    // Email is already set during client creation, but we need to verify it
    if (dto.email && !client.email) {
      client = await this.clientsService.update(
        clientId,
        { email: dto.email } as any,
        undefined
      );
      // Send verification code automatically when email is set
      await this.verificationService.sendEmailVerification(clientId, { email: dto.email });
      if (!savedFields.includes('email')) savedFields.push('email');
    } else if (dto.email && dto.email === client.email) {
      // Check if email is already verified
      const verificationStatus = await this.verificationService.getVerificationStatus(clientId);
      if (!verificationStatus.emailVerified) {
        // Resend verification code if not verified
        await this.verificationService.sendEmailVerification(clientId, { email: dto.email });
      }
    }

    // Step 7-8: Handle email verification
    if (dto.emailCode) {
      try {
        await this.verificationService.verifyEmail(clientId, { code: dto.emailCode });
        if (!savedFields.includes('emailCode')) savedFields.push('emailCode');
      } catch (error) {
        throw new Error(`Email verification failed: ${error instanceof Error ? error.message : 'Invalid code'}`);
      }
    }

    // Step 9: Password is saved in meta but not validated until submit
    if (dto.password) {
      const meta = (client.meta as Record<string, unknown>) || {};
      meta.password = dto.password; // Store temporarily, will be validated on submit
      await this.clientsService.update(
        clientId,
        { meta: meta as any } as any,
        undefined
      );
      if (!savedFields.includes('password')) savedFields.push('password');
    }

    // Step 10-14: Save business qualification data (Active Customers, Financial Operations, Working Capital, Business Duration, Business Options)
    // Build qualification answers array
    const qualificationAnswers: Array<{ 
      questionKey: string; 
      answer: string | number | string[] | Record<string, unknown>;
      score?: number;
    }> = [];

    if (dto.activeCustomers !== undefined) {
      qualificationAnswers.push({
        questionKey: 'active_customers',
        answer: dto.activeCustomers,
      });
      if (!savedFields.includes('activeCustomers')) savedFields.push('activeCustomers');
    }

    if (dto.financialOperations !== undefined) {
      qualificationAnswers.push({
        questionKey: 'financial_operations',
        answer: dto.financialOperations,
      });
      if (!savedFields.includes('financialOperations')) savedFields.push('financialOperations');
    }

    if (dto.workingCapital !== undefined) {
      qualificationAnswers.push({
        questionKey: 'working_capital',
        answer: dto.workingCapital,
      });
      if (!savedFields.includes('workingCapital')) savedFields.push('workingCapital');
    }

    if (dto.businessDuration !== undefined) {
      qualificationAnswers.push({
        questionKey: 'business_duration',
        answer: dto.businessDuration,
      });
      if (!savedFields.includes('businessDuration')) savedFields.push('businessDuration');
    }

    if (dto.businessOptions && dto.businessOptions.length > 0) {
      qualificationAnswers.push({
        questionKey: 'business_type',
        answer: dto.businessOptions,
      });
      if (!savedFields.includes('businessOptions')) savedFields.push('businessOptions');
    }

    // Save qualifications for the client (accountId will be null until account is created)
    if (qualificationAnswers.length > 0) {
      await this.qualificationsService.saveAnswers({
        accountId: undefined, // Will be set when account is created
        clientId: clientId,
        answers: qualificationAnswers,
      }, undefined);
    }

    // Step 15-17: Update address if provided
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
      if (!savedFields.includes('address')) savedFields.push('address');
    }

    // Save business qualifications
    if (qualificationAnswers.length > 0) {
      if (!savedFields.includes('businessData')) savedFields.push('businessData');
    }

    // Note: Account creation is now handled in submitOnboarding method
    // This save method only saves partial data during onboarding

    // Determine current step based on saved data
    let step = 'email';
    if (client.accountId) {
      step = 'completed';
    } else if (dto.address) {
      step = 'address';
    } else if (dto.businessOptions !== undefined && dto.businessOptions.length > 0) {
      step = 'business_options';
    } else if (dto.businessDuration !== undefined) {
      step = 'business_duration';
    } else if (dto.workingCapital !== undefined) {
      step = 'capital';
    } else if (dto.financialOperations !== undefined) {
      step = 'financial_operations';
    } else if (dto.activeCustomers !== undefined) {
      step = 'active_customers';
    } else if (dto.password) {
      step = 'password';
    } else if (dto.emailCode) {
      step = 'email_verification';
    } else if (dto.code) {
      step = 'phone_verification';
    } else if (dto.phone) {
      step = 'phone';
    } else if (dto.name) {
      step = 'name';
    } else if (dto.document) {
      step = 'document';
    }

    return {
      clientId,
      accountId: client.accountId || undefined,
      ownerId: undefined, // Will be set in submitOnboarding
      step,
      message: 'Data saved successfully',
      savedFields,
    };
  }

  /**
   * Submit onboarding - finalize registration (called at 99% - Options screen)
   */
  async submitOnboarding(dto: OnboardingSubmitDto): Promise<{
    success: boolean;
    userId: number;
    accountId: number;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    // Validate required fields
    const missingFields: string[] = [];
    if (!dto.email) missingFields.push('email');
    if (!dto.password) missingFields.push('password');
    if (!dto.name) missingFields.push('name');
    if (!dto.businessOptions || dto.businessOptions.length === 0) missingFields.push('businessOptions');

    if (missingFields.length > 0) {
      throw new MissingRequiredFieldsError(missingFields);
    }

    // Validate password strength (already validated by DTO, but double-check)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(dto.password)) {
      throw new WeakPasswordError();
    }

    // Find client by email
    const client = await this.clientsService.findByEmail(dto.email);
    if (!client) {
      throw new Error('Client not found. Please complete onboarding steps first.');
    }

    // Verify email and phone are verified
    const verificationStatus = await this.verificationService.getVerificationStatus(client.id);
    if (!verificationStatus.emailVerified) {
      throw new EmailNotVerifiedError();
    }
    if (!verificationStatus.phoneVerified) {
      throw new PhoneNotVerifiedError();
    }

    // Validate document if provided
    if (dto.document) {
      if (!dto.documentType || !dto.documentCountryCode) {
        throw new InvalidDocumentError('documentType and documentCountryCode are required when document is provided');
      }

      // Validate document using document validator
      const isValid = validateDocument(dto.document, dto.documentType, dto.documentCountryCode);
      if (!isValid) {
        throw new InvalidDocumentError(
          `Invalid ${dto.documentType} for country ${dto.documentCountryCode}`,
          { documentType: dto.documentType, countryCode: dto.documentCountryCode }
        );
      }

      // Check if document already exists for this country (excluding current client)
      const normalizedDocument = normalizeDocument(dto.document);
      const existingClientByDocument = await this.prisma.client.findFirst({
        where: {
          document: normalizedDocument,
          documentCountryCode: dto.documentCountryCode,
          deletedAt: null,
          NOT: { id: client.id },
        } as any,
        select: { id: true },
      });

      if (existingClientByDocument) {
        throw new DocumentAlreadyExistsError(dto.documentType, dto.documentCountryCode);
      }

      // Update client with document, documentType, and documentCountryCode
      await this.clientsService.update(
        client.id,
        {
          document: normalizedDocument,
          documentType: dto.documentType,
          documentCountryCode: dto.documentCountryCode,
        } as any,
        undefined
      );
    }

    // Check if PlatformUser with this email already exists
    const existingPlatformUser = await this.prisma.platformUser.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingPlatformUser) {
      throw new EmailAlreadyExistsError(dto.email);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create PlatformUser (owner)
    const platformUserData: any = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone?.formattedPhoneNumber || dto.phone?.phoneNumber || client.phone || null,
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
      emailVerifiedAt: new Date(), // Already verified
    };

    // Add document if provided
    if (dto.document) {
      platformUserData.document = normalizeDocument(dto.document);
    }

    const platformUser = await this.prisma.platformUser.create({
      data: platformUserData,
    });

    // Create Account
    const account = await this.accountsService.create({
      name: dto.accountName || dto.name || 'My Account',
      email: dto.accountEmail || dto.email,
      phone: dto.phone?.formattedPhoneNumber || dto.phone?.phoneNumber || client.phone,
      document: dto.document ? normalizeDocument(dto.document) : null,
      ownerId: platformUser.id,
      planId: dto.planId,
    } as any, undefined);

    // Link client to account
    await this.clientsService.update(
      client.id,
      { accountId: account.id } as any,
      undefined
    );

    // Update address if provided
    if (dto.address) {
      await this.clientsService.update(
        client.id,
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

    // Save business data as LeadQualification
    const qualificationAnswers: Array<{ 
      questionKey: string; 
      answer: string | number | string[] | Record<string, unknown>;
    }> = [];

    if (dto.activeCustomers !== undefined) {
      qualificationAnswers.push({
        questionKey: 'active_customers',
        answer: dto.activeCustomers,
      });
    }

    if (dto.financialOperations !== undefined) {
      qualificationAnswers.push({
        questionKey: 'financial_operations',
        answer: dto.financialOperations,
      });
    }

    if (dto.workingCapital !== undefined) {
      qualificationAnswers.push({
        questionKey: 'working_capital',
        answer: dto.workingCapital,
      });
    }

    if (dto.businessDuration !== undefined) {
      qualificationAnswers.push({
        questionKey: 'business_duration',
        answer: dto.businessDuration,
      });
    }

    if (dto.businessOptions && dto.businessOptions.length > 0) {
      qualificationAnswers.push({
        questionKey: 'business_type',
        answer: dto.businessOptions,
      });
    }

    // Save qualifications linked to account
    if (qualificationAnswers.length > 0) {
      await this.qualificationsService.saveAnswers({
        accountId: account.id,
        clientId: client.id,
        answers: qualificationAnswers,
      }, `${platformUser.id}-${platformUser.email}`);
    }

    // Generate JWT tokens
    const tokens = this.authService.generateTokens({
      userId: platformUser.id,
      email: platformUser.email,
      role: platformUser.role,
      accountId: account.id,
    });

    return {
      success: true,
      userId: platformUser.id,
      accountId: account.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Registration completed successfully',
    };
  }

  /**
   * Get recommended plans based on business metrics
   */
  async getRecommendedPlans(query: OnboardingPlansQueryDto): Promise<{
    plans: Array<{
      id: number;
      name: string;
      description: string | null;
      prices: Array<{ currency: string; price: number; isDefault: boolean }>;
      features: Array<{ key: string; name: string }>;
      recommended: boolean;
      matchScore: number;
    }>;
  }> {
    // Convert query parameters to qualification answers format
    const qualificationAnswers: Array<{ questionKey: string; answer: unknown }> = [];

    if (query.activeCustomers !== undefined) {
      qualificationAnswers.push({
        questionKey: 'active_customers',
        answer: query.activeCustomers,
      });
    }

    if (query.financialOperations !== undefined) {
      qualificationAnswers.push({
        questionKey: 'financial_operations',
        answer: query.financialOperations,
      });
    }

    if (query.workingCapital !== undefined) {
      qualificationAnswers.push({
        questionKey: 'working_capital',
        answer: query.workingCapital,
      });
    }

    if (query.businessDuration !== undefined) {
      qualificationAnswers.push({
        questionKey: 'business_duration',
        answer: query.businessDuration,
      });
    }

    // Map onboarding questionKeys to PlansService expected keys
    const mappedAnswers = qualificationAnswers.map(qa => {
      // Map financial_operations to monthly_operations for PlansService compatibility
      if (qa.questionKey === 'financial_operations') {
        return { questionKey: 'monthly_operations', answer: qa.answer };
      }
      return qa;
    });

    // Use PlansService to get recommended plans
    const plans = await this.plansService.getRecommendedPlans(mappedAnswers);

    // Format response
    const formattedPlans = plans.map((plan: any, index: number) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      prices: plan.prices || [],
      features: (plan.features || []).map((pf: any) => ({
        key: pf.feature?.key || '',
        name: pf.feature?.name || '',
      })),
      recommended: index === 0, // First plan (highest matchScore) is recommended
      matchScore: plan.recommendationScore || 0,
    }));

    return {
      plans: formattedPlans,
    };
  }

  /**
   * Get onboarding progress for a client (by email or document)
   * Email takes priority if both are provided (assumes email format check)
   */
  async getOnboardingProgress(emailOrDocument: string): Promise<{
    clientId?: number;
    accountId?: number;
    status: OnboardingStatus;
    step: string;
    data: {
      email?: string;
      document?: string;
      documentType?: string;
      documentCountryCode?: string;
      name?: string;
      phone?: string;
      phoneVerified: boolean;
      emailVerified: boolean;
      address?: any;
      activeCustomers?: number;
      financialOperations?: number;
      workingCapital?: number;
      businessDuration?: number;
      businessOptions?: string[];
      termsAccepted?: boolean;
    };
  }> {
    // Check if input is email format (simple check)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrDocument);
    
    let client;
    if (isEmail) {
      // Search by email first (primary identifier)
      client = await this.clientsService.findByEmail(emailOrDocument);
    }
    
    // If not found by email, try by document
    if (!client && !isEmail) {
      client = await this.clientsService.findByDocument(emailOrDocument);
    }

    if (!client) {
      return {
        status: OnboardingStatus.NOT_STARTED,
        step: isEmail ? 'email' : 'document',
        data: { 
          [isEmail ? 'email' : 'document']: emailOrDocument,
          phoneVerified: false, 
          emailVerified: false 
        },
      };
    }

    const verificationStatus = await this.verificationService.getVerificationStatus(client.id);

    // Get business qualifications
    const qualifications = await this.qualificationsService.findByClient(client.id);
    const qualificationsMap = qualifications.reduce((acc, q) => {
      acc[q.questionKey] = q.answer;
      return acc;
    }, {} as Record<string, unknown>);

    let status: OnboardingStatus;
    let step = 'document';
    
    if (client.accountId) {
      status = OnboardingStatus.COMPLETED;
      step = 'completed';
    } else {
      status = OnboardingStatus.IN_PROGRESS;
      if (client.address) {
        step = 'address';
      } else if (qualificationsMap['business_type']) {
        step = 'business_options';
      } else if (qualificationsMap['business_duration']) {
        step = 'business_duration';
      } else if (qualificationsMap['working_capital']) {
        step = 'capital';
      } else if (qualificationsMap['financial_operations']) {
        step = 'financial_operations';
      } else if (qualificationsMap['active_customers']) {
        step = 'active_customers';
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
    }

    const clientWithAddress = client as any; // Type assertion until migration is applied

    // Parse business options if it's an array
    const businessOptions = qualificationsMap['business_type'];
    const parsedBusinessOptions = Array.isArray(businessOptions) 
      ? businessOptions 
      : businessOptions ? [businessOptions] : undefined;

    return {
      clientId: client.id,
      accountId: client.accountId || undefined,
      status,
      step,
      data: {
        email: client.email || undefined,
        document: (clientWithAddress as any).document || undefined,
        documentType: (clientWithAddress as any).documentType || undefined,
        documentCountryCode: (clientWithAddress as any).documentCountryCode || undefined,
        name: client.name || undefined,
        phone: client.phone || undefined,
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
        activeCustomers: qualificationsMap['active_customers'] as number | undefined,
        financialOperations: qualificationsMap['financial_operations'] as number | undefined,
        workingCapital: qualificationsMap['working_capital'] as number | undefined,
        businessDuration: qualificationsMap['business_duration'] as number | undefined,
        businessOptions: parsedBusinessOptions as string[] | undefined,
      },
    };
  }
}

export default OnboardingService;



/**
 * Onboarding DTOs
 */

import { z } from 'zod';
import { OnboardingStatus } from '../constants/enums';

// Phone schema
const phoneSchema = z.object({
  country: z.string().nullable().optional(),
  countryCode: z.string(),
  phoneNumber: z.string(),
  formattedPhoneNumber: z.string(),
}).nullable().optional();

// Address schema
const addressSchema = z.object({
  postalCode: z.string(),
  street: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  countryCode: z.string().optional(),
  number: z.string(),
  complement: z.string().optional(),
  _apiFilled: z.record(z.boolean()).optional(),
}).optional();

export const onboardingSaveSchema = z.object({
  // Email as primary identifier (required)
  email: z.string().email(),
  
  // Document (optional)
  document: z.string().optional(),
  documentType: z.enum(['cpf', 'cnpj', 'ssn', 'ein', 'ni', 'crn', 'other']).optional(),
  documentCountryCode: z.string().length(2).optional(), // ISO country code (BR, US, UK, etc)
  
  // Step 2: Name
  name: z.string().min(1).optional(),
  
  // Step 3: Contact (Phone)
  phone: phoneSchema,
  
  // Step 4-5: Phone verification
  code: z.string().optional(), // WhatsApp verification code
  
  // Step 7-8: Email verification
  emailCode: z.string().optional(), // Email verification code
  
  // Step 9: Password (can be saved but not validated until submit)
  password: z.string().min(8).optional(),
  
  // Step 10-13: Address
  address: addressSchema,
  
  // Step 10: Business Information (Active Customers)
  activeCustomers: z.number().int().min(0).optional(), // Max number of active customers (0 = unlimited)
  
  // Step 11: Financial Operations
  financialOperations: z.number().int().min(0).optional(), // Max operations per month (0 = unlimited)
  
  // Step 12: Working Capital
  workingCapital: z.number().int().min(0).optional(), // Working capital in actual currency units (e.g., 5000 = 5k)
  
  // Step 13: Business Duration
  businessDuration: z.number().int().min(0).optional(), // Business duration in months (0 = unlimited)
  
  // Step 14: Business Options (Business Type)
  businessOptions: z.array(z.enum(['lendMoney', 'promissoryNotes', 'rentProperties', 'rentRooms', 'rentVehicles'])).optional(),
  
  // Step 15: Terms
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  
  // Account data (if creating account)
  accountName: z.string().optional(),
  accountEmail: z.string().email().optional(),
  planId: z.number().int().positive().optional(), // Selected plan
  
  // Onboarding status and step (controlled by frontend)
  clientStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  onboardingStep: z.string().optional(),
});

export type OnboardingSaveDto = z.infer<typeof onboardingSaveSchema>;

// Password validation regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const onboardingSubmitSchema = z.object({
  // Required fields for final submission
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  name: z.string().min(1, 'Name is required'),
  
  // Document (optional, but if provided, must include type and country)
  document: z.string().optional(),
  documentType: z.enum(['cpf', 'cnpj', 'ssn', 'ein', 'ni', 'crn', 'other']).optional(),
  documentCountryCode: z.string().length(2).optional(),
  
  // Phone (optional)
  phone: phoneSchema,
  
  // Address (optional)
  address: addressSchema,
  
  // Business data (optional)
  activeCustomers: z.number().int().min(0).optional(),
  financialOperations: z.number().int().min(0).optional(),
  workingCapital: z.number().int().min(0).optional(),
  businessDuration: z.number().int().min(0).optional(),
  
  // Business options (required - at least one must be selected)
  businessOptions: z.array(z.enum(['lendMoney', 'promissoryNotes', 'rentProperties', 'rentRooms', 'rentVehicles']))
    .min(1, 'At least one business option must be selected'),
  
  // Terms (required - must be accepted)
  termsAccepted: z.boolean().refine(val => val === true, { message: 'Terms must be accepted' }),
  privacyAccepted: z.boolean().refine(val => val === true, { message: 'Privacy policy must be accepted' }),
  
  // Account data (optional)
  accountName: z.string().optional(),
  accountEmail: z.string().email().optional(),
  planId: z.number().int().positive().optional(),
  
  // Onboarding status and step (controlled by frontend)
  clientStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  onboardingStep: z.string().optional(),
}).refine(
  (data) => {
    // If document is provided, documentType and documentCountryCode must also be provided
    if (data.document && (!data.documentType || !data.documentCountryCode)) {
      return false;
    }
    return true;
  },
  {
    message: 'documentType and documentCountryCode are required when document is provided',
    path: ['document'],
  }
);

export type OnboardingSubmitDto = z.infer<typeof onboardingSubmitSchema>;

// Query schema for recommended plans
export const onboardingPlansQuerySchema = z.object({
  activeCustomers: z.number().int().min(0).optional(),
  financialOperations: z.number().int().min(0).optional(),
  workingCapital: z.number().int().min(0).optional(),
  businessDuration: z.number().int().min(0).optional(),
});

export type OnboardingPlansQueryDto = z.infer<typeof onboardingPlansQuerySchema>;

/**
 * Onboarding DTOs
 */

import { z } from 'zod';

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
  // Step 1: Document
  document: z.string().min(1),
  
  // Step 2: Name
  name: z.string().min(1).optional(),
  
  // Step 3: Contact (Phone)
  phone: phoneSchema,
  
  // Step 4-5: Phone verification
  code: z.string().optional(), // WhatsApp verification code
  
  // Step 6: Email
  email: z.string().email().optional(),
  
  // Step 7-8: Email verification
  emailCode: z.string().optional(), // Email verification code
  
  // Step 9: Password
  password: z.string().min(8).optional(),
  
  // Step 10-13: Address
  address: addressSchema,
  
  // Step 14: Terms
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  
  // Account data (if creating account)
  accountName: z.string().optional(),
  accountEmail: z.string().email().optional(),
});

export type OnboardingSaveDto = z.infer<typeof onboardingSaveSchema>;


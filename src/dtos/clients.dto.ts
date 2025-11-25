/**
 * Client DTOs
 */

import { z } from 'zod';

// Address schema
const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  postalCode: z.string().optional(),
  zip: z.string().optional(), // alias for postalCode
}).optional();

// Phone schema (supports both string and nested object)
const phoneSchema = z.union([
  z.string(),
  z.object({
    country: z.string().optional(),
    countryCode: z.string().optional(),
    formattedPhoneNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
  }),
]).optional();

export const createClientSchema = z.object({
  document: z.string().min(1), // CPF or CNPJ - required for onboarding
  accountId: z.number().int().positive().optional(), // Optional for onboarding
  name: z.string().min(1).optional(), // Optional during onboarding
  phone: phoneSchema,
  email: z.string().email().optional(),
  code: z.string().optional(),
  password: z.string().optional(), // May be used for creating platform user
  address: addressSchema,
  meta: z.record(z.unknown()).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;


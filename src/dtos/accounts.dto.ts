/**
 * Account DTOs
 */

import { z } from 'zod';
import { Currency, AccountStatus } from '../constants/enums';

export const createAccountSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  document: z.string().optional(),
  status: z.nativeEnum(AccountStatus).default(AccountStatus.ACTIVE),
  currency: z.nativeEnum(Currency).default(Currency.BRL),
  plan: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
  ownerId: z.number().int().optional(), // If provided, use existing owner
  password: z.string().min(8).optional(), // Required if ownerId is not provided (for auto-creating owner)
}).refine(
  (data) => data.ownerId || data.password,
  {
    message: "Password is required when ownerId is not provided",
    path: ["password"],
  }
);

// Update schema - all fields optional, password and ownerId cannot be updated via this endpoint
export const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  document: z.string().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  currency: z.nativeEnum(Currency).optional(),
  plan: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;


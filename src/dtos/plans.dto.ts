/**
 * Plans DTOs
 */

import { z } from 'zod';

export const planFeaturePriceSchema = z.object({
  currency: z.string().min(1), // e.g., "BRL", "USD", "EUR"
  price: z.number().positive(),
  isDefault: z.boolean().default(false),
});

export const planFeatureConfigSchema = z.object({
  featureId: z.number().int().positive(),
  isEnabled: z.boolean().default(true),
  operationLimit: z.number().int().positive().nullable().optional(), // null = unlimited
  resetPeriod: z.enum(['MONTHLY', 'YEARLY', 'LIFETIME']).default('LIFETIME'),
  prices: z.array(planFeaturePriceSchema).optional(), // Multiple prices for different currencies
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  maxOperations: z.number().int().positive().nullable().optional(),
  maxClients: z.number().int().positive().nullable().optional(),
  maxUsers: z.number().int().positive().nullable().optional(),
  maxStorage: z.number().int().positive().nullable().optional(), // in MB
  featureIds: z.array(z.number().int().positive()).optional(), // Features to enable (simple array, uses defaults - no prices)
  features: z.array(planFeatureConfigSchema).optional(), // Detailed feature configuration with limits and prices
  meta: z.record(z.unknown()).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanDto = z.infer<typeof createPlanSchema>;
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;


/**
 * Features DTOs
 */

import { z } from 'zod';
import { selectOptionSchema } from './common.dto';

export const featurePriceSchema = z.object({
  currency: z.string().min(1), // e.g., "BRL", "USD", "EUR"
  price: z.number().positive(),
  isDefault: z.boolean().default(false),
});

export const createFeatureSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  module: selectOptionSchema.optional(), // Module selection with value and label for autocomplete
  prices: z.array(featurePriceSchema).optional(), // Multiple prices for different currencies
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  meta: z.record(z.unknown()).optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial().omit({ key: true });

export type FeaturePriceDto = z.infer<typeof featurePriceSchema>;
export type CreateFeatureDto = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureDto = z.infer<typeof updateFeatureSchema>;


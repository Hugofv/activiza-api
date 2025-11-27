/**
 * Features DTOs
 */

import { z } from 'zod';
import { selectOptionSchema } from './common.dto';

export const createFeatureSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  module: selectOptionSchema.optional(), // Module selection with value and label for autocomplete
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  meta: z.record(z.unknown()).optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial().omit({ key: true });

export type CreateFeatureDto = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureDto = z.infer<typeof updateFeatureSchema>;


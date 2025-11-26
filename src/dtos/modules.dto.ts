/**
 * Modules DTOs
 */

import { z } from 'zod';

export const createModuleSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  meta: z.record(z.unknown()).optional(),
});

export const updateModuleSchema = createModuleSchema.partial().omit({ key: true });

export type CreateModuleDto = z.infer<typeof createModuleSchema>;
export type UpdateModuleDto = z.infer<typeof updateModuleSchema>;
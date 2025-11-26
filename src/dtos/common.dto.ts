/**
 * Common/Shared DTOs
 */

import { z } from 'zod';

/**
 * Generic select option DTO for autocomplete components
 * value: The actual ID/value to be saved
 * label: Display text for the frontend (not saved to database)
 */
export const selectOptionSchema = z.object({
  value: z.number().int().positive(),
  label: z.string().min(1),
});

export type SelectOptionDto = z.infer<typeof selectOptionSchema>;


/**
 * Authentication DTOs
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().optional(),
  document: z.string().optional(),
  password: z.string().min(6),
}).refine((data) => data.email || data.document, {
  message: "Either email or document must be provided",
  path: ["email"],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;


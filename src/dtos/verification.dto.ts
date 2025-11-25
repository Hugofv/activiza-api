/**
 * Verification DTOs
 */

import { z } from 'zod';

// Phone schema (supports both string and nested object)
const phoneSchema = z.union([
  z.string(),
  z.object({
    country: z.string().optional(),
    countryCode: z.string().optional(),
    formattedPhoneNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
  }),
]);

export const sendPhoneVerificationSchema = z.object({
  phone: phoneSchema.optional(), // Optional if phone already exists on client
});

export const verifyPhoneSchema = z.object({
  code: z.string().min(4).max(10),
});

export const sendEmailVerificationSchema = z.object({
  email: z.string().email().optional(), // Optional if email already exists on client
});

export const verifyEmailSchema = z.object({
  code: z.string().min(4).max(10),
});

export type SendPhoneVerificationDto = z.infer<typeof sendPhoneVerificationSchema>;
export type VerifyPhoneDto = z.infer<typeof verifyPhoneSchema>;
export type SendEmailVerificationDto = z.infer<typeof sendEmailVerificationSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;


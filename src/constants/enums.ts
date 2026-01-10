/**
 * Enums and constants used across the API
 */

export const OperationType = {
  LOAN: 'LOAN',
  RENTAL: 'RENTAL',
  OTHER: 'OTHER',
} as const;

export type OperationType = typeof OperationType[keyof typeof OperationType];

export const Frequency = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

export type Frequency = typeof Frequency[keyof typeof Frequency];

export const InstallmentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  LATE: 'LATE',
  CANCELLED: 'CANCELLED',
} as const;

export type InstallmentStatus = typeof InstallmentStatus[keyof typeof InstallmentStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  PIX: 'PIX',
  CARD: 'CARD',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const NotificationChannel = {
  WHATSAPP: 'WHATSAPP',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const;

export type NotificationChannel = typeof NotificationChannel[keyof typeof NotificationChannel];

export const ResourceType = {
  PROPERTY: 'PROPERTY',
  VEHICLE: 'VEHICLE',
  ROOM: 'ROOM',
  OTHER: 'OTHER',
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type AccountStatus = typeof AccountStatus[keyof typeof AccountStatus];

export const Currency = {
  BRL: 'BRL',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;

export type Currency = typeof Currency[keyof typeof Currency];

export const UserRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type OnboardingStatus = typeof OnboardingStatus[keyof typeof OnboardingStatus];
/**
 * User validation schemas using Zod
 * Consolidated from shared/user/schemas/userProfile.ts validation functions
 * Used by both frontend (persistence) and backend (API validation)
 */

import { z } from 'zod';
import type { UserProfile, RecoContext, PlanDocument, GapTicket, EventLog } from '../types/user';

// User Profile schema
export const UserProfileSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  segment: z.enum(['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']),
  programType: z.enum(['GRANT', 'LOAN', 'EQUITY', 'VISA', 'MIXED']),
  industry: z.string().min(1, 'Industry is required'),
  language: z.enum(['DE', 'EN']),
  payerType: z.enum(['INDIVIDUAL', 'COMPANY', 'INSTITUTION']),
  experience: z.enum(['NEWBIE', 'INTERMEDIATE', 'EXPERT']),
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  gdprConsent: z.boolean(),
  dataRetentionUntil: z.string().datetime().optional(),
  subscription: z.object({
    tier: z.enum(['free', 'premium', 'enterprise']),
    expiresAt: z.string().datetime().optional(),
    status: z.enum(['active', 'cancelled', 'expired']).optional(),
  }).optional(),
  isPremium: z.boolean().optional(),
  premium: z.boolean().optional(),
});

export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;

// Validation function for runtime safety
export function validateUserProfile(data: unknown): UserProfile | null {
  try {
    return UserProfileSchema.parse(data);
  } catch (error) {
    console.warn('[userSchemas] UserProfile validation failed:', error);
    return null;
  }
}

// User Context Value schema (for type checking - omitting functions from schema)
export const UserContextValueSchema = z.object({
  userProfile: UserProfileSchema.nullable(),
  isLoading: z.boolean(),
});

// Reco Context schema
export const RecoContextSchema = z.object({
  userId: z.string().min(1),
  answers: z.any(),
  signals: z.any(),
  mode: z.enum(['STRICT', 'EXPLORER']).default('STRICT'),
  programType: z.string().optional(),
  industry: z.string().optional(),
  createdAt: z.string().datetime(),
});

export function validateRecoContext(data: unknown): RecoContext | null {
  try {
    return RecoContextSchema.parse(data);
  } catch (error) {
    console.warn('[userSchemas] RecoContext validation failed:', error);
    return null;
  }
}

// Plan Section schema
export const PlanSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  completed: z.boolean(),
  required: z.boolean(),
  programSpecific: z.boolean().optional(),
});

// Plan Document schema
export const PlanDocumentSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['STRATEGY', 'UPGRADE', 'CUSTOM']).default('CUSTOM'),
  programId: z.string().optional(),
  sections: z.array(PlanSectionSchema),
  metadata: z.object({
    wordCount: z.number().nonnegative().default(0),
    completionPercentage: z.number().min(0).max(100).default(0),
    lastEditedAt: z.string().datetime(),
    version: z.number().positive().default(1),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function validatePlanDocument(data: unknown): PlanDocument | null {
  try {
    return PlanDocumentSchema.parse(data);
  } catch (error) {
    console.warn('[userSchemas] PlanDocument validation failed:', error);
    return null;
  }
}

// Gap Ticket schema
export const GapTicketSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  reason: z.enum(['NO_MATCHES', 'INSUFFICIENT_DATA', 'PROGRAM_MISSING', 'CRITERIA_UNKNOWN']),
  context: z.object({
    answers: z.any(),
    signals: z.any(),
    requestedProgramType: z.string().optional(),
    requestedIndustry: z.string().optional(),
  }),
  suggestedPrograms: z.array(z.string()).default([]),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED']).default('OPEN'),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
});

export function validateGapTicket(data: unknown): GapTicket | null {
  try {
    return GapTicketSchema.parse(data);
  } catch (error) {
    console.warn('[userSchemas] GapTicket validation failed:', error);
    return null;
  }
}

// Event Log schema
export const EventLogSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  event: z.string().min(1),
  properties: z.any().default({}),
  timestamp: z.string().datetime(),
  sessionId: z.string().default('unknown'),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
});

export function validateEventLog(data: unknown): EventLog | null {
  try {
    return EventLogSchema.parse(data);
  } catch (error) {
    console.warn('[userSchemas] EventLog validation failed:', error);
    return null;
  }
}

// Barrel exports
export const userSchemas = {
  UserProfileSchema,
  RecoContextSchema,
  PlanDocumentSchema,
  GapTicketSchema,
  EventLogSchema,
} as const;

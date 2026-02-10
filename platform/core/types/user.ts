/**
 * User types consolidated from shared/user/schemas/userProfile.ts
 * Central location for all user-related type definitions
 */

export interface UserProfile {
  id: string; // Pseudonymous session ID
  segment: 'B2C_FOUNDER' | 'SME_LOAN' | 'VISA' | 'PARTNER';
  programType: 'GRANT' | 'LOAN' | 'EQUITY' | 'VISA' | 'MIXED';
  industry: string;
  language: 'DE' | 'EN';
  payerType: 'INDIVIDUAL' | 'COMPANY' | 'INSTITUTION';
  experience: 'NEWBIE' | 'INTERMEDIATE' | 'EXPERT';
  createdAt: string;
  lastActiveAt: string;
  gdprConsent: boolean;
  dataRetentionUntil?: string; // GDPR compliance
  subscription?: {
    tier: 'free' | 'premium' | 'enterprise';
    expiresAt?: string;
    status?: 'active' | 'cancelled' | 'expired';
  };
  // Backward compatibility fields
  isPremium?: boolean;
  premium?: boolean;
}

/**
 * Context value exposed by useUser() hook
 * Replaces the old UserContext shape
 */
export interface UserContextValue {
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  clearUserProfile: () => void;
  refreshUserProfile: () => Promise<void>;
}

export interface RecoContext {
  userId: string;
  answers: Record<string, any>;
  signals: Record<string, any>;
  mode: 'STRICT' | 'EXPLORER';
  programType?: string;
  industry?: string;
  createdAt: string;
}

export interface PlanDocument {
  id: string;
  userId: string;
  title: string;
  type: 'STRATEGY' | 'UPGRADE' | 'CUSTOM';
  programId?: string; // Target funding program
  sections: PlanSection[];
  metadata: {
    wordCount: number;
    completionPercentage: number;
    lastEditedAt: string;
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlanSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  required: boolean;
  programSpecific?: boolean; // Only shown for certain programs
}

export interface GapTicket {
  id: string;
  userId: string;
  reason: 'NO_MATCHES' | 'INSUFFICIENT_DATA' | 'PROGRAM_MISSING' | 'CRITERIA_UNKNOWN';
  context: {
    answers: Record<string, any>;
    signals: Record<string, any>;
    requestedProgramType?: string;
    requestedIndustry?: string;
  };
  suggestedPrograms: string[]; // Program IDs that were close
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export interface EventLog {
  id: string;
  userId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  ip?: string; // Anonymized
}

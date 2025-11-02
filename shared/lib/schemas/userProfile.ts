// User Profile Schema for Segmented Onboarding & Context Propagation
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

// Schema validation functions
export function validateUserProfile(data: any): UserProfile | null {
  if (!data || typeof data !== 'object') return null;
  
  const required = ['id', 'segment', 'programType', 'industry', 'language', 'payerType', 'experience'];
  if (!required.every(field => data[field])) return null;
  
  if (!['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER'].includes(data.segment)) return null;
  if (!['GRANT', 'LOAN', 'EQUITY', 'VISA', 'MIXED'].includes(data.programType)) return null;
  if (!['DE', 'EN'].includes(data.language)) return null;
  if (!['INDIVIDUAL', 'COMPANY', 'INSTITUTION'].includes(data.payerType)) return null;
  if (!['NEWBIE', 'INTERMEDIATE', 'EXPERT'].includes(data.experience)) return null;
  
  return {
    id: data.id,
    segment: data.segment,
    programType: data.programType,
    industry: data.industry,
    language: data.language,
    payerType: data.payerType,
    experience: data.experience,
    createdAt: data.createdAt || new Date().toISOString(),
    lastActiveAt: data.lastActiveAt || new Date().toISOString(),
    gdprConsent: Boolean(data.gdprConsent),
    dataRetentionUntil: data.dataRetentionUntil
  };
}

export function validateRecoContext(data: any): RecoContext | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.userId || !data.answers || !data.signals) return null;
  
  return {
    userId: data.userId,
    answers: data.answers,
    signals: data.signals,
    mode: data.mode || 'STRICT',
    programType: data.programType,
    industry: data.industry,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

export function validatePlanDocument(data: any): PlanDocument | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.id || !data.userId || !data.title || !Array.isArray(data.sections)) return null;
  
  return {
    id: data.id,
    userId: data.userId,
    title: data.title,
    type: data.type || 'CUSTOM',
    programId: data.programId,
    sections: data.sections,
    metadata: {
      wordCount: data.metadata?.wordCount || 0,
      completionPercentage: data.metadata?.completionPercentage || 0,
      lastEditedAt: data.metadata?.lastEditedAt || new Date().toISOString(),
      version: data.metadata?.version || 1
    },
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

export function validateGapTicket(data: any): GapTicket | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.id || !data.userId || !data.reason || !data.context) return null;
  
  return {
    id: data.id,
    userId: data.userId,
    reason: data.reason,
    context: data.context,
    suggestedPrograms: data.suggestedPrograms || [],
    status: data.status || 'OPEN',
    createdAt: data.createdAt || new Date().toISOString(),
    resolvedAt: data.resolvedAt
  };
}

export function validateEventLog(data: any): EventLog | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.id || !data.userId || !data.event || !data.timestamp) return null;
  
  return {
    id: data.id,
    userId: data.userId,
    event: data.event,
    properties: data.properties || {},
    timestamp: data.timestamp,
    sessionId: data.sessionId || 'unknown',
    userAgent: data.userAgent,
    ip: data.ip
  };
}

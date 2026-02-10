/**
 * Analysis Types - Unified types for program and document analysis
 */

/**
 * Persisted program data for localStorage
 */
export interface PersistedProgram {
  id: string;
  name: string;
  type?: string;
  organization?: string;
  application_requirements?: unknown;
  
  repayable?: boolean | null;
  repayable_percentage?: number | null;
  repayable_type?: 'grant' | 'loan' | 'mixed' | 'convertible' | null;
  
  timeline?: {
    application_deadline?: string | null;
    decision_time?: string | null;
    funding_start?: string | null;
  };
  
  effort_level?: 'low' | 'medium' | 'heavy';
  organisation_type?: string | null;
  eligible_company_types?: string[] | null;
  eligible_stage?: string | null;
}

/**
 * Result of program analysis
 */
export interface ProgramAnalysisResult {
  programId: string;
  matchScore: number;
  matchedCriteria: string[];
  gaps: string[];
  recommendations: string[];
  confidence: number;
}

/**
 * Result of document analysis
 */
export interface DocumentAnalysisResult {
  documentId: string;
  structure: {
    sections: SectionInfo[];
    confidence: number;
  };
  quality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  metadata: {
    wordCount: number;
    hasTitlePage: boolean;
    hasTOC: boolean;
    detectedType: string;
  };
}

/**
 * Section information for document analysis
 */
export interface SectionInfo {
  id: string;
  title: string;
  type: string;
  confidence: number;
  wordCount: number;
}

/**
 * Analysis context for cross-flow convergence
 */
export interface AnalysisContext {
  source: 'program' | 'document' | 'template';
  userProfile?: unknown;
  programData?: unknown;
  documentData?: unknown;
  options?: AnalysisOptions;
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  includeQualityCheck?: boolean;
  includeRecommendations?: boolean;
  minConfidence?: number;
  maxResults?: number;
}

/**
 * Match score details
 */
export interface MatchScore {
  overall: number;
  breakdown: {
    criteria: string;
    score: number;
    weight: number;
  }[];
  normalized: number;
}

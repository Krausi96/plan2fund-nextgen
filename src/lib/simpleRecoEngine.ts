// Simple Recommendation Engine - Minimal replacement for quarantined files
import { Program, UserAnswers, ScoredProgram } from "@/types";

export interface EnhancedProgramResult extends ScoredProgram {
  matchedCriteria: Array<{
    key: string;
    value: any;
    reason: string;
    status: 'passed' | 'warning' | 'failed';
  }>;
  gaps: Array<{
    key: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  amount?: {
    min: number;
    max: number;
    currency: string;
  };
  timeline?: string;
  successRate?: number;
  llmFailed?: boolean;
  fallbackReason?: string;
  fallbackGaps?: string[];
}

export function scoreProgramsEnhanced(
  answers: UserAnswers,
  mode: "strict" | "explorer" = "strict"
): EnhancedProgramResult[] {
  // Simple fallback - return empty results
  return [];
}

export function analyzeFreeTextEnhanced(description: string): { 
  normalized: UserAnswers; 
  scored: EnhancedProgramResult[] 
} {
  return {
    normalized: {},
    scored: []
  };
}

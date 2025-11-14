export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface SuccessProbabilityFeatures {
  baseScore: number; // Final matching score (0-100)
  matchedCriteria: number;
  totalCriteria: number;
  gaps: number;
  programType?: string;
  historicalRate?: number;
  qualityScore?: number;
  readinessScore?: number;
}

export interface SuccessProbabilityResult {
  probability: number; // 0-1
  confidence: ConfidenceLevel;
  factors: string[];
}

export interface QualityPredictionInput {
  sectionId: string;
  observedOverall: number;
  readability: number;
  completeness: number;
  persuasiveness: number;
  wordCount: number;
  requiredWordCount?: number;
  gaps?: number;
}

export interface QualityPredictionResult {
  predictedOverall: number;
  predictedReadability: number;
  predictedCompleteness: number;
  predictedPersuasiveness: number;
  confidence: ConfidenceLevel;
  notes: string[];
}

export interface AdaptiveExtractionInput {
  institution: string;
  pageType: string;
  previousAccuracy?: number;
  previousConfidence?: number;
  contentLength?: number;
}

export type ExtractionStrategy = 'regex' | 'llm' | 'hybrid' | 'custom_llm';

export interface AdaptiveExtractionDecision {
  strategy: ExtractionStrategy;
  confidence: ConfidenceLevel;
  rationale: string[];
}

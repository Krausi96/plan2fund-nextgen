// Removed static JSON import - using database instead
import { UserAnswers } from "@/shared/user/storage/planStore";
import { estimateSuccessProbability, ConfidenceLevel } from '@/shared/lib/ai/mlModels';

// ============================================================================
// Question Weights for Scoring (integrated from questionWeights.ts)
// ============================================================================
/**
 * Question Weights for Scoring
 * 
 * These weights determine how much each question contributes to the final match score.
 * Weights are based on:
 * - Program coverage (% of programs that have this requirement)
 * - Hard blocker status (can this disqualify you?)
 * - Matching importance (how critical is this for finding the right program?)
 * 
 * Total weights should sum to ~100% for normalization.
 * Weights are data-driven estimates based on program analysis.
 */

export interface QuestionWeights {
  location: number;
  company_type: number;
  funding_amount: number;
  industry_focus: number;
  impact: number;
  company_stage: number;
  use_of_funds: number;
  project_duration: number;
  deadline_urgency: number;
  co_financing: number;
  revenue_status: number;
  team_size: number;
}

/**
 * Fixed weights for each question
 * Based on analysis from scripts/analyze-question-importance.ts
 * 
 * Weights are percentages (0-100) that sum to ~100%
 * These are normalized during scoring based on answered questions
 */
export const QUESTION_WEIGHTS: QuestionWeights = {
  // Tier 1: Essential (Hard Blockers)
  location: 22,        // 90% program coverage, hard blocker
  company_type: 20,    // 85% program coverage, hard blocker
  funding_amount: 18,  // 70% program coverage, critical for matching
  
  // Tier 2: Important
  industry_focus: 15,  // 45% program coverage, important for matching
  impact: 8,           // 15% program coverage, nice to have
  company_stage: 6,    // 35% program coverage, useful for filtering
  
  // Tier 3: Optional
  co_financing: 5,     // 28% program coverage, can be hard blocker when required
  use_of_funds: 4,     // 18% program coverage, low impact
  revenue_status: 2,   // 10% program coverage, low impact
  team_size: 2,        // 12% program coverage, low impact
  project_duration: 1, // 5% program coverage, very low impact
  
  // Tier 4: Not Scored (Filtering Only)
  deadline_urgency: 0, // 0% program coverage - this is user preference, not program requirement
};

/**
 * Get weight for a specific question
 */
export function getQuestionWeight(key: keyof QuestionWeights): number {
  return QUESTION_WEIGHTS[key] || 0;
}

/**
 * Calculate total weight for a set of answered questions
 * Used for score normalization
 */
export function calculateTotalWeight(answeredQuestions: (keyof QuestionWeights)[]): number {
  return answeredQuestions.reduce((sum, key) => sum + getQuestionWeight(key), 0);
}

/**
 * Get all question keys
 */
export function getAllQuestionKeys(): (keyof QuestionWeights)[] {
  return Object.keys(QUESTION_WEIGHTS) as (keyof QuestionWeights)[];
}

/**
 * Get questions by tier (for analysis/debugging)
 */
export function getQuestionsByTier(): {
  tier1: (keyof QuestionWeights)[];
  tier2: (keyof QuestionWeights)[];
  tier3: (keyof QuestionWeights)[];
  tier4: (keyof QuestionWeights)[];
} {
  return {
    tier1: ['location', 'company_type', 'funding_amount'],
    tier2: ['industry_focus', 'impact', 'company_stage'],
    tier3: ['co_financing', 'use_of_funds', 'revenue_status', 'team_size', 'project_duration'],
    tier4: ['deadline_urgency'],
  };
}

// Inlined from types.ts - MatchStatus type
export type MatchStatus = 'match' | 'gap' | 'unknown';
// Removed doctorDiagnostic - filtering handled by QuestionEngine

// Program type definition (basic structure for scoring)
export interface Program {
  id: string;
  name: string;
  type: string;
  program_type?: string;
  program_category?: string;
  requirements?: Record<string, any>;
  notes?: string;
  maxAmount?: number;
  link?: string;
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: any[];
  editor_sections?: any[];
  readiness_criteria?: any[];
  ai_guidance?: any;
  categorized_requirements?: Record<string, any[]>;
  [key: string]: any; // Allow additional properties
}

// Import centralized normalization system for consistent matching
import {
  normalizeIndustryAnswer,
  normalizeCoFinancingAnswer,
} from './normalization';

// Eligibility trace interface
export interface EligibilityTrace {
  passed: string[];
  failed: string[];
  warnings: string[];
  counterfactuals: string[];
}

// Enhanced program result with detailed explanations
export interface EnhancedProgramResult extends Program {
  score: number; // Match score (0-100)
  eligibility: string; // "Eligible" | "Not Eligible"
  confidence: "High" | "Medium" | "Low";
  reason: string; // Human-readable explanation
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
  matchSummary?: Record<string, MatchStatus>;
  unknownCriteria?: string[];
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
  founderFriendlyReasons?: string[];
  founderFriendlyRisks?: string[];
  // Aliases for UI compatibility
  reasons?: string[];
  risks?: string[];
  route?: string; // Program route/type for navigation
  trace?: EligibilityTrace;
  successConfidence?: ConfidenceLevel;
  successFactors?: string[];
  // Enhanced explanations (NEW - optional, simple)
  strategicAdvice?: string; // One sentence, optional
  applicationInfo?: string; // One sentence, optional
  riskMitigation?: string; // One sentence, optional
  // Doctor diagnostic fields
      // Diagnosis fields removed - not used in unified flow
}

export function normalizeAnswers(answers: UserAnswers): UserAnswers {
  const normalized: UserAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string") {
      normalized[key] = value.trim().toLowerCase();
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

// ---------------------------------------------------------------------------
// Answer normalization helpers (new schema)
// ---------------------------------------------------------------------------

function getPrimaryLocation(answers: UserAnswers): string | undefined {
  const value = answers.location || (answers.q1_country as any);
  if (!value) return undefined;
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return undefined;
}

type CompanyStage =
  | 'idea'
  | 'pre_company'
  | 'inc_lt_6m'
  | 'inc_6_36m'
  | 'inc_gt_36m'
  | 'research_org'
  | 'nonprofit'
  | 'unknown';

function getCompanyStage(answers: UserAnswers): CompanyStage {
  const stage =
    (answers.company_stage as string) ||
    (answers.company_type as string) ||
    (answers.q2_entity_stage as string) ||
    '';

  const normalized = stage.toLowerCase();
  switch (normalized) {
    case 'idea':
    case 'concept':
    case 'ideation':
      return 'idea';
    case 'pre_company':
    case 'pre-company':
    case 'team':
    case 'startup':
      return 'pre_company';
    case 'inc_lt_6m':
    case 'lt6m':
    case 'less_than_6_months':
    case 'early-stage':
      return 'inc_lt_6m';
    case 'inc_6_36m':
    case '6_36m':
    case '6-36m':
    case 'sme':
      return 'inc_6_36m';
    case 'inc_gt_36m':
    case 'gt36m':
    case 'scaleup':
    case 'corporate':
    case 'large':
      return 'inc_gt_36m';
    case 'research_org':
    case 'research':
    case 'university':
      return 'research_org';
    case 'nonprofit':
    case 'ngo':
    case 'association':
      return 'nonprofit';
    default:
      return 'unknown';
  }
}

type TeamSizeBucket = 'micro_0_9' | 'small_10_49' | 'medium_50_249' | 'large_250_plus' | 'unknown';

function getTeamSizeBucket(answers: UserAnswers): TeamSizeBucket {
  const value =
    (answers.team_size as string) ||
    (answers.employees as string) ||
    (answers.q3_company_size as string) ||
    '';
  const normalized = value.toLowerCase();

  if (['1to2', '1_2', 'micro_0_9', '0-9', 'micro', 'solo'].includes(normalized)) {
    return 'micro_0_9';
  }
  if (['3to5', '6to10', '10to49', 'small_10_49', '10-49', 'small'].includes(normalized)) {
    return 'small_10_49';
  }
  if (['50to249', 'medium_50_249', '50-249', 'medium'].includes(normalized)) {
    return 'medium_50_249';
  }
  if (['over250', '250plus', 'large_250_plus', '250+', 'large'].includes(normalized)) {
    return 'large_250_plus';
  }

  return 'unknown';
}

function getFundingPreference(answers: UserAnswers): string | undefined {
  const pref = answers.funding_preference;
  if (typeof pref === 'string') return pref.toLowerCase();
  if (Array.isArray(pref) && pref.length) return String(pref[0]).toLowerCase();
  const useOfFunds = answers.use_of_funds;
  if (Array.isArray(useOfFunds)) {
    if (useOfFunds.includes('loan')) return 'loan';
    if (useOfFunds.includes('equity')) return 'equity';
  }
  return undefined;
}

function getTrlBucket(answers: UserAnswers): 'low' | 'mid' | 'high' | 'unknown' {
  const trl = (answers.trl_level as string) || (answers.q5_maturity_trl as string) || '';
  const normalized = trl.toLowerCase();

  if (normalized.includes('trl_1') || normalized.includes('trl_2') || normalized.includes('ideation')) {
    return 'low';
  }
  if (
    normalized.includes('trl_3') ||
    normalized.includes('trl_4') ||
    normalized.includes('trl_5') ||
    normalized.includes('trl_6') ||
    normalized.includes('prototype')
  ) {
    return 'mid';
  }
  if (
    normalized.includes('trl_7') ||
    normalized.includes('trl_8') ||
    normalized.includes('trl_9') ||
    normalized.includes('launch')
  ) {
    return 'high';
  }
  return 'unknown';
}

function hasTheme(answers: UserAnswers, theme: 'sustainability' | 'health' | 'digital' | 'manufacturing' | 'export'): boolean {
  const focus = answers.strategic_focus;
  const impact = answers.impact;
  const useOfFunds = answers.use_of_funds;

  const match = (value: any) => {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.some((v) => String(v).toLowerCase().includes(theme));
    }
    return String(value).toLowerCase().includes(theme);
  };

  return match(focus) || match(impact) || match(useOfFunds);
}

function hasSocialImpact(answers: UserAnswers): boolean {
  return hasTheme(answers, 'sustainability') || hasTheme(answers, 'health') || (answers.impact && Array.isArray(answers.impact) && answers.impact.includes('social'));
}

function hasESGImpact(answers: UserAnswers): boolean {
  return hasTheme(answers, 'sustainability') || (answers.impact && Array.isArray(answers.impact) && answers.impact.includes('environmental'));
}

function isRAndDInAustria(answers: UserAnswers): boolean | undefined {
  const value = answers.rd_in_austria ?? answers.q6_rnd_in_at;
  if (typeof value === 'string') {
    if (['yes', 'true', 'y', 'ja'].includes(value.toLowerCase())) return true;
    if (['no', 'false', 'n', 'nein'].includes(value.toLowerCase())) return false;
  }
  if (typeof value === 'boolean') return value;
  return undefined;
}

function getDeadlineUrgency(answers: UserAnswers): 'urgent' | 'soon' | 'normal' {
  const value = answers.deadline_urgency;
  if (typeof value === 'string') {
    if (value === 'urgent') return 'urgent';
    if (value === 'soon') return 'soon';
  }
  return 'normal';
}

function enrichAnswers(answers: UserAnswers): UserAnswers {
  const enriched: UserAnswers = { ...answers };

  const location = getPrimaryLocation(enriched);
  if (location) {
    enriched.location = location;
    if (!enriched.q1_country) {
      enriched.q1_country =
        location === 'austria'
          ? 'AT'
          : location === 'germany'
          ? 'DE'
          : location === 'switzerland'
          ? 'CH'
          : location === 'eu'
          ? 'EU'
          : location.toUpperCase();
    }
  }

  const stage = getCompanyStage(enriched);
  if (!enriched.q2_entity_stage || enriched.q2_entity_stage === '') {
    enriched.q2_entity_stage = stage.toUpperCase();
  }
  enriched.company_stage = stage;

  const teamBucket = getTeamSizeBucket(enriched);
  if (!enriched.q3_company_size || enriched.q3_company_size === '') {
    enriched.q3_company_size = teamBucket.toUpperCase();
  }
  enriched.team_size = teamBucket;

  const fundingPref = getFundingPreference(enriched);
  if (fundingPref && !enriched.q8_funding_types) {
    enriched.q8_funding_types = [fundingPref.toUpperCase()];
  }

  const trl = getTrlBucket(enriched);
  if (!enriched.q5_maturity_trl) {
    enriched.q5_maturity_trl = trl.toUpperCase();
  }

  const rnd = isRAndDInAustria(enriched);
  if (rnd !== undefined && !enriched.q6_rnd_in_at) {
    enriched.q6_rnd_in_at = rnd ? 'YES' : 'NO';
  }

  if (hasTheme(enriched, 'sustainability')) {
    enriched.q4_theme = 'SUSTAINABILITY';
  } else if (hasTheme(enriched, 'health')) {
    enriched.q4_theme = 'HEALTH_LIFE_SCIENCE';
  } else if (hasTheme(enriched, 'digital')) {
    enriched.q4_theme = 'INNOVATION_DIGITAL';
  }

  // Revenue status - keep as is, normalization handled in matching
  if (enriched.revenue_status || enriched.revenue || enriched.current_revenue) {
    enriched.revenue_status = enriched.revenue_status || enriched.revenue || enriched.current_revenue;
  }

  // Co-financing - use centralized normalization
  if (enriched.co_financing || enriched.co_financing_status || enriched.co_financing_required) {
    const coFinValue = enriched.co_financing || enriched.co_financing_status || enriched.co_financing_required;
    const normalized = normalizeCoFinancingAnswer(String(coFinValue));
    enriched.co_financing = normalized.type === 'none' ? 'co_no' : 
                            normalized.type === 'partial' ? 'co_partial' : 
                            normalized.type === 'required' ? 'co_yes' : 
                            coFinValue;
  }

  // Industry - use centralized normalization
  if (enriched.industry_focus) {
    const industries = Array.isArray(enriched.industry_focus)
      ? enriched.industry_focus
      : [enriched.industry_focus];
    const normalized = normalizeIndustryAnswer(industries);
    enriched.industry_focus = normalized.primary.length > 0 ? normalized.primary : industries;
  }

  if (!enriched.industry_focus && enriched.strategic_focus) {
    const focuses = Array.isArray(enriched.strategic_focus)
      ? enriched.strategic_focus
      : [enriched.strategic_focus];
    const normalized = normalizeIndustryAnswer(focuses);
    enriched.industry_focus = normalized.primary.length > 0 ? normalized.primary : focuses;
  }

  if (enriched.industry_focus) {
    enriched.industry_focus = Array.from(new Set(enriched.industry_focus));
  }

  if (enriched.strategic_focus) {
    const focuses = Array.isArray(enriched.strategic_focus)
      ? enriched.strategic_focus
      : [enriched.strategic_focus];
    const normalized = normalizeIndustryAnswer(focuses);
    if (normalized.primary.length > 0) {
      enriched.strategic_focus = Array.from(new Set(normalized.primary));
    }
  }

  return enriched;
}

// Derived signals interface
export interface DerivedSignals {
  capexFlag: boolean;
  equityOk: boolean;
  collateralOk: boolean;
  urgencyBucket: "urgent" | "soon" | "normal";
  companyAgeBucket: "pre" | "0-3y" | "3y+";
  sectorBucket: string;
  rdInAT?: boolean;
  // Fit calculations removed - not used in scoring
  // amountFit: number;
  // stageFit: number;
  // timelineFit: number;
  fundingMode: string;
  // New derived signals for richer persona coverage
  trlBucket: "low" | "mid" | "high" | "unknown";
  revenueBucket: "none" | "low" | "medium" | "high";
  ipFlag: boolean;
  regulatoryFlag: boolean;
  socialImpactFlag: boolean;
  esgFlag: boolean;
  // Unknown handling
  unknowns: string[];
  counterfactuals: string[];
}

// Derive signals from user answers
export function deriveSignals(answers: UserAnswers): DerivedSignals {
  const companyStage = getCompanyStage(answers);
  const teamSize = getTeamSizeBucket(answers);
  const location = getPrimaryLocation(answers);
  const trlBucket = getTrlBucket(answers);
  const fundingPreference = getFundingPreference(answers);
  const rndInAT = isRAndDInAustria(answers);
  const urgency = getDeadlineUrgency(answers);
  // Revenue status - keep as string, normalization handled in matching
  const revenueStatus = answers.revenue_status || answers.revenue;
  
  // Co-financing - use centralized normalization
  const coStatus = answers.co_financing 
    ? (() => {
        const normalized = normalizeCoFinancingAnswer(String(answers.co_financing));
        return normalized.type === 'none' ? 'co_no' : 
               normalized.type === 'partial' ? 'co_partial' : 
               normalized.type === 'required' ? 'co_yes' : 
               answers.co_financing;
      })()
    : undefined;
  
  // Industry - use centralized normalization
  const industryFocusRaw = Array.isArray(answers.industry_focus)
    ? answers.industry_focus
    : answers.industry_focus
    ? [answers.industry_focus]
    : [];
  const normalizedIndustry = normalizeIndustryAnswer(industryFocusRaw);
  const industryFocus = normalizedIndustry.primary.length > 0 ? normalizedIndustry.primary : industryFocusRaw;

  const signals: DerivedSignals = {
    capexFlag:
      hasTheme(answers, 'manufacturing') ||
      hasTheme(answers, 'digital') ||
      hasTheme(answers, 'export') ||
      industryFocus.includes('manufacturing') ||
      industryFocus.includes('digital'),
    equityOk:
      (companyStage === 'pre_company' || companyStage === 'inc_lt_6m' || companyStage === 'inc_6_36m') &&
      (teamSize === 'micro_0_9' || teamSize === 'small_10_49'),
    collateralOk:
      (companyStage === 'inc_gt_36m' || companyStage === 'research_org') &&
      (teamSize === 'medium_50_249' || teamSize === 'large_250_plus'),
    urgencyBucket: urgency,
    companyAgeBucket:
      companyStage === 'pre_company'
        ? 'pre'
        : companyStage === 'inc_lt_6m' || companyStage === 'inc_6_36m'
        ? '0-3y'
        : companyStage === 'inc_gt_36m'
        ? '3y+'
        : 'pre',
    sectorBucket: industryFocus[0]
      ? industryFocus[0] === 'digital'
        ? 'tech'
        : industryFocus[0] === 'health'
        ? 'health'
        : industryFocus[0] === 'sustainability'
        ? 'sustainability'
        : industryFocus[0] === 'manufacturing'
        ? 'manufacturing'
        : 'general'
      : hasTheme(answers, 'health')
      ? 'health'
      : hasTheme(answers, 'sustainability')
      ? 'sustainability'
      : hasTheme(answers, 'manufacturing')
      ? 'manufacturing'
      : hasTheme(answers, 'digital')
      ? 'tech'
      : 'general',
    rdInAT: rndInAT,
    // Fit calculations removed - not used in scoring
    // amountFit: 0,
    // stageFit: 0,
    // timelineFit: 0,
    fundingMode: fundingPreference || 'grant',
    trlBucket,
    revenueBucket: revenueStatus
      ? revenueStatus === 'pre_revenue'
        ? 'none'
        : revenueStatus === 'early_revenue'
        ? 'low'
        : 'medium'
      : companyStage === 'pre_company'
      ? 'none'
      : companyStage === 'inc_lt_6m' || companyStage === 'inc_6_36m'
      ? 'low'
      : 'medium',
    ipFlag:
      industryFocus.includes('digital') ||
      industryFocus.includes('manufacturing') ||
      hasTheme(answers, 'digital') ||
      hasTheme(answers, 'manufacturing') ||
      hasTheme(answers, 'health'),
    regulatoryFlag:
      industryFocus.includes('health') ||
      industryFocus.includes('sustainability') ||
      hasTheme(answers, 'health') ||
      hasTheme(answers, 'sustainability'),
    socialImpactFlag: hasSocialImpact(answers) || industryFocus.includes('sustainability'),
    esgFlag: hasESGImpact(answers) || industryFocus.includes('sustainability'),
    unknowns: [],
    counterfactuals: []
  };

  if (!answers.company_stage) {
    signals.unknowns.push('company_stage');
    signals.counterfactuals.push('Specify company stage to refine recommendations');
  }
  if (teamSize === 'unknown') {
    signals.unknowns.push('team_size');
    signals.counterfactuals.push('Add team size to unlock SME or corporate programs');
  }
  if (!location) {
    signals.unknowns.push('location');
    signals.counterfactuals.push('Tell us where you operate to filter regional programs');
  }
  if (trlBucket === 'unknown') {
    signals.unknowns.push('trl_level');
    signals.counterfactuals.push('Add TRL to unlock R&D and innovation calls');
  }
  if (rndInAT === undefined) {
    signals.unknowns.push('rd_in_austria');
    signals.counterfactuals.push('Specify if R&D happens in Austria (important for local grants)');
  }
  if (!revenueStatus) {
    signals.unknowns.push('revenue_status');
    signals.counterfactuals.push('Tell us your revenue status to balance grants vs. bank programmes');
  }
  if (!coStatus) {
    signals.unknowns.push('co_financing');
    signals.counterfactuals.push('Clarify co-financing ability to surface the right grant ratio');
  }
  if (industryFocus.length === 0) {
    signals.unknowns.push('industry_focus');
    signals.counterfactuals.push('Select an industry focus to highlight specialised calls');
  }

  if (coStatus === 'co_yes') {
    signals.capexFlag = true;
  }

  if (signals.equityOk && signals.companyAgeBucket === 'pre') {
    signals.fundingMode = 'equity';
  } else if (
    signals.collateralOk &&
    signals.urgencyBucket !== 'normal' &&
    (coStatus === 'co_yes' || revenueStatus === 'growing_revenue')
  ) {
    signals.fundingMode = 'loan';
  } else if (signals.capexFlag && signals.rdInAT !== false) {
    signals.fundingMode = 'grant';
  } else if (signals.socialImpactFlag || signals.esgFlag) {
    signals.fundingMode = 'grant';
  } else if (coStatus === 'co_no') {
    signals.fundingMode = 'grant';
  } else {
    signals.fundingMode = fundingPreference || 'mixed';
  }

  // Fit calculations removed - not used in scoring, only in trace generation
  // signals.amountFit = calculateAmountFit(answers, signals);
  // signals.stageFit = calculateStageFit(answers, signals);
  // signals.timelineFit = calculateTimelineFit(answers, signals);

  return signals;
}

// Helper functions for fit calculations - REMOVED (not used in scoring)
// These functions were calculated but never used in the actual scoring logic
/*
function calculateAmountFit(_answers: UserAnswers, signals: DerivedSignals): number {
  // This would typically use actual program amount data
  // For now, return a base score based on funding mode and derived signals
  const baseScores = {
    "grant": 80,
    "loan": 70,
    "equity": 60,
    "mixed": 75
  };
  
  let score = baseScores[signals.fundingMode as keyof typeof baseScores] || 50;
  
  // Boost score for ESG/social impact programs
  if (signals.esgFlag && signals.socialImpactFlag) {
    score += 10;
  }
  
  // Boost score for regulatory programs
  if (signals.regulatoryFlag) {
    score += 5;
  }
  
  // Reduce score for unknowns
  if (signals.unknowns.length > 0) {
    score -= signals.unknowns.length * 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateStageFit(_answers: UserAnswers, signals: DerivedSignals): number {
  // Higher score for better stage-program alignment
  let score = 70;
  
  if (signals.companyAgeBucket === "pre" && signals.fundingMode === "equity") score = 90;
  else if (signals.companyAgeBucket === "0-3y" && signals.fundingMode === "grant") score = 85;
  else if (signals.companyAgeBucket === "3y+" && signals.fundingMode === "loan") score = 80;
  
  // Boost for TRL alignment
  if (signals.trlBucket === "mid" && signals.fundingMode === "grant") score += 10;
  if (signals.trlBucket === "high" && signals.fundingMode === "loan") score += 10;
  
  // Boost for IP alignment
  if (signals.ipFlag && signals.fundingMode === "equity") score += 5;
  
  // Reduce for unknowns
  if (signals.unknowns.includes("q2_entity_stage") || signals.unknowns.includes("q3_company_size")) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateTimelineFit(_answers: UserAnswers, signals: DerivedSignals): number {
  // Higher score for urgent needs with fast programs
  let score = 60;
  
  if (signals.urgencyBucket === "urgent" && signals.fundingMode === "loan") score = 90;
  else if (signals.urgencyBucket === "soon" && signals.fundingMode === "grant") score = 80;
  else if (signals.urgencyBucket === "normal") score = 75;
  
  // Boost for regulatory programs (often have longer timelines)
  if (signals.regulatoryFlag && signals.fundingMode === "grant") score += 5;
  
  // Boost for ESG programs (often have flexible timelines)
  if (signals.esgFlag && signals.fundingMode === "grant") score += 5;
  
  // Reduce for unknowns
  if (signals.unknowns.includes("q5_maturity_trl")) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}
*/

// Removed calculateRequirementFrequencies - now using fixed weights (integrated above)


// Removed applyMajorFiltersToPrograms - filtering is now handled by /api/programs/recommend endpoint
// Programs are pre-filtered before being passed to scoreProgramsEnhanced

// Scoring consistency validation: Ensure same answers = same scores
const scoringCache = new Map<string, { score: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(answers: UserAnswers, programId: string): string {
  const sortedAnswers = Object.keys(answers)
    .sort()
    .map(key => `${key}:${JSON.stringify(answers[key])}`)
    .join('|');
  return `${programId}:${sortedAnswers}`;
}

function validateScoringConsistency(
  programId: string,
  answers: UserAnswers,
  score: number
): { consistent: boolean; previousScore?: number } {
  const cacheKey = getCacheKey(answers, programId);
  const cached = scoringCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const isConsistent = Math.abs(cached.score - score) < 1; // Allow 1% tolerance
    if (!isConsistent) {
      console.warn(`⚠️ Scoring inconsistency detected for ${programId}: ${cached.score}% vs ${score}%`);
    }
    return { consistent: isConsistent, previousScore: cached.score };
  }
  
  // Cache this score
  scoringCache.set(cacheKey, { score, timestamp: Date.now() });
  return { consistent: true };
}

// Enhanced scoring with detailed explanations and trace generation
export async function scoreProgramsEnhanced(
  answers: UserAnswers,
  mode: "strict" | "explorer" = "strict",
  preFilteredPrograms?: Program[] // NEW: Optional pre-filtered programs from QuestionEngine
): Promise<EnhancedProgramResult[]> {
  try {
    const userAnswers = enrichAnswers(answers);
    const derivedSignals = deriveSignals(userAnswers);

    // Programs must be provided by caller (from /api/programs/recommend or other source)
    // No longer fetching programs here - single responsibility: scoring only
    if (!preFilteredPrograms || preFilteredPrograms.length === 0) {
      console.warn('⚠️ No programs provided to scoreProgramsEnhanced. Programs must be provided by caller.');
      return [];
    }
    
    const filteredPrograms = preFilteredPrograms;
    
    console.log('🔍 Debug: Sample program from dataSource:', {
      id: filteredPrograms[0]?.id,
      hasDecisionTreeQuestions: filteredPrograms[0]?.decision_tree_questions?.length || 0,
      hasEditorSections: filteredPrograms[0]?.editor_sections?.length || 0,
      hasReadinessCriteria: filteredPrograms[0]?.readiness_criteria?.length || 0
    });
    let finalFilteredPrograms = filteredPrograms;
    console.log('🔍 Debug: Using major-filtered programs for scoring:', finalFilteredPrograms.length);
    
    const normalizedPrograms: Program[] = finalFilteredPrograms.map((p) => {
      const matchSummary = (p as any).__matchSummary;
      const normalized: Program = {
        id: p.id,
        name: p.name || p.id,
        type: p.type || "program",
        program_type: p.program_type || p.type || "grant",
        program_category: p.program_category || "general",
        requirements: p.requirements || {},
        notes: p.notes,
        maxAmount: p.maxAmount,
        link: p.link,
        // Add enhanced fields for scoring
        target_personas: p.target_personas || [],
        tags: p.tags || [],
        decision_tree_questions: p.decision_tree_questions || [],
        editor_sections: p.editor_sections || [],
        readiness_criteria: p.readiness_criteria || [],
        ai_guidance: p.ai_guidance || null,
        // Include categorized requirements from Layer 1&2
        categorized_requirements: p.categorized_requirements || undefined
      };

      if (matchSummary) {
        Object.defineProperty(normalized as any, '__matchSummary', {
          value: matchSummary,
          enumerable: false,
          configurable: true,
          writable: true
        });
      }

      return normalized;
    });

    console.log('🔍 EnhancedRecoEngine: Processing', normalizedPrograms.length, 'programs');
    console.log('🔍 EnhancedRecoEngine: User answers:', Object.keys(userAnswers).map(k => `${k}=${userAnswers[k]}`).join(', '));
    console.log('🔍 EnhancedRecoEngine: Derived signals:', {
      fundingMode: derivedSignals.fundingMode,
      companyAgeBucket: derivedSignals.companyAgeBucket,
      sectorBucket: derivedSignals.sectorBucket,
      trlBucket: derivedSignals.trlBucket
    });
    
    if (normalizedPrograms.length === 0) {
      console.warn('⚠️ EnhancedRecoEngine: No programs to score!');
      return [];
    }
    
    console.log('🔍 EnhancedRecoEngine: Sample program structure:', {
      id: normalizedPrograms[0].id,
      name: normalizedPrograms[0].name,
      hasCategorizedRequirements: !!normalizedPrograms[0].categorized_requirements,
      categorizedKeys: normalizedPrograms[0].categorized_requirements ? Object.keys(normalizedPrograms[0].categorized_requirements) : [],
      hasEligibilityCriteria: !!(normalizedPrograms[0] as any).eligibility_criteria
    });

    // Using LLM for cross-checking and scoring
    console.log(`📊 Using LLM for cross-checking requirements`);

    const scoredPrograms = await Promise.all(normalizedPrograms.map(async (program): Promise<EnhancedProgramResult> => {
      let score = 0;
      const matchedCriteria: Array<{
        key: string;
        value: any;
        reason: string;
        status: 'passed' | 'warning' | 'failed';
      }> = [];
      const gaps: Array<{
        key: string;
        description: string;
        action: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];
      const matchSummary = ((program as any).__matchSummary || {}) as Record<string, MatchStatus>;
      const unknownKeys: string[] = [];
      const matchedKeysFromSummary: string[] = [];

      if (matchSummary) {
        for (const [summaryKey, status] of Object.entries(matchSummary)) {
          if (status === 'unknown') {
            unknownKeys.push(summaryKey);
          } else if (status === 'match') {
            matchedKeysFromSummary.push(summaryKey);
          }
        }
      }

      // Score based on program-specific decision tree questions
      if (program.decision_tree_questions && program.decision_tree_questions.length > 0) {
        const programSpecificScore = scoreProgramSpecificQuestions(program.decision_tree_questions, answers);
        score += programSpecificScore.score;
        matchedCriteria.push(...programSpecificScore.matchedCriteria);
        gaps.push(...programSpecificScore.gaps);
      }

      // Score based on GPT-enhanced fields (handle both formats)
      if (program.target_personas && program.target_personas.length > 0) {
        const stageBucket = getCompanyStage(userAnswers);
        const sizeBucket = getTeamSizeBucket(userAnswers);
        
        if ((stageBucket === 'pre_company' || stageBucket === 'inc_lt_6m') &&
            program.target_personas.includes('startup')) {
          score += 30;
          matchedCriteria.push({
            key: 'target_personas',
            value: 'startup',
            reason: 'Program targets startup companies',
            status: 'passed'
          });
        }
        if ((sizeBucket === 'micro_0_9' || sizeBucket === 'small_10_49') &&
            program.target_personas.includes('sme')) {
          score += 20;
          matchedCriteria.push({
            key: 'target_personas',
            value: 'sme',
            reason: 'Program targets small/medium enterprises',
            status: 'passed'
          });
        }
      }

      // Score based on tags
      if (program.tags && program.tags.length > 0) {
        if (hasTheme(userAnswers, 'digital') && program.tags.includes('innovation')) {
          score += 25;
          matchedCriteria.push({
            key: 'tags',
            value: 'innovation',
            reason: 'Program focuses on innovation',
            status: 'passed'
          });
        }
        if (program.tags.includes('non-dilutive')) {
          score += 15;
          matchedCriteria.push({
            key: 'tags',
            value: 'non-dilutive',
            reason: 'Non-dilutive funding available',
            status: 'passed'
          });
        }
      }

      // Location matching (new format)
      const location = getPrimaryLocation(userAnswers);
      if (location === 'austria' || userAnswers.q1_country === 'AT' || userAnswers.q1_location === 'AUSTRIA') {
        const categorized = (program as any).categorized_requirements;
        if (categorized?.geographic) {
          const hasAustria = categorized.geographic.some((r: any) => 
            r.type === 'location' && String(r.value).toLowerCase().includes('austria')
          );
          if (hasAustria) {
            score += 20;
            matchedCriteria.push({
              key: 'location',
              value: 'Austria',
              reason: 'Austrian program',
              status: 'passed'
            });
          }
        }
      }

      // If no requirements, give a base score based on program type
      if (Object.keys(program.requirements || {}).length === 0) {
        const baseScores = {
          'grant': 60,
          'loan': 50,
          'equity': 40,
          'mixed': 55,
          'visa': 30,
          'incubator': 45
        };
        score = baseScores[program.type as keyof typeof baseScores] || 50;
      } else {
        // Evaluate each requirement
        for (const [key, requirement] of Object.entries(program.requirements || {})) {
        const answer = userAnswers[key];

        if (answer === undefined || answer === null || answer === "") {
          if (mode === "strict") {
            gaps.push({
              key,
              description: `${key} is missing`,
              action: `Provide answer for ${key}`,
              priority: 'high'
            });
          }
          continue;
        }

        let passed = false;
        let reason = '';
        let status: 'passed' | 'warning' | 'failed' = 'failed';

        // Handle overlay conditions (string format like "answers.q1_country in ['AT','EU']")
        if (typeof requirement === "string" && requirement.includes("answers.")) {
          const result = evaluateOverlayCondition(requirement, userAnswers);
          passed = result.passed;
          reason = result.reason;
          status = result.status;
        } else if (Array.isArray(requirement)) {
          if (requirement.includes(answer)) {
            passed = true;
            reason = `${key} matches requirement (${answer})`;
            status = 'passed';
          } else {
            reason = `${key} does not match requirement (${answer})`;
            status = 'failed';
          }
        } else if (typeof requirement === "number") {
          if (answer <= requirement) {
            passed = true;
            reason = `${key} within limit (${answer} <= ${requirement})`;
            status = 'passed';
          } else {
            reason = `${key} exceeds limit (${answer} > ${requirement})`;
            status = 'failed';
          }
        } else if (typeof requirement === "object" && requirement !== null && 'min' in requirement) {
          const reqWithMin = requirement as { min: number };
          if (answer >= reqWithMin.min) {
            passed = true;
            reason = `${key} meets minimum (${answer} >= ${reqWithMin.min})`;
            status = 'passed';
          } else {
            reason = `${key} below minimum (${answer} < ${reqWithMin.min})`;
            status = 'failed';
          }
        } else if (typeof requirement === "object" && requirement !== null && 'max' in requirement) {
          const reqWithMax = requirement as { max: number };
          if (answer <= reqWithMax.max) {
            passed = true;
            reason = `${key} within maximum (${answer} <= ${reqWithMax.max})`;
            status = 'passed';
          } else {
            reason = `${key} exceeds maximum (${answer} > ${reqWithMax.max})`;
            status = 'failed';
          }
        } else {
          if (answer === requirement) {
            passed = true;
            reason = `${key} matches exactly (${answer})`;
            status = 'passed';
          } else {
            reason = `${key} does not match (${answer} vs ${requirement})`;
            status = 'failed';
          }
        }

        // Add to matched criteria
        matchedCriteria.push({
          key,
          value: answer,
          reason,
          status
        });

        // Add to gaps if failed
        if (!passed) {
          gaps.push({
            key,
            description: reason,
            action: getGapAction(key, requirement, answer),
            priority: getGapPriority(key, requirement)
          });
        }

          if (passed) {
            score += 1;
          }
        }
      }

      // Use LLM for cross-checking (no complex matching needed)
      // Scoring will be done in second pass using LLM's matches/gaps
      // For now, use a simple placeholder score (will be replaced by LLM)
      let scorePercent = 50; // Placeholder, LLM will calculate actual score
      
      // Small bonus ONLY for perfect matches (all requirements met, no gaps)
      // Reduced from 20 to 5 points, only when truly perfect
      if (gaps.length === 0 && matchedCriteria.length >= 3) {
        scorePercent = Math.min(100, scorePercent + 5); // Small bonus for perfect matches
        console.log(`✨ Perfect match bonus applied: +5 points`);
      }
      
      // If score is still 0, check if we have any requirements to score
      if (scorePercent === 0) {
        const totalRequirements = Object.keys(program.requirements || {}).length;
        const hasCategorizedReqs = program.categorized_requirements && 
          Object.keys(program.categorized_requirements).length > 0;
        
        // If no requirements at all, give minimal score (program might be for everyone)
        if (totalRequirements === 0 && !hasCategorizedReqs) {
          scorePercent = 50; // Neutral score for programs with no specific requirements
          console.log(`⚠️ Program ${program.id} has no requirements - assigning neutral score`);
        }
      }

      const eligibility =
        mode === "strict"
          ? gaps.length === 0
            ? "Eligible"
            : "Not Eligible"
          : scorePercent > 0
          ? "Eligible"
          : "Not Eligible";

      let confidence: "High" | "Medium" | "Low" = "Low";
      if (scorePercent >= 80) confidence = "High";
      else if (scorePercent >= 50) confidence = "Medium";

      const reason = generateEnhancedReason(program, matchedCriteria, gaps, scorePercent);
      const founderFriendlyReasons = await generateFounderFriendlyReasons(program, userAnswers, matchedCriteria, gaps, scorePercent);
      const founderFriendlyRisks = generateFounderFriendlyRisks(gaps);

      // Generate eligibility trace
      const trace = generateEligibilityTrace(program, matchedCriteria, gaps, derivedSignals);
      
      console.log(`🔍 EnhancedRecoEngine: Program ${program.id} - Final Score: ${scorePercent}, Matched: ${matchedCriteria.length}, Gaps: ${gaps.length}, Eligibility: ${eligibility}`);

      // Validate scoring consistency
      const consistency = validateScoringConsistency(program.id, answers, scorePercent);
      if (!consistency.consistent) {
        console.warn(`⚠️ Scoring inconsistency for ${program.id}: previous=${consistency.previousScore}%, current=${scorePercent}%`);
      }

      const historicalSuccess = getProgramSuccessRate(program);
      const successEstimate = estimateSuccessProbability({
        baseScore: scorePercent,
        matchedCriteria: matchedCriteria.length,
        totalCriteria: Math.max(1, matchedCriteria.length + gaps.length),
        gaps: gaps.length,
        programType: program.type,
        historicalRate: historicalSuccess
      });

      // Log warnings for low scores
      if (scorePercent < 30 && matchedCriteria.length === 0) {
        console.warn(`⚠️ EnhancedRecoEngine: Program ${program.id} has very low score (${scorePercent}) with no matched criteria`);
      }
      
      // Validation: Ensure score is within bounds and normalized
      if (scorePercent < 0 || scorePercent > 100) {
        console.error(`❌ Invalid score for ${program.id}: ${scorePercent}% (should be 0-100)`);
        scorePercent = Math.max(0, Math.min(100, scorePercent));
      }

      if (unknownKeys.length > 0) {
        for (const key of unknownKeys) {
          const alreadyIncluded = gaps.some(
            (gap) => gap.key === key && gap.description.toLowerCase().includes('not specified')
          );
          if (!alreadyIncluded) {
            const humanLabel = key.replace(/_/g, ' ');
            gaps.push({
              key,
              description: `Program does not specify ${humanLabel} requirements`,
              action: 'Review manually or confirm details with the provider',
              priority: 'low'
            });
          }
        }
      }

      // Get enhanced explanation (will be enhanced in second pass after all programs scored)
      // For now, just get basic reasons
      let enhancedFields: { strategicAdvice?: string; applicationInfo?: string; riskMitigation?: string } = {};

      return {
        ...program,
        score: scorePercent,
        reason,
        eligibility,
        confidence,
        matchedCriteria,
        gaps: gaps.slice(0, 3), // Limit to top 3 gaps
        amount: getProgramAmount(program),
        timeline: getProgramTimeline(program.type),
        successRate: successEstimate.probability,
        successConfidence: successEstimate.confidence,
        successFactors: successEstimate.factors,
        llmFailed: false, // This is rule-based, not LLM
        fallbackReason: reason,
        fallbackGaps: gaps.map(g => g.description),
        founderFriendlyReasons,
        founderFriendlyRisks,
        trace,
        matchSummary: Object.keys(matchSummary || {}).length > 0 ? matchSummary : undefined,
        unknownCriteria: unknownKeys,
        ...enhancedFields // Will be populated in second pass if needed
      };
    }));
    
    // Sort by score
    const sortedPrograms = scoredPrograms.sort((a: EnhancedProgramResult, b: EnhancedProgramResult) => b.score - a.score);
    
    // Second pass: LLM cross-checks requirements and generates explanations
    const enhancedPrograms = await Promise.all(sortedPrograms.map(async (program) => {
      const useLLM = process.env.OPENAI_API_KEY || process.env.CUSTOM_LLM_ENDPOINT;
      if (useLLM) {
        try {
          const enhanced = await generateSmartExplanation(
            program,
            userAnswers,
            program.matchedCriteria || [],
            program.gaps || [],
            program.score,
            sortedPrograms // Pass all programs for strategic advice
          );
          
          // Use LLM's matches/gaps for scoring
          const llmMatchCount = enhanced.matches?.length || 0;
          const llmGapCount = enhanced.gaps?.length || 0;
          const total = llmMatchCount + llmGapCount;
          const llmScore = total > 0 ? Math.round((llmMatchCount / total) * 100) : program.score;
          
          // Convert LLM matches/gaps to matchedCriteria/gaps format
          const llmMatchedCriteria = enhanced.matches?.map(m => ({
            key: 'llm_match',
            value: m,
            reason: m,
            status: 'passed' as const
          })) || program.matchedCriteria || [];
          
          const llmGaps = enhanced.gaps?.map(g => ({
            key: 'llm_gap',
            description: g,
            action: 'Review requirement',
            priority: 'high' as const
          })) || program.gaps || [];
          
          return {
            ...program,
            score: llmScore, // Use LLM's score
            matchedCriteria: llmMatchedCriteria, // Use LLM's matches
            gaps: llmGaps, // Use LLM's gaps
            founderFriendlyReasons: enhanced.reasons,
            strategicAdvice: enhanced.strategicAdvice,
            applicationInfo: enhanced.applicationInfo,
            riskMitigation: enhanced.riskMitigation,
          };
        } catch (error) {
          console.warn('LLM explanation failed, using fallback:', error);
          // Fallback: use existing program data
          return program;
        }
      }
      return program;
    }));
    
    return enhancedPrograms;
    } catch (error) {
      console.error('❌ Enhanced recommendation engine failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        answersCount: Object.keys(answers).length,
        answers: Object.keys(answers)
      });
      
      // Simplified fallback: just return empty array
      // Programs should always be provided by caller, so if scoring fails, return empty
      console.warn('⚠️ Scoring failed, returning empty results. Check program data and answers format.');
      return [];
    }
  }

// Removed scoreProgramsFallback - simplified error handling (just return empty array)

// Generate enhanced reason with detailed explanations
function generateEnhancedReason(
  program: Program,
  matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>,
  gaps: Array<{ key: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }>,
  score: number
): string {
  if (gaps.length === 0) {
    return `✅ You meet all requirements for ${program.name}. Strong fit with score ${score}%.`;
  }
  
  const passedCount = matchedCriteria.filter(c => c.status === 'passed').length;
  const failedCount = matchedCriteria.filter(c => c.status === 'failed').length;
  
  return `ℹ️ ${program.name} matches ${passedCount} requirement(s) but has ${failedCount} issue(s). Score: ${score}%`;
}

// Generate smart explanations using LLM (with rule-based fallback)
async function generateFounderFriendlyReasons(
  program: Program,
  userAnswers: UserAnswers,
  matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>,
  gaps: Array<{ key: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }>,
  score: number,
  allPrograms?: EnhancedProgramResult[] // NEW: For strategic advice
): Promise<string[]> {
  // Try LLM first if available
  const useLLM = process.env.OPENAI_API_KEY || process.env.CUSTOM_LLM_ENDPOINT;
  
  if (useLLM) {
    try {
      const smartExplanation = await generateSmartExplanation(program, userAnswers, matchedCriteria, gaps, score, allPrograms);
      return smartExplanation.reasons;
    } catch (error) {
      console.warn('LLM explanation failed, using fallback:', error);
      // Fall through to rule-based
    }
  }
  
  // Rule-based fallback (simplified)
  return generateRuleBasedReasons(matchedCriteria);
}

// LLM-powered smart explanation generator
async function generateSmartExplanation(
  program: Program,
  userAnswers: UserAnswers,
  _matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>, // Unused - LLM does cross-checking
  _gaps: Array<{ key: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }>, // Unused - LLM identifies gaps
  _score: number, // Unused - LLM calculates score from matches/gaps
  allPrograms?: EnhancedProgramResult[] // For strategic advice
): Promise<{ 
  reasons: string[];
  matches?: string[]; // What matches (from LLM cross-checking)
  gaps?: string[]; // What's missing (from LLM cross-checking)
  strategicAdvice?: string; // NEW: One sentence, optional
  applicationInfo?: string; // NEW: One sentence, optional
  riskMitigation?: string; // NEW: One sentence, optional
}> {
  // Summarize context for LLM (token-optimized)
  const userProfile = summarizeUserProfile(userAnswers);
  const programSummary = summarizeProgram(program);
  
  // Get program requirements - only send relevant categories (token optimization)
  const categorizedRequirements = program.categorized_requirements || {};
  const relevantCategories = ['geographic', 'eligibility', 'financial', 'project', 'funding_details'];
  const filteredRequirements: any = {};
  relevantCategories.forEach(cat => {
    if (categorizedRequirements[cat] && Array.isArray(categorizedRequirements[cat])) {
      // Only include first 3 items per category to save tokens
      filteredRequirements[cat] = categorizedRequirements[cat].slice(0, 3).map((item: any) => ({
        type: item.type,
        value: item.value
      }));
    }
  });
  const programRequirements = JSON.stringify(filteredRequirements);

  // Ultra-concise prompts to reduce token usage
  const systemPrompt = `Funding advisor. Cross-check user vs program. Return JSON only.`;

  const hasOtherPrograms = allPrograms && allPrograms.length > 1;
  const otherProgramsList = hasOtherPrograms 
    ? allPrograms.slice(0, 2).map(p => p.name).join(', ') // Reduced from 3 to 2
    : '';

  // Simplified prompt - minimal tokens
  const userPrompt = `U: ${userProfile}
P: ${programSummary}
R: ${programRequirements}
${hasOtherPrograms ? `Others: ${otherProgramsList}` : ''}

Return JSON:
{
  "reasons": ["match1", "match2"],
  "matches": ["match1", "match2"],
  "gaps": ["gap1"],
  "strategic_advice": "1 sentence or null",
  "application_info": "1 sentence or null",
  "risk_mitigation": "1 sentence or null"
}`;

  // Try custom LLM first (using helper function for proper Gemini/OpenAI-compatible format)
  if (process.env.CUSTOM_LLM_ENDPOINT) {
    try {
      const { callCustomLLM } = await import('../../../shared/lib/ai/customLLM');
      const customResponse = await callCustomLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        responseFormat: 'json',
        maxTokens: 1500, // Reduced from 2000 - simpler prompts need fewer tokens
        temperature: 0.7,
      });
      
      const content = customResponse.output || '{}';
      console.log('✅ Custom LLM response received, length:', content.length);
      
      try {
        const parsed = JSON.parse(content);
        console.log('✅ Custom LLM JSON parsed successfully');
        console.log('   - Has reasons:', !!parsed.reasons);
        console.log('   - Has matches:', !!parsed.matches);
        console.log('   - Has gaps:', !!parsed.gaps);
        
        // Handle reasons as string or array
        let reasons: string[] = [];
        if (Array.isArray(parsed.reasons)) {
          reasons = parsed.reasons;
        } else if (typeof parsed.reasons === 'string') {
          reasons = [parsed.reasons];
        }
        
        if (reasons.length > 0) {
          console.log('✅ Custom LLM returned valid response with', reasons.length, 'reasons');
          return { 
            reasons: reasons.slice(0, 3),
            matches: parsed.matches && Array.isArray(parsed.matches) ? parsed.matches : undefined,
            gaps: parsed.gaps && Array.isArray(parsed.gaps) ? parsed.gaps : undefined,
            strategicAdvice: parsed.strategic_advice || parsed.strategicAdvice || null,
            applicationInfo: parsed.application_info || parsed.applicationInfo || null,
            riskMitigation: parsed.risk_mitigation || parsed.riskMitigation || null
          };
        } else {
          console.warn('⚠️ Custom LLM response missing reasons:', Object.keys(parsed));
        }
      } catch (parseError: any) {
        console.warn('⚠️ Failed to parse Custom LLM JSON:', parseError.message);
        console.warn('   Response preview:', content.substring(0, 500));
        
        // If MAX_TOKENS, return minimal explanation
        if (content.includes('MAX_TOKENS') || content.includes('finishReason')) {
          console.warn('⚠️ MAX_TOKENS reached, using minimal fallback');
          return {
            reasons: [`This program matches your ${userAnswers.location || 'location'} and ${userAnswers.company_type || 'company type'}.`],
            matches: [`Location: ${userAnswers.location || 'matches'}`],
            gaps: [],
            strategicAdvice: undefined,
            applicationInfo: undefined,
            riskMitigation: undefined
          };
        }
      }
      
      // If we got here, the response didn't have the expected format
      // Log the actual response structure for debugging
      if (content && content.length > 0) {
        console.warn('⚠️ Custom LLM response structure unexpected. Full response:', content);
        
        // Try to extract any useful info from partial response
        try {
          const partialMatch = content.match(/"reasons"\s*:\s*\[([^\]]+)\]|"matches"\s*:\s*\[([^\]]+)\]/);
          if (partialMatch) {
            console.warn('⚠️ Extracted partial response, using minimal fallback');
            return {
              reasons: [`This program matches your profile.`],
              matches: [],
              gaps: [],
              strategicAdvice: undefined,
              applicationInfo: undefined,
              riskMitigation: undefined
            };
          }
        } catch {}
      }
    } catch (error: any) {
      console.warn('Custom LLM failed:', error?.message || error);
      console.warn('Custom LLM error details:', {
        status: error?.status,
        code: error?.code,
        type: error?.type
      });
      
      // Return minimal fallback on error
      return {
        reasons: [`This program matches your ${userAnswers.location || 'location'} and ${userAnswers.company_type || 'company type'}.`],
        matches: [],
        gaps: [],
        strategicAdvice: undefined,
        applicationInfo: undefined,
        riskMitigation: undefined
      };
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    if (parsed.reasons && Array.isArray(parsed.reasons)) {
      return { 
        reasons: parsed.reasons.slice(0, 3),
        matches: parsed.matches && Array.isArray(parsed.matches) ? parsed.matches : undefined,
        gaps: parsed.gaps && Array.isArray(parsed.gaps) ? parsed.gaps : undefined,
        strategicAdvice: parsed.strategic_advice || parsed.strategicAdvice || null,
        applicationInfo: parsed.application_info || parsed.applicationInfo || null,
        riskMitigation: parsed.risk_mitigation || parsed.riskMitigation || null
      };
    }
  }

  throw new Error('No LLM response');
}

// Simplified rule-based fallback with weight references
function generateRuleBasedReasons(
  matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>
): string[] {
  const reasons: string[] = [];
  const passedCriteria = matchedCriteria.filter(c => c.status === 'passed');
  
  // Map criteria keys to question weights for explanations
  const getWeightForKey = (key: string): number => {
    if (key.includes('location') || key.includes('country') || key.includes('geographic')) {
      return getQuestionWeight('location');
    } else if (key.includes('company_type') || key.includes('entity') || key.includes('eligibility')) {
      return getQuestionWeight('company_type');
    } else if (key.includes('funding') || key.includes('financial')) {
      return getQuestionWeight('funding_amount');
    } else if (key.includes('industry') || key.includes('theme') || key.includes('project')) {
      return getQuestionWeight('industry_focus');
    } else if (key.includes('impact')) {
      return getQuestionWeight('impact');
    } else if (key.includes('stage') || key.includes('team')) {
      return getQuestionWeight('company_stage');
    } else if (key.includes('co_financing')) {
      return getQuestionWeight('co_financing');
    }
    return 0;
  };
  
  // Sort by weight (most important first)
  const sortedCriteria = [...passedCriteria].sort((a, b) => {
    const weightA = getWeightForKey(a.key);
    const weightB = getWeightForKey(b.key);
    return weightB - weightA;
  });
  
  // Generate reasons with weight references
  for (const criteria of sortedCriteria.slice(0, 3)) {
    const weight = getWeightForKey(criteria.key);
    const weightText = weight > 0 ? ` (${weight}% of match score)` : '';
    
    if (criteria.key.includes('location') || criteria.key.includes('country') || criteria.key.includes('geographic')) {
      reasons.push(`Location match${weightText}: Your location matches this program's geographic requirements`);
    } else if (criteria.key.includes('company_type') || criteria.key.includes('entity') || criteria.key.includes('eligibility')) {
      reasons.push(`Company type match${weightText}: Your company type qualifies for this program`);
    } else if (criteria.key.includes('funding') || criteria.key.includes('financial')) {
      reasons.push(`Funding amount match${weightText}: The funding amount aligns with what this program offers`);
    } else if (criteria.key.includes('industry') || criteria.key.includes('theme') || criteria.key.includes('project')) {
      reasons.push(`Industry focus match${weightText}: Your industry focus matches this program's target sectors`);
    } else if (criteria.key.includes('impact')) {
      reasons.push(`Impact alignment${weightText}: Your project impact aligns with this program's goals`);
    } else {
      reasons.push(`Requirement match${weightText}: ${criteria.reason}`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('This program matches several of your key requirements');
  }

  return reasons.slice(0, 3);
}

// Helper functions for LLM context
function summarizeUserProfile(answers: UserAnswers): string {
  const parts: string[] = [];
  if (answers.location || answers.q1_country) parts.push(`Location: ${answers.location || answers.q1_country}`);
  if (answers.company_type || answers.q2_entity_stage) parts.push(`Type: ${answers.company_type || answers.q2_entity_stage}`);
  if (answers.funding_amount || answers.q8_funding_types) parts.push(`Funding: ${answers.funding_amount || answers.q8_funding_types}`);
  if (answers.industry_focus || answers.q4_theme) {
    const industry = answers.industry_focus || answers.q4_theme;
    parts.push(`Industry: ${Array.isArray(industry) ? industry.join(', ') : industry}`);
  }
  return parts.join(', ') || 'Early-stage company';
}

function summarizeProgram(program: Program): string {
  const parts: string[] = [];
  parts.push(`Name: ${program.name || 'Funding Program'}`);
  if (program.requirements?.location) {
    const loc = program.requirements.location;
    parts.push(`Location: ${Array.isArray(loc) ? loc.join(', ') : loc}`);
  }
  if (program.requirements?.companyType) {
    const type = program.requirements.companyType;
    parts.push(`Company Type: ${Array.isArray(type) ? type.join(', ') : type}`);
  }
  if (program.requirements?.fundingAmount) {
    const funding = program.requirements.fundingAmount;
    if (typeof funding === 'object' && funding.min && funding.max) {
      parts.push(`Funding: €${funding.min.toLocaleString()}-€${funding.max.toLocaleString()}`);
    } else {
      parts.push(`Funding: ${funding}`);
    }
  }
  return parts.join(', ');
}

// Generate founder-friendly risk explanations
function generateFounderFriendlyRisks(
  gaps: Array<{ key: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }>
): string[] {
  const risks: string[] = [];
  
  // Map technical gaps to founder-friendly risks
  const riskMapping: Record<string, string> = {
    'q1_country': 'You may need to relocate your project to Austria or the EU to qualify',
    'q4_theme': 'Your project theme might not align with this program\'s focus areas',
    'q8_funding_types': 'This program may not offer the funding type you\'re looking for',
    'q2_entity_stage': 'Your company stage might not meet this program\'s requirements',
    'q3_company_size': 'Your company size may not fit this program\'s target audience',
    'q5_maturity_trl': 'Your technology maturity level might not match this program\'s requirements',
    'q6_rnd_in_at': 'You may need to conduct R&D activities in Austria to qualify',
    'q7_collaboration': 'This program may require specific collaboration arrangements',
    'q9_team_diversity': 'Your team structure might not meet this program\'s diversity requirements',
    'q10_env_benefit': 'Your project may not have the environmental impact this program requires'
  };

  // Generate risks from gaps
  for (const gap of gaps.slice(0, 1)) {
    const risk = riskMapping[gap.key] || 'There may be eligibility requirements you need to meet';
    risks.push(risk);
  }

  // Add generic risk if no specific gaps
  if (risks.length === 0) {
    risks.push('Verify all eligibility requirements before applying');
  }

  return risks;
}

// Get gap action based on requirement type
function getGapAction(key: string, _requirement: any, _answer: any): string {
  const gapActions: { [key: string]: string } = {
    'q1_country': 'Consider relocating project to Austria or EU',
    'q2_entity_stage': 'Wait for appropriate company stage or consider other programs',
    'q3_company_size': 'Consider programs for your company size or grow team',
    'q4_theme': 'Align project with program focus areas or find theme-specific programs',
    'q5_maturity_trl': 'Develop technology to required TRL level',
    'q6_rnd_in_at': 'Conduct R&D activities in Austria',
    'q7_collaboration': 'Find collaboration partners or consider solo programs',
    'q8_funding_types': 'Consider other funding types or find matching programs',
    'q9_team_diversity': 'Improve team diversity or find programs without diversity requirements',
    'q10_env_benefit': 'Enhance environmental impact or find non-environmental programs'
  };
  
  return gapActions[key] || `Address ${key} requirement to improve eligibility`;
}

// Get gap priority based on requirement type
function getGapPriority(key: string, _requirement: any): 'high' | 'medium' | 'low' {
  const highPriorityKeys = ['q1_country', 'q2_entity_stage', 'q8_funding_types'];
  const mediumPriorityKeys = ['q3_company_size', 'q4_theme', 'q5_maturity_trl', 'q6_rnd_in_at'];
  
  if (highPriorityKeys.includes(key)) return 'high';
  if (mediumPriorityKeys.includes(key)) return 'medium';
  return 'low';
}

// Get program amount information
function getProgramAmount(program: Program): { min: number; max: number; currency: string } {
  // This would typically come from program data
  const amounts: { [key: string]: { min: number; max: number; currency: string } } = {
    'grant': { min: 10000, max: 500000, currency: 'EUR' },
    'loan': { min: 50000, max: 1000000, currency: 'EUR' },
    'equity': { min: 100000, max: 2000000, currency: 'EUR' },
    'visa': { min: 0, max: 0, currency: 'EUR' },
    'incubator': { min: 0, max: 0, currency: 'EUR' }
  };
  
  return amounts[program.type] || { min: 0, max: 0, currency: 'EUR' };
}

// Get program timeline
function getProgramTimeline(type: string): string {
  const timelines: { [key: string]: string } = {
    'grant': '6-12 months application process',
    'loan': '2-4 weeks approval process',
    'mixed': '3-6 months application process',
    'equity': '3-9 months due diligence process',
    'visa': '2-6 months processing time',
    'incubator': '1-3 months application process'
  };
  
  return timelines[type] || 'Varies by program';
}

// Get program success rate
function getProgramSuccessRate(program: Program): number {
  // This would typically come from program data
  const successRates: { [key: string]: number } = {
    'grant': 0.25,
    'loan': 0.60,
    'equity': 0.20,
    'visa': 0.45,
    'incubator': 0.60
  };
  
  return successRates[program.type] || 0.30;
}

// Analyze free-text description and normalize into structured answers
export async function analyzeFreeTextEnhanced(description: string): Promise<{ normalized: UserAnswers; scored: EnhancedProgramResult[] }> {
  try {
    const normalized: UserAnswers = {};
    const lower = description.toLowerCase();

    // Basic sector detection
    if (lower.includes("bakery") || lower.includes("restaurant") || lower.includes("food")) {
      normalized["sector"] = "Food";
    } else if (lower.includes("tech") || lower.includes("software") || lower.includes("ai")) {
      normalized["sector"] = "Technology";
    } else if (lower.includes("manufacturing")) {
      normalized["sector"] = "Manufacturing";
    }

    // Basic funding type detection
    if (lower.includes("loan")) {
      normalized["purpose"] = "Loan";
    } else if (lower.includes("grant")) {
      normalized["purpose"] = "Grant";
    } else if (lower.includes("funding")) {
      normalized["purpose"] = "Funding";
    }

    // Basic stage detection
    if (lower.includes("startup") || lower.includes("new")) {
      normalized["stage"] = "Startup";
    } else if (lower.includes("established") || lower.includes("existing")) {
      normalized["stage"] = "Established";
    }

    // Note: analyzeFreeTextEnhanced requires programs to be provided by caller
    // This function only normalizes text - scoring must be done separately with programs
    console.warn('analyzeFreeTextEnhanced: Only normalizes text. Call scoreProgramsEnhanced separately with programs.');
    return { normalized, scored: [] };
  } catch (error) {
    console.error('Free text analysis failed:', error);
    return {
      normalized: {},
      scored: []
    };
  }
}

// Generate eligibility trace for a program
function generateEligibilityTrace(
  program: Program,
  matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>,
  gaps: Array<{ key: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }>,
  derivedSignals: DerivedSignals
): EligibilityTrace {
  const passed: string[] = [];
  const failed: string[] = [];
  const warnings: string[] = [];
  const counterfactuals: string[] = [];

  // Process matched criteria
  matchedCriteria.forEach(criteria => {
    if (criteria.status === 'passed') {
      passed.push(criteria.reason);
    } else if (criteria.status === 'failed') {
      failed.push(criteria.reason);
    } else if (criteria.status === 'warning') {
      warnings.push(criteria.reason);
    }
  });

  // Add unknowns to warnings with special icon
  derivedSignals.unknowns.forEach(unknown => {
    warnings.push(`⚪ Missing info: ${unknown} - ${getUnknownDescription(unknown)}`);
  });

  // Generate counterfactuals based on gaps and derived signals
  gaps.forEach(gap => {
    if (gap.priority === 'high') {
      counterfactuals.push(gap.action);
    }
  });

  // Add counterfactuals from derived signals
  derivedSignals.counterfactuals.forEach(counterfactual => {
    counterfactuals.push(counterfactual);
  });

  // Add funding mode specific counterfactuals
  if (program.type !== derivedSignals.fundingMode) {
    if (derivedSignals.fundingMode === 'equity' && program.type === 'grant') {
      counterfactuals.push('Consider equity funding programs instead');
    } else if (derivedSignals.fundingMode === 'loan' && program.type === 'grant') {
      counterfactuals.push('Consider loan programs for faster funding');
    } else if (derivedSignals.fundingMode === 'grant' && program.type === 'equity') {
      counterfactuals.push('Consider grant programs for non-dilutive funding');
    }
  }

  // Add sector-specific counterfactuals
  if (derivedSignals.sectorBucket !== 'general') {
    counterfactuals.push(`Look for ${derivedSignals.sectorBucket}-specific programs`);
  }

  // Add urgency-based counterfactuals
  if (derivedSignals.urgencyBucket === 'urgent') {
    counterfactuals.push('Consider programs with faster approval processes');
  }

  // Add stage-based counterfactuals
  if (derivedSignals.companyAgeBucket === 'pre') {
    counterfactuals.push('Consider pre-company or idea-stage programs');
  } else if (derivedSignals.companyAgeBucket === '0-3y') {
    counterfactuals.push('Consider early-stage startup programs');
  }

  // Add ESG-specific counterfactuals
  if (derivedSignals.esgFlag && program.type !== 'grant') {
    counterfactuals.push('Look for ESG-focused grant programs');
  }

  // Add regulatory-specific counterfactuals
  if (derivedSignals.regulatoryFlag && program.type !== 'grant') {
    counterfactuals.push('Consider regulatory-focused grant programs');
  }

  return {
    passed,
    failed,
    warnings,
    counterfactuals: counterfactuals.slice(0, 5) // Limit to top 5 counterfactuals
  };
}


// Evaluate overlay conditions like "answers.q1_country in ['AT','EU']"
function evaluateOverlayCondition(condition: string, answers: UserAnswers): {
  passed: boolean;
  reason: string;
  status: 'passed' | 'warning' | 'failed';
} {
  try {
    // Extract the question ID and value from the condition
    const match = condition.match(/answers\.(q\d+_\w+)\s+in\s+\[([^\]]+)\]/);
    if (match) {
      const questionId = match[1];
      const allowedValues = match[2].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const answer = answers[questionId];
      
      if (answer && allowedValues.includes(answer)) {
        return {
          passed: true,
          reason: `${questionId} matches requirement (${answer} in [${allowedValues.join(', ')}])`,
          status: 'passed'
        };
      } else {
        return {
          passed: false,
          reason: `${questionId} does not match requirement (${answer} not in [${allowedValues.join(', ')}])`,
          status: 'failed'
        };
      }
    }
    
    // Handle other condition formats
    if (condition.includes('===') || condition.includes('==')) {
      const match = condition.match(/answers\.(q\d+_\w+)\s*[=!]+\s*['"]([^'"]+)['"]/);
      if (match) {
        const questionId = match[1];
        const expectedValue = match[2];
        const answer = answers[questionId];
        
        if (answer === expectedValue) {
          return {
            passed: true,
            reason: `${questionId} matches requirement (${answer} === ${expectedValue})`,
            status: 'passed'
          };
        } else {
          return {
            passed: false,
            reason: `${questionId} does not match requirement (${answer} !== ${expectedValue})`,
            status: 'failed'
          };
        }
      }
    }
    
    // Default fallback
    return {
      passed: false,
      reason: `Could not evaluate condition: ${condition}`,
      status: 'failed'
    };
  } catch (error) {
    return {
      passed: false,
      reason: `Error evaluating condition: ${condition}`,
      status: 'failed'
    };
  }
}

// Helper function to describe unknown variables
function getUnknownDescription(unknown: string): string {
  const descriptions: Record<string, string> = {
    'q1_country': 'Country/location information',
    'q2_entity_stage': 'Company stage information',
    'q3_company_size': 'Team size information',
    'q4_theme': 'Project theme information',
    'q5_maturity_trl': 'Technology readiness level',
    'q6_rnd_in_at': 'R&D location information',
    'q7_collaboration': 'Collaboration preferences',
    'q8_funding_types': 'Funding type preferences',
    'q9_team_diversity': 'Team diversity information',
    'q10_env_benefit': 'Environmental benefit information'
  };
  return descriptions[unknown] || 'Unknown variable';
}

// Score program-specific decision tree questions
function scoreProgramSpecificQuestions(
  decisionTreeQuestions: any[],
  answers: UserAnswers
): {
  score: number;
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
} {
  let score = 0;
  const matchedCriteria: Array<{
    key: string;
    value: any;
    reason: string;
    status: 'passed' | 'warning' | 'failed';
  }> = [];
  const gaps: Array<{
    key: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  for (const question of decisionTreeQuestions) {
    const questionId = question.id;
    const userAnswer = answers[questionId];
    
    if (!userAnswer) {
      // User hasn't answered this program-specific question
      gaps.push({
        key: questionId,
        description: `Program requires: ${question.question}`,
        action: `Answer the question: ${question.question}`,
        priority: question.required ? 'high' : 'medium'
      });
      continue;
    }

    // Score based on question type
    if (question.type === 'single') {
      const option = question.options?.find((opt: any) => opt.value === userAnswer);
      if (option) {
        score += 25; // High weight for program-specific questions
        matchedCriteria.push({
          key: questionId,
          value: userAnswer,
          reason: `Program-specific requirement met: ${question.question}`,
          status: 'passed'
        });
      }
    } else if (question.type === 'range') {
      const userAmount = parseInt(userAnswer);
      const minAmount = question.min || 0;
      const maxAmount = question.max || Infinity;
      
      if (userAmount >= minAmount && userAmount <= maxAmount) {
        score += 30; // Higher weight for funding amount matching
        matchedCriteria.push({
          key: questionId,
          value: userAnswer,
          reason: `Funding amount fits program range (€${minAmount.toLocaleString()} - €${maxAmount.toLocaleString()})`,
          status: 'passed'
        });
      } else if (userAmount < minAmount) {
        score += 10; // Partial credit for being close
        matchedCriteria.push({
          key: questionId,
          value: userAnswer,
          reason: `Funding amount below program minimum (€${minAmount.toLocaleString()})`,
          status: 'warning'
        });
        gaps.push({
          key: questionId,
          description: `Increase funding request to at least €${minAmount.toLocaleString()}`,
          action: `Adjust funding amount to meet program minimum`,
          priority: 'medium'
        });
      } else {
        gaps.push({
          key: questionId,
          description: `Funding amount exceeds program maximum (€${maxAmount.toLocaleString()})`,
          action: `Reduce funding request or find alternative programs`,
          priority: 'high'
        });
      }
    } else if (question.type === 'multiple') {
      const userSelections = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const validOptions = question.options?.map((opt: any) => opt.value) || [];
      const validSelections = userSelections.filter(sel => validOptions.includes(sel));
      
      if (validSelections.length > 0) {
        score += 20;
        matchedCriteria.push({
          key: questionId,
          value: userAnswer,
          reason: `Program-specific selections match: ${validSelections.join(', ')}`,
          status: 'passed'
        });
      }
    }
  }

  return { score, matchedCriteria, gaps };
}

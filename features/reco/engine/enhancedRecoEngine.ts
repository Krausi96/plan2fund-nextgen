// Removed static JSON import - using database instead
import { Program, ScoredProgram, ProgramType } from '@/shared/types/requirements';
import { UserAnswers } from "@/shared/lib/schemas";
import { estimateSuccessProbability, ConfidenceLevel } from '@/shared/lib/mlModels';
import type { MatchStatus } from './questionEngine';
// Removed doctorDiagnostic - filtering handled by QuestionEngine

// Eligibility trace interface
export interface EligibilityTrace {
  passed: string[];
  failed: string[];
  warnings: string[];
  counterfactuals: string[];
}

// Enhanced program result with detailed explanations
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

  const revenueStatus =
    normalizeRevenueStatusValue(enriched.revenue_status) ||
    normalizeRevenueStatusValue(enriched.revenue) ||
    normalizeRevenueStatusValue(enriched.current_revenue);
  if (revenueStatus) {
    enriched.revenue_status = revenueStatus;
  }

  const coFinancingChoice =
    normalizeCoFinancingValue(enriched.co_financing) ||
    normalizeCoFinancingValue(enriched.co_financing_status) ||
    normalizeCoFinancingValue(enriched.co_financing_required);
  if (coFinancingChoice) {
    enriched.co_financing = coFinancingChoice;
  }

  if (enriched.industry_focus) {
    const industries = Array.isArray(enriched.industry_focus)
      ? enriched.industry_focus
      : [enriched.industry_focus];
    enriched.industry_focus = industries
      .map((item: any) => normalizeIndustryValue(item))
      .filter(Boolean);
  }

  if (!enriched.industry_focus && enriched.strategic_focus) {
    const focuses = Array.isArray(enriched.strategic_focus)
      ? enriched.strategic_focus
      : [enriched.strategic_focus];
    enriched.industry_focus = focuses
      .map((item: any) => normalizeIndustryValue(item))
      .filter(Boolean);
  }

  if (enriched.industry_focus) {
    enriched.industry_focus = Array.from(new Set(enriched.industry_focus));
  }

  if (enriched.strategic_focus) {
    const normalizedStrategic = (Array.isArray(enriched.strategic_focus)
      ? enriched.strategic_focus
      : [enriched.strategic_focus]
    )
      .map((item: any) => normalizeIndustryValue(item))
      .filter(Boolean);
    if (normalizedStrategic.length > 0) {
      enriched.strategic_focus = Array.from(new Set(normalizedStrategic));
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
  amountFit: number;
  stageFit: number;
  timelineFit: number;
  fundingMode: string;
  // New derived signals for richer persona coverage
  trlBucket: "low" | "mid" | "high";
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
  const revenueStatus = normalizeRevenueStatusValue(answers.revenue_status || answers.revenue);
  const coStatus = normalizeCoFinancingValue(answers.co_financing);
  const industryFocusRaw = Array.isArray(answers.industry_focus)
    ? answers.industry_focus
    : answers.industry_focus
    ? [answers.industry_focus]
    : [];
  const industryFocus = industryFocusRaw
    .map((item: any) => normalizeIndustryValue(item))
    .filter(Boolean);

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
    amountFit: 0,
    stageFit: 0,
    timelineFit: 0,
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

  signals.amountFit = calculateAmountFit(answers, signals);
  signals.stageFit = calculateStageFit(answers, signals);
  signals.timelineFit = calculateTimelineFit(answers, signals);

  return signals;
}

// Helper functions for fit calculations
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

// Calculate requirement frequencies from all programs (for dynamic scoring)
function calculateRequirementFrequencies(allPrograms: Program[]): Map<string, number> {
  const frequencyMap = new Map<string, number>();
  let totalPrograms = 0;

  for (const program of allPrograms) {
    const categorized = (program as any).categorized_requirements;
    if (!categorized || typeof categorized !== 'object') continue;
    
    totalPrograms++;
    
    // For each category and type combination
    for (const [category, items] of Object.entries(categorized)) {
      if (!Array.isArray(items)) continue;
      
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        
        const reqType = item.type || 'unknown';
        const key = `${category}:${reqType}`;
        frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
      }
    }
  }
  
  // Convert to frequencies (0-1)
  const frequencies = new Map<string, number>();
  frequencyMap.forEach((count, key) => {
    frequencies.set(key, count / totalPrograms);
  });
  
  return frequencies;
}

// Normalization functions - SAME as QuestionEngine for consistency
// These ensure scoring matches filtering logic exactly
function normalizeLocationValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (str.includes('austria') || str.includes('österreich') || str === 'at') return 'austria';
  if (str.includes('germany') || str.includes('deutschland') || str === 'de') return 'germany';
  if (str.includes('eu') || str.includes('europe') || str.includes('european')) return 'eu';
  return 'international';
}

function normalizeCompanyTypeValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (str.includes('startup') || str.includes('start-up') || str.includes('new venture')) return 'startup';
  if (str.includes('sme') || str.includes('small') || str.includes('medium') || str.includes('mittelstand')) return 'sme';
  if (str.includes('large') || str.includes('enterprise')) return 'large';
  if (str.includes('research') || str.includes('university') || str.includes('academic')) return 'research';
  return null;
}

function normalizeFundingAmountValue(value: any): string | null {
  if (typeof value === 'number') {
    if (value < 100000) return 'under100k';
    if (value < 500000) return '100kto500k';
    if (value < 2000000) return '500kto2m';
    return 'over2m';
  }
  const str = String(value || '').toLowerCase();
  if (str.includes('under') || str.includes('<') || str.includes('less')) return 'under100k';
  if (str.includes('100') && str.includes('500')) return '100kto500k';
  if (str.includes('500') && str.includes('2000')) return '500kto2m';
  if (str.includes('over') || str.includes('>') || str.includes('more')) return 'over2m';
  return null;
}

function normalizeUseOfFundsValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (str.includes('research') || str.includes('development') || str.includes('rd')) return 'rd';
  if (str.includes('marketing') || str.includes('promotion')) return 'marketing';
  if (str.includes('equipment') || str.includes('infrastructure')) return 'equipment';
  if (str.includes('personnel') || str.includes('hiring') || str.includes('team')) return 'personnel';
  return null;
}

function normalizeTeamSizeValue(value: any): string | null {
  if (typeof value === 'number') {
    if (value <= 2) return '1to2';
    if (value <= 5) return '3to5';
    if (value <= 10) return '6to10';
    return 'over10';
  }
  const str = String(value || '').toLowerCase();
  if (str.includes('1') || str.includes('2') || str.includes('solo')) return '1to2';
  if (str.includes('3') || str.includes('4') || str.includes('5')) return '3to5';
  if (str.includes('6') || str.includes('7') || str.includes('8') || str.includes('9') || str.includes('10')) return '6to10';
  if (str.includes('over') || str.includes('more')) return 'over10';
  return null;
}

function normalizeImpactValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (str.includes('economic') || str.includes('job') || str.includes('growth')) return 'economic';
  if (str.includes('social') || str.includes('community') || str.includes('society')) return 'social';
  if (str.includes('environment') || str.includes('climate') || str.includes('sustainability')) return 'environmental';
  return null;
}

function normalizeProjectDurationValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (str.includes('under') || str.includes('<2') || str.includes('short')) return 'under2';
  if (str.includes('2') && str.includes('5')) return '2to5';
  if (str.includes('5') && str.includes('10')) return '5to10';
  if (str.includes('over') || str.includes('>10') || str.includes('long')) return 'over10';
  return null;
}

function normalizeCompanyStageValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (!str) return null;
  if (str.includes('idea') || str.includes('concept')) return 'idea';
  if (str.includes('pre') || str.includes('pre-company') || str.includes('founder team')) return 'pre_company';
  if (str.includes('<6') || str.includes('under 6') || str.includes('seed')) return 'inc_lt_6m';
  if (str.includes('6-36') || str.includes('6 to 36') || str.includes('growth')) return 'inc_6_36m';
  if (str.includes('>36') || str.includes('over 36') || str.includes('established') || str.includes('mature')) return 'inc_gt_36m';
  if (str.includes('research') || str.includes('university') || str.includes('academic')) return 'research_org';
  return null;
}

function normalizeRevenueStatusValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (!str) return null;
  if (str.includes('pre') || str.includes('no revenue') || str.includes('none')) return 'pre_revenue';
  if (str.includes('early') || str.includes('initial') || str.includes('pilot') || str.includes('first revenue')) return 'early_revenue';
  if (str.includes('growth') || str.includes('scale') || str.includes('profitable') || str.includes('positive')) return 'growing_revenue';
  return null;
}

function normalizeCoFinancingValue(value: any): string | null {
  if (typeof value === 'number') {
    if (value === 0) return 'co_no';
    if (value < 50) return 'co_partial';
    return 'co_yes';
  }
  const str = String(value || '').toLowerCase();
  if (!str) return null;
  if (str.includes('no co') || str.includes('fully funded') || str.includes('100%')) return 'co_no';
  if (str.includes('partial') || str.includes('matching') || str.includes('share') || str.includes('50%')) return 'co_partial';
  if (str.includes('required') || str.includes('own contribution') || str.includes('co-financing required') || str.includes('must provide')) return 'co_yes';
  return null;
}

function normalizeIndustryValue(value: any): string | null {
  const str = String(value || '').toLowerCase();
  if (!str) return null;
  if (str.includes('digital') || str.includes('ict') || str.includes('software') || str.includes('ai')) return 'digital';
  if (str.includes('sustain') || str.includes('climate') || str.includes('energy') || str.includes('green')) return 'sustainability';
  if (str.includes('health') || str.includes('life science') || str.includes('medtech') || str.includes('biotech')) return 'health';
  if (str.includes('manufactur') || str.includes('production') || str.includes('industry')) return 'manufacturing';
  if (str.includes('export') || str.includes('international')) return 'export';
  return 'other';
}

// Normalize requirement value based on answer key (for scoring)
function normalizeRequirementValue(answerKey: string, requirementValue: any): string | null {
  switch (answerKey) {
    case 'location':
      return normalizeLocationValue(requirementValue);
    case 'company_type':
      return normalizeCompanyTypeValue(requirementValue);
    case 'company_stage':
      return normalizeCompanyStageValue(requirementValue);
    case 'revenue_status':
      return normalizeRevenueStatusValue(requirementValue);
    case 'co_financing':
      return normalizeCoFinancingValue(requirementValue);
    case 'funding_amount':
      return normalizeFundingAmountValue(requirementValue);
    case 'use_of_funds':
      return normalizeUseOfFundsValue(requirementValue);
    case 'team_size':
      return normalizeTeamSizeValue(requirementValue);
    case 'impact':
      return normalizeImpactValue(requirementValue);
    case 'industry_focus':
    case 'strategic_focus':
      return normalizeIndustryValue(requirementValue);
    case 'project_duration':
      return normalizeProjectDurationValue(requirementValue);
    default:
      return null;
  }
}

// Score programs using categorized requirements (18 categories from Layer 1&2)
// NOW WITH DYNAMIC FREQUENCY-BASED SCORING + NORMALIZATION (aligned with filtering)
function scoreCategorizedRequirements(
  categorizedRequirements: any,
  answers: UserAnswers,
  requirementFrequencies?: Map<string, number>,
  _totalPossibleRequirements?: number // Reserved for future use
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
  let matchedCount = 0;
  let missingHighConfidenceCount = 0;
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

  // Define mapping between user answers and categorized requirements
  // Map QuestionEngine answer keys to requirement categories
  const answerMapping: Record<string, string[]> = {
    // New simplified QuestionEngine format:
    'location': ['geographic', 'eligibility'],
    'company_type': ['eligibility', 'team'],
    'company_stage': ['eligibility', 'team'],
    'company_age': ['team', 'eligibility'],
    'revenue_status': ['financial'],
    'revenue': ['financial'],
    'co_financing': ['financial', 'co_financing'],
    'team_size': ['team'],
    'funding_amount': ['financial'],
    'use_of_funds': ['financial', 'use_of_funds'],
    'impact': ['impact'],
    'deadline_urgency': ['timeline'],
    'project_duration': ['timeline'],
    'project_stage': ['eligibility', 'project'],
    'research_focus': ['project', 'impact'],
    'consortium': ['consortium', 'geographic'],
    'industry_focus': ['project', 'impact'],
    'strategic_focus': ['impact', 'project'],
    'trl_level': ['technical', 'trl_level'],
    'market_size': ['market_size'],
    'co_financing': ['financial', 'co_financing'],
    // Legacy format support (for advanced search):
    'q1_location': ['geographic', 'eligibility'],
    'q1_country': ['geographic', 'eligibility'],
    'q2_entity_stage': ['team', 'eligibility'],
    'q3_company_size': ['team'],
    'current_revenue': ['financial'],
    'international_collaboration': ['consortium', 'geographic']
  };

  // Debug: Log what we're receiving
  console.log('🔍 DEBUG scoreCategorizedRequirements:', {
    categorizedRequirementsKeys: Object.keys(categorizedRequirements),
    answersKeys: Object.keys(answers),
    answers: answers
  });

  // Score each category
  Object.entries(categorizedRequirements).forEach(([category, data]: [string, any]) => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    // Find matching user answers for this category
    const relevantAnswers = Object.entries(answerMapping)
      .filter(([_, categories]) => categories.includes(category))
      .map(([answerKey, _]) => ({ key: answerKey, value: answers[answerKey] }))
      .filter(answer => answer.value !== undefined && answer.value !== null && answer.value !== '');

    console.log(`🔍 DEBUG category "${category}": relevantAnswers:`, relevantAnswers);
    if (relevantAnswers.length === 0) return;

    // Score based on category type
    data.forEach((item: any) => {
      const itemValue = Array.isArray(item.value) ? item.value.join(', ') : item.value;
      const confidence = item.confidence || 0.5;

      // Check if any relevant answer matches this requirement
      let matched = false;
      let matchReason = '';

      relevantAnswers.forEach(answer => {
        const userAnswerNormalized = String(answer.value).toLowerCase();
        
        // NORMALIZE requirement value using same logic as filtering
        // This ensures scoring matches filtering exactly
        const requirementNormalized = normalizeRequirementValue(answer.key, itemValue);
        
        // Match if normalized values match (same as filtering logic)
        if (requirementNormalized && requirementNormalized === userAnswerNormalized) {
          matched = true;
          matchReason = `${answer.key} (${answer.value}) matches ${category} requirement (${itemValue}) - normalized to ${requirementNormalized}`;
        } else if (Array.isArray(item.value)) {
          // Check array items with normalization
          const arrayMatch = item.value.some((v: any) => {
            const normalized = normalizeRequirementValue(answer.key, v);
            return normalized && normalized === userAnswerNormalized;
          });
          if (arrayMatch) {
            matched = true;
            matchReason = `${answer.key} (${answer.value}) matches ${category} requirement in array`;
          }
        } else if (!requirementNormalized) {
          // Fallback: If normalization fails, try string matching (for non-standard fields)
          const answerValueStr = String(answer.value).toLowerCase();
          const itemValueStr = String(itemValue).toLowerCase();
          if (itemValueStr === answerValueStr || itemValueStr.includes(answerValueStr) || answerValueStr.includes(itemValueStr)) {
            matched = true;
            matchReason = `${answer.key} (${answer.value}) matches ${category} requirement (${itemValue}) - via string matching`;
          }
        }
      });

      if (matched) {
        // DYNAMIC SCORING: Weight by requirement frequency (rare = more valuable)
        const reqKey = `${category}:${item.type || 'unknown'}`;
        const frequency = requirementFrequencies?.get(reqKey) || 0.5; // Default to 50% if unknown
        
        // Rare requirements (<10%) worth more, common (>50%) worth less
        let baseScore: number;
        if (frequency < 0.1) {
          baseScore = 15; // Rare requirement: 15 points
        } else if (frequency < 0.3) {
          baseScore = 12; // Uncommon: 12 points
        } else if (frequency < 0.5) {
          baseScore = 10; // Common: 10 points
        } else {
          baseScore = 7; // Very common: 7 points
        }
        
        const categoryScore = Math.round(baseScore * confidence);
        score += categoryScore;
        matchedCount++;
        
        matchedCriteria.push({
          key: category,
          value: itemValue,
          reason: matchReason,
          status: 'passed'
        });
      } else if (confidence > 0.7) {
        // High confidence requirement that doesn't match - will be penalized
        missingHighConfidenceCount++;
        gaps.push({
          key: category,
          description: `${category} requirement not met: ${itemValue}`,
          action: `Review ${category} requirements and adjust your answers`,
          priority: confidence > 0.9 ? 'high' : 'medium'
        });
      }
    });
  });

  // NORMALIZE TO PERCENTAGE: Calculate maximum possible score, then normalize
  // First, calculate what the maximum possible score would be (if all requirements matched)
  let maxPossibleScore = 0;
  Object.entries(categorizedRequirements).forEach(([category, data]: [string, any]) => {
    if (!Array.isArray(data)) return;
    data.forEach((item: any) => {
      const confidence = item.confidence || 0.5;
      const reqKey = `${category}:${item.type || 'unknown'}`;
      const frequency = requirementFrequencies?.get(reqKey) || 0.5;
      
      // Calculate max points for this requirement (if matched)
      let baseScore: number;
      if (frequency < 0.1) baseScore = 15;
      else if (frequency < 0.3) baseScore = 12;
      else if (frequency < 0.5) baseScore = 10;
      else baseScore = 7;
      
      maxPossibleScore += Math.round(baseScore * confidence);
    });
  });
  
  // Apply penalties for missing high-confidence requirements
  // Penalty is based on percentage of max score
  const penaltyPercent = missingHighConfidenceCount * 0.1; // 10% penalty per missing high-confidence requirement
  const penaltyPoints = maxPossibleScore > 0 ? (maxPossibleScore * penaltyPercent) : 0;
  const finalScore = Math.max(0, score - penaltyPoints);
  
  // Normalize to percentage (0-100%)
  if (maxPossibleScore > 0) {
    score = Math.round((finalScore / maxPossibleScore) * 100);
  } else {
    // Fallback: If no requirements, score stays as is (will be handled later)
    score = Math.round(finalScore);
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return { score, matchedCriteria, gaps };
}

/**
 * APPLY MAJOR FILTERS: Same logic as QuestionEngine for consistency
 */
function applyMajorFiltersToPrograms(programs: any[], answers: UserAnswers): any[] {
  let filteredPrograms = [...programs];
  
  // MAJOR FILTER 1: Location (Hardcoded Rule)
  if (answers.location) {
    filteredPrograms = filteredPrograms.filter(program => {
      // Check eligibility_criteria.location first
      const eligibilityLocation = (program as any).eligibility_criteria?.location?.toLowerCase() || '';
      
      // Also check institution and description fields
      const programLocation = program.institution?.toLowerCase() || '';
      const programDescription = program.description?.toLowerCase() || '';
      
      switch (answers.location) {
        case 'austria':
          return eligibilityLocation === 'austria' ||
                 eligibilityLocation.includes('austria') ||
                 programLocation.includes('austria') || 
                 programLocation.includes('österreich') ||
                 programDescription.includes('austria') ||
                 programDescription.includes('österreich');
        case 'germany':
          return eligibilityLocation === 'germany' ||
                 eligibilityLocation.includes('germany') ||
                 programLocation.includes('germany') || 
                 programLocation.includes('deutschland') ||
                 programDescription.includes('germany') ||
                 programDescription.includes('deutschland');
        case 'eu':
          return eligibilityLocation === 'eu' ||
                 eligibilityLocation.includes('eu') ||
                 eligibilityLocation.includes('europe') ||
                 programLocation.includes('eu') || 
                 programLocation.includes('european') ||
                 programDescription.includes('eu') ||
                 programDescription.includes('european');
        case 'international':
          return true; // Show all programs
        default:
          return true;
      }
    });
    console.log(`🌍 Location filter (${answers.location}): ${programs.length} → ${filteredPrograms.length} programs`);
  }
  
  // MAJOR FILTER 2: Funding Type (Hardcoded Rule)
  if (answers.funding_type) {
    filteredPrograms = filteredPrograms.filter(program => {
      const programType = program.type || program.program_type || '';
      
      switch (answers.funding_type) {
        case 'grant':
          return programType === 'grant';
        case 'loan':
          return programType === 'loan';
        case 'equity':
          return programType === 'equity';
        default:
          return true;
      }
    });
    console.log(`💰 Funding type filter (${answers.funding_type}): ${programs.length} → ${filteredPrograms.length} programs`);
  }
  
  // MAJOR FILTER 3: Organization Type (Hardcoded Rule)
  if (answers.organization_type) {
    filteredPrograms = filteredPrograms.filter(program => {
      const targetPersonas = program.target_personas || [];
      const tags = program.tags || [];
      const description = program.description?.toLowerCase() || '';
      
      switch (answers.organization_type) {
        case 'startup':
          return targetPersonas.includes('startup') || 
                 tags.includes('startup') ||
                 description.includes('startup') ||
                 description.includes('early stage');
        case 'sme':
          return targetPersonas.includes('sme') || 
                 tags.includes('sme') ||
                 description.includes('sme') ||
                 description.includes('small business');
        case 'research':
          return targetPersonas.includes('researcher') || 
                 targetPersonas.includes('university') ||
                 tags.includes('research') ||
                 description.includes('research') ||
                 description.includes('university');
        case 'university':
          return targetPersonas.includes('university') || 
                 tags.includes('university') ||
                 description.includes('university') ||
                 description.includes('academic');
        default:
          return true;
      }
    });
    console.log(`🏢 Organization type filter (${answers.organization_type}): ${programs.length} → ${filteredPrograms.length} programs`);
  }
  
  return filteredPrograms;
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

    // Use pre-filtered programs if provided (from QuestionEngine), otherwise fetch and filter
    let filteredPrograms: Program[];
    
    if (preFilteredPrograms && preFilteredPrograms.length > 0) {
      // Use programs already filtered by QuestionEngine (wizard flow)
      console.log('✅ Using pre-filtered programs from QuestionEngine:', preFilteredPrograms.length);
      filteredPrograms = preFilteredPrograms;
    } else {
      // Fetch and filter programs (advanced search flow)
      const response = await fetch('/api/programs?enhanced=true');
      const data = await response.json();
      const programs = data.programs || [];
      console.log('🔍 Debug: Fetched programs directly:', programs.length);
      
      // APPLY MAJOR FILTERS (for advanced search, not wizard)
      filteredPrograms = applyMajorFiltersToPrograms(programs, userAnswers);
      console.log(`🔍 Major filters applied: ${programs.length} → ${filteredPrograms.length} programs`);
    }
    
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
        categorized_requirements: p.categorized_requirements || null
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

    // Calculate requirement frequencies from ALL programs (for dynamic scoring)
    // Fetch all programs if we only have pre-filtered ones
    let allProgramsForFrequencies: Program[] = normalizedPrograms;
    if (preFilteredPrograms && preFilteredPrograms.length > 0) {
      // If we have pre-filtered programs, we need all programs for frequency calculation
      try {
        const response = await fetch('/api/programs?enhanced=true');
        const data = await response.json();
        allProgramsForFrequencies = (data.programs || []).map((p: any) => ({
          id: p.id,
          name: p.name || p.id,
          type: p.type || "program",
          program_type: p.program_type || p.type || "grant",
          program_category: p.program_category || "general",
          requirements: p.requirements || {},
          notes: p.notes,
          maxAmount: p.maxAmount,
          link: p.link,
          categorized_requirements: p.categorized_requirements || null
        }));
        console.log(`📊 Loaded ${allProgramsForFrequencies.length} total programs for frequency calculation`);
      } catch (error) {
        console.warn('⚠️ Could not fetch all programs for frequency calculation, using filtered programs:', error);
        allProgramsForFrequencies = normalizedPrograms;
      }
    }
    
    // Calculate requirement frequencies (for dynamic scoring)
    const requirementFrequencies = calculateRequirementFrequencies(allProgramsForFrequencies);
    console.log(`📊 Calculated frequencies for ${requirementFrequencies.size} requirement types`);

    return normalizedPrograms.map((program) => {
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
        for (const [key, requirement] of Object.entries(program.requirements)) {
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
        } else if (typeof requirement === "object" && requirement.min !== undefined) {
          if (answer >= requirement.min) {
            passed = true;
            reason = `${key} meets minimum (${answer} >= ${requirement.min})`;
            status = 'passed';
          } else {
            reason = `${key} below minimum (${answer} < ${requirement.min})`;
            status = 'failed';
          }
        } else if (typeof requirement === "object" && requirement.max !== undefined) {
          if (answer <= requirement.max) {
            passed = true;
            reason = `${key} within maximum (${answer} <= ${requirement.max})`;
            status = 'passed';
          } else {
            reason = `${key} exceeds maximum (${answer} > ${requirement.max})`;
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

      // Enhanced scoring with categorized requirements (Layer 1&2)
      // NOW WITH DYNAMIC FREQUENCY-BASED SCORING
      if (program.categorized_requirements) {
        // Count total possible requirements for normalization
        let totalPossibleRequirements = 0;
        Object.entries(program.categorized_requirements).forEach(([_, data]: [string, any]) => {
          if (Array.isArray(data)) {
            totalPossibleRequirements += data.filter((item: any) => item && item.confidence !== undefined).length;
          }
        });
        
        const categorizedScore = scoreCategorizedRequirements(
          program.categorized_requirements, 
          answers,
          requirementFrequencies,
          totalPossibleRequirements
        );
        
        // Use the normalized score directly (already percentage-based)
        score = categorizedScore.score;
        matchedCriteria.push(...categorizedScore.matchedCriteria);
        gaps.push(...categorizedScore.gaps);
        console.log(`🔍 Debug: Categorized requirements score for ${program.id}: ${categorizedScore.score}% (normalized, frequency-based)`);
      }

      // Score is now already normalized (0-100%) from scoreCategorizedRequirements
      let scorePercent = score;
      
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
      const founderFriendlyReasons = generateFounderFriendlyReasons(matchedCriteria);
      const founderFriendlyRisks = generateFounderFriendlyRisks(gaps);

      // Generate eligibility trace
      const trace = generateEligibilityTrace(program, matchedCriteria, gaps, derivedSignals);
      
      console.log(`🔍 EnhancedRecoEngine: Program ${program.id} - Final Score: ${scorePercent}, Matched: ${matchedCriteria.length}, Gaps: ${gaps.length}, Eligibility: ${eligibility}`);

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
        unknownCriteria: unknownKeys
      };
    }).sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('❌ Enhanced recommendation engine failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        answersCount: Object.keys(userAnswers).length,
        answers: Object.keys(userAnswers)
      });
      
      // Try to return partial results if available
      try {
        console.log('🔄 Attempting fallback scoring...');
        return await scoreProgramsFallback(userAnswers, mode);
      } catch (fallbackError) {
        console.error('❌ Fallback scoring also failed:', fallbackError);
        return [];
      }
    }
  }

// Fallback recommendation engine - simple but reliable
async function scoreProgramsFallback(
  _answers: UserAnswers,
  _mode: "strict" | "explorer" = "strict"
): Promise<EnhancedProgramResult[]> {
  try {
    const response = await fetch('/api/programs');
    const data = await response.json();
    const source = data.programs || [];
    
    // Simple fallback: return basic program information with minimal scoring
    return source.slice(0, 10).map((p: any, index: number) => ({
      id: p.id || `fallback-${index}`,
      name: p.name || p.id || `Program ${index + 1}`,
      type: (Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : (p.type || "program")) as ProgramType,
      program_type: p.program_type || p.type || "grant",
      program_category: p.program_category || "general",
      requirements: (p.requirements as any) || {},
      notes: undefined,
      maxAmount: undefined,
      link: undefined,
      score: Math.max(0, 100 - (index * 10)), // Decreasing score
      reason: "Fallback recommendation - basic program information available",
      eligibility: "Unknown",
      confidence: "Low" as const,
      matchedCriteria: [],
      gaps: [{
        key: "fallback",
        description: "Using fallback recommendation system",
        action: "Contact support for detailed analysis",
        priority: "medium" as const
      }],
      amount: { min: 0, max: 0, currency: 'EUR' },
      timeline: "Unknown",
      successRate: 0.3,
      successConfidence: 'low',
      successFactors: ['Fallback engine – historical baseline applied'],
      llmFailed: true,
      fallbackReason: "Main recommendation engine unavailable",
      fallbackGaps: ["System fallback mode"],
      founderFriendlyReasons: ["This program may be suitable for your project"],
      founderFriendlyRisks: ["Verify eligibility requirements before applying"],
      trace: {
        passed: [],
        failed: [],
        warnings: ["⚠️ Using fallback recommendation system"],
        counterfactuals: ["Contact support for detailed program analysis"]
      }
    }));
  } catch (fallbackError) {
    console.error('Fallback recommendation engine also failed:', fallbackError);
    // Ultimate fallback - return empty results
    return [];
  }
}

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

// Generate founder-friendly explanations for why a program fits
function generateFounderFriendlyReasons(
  matchedCriteria: Array<{ key: string; value: any; reason: string; status: 'passed' | 'warning' | 'failed' }>
): string[] {
  const reasons: string[] = [];
  const passedCriteria = matchedCriteria.filter(c => c.status === 'passed');
  
  // Map technical criteria to founder-friendly explanations with program benefits
  const criteriaMapping: Record<string, (value: any) => string> = {
    'q1_country': (value) => {
      if (value === 'AT') return 'Austrian location requirement met - you can access local funding and support networks';
      if (value === 'EU') return 'EU eligibility confirmed - access to broader European funding opportunities';
      return 'Your project location qualifies for this program\'s geographic requirements';
    },
    'q4_theme': (value) => {
      if (Array.isArray(value) && value.includes('INNOVATION_DIGITAL')) return 'Perfect match for digital innovation programs - high success rates for tech projects';
      if (Array.isArray(value) && value.includes('SUSTAINABILITY')) return 'Environmental focus aligns with green funding priorities - often higher funding amounts available';
      if (Array.isArray(value) && value.includes('HEALTH_LIFE_SCIENCE')) return 'Health sector focus qualifies for specialized medical innovation funding';
      return 'Your project theme matches this program\'s priority sectors';
    },
    'q8_funding_types': (value) => {
      if (Array.isArray(value) && value.includes('GRANT')) return 'Non-dilutive funding available - keep full ownership while getting financial support';
      if (Array.isArray(value) && value.includes('LOAN')) return 'Debt financing option - faster approval process than equity funding';
      if (Array.isArray(value) && value.includes('EQUITY')) return 'Equity investment opportunity - access to investor networks and expertise';
      return 'Your funding preferences match this program\'s offering';
    },
    'q2_entity_stage': (value) => {
      if (value === 'PRE_COMPANY') return 'Early-stage support available - perfect for idea validation and initial development';
      if (value === 'INC_LT_6M') return 'Startup stage qualification - access to specialized early-stage funding programs';
      if (value === 'INC_6_36M') return 'Growth stage eligibility - funding for scaling and market expansion';
      return 'Your company stage qualifies for this program\'s target audience';
    },
    'q3_company_size': (value) => {
      if (value === 'MICRO_0_9') return 'Micro-company focus - specialized support for small teams and limited resources';
      if (value === 'SMALL_10_49') return 'Small business category - access to SME-specific funding and support programs';
      if (value === 'MEDIUM_50_249') return 'Medium enterprise eligibility - larger funding amounts and business development support';
      return 'Your company size fits this program\'s target range';
    },
    'q5_maturity_trl': (value) => {
      if (value === 'TRL_3_4') return 'Proof-of-concept stage - ideal for R&D funding and technology validation';
      if (value === 'TRL_5_6') return 'Prototype development - perfect timing for product development funding';
      if (value === 'TRL_7_8') return 'Pilot stage - ready for market testing and commercialization support';
      return 'Your technology readiness level matches this program\'s requirements';
    },
    'q6_rnd_in_at': (value) => {
      if (value === 'YES') return 'Austrian R&D location - access to local research networks and tax incentives';
      return 'Your R&D plans align with this program\'s location requirements';
    },
    'q7_collaboration': (value) => {
      if (value === 'WITH_RESEARCH') return 'Research collaboration focus - access to university partnerships and academic resources';
      if (value === 'WITH_COMPANY') return 'Industry collaboration approach - networking opportunities with established companies';
      if (value === 'WITH_BOTH') return 'Comprehensive collaboration strategy - maximum networking and resource access';
      return 'Your collaboration approach aligns with this program\'s networking goals';
    },
    'q9_team_diversity': (value) => {
      if (value === 'YES') return 'Diverse team composition - often qualifies for additional funding bonuses and support';
      return 'Your team structure meets this program\'s requirements';
    },
    'q10_env_benefit': (value) => {
      if (value === 'STRONG') return 'Strong environmental impact - access to premium green funding and sustainability programs';
      if (value === 'SOME') return 'Environmental benefits present - qualifies for sustainability-focused funding';
      return 'Your project impact aligns with this program\'s environmental goals';
    }
  };

  // Generate up to 3 reasons from passed criteria
  for (const criteria of passedCriteria.slice(0, 3)) {
    const mapper = criteriaMapping[criteria.key];
    if (mapper) {
      reasons.push(mapper(criteria.value));
    }
  }

  // Add program-specific benefits if we have space
  if (reasons.length < 3) {
    reasons.push('This program offers competitive funding terms and comprehensive support services');
  }
  if (reasons.length < 3) {
    reasons.push('High success rate for projects matching your profile and requirements');
  }

  return reasons;
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

    const scored = await scoreProgramsEnhanced(normalized, "explorer");
    return { normalized, scored };
  } catch (error) {
    console.error('Free text analysis failed, using fallback:', error);
    return {
      normalized: {},
      scored: await scoreProgramsFallback({}, "explorer")
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

import rawPrograms from "../../data/programs.json";
import { Program, UserAnswers, ScoredProgram } from "../types";

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
  trace?: EligibilityTrace;
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
  const signals: DerivedSignals = {
    capexFlag: false,
    equityOk: false,
    collateralOk: false,
    urgencyBucket: "normal",
    companyAgeBucket: "pre",
    sectorBucket: "general",
    rdInAT: undefined,
    amountFit: 0,
    stageFit: 0,
    timelineFit: 0,
    fundingMode: "grant", // default
    // New derived signals
    trlBucket: "low",
    revenueBucket: "none",
    ipFlag: false,
    regulatoryFlag: false,
    socialImpactFlag: false,
    esgFlag: false,
    // Unknown handling
    unknowns: [],
    counterfactuals: []
  };

  // Derive CAPEX flag from theme and maturity
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme as string[];
    signals.capexFlag = themes.some(theme => 
      ['INNOVATION_DIGITAL', 'MANUFACTURING', 'ENERGY'].includes(theme)
    );
  } else if (answers.q4_theme === undefined || answers.q4_theme === null) {
    signals.unknowns.push("q4_theme");
    signals.counterfactuals.push("Add project theme to unlock theme-specific programs");
  }

  // Derive equity preference from stage and size
  if (answers.q2_entity_stage && answers.q3_company_size) {
    const stage = answers.q2_entity_stage as string;
    const size = answers.q3_company_size as string;
    
    // Early stage + small size = equity friendly
    signals.equityOk = (
      (stage === 'PRE_COMPANY' || stage === 'INC_LT_6M' || stage === 'INC_6_36M') &&
      (size === 'MICRO_0_9' || size === 'SMALL_10_49')
    );
  } else {
    if (!answers.q2_entity_stage) {
      signals.unknowns.push("q2_entity_stage");
      signals.counterfactuals.push("Add company stage to qualify for stage-specific programs");
    }
    if (!answers.q3_company_size) {
      signals.unknowns.push("q3_company_size");
      signals.counterfactuals.push("Add team size to unlock size-specific programs");
    }
  }

  // Derive collateral capability from company age and size
  if (answers.q2_entity_stage && answers.q3_company_size) {
    const stage = answers.q2_entity_stage as string;
    const size = answers.q3_company_size as string;
    
    // Established + larger size = collateral capable
    signals.collateralOk = (
      (stage === 'INC_GT_36M' || stage === 'RESEARCH_ORG') &&
      (size === 'MEDIUM_50_249' || size === 'LARGE_250_PLUS')
    );
  }

  // Derive urgency from stage and maturity
  if (answers.q2_entity_stage && answers.q5_maturity_trl) {
    const stage = answers.q2_entity_stage as string;
    const trl = answers.q5_maturity_trl as string;
    
    if (stage === 'PRE_COMPANY' || stage === 'INC_LT_6M') {
      signals.urgencyBucket = "urgent";
    } else if (stage === 'INC_6_36M' && (trl === 'TRL_3_4' || trl === 'TRL_5_6')) {
      signals.urgencyBucket = "soon";
    } else {
      signals.urgencyBucket = "normal";
    }
  }

  // Derive company age bucket
  if (answers.q2_entity_stage) {
    const stage = answers.q2_entity_stage as string;
    if (stage === 'PRE_COMPANY') {
      signals.companyAgeBucket = "pre";
    } else if (stage === 'INC_LT_6M' || stage === 'INC_6_36M') {
      signals.companyAgeBucket = "0-3y";
    } else {
      signals.companyAgeBucket = "3y+";
    }
  }

  // Derive sector bucket
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme as string[];
    if (themes.includes('HEALTH_LIFE_SCIENCE')) {
      signals.sectorBucket = "health";
    } else if (themes.includes('SUSTAINABILITY') || themes.includes('ENERGY')) {
      signals.sectorBucket = "sustainability";
    } else if (themes.includes('INNOVATION_DIGITAL')) {
      signals.sectorBucket = "tech";
    } else if (themes.includes('MANUFACTURING')) {
      signals.sectorBucket = "manufacturing";
    } else {
      signals.sectorBucket = "general";
    }
  }

  // Derive R&D in Austria flag
  if (answers.q6_rnd_in_at) {
    signals.rdInAT = answers.q6_rnd_in_at === 'YES';
  } else {
    signals.unknowns.push("q6_rnd_in_at");
    signals.counterfactuals.push("Specify R&D location to unlock location-specific programs");
  }

  // Derive TRL bucket
  if (answers.q5_maturity_trl) {
    const trl = answers.q5_maturity_trl as string;
    if (trl === 'TRL_1_2' || trl === 'TRL_3_4') {
      signals.trlBucket = "low";
    } else if (trl === 'TRL_5_6' || trl === 'TRL_7_8') {
      signals.trlBucket = "mid";
    } else if (trl === 'TRL_9') {
      signals.trlBucket = "high";
    }
  } else {
    signals.unknowns.push("q5_maturity_trl");
    signals.counterfactuals.push("Add technology readiness level to unlock TRL-specific programs");
  }

  // Derive revenue bucket (based on company stage and size)
  if (answers.q2_entity_stage) {
    const stage = answers.q2_entity_stage as string;
    if (stage === 'PRE_COMPANY') {
      signals.revenueBucket = "none";
    } else if (stage === 'INC_LT_6M' || stage === 'INC_6_36M') {
      signals.revenueBucket = "low";
    } else {
      signals.revenueBucket = "medium";
    }
  }

  // Derive IP flag (based on themes and stage)
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme as string[];
    signals.ipFlag = themes.some(theme => 
      ['INNOVATION_DIGITAL', 'HEALTH_LIFE_SCIENCE', 'MANUFACTURING'].includes(theme)
    );
  }

  // Derive regulatory flag (based on themes)
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme as string[];
    signals.regulatoryFlag = themes.some(theme => 
      ['HEALTH_LIFE_SCIENCE', 'ENERGY'].includes(theme)
    );
  }

  // Derive social impact flag (based on themes and environmental benefit)
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme as string[];
    signals.socialImpactFlag = themes.some(theme => 
      ['SUSTAINABILITY', 'HEALTH_LIFE_SCIENCE'].includes(theme)
    );
  }
  if (answers.q10_env_benefit && answers.q10_env_benefit !== 'NONE') {
    signals.socialImpactFlag = true;
  }

  // Derive ESG flag (based on themes and environmental benefit)
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme as string[];
    signals.esgFlag = themes.some(theme => 
      ['SUSTAINABILITY', 'ENERGY'].includes(theme)
    );
  }
  if (answers.q10_env_benefit && (answers.q10_env_benefit === 'SOME' || answers.q10_env_benefit === 'HIGH')) {
    signals.esgFlag = true;
  }

  // Derive funding mode based on derived signals
  if (signals.equityOk && signals.companyAgeBucket === "pre") {
    signals.fundingMode = "equity";
  } else if (signals.collateralOk && signals.urgencyBucket === "urgent") {
    signals.fundingMode = "loan";
  } else if (signals.capexFlag && signals.rdInAT) {
    signals.fundingMode = "grant";
  } else if (signals.socialImpactFlag && signals.esgFlag) {
    signals.fundingMode = "grant"; // ESG programs are typically grants
  } else if (signals.regulatoryFlag && signals.trlBucket === "mid") {
    signals.fundingMode = "grant"; // Regulatory programs often require grants
  } else {
    signals.fundingMode = "mixed";
  }

  // Calculate fit scores (0-100)
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

// Enhanced scoring with detailed explanations and trace generation
export function scoreProgramsEnhanced(
  answers: UserAnswers,
  mode: "strict" | "explorer" = "strict"
): EnhancedProgramResult[] {
  try {
    const source = rawPrograms.programs as any[];
    const derivedSignals = deriveSignals(answers);
    
    const normalizedPrograms: Program[] = source.map((p) => ({
      id: p.id,
      name: p.title || p.name || p.id,
      type: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : (p.type || "program"),
      requirements: convertOverlaysToRequirements(p.overlays || []),
      notes: undefined,
      maxAmount: undefined,
      link: undefined,
    }));

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
        const answer = answers[key];

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
          const result = evaluateOverlayCondition(requirement, answers);
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

      const totalRequirements = Object.keys(program.requirements || {}).length;
      let scorePercent = totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : score;
      
      // Ensure minimum score for programs with no requirements or when scoring fails
      if (scorePercent === 0 && totalRequirements === 0) {
        scorePercent = 50; // Base score for programs without specific requirements
      } else if (scorePercent === 0 && totalRequirements > 0) {
        scorePercent = 10; // Minimum score even if no requirements are met
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
        successRate: getProgramSuccessRate(program),
        llmFailed: false, // This is rule-based, not LLM
        fallbackReason: reason,
        fallbackGaps: gaps.map(g => g.description),
        founderFriendlyReasons,
        founderFriendlyRisks,
        trace // Add trace information
      };
    }).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Enhanced recommendation engine failed, using fallback:', error);
    return scoreProgramsFallback(answers, mode);
  }
}

// Fallback recommendation engine - simple but reliable
function scoreProgramsFallback(
  _answers: UserAnswers,
  _mode: "strict" | "explorer" = "strict"
): EnhancedProgramResult[] {
  try {
    const source = rawPrograms.programs as any[];
    
    // Simple fallback: return basic program information with minimal scoring
    return source.slice(0, 10).map((p, index) => ({
      id: p.id || `fallback-${index}`,
      name: p.title || p.name || p.id || `Program ${index + 1}`,
      type: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : (p.type || "program"),
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
export function analyzeFreeTextEnhanced(description: string): { normalized: UserAnswers; scored: EnhancedProgramResult[] } {
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

    const scored = scoreProgramsEnhanced(normalized, "explorer");
    return { normalized, scored };
  } catch (error) {
    console.error('Free text analysis failed, using fallback:', error);
    return {
      normalized: {},
      scored: scoreProgramsFallback({}, "explorer")
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

// Convert program overlays to requirements format
function convertOverlaysToRequirements(overlays: any[]): Record<string, any> {
  const requirements: Record<string, any> = {};
  
  for (const overlay of overlays) {
    if (overlay.ask_if && overlay.decisiveness) {
      // Extract question ID from ask_if condition
      const match = overlay.ask_if.match(/answers\.(q\d+_\w+)/);
      if (match) {
        const questionId = match[1];
        
        // Convert condition to requirement based on decisiveness
        if (overlay.decisiveness === 'HARD') {
          // For hard rules, we'll evaluate the condition
          requirements[questionId] = overlay.ask_if;
        } else if (overlay.decisiveness === 'SOFT') {
          // For soft rules, we'll use a more lenient evaluation
          requirements[questionId] = overlay.ask_if;
        }
      }
    }
  }
  
  return requirements;
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

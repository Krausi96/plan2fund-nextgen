import rawPrograms from "../data/programs";
import { Program, UserAnswers, ScoredProgram } from "../types";

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

// Enhanced scoring with detailed explanations
export function scoreProgramsEnhanced(
  answers: UserAnswers,
  mode: "strict" | "explorer" = "strict"
): EnhancedProgramResult[] {
  const source = rawPrograms.programs as any[];
  const normalizedPrograms: Program[] = source.map((p) => ({
    id: p.id,
    name: p.title || p.name || p.id,
    type: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : (p.type || "program"),
    requirements: (p.requirements as any) || {},
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

      if (Array.isArray(requirement)) {
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

    const totalRequirements = Object.keys(program.requirements || {}).length;
    const scorePercent = totalRequirements > 0 ? Math.round((score / totalRequirements) * 100) : 0;

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
      fallbackGaps: gaps.map(g => g.description)
    };
  }).sort((a, b) => b.score - a.score);
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
}

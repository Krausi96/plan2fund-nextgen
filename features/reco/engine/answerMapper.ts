// Answer Mapping Function
// Converts QuestionEngine answer format to enhancedRecoEngine format
// This ensures deriveSignals() can properly extract signals from answers

// UserAnswers type - same as enhancedRecoEngine uses
// Type definition: Record<string, any> for flexibility
type UserAnswers = Record<string, any>;

/**
 * Maps QuestionEngine answers to enhancedRecoEngine format
 * 
 * QuestionEngine format: { location: 'austria', company_age: '0_2_years' }
 * enhancedRecoEngine format: { q1_location: 'AUSTRIA', q2_entity_stage: 'PRE_COMPANY' }
 */
export function mapQuestionEngineAnswersToEnhancedFormat(
  answers: Record<string, any>
): UserAnswers {
  const mapped: UserAnswers = {};

  // Location mapping
  if (answers.location) {
    const location = answers.location.toLowerCase();
    if (location === 'austria' || location === 'vienna') {
      mapped.q1_location = 'AUSTRIA';
    } else if (location === 'germany') {
      mapped.q1_location = 'GERMANY';
    } else if (location === 'eu' || location === 'european union') {
      mapped.q1_location = 'EU';
    } else if (location === 'international') {
      mapped.q1_location = 'INTERNATIONAL';
    } else {
      mapped.q1_location = location.toUpperCase();
    }
  }

  // Company Age → Entity Stage mapping
  if (answers.company_age) {
    const age = answers.company_age.toLowerCase();
    if (age.includes('0_2') || age.includes('under_2') || age.includes('2_years')) {
      mapped.q2_entity_stage = 'PRE_COMPANY';
    } else if (age.includes('2_5') || age.includes('5_years')) {
      mapped.q2_entity_stage = 'INC_LT_6M';
    } else if (age.includes('5_10') || age.includes('10_years')) {
      mapped.q2_entity_stage = 'INC_6_36M';
    } else if (age.includes('over_10') || age.includes('10+')) {
      mapped.q2_entity_stage = 'INC_GT_36M';
    }
  }

  // Team Size → Company Size mapping
  if (answers.team_size) {
    const size = answers.team_size.toLowerCase();
    if (size.includes('1_2') || size.includes('1-2')) {
      mapped.q3_company_size = 'MICRO_0_9';
    } else if (size.includes('3_5') || size.includes('3-5')) {
      mapped.q3_company_size = 'MICRO_0_9';
    } else if (size.includes('6_10') || size.includes('6-10')) {
      mapped.q3_company_size = 'SMALL_10_49';
    } else if (size.includes('over_10') || size.includes('10+')) {
      mapped.q3_company_size = 'MEDIUM_50_249';
    }
  }

  // Revenue → Use current_revenue if available
  if (answers.current_revenue) {
    const revenue = answers.current_revenue.toLowerCase();
    // Map revenue ranges to approximate values
    if (revenue.includes('under_100')) {
      mapped.q7_revenue = 'UNDER_100K';
    } else if (revenue.includes('100k_500') || revenue.includes('100-500')) {
      mapped.q7_revenue = '100K_500K';
    } else if (revenue.includes('500k_2m') || revenue.includes('500k-2m')) {
      mapped.q7_revenue = '500K_2M';
    } else if (revenue.includes('over_2m') || revenue.includes('2m+')) {
      mapped.q7_revenue = 'OVER_2M';
    }
  }

  // Research Focus → Theme mapping
  if (answers.research_focus) {
    const focus = answers.research_focus.toLowerCase();
    if (focus === 'yes') {
      mapped.q4_theme = ['RESEARCH'];
    } else {
      // Default to innovation if not research
      mapped.q4_theme = ['INNOVATION_DIGITAL'];
    }
  }

  // Industry Focus → Theme mapping
  if (answers.industry_focus) {
    const industry = answers.industry_focus.toLowerCase();
    const themes: string[] = [];
    
    if (industry.includes('tech') || industry.includes('digital') || industry.includes('software')) {
      themes.push('INNOVATION_DIGITAL');
    }
    if (industry.includes('health') || industry.includes('life') || industry.includes('medical')) {
      themes.push('HEALTH_LIFE_SCIENCE');
    }
    if (industry.includes('energy') || industry.includes('sustainability') || industry.includes('green')) {
      themes.push('ENERGY');
      themes.push('SUSTAINABILITY');
    }
    if (industry.includes('manufacturing') || industry.includes('production')) {
      themes.push('MANUFACTURING');
    }
    
    if (themes.length > 0) {
      mapped.q4_theme = themes;
    }
  }

  // TRL Level mapping
  if (answers.trl_level) {
    const trl = answers.trl_level.toString().toLowerCase();
    if (trl === '1' || trl === '2' || trl.includes('trl_1') || trl.includes('trl_2')) {
      mapped.q5_maturity_trl = 'TRL_1_2';
    } else if (trl === '3' || trl === '4' || trl.includes('trl_3') || trl.includes('trl_4')) {
      mapped.q5_maturity_trl = 'TRL_3_4';
    } else if (trl === '5' || trl === '6' || trl.includes('trl_5') || trl.includes('trl_6')) {
      mapped.q5_maturity_trl = 'TRL_5_6';
    } else if (trl === '7' || trl === '8' || trl.includes('trl_7') || trl.includes('trl_8')) {
      mapped.q5_maturity_trl = 'TRL_7_8';
    } else if (trl === '9' || trl.includes('trl_9')) {
      mapped.q5_maturity_trl = 'TRL_9';
    }
  }

  // International Collaboration → R&D in Austria
  if (answers.international_collaboration) {
    const collab = answers.international_collaboration.toLowerCase();
    if (collab === 'yes') {
      // If they have international partners, assume R&D might be in Austria
      mapped.q6_rnd_in_at = 'YES';
    } else {
      mapped.q6_rnd_in_at = 'NO';
    }
  }

  // Co-financing → Not directly mappable, but could be used for funding type preference
  if (answers.co_financing) {
    // Co-financing percentage could influence funding mode
    // This is handled in deriveSignals() based on other factors
  }

  // Impact → Environmental benefit mapping
  if (answers.impact) {
    const impacts = Array.isArray(answers.impact) ? answers.impact : [answers.impact];
    const impactStr = impacts.join(' ').toLowerCase();
    
    if (impactStr.includes('environmental') || impactStr.includes('climate') || impactStr.includes('sustainability')) {
      mapped.q10_env_benefit = 'HIGH';
    } else if (impactStr.includes('social') || impactStr.includes('community')) {
      mapped.q10_env_benefit = 'SOME';
    } else {
      mapped.q10_env_benefit = 'NONE';
    }
  }

  // Consortium → Partner information
  if (answers.consortium) {
    const consortium = answers.consortium.toLowerCase();
    if (consortium === 'yes') {
      // Having partners suggests international collaboration
      mapped.q6_rnd_in_at = 'YES';
    }
  }

  // Business Stage fallback (if company_age not provided)
  if (!mapped.q2_entity_stage && answers.business_stage) {
    const stage = answers.business_stage.toLowerCase();
    if (stage === 'idea' || stage === 'concept') {
      mapped.q2_entity_stage = 'PRE_COMPANY';
    } else if (stage === 'mvp' || stage === 'prototype') {
      mapped.q2_entity_stage = 'INC_LT_6M';
    } else if (stage === 'revenue' || stage === 'early') {
      mapped.q2_entity_stage = 'INC_6_36M';
    } else if (stage === 'scaling' || stage === 'growth') {
      mapped.q2_entity_stage = 'INC_GT_36M';
    }
  }

  // Innovation Level → Could influence TRL if not provided
  if (!mapped.q5_maturity_trl && answers.innovation_level) {
    const level = answers.innovation_level.toLowerCase();
    if (level.includes('breakthrough') || level.includes('cutting')) {
      mapped.q5_maturity_trl = 'TRL_1_2'; // Early stage for breakthrough
    } else if (level.includes('advanced')) {
      mapped.q5_maturity_trl = 'TRL_5_6';
    } else if (level.includes('incremental') || level.includes('improvement')) {
      mapped.q5_maturity_trl = 'TRL_7_8';
    }
  }

  console.log('🔄 Answer mapping:', {
    input: answers,
    mapped: mapped,
    mappedKeys: Object.keys(mapped)
  });

  return mapped;
}


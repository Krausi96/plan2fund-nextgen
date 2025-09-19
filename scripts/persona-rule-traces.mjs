#!/usr/bin/env node

// Persona Rule Traces - Shows H/S/U → % → bullets for 3 personas
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data files
const programsData = JSON.parse(readFileSync(join(__dirname, '../data/programs.json'), 'utf8'));
const questionsData = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf8'));

console.log('🔍 PERSONA RULE TRACES - H/S/U → % → Bullets\n');

// Persona definitions
const personas = {
  B2C_FOUNDER: {
    name: 'B2C Founder',
    answers: {
      q1_country: 'AT',
      q2_entity_stage: 'PRE_COMPANY',
      q3_company_size: 'MICRO_0_9',
      q4_theme: ['INNOVATION_DIGITAL'],
      q5_maturity_trl: 'TRL_3_4',
      q6_rnd_in_at: 'YES',
      q7_collaboration: 'NONE',
      q8_funding_types: ['GRANT'],
      q9_team_diversity: 'UNKNOWN',
      q10_env_benefit: 'NONE'
    }
  },
  SME_LOAN: {
    name: 'SME Loan Seeker',
    answers: {
      q1_country: 'AT',
      q2_entity_stage: 'INC_GT_36M',
      q3_company_size: 'SMALL_10_49',
      q4_theme: ['INDUSTRY_MANUFACTURING'],
      q5_maturity_trl: 'TRL_9',
      q6_rnd_in_at: 'NO',
      q7_collaboration: 'NONE',
      q8_funding_types: ['LOAN'],
      q9_team_diversity: 'NO',
      q10_env_benefit: 'SOME'
    }
  },
  VISA: {
    name: 'Visa Applicant',
    answers: {
      q1_country: 'NON_EU',
      q2_entity_stage: 'PRE_COMPANY',
      q3_company_size: 'MICRO_0_9',
      q4_theme: ['INNOVATION_DIGITAL'],
      q5_maturity_trl: 'TRL_5_6',
      q6_rnd_in_at: 'YES',
      q7_collaboration: 'NONE',
      q8_funding_types: ['VISA'],
      q9_team_diversity: 'UNKNOWN',
      q10_env_benefit: 'NONE'
    }
  }
};

// Run traces for each persona
for (const [personaId, persona] of Object.entries(personas)) {
  console.log(`👤 PERSONA: ${persona.name}`);
  console.log('=' * 50);
  
  const results = [];
  
  // Score each program for this persona
  for (const program of programsData.programs) {
    const trace = traceProgram(persona.answers, program);
    if (trace.score > 0) {
      results.push(trace);
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Show top 3 results
  console.log(`\n📊 TOP 3 RESULTS:`);
  results.slice(0, 3).forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.program.name} (${result.score}%)`);
    console.log(`   Type: ${result.program.type}`);
    console.log(`   Eligibility: ${result.eligibility}`);
    
    console.log(`\n   🔍 RULE TRACE:`);
    result.rules.forEach(rule => {
      const status = rule.passed ? '✅' : '❌';
      const type = rule.type === 'HARD' ? 'H' : rule.type === 'SOFT' ? 'S' : 'U';
      console.log(`   ${status} [${type}] ${rule.description}`);
    });
    
    console.log(`\n   💡 WHY IT FITS (Bullets):`);
    result.bullets.forEach(bullet => {
      console.log(`   • ${bullet}`);
    });
    
    if (result.gaps.length > 0) {
      console.log(`\n   ⚠️  GAPS:`);
      result.gaps.forEach(gap => {
        console.log(`   • ${gap}`);
      });
    }
  });
  
  console.log('\n' + '=' * 50 + '\n');
}

function traceProgram(answers, program) {
  const rules = [];
  const bullets = [];
  const gaps = [];
  let hardPassed = 0;
  let hardTotal = 0;
  let softPassed = 0;
  let softTotal = 0;
  
  // Check overlays
  if (program.overlays) {
    for (const overlay of program.overlays) {
      const rule = evaluateRule(overlay, answers);
      rules.push(rule);
      
      if (rule.type === 'HARD') {
        hardTotal++;
        if (rule.passed) hardPassed++;
      } else if (rule.type === 'SOFT') {
        softTotal++;
        if (rule.passed) softPassed++;
      }
    }
  }
  
  // Calculate score
  let score = 0;
  if (hardTotal > 0) {
    score += (hardPassed / hardTotal) * 60; // HARD rules worth 60%
  }
  if (softTotal > 0) {
    score += (softPassed / softTotal) * 40; // SOFT rules worth 40%
  }
  
  // Generate bullets
  if (hardPassed > 0) {
    bullets.push(`Meets ${hardPassed} critical requirement${hardPassed > 1 ? 's' : ''}`);
  }
  if (softPassed > 0) {
    bullets.push(`Matches ${softPassed} additional criteria`);
  }
  if (program.type) {
    bullets.push(`Provides ${program.type} funding`);
  }
  if (program.thresholds && program.thresholds.max_grant_eur) {
    bullets.push(`Up to €${program.thresholds.max_grant_eur.toLocaleString()} available`);
  }
  
  // Generate gaps
  rules.filter(r => !r.passed && r.type === 'HARD').forEach(rule => {
    gaps.push(rule.gapDescription || `Missing: ${rule.description}`);
  });
  
  const eligibility = hardPassed === hardTotal && hardTotal > 0 ? 'Eligible' : 'Not Eligible';
  
  return {
    program,
    score: Math.round(score),
    eligibility,
    rules,
    bullets,
    gaps
  };
}

function evaluateRule(overlay, answers) {
  const condition = overlay.ask_if;
  const passed = evaluateCondition(condition, answers);
  const type = overlay.decisiveness || 'SOFT';
  
  return {
    type,
    passed,
    description: overlay.question || overlay.rationale || 'Rule check',
    gapDescription: passed ? null : `Requires: ${overlay.question || overlay.rationale}`
  };
}

function evaluateCondition(condition, answers) {
  // Simple condition evaluation
  // This is a simplified version - in production would need full expression parser
  
  if (condition.includes('answers.q1_country in [\'AT\',\'EU\']')) {
    return answers.q1_country === 'AT' || answers.q1_country === 'EU';
  }
  
  if (condition.includes('answers.q2_entity_stage in [\'PRE_COMPANY\',\'INC_LT_6M\']')) {
    return answers.q2_entity_stage === 'PRE_COMPANY' || answers.q2_entity_stage === 'INC_LT_6M';
  }
  
  if (condition.includes('\'INNOVATION_DIGITAL\' in answers.q4_theme')) {
    return answers.q4_theme && answers.q4_theme.includes('INNOVATION_DIGITAL');
  }
  
  if (condition.includes('answers.q6_rnd_in_at == \'YES\'')) {
    return answers.q6_rnd_in_at === 'YES';
  }
  
  if (condition.includes('answers.q3_company_size in [\'MICRO_0_9\',\'SMALL_10_49\']')) {
    return answers.q3_company_size === 'MICRO_0_9' || answers.q3_company_size === 'SMALL_10_49';
  }
  
  if (condition.includes('answers.q5_maturity_trl in [\'TRL_5_6\',\'TRL_7_8\',\'TRL_9\']')) {
    return ['TRL_5_6', 'TRL_7_8', 'TRL_9'].includes(answers.q5_maturity_trl);
  }
  
  if (condition.includes('answers.q10_env_benefit in [\'STRONG\',\'SOME\']')) {
    return answers.q10_env_benefit === 'STRONG' || answers.q10_env_benefit === 'SOME';
  }
  
  // Default to false for unknown conditions
  return false;
}

#!/usr/bin/env node

// CI Coverage Check Script
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data files
const programsData = JSON.parse(readFileSync(join(__dirname, '../data/programs.json'), 'utf8'));
const questionsData = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf8'));

console.log('🔍 COVERAGE CHECK - Programs × Fields × Questions\n');

// Generate coverage report
const programs = programsData.programs;
const questions = questionsData.universal;

const gaps = [];
const fieldCoverage = {};

// Initialize field coverage counters
questions.forEach(q => {
  fieldCoverage[q.id] = 0;
});

// Check each program's coverage of each field
for (const program of programs) {
  for (const question of questions) {
    const coverage = checkFieldCoverage(program, question.id);
    
    if (!coverage.hasCoverage) {
      gaps.push({
        programId: program.id,
        programName: program.name,
        field: question.id,
        fieldLabel: question.label,
        hasCoverage: false,
        coverageType: 'NONE',
        evidence: 'No rules found for this field'
      });
    } else {
      fieldCoverage[question.id]++;
    }
  }
}

const totalPrograms = programs.length;
const totalFields = questions.length;
const totalCoverage = totalPrograms * totalFields;
const actualCoverage = totalCoverage - gaps.length;
const coveragePercentage = Math.round((actualCoverage / totalCoverage) * 100);

// Identify critical gaps (fields with <50% coverage)
const criticalGaps = gaps.filter(gap => {
  const fieldCoverageCount = fieldCoverage[gap.field];
  return fieldCoverageCount < totalPrograms * 0.5;
});

console.log('📊 COVERAGE SUMMARY:');
console.log(`Total Programs: ${totalPrograms}`);
console.log(`Total Fields: ${totalFields}`);
console.log(`Total Coverage: ${actualCoverage}/${totalCoverage} (${coveragePercentage}%)`);
console.log(`Critical Gaps: ${criticalGaps.length}\n`);

// Show coverage table
console.log('📋 COVERAGE TABLE:');
console.log('| Program | ' + questions.map(q => q.id).join(' | ') + ' |');
console.log('|---------|' + questions.map(() => '--------').join('|') + '|');

for (const program of programs) {
  const row = [program.name.substring(0, 20) + '...'];
  
  for (const question of questions) {
    const coverage = checkFieldCoverage(program, question.id);
    const symbol = coverage.hasCoverage ? 
      (coverage.coverageType === 'HARD' ? '✅ H' : 
       coverage.coverageType === 'SOFT' ? '✅ S' : '✅ U') : '❌';
    row.push(symbol);
  }
  
  console.log('| ' + row.join(' | ') + ' |');
}

console.log('\n🚨 CRITICAL GAPS:');
if (criticalGaps.length === 0) {
  console.log('✅ No critical gaps found!');
} else {
  const criticalFields = [...new Set(criticalGaps.map(g => g.field))];
  console.log(`Fields with <50% coverage: ${criticalFields.join(', ')}`);
  
  criticalFields.forEach(field => {
    const fieldGaps = criticalGaps.filter(g => g.field === field);
    console.log(`\n${field} (${fieldGaps.length} programs missing):`);
    fieldGaps.slice(0, 3).forEach(gap => {
      console.log(`  - ${gap.programName}`);
    });
    if (fieldGaps.length > 3) {
      console.log(`  ... and ${fieldGaps.length - 3} more`);
    }
  });
}

// Validation
const errors = [];

if (coveragePercentage < 70) {
  errors.push(`Overall coverage ${coveragePercentage}% is below minimum 70%`);
}

if (criticalGaps.length > 0) {
  const criticalFields = [...new Set(criticalGaps.map(g => g.field))];
  errors.push(`Critical gaps in fields: ${criticalFields.join(', ')}`);
}

for (const [field, count] of Object.entries(fieldCoverage)) {
  const coveragePercent = Math.round((count / totalPrograms) * 100);
  if (coveragePercent < 50) {
    errors.push(`Field ${field} has only ${coveragePercent}% coverage (minimum 50%)`);
  }
}

console.log('\n✅ VALIDATION:');
if (errors.length === 0) {
  console.log('✅ All coverage checks passed!');
  process.exit(0);
} else {
  console.log('❌ Coverage validation failed:');
  errors.forEach(error => console.log(`  - ${error}`));
  process.exit(1);
}

function checkFieldCoverage(program, fieldId) {
  // Check overlays for field coverage
  if (program.overlays) {
    for (const overlay of program.overlays) {
      if (overlay.ask_if && overlay.ask_if.includes(fieldId)) {
        return {
          hasCoverage: true,
          coverageType: overlay.decisiveness || 'UNCERTAIN',
          evidence: overlay.rationale || 'Field referenced in overlay'
        };
      }
    }
  }

  // Check eligibility array for field references
  if (program.eligibility) {
    for (const rule of program.eligibility) {
      const lowerRule = rule.toLowerCase();
      const fieldKeywords = getFieldKeywords(fieldId);
      
      for (const keyword of fieldKeywords) {
        if (lowerRule.includes(keyword)) {
          return {
            hasCoverage: true,
            coverageType: 'SOFT',
            evidence: `Field referenced in eligibility: ${rule}`
          };
        }
      }
    }
  }

  return {
    hasCoverage: false,
    coverageType: 'NONE',
    evidence: 'No rules found for this field'
  };
}

function getFieldKeywords(fieldId) {
  const keywords = {
    'q1_country': ['austria', 'at', 'eu', 'europe', 'country', 'location'],
    'q2_entity_stage': ['startup', 'company', 'incorporated', 'months', 'age', 'stage'],
    'q3_company_size': ['micro', 'small', 'medium', 'large', 'employees', 'fte', 'size'],
    'q4_theme': ['innovation', 'digital', 'sustainability', 'health', 'space', 'theme'],
    'q5_maturity_trl': ['trl', 'maturity', 'prototype', 'proof', 'concept', 'development'],
    'q6_rnd_in_at': ['r&d', 'research', 'development', 'austria', 'experimental'],
    'q7_collaboration': ['collaboration', 'partnership', 'research', 'institution', 'university'],
    'q8_funding_types': ['grant', 'loan', 'equity', 'funding', 'finance'],
    'q9_team_diversity': ['diversity', 'women', 'gender', 'team', 'shares'],
    'q10_env_benefit': ['environment', 'emissions', 'energy', 'waste', 'climate', 'sustainability']
  };
  
  return keywords[fieldId] || [];
}

#!/usr/bin/env node

// CI Coverage Check Script - Minimal Version for Core Functionality
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data files
const programsData = JSON.parse(readFileSync(join(__dirname, '../data/programs.json'), 'utf8'));
const questionsData = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf8'));

console.log('🔍 COVERAGE CHECK - Core Functionality Verification\n');

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

// Core functionality check - ensure key fields have some coverage
const coreFields = ['q1_country', 'q4_theme', 'q6_rnd_in_at', 'q10_env_benefit'];
const coreFieldCoverage = coreFields.map(field => ({
  field,
  coverage: fieldCoverage[field],
  percentage: Math.round((fieldCoverage[field] / totalPrograms) * 100)
}));

console.log('📊 COVERAGE SUMMARY:');
console.log(`Total Programs: ${totalPrograms}`);
console.log(`Total Fields: ${totalFields}`);
console.log(`Total Coverage: ${actualCoverage}/${totalCoverage} (${coveragePercentage}%)`);

console.log('\n🎯 CORE FUNCTIONALITY CHECK:');
coreFieldCoverage.forEach(field => {
  const status = field.percentage >= 30 ? '✅' : '⚠️';
  console.log(`${status} ${field.field}: ${field.coverage}/${totalPrograms} programs (${field.percentage}%)`);
});

// Check if dynamic question engine is working
const hasOverlays = programs.some(p => p.overlays && p.overlays.length > 0);
const totalOverlays = programs.reduce((sum, p) => sum + (p.overlays ? p.overlays.length : 0), 0);

console.log('\n🔧 DYNAMIC QUESTION ENGINE CHECK:');
console.log(`✅ Programs with overlays: ${programs.filter(p => p.overlays && p.overlays.length > 0).length}/${totalPrograms}`);
console.log(`✅ Total overlays: ${totalOverlays}`);
console.log(`✅ Questions available: ${questions.length}`);

// Validation - focus on core functionality
const errors = [];

// Check core fields have reasonable coverage
const coreFieldErrors = coreFieldCoverage.filter(f => f.percentage < 30);
if (coreFieldErrors.length > 0) {
  errors.push(`Core fields need more coverage: ${coreFieldErrors.map(f => f.field).join(', ')}`);
}

// Check overlays exist
if (!hasOverlays) {
  errors.push('No program overlays found - dynamic question engine will not work');
}

if (totalOverlays < 10) {
  errors.push(`Very few overlays (${totalOverlays}) - question ordering may be poor`);
}

console.log('\n✅ VALIDATION (Minimal Mode):');
if (errors.length === 0) {
  console.log('✅ Core functionality verified!');
  console.log('📈 Dynamic question engine is working');
  console.log('📈 Key fields have reasonable coverage');
  console.log('📈 Ready for development and testing');
  process.exit(0);
} else {
  console.log('❌ Core functionality issues:');
  errors.forEach(error => console.log(`  - ${error}`));
  console.log('\n💡 Next steps:');
  console.log('  1. Add overlays to programs.json for better question ordering');
  console.log('  2. Focus on core fields: country, theme, R&D, environment');
  console.log('  3. Run "npm run coverage" for full coverage analysis');
  process.exit(1);
}

function checkFieldCoverage(program, fieldId) {
  // Check overlays for field coverage
  if (program.overlays && Array.isArray(program.overlays)) {
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

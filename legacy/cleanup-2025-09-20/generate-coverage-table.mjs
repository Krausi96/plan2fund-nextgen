#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read programs and questions data
const programsPath = path.join(__dirname, '..', 'data', 'programs.json');
const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');

const programs = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

// Extract all question fields
const questionFields = questions.universal.map(q => q.id);

// Generate coverage matrix
function generateCoverageMatrix() {
  const matrix = [];
  
  for (const program of programs.programs) {
    const programCoverage = {
      program_id: program.id,
      program_name: program.name,
      jurisdiction: program.jurisdiction,
      type: program.type,
      coverage: {},
      total_coverage: 0,
      coverage_percentage: 0
    };
    
    // Check each question field for coverage
    for (const field of questionFields) {
      let hasCoverage = false;
      let coverageType = 'none';
      let evidence = [];
      
      // Check overlays for field coverage
      for (const overlay of program.overlays || []) {
        if (overlay.ask_if && overlay.ask_if.includes(field)) {
          hasCoverage = true;
          coverageType = overlay.decisiveness === 'HARD' ? 'hard' : 'soft';
          evidence.push(overlay.rationale);
        }
      }
      
      // Check eligibility for field coverage
      for (const eligibility of program.eligibility || []) {
        if (eligibility.toLowerCase().includes(field.replace('q', '').replace('_', ' '))) {
          hasCoverage = true;
          coverageType = 'soft';
          evidence.push(eligibility);
        }
      }
      
      programCoverage.coverage[field] = {
        covered: hasCoverage,
        type: coverageType,
        evidence: evidence
      };
      
      if (hasCoverage) {
        programCoverage.total_coverage++;
      }
    }
    
    programCoverage.coverage_percentage = Math.round((programCoverage.total_coverage / questionFields.length) * 100);
    matrix.push(programCoverage);
  }
  
  return matrix;
}

// Generate summary statistics
function generateSummaryStats(matrix) {
  const totalPrograms = matrix.length;
  const totalFields = questionFields.length;
  const totalPossibleCoverage = totalPrograms * totalFields;
  
  let totalCoverage = 0;
  let programsWithGoodCoverage = 0;
  let programsWithExcellentCoverage = 0;
  
  const fieldCoverage = {};
  
  for (const program of matrix) {
    totalCoverage += program.total_coverage;
    
    if (program.coverage_percentage >= 60) {
      programsWithGoodCoverage++;
    }
    if (program.coverage_percentage >= 80) {
      programsWithExcellentCoverage++;
    }
    
    // Field coverage stats
    for (const [field, coverage] of Object.entries(program.coverage)) {
      if (!fieldCoverage[field]) {
        fieldCoverage[field] = { total: 0, covered: 0 };
      }
      fieldCoverage[field].total++;
      if (coverage.covered) {
        fieldCoverage[field].covered++;
      }
    }
  }
  
  const overallCoveragePercentage = Math.round((totalCoverage / totalPossibleCoverage) * 100);
  
  return {
    totalPrograms,
    totalFields,
    totalPossibleCoverage,
    totalCoverage,
    overallCoveragePercentage,
    programsWithGoodCoverage,
    programsWithExcellentCoverage,
    fieldCoverage
  };
}

// Main execution
console.log('Starting coverage analysis...');

const matrix = generateCoverageMatrix();
const stats = generateSummaryStats(matrix);

console.log(`\nCoverage analysis complete!`);
console.log(`Overall coverage: ${stats.overallCoveragePercentage}%`);
console.log(`Status: ${stats.overallCoveragePercentage >= 80 ? 'PASS' : 'FAIL'}`);

// Exit with error code if coverage is below 80%
if (stats.overallCoveragePercentage < 80) {
  console.log('\n❌ Coverage validation failed - CI will fail');
  process.exit(1);
} else {
  console.log('\n✅ Coverage validation passed - CI will succeed');
  process.exit(0);
}
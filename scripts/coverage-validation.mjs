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

// Generate comprehensive coverage analysis
function generateCoverageAnalysis() {
  const matrix = [];
  const fieldStats = {};
  
  // Initialize field stats
  for (const field of questionFields) {
    fieldStats[field] = {
      total: 0,
      covered: 0,
      hard_covered: 0,
      soft_covered: 0,
      programs: []
    };
  }
  
  for (const program of programs.programs) {
    const programCoverage = {
      program_id: program.id,
      program_name: program.name,
      jurisdiction: program.jurisdiction,
      type: program.type,
      coverage: {},
      total_coverage: 0,
      coverage_percentage: 0,
      missing_fields: [],
      weak_fields: []
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
      
      // Check thresholds for field coverage
      for (const [key, value] of Object.entries(program.thresholds || {})) {
        if (key.toLowerCase().includes(field.replace('q', '').replace('_', ' '))) {
          hasCoverage = true;
          coverageType = 'soft';
          evidence.push(`${key}: ${value}`);
        }
      }
      
      programCoverage.coverage[field] = {
        covered: hasCoverage,
        type: coverageType,
        evidence: evidence
      };
      
      if (hasCoverage) {
        programCoverage.total_coverage++;
        fieldStats[field].covered++;
        if (coverageType === 'hard') {
          fieldStats[field].hard_covered++;
        } else {
          fieldStats[field].soft_covered++;
        }
        fieldStats[field].programs.push(program.id);
      } else {
        programCoverage.missing_fields.push(field);
      }
      
      if (coverageType === 'soft') {
        programCoverage.weak_fields.push(field);
      }
      
      fieldStats[field].total++;
    }
    
    programCoverage.coverage_percentage = Math.round((programCoverage.total_coverage / questionFields.length) * 100);
    matrix.push(programCoverage);
  }
  
  return { matrix, fieldStats };
}

// Generate summary statistics
function generateSummaryStats(matrix, fieldStats) {
  const totalPrograms = matrix.length;
  const totalFields = questionFields.length;
  const totalPossibleCoverage = totalPrograms * totalFields;
  
  let totalCoverage = 0;
  let programsWithGoodCoverage = 0;
  let programsWithExcellentCoverage = 0;
  let programsWithPoorCoverage = 0;
  
  for (const program of matrix) {
    totalCoverage += program.total_coverage;
    
    if (program.coverage_percentage >= 80) {
      programsWithExcellentCoverage++;
    } else if (program.coverage_percentage >= 60) {
      programsWithGoodCoverage++;
    } else {
      programsWithPoorCoverage++;
    }
  }
  
  const overallCoveragePercentage = Math.round((totalCoverage / totalPossibleCoverage) * 100);
  
  // Calculate field coverage percentages
  const fieldCoveragePercentages = {};
  for (const [field, stats] of Object.entries(fieldStats)) {
    fieldCoveragePercentages[field] = Math.round((stats.covered / stats.total) * 100);
  }
  
  return {
    totalPrograms,
    totalFields,
    totalPossibleCoverage,
    totalCoverage,
    overallCoveragePercentage,
    programsWithGoodCoverage,
    programsWithExcellentCoverage,
    programsWithPoorCoverage,
    fieldCoveragePercentages
  };
}

// Generate detailed report
function generateDetailedReport(matrix, fieldStats, stats) {
  const report = `# Program Coverage Analysis Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Programs**: ${stats.totalPrograms}
- **Total Question Fields**: ${stats.totalFields}
- **Overall Coverage**: ${stats.overallCoveragePercentage}%
- **Programs with Excellent Coverage (≥80%)**: ${stats.programsWithExcellentCoverage} (${Math.round((stats.programsWithExcellentCoverage / stats.totalPrograms) * 100)}%)
- **Programs with Good Coverage (60-79%)**: ${stats.programsWithGoodCoverage} (${Math.round((stats.programsWithGoodCoverage / stats.totalPrograms) * 100)}%)
- **Programs with Poor Coverage (<60%)**: ${stats.programsWithPoorCoverage} (${Math.round((stats.programsWithPoorCoverage / stats.totalPrograms) * 100)}%)

## Coverage Status

${stats.overallCoveragePercentage >= 80 ? '✅ **PASS** - Coverage meets 80% threshold' : '❌ **FAIL** - Coverage below 80% threshold'}

## Field Coverage Analysis

| Field | Coverage % | Hard Coverage | Soft Coverage | Programs |
|-------|------------|---------------|---------------|----------|
${Object.entries(stats.fieldCoveragePercentages).map(([field, percentage]) => {
  const fieldData = fieldStats[field];
  return `| ${field} | ${percentage}% | ${fieldData.hard_covered} | ${fieldData.soft_covered} | ${fieldData.programs.length} |`;
}).join('\n')}

## Programs with Poor Coverage (<60%)

${matrix.filter(p => p.coverage_percentage < 60).map(p => 
  `- **${p.program_name}** (${p.program_id}): ${p.coverage_percentage}% - Missing: ${p.missing_fields.join(', ')}`
).join('\n')}

## Programs with Excellent Coverage (≥80%)

${matrix.filter(p => p.coverage_percentage >= 80).map(p => 
  `- **${p.program_name}** (${p.program_id}): ${p.coverage_percentage}%`
).join('\n')}

## Recommendations

### Immediate Actions Required
${stats.overallCoveragePercentage < 80 ? `
1. **Add overlays for missing fields** - Focus on programs with <60% coverage
2. **Enhance eligibility criteria** - Include more question field references
3. **Review threshold mappings** - Connect thresholds to question fields
4. **Prioritize high-impact programs** - Focus on programs with many missing fields
` : '### Coverage is adequate - consider fine-tuning for better user experience'}

### Field-Specific Improvements
${Object.entries(stats.fieldCoveragePercentages)
  .filter(([field, percentage]) => percentage < 60)
  .map(([field, percentage]) => `- **${field}**: Only ${percentage}% coverage - needs ${fieldStats[field].total - fieldStats[field].covered} more programs`)
  .join('\n')}

## CI Validation Result

${stats.overallCoveragePercentage >= 80 ? 
  '✅ **COVERAGE VALIDATION PASSED** - Overall coverage is above 80% threshold' : 
  '❌ **COVERAGE VALIDATION FAILED** - Overall coverage is below 80% threshold. CI will fail.'}
`;

  return report;
}

// Main execution
console.log('Starting comprehensive coverage analysis...');

const { matrix, fieldStats } = generateCoverageAnalysis();
const stats = generateSummaryStats(matrix, fieldStats);

// Generate detailed report
const report = generateDetailedReport(matrix, fieldStats, stats);

// Write coverage report
const reportPath = path.join(__dirname, '..', 'docs', 'COVERAGE_TABLE.md');
fs.writeFileSync(reportPath, report);

// Write detailed coverage data as JSON
const coverageDataPath = path.join(__dirname, '..', 'docs', 'coverage-data.json');
fs.writeFileSync(coverageDataPath, JSON.stringify({
  generated: new Date().toISOString(),
  stats,
  matrix,
  fieldStats
}, null, 2));

console.log(`\nCoverage analysis complete!`);
console.log(`Overall coverage: ${stats.overallCoveragePercentage}%`);
console.log(`Programs with excellent coverage: ${stats.programsWithExcellentCoverage}`);
console.log(`Programs with poor coverage: ${stats.programsWithPoorCoverage}`);
console.log(`Status: ${stats.overallCoveragePercentage >= 80 ? 'PASS' : 'FAIL'}`);
console.log(`Report written to: ${reportPath}`);
console.log(`Data written to: ${coverageDataPath}`);

// Show top missing fields
console.log('\nTop missing fields:');
const sortedFields = Object.entries(stats.fieldCoveragePercentages)
  .sort(([,a], [,b]) => a - b)
  .slice(0, 5);
sortedFields.forEach(([field, percentage]) => {
  console.log(`  ${field}: ${percentage}%`);
});

// Exit with error code if coverage is below 80%
if (stats.overallCoveragePercentage < 80) {
  console.log('\n❌ Coverage validation failed - CI will fail');
  process.exit(1);
} else {
  console.log('\n✅ Coverage validation passed - CI will succeed');
  process.exit(0);
}


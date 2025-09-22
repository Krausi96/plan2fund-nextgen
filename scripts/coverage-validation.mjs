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

// Enhanced coverage analysis with detailed gap analysis
function generateCoverageAnalysis() {
  const matrix = [];
  const fieldStats = {};
  const coverageGaps = [];
  const criticalGaps = [];
  
  // Initialize field stats
  for (const field of questionFields) {
    fieldStats[field] = {
      total: 0,
      covered: 0,
      hard_covered: 0,
      soft_covered: 0,
      uncertain_covered: 0,
      programs: [],
      coverageType: 'NONE'
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
      weak_fields: [],
      critical_fields: []
    };
    
    // Check each question field for coverage
    for (const field of questionFields) {
      const coverage = checkFieldCoverage(program, field);
      
      programCoverage.coverage[field] = {
        covered: coverage.hasCoverage,
        type: coverage.coverageType,
        evidence: coverage.evidence
      };
      
      if (coverage.hasCoverage) {
        programCoverage.total_coverage++;
        fieldStats[field].covered++;
        
        if (coverage.coverageType === 'HARD') {
          fieldStats[field].hard_covered++;
        } else if (coverage.coverageType === 'SOFT') {
          fieldStats[field].soft_covered++;
        } else if (coverage.coverageType === 'UNCERTAIN') {
          fieldStats[field].uncertain_covered++;
        }
        
        fieldStats[field].programs.push(program.id);
      } else {
        programCoverage.missing_fields.push(field);
        
        // Add to coverage gaps
        coverageGaps.push({
          programId: program.id,
          programName: program.name,
          field: field,
          fieldLabel: getFieldLabel(field),
          hasCoverage: false,
          coverageType: 'NONE',
          evidence: 'No rules found for this field'
        });
      }
      
      if (coverage.coverageType === 'SOFT' || coverage.coverageType === 'UNCERTAIN') {
        programCoverage.weak_fields.push(field);
      }
      
      if (coverage.coverageType === 'NONE') {
        programCoverage.critical_fields.push(field);
      }
      
      fieldStats[field].total++;
    }
    
    programCoverage.coverage_percentage = Math.round((programCoverage.total_coverage / questionFields.length) * 100);
    matrix.push(programCoverage);
  }
  
  // Identify critical gaps (fields with <50% coverage)
  for (const [field, stats] of Object.entries(fieldStats)) {
    const coveragePercent = Math.round((stats.covered / stats.total) * 100);
    if (coveragePercent < 50) {
      criticalGaps.push({
        field: field,
        coveragePercent: coveragePercent,
        programs: stats.programs,
        missingPrograms: stats.total - stats.covered
      });
    }
  }
  
  return { matrix, fieldStats, coverageGaps, criticalGaps };
}

// Enhanced field coverage checking with multiple evidence sources
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

  // Check thresholds for field coverage
  if (program.thresholds) {
    for (const [key, value] of Object.entries(program.thresholds)) {
      const lowerKey = key.toLowerCase();
      const fieldKeywords = getFieldKeywords(fieldId);
      
      for (const keyword of fieldKeywords) {
        if (lowerKey.includes(keyword)) {
          return {
            hasCoverage: true,
            coverageType: 'SOFT',
            evidence: `Field referenced in thresholds: ${key}: ${value}`
          };
        }
      }
    }
  }

  // Check requirements for field coverage
  if (program.requirements) {
    for (const [key, value] of Object.entries(program.requirements)) {
      if (key === fieldId) {
        return {
          hasCoverage: true,
          coverageType: 'HARD',
          evidence: `Field has explicit requirement: ${key}: ${value}`
        };
      }
    }
  }

  return {
    hasCoverage: false,
    coverageType: 'NONE',
    evidence: 'No rules found for this field'
  };
}

// Get keywords that indicate field coverage
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

// Get human-readable field label
function getFieldLabel(fieldId) {
  const labels = {
    'q1_country': 'Country/Location',
    'q2_entity_stage': 'Company Stage',
    'q3_company_size': 'Company Size',
    'q4_theme': 'Project Theme',
    'q5_maturity_trl': 'Technology Readiness Level',
    'q6_rnd_in_at': 'R&D in Austria',
    'q7_collaboration': 'Collaboration',
    'q8_funding_types': 'Funding Types',
    'q9_team_diversity': 'Team Diversity',
    'q10_env_benefit': 'Environmental Benefit'
  };
  
  return labels[fieldId] || fieldId;
}

// Generate enhanced summary statistics with gap analysis
function generateSummaryStats(matrix, fieldStats, coverageGaps, criticalGaps) {
  const totalPrograms = matrix.length;
  const totalFields = questionFields.length;
  const totalPossibleCoverage = totalPrograms * totalFields;
  
  let totalCoverage = 0;
  let programsWithGoodCoverage = 0;
  let programsWithExcellentCoverage = 0;
  let programsWithPoorCoverage = 0;
  let programsWithCriticalGaps = 0;
  
  for (const program of matrix) {
    totalCoverage += program.total_coverage;
    
    if (program.coverage_percentage >= 80) {
      programsWithExcellentCoverage++;
    } else if (program.coverage_percentage >= 60) {
      programsWithGoodCoverage++;
    } else {
      programsWithPoorCoverage++;
    }
    
    if (program.critical_fields.length > 0) {
      programsWithCriticalGaps++;
    }
  }
  
  const overallCoveragePercentage = Math.round((totalCoverage / totalPossibleCoverage) * 100);
  
  // Calculate field coverage percentages with detailed breakdown
  const fieldCoveragePercentages = {};
  const fieldCoverageDetails = {};
  
  for (const [field, stats] of Object.entries(fieldStats)) {
    const coveragePercent = Math.round((stats.covered / stats.total) * 100);
    fieldCoveragePercentages[field] = coveragePercent;
    
    fieldCoverageDetails[field] = {
      coveragePercent,
      hardCoverage: stats.hard_covered,
      softCoverage: stats.soft_covered,
      uncertainCoverage: stats.uncertain_covered,
      totalPrograms: stats.total,
      coveredPrograms: stats.covered,
      missingPrograms: stats.total - stats.covered
    };
  }
  
  // Calculate gap statistics
  const totalGaps = coverageGaps.length;
  const criticalFieldCount = criticalGaps.length;
  const averageGapsPerProgram = Math.round(totalGaps / totalPrograms);
  
  return {
    totalPrograms,
    totalFields,
    totalPossibleCoverage,
    totalCoverage,
    overallCoveragePercentage,
    programsWithGoodCoverage,
    programsWithExcellentCoverage,
    programsWithPoorCoverage,
    programsWithCriticalGaps,
    fieldCoveragePercentages,
    fieldCoverageDetails,
    totalGaps,
    criticalFieldCount,
    averageGapsPerProgram,
    criticalGaps
  };
}

// Generate enhanced detailed report with gap analysis
function generateDetailedReport(matrix, fieldStats, stats, coverageGaps, criticalGaps) {
  const report = `# Enhanced Program Coverage Analysis Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Programs**: ${stats.totalPrograms}
- **Total Question Fields**: ${stats.totalFields}
- **Overall Coverage**: ${stats.overallCoveragePercentage}%
- **Total Coverage Gaps**: ${stats.totalGaps}
- **Critical Fields**: ${stats.criticalFieldCount}
- **Programs with Excellent Coverage (≥80%)**: ${stats.programsWithExcellentCoverage} (${Math.round((stats.programsWithExcellentCoverage / stats.totalPrograms) * 100)}%)
- **Programs with Good Coverage (60-79%)**: ${stats.programsWithGoodCoverage} (${Math.round((stats.programsWithGoodCoverage / stats.totalPrograms) * 100)}%)
- **Programs with Poor Coverage (<60%)**: ${stats.programsWithPoorCoverage} (${Math.round((stats.programsWithPoorCoverage / stats.totalPrograms) * 100)}%)
- **Programs with Critical Gaps**: ${stats.programsWithCriticalGaps} (${Math.round((stats.programsWithCriticalGaps / stats.totalPrograms) * 100)}%)

## Coverage Status

${stats.overallCoveragePercentage >= 80 ? '✅ **PASS** - Coverage meets 80% threshold' : '❌ **FAIL** - Coverage below 80% threshold'}

## Enhanced Field Coverage Analysis

| Field | Coverage % | Hard | Soft | Uncertain | Missing | Programs |
|-------|------------|------|------|-----------|---------|----------|
${Object.entries(stats.fieldCoverageDetails).map(([field, details]) => {
  return `| ${field} | ${details.coveragePercent}% | ${details.hardCoverage} | ${details.softCoverage} | ${details.uncertainCoverage} | ${details.missingPrograms} | ${details.coveredPrograms} |`;
}).join('\n')}

## Critical Field Analysis

${criticalGaps.length > 0 ? `
### Fields with <50% Coverage (Critical)

${criticalGaps.map(gap => 
  `- **${gap.field}**: ${gap.coveragePercent}% coverage (${gap.missingPrograms} programs missing)`
).join('\n')}
` : '### No critical fields - all fields have ≥50% coverage'}

## Programs with Poor Coverage (<60%)

${matrix.filter(p => p.coverage_percentage < 60).map(p => 
  `- **${p.program_name}** (${p.program_id}): ${p.coverage_percentage}% - Missing: ${p.missing_fields.join(', ')} - Critical: ${p.critical_fields.join(', ')}`
).join('\n')}

## Programs with Excellent Coverage (≥80%)

${matrix.filter(p => p.coverage_percentage >= 80).map(p => 
  `- **${p.program_name}** (${p.program_id}): ${p.coverage_percentage}%`
).join('\n')}

## Gap Analysis

### Top 10 Programs with Most Gaps

${matrix
  .sort((a, b) => b.missing_fields.length - a.missing_fields.length)
  .slice(0, 10)
  .map(p => `- **${p.program_name}**: ${p.missing_fields.length} gaps (${p.missing_fields.join(', ')})`)
  .join('\n')}

### Top 10 Fields with Most Gaps

${Object.entries(stats.fieldCoverageDetails)
  .sort(([,a], [,b]) => b.missingPrograms - a.missingPrograms)
  .slice(0, 10)
  .map(([field, details]) => `- **${field}**: ${details.missingPrograms} programs missing coverage`)
  .join('\n')}

## Recommendations

### Immediate Actions Required
${stats.overallCoveragePercentage < 80 ? `
1. **Add overlays for missing fields** - Focus on programs with <60% coverage
2. **Enhance eligibility criteria** - Include more question field references
3. **Review threshold mappings** - Connect thresholds to question fields
4. **Prioritize high-impact programs** - Focus on programs with many missing fields
5. **Address critical fields** - ${criticalGaps.length} fields need immediate attention
` : '### Coverage is adequate - consider fine-tuning for better user experience'}

### Field-Specific Improvements
${Object.entries(stats.fieldCoverageDetails)
  .filter(([field, details]) => details.coveragePercent < 60)
  .map(([field, details]) => `- **${field}**: Only ${details.coveragePercent}% coverage - needs ${details.missingPrograms} more programs`)
  .join('\n')}

### Program-Specific Improvements
${matrix
  .filter(p => p.coverage_percentage < 60)
  .slice(0, 5)
  .map(p => `- **${p.program_name}**: Add coverage for ${p.missing_fields.slice(0, 3).join(', ')}`)
  .join('\n')}

## CI Validation Result

${stats.overallCoveragePercentage >= 80 ? 
  '✅ **COVERAGE VALIDATION PASSED** - Overall coverage is above 80% threshold' : 
  '❌ **COVERAGE VALIDATION FAILED** - Overall coverage is below 80% threshold. CI will fail.'}
`;

  return report;
}

// Main execution
console.log('Starting enhanced coverage analysis with gap detection...');

const { matrix, fieldStats, coverageGaps, criticalGaps } = generateCoverageAnalysis();
const stats = generateSummaryStats(matrix, fieldStats, coverageGaps, criticalGaps);

// Generate detailed report
const report = generateDetailedReport(matrix, fieldStats, stats, coverageGaps, criticalGaps);

// Write coverage report
const reportPath = path.join(__dirname, '..', 'docs', 'COVERAGE_TABLE.md');
fs.writeFileSync(reportPath, report);

// Write detailed coverage data as JSON
const coverageDataPath = path.join(__dirname, '..', 'docs', 'coverage-data.json');
fs.writeFileSync(coverageDataPath, JSON.stringify({
  generated: new Date().toISOString(),
  stats,
  matrix,
  fieldStats,
  coverageGaps,
  criticalGaps
}, null, 2));

console.log(`\nEnhanced coverage analysis complete!`);
console.log(`Overall coverage: ${stats.overallCoveragePercentage}%`);
console.log(`Total gaps: ${stats.totalGaps}`);
console.log(`Critical fields: ${stats.criticalFieldCount}`);
console.log(`Programs with excellent coverage: ${stats.programsWithExcellentCoverage}`);
console.log(`Programs with poor coverage: ${stats.programsWithPoorCoverage}`);
console.log(`Programs with critical gaps: ${stats.programsWithCriticalGaps}`);
console.log(`Status: ${stats.overallCoveragePercentage >= 80 ? 'PASS' : 'FAIL'}`);
console.log(`Report written to: ${reportPath}`);
console.log(`Data written to: ${coverageDataPath}`);

// Show top missing fields
console.log('\nTop missing fields:');
const sortedFields = Object.entries(stats.fieldCoverageDetails)
  .sort(([,a], [,b]) => a.missingPrograms - b.missingPrograms)
  .slice(0, 5);
sortedFields.forEach(([field, details]) => {
  console.log(`  ${field}: ${details.coveragePercent}% (${details.missingPrograms} missing)`);
});

// Show critical gaps
if (criticalGaps.length > 0) {
  console.log('\nCritical fields (<50% coverage):');
  criticalGaps.forEach(gap => {
    console.log(`  ${gap.field}: ${gap.coveragePercent}% (${gap.missingPrograms} missing)`);
  });
}

// Exit with error code if coverage is below 80%
if (stats.overallCoveragePercentage < 80) {
  console.log('\n❌ Coverage validation failed - CI will fail');
  process.exit(1);
} else {
  console.log('\n✅ Coverage validation passed - CI will succeed');
  process.exit(0);
}


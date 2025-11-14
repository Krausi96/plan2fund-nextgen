/**
 * Ranking Algorithm Validation Test Suite
 * 
 * Purpose: Validate that our ranking algorithm actually works
 * - Do high scores mean better matches?
 * - Are programs ranked correctly?
 * - Do users agree with the ranking?
 * 
 * Run: npx tsx scripts/validate-ranking-algorithm.ts
 */

import { scoreProgramsEnhanced, EnhancedProgramResult } from '../features/reco/engine/enhancedRecoEngine';
import { UserAnswers } from '../features/reco/engine/enhancedRecoEngine';

interface ValidationTestCase {
  name: string;
  userProfile: UserAnswers;
  expectedTopPrograms: string[]; // Program IDs that should rank high
  expectedLowPrograms: string[]; // Program IDs that should rank low
  description: string;
  why: string; // Why we expect this ranking
}

// Mock programs for testing
const MOCK_PROGRAMS = [
  // Austrian programs (should match Austrian users)
  {
    id: 'ffg_austria',
    name: 'FFG General Programme',
    type: 'grant',
    program_type: 'grant',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'Austria', confidence: 0.95 }],
      eligibility: [{ type: 'company_type', value: 'startup', confidence: 0.9 }],
      metadata: {
        funding_amount_min: 50000,
        funding_amount_max: 500000,
      },
      project: [{ type: 'industry_focus', value: 'digital', confidence: 0.8 }],
    },
  },
  {
    id: 'aws_austria',
    name: 'AWS Seedfinancing',
    type: 'grant',
    program_type: 'grant',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'Austria', confidence: 0.95 }],
      eligibility: [{ type: 'company_type', value: 'startup', confidence: 0.9 }],
      metadata: {
        funding_amount_min: 100000,
        funding_amount_max: 300000,
      },
      project: [{ type: 'industry_focus', value: 'digital', confidence: 0.7 }],
    },
  },
  {
    id: 'vienna_business_agency',
    name: 'Vienna Business Agency',
    type: 'grant',
    program_type: 'grant',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'Vienna, Austria', confidence: 0.9 }],
      eligibility: [{ type: 'company_type', value: 'startup', confidence: 0.85 }],
      metadata: {
        funding_amount_min: 50000,
        funding_amount_max: 200000,
      },
    },
  },
  // German programs (should NOT match Austrian users)
  {
    id: 'kfw_germany',
    name: 'KfW Startup Loan',
    type: 'loan',
    program_type: 'loan',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'Germany', confidence: 0.95 }],
      eligibility: [{ type: 'company_type', value: 'startup', confidence: 0.9 }],
      metadata: {
        funding_amount_min: 100000,
        funding_amount_max: 500000,
      },
    },
  },
  {
    id: 'baytp_germany',
    name: 'BayTP+',
    type: 'grant',
    program_type: 'grant',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'Bavaria, Germany', confidence: 0.9 }],
      eligibility: [{ type: 'company_type', value: 'sme', confidence: 0.85 }],
      metadata: {
        funding_amount_min: 200000,
        funding_amount_max: 1000000,
      },
    },
  },
  // EU programs (should match EU users, not Austria-only)
  {
    id: 'horizon_europe',
    name: 'Horizon Europe',
    type: 'grant',
    program_type: 'grant',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'EU', confidence: 0.9 }],
      eligibility: [{ type: 'company_type', value: 'research', confidence: 0.95 }],
      metadata: {
        funding_amount_min: 500000,
        funding_amount_max: 2000000,
      },
      project: [{ type: 'industry_focus', value: 'health', confidence: 0.8 }],
    },
  },
  // Research programs (should match research institutions)
  {
    id: 'ihi_research',
    name: 'Innovative Health Initiative',
    type: 'grant',
    program_type: 'grant',
    categorized_requirements: {
      geographic: [{ type: 'location', value: 'EU', confidence: 0.9 }],
      eligibility: [{ type: 'company_type', value: 'research', confidence: 0.95 }],
      metadata: {
        funding_amount_min: 1000000,
        funding_amount_max: 5000000,
      },
      project: [{ type: 'industry_focus', value: 'health', confidence: 0.9 }],
    },
  },
];

// Test cases with known good/bad matches
const VALIDATION_TEST_CASES: ValidationTestCase[] = [
  {
    name: 'Austrian Startup - Should Match Austrian Programs',
    userProfile: {
      location: 'austria',
      company_type: 'startup',
      funding_amount: '100kto500k',
      industry_focus: ['digital'],
    },
    expectedTopPrograms: ['ffg_austria', 'aws_austria', 'vienna_business_agency'],
    expectedLowPrograms: ['kfw_germany', 'baytp_germany', 'horizon_europe'],
    description: 'Austrian startup should match Austrian programs, not German/EU-only programs',
    why: 'Location is a hard blocker (22% weight). Austrian programs should score high, German programs should score low or be filtered out.',
  },
  {
    name: 'German SME - Should Match German Programs',
    userProfile: {
      location: 'germany',
      company_type: 'sme',
      funding_amount: '500kto2m',
      industry_focus: ['manufacturing'],
    },
    expectedTopPrograms: ['kfw_germany', 'baytp_germany'],
    expectedLowPrograms: ['ffg_austria', 'aws_austria', 'vienna_business_agency'],
    description: 'German SME should match German programs, not Austrian programs',
    why: 'Location mismatch should cause Austrian programs to score very low or be filtered out.',
  },
  {
    name: 'EU Research Institution - Should Match EU Programs',
    userProfile: {
      location: 'eu',
      company_type: 'research',
      funding_amount: 'over2m',
      industry_focus: ['health'],
    },
    expectedTopPrograms: ['horizon_europe', 'ihi_research'],
    expectedLowPrograms: ['ffg_austria', 'aws_austria', 'kfw_germany'],
    description: 'EU research institution should match EU research programs, not national programs',
    why: 'Company type (research) and location (EU) should match EU research programs. National programs should score low.',
  },
  {
    name: 'Austrian Startup - Funding Amount Mismatch',
    userProfile: {
      location: 'austria',
      company_type: 'startup',
      funding_amount: 'under100k', // Very low funding need
      industry_focus: ['digital'],
    },
    expectedTopPrograms: ['vienna_business_agency'], // Lower funding range
    expectedLowPrograms: ['horizon_europe', 'ihi_research'], // Very high funding requirements
    description: 'Startup with low funding need should match programs with lower funding ranges',
    why: 'Funding amount is critical (18% weight). Programs with very high minimums should score low.',
  },
  {
    name: 'Austrian Startup - Industry Mismatch',
    userProfile: {
      location: 'austria',
      company_type: 'startup',
      funding_amount: '100kto500k',
      industry_focus: ['sustainability'], // Different industry
    },
    expectedTopPrograms: ['ffg_austria', 'aws_austria'], // Should still match (location + company type)
    expectedLowPrograms: ['horizon_europe'], // Health focus, shouldn't match
    description: 'Industry mismatch should reduce score but not eliminate match if location/type match',
    why: 'Industry is important (15% weight) but not a hard blocker. Location (22%) and company type (20%) should still allow match.',
  },
];

interface ValidationResult {
  testCase: ValidationTestCase;
  passed: boolean;
  top5Programs: string[];
  top5Scores: number[];
  issues: string[];
  details: {
    expectedTopFound: number;
    expectedTopTotal: number;
    expectedLowInTop5: number;
    expectedLowTotal: number;
    scoreDistribution: {
      high: number; // ≥70%
      medium: number; // 50-69%
      low: number; // <50%
    };
  };
}

async function validateRanking() {
  console.log('🧪 RANKING ALGORITHM VALIDATION TEST SUITE\n');
  console.log('Purpose: Validate that our ranking algorithm actually works\n');
  console.log('='.repeat(80));
  console.log();

  const results: ValidationResult[] = [];

  for (const testCase of VALIDATION_TEST_CASES) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Why: ${testCase.why}`);
    console.log(`   User Profile:`, testCase.userProfile);

    try {
      // Score all programs
      const scored = await scoreProgramsEnhanced(
        testCase.userProfile,
        'strict',
        MOCK_PROGRAMS as any
      );

      // Filter out zero-score programs and sort by score (highest first)
      const validPrograms = scored.filter(p => p.score > 0);
      const sorted = validPrograms.sort((a, b) => b.score - a.score);
      const top5 = sorted.slice(0, 5);

      // Extract program IDs and scores
      const top5Ids = top5.map(p => p.id);
      const top5Scores = top5.map(p => p.score);

      // Check if expected top programs are in top 5
      const expectedTopFound = testCase.expectedTopPrograms.filter(id =>
        top5Ids.includes(id)
      ).length;

      // Check if expected low programs are in top 5 (should be 0)
      const expectedLowInTop5 = testCase.expectedLowPrograms.filter(id =>
        top5Ids.includes(id)
      ).length;

      // Analyze score distribution
      const scoreDistribution = {
        high: sorted.filter(p => p.score >= 70).length,
        medium: sorted.filter(p => p.score >= 50 && p.score < 70).length,
        low: sorted.filter(p => p.score < 50).length,
      };

      // Determine if test passed
      const passed =
        expectedTopFound >= testCase.expectedTopPrograms.length * 0.6 && // At least 60% of expected top programs found
        expectedLowInTop5 === 0; // No expected low programs in top 5

      const issues: string[] = [];
      if (expectedTopFound < testCase.expectedTopPrograms.length) {
        const missing = testCase.expectedTopPrograms.filter(id => !top5Ids.includes(id));
        issues.push(`Missing expected top programs: ${missing.join(', ')}`);
      }
      if (expectedLowInTop5 > 0) {
        const unexpected = testCase.expectedLowPrograms.filter(id => top5Ids.includes(id));
        issues.push(`Unexpected low programs in top 5: ${unexpected.join(', ')}`);
      }

      const result: ValidationResult = {
        testCase,
        passed,
        top5Programs: top5Ids,
        top5Scores,
        issues,
        details: {
          expectedTopFound,
          expectedTopTotal: testCase.expectedTopPrograms.length,
          expectedLowInTop5,
          expectedLowTotal: testCase.expectedLowPrograms.length,
          scoreDistribution,
        },
      };

      results.push(result);

      // Print results
      console.log(`\n   Results:`);
      console.log(`   ✅ Top 5 Programs: ${top5Ids.join(', ')}`);
      console.log(`   📊 Top 5 Scores: ${top5Scores.map(s => `${s.toFixed(1)}%`).join(', ')}`);
      console.log(`   📈 Score Distribution: High (≥70%): ${scoreDistribution.high}, Medium (50-69%): ${scoreDistribution.medium}, Low (<50%): ${scoreDistribution.low}`);
      console.log(`\n   Validation:`);
      console.log(`   - Expected top programs found: ${expectedTopFound}/${testCase.expectedTopPrograms.length}`);
      console.log(`   - Expected low programs in top 5: ${expectedLowInTop5} (should be 0)`);
      
      if (passed) {
        console.log(`   ✅ TEST PASSED`);
      } else {
        console.log(`   ❌ TEST FAILED`);
        issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
      }

      // Show detailed ranking
      console.log(`\n   Detailed Ranking:`);
      sorted.forEach((program, index) => {
        const isExpectedTop = testCase.expectedTopPrograms.includes(program.id);
        const isExpectedLow = testCase.expectedLowPrograms.includes(program.id);
        const marker = isExpectedTop ? '✅' : isExpectedLow ? '❌' : '  ';
        console.log(`   ${marker} ${index + 1}. ${program.id}: ${program.score.toFixed(1)}% (${program.eligibility})`);
      });

    } catch (error: any) {
      console.error(`   ❌ ERROR: ${error.message}`);
      results.push({
        testCase,
        passed: false,
        top5Programs: [],
        top5Scores: [],
        issues: [`Error: ${error.message}`],
        details: {
          expectedTopFound: 0,
          expectedTopTotal: testCase.expectedTopPrograms.length,
          expectedLowInTop5: 0,
          expectedLowTotal: testCase.expectedLowPrograms.length,
          scoreDistribution: { high: 0, medium: 0, low: 0 },
        },
      });
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 VALIDATION SUMMARY\n');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (failedTests > 0) {
    console.log('Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`\n❌ ${r.testCase.name}`);
        r.issues.forEach(issue => console.log(`   - ${issue}`));
      });
  }

  // Overall assessment
  console.log(`\n${'='.repeat(80)}`);
  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED - Ranking algorithm appears to be working correctly!');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️  MOST TESTS PASSED - Ranking algorithm mostly works, but some issues detected.');
    console.log('   Recommendation: Review failed tests and adjust weights/scoring if needed.');
  } else {
    console.log('❌ MANY TESTS FAILED - Ranking algorithm may have issues.');
    console.log('   Recommendation: Review scoring algorithm, weights, and normalization logic.');
  }
  console.log('='.repeat(80));

  return results;
}

// Run validation
if (require.main === module) {
  validateRanking()
    .then(() => {
      console.log('\n✅ Validation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateRanking, VALIDATION_TEST_CASES, MOCK_PROGRAMS };


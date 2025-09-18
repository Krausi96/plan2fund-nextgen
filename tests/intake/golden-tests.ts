// Golden Test Set - 10 Test Cases
import { intakeParser } from '@/lib/intakeParser';
import { FundingProfile } from '@/lib/schemas/fundingProfile';

interface GoldenTestCase {
  name: string;
  input: string;
  expected: Partial<FundingProfile>;
  description: string;
}

export const GOLDEN_TEST_CASES: GoldenTestCase[] = [
  {
    name: 'B2C Ideal Case',
    input: '3-person Healthtech startup in Vienna, MVP stage, needs €200k grant for clinical pilot',
    expected: {
      sector: 'Health',
      stage: 'mvp',
      team_size: 3,
      location_city: 'Vienna',
      location_country: 'AT',
      funding_need_eur: 200000,
      program_type: 'grant',
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Perfect B2C founder case with all fields populated'
  },
  
  {
    name: 'SME Loan Case',
    input: '15-employee carpentry business in Graz, established company, seeking €500k bank loan for expansion',
    expected: {
      sector: 'Manufacturing',
      stage: 'revenue',
      team_size: 15,
      location_city: 'Graz',
      location_country: 'AT',
      funding_need_eur: 500000,
      program_type: 'loan',
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'SME loan application with established business'
  },
  
  {
    name: 'Visa Applicant Case',
    input: 'Single founder from India, wants startup visa in Austria, AI SaaS platform',
    expected: {
      sector: 'AI',
      stage: 'idea',
      team_size: 1,
      location_country: 'AT',
      program_type: 'visa',
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Visa applicant with international background'
  },
  
  {
    name: 'Research Collaboration Case',
    input: 'TU Wien spin-off, 5 researchers, TRL 6, seeking €1M FFG grant for research collaboration',
    expected: {
      sector: 'Research',
      stage: 'mvp',
      team_size: 5,
      location_city: 'Vienna',
      location_country: 'AT',
      trl: 6,
      funding_need_eur: 1000000,
      program_type: 'grant',
      collaboration: 'yes',
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Research collaboration with TRL and university spin-off'
  },
  
  {
    name: 'Missing Amount Case',
    input: 'Solo founder, fintech idea, based in Salzburg, looking for funding',
    expected: {
      sector: 'Fintech',
      stage: 'idea',
      team_size: 1,
      location_city: 'Salzburg',
      location_country: 'AT',
      funding_need_eur: null,
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Missing funding amount - should trigger overlay question'
  },
  
  {
    name: 'Ambiguous Sector Case',
    input: 'Creative industries team, 4 people, need funding to grow the business',
    expected: {
      sector: 'Creative',
      stage: 'growth',
      team_size: 4,
      funding_need_eur: null,
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Ambiguous sector that should map to Creative'
  },
  
  {
    name: 'German Input Case',
    input: 'Biotech Team aus Wien, 6 Personen, 250.000 EUR Förderung für klinische Studie',
    expected: {
      sector: 'Health',
      stage: null,
      team_size: 6,
      location_city: 'Vienna',
      location_country: 'AT',
      funding_need_eur: 250000,
      program_type: 'grant',
      language: 'DE',
      intent: 'business_intake'
    },
    description: 'German language input with proper mapping'
  },
  
  {
    name: 'Off-topic Case',
    input: 'Write me a poem about startups and grants',
    expected: {
      intent: 'offtopic',
      language: 'EN'
    },
    description: 'Off-topic input should be classified correctly'
  },
  
  {
    name: 'Scale-up EU Grant Case',
    input: '50-person SaaS company in Linz, €2M revenue, applying for Horizon Europe grant',
    expected: {
      sector: 'Tech',
      stage: 'scaleup',
      team_size: 50,
      location_city: 'Linz',
      location_country: 'AT',
      program_type: 'grant',
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Scale-up company applying for EU funding'
  },
  
  {
    name: 'Semi-structured Case',
    input: 'Stage: MVP, Sector: AI, Team: 2, Funding: €75k, Location: Vienna',
    expected: {
      sector: 'AI',
      stage: 'mvp',
      team_size: 2,
      location_city: 'Vienna',
      location_country: 'AT',
      funding_need_eur: 75000,
      language: 'EN',
      intent: 'business_intake'
    },
    description: 'Semi-structured input with exact field mapping'
  }
];

export class GoldenTestRunner {
  private results: Array<{
    testCase: string;
    passed: boolean;
    details: string;
    actual: Partial<FundingProfile>;
    expected: Partial<FundingProfile>;
    processingTime: number;
  }> = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Running Golden Test Suite...\n');

    for (const testCase of GOLDEN_TEST_CASES) {
      await this.runTestCase(testCase);
    }

    this.generateReport();
  }

  private async runTestCase(testCase: GoldenTestCase): Promise<void> {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.input}"`);

    try {
      const startTime = Date.now();
      const result = await intakeParser.parseInput(testCase.input, 'test_session');
      const processingTime = Date.now() - startTime;

      const validation = this.validateTestCase(result.profile, testCase.expected);
      
      this.results.push({
        testCase: testCase.name,
        passed: validation.passed,
        details: validation.details,
        actual: this.extractRelevantFields(result.profile),
        expected: testCase.expected,
        processingTime
      });

      if (validation.passed) {
        console.log(`   ✅ PASSED (${processingTime}ms)`);
      } else {
        console.log(`   ❌ FAILED: ${validation.details}`);
      }

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      this.results.push({
        testCase: testCase.name,
        passed: false,
        details: `Error: ${error.message}`,
        actual: {},
        expected: testCase.expected,
        processingTime: 0
      });
    }

    console.log('');
  }

  private validateTestCase(actual: FundingProfile, expected: Partial<FundingProfile>): { passed: boolean; details: string } {
    const errors: string[] = [];

    // Check each expected field
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (key === 'confidence') continue; // Skip confidence validation in golden tests
      
      const actualValue = actual[key as keyof FundingProfile];
      
      if (expectedValue === null) {
        if (actualValue !== null && actualValue !== undefined) {
          errors.push(`${key}: expected null, got ${actualValue}`);
        }
      } else if (expectedValue !== actualValue) {
        errors.push(`${key}: expected "${expectedValue}", got "${actualValue}"`);
      }
    }

    // Check processing time (P95 should be ≤2.5s)
    if (actual.parsed_at) {
      const processingTime = new Date(actual.parsed_at).getTime() - new Date().getTime();
      if (Math.abs(processingTime) > 2500) {
        errors.push(`Processing time exceeded 2.5s: ${Math.abs(processingTime)}ms`);
      }
    }

    return {
      passed: errors.length === 0,
      details: errors.length > 0 ? errors.join('; ') : 'All validations passed'
    };
  }

  private extractRelevantFields(profile: FundingProfile): Partial<FundingProfile> {
    return {
      sector: profile.sector,
      stage: profile.stage,
      team_size: profile.team_size,
      location_city: profile.location_city,
      location_country: profile.location_country,
      funding_need_eur: profile.funding_need_eur,
      program_type: profile.program_type,
      collaboration: profile.collaboration,
      trl: profile.trl,
      language: profile.language,
      intent: profile.intent
    };
  }

  private generateReport(): void {
    console.log('📊 Golden Test Report');
    console.log('====================');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const avgProcessingTime = this.results.reduce((sum, r) => sum + r.processingTime, 0) / totalTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`Failed: ${failedTests} (${Math.round((failedTests / totalTests) * 100)}%)`);
    console.log(`Average Processing Time: ${Math.round(avgProcessingTime)}ms`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testCase}: ${r.details}`);
        });
    }

    // Performance check
    const slowTests = this.results.filter(r => r.processingTime > 2500);
    if (slowTests.length > 0) {
      console.log('\n⚠️  Slow Tests (>2.5s):');
      slowTests.forEach(r => {
        console.log(`  - ${r.testCase}: ${r.processingTime}ms`);
      });
    }

    console.log('\n✅ Golden test suite completed');
  }

  getResults() {
    return this.results;
  }
}

// Export for use in CI
export async function runGoldenTests(): Promise<boolean> {
  const runner = new GoldenTestRunner();
  await runner.runAllTests();
  const results = runner.getResults();
  return results.every(r => r.passed);
}

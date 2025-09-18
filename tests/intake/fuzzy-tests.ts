// Fuzzy Test Set - Robustness Cases
import { intakeParser } from '@/lib/intakeParser';
import { FundingProfile } from '@/lib/schemas/fundingProfile';

interface FuzzyTestCase {
  name: string;
  input: string;
  expected: {
    amount?: number | null;
    currency?: string | null;
    city?: string | null;
    country?: string | null;
    stage?: string | null;
    sector?: string | null;
    intent?: string | null;
  };
  description: string;
}

export const FUZZY_TEST_CASES: FuzzyTestCase[] = [
  // Amount normalization tests
  {
    name: 'Amount 150k',
    input: 'Startup needs 150k funding',
    expected: { amount: 150000, currency: 'EUR' },
    description: 'Simple k notation'
  },
  {
    name: 'Amount 150.000 EUR',
    input: 'Looking for 150.000 EUR investment',
    expected: { amount: 150000, currency: 'EUR' },
    description: 'German number format with EUR'
  },
  {
    name: 'Amount €150,000',
    input: 'Seeking €150,000 in funding',
    expected: { amount: 150000, currency: 'EUR' },
    description: 'Comma separator with Euro symbol'
  },
  {
    name: 'Amount 150 000 Euro',
    input: 'Need 150 000 Euro for expansion',
    expected: { amount: 150000, currency: 'EUR' },
    description: 'Space separator with Euro text'
  },
  {
    name: 'Amount ca. 200k',
    input: 'Approximately ca. 200k needed',
    expected: { amount: 200000, currency: 'EUR' },
    description: 'Approximate amount with k'
  },
  {
    name: 'Amount 0,5 Mio €',
    input: 'Half a million 0,5 Mio € required',
    expected: { amount: 500000, currency: 'EUR' },
    description: 'German million format'
  },
  {
    name: 'Amount 2 million',
    input: 'Seeking 2 million in funding',
    expected: { amount: 2000000, currency: 'EUR' },
    description: 'English million format'
  },

  // Currency detection tests
  {
    name: 'USD 50k',
    input: 'Need USD 50k for US expansion',
    expected: { amount: null, currency: 'USD' },
    description: 'Non-EUR currency should leave amount null'
  },
  {
    name: 'CHF 100.000',
    input: 'Swiss company needs CHF 100.000',
    expected: { amount: null, currency: 'CHF' },
    description: 'Swiss franc should be detected but not converted'
  },

  // Location mapping tests
  {
    name: 'Wien Location',
    input: 'Startup in Wien looking for funding',
    expected: { city: 'Vienna', country: 'AT' },
    description: 'Wien should map to Vienna, Austria'
  },
  {
    name: 'Remote EU Location',
    input: 'Remote EU team seeking funding',
    expected: { city: null, country: null },
    description: 'Remote EU should trigger overlay question for city'
  },

  // Stage mapping tests
  {
    name: 'Prototype Stage',
    input: 'Prototype stage startup needs funding',
    expected: { stage: 'mvp' },
    description: 'Prototype should map to MVP'
  },
  {
    name: 'Beta Stage',
    input: 'Beta version ready, seeking investment',
    expected: { stage: 'mvp' },
    description: 'Beta should map to MVP'
  },
  {
    name: 'Market Ready Stage',
    input: 'Market ready product, looking for growth capital',
    expected: { stage: 'revenue' },
    description: 'Market ready should map to revenue'
  },
  {
    name: 'Growth Stage',
    input: 'Growth stage company seeking Series A',
    expected: { stage: 'growth' },
    description: 'Growth stage should map to growth'
  },
  {
    name: 'Scaling Stage',
    input: 'Scaling business needs expansion funding',
    expected: { stage: 'scaleup' },
    description: 'Scaling should map to scaleup'
  },

  // Sector mapping tests
  {
    name: 'Medtech Sector',
    input: 'Medtech startup developing AI diagnostics',
    expected: { sector: 'Health' },
    description: 'Medtech should map to Health'
  },
  {
    name: 'Creative Industry Sector',
    input: 'Creative industry agency seeking funding',
    expected: { sector: 'Creative' },
    description: 'Creative industry should map to Creative'
  },
  {
    name: 'AI/ML Sector',
    input: 'AI/ML platform for data analysis',
    expected: { sector: 'AI' },
    description: 'AI/ML should map to AI'
  },
  {
    name: 'Machine Learning Sector',
    input: 'Machine learning startup in Vienna',
    expected: { sector: 'AI' },
    description: 'Machine learning should map to AI'
  },
  {
    name: 'Green Energy Sector',
    input: 'Green energy solutions for sustainability',
    expected: { sector: 'GreenTech' },
    description: 'Green energy should map to GreenTech'
  },

  // Off-topic detection tests
  {
    name: 'Haiku Off-topic',
    input: 'Write a haiku about AWS PreSeed funding',
    expected: { intent: 'offtopic' },
    description: 'Haiku request should be classified as off-topic'
  },
  {
    name: 'Poem Off-topic',
    input: 'Can you write me a poem about startups?',
    expected: { intent: 'offtopic' },
    description: 'Poem request should be classified as off-topic'
  },
  {
    name: 'Joke Off-topic',
    input: 'Tell me a joke about venture capital',
    expected: { intent: 'offtopic' },
    description: 'Joke request should be classified as off-topic'
  },

  // Edge cases
  {
    name: 'Empty Input',
    input: '',
    expected: { intent: null },
    description: 'Empty input should not crash'
  },
  {
    name: 'Very Long Input',
    input: 'A'.repeat(10000),
    expected: { intent: 'business_intake' },
    description: 'Very long input should be processed'
  },
  {
    name: 'Special Characters',
    input: 'Startup with @#$%^&*() symbols',
    expected: { intent: 'business_intake' },
    description: 'Special characters should not break parsing'
  },
  {
    name: 'Mixed Languages',
    input: 'Startup in Wien with team of 5, seeking €100k funding',
    expected: { 
      city: 'Vienna', 
      country: 'AT', 
      team_size: 5, 
      amount: 100000,
      language: 'EN'
    },
    description: 'Mixed languages should work correctly'
  }
];

export class FuzzyTestRunner {
  private results: Array<{
    testCase: string;
    passed: boolean;
    details: string;
    actual: Partial<FundingProfile>;
    expected: Partial<FundingProfile>;
    processingTime: number;
  }> = [];

  async runAllTests(): Promise<void> {
    console.log('🔍 Running Fuzzy Test Suite...\n');

    for (const testCase of FUZZY_TEST_CASES) {
      await this.runTestCase(testCase);
    }

    this.generateReport();
  }

  private async runTestCase(testCase: FuzzyTestCase): Promise<void> {
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
      const actualValue = actual[key as keyof FundingProfile];
      
      if (expectedValue === null) {
        if (actualValue !== null && actualValue !== undefined) {
          errors.push(`${key}: expected null, got ${actualValue}`);
        }
      } else if (expectedValue !== actualValue) {
        errors.push(`${key}: expected "${expectedValue}", got "${actualValue}"`);
      }
    }

    // Check processing time (should be ≤2.5s)
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
      intent: profile.intent,
      currency_detected: profile.currency_detected
    };
  }

  private generateReport(): void {
    console.log('📊 Fuzzy Test Report');
    console.log('===================');

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

    console.log('\n✅ Fuzzy test suite completed');
  }

  getResults() {
    return this.results;
  }
}

// Export for use in CI
export async function runFuzzyTests(): Promise<boolean> {
  const runner = new FuzzyTestRunner();
  await runner.runAllTests();
  const results = runner.getResults();
  return results.every(r => r.passed);
}

// CI Test Suite for Intake Parser
import { runGoldenTests } from './golden-tests';
import { runFuzzyTests } from './fuzzy-tests';
import { intakeParser } from '@/lib/intakeParser';
import { validateFundingProfile } from '@/lib/schemas/fundingProfile';

interface CITestResult {
  suite: string;
  passed: boolean;
  duration: number;
  details: string;
}

class CITestRunner {
  private results: CITestResult[] = [];

  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting CI Test Suite...\n');

    // Run Golden Tests
    const goldenResult = await this.runGoldenTests();
    this.results.push(goldenResult);

    // Run Fuzzy Tests
    const fuzzyResult = await this.runFuzzyTests();
    this.results.push(fuzzyResult);

    // Run Performance Tests
    const performanceResult = await this.runPerformanceTests();
    this.results.push(performanceResult);

    // Run Schema Validation Tests
    const schemaResult = await this.runSchemaValidationTests();
    this.results.push(schemaResult);

    // Generate CI Report
    this.generateCIReport();

    return this.results.every(r => r.passed);
  }

  private async runGoldenTests(): Promise<CITestResult> {
    const startTime = Date.now();
    
    try {
      const passed = await runGoldenTests();
      const duration = Date.now() - startTime;
      
      return {
        suite: 'Golden Tests',
        passed,
        duration,
        details: passed ? 'All 10 golden test cases passed' : 'Some golden test cases failed'
      };
    } catch (error) {
      return {
        suite: 'Golden Tests',
        passed: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async runFuzzyTests(): Promise<CITestResult> {
    const startTime = Date.now();
    
    try {
      const passed = await runFuzzyTests();
      const duration = Date.now() - startTime;
      
      return {
        suite: 'Fuzzy Tests',
        passed,
        duration,
        details: passed ? 'All fuzzy test cases passed' : 'Some fuzzy test cases failed'
      };
    } catch (error) {
      return {
        suite: 'Fuzzy Tests',
        passed: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async runPerformanceTests(): Promise<CITestResult> {
    const startTime = Date.now();
    
    try {
      const testInputs = [
        'Healthtech startup in Vienna, 3 founders, MVP stage, seeking €200k grant',
        'SME manufacturing company in Graz, 15 employees, established business, needs €500k loan',
        'AI platform from India, single founder, idea stage, wants startup visa in Austria',
        'TU Wien research spin-off, 5 researchers, TRL 6, seeking €1M FFG grant',
        'Creative agency in Salzburg, 4 people, growth stage, looking for funding'
      ];

      const performanceResults = await Promise.all(
        testInputs.map(async (input) => {
          const testStart = Date.now();
          await intakeParser.parseInput(input, 'perf_test');
          return Date.now() - testStart;
        })
      );

      const maxTime = Math.max(...performanceResults);
      const avgTime = performanceResults.reduce((sum, time) => sum + time, 0) / performanceResults.length;
      const p95Time = performanceResults.sort((a, b) => a - b)[Math.floor(performanceResults.length * 0.95)];

      const passed = p95Time <= 2500; // P95 should be ≤2.5s
      const duration = Date.now() - startTime;

      return {
        suite: 'Performance Tests',
        passed,
        duration,
        details: `P95: ${p95Time}ms, Avg: ${Math.round(avgTime)}ms, Max: ${maxTime}ms (threshold: 2500ms)`
      };
    } catch (error) {
      return {
        suite: 'Performance Tests',
        passed: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async runSchemaValidationTests(): Promise<CITestResult> {
    const startTime = Date.now();
    
    try {
      const testCases = [
        // Valid profile
        {
          sector: 'Health',
          stage: 'mvp' as const,
          team_size: 3,
          location_city: 'Vienna',
          location_country: 'AT',
          funding_need_eur: 200000,
          program_type: 'grant' as const,
          language: 'EN' as const,
          intent: 'business_intake' as const,
          confidence: {
            sector: 0.9,
            stage: 0.8,
            team_size: 0.9,
            location_city: 0.8,
            location_country: 0.8,
            funding_need_eur: 0.9,
            program_type: 0.8,
            collaboration: 0.0,
            trl: 0.0,
            language: 0.9,
            intent: 0.9
          },
          raw_input: 'Healthtech startup in Vienna, 3 founders, MVP stage, seeking €200k grant',
          parsed_at: new Date().toISOString(),
          session_id: 'test_session'
        },
        // Invalid profile (missing required fields)
        {
          raw_input: 'test',
          session_id: 'test_session'
        },
        // Invalid profile (invalid confidence values)
        {
          sector: 'Health',
          confidence: {
            sector: 1.5, // Invalid confidence > 1.0
            stage: 0.0,
            team_size: 0.0,
            location_city: 0.0,
            location_country: 0.0,
            funding_need_eur: 0.0,
            program_type: 0.0,
            collaboration: 0.0,
            trl: 0.0,
            language: 0.0,
            intent: 0.0
          },
          raw_input: 'test',
          session_id: 'test_session'
        }
      ];

      let passed = 0;
      let failed = 0;

      for (const testCase of testCases) {
        const result = validateFundingProfile(testCase);
        if (testCase === testCases[0]) {
          // First case should be valid
          if (result) passed++;
          else failed++;
        } else {
          // Other cases should be invalid
          if (!result) passed++;
          else failed++;
        }
      }

      const allPassed = failed === 0;
      const duration = Date.now() - startTime;

      return {
        suite: 'Schema Validation Tests',
        passed: allPassed,
        duration,
        details: `Passed: ${passed}, Failed: ${failed}`
      };
    } catch (error) {
      return {
        suite: 'Schema Validation Tests',
        passed: false,
        duration: Date.now() - startTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateCIReport(): void {
    console.log('\n📊 CI Test Report');
    console.log('==================');

    const totalSuites = this.results.length;
    const passedSuites = this.results.filter(r => r.passed).length;
    const failedSuites = totalSuites - passedSuites;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Test Suites: ${totalSuites}`);
    console.log(`Passed: ${passedSuites} (${Math.round((passedSuites / totalSuites) * 100)}%)`);
    console.log(`Failed: ${failedSuites} (${Math.round((failedSuites / totalSuites) * 100)}%)`);
    console.log(`Total Duration: ${totalDuration}ms`);

    console.log('\n📋 Suite Details:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.suite}: ${result.details} (${result.duration}ms)`);
    });

    if (failedSuites > 0) {
      console.log('\n❌ Failed Suites:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.suite}: ${r.details}`);
        });
    }

    // Performance check
    const performanceResult = this.results.find(r => r.suite === 'Performance Tests');
    if (performanceResult && !performanceResult.passed) {
      console.log('\n⚠️  Performance Issue: P95 latency exceeds 2.5s threshold');
    }

    console.log('\n🎯 CI Test Summary:');
    if (passedSuites === totalSuites) {
      console.log('✅ All tests passed! Ready for deployment.');
    } else {
      console.log('❌ Some tests failed. Please fix before deployment.');
    }
  }

  getResults() {
    return this.results;
  }
}

// Export for use in CI/CD
export async function runCITests(): Promise<boolean> {
  const runner = new CITestRunner();
  return await runner.runAllTests();
}

// Export for use in GitHub Actions
export async function runIntakeCITests(): Promise<{ success: boolean; results: CITestResult[] }> {
  const runner = new CITestRunner();
  const success = await runner.runAllTests();
  return {
    success,
    results: runner.getResults()
  };
}

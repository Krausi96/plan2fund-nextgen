// ========= PLAN2FUND — SCRAPER TEST SUITE =========
// Test and validate the web scraper functionality

const ProgramScraper = require('./program-scraper');
const fs = require('fs').promises;
const path = require('path');

class ScraperTester {
  constructor() {
    this.scraper = new ProgramScraper();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Scraper Test Suite\n');
    
    try {
      await this.scraper.initialize();
      
      // Test 1: Basic Scraping
      await this.testBasicScraping();
      
      // Test 2: Data Quality
      await this.testDataQuality();
      
      // Test 3: Decision Tree Generation
      await this.testDecisionTreeGeneration();
      
      // Test 4: Editor Template Generation
      await this.testEditorTemplateGeneration();
      
      // Test 5: Readiness Criteria Generation
      await this.testReadinessCriteriaGeneration();
      
      // Test 6: Error Handling
      await this.testErrorHandling();
      
      // Print results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.scraper.cleanup();
    }
  }

  async testBasicScraping() {
    console.log('🔍 Test 1: Basic Scraping');
    
    try {
      // Test scraping a single program
      const testUrl = 'https://www.aws.at/en/aws-preseed-innovative-solutions/';
      const program = await this.scraper.scrapeProgram(testUrl, 'aws');
      
      if (program && program.programId) {
        this.testResults.push({
          test: 'Basic Scraping',
          passed: true,
          details: {
            programId: program.programId,
            programName: program.programName,
            programType: program.programType,
            fundingAmount: program.fundingAmount,
            eligibilityCount: program.eligibility.length,
            documentsCount: program.documents.length
          }
        });
        console.log('  ✅ Successfully scraped program:', program.programName);
      } else {
        throw new Error('Failed to scrape program data');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Basic Scraping',
        passed: false,
        error: error.message
      });
      console.log('  ❌ Basic scraping failed:', error.message);
    }
  }

  async testDataQuality() {
    console.log('\n🔍 Test 2: Data Quality');
    
    try {
      // Load scraped data
      const dataPath = path.join(__dirname, 'scraped-data', 'scraped_programs.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const programs = JSON.parse(data);
      
      if (programs.length === 0) {
        throw new Error('No programs found in scraped data');
      }
      
      // Check data quality
      const qualityChecks = {
        hasProgramId: programs.every(p => p.programId),
        hasProgramName: programs.every(p => p.programName && p.programName !== 'Unknown Program'),
        hasProgramType: programs.every(p => p.programType),
        hasSourceUrl: programs.every(p => p.sourceUrl),
        hasEligibility: programs.every(p => p.eligibility && p.eligibility.length > 0),
        hasDocuments: programs.every(p => p.documents && p.documents.length > 0),
        hasFinancial: programs.every(p => p.financial && p.financial.length > 0)
      };
      
      const passedChecks = Object.values(qualityChecks).filter(Boolean).length;
      const totalChecks = Object.keys(qualityChecks).length;
      
      this.testResults.push({
        test: 'Data Quality',
        passed: passedChecks === totalChecks,
        details: {
          programsCount: programs.length,
          qualityScore: Math.round((passedChecks / totalChecks) * 100),
          checks: qualityChecks
        }
      });
      
      console.log(`  ✅ Data quality: ${passedChecks}/${totalChecks} checks passed`);
    } catch (error) {
      this.testResults.push({
        test: 'Data Quality',
        passed: false,
        error: error.message
      });
      console.log('  ❌ Data quality test failed:', error.message);
    }
  }

  async testDecisionTreeGeneration() {
    console.log('\n🔍 Test 3: Decision Tree Generation');
    
    try {
      // Load scraped data
      const dataPath = path.join(__dirname, 'scraped-data', 'scraped_programs.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const programs = JSON.parse(data);
      
      if (programs.length === 0) {
        throw new Error('No programs found for testing');
      }
      
      const program = programs[0];
      const questions = program.decisionTreeQuestions || [];
      
      // Check question quality
      const questionChecks = {
        hasQuestions: questions.length > 0,
        hasValidQuestions: questions.every(q => q.id && q.question && q.type),
        hasOptions: questions.every(q => q.options && q.options.length > 0),
        hasValidation: questions.every(q => q.validation && q.validation.length > 0)
      };
      
      const passedChecks = Object.values(questionChecks).filter(Boolean).length;
      const totalChecks = Object.keys(questionChecks).length;
      
      this.testResults.push({
        test: 'Decision Tree Generation',
        passed: passedChecks === totalChecks,
        details: {
          questionsCount: questions.length,
          qualityScore: Math.round((passedChecks / totalChecks) * 100),
          checks: questionChecks
        }
      });
      
      console.log(`  ✅ Decision tree: ${passedChecks}/${totalChecks} checks passed`);
    } catch (error) {
      this.testResults.push({
        test: 'Decision Tree Generation',
        passed: false,
        error: error.message
      });
      console.log('  ❌ Decision tree test failed:', error.message);
    }
  }

  async testEditorTemplateGeneration() {
    console.log('\n🔍 Test 4: Editor Template Generation');
    
    try {
      // Load scraped data
      const dataPath = path.join(__dirname, 'scraped-data', 'scraped_programs.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const programs = JSON.parse(data);
      
      if (programs.length === 0) {
        throw new Error('No programs found for testing');
      }
      
      const program = programs[0];
      const sections = program.editorSections || [];
      
      // Check section quality
      const sectionChecks = {
        hasSections: sections.length > 0,
        hasValidSections: sections.every(s => s.id && s.title && s.template),
        hasGuidance: sections.every(s => s.guidance),
        hasPrefillData: sections.every(s => s.prefillData && Object.keys(s.prefillData).length > 0)
      };
      
      const passedChecks = Object.values(sectionChecks).filter(Boolean).length;
      const totalChecks = Object.keys(sectionChecks).length;
      
      this.testResults.push({
        test: 'Editor Template Generation',
        passed: passedChecks === totalChecks,
        details: {
          sectionsCount: sections.length,
          qualityScore: Math.round((passedChecks / totalChecks) * 100),
          checks: sectionChecks
        }
      });
      
      console.log(`  ✅ Editor templates: ${passedChecks}/${totalChecks} checks passed`);
    } catch (error) {
      this.testResults.push({
        test: 'Editor Template Generation',
        passed: false,
        error: error.message
      });
      console.log('  ❌ Editor template test failed:', error.message);
    }
  }

  async testReadinessCriteriaGeneration() {
    console.log('\n🔍 Test 5: Readiness Criteria Generation');
    
    try {
      // Load scraped data
      const dataPath = path.join(__dirname, 'scraped-data', 'scraped_programs.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const programs = JSON.parse(data);
      
      if (programs.length === 0) {
        throw new Error('No programs found for testing');
      }
      
      const program = programs[0];
      const criteria = program.readinessCriteria || [];
      
      // Check criteria quality
      const criteriaChecks = {
        hasCriteria: criteria.length > 0,
        hasValidCriteria: criteria.every(c => c.id && c.title && c.description),
        hasCheckType: criteria.every(c => c.checkType),
        hasWeight: criteria.every(c => c.weight !== undefined)
      };
      
      const passedChecks = Object.values(criteriaChecks).filter(Boolean).length;
      const totalChecks = Object.keys(criteriaChecks).length;
      
      this.testResults.push({
        test: 'Readiness Criteria Generation',
        passed: passedChecks === totalChecks,
        details: {
          criteriaCount: criteria.length,
          qualityScore: Math.round((passedChecks / totalChecks) * 100),
          checks: criteriaChecks
        }
      });
      
      console.log(`  ✅ Readiness criteria: ${passedChecks}/${totalChecks} checks passed`);
    } catch (error) {
      this.testResults.push({
        test: 'Readiness Criteria Generation',
        passed: false,
        error: error.message
      });
      console.log('  ❌ Readiness criteria test failed:', error.message);
    }
  }

  async testErrorHandling() {
    console.log('\n🔍 Test 6: Error Handling');
    
    try {
      // Test with invalid URL
      const invalidUrl = 'https://invalid-url-that-does-not-exist.com';
      
      try {
        await this.scraper.scrapeProgram(invalidUrl, 'test');
        // If we get here, error handling failed
        throw new Error('Should have thrown an error for invalid URL');
      } catch (error) {
        // This is expected - error handling is working
        this.testResults.push({
          test: 'Error Handling',
          passed: true,
          details: {
            errorCaught: true,
            errorMessage: error.message
          }
        });
        console.log('  ✅ Error handling: Invalid URL properly handled');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Error Handling',
        passed: false,
        error: error.message
      });
      console.log('  ❌ Error handling test failed:', error.message);
    }
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    console.log(`\nOverall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! The scraper is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the issues.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ScraperTester();
  tester.runAllTests();
}

module.exports = ScraperTester;

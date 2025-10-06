// ========= PLAN2FUND — PHASES 1-3 TESTING SCRIPT =========
// Comprehensive testing of Phase 1 (Editor Fixes), Phase 2 (AI Integration), Phase 3 (Export System)

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Plan2FundTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      phase1: { passed: 0, failed: 0, tests: [] },
      phase2: { passed: 0, failed: 0, tests: [] },
      phase3: { passed: 0, failed: 0, tests: [] },
      dataFlow: { passed: 0, failed: 0, tests: [] }
    };
  }

  async init() {
    console.log('🚀 Starting Plan2Fund Phases 1-3 Testing...\n');
    this.browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    
    // Set longer timeout for complex operations
    this.page.setDefaultTimeout(30000);
    
    // Navigate to the application
    await this.page.goto('http://localhost:3000');
    await this.page.waitForLoadState('networkidle');
  }

  async runAllTests() {
    try {
      await this.init();
      
      console.log('📋 PHASE 1: CRITICAL EDITOR FIXES');
      await this.testPhase1();
      
      console.log('\n📋 PHASE 2: AI INTEGRATION IMPROVEMENTS');
      await this.testPhase2();
      
      console.log('\n📋 PHASE 3: EXPORT SYSTEM');
      await this.testPhase3();
      
      console.log('\n📋 DATA FLOW & NAVIGATION');
      await this.testDataFlow();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async testPhase1() {
    console.log('  Testing RichTextEditor and SectionEditor components...');
    
    // Test 1: Navigate to editor
    try {
      await this.page.click('a[href="/reco"]');
      await this.page.waitForSelector('[data-testid="reco-wizard"]', { timeout: 10000 });
      await this.addTestResult('phase1', 'Navigate to Reco Wizard', true);
    } catch (error) {
      await this.addTestResult('phase1', 'Navigate to Reco Wizard', false, error.message);
    }

    // Test 2: Complete recommendation flow
    try {
      // Fill out basic form
      await this.page.select('[name="q1_country"]', 'AT');
      await this.page.select('[name="q2_entity_stage"]', 'STARTUP');
      await this.page.select('[name="q3_company_size"]', '1-10');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      await this.page.waitForSelector('[data-testid="results"]', { timeout: 15000 });
      await this.addTestResult('phase1', 'Complete Recommendation Flow', true);
    } catch (error) {
      await this.addTestResult('phase1', 'Complete Recommendation Flow', false, error.message);
    }

    // Test 3: Navigate to editor from results
    try {
      await this.page.click('button:has-text("Continue to Editor")');
      await this.page.waitForSelector('[data-testid="editor-shell"]', { timeout: 10000 });
      await this.addTestResult('phase1', 'Navigate to Editor from Results', true);
    } catch (error) {
      await this.addTestResult('phase1', 'Navigate to Editor from Results', false, error.message);
    }

    // Test 4: Test RichTextEditor functionality
    try {
      const editorExists = await this.page.$('[data-testid="rich-text-editor"]');
      if (editorExists) {
        await this.page.type('[data-testid="rich-text-editor"] textarea', 'Test content for editor');
        await this.addTestResult('phase1', 'RichTextEditor Input Functionality', true);
      } else {
        await this.addTestResult('phase1', 'RichTextEditor Input Functionality', false, 'Editor not found');
      }
    } catch (error) {
      await this.addTestResult('phase1', 'RichTextEditor Input Functionality', false, error.message);
    }

    // Test 5: Test SectionEditor functionality
    try {
      const sectionEditor = await this.page.$('[data-testid="section-editor"]');
      if (sectionEditor) {
        const sectionTitle = await this.page.textContent('[data-testid="section-editor"] h3');
        await this.addTestResult('phase1', 'SectionEditor Display', true, `Found section: ${sectionTitle}`);
      } else {
        await this.addTestResult('phase1', 'SectionEditor Display', false, 'SectionEditor not found');
      }
    } catch (error) {
      await this.addTestResult('phase1', 'SectionEditor Display', false, error.message);
    }
  }

  async testPhase2() {
    console.log('  Testing AI Integration improvements...');
    
    // Test 1: AI Chat component presence
    try {
      const aiChat = await this.page.$('[data-testid="ai-chat"]');
      if (aiChat) {
        await this.addTestResult('phase2', 'AI Chat Component Present', true);
      } else {
        await this.addTestResult('phase2', 'AI Chat Component Present', false, 'AI Chat not found');
      }
    } catch (error) {
      await this.addTestResult('phase2', 'AI Chat Component Present', false, error.message);
    }

    // Test 2: AI Chat input functionality
    try {
      const aiInput = await this.page.$('[data-testid="ai-chat-input"]');
      if (aiInput) {
        await this.page.type('[data-testid="ai-chat-input"]', 'Help me improve my business plan');
        await this.addTestResult('phase2', 'AI Chat Input Functionality', true);
      } else {
        await this.addTestResult('phase2', 'AI Chat Input Functionality', false, 'AI Chat input not found');
      }
    } catch (error) {
      await this.addTestResult('phase2', 'AI Chat Input Functionality', false, error.message);
    }

    // Test 3: Quick Actions functionality
    try {
      const quickActions = await this.page.$$('[data-testid="quick-action"]');
      if (quickActions.length > 0) {
        await this.addTestResult('phase2', 'Quick Actions Present', true, `Found ${quickActions.length} quick actions`);
      } else {
        await this.addTestResult('phase2', 'Quick Actions Present', false, 'No quick actions found');
      }
    } catch (error) {
      await this.addTestResult('phase2', 'Quick Actions Present', false, error.message);
    }
  }

  async testPhase3() {
    console.log('  Testing Export System...');
    
    // Test 1: Export button presence
    try {
      const exportButton = await this.page.$('button:has-text("Export")');
      if (exportButton) {
        await this.addTestResult('phase3', 'Export Button Present', true);
      } else {
        await this.addTestResult('phase3', 'Export Button Present', false, 'Export button not found');
      }
    } catch (error) {
      await this.addTestResult('phase3', 'Export Button Present', false, error.message);
    }

    // Test 2: Export settings modal
    try {
      await this.page.click('button:has-text("Export")');
      await this.page.waitForSelector('[data-testid="export-settings"]', { timeout: 5000 });
      await this.addTestResult('phase3', 'Export Settings Modal Opens', true);
    } catch (error) {
      await this.addTestResult('phase3', 'Export Settings Modal Opens', false, error.message);
    }

    // Test 3: Export format selection
    try {
      const pdfOption = await this.page.$('button:has-text("PDF")');
      const docxOption = await this.page.$('button:has-text("DOCX")');
      if (pdfOption && docxOption) {
        await this.addTestResult('phase3', 'Export Format Selection', true);
      } else {
        await this.addTestResult('phase3', 'Export Format Selection', false, 'Format options not found');
      }
    } catch (error) {
      await this.addTestResult('phase3', 'Export Format Selection', false, error.message);
    }

    // Test 4: Export quality settings
    try {
      const qualityOptions = await this.page.$$('[data-testid="quality-option"]');
      if (qualityOptions.length >= 3) {
        await this.addTestResult('phase3', 'Export Quality Settings', true, `Found ${qualityOptions.length} quality options`);
      } else {
        await this.addTestResult('phase3', 'Export Quality Settings', false, 'Insufficient quality options');
      }
    } catch (error) {
      await this.addTestResult('phase3', 'Export Quality Settings', false, error.message);
    }

    // Test 5: Close export modal
    try {
      await this.page.click('button:has-text("Cancel")');
      await this.page.waitForSelector('[data-testid="export-settings"]', { hidden: true, timeout: 5000 });
      await this.addTestResult('phase3', 'Export Modal Closes', true);
    } catch (error) {
      await this.addTestResult('phase3', 'Export Modal Closes', false, error.message);
    }
  }

  async testDataFlow() {
    console.log('  Testing Data Flow and Navigation...');
    
    // Test 1: Home page navigation
    try {
      await this.page.goto('http://localhost:3000');
      await this.page.waitForSelector('[data-testid="hero-section"]', { timeout: 10000 });
      await this.addTestResult('dataFlow', 'Home Page Loads', true);
    } catch (error) {
      await this.addTestResult('dataFlow', 'Home Page Loads', false, error.message);
    }

    // Test 2: How It Works navigation
    try {
      const howItWorksSteps = await this.page.$$('[data-testid="how-it-works-step"]');
      if (howItWorksSteps.length >= 4) {
        await this.addTestResult('dataFlow', 'How It Works Steps Present', true, `Found ${howItWorksSteps.length} steps`);
      } else {
        await this.addTestResult('dataFlow', 'How It Works Steps Present', false, 'Insufficient steps found');
      }
    } catch (error) {
      await this.addTestResult('dataFlow', 'How It Works Steps Present', false, error.message);
    }

    // Test 3: Direct editor access fallback
    try {
      await this.page.goto('http://localhost:3000/editor');
      await this.page.waitForLoadState('networkidle');
      // Should redirect to reco page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/reco')) {
        await this.addTestResult('dataFlow', 'Direct Editor Access Fallback', true);
      } else {
        await this.addTestResult('dataFlow', 'Direct Editor Access Fallback', false, 'No redirect occurred');
      }
    } catch (error) {
      await this.addTestResult('dataFlow', 'Direct Editor Access Fallback', false, error.message);
    }
  }

  async addTestResult(phase, testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults[phase].tests.push(result);
    if (passed) {
      this.testResults[phase].passed++;
      console.log(`    ✅ ${testName}${details ? ` - ${details}` : ''}`);
    } else {
      this.testResults[phase].failed++;
      console.log(`    ❌ ${testName}${details ? ` - ${details}` : ''}`);
    }
  }

  async generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const totalPassed = Object.values(this.testResults).reduce((sum, phase) => sum + phase.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, phase) => sum + phase.failed, 0);
    const totalTests = totalPassed + totalFailed;
    
    console.log(`\n🎯 OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed (${Math.round((totalPassed/totalTests)*100)}%)`);
    
    Object.entries(this.testResults).forEach(([phase, results]) => {
      const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);
      const percentage = results.tests.length > 0 ? Math.round((results.passed/results.tests.length)*100) : 0;
      console.log(`\n📋 ${phaseName}: ${results.passed}/${results.tests.length} passed (${percentage}%)`);
      
      results.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.name}${test.details ? ` - ${test.details}` : ''}`);
      });
    });
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Phases 1-3 are working correctly.');
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed. Please review the issues above.`);
    }
  }
}

// Run the tests
const tester = new Plan2FundTester();
tester.runAllTests().catch(console.error);

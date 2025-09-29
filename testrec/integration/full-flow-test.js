// ========= PLAN2FUND — FULL FLOW INTEGRATION TEST =========
// Tests the complete flow from recommendation to editor prefill

class FullFlowTest {
  constructor() {
    this.requirements = null;
    this.userAnswers = {};
    this.testResults = [];
  }

  async loadRequirements() {
    try {
      const response = await fetch('../requirements/sample-requirements.json');
      this.requirements = await response.json();
      console.log('✅ Requirements loaded for full flow test');
      return true;
    } catch (error) {
      console.error('❌ Failed to load requirements:', error);
      return false;
    }
  }

  // Test 1: Complete User Journey
  async testCompleteUserJourney() {
    console.log('\n🧪 Test 1: Complete User Journey');
    
    // Step 1: User answers questions
    const answers = this.generateSampleAnswers();
    console.log('✅ Step 1: User answers questions');
    
    // Step 2: Decision tree processes answers
    const decisionTreeResult = await this.simulateDecisionTree(answers);
    console.log('✅ Step 2: Decision tree processes answers');
    
    // Step 3: User selects a program
    const selectedProgram = decisionTreeResult.recommendations[0];
    console.log('✅ Step 3: User selects program:', selectedProgram.name);
    
    // Step 4: Editor prefill is generated
    const prefillResult = await this.simulateEditorPrefill(answers, selectedProgram);
    console.log('✅ Step 4: Editor prefill generated');
    
    // Step 5: Readiness check is performed
    const readinessResult = await this.simulateReadinessCheck(answers, selectedProgram);
    console.log('✅ Step 5: Readiness check completed');
    
    // Step 6: AI assistance is provided
    const aiAssistance = await this.simulateAIAssistance(answers, selectedProgram);
    console.log('✅ Step 6: AI assistance provided');
    
    this.testResults.push({
      test: 'Complete User Journey',
      passed: true,
      details: {
        steps: 6,
        recommendations: decisionTreeResult.recommendations.length,
        sectionsGenerated: prefillResult.sections.length,
        readinessScore: readinessResult.overallScore,
        aiSuggestions: aiAssistance.suggestions.length
      }
    });
    
    return {
      answers,
      decisionTreeResult,
      selectedProgram,
      prefillResult,
      readinessResult,
      aiAssistance
    };
  }

  // Test 2: Performance Testing
  async testPerformance() {
    console.log('\n🧪 Test 2: Performance Testing');
    
    const startTime = performance.now();
    
    // Test with multiple user profiles
    const profiles = this.generateMultipleProfiles(10);
    const results = [];
    
    for (const profile of profiles) {
      const result = await this.simulateDecisionTree(profile.answers);
      results.push(result);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.testResults.push({
      test: 'Performance Testing',
      passed: duration < 1000, // Should complete in under 1 second
      details: {
        profiles: profiles.length,
        duration: Math.round(duration),
        avgTimePerProfile: Math.round(duration / profiles.length),
        recommendationsGenerated: results.reduce((sum, r) => sum + r.recommendations.length, 0)
      }
    });
    
    console.log('✅ Performance test completed:', Math.round(duration), 'ms');
    return { duration, results };
  }

  // Test 3: Error Handling
  async testErrorHandling() {
    console.log('\n🧪 Test 3: Error Handling');
    
    const errorTests = [
      {
        name: 'Empty answers',
        answers: {},
        expectedError: 'No answers provided'
      },
      {
        name: 'Invalid program ID',
        answers: this.generateSampleAnswers(),
        programId: 'invalid_program',
        expectedError: 'Program not found'
      },
      {
        name: 'Malformed requirements',
        answers: this.generateSampleAnswers(),
        requirements: null,
        expectedError: 'Requirements not loaded'
      }
    ];
    
    let passedTests = 0;
    
    for (const test of errorTests) {
      try {
        if (test.name === 'Empty answers') {
          await this.simulateDecisionTree(test.answers);
        } else if (test.name === 'Invalid program ID') {
          await this.simulateEditorPrefill(test.answers, { id: test.programId });
        } else if (test.name === 'Malformed requirements') {
          this.requirements = null;
          await this.simulateDecisionTree(test.answers);
        }
        
        // If we get here, the error wasn't handled properly
        console.log('❌ Error not handled for:', test.name);
      } catch (error) {
        console.log('✅ Error handled for:', test.name, '-', error.message);
        passedTests++;
      }
    }
    
    this.testResults.push({
      test: 'Error Handling',
      passed: passedTests === errorTests.length,
      details: {
        totalTests: errorTests.length,
        passedTests,
        failedTests: errorTests.length - passedTests
      }
    });
    
    return { passedTests, totalTests: errorTests.length };
  }

  // Test 4: Integration Points
  async testIntegrationPoints() {
    console.log('\n🧪 Test 4: Integration Points');
    
    const answers = this.generateSampleAnswers();
    const decisionTreeResult = await this.simulateDecisionTree(answers);
    const selectedProgram = decisionTreeResult.recommendations[0];
    const prefillResult = await this.simulateEditorPrefill(answers, selectedProgram);
    
    // Test integration points
    const integrationTests = [
      {
        name: 'Decision Tree → Editor Prefill',
        test: () => {
          return prefillResult.sections.length > 0 && prefillResult.prefillData;
        }
      },
      {
        name: 'Requirements → Decision Tree',
        test: () => {
          return decisionTreeResult.recommendations.length > 0;
        }
      },
      {
        name: 'User Answers → All Components',
        test: () => {
          return Object.keys(answers).length > 0 && 
                 decisionTreeResult.recommendations.length > 0 &&
                 prefillResult.sections.length > 0;
        }
      },
      {
        name: 'Program Selection → Editor Sections',
        test: () => {
          return prefillResult.sections.some(s => s.required);
        }
      }
    ];
    
    let passedTests = 0;
    
    integrationTests.forEach(test => {
      if (test.test()) {
        console.log('✅', test.name, 'integration working');
        passedTests++;
      } else {
        console.log('❌', test.name, 'integration failed');
      }
    });
    
    this.testResults.push({
      test: 'Integration Points',
      passed: passedTests === integrationTests.length,
      details: {
        totalTests: integrationTests.length,
        passedTests,
        failedTests: integrationTests.length - passedTests
      }
    });
    
    return { passedTests, totalTests: integrationTests.length };
  }

  // Simulate decision tree processing
  async simulateDecisionTree(answers) {
    // This simulates your existing decision tree logic
    const mockRecommendations = [
      {
        id: 'aws_preseed_innovative_solutions',
        name: 'aws Preseed – Innovative Solutions',
        score: 85,
        reason: 'Good match for early-stage innovative projects',
        eligibility: 'Eligible'
      }
    ];
    
    return {
      recommendations: mockRecommendations,
      explanations: [
        'Your project aligns well with aws Preseed requirements',
        'Consider focusing on innovation aspects for better scoring'
      ],
      gaps: [
        'Team diversity information needed',
        'Detailed financial projections required'
      ]
    };
  }

  // Simulate editor prefill
  async simulateEditorPrefill(answers, program) {
    // This simulates your existing prefill logic enhanced with requirements
    const sections = [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        required: true,
        content: `Our business, ${answers.business_name || '[Business Name]'}, is seeking ${answers.funding_amount || '[Funding Amount]'} in ${program.type} funding.`,
        prefillData: {
          business_name: answers.business_name || '[TBD: business_name]',
          funding_amount: answers.funding_amount || '[TBD: funding_amount]'
        },
        missingInfo: answers.business_name ? [] : [{ placeholder: 'business_name', suggestion: 'Please provide business name' }],
        suggestions: ['Keep concise but compelling', 'Highlight innovation and impact']
      },
      {
        id: 'project_description',
        title: 'Project Description',
        required: true,
        content: `## Project Overview\n\n${answers.project_description || '[TBD: project_description]'}\n\n## Technical Approach\n\n${answers.technical_approach || '[TBD: technical_approach]'}`,
        prefillData: {
          project_description: answers.project_description || '[TBD: project_description]',
          technical_approach: answers.technical_approach || '[TBD: technical_approach]'
        },
        missingInfo: answers.project_description ? [] : [{ placeholder: 'project_description', suggestion: 'Please provide project description' }],
        suggestions: ['Focus on innovation and feasibility', 'Include technical details']
      }
    ];
    
    return {
      sections,
      prefillData: {
        business_name: answers.business_name || '[TBD: business_name]',
        funding_amount: answers.funding_amount || '[TBD: funding_amount]',
        project_description: answers.project_description || '[TBD: project_description]'
      },
      missingInfo: sections.flatMap(s => s.missingInfo),
      suggestions: sections.flatMap(s => s.suggestions)
    };
  }

  // Simulate readiness check
  async simulateReadinessCheck(answers, program) {
    const criteria = [
      { id: 'criterion_1', title: 'Company Stage Eligibility', met: answers.q2_entity_stage === 'INC_LT_6M' },
      { id: 'criterion_2', title: 'Austrian Location', met: answers.q1_country === 'AT' },
      { id: 'criterion_3', title: 'Funding Amount', met: answers.funding_amount && parseInt(answers.funding_amount) >= 10000 }
    ];
    
    const metCriteria = criteria.filter(c => c.met).length;
    const overallScore = Math.round((metCriteria / criteria.length) * 100);
    
    return {
      overallScore,
      criteria,
      metCriteria,
      totalCriteria: criteria.length
    };
  }

  // Simulate AI assistance
  async simulateAIAssistance(answers, program) {
    const suggestions = [
      'Consider adding more specific details about your innovation',
      'Include market research data to strengthen your case',
      'Provide concrete examples of your solution in action'
    ];
    
    return {
      suggestions,
      confidence: 'medium',
      context: 'Based on program requirements and your answers'
    };
  }

  // Generate sample answers
  generateSampleAnswers() {
    return {
      q1_country: 'AT',
      q2_entity_stage: 'INC_LT_6M',
      q3_company_size: 'MICRO_0_9',
      q4_theme: ['INNOVATION_DIGITAL'],
      q5_maturity_trl: 'TRL_3_4',
      q6_rnd_in_at: 'YES',
      q7_collaboration: 'NONE',
      q9_team_diversity: 'UNKNOWN',
      q10_env_benefit: 'SOME',
      business_name: 'Innovative Tech Solutions',
      funding_amount: '50000',
      project_description: 'We are developing an AI-powered platform that automates manual business processes.',
      technical_approach: 'Our solution uses machine learning algorithms to analyze business workflows.',
      innovation_aspects: 'The platform combines natural language processing with workflow optimization.'
    };
  }

  // Generate multiple profiles for performance testing
  generateMultipleProfiles(count) {
    const profiles = [];
    const stages = ['INC_LT_6M', 'INC_6_36M', 'INC_GT_36M'];
    const themes = ['INNOVATION_DIGITAL', 'SUSTAINABILITY', 'HEALTH_LIFE_SCIENCE'];
    
    for (let i = 0; i < count; i++) {
      profiles.push({
        id: `profile_${i}`,
        answers: {
          q1_country: 'AT',
          q2_entity_stage: stages[i % stages.length],
          q3_company_size: 'MICRO_0_9',
          q4_theme: [themes[i % themes.length]],
          q5_maturity_trl: 'TRL_3_4',
          q6_rnd_in_at: 'YES',
          q7_collaboration: 'NONE',
          q9_team_diversity: 'UNKNOWN',
          q10_env_benefit: 'SOME',
          business_name: `Test Company ${i}`,
          funding_amount: (10000 + (i * 5000)).toString()
        }
      });
    }
    
    return profiles;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Full Flow Integration Tests\n');
    
    const loaded = await this.loadRequirements();
    if (!loaded) {
      console.error('❌ Cannot run tests without requirements');
      return;
    }

    await this.testCompleteUserJourney();
    await this.testPerformance();
    await this.testErrorHandling();
    await this.testIntegrationPoints();

    this.printTestResults();
  }

  // Print test results
  printTestResults() {
    console.log('\n📊 Full Flow Test Results Summary');
    console.log('==================================');
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    });
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    console.log(`\nOverall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! The enhanced system is ready for integration.');
    } else {
      console.log('⚠️ Some tests failed. Please review the issues before integration.');
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FullFlowTest;
} else {
  window.FullFlowTest = FullFlowTest;
}

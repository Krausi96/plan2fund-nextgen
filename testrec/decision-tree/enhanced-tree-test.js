// ========= PLAN2FUND — ENHANCED DECISION TREE TEST =========
// Test the enhanced decision tree with requirements-based logic

// This test builds on your existing decision tree engine
// and shows how to enhance it with requirements data

class EnhancedDecisionTreeTest {
  constructor() {
    this.requirements = null;
    this.userAnswers = {};
    this.testResults = [];
  }

  async loadRequirements() {
    try {
      const response = await fetch('../requirements/sample-requirements.json');
      this.requirements = await response.json();
      console.log('✅ Requirements loaded:', this.requirements.programs.length, 'programs');
      return true;
    } catch (error) {
      console.error('❌ Failed to load requirements:', error);
      return false;
    }
  }

  // Test 1: Basic Decision Tree Processing
  async testBasicDecisionTree() {
    console.log('\n🧪 Test 1: Basic Decision Tree Processing');
    
    const testAnswers = {
      q1_country: 'AT',
      q2_entity_stage: 'INC_LT_6M',
      q3_company_size: 'MICRO_0_9',
      q4_theme: ['INNOVATION_DIGITAL'],
      q5_maturity_trl: 'TRL_3_4',
      q6_rnd_in_at: 'YES',
      q7_collaboration: 'NONE',
      q9_team_diversity: 'UNKNOWN',
      q10_env_benefit: 'SOME'
    };

    this.userAnswers = testAnswers;
    
    // Simulate your existing decision tree processing
    const result = await this.simulateDecisionTreeProcessing(testAnswers);
    
    this.testResults.push({
      test: 'Basic Decision Tree Processing',
      passed: result.recommendations.length > 0,
      details: {
        recommendations: result.recommendations.length,
        explanations: result.explanations.length,
        gaps: result.gaps.length
      }
    });

    console.log('✅ Basic decision tree processing:', result.recommendations.length, 'recommendations');
    return result;
  }

  // Test 2: Requirements-Based Scoring
  async testRequirementsBasedScoring() {
    console.log('\n🧪 Test 2: Requirements-Based Scoring');
    
    if (!this.requirements) {
      console.error('❌ Requirements not loaded');
      return null;
    }

    const program = this.requirements.programs[0]; // aws Preseed
    const score = this.calculateRequirementsScore(program, this.userAnswers);
    
    this.testResults.push({
      test: 'Requirements-Based Scoring',
      passed: score.overallScore > 0,
      details: {
        overallScore: score.overallScore,
        eligibility: score.eligibility,
        gaps: score.gaps.length,
        recommendations: score.recommendations.length
      }
    });

    console.log('✅ Requirements-based scoring:', score.overallScore, 'points');
    return score;
  }

  // Test 3: Dynamic Question Generation
  async testDynamicQuestionGeneration() {
    console.log('\n🧪 Test 3: Dynamic Question Generation');
    
    if (!this.requirements) {
      console.error('❌ Requirements not loaded');
      return null;
    }

    const program = this.requirements.programs[0];
    const questions = this.generateDynamicQuestions(program, this.userAnswers);
    
    this.testResults.push({
      test: 'Dynamic Question Generation',
      passed: questions.length > 0,
      details: {
        questionsGenerated: questions.length,
        questionTypes: [...new Set(questions.map(q => q.type))],
        requiredQuestions: questions.filter(q => q.required).length
      }
    });

    console.log('✅ Dynamic question generation:', questions.length, 'questions');
    return questions;
  }

  // Test 4: Editor Prefill Enhancement
  async testEditorPrefillEnhancement() {
    console.log('\n🧪 Test 4: Editor Prefill Enhancement');
    
    if (!this.requirements) {
      console.error('❌ Requirements not loaded');
      return null;
    }

    const program = this.requirements.programs[0];
    const prefillData = this.generateEnhancedPrefill(program, this.userAnswers);
    
    this.testResults.push({
      test: 'Editor Prefill Enhancement',
      passed: prefillData.sections.length > 0,
      details: {
        sectionsGenerated: prefillData.sections.length,
        requiredSections: prefillData.sections.filter(s => s.required).length,
        prefillData: Object.keys(prefillData.prefillData).length
      }
    });

    console.log('✅ Editor prefill enhancement:', prefillData.sections.length, 'sections');
    return prefillData;
  }

  // Test 5: Readiness Check
  async testReadinessCheck() {
    console.log('\n🧪 Test 5: Readiness Check');
    
    if (!this.requirements) {
      console.error('❌ Requirements not loaded');
      return null;
    }

    const program = this.requirements.programs[0];
    const readiness = this.performReadinessCheck(program, this.userAnswers);
    
    this.testResults.push({
      test: 'Readiness Check',
      passed: readiness.overallScore > 0,
      details: {
        overallScore: readiness.overallScore,
        criteriaMet: readiness.criteriaMet,
        totalCriteria: readiness.totalCriteria,
        missingRequirements: readiness.missingRequirements.length
      }
    });

    console.log('✅ Readiness check:', readiness.overallScore, '% complete');
    return readiness;
  }

  // Simulate your existing decision tree processing
  async simulateDecisionTreeProcessing(answers) {
    // This simulates your existing decision tree logic
    // In reality, you would call your existing decision tree engine
    
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
      ],
      fallbackPrograms: []
    };
  }

  // Calculate requirements-based score
  calculateRequirementsScore(program, answers) {
    let totalScore = 0;
    let totalWeight = 0;
    const gaps = [];
    const recommendations = [];

    // Score each category
    const categories = ['eligibility', 'documents', 'financial', 'technical'];
    
    categories.forEach(category => {
      const requirements = program[category] || [];
      const weight = program.scoringWeights[category] || 0;
      
      let categoryScore = 0;
      requirements.forEach(req => {
        if (this.checkRequirementMet(req, answers)) {
          categoryScore += 100;
        } else {
          gaps.push(req.title);
          if (req.guidance) {
            recommendations.push(req.guidance);
          }
        }
      });
      
      const avgScore = requirements.length > 0 ? categoryScore / requirements.length : 0;
      totalScore += avgScore * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    
    return {
      overallScore,
      eligibility: overallScore >= 70 ? 'eligible' : 'not_eligible',
      gaps,
      recommendations
    };
  }

  // Check if a requirement is met
  checkRequirementMet(requirement, answers) {
    // This is a simplified version - in reality, you'd have more complex logic
    switch (requirement.type) {
      case 'boolean':
        return this.checkBooleanRequirement(requirement, answers);
      case 'numeric':
        return this.checkNumericRequirement(requirement, answers);
      case 'selection':
        return this.checkSelectionRequirement(requirement, answers);
      default:
        return false;
    }
  }

  checkBooleanRequirement(requirement, answers) {
    // Simplified boolean check
    return answers[requirement.id] === true || answers[requirement.id] === 'YES';
  }

  checkNumericRequirement(requirement, answers) {
    const value = parseInt(answers[requirement.id]);
    if (isNaN(value)) return false;
    
    if (requirement.validationRules) {
      for (const rule of requirement.validationRules) {
        if (rule.type === 'min' && value < rule.value) return false;
        if (rule.type === 'max' && value > rule.value) return false;
      }
    }
    
    return true;
  }

  checkSelectionRequirement(requirement, answers) {
    const answer = answers[requirement.id];
    const validOptions = requirement.options?.map(opt => opt.value) || [];
    return validOptions.includes(answer);
  }

  // Generate dynamic questions based on requirements
  generateDynamicQuestions(program, answers) {
    const questions = [];
    
    program.decisionTreeQuestions.forEach(question => {
      if (!answers[question.id]) {
        questions.push(question);
      }
    });
    
    return questions;
  }

  // Generate enhanced prefill data
  generateEnhancedPrefill(program, answers) {
    const sections = [];
    const prefillData = {};
    
    program.editorSections.forEach(section => {
      sections.push({
        id: section.id,
        title: section.title,
        required: section.required,
        template: section.template,
        guidance: section.guidance
      });
      
      // Generate prefill data based on template
      if (section.prefillData) {
        Object.entries(section.prefillData).forEach(([key, value]) => {
          const answerKey = value.replace('answers.', '');
          prefillData[key] = answers[answerKey] || `[${key}]`;
        });
      }
    });
    
    return {
      sections,
      prefillData
    };
  }

  // Perform readiness check
  performReadinessCheck(program, answers) {
    let criteriaMet = 0;
    const totalCriteria = program.readinessCriteria.length;
    const missingRequirements = [];
    
    program.readinessCriteria.forEach(criterion => {
      if (this.checkCriterionMet(criterion, answers)) {
        criteriaMet++;
      } else {
        missingRequirements.push(criterion.title);
      }
    });
    
    const overallScore = totalCriteria > 0 ? Math.round((criteriaMet / totalCriteria) * 100) : 0;
    
    return {
      overallScore,
      criteriaMet,
      totalCriteria,
      missingRequirements
    };
  }

  // Check if a criterion is met
  checkCriterionMet(criterion, answers) {
    // This is a simplified version - in reality, you'd evaluate the validator function
    const answerKey = criterion.requirementId.replace('elig_', 'q_').replace('fin_', 'q_');
    return answers[answerKey] !== undefined && answers[answerKey] !== '';
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Enhanced Decision Tree Tests\n');
    
    const loaded = await this.loadRequirements();
    if (!loaded) {
      console.error('❌ Cannot run tests without requirements');
      return;
    }

    await this.testBasicDecisionTree();
    await this.testRequirementsBasedScoring();
    await this.testDynamicQuestionGeneration();
    await this.testEditorPrefillEnhancement();
    await this.testReadinessCheck();

    this.printTestResults();
  }

  // Print test results
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
    });
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    console.log(`\nOverall: ${passed}/${total} tests passed`);
  }
}

// Run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
  const tester = new EnhancedDecisionTreeTest();
  tester.runAllTests();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedDecisionTreeTest;
}

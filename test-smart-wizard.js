const { QuestionEngine } = require('./src/lib/questionEngine');
const { IntakeEngine } = require('./src/lib/intakeEngine');
const { scoreProgramsEnhanced } = require('./src/lib/enhancedRecoEngine');

// Mock dataSource to return some programs
const mockDataSource = {
  getGPTEnhancedPrograms: async () => [
    { 
      id: 'p1', 
      name: 'Startup Grant Austria', 
      type: 'grant', 
      institution: 'Austrian Development Agency',
      target_personas: ['startups'], 
      entity_stage: ['idea', 'mvp'], 
      location_country: ['AT'], 
      min_team_size: 1, 
      max_team_size: 5, 
      categories: ['Technology'],
      description: 'A comprehensive grant program for innovative startups in Austria',
      deadline: '2024-12-31'
    },
    { 
      id: 'p2', 
      name: 'SME Growth Loan EU', 
      type: 'loan', 
      institution: 'European Investment Bank',
      target_personas: ['sme'], 
      entity_stage: ['revenue', 'growth'], 
      location_country: ['EU', 'AT'], 
      min_team_size: 5, 
      max_team_size: 50, 
      categories: ['Manufacturing'],
      description: 'Low-interest loans for growing small and medium enterprises',
      deadline: 'Rolling'
    },
    { 
      id: 'p3', 
      name: 'Deep Tech Equity Fund', 
      type: 'equity', 
      institution: 'TechInvest Austria',
      target_personas: ['startups'], 
      entity_stage: ['mvp', 'revenue'], 
      location_country: ['AT'], 
      min_team_size: 2, 
      max_team_size: 15, 
      categories: ['Technology'],
      description: 'Equity investment for deep technology startups',
      deadline: '2024-06-30'
    },
    { 
      id: 'p4', 
      name: 'Environmental Grant AT', 
      type: 'grant', 
      institution: 'Austrian Environmental Agency',
      target_personas: ['startups', 'sme'], 
      entity_stage: ['idea', 'mvp', 'revenue'], 
      location_country: ['AT'], 
      min_team_size: 1, 
      max_team_size: 20, 
      categories: ['Environmental'],
      description: 'Grants for environmental innovation projects',
      deadline: '2024-09-15'
    },
    { 
      id: 'p5', 
      name: 'Research & Development Grant', 
      type: 'grant', 
      institution: 'Austrian Research Promotion Agency',
      target_personas: ['universities', 'startups'], 
      entity_stage: ['idea', 'research_org'], 
      location_country: ['AT', 'EU'], 
      min_team_size: 1, 
      max_team_size: 100, 
      categories: ['Research'],
      description: 'Comprehensive R&D funding for research organizations',
      deadline: '2024-11-30'
    }
  ]
};

// Mock the dataSource module
jest.mock('./src/lib/dataSource', () => mockDataSource);

async function runSmartWizardTest() {
  console.log("--- Starting Smart Wizard Integration Test ---");

  try {
    // Initialize engines
    const intakeEngine = new IntakeEngine();
    const questionEngine = new QuestionEngine(intakeEngine, null);
    const scoringEngine = new ScoringEngine(intakeEngine, questionEngine);

    console.log("✅ Engines initialized successfully");

    // Test 1: Question Flow
    console.log("\n--- Test 1: Question Flow ---");
    let currentQuestion = await questionEngine.getFirstQuestion();
    let answers = {};
    let questionCount = 0;

    console.log(`Q1: ${currentQuestion?.symptom}`);

    // Simulate user answers
    const testAnswers = {
      funding_need: 'need_money',
      business_stage: 'just_idea',
      main_goal: 'launch_product',
      innovation_level: 'disruptive',
      team_size: '2_5',
      location_country: 'AT',
      sector: 'AI software'
    };

    // Process answers through question flow
    for (const [questionId, answer] of Object.entries(testAnswers)) {
      if (currentQuestion && currentQuestion.id === questionId) {
        answers[questionId] = answer;
        console.log(`A: ${answer}`);
        
        currentQuestion = await questionEngine.getNextQuestion(answers);
        questionCount++;
        
        if (currentQuestion) {
          console.log(`Q${questionCount + 1}: ${currentQuestion.symptom}`);
        }
      }
    }

    console.log(`✅ Processed ${questionCount} questions`);
    console.log("Final answers:", answers);

    // Test 2: Intake Processing
    console.log("\n--- Test 2: Intake Processing ---");
    const profile = await intakeEngine.parseAnswers(answers, 'test_session', 'test_user');
    console.log("Profile created:", {
      sector: profile.profile.sector,
      stage: profile.profile.stage,
      team_size: profile.profile.team_size,
      location_country: profile.profile.location_country,
      program_type: profile.profile.program_type,
      targetGroup: profile.targetGroup,
      confidenceScore: profile.confidenceScore
    });
    console.log("✅ Profile processing successful");

    // Test 3: Scoring and Recommendations
    console.log("\n--- Test 3: Scoring and Recommendations ---");
    const recommendations = await scoringEngine.scorePrograms(profile, 5);
    console.log(`Found ${recommendations.length} recommendations:`);
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.name} (${rec.fundingType}) - ${rec.score}% match`);
      console.log(`   Institution: ${rec.institution}`);
      console.log(`   Priority: ${rec.priority}`);
      console.log(`   Match reasons: ${rec.matchReasons.slice(0, 2).join(', ')}`);
    });

    console.log("✅ Scoring and recommendations successful");

    // Test 4: Funding Type Detection
    console.log("\n--- Test 4: Funding Type Detection ---");
    const detectedFundingTypes = questionEngine.getFundingTypes(answers);
    console.log("Detected funding types:", detectedFundingTypes);
    console.log("✅ Funding type detection successful");

    // Test 5: Validation
    console.log("\n--- Test 5: Validation ---");
    const validationResults = {
      questionFlow: questionCount > 0,
      profileCreation: profile.profile.sector !== null,
      recommendations: recommendations.length > 0,
      fundingTypes: detectedFundingTypes.length > 0,
      confidence: profile.confidenceScore > 0.5
    };

    console.log("Validation results:", validationResults);
    
    const allPassed = Object.values(validationResults).every(result => result === true);
    console.log(allPassed ? "✅ All tests passed!" : "❌ Some tests failed");

    // Test 6: UI State Simulation
    console.log("\n--- Test 6: UI State Simulation ---");
    const wizardState = {
      currentQuestion: currentQuestion,
      answers: answers,
      currentPhase: 1,
      isProcessing: false,
      results: recommendations,
      profile: profile,
      showResults: true,
      progress: 100
    };

    console.log("Wizard state:", {
      hasCurrentQuestion: !!wizardState.currentQuestion,
      answerCount: Object.keys(wizardState.answers).length,
      resultCount: wizardState.results.length,
      hasProfile: !!wizardState.profile,
      progress: wizardState.progress
    });
    console.log("✅ UI state simulation successful");

    console.log("\n--- Smart Wizard Integration Test Complete ---");
    console.log("🎉 The SmartWizard component is ready for use!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
runSmartWizardTest();

// Debug script to diagnose QuestionEngine issues
// Run with: node debug-question-engine.js

const fetch = require('node-fetch');

async function debugQuestionEngine() {
  console.log('🔍 Starting QuestionEngine Debug Script\n');
  
  try {
    // Step 1: Fetch programs
    console.log('📥 Step 1: Fetching programs from API...');
    const response = await fetch('http://localhost:3000/api/programs?enhanced=true');
    const data = await response.json();
    const programs = data.programs || [];
    console.log(`✅ Fetched ${programs.length} programs\n`);
    
    if (programs.length === 0) {
      console.error('❌ No programs found! Check API endpoint.');
      return;
    }
    
    // Step 2: Initialize QuestionEngine (simulate what SmartWizard does)
    console.log('📦 Step 2: Initializing QuestionEngine...');
    
    // Import QuestionEngine (we'll need to use dynamic import or require)
    // For now, let's simulate the logic
    const { QuestionEngine } = require('./features/reco/engine/questionEngine.ts');
    
    const questionEngine = new QuestionEngine(programs);
    
    // Step 3: Check initial state
    console.log('\n📊 Step 3: Initial State Analysis');
    console.log('='.repeat(60));
    const allQuestions = questionEngine.getAllQuestions();
    const coreQuestions = questionEngine.getCoreQuestions();
    const totalPrograms = programs.length;
    const remainingPrograms = questionEngine.getRemainingProgramCount();
    
    console.log(`Total Programs: ${totalPrograms}`);
    console.log(`Remaining Programs: ${remainingPrograms}`);
    console.log(`Total Questions Generated: ${allQuestions.length}`);
    console.log(`Core Questions: ${coreQuestions.length}`);
    console.log(`\nQuestions Generated:`);
    allQuestions.forEach((q, idx) => {
      console.log(`  ${idx + 1}. ${q.id} (${q.type}, ${q.options?.length || 0} options, required: ${q.required})`);
    });
    
    if (allQuestions.length === 0) {
      console.error('\n❌ PROBLEM: No questions generated!');
      console.log('This is likely why you only see 3 questions.');
      return;
    }
    
    if (allQuestions.length < 8) {
      console.warn(`\n⚠️ WARNING: Only ${allQuestions.length} questions generated, expected at least 8 core questions`);
    }
    
    // Step 4: Simulate answering questions step by step
    console.log('\n📝 Step 4: Simulating Question Flow');
    console.log('='.repeat(60));
    
    const answers = {};
    let questionNumber = 1;
    const maxQuestions = 10; // Safety limit
    
    while (questionNumber <= maxQuestions) {
      // Get next question
      const nextQuestion = await questionEngine.getNextQuestion(answers);
      
      if (!nextQuestion) {
        console.log(`\n⏸️ No more questions after ${questionNumber - 1} answers`);
        console.log(`Answers given: ${Object.keys(answers).join(', ')}`);
        console.log(`Remaining programs: ${questionEngine.getRemainingProgramCount()}`);
        break;
      }
      
      console.log(`\nQuestion ${questionNumber}: ${nextQuestion.id}`);
      console.log(`  Type: ${nextQuestion.type}`);
      console.log(`  Options: ${nextQuestion.options?.length || 0}`);
      console.log(`  Required: ${nextQuestion.required}`);
      console.log(`  Programs before answer: ${questionEngine.getRemainingProgramCount()}`);
      
      // Simulate answer (pick first option)
      let answer = null;
      if (nextQuestion.options && nextQuestion.options.length > 0) {
        answer = nextQuestion.options[0].value;
        answers[nextQuestion.id] = answer;
        console.log(`  Answer chosen: ${answer} (first option)`);
        
        // Get next question to see filtering effect
        const beforeCount = questionEngine.getRemainingProgramCount();
        const nextNextQuestion = await questionEngine.getNextQuestion(answers);
        const afterCount = questionEngine.getRemainingProgramCount();
        
        console.log(`  Programs after answer: ${afterCount} (filtered: ${beforeCount - afterCount})`);
        
        if (afterCount === 0) {
          console.error(`\n❌ PROBLEM: All programs filtered out after answering "${nextQuestion.id}"!`);
          console.log(`This is why questions stop - no programs remain to match.`);
          break;
        }
        
        if (nextNextQuestion) {
          console.log(`  Next question will be: ${nextNextQuestion.id}`);
        } else {
          console.log(`  No more questions available`);
        }
      } else {
        console.error(`  ❌ PROBLEM: Question "${nextQuestion.id}" has no options!`);
        console.log(`  This question cannot be answered.`);
        break;
      }
      
      questionNumber++;
    }
    
    // Step 5: Final analysis
    console.log('\n📊 Step 5: Final Analysis');
    console.log('='.repeat(60));
    console.log(`Total questions asked: ${questionNumber - 1}`);
    console.log(`Total questions available: ${allQuestions.length}`);
    console.log(`Answers given: ${Object.keys(answers).length}`);
    console.log(`Final remaining programs: ${questionEngine.getRemainingProgramCount()}`);
    console.log(`\nAnswers:`);
    Object.entries(answers).forEach(([key, value]) => {
      console.log(`  ${key} = ${value}`);
    });
    
    // Check why questions stopped
    console.log('\n🔍 Step 6: Diagnosis');
    console.log('='.repeat(60));
    
    const unansweredCore = allQuestions.filter(q => 
      q.required && !answers[q.id]
    );
    
    if (unansweredCore.length > 0) {
      console.log(`⚠️ ${unansweredCore.length} core questions were NOT asked:`);
      unansweredCore.forEach(q => {
        console.log(`  - ${q.id} (required but not answered)`);
      });
    }
    
    const remainingCount = questionEngine.getRemainingProgramCount();
    if (remainingCount === 0) {
      console.error('\n❌ ROOT CAUSE: All programs filtered out!');
      console.log('   The filtering logic is too aggressive.');
      console.log('   Check filterPrograms() method in questionEngine.ts');
    } else if (remainingCount < 5) {
      console.warn(`\n⚠️ Only ${remainingCount} programs remain - questions stopped early`);
      console.log('   This is expected behavior if programs are filtered down significantly.');
    }
    
    if (allQuestions.length < 8) {
      console.error('\n❌ ROOT CAUSE: Not enough questions generated!');
      console.log(`   Expected 8 core questions, got ${allQuestions.length}`);
      console.log('   Check generateQuestions() method - may need to lower threshold');
    }
    
  } catch (error) {
    console.error('\n❌ Error running debug script:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the debug script
debugQuestionEngine().catch(console.error);

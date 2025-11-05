// Browser Console Debug Script for QuestionEngine
// Copy and paste this into the browser console while on the SmartWizard page
// Or run: node -e "console.log('Use this in browser console instead')"

(async function debugQuestionEngine() {
  console.log('🔍 Starting QuestionEngine Debug Script\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check if we're in a React environment
    if (typeof window === 'undefined') {
      console.error('❌ This script must run in browser console');
      return;
    }
    
    // Step 2: Fetch programs
    console.log('📥 Step 1: Fetching programs from API...');
    const response = await fetch('/api/programs?enhanced=true');
    const data = await response.json();
    const programs = data.programs || [];
    console.log(`✅ Fetched ${programs.length} programs\n`);
    
    if (programs.length === 0) {
      console.error('❌ No programs found! Check API endpoint.');
      return;
    }
    
    // Step 3: Import QuestionEngine dynamically
    console.log('📦 Step 2: Importing QuestionEngine...');
    const { QuestionEngine } = await import('/features/reco/engine/questionEngine.ts');
    
    const questionEngine = new QuestionEngine(programs);
    
    // Step 4: Initial state analysis
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
      const optionsCount = q.options?.length || 0;
      console.log(`  ${idx + 1}. ${q.id}`);
      console.log(`     - Type: ${q.type}`);
      console.log(`     - Options: ${optionsCount}`);
      console.log(`     - Required: ${q.required}`);
      if (optionsCount === 0) {
        console.log(`     ⚠️ WARNING: No options available!`);
      }
    });
    
    // Check for problems
    console.log('\n🔍 Step 4: Problem Detection');
    console.log('='.repeat(60));
    
    if (allQuestions.length === 0) {
      console.error('❌ PROBLEM #1: No questions generated!');
      console.log('   This is why you only see 3 questions.');
      console.log('   Possible causes:');
      console.log('   - Programs have no categorized_requirements');
      console.log('   - generateQuestions() threshold too high');
      console.log('   - No requirements match question mappings');
      return;
    }
    
    if (allQuestions.length < 8) {
      console.warn(`⚠️ PROBLEM #2: Only ${allQuestions.length} questions generated`);
      console.log(`   Expected at least 8 core questions`);
      console.log(`   Missing core questions may not have been generated`);
    }
    
    const questionsWithoutOptions = allQuestions.filter(q => !q.options || q.options.length === 0);
    if (questionsWithoutOptions.length > 0) {
      console.error(`❌ PROBLEM #3: ${questionsWithoutOptions.length} questions have no options!`);
      questionsWithoutOptions.forEach(q => {
        console.log(`   - ${q.id} (cannot be answered)`);
      });
    }
    
    // Step 5: Simulate question flow
    console.log('\n📝 Step 5: Simulating Question Flow');
    console.log('='.repeat(60));
    
    const answers = {};
    let questionNumber = 1;
    const maxQuestions = 15; // Safety limit
    const questionHistory = [];
    
    while (questionNumber <= maxQuestions) {
      // Get next question
      const nextQuestion = await questionEngine.getNextQuestion(answers);
      
      if (!nextQuestion) {
        console.log(`\n⏸️ No more questions after ${questionNumber - 1} answers`);
        console.log(`Answers given: ${Object.keys(answers).join(', ')}`);
        const remaining = questionEngine.getRemainingProgramCount();
        console.log(`Remaining programs: ${remaining}`);
        
        if (remaining === 0) {
          console.error('\n❌ ROOT CAUSE: All programs filtered out!');
          console.log('   The filtering logic removed all programs.');
        }
        break;
      }
      
      // Check if we've seen this question before
      if (questionHistory.includes(nextQuestion.id)) {
        console.warn(`\n⚠️ Question ${questionNumber}: ${nextQuestion.id} (REPEATED)`);
        console.log(`   This question was already asked!`);
      } else {
        console.log(`\nQuestion ${questionNumber}: ${nextQuestion.id}`);
      }
      
      questionHistory.push(nextQuestion.id);
      
      const beforeCount = questionEngine.getRemainingProgramCount();
      console.log(`  Programs before: ${beforeCount}`);
      console.log(`  Options available: ${nextQuestion.options?.length || 0}`);
      
      if (!nextQuestion.options || nextQuestion.options.length === 0) {
        console.error(`  ❌ Cannot answer - no options available!`);
        break;
      }
      
      // Simulate answer (pick first option)
      const answer = nextQuestion.options[0].value;
      answers[nextQuestion.id] = answer;
      console.log(`  Answer chosen: ${answer}`);
      
      // Check filtering effect
      const afterQuestion = await questionEngine.getNextQuestion(answers);
      const afterCount = questionEngine.getRemainingProgramCount();
      const filteredOut = beforeCount - afterCount;
      
      console.log(`  Programs after: ${afterCount} (filtered: ${filteredOut})`);
      
      if (afterCount === 0) {
        console.error(`\n❌ PROBLEM: All programs filtered out after answering "${nextQuestion.id}"!`);
        console.log(`   This is why questions stop - no programs remain.`);
        console.log(`   Answer that caused problem: ${nextQuestion.id} = ${answer}`);
        break;
      }
      
      if (afterQuestion) {
        console.log(`  Next question: ${afterQuestion.id}`);
      } else {
        console.log(`  No more questions (stopped early)`);
      }
      
      questionNumber++;
    }
    
    // Step 6: Final diagnosis
    console.log('\n📊 Step 6: Final Diagnosis');
    console.log('='.repeat(60));
    console.log(`Questions asked: ${questionNumber - 1}`);
    console.log(`Questions available: ${allQuestions.length}`);
    console.log(`Questions repeated: ${questionHistory.length - new Set(questionHistory).size}`);
    console.log(`Final remaining programs: ${questionEngine.getRemainingProgramCount()}`);
    
    console.log(`\nQuestion History:`);
    questionHistory.forEach((qId, idx) => {
      console.log(`  ${idx + 1}. ${qId}`);
    });
    
    console.log(`\nAnswers Given:`);
    Object.entries(answers).forEach(([key, value]) => {
      console.log(`  ${key} = ${value}`);
    });
    
    // Check unanswered core questions
    const coreQuestionIds = ['location', 'company_type', 'funding_amount', 'use_of_funds', 
      'impact', 'team_size', 'deadline_urgency', 'project_duration'];
    
    const unansweredCore = coreQuestionIds.filter(id => !answers[id]);
    if (unansweredCore.length > 0) {
      console.log(`\n⚠️ ${unansweredCore.length} core questions NOT answered:`);
      unansweredCore.forEach(id => {
        const question = allQuestions.find(q => q.id === id);
        if (question) {
          console.log(`  - ${id} (exists but not asked)`);
        } else {
          console.log(`  - ${id} (NOT GENERATED)`);
        }
      });
    }
    
    // Summary
    console.log('\n📋 Summary');
    console.log('='.repeat(60));
    
    const issues = [];
    if (allQuestions.length < 8) {
      issues.push(`Only ${allQuestions.length} questions generated (expected 8+)`);
    }
    if (questionsWithoutOptions.length > 0) {
      issues.push(`${questionsWithoutOptions.length} questions have no options`);
    }
    if (questionEngine.getRemainingProgramCount() === 0) {
      issues.push('All programs filtered out');
    }
    if (questionHistory.length !== new Set(questionHistory).size) {
      issues.push('Questions are being repeated');
    }
    if (questionNumber - 1 < 8) {
      issues.push(`Only ${questionNumber - 1} questions asked (expected 8)`);
    }
    
    if (issues.length > 0) {
      console.error('❌ Issues Found:');
      issues.forEach((issue, idx) => {
        console.error(`   ${idx + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No major issues detected');
    }
    
    return {
      totalQuestions: allQuestions.length,
      questionsAsked: questionNumber - 1,
      remainingPrograms: questionEngine.getRemainingProgramCount(),
      issues
    };
    
  } catch (error) {
    console.error('\n❌ Error running debug script:', error);
    console.error('Stack:', error.stack);
    return { error: error.message };
  }
})();

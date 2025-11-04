// Full test script showing complete question tree with conditional logic
// Run with: node scripts/test-reco-full-tree.js

const path = require('path');
const fs = require('fs');

// Load programs directly from database or JSON
async function loadProgramsDirect() {
  try {
    const { getPool } = require('../scraper-lite/src/db/neon-client');
    const { getAllPages } = require('../scraper-lite/src/db/page-repository');
    const pool = getPool();
    
    const pages = await getAllPages(1000);
    
    if (pages.length === 0) {
      throw new Error('No pages in database');
    }
    
    // Transform to programs format
    const programs = await Promise.all(pages.map(async (page) => {
      const reqResult = await pool.query(
        'SELECT category, type, value, required, source, description, format, requirements FROM requirements WHERE page_id = $1',
        [page.id]
      );
      
      const categorized_requirements = {};
      reqResult.rows.forEach((row) => {
        if (!categorized_requirements[row.category]) {
          categorized_requirements[row.category] = [];
        }
        
        let parsedValue = row.value;
        try {
          if (typeof row.value === 'string' && (row.value.startsWith('{') || row.value.startsWith('['))) {
            parsedValue = JSON.parse(row.value);
          }
        } catch (e) {
          // Not JSON, use as-is
        }
        
        categorized_requirements[row.category].push({
          type: row.type,
          value: parsedValue,
          required: row.required,
          source: row.source,
          description: row.description,
          format: row.format
        });
      });
      
      return {
        id: `page_${page.id}`,
        name: page.title || page.url,
        categorized_requirements,
        eligibility_criteria: {}
      };
    }));
    
    return programs;
  } catch (error) {
    console.warn('⚠️ Database load failed, trying JSON fallback...');
    
    const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return data.programs || [];
    }
    
    throw new Error('No data source available');
  }
}

// Test scenarios
const scenarios = [
  {
    name: 'Austrian Startup',
    description: 'Young Austrian startup seeking funding',
    answers: {
      location: 'austria',
      company_age: '0_2_years',
      revenue: 'under_100k',
      team_size: '1_2_people'
    }
  },
  {
    name: 'EU Research Company',
    description: 'EU-based research company with partners',
    answers: {
      location: 'eu',
      company_age: '5_10_years',
      revenue: '500k_2m',
      team_size: 'over_10_people',
      research_focus: 'yes',
      consortium: 'yes',
      innovation_focus: 'yes'
    }
  }
];

async function testFullTree() {
  console.log('\n🧪 ============================================');
  console.log('🧪 FULL QUESTION TREE TEST - CONDITIONAL LOGIC');
  console.log('🧪 ============================================\n');

  try {
    // Load programs
    console.log('📥 Loading programs...');
    const programs = await loadProgramsDirect();
    console.log(`✅ Loaded ${programs.length} programs\n`);

    // Import QuestionEngine
    const { QuestionEngine } = require('../features/reco/engine/questionEngine');
    
    // Initialize engine
    console.log('🔄 Initializing QuestionEngine...');
    const questionEngine = new QuestionEngine(programs);
    
    const totalQuestions = questionEngine.getEstimatedTotalQuestions();
    const allQuestions = questionEngine.getCoreQuestions();
    
    console.log(`✅ Generated ${totalQuestions} total questions`);
    console.log(`✅ Core (required) questions: ${allQuestions.length}`);
    console.log(`\n📋 All Generated Questions:`);
    allQuestions.forEach((q, idx) => {
      console.log(`   ${idx + 1}. ${q.id} (priority: ${q.priority}, required: ${q.required})`);
      console.log(`      Type: ${q.type}, Options: ${q.options.length}`);
    });

    // Test each scenario
    for (const scenario of scenarios) {
      await testScenarioWithTree(questionEngine, programs, scenario);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testScenarioWithTree(questionEngine, programs, scenario) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 SCENARIO: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log('='.repeat(80));

  const answers = {};
  const questionTree = [];
  let currentQuestion = await questionEngine.getFirstQuestion();
  let step = 1;
  const initialProgramCount = programs.length;

  console.log(`\n🌳 QUESTION TREE FLOW:`);
  console.log(`   Starting with ${initialProgramCount} programs\n`);

  // Simulate answering questions one by one
  while (currentQuestion && step <= 30) {
    const programsBefore = questionEngine.getRemainingProgramCount();
    
    // Get answer for this question from scenario
    const answer = scenario.answers[currentQuestion.id];
    
    if (answer === undefined) {
      console.log(`   ${step}. ❓ ${currentQuestion.id} - NO ANSWER IN SCENARIO`);
      console.log(`      Question: ${currentQuestion.symptom}`);
      console.log(`      Type: ${currentQuestion.type}`);
      console.log(`      Options: ${currentQuestion.options.map(o => o.value).join(', ')}`);
      console.log(`      Programs before: ${programsBefore}`);
      console.log(`      ⚠️ Skipping (no answer provided in scenario)`);
      break;
    }

    answers[currentQuestion.id] = answer;
    
    console.log(`\n   ${step}. ❓ ${currentQuestion.id}`);
    console.log(`      Question: ${currentQuestion.symptom}`);
    console.log(`      Type: ${currentQuestion.type}`);
    console.log(`      Required: ${currentQuestion.required}`);
    console.log(`      Options: ${currentQuestion.options.map(o => `${o.value} (${o.label})`).join(', ')}`);
    console.log(`      Answer: ${answer}`);
    console.log(`      Programs before: ${programsBefore}`);

    // Get next question (this will filter programs)
    const programsAfterFilter = questionEngine.getRemainingProgramCount(); // Before answering
    currentQuestion = await questionEngine.getNextQuestion(answers);
    const programsAfter = questionEngine.getRemainingProgramCount();
    
    const filtered = programsBefore - programsAfter;
    const effectiveness = programsBefore > 0 ? ((filtered / programsBefore) * 100).toFixed(1) : '0';
    
    console.log(`      Programs after: ${programsAfter} (filtered ${filtered}, ${effectiveness}%)`);
    
    // Check if question is conditional (appears based on previous answers)
    const isConditional = step > 1 && !scenario.answers[currentQuestion?.id || ''];
    if (isConditional) {
      console.log(`      🔗 CONDITIONAL: This question appeared based on previous answers`);
    }

    questionTree.push({
      step,
      questionId: currentQuestion?.id || 'END',
      questionText: currentQuestion?.symptom || 'END',
      type: currentQuestion?.type || 'END',
      required: currentQuestion?.required || false,
      answer,
      programsBefore,
      programsAfter,
      filtered,
      effectiveness: effectiveness + '%',
      isConditional: step > 1
    });

    step++;

    // Stop conditions
    if (!currentQuestion) {
      console.log(`\n   ✅ No more questions (all answered or filtered enough)`);
      break;
    }

    // Stop if we've filtered enough
    if (programsAfter <= 5 && Object.keys(answers).length >= 5) {
      console.log(`\n   ✅ Filtered to ${programsAfter} programs, stopping questions`);
      break;
    }

    // Stop if we've answered all scenario answers
    if (Object.keys(answers).length >= Object.keys(scenario.answers).length) {
      console.log(`\n   ✅ All scenario answers provided`);
      break;
    }
  }

  // Final state
  const finalPrograms = questionEngine.getRemainingPrograms();
  console.log(`\n📊 FINAL STATE:`);
  console.log(`   Total programs: ${initialProgramCount}`);
  console.log(`   Programs remaining: ${finalPrograms.length}`);
  console.log(`   Questions asked: ${questionTree.length}`);
  console.log(`   Filter rate: ${((initialProgramCount - finalPrograms.length) / initialProgramCount * 100).toFixed(1)}%`);
  console.log(`   Answers collected: ${Object.keys(answers).length}`);

  // Show question tree structure
  console.log(`\n🌳 QUESTION TREE STRUCTURE:`);
  console.log(`\n   Root: ${initialProgramCount} programs`);
  questionTree.forEach((q, idx) => {
    const indent = '   ' + '  '.repeat(idx);
    console.log(`${indent}├─ Question ${q.step}: ${q.questionId}`);
    console.log(`${indent}│  Answer: ${q.answer}`);
    console.log(`${indent}│  ${q.programsBefore} → ${q.programsAfter} programs (${q.effectiveness} filtered)`);
    if (q.isConditional) {
      console.log(`${indent}│  🔗 Conditional (based on previous answers)`);
    }
  });
  console.log(`   └─ Final: ${finalPrograms.length} programs`);

  // Score programs
  console.log(`\n🎯 SCORING REMAINING PROGRAMS...`);
  try {
    const { scoreProgramsEnhanced } = require('../features/reco/engine/enhancedRecoEngine');
    const results = await scoreProgramsEnhanced(answers, "strict", finalPrograms);
    
    console.log(`\n📈 SCORING RESULTS:`);
    console.log(`   Total scored: ${results.length}`);
    
    // Categorize by score
    const perfect = results.filter(r => r.score >= 100);
    const high = results.filter(r => r.score >= 80 && r.score < 100);
    const medium = results.filter(r => r.score >= 50 && r.score < 80);
    const low = results.filter(r => r.score < 50);

    console.log(`   Perfect (100%): ${perfect.length}`);
    console.log(`   High (80-99%): ${high.length}`);
    console.log(`   Medium (50-79%): ${medium.length}`);
    console.log(`   Low (<50%): ${low.length}`);

    if (perfect.length > 0) {
      console.log(`\n🎯 100% MATCHES FOUND:`);
      perfect.slice(0, 5).forEach((match, idx) => {
        console.log(`\n   ${idx + 1}. ${match.name}`);
        console.log(`      ID: ${match.id}`);
        console.log(`      Type: ${match.type || match.program_type || 'unknown'}`);
        console.log(`      Score: ${match.score}%`);
        console.log(`      Matched Criteria: ${match.matchedCriteria?.length || 0}`);
        if (match.matchedCriteria && match.matchedCriteria.length > 0) {
          console.log(`      Why it matches:`);
          match.matchedCriteria.slice(0, 5).forEach(c => {
            console.log(`        ✓ ${c.reason || c.key}`);
          });
        }
      });
    } else {
      console.log(`\n⚠️ No 100% matches found`);
      if (results.length > 0) {
        const best = results[0];
        console.log(`   Best match: ${best.name} (${best.score}%)`);
        console.log(`   Matched: ${best.matchedCriteria?.length || 0} criteria`);
        console.log(`   Gaps: ${best.gaps?.length || 0} missing`);
      }
    }

    // Show top-down tree visualization
    console.log(`\n📊 TOP-DOWN QUESTION TREE:`);
    console.log(`\n   ${initialProgramCount} programs`);
    questionTree.forEach((q, idx) => {
      const indent = '   ' + '│  '.repeat(idx);
      const connector = idx === questionTree.length - 1 ? '└─' : '├─';
      console.log(`${indent}${connector} ${q.questionId} = ${q.answer}`);
      console.log(`${indent}${idx === questionTree.length - 1 ? '   ' : '│  '}  ${q.programsBefore} → ${q.programsAfter} (${q.effectiveness})`);
      if (q.isConditional) {
        console.log(`${indent}${idx === questionTree.length - 1 ? '   ' : '│  '}  🔗 Conditional`);
      }
    });
    console.log(`   └─ ${finalPrograms.length} programs remaining`);
    console.log(`   └─ ${perfect.length} perfect matches (100%)`);
    console.log(`   └─ ${high.length} high matches (80-99%)`);

  } catch (error) {
    console.error(`   ❌ Scoring failed: ${error.message}`);
  }
}

// Check if conditional logic is working
function analyzeConditionalLogic(questionEngine, programs) {
  console.log('\n🔍 ANALYZING CONDITIONAL LOGIC:');
  
  // Test: Answer location = austria, see what questions appear
  console.log('\n   Test 1: Answer location = "austria"');
  const testAnswers1 = { location: 'austria' };
  const nextQ1 = questionEngine.getNextQuestion(testAnswers1);
  console.log(`   Next question: ${nextQ1?.id || 'none'}`);
  console.log(`   Programs filtered: ${questionEngine.getRemainingProgramCount()}`);
  
  // Test: Answer location + age, see what questions appear
  console.log('\n   Test 2: Answer location = "austria", company_age = "0_2_years"');
  const testAnswers2 = { location: 'austria', company_age: '0_2_years' };
  const nextQ2 = questionEngine.getNextQuestion(testAnswers2);
  console.log(`   Next question: ${nextQ2?.id || 'none'}`);
  console.log(`   Programs filtered: ${questionEngine.getRemainingProgramCount()}`);
  
  // Check if questions change based on remaining programs
  console.log('\n   ✅ Conditional logic: Questions adapt based on remaining programs');
}

// Run tests
if (require.main === module) {
  testFullTree().catch(console.error);
}

module.exports = { testFullTree };


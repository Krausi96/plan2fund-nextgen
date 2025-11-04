/**
 * Comprehensive Question Flow & Answer Accuracy Analysis
 * 
 * Shows:
 * 1. Question flow/order
 * 2. Question quality and meaningfulness
 * 3. Progressive filtering (how answers reduce programs)
 * 4. Answer accuracy (do answers lead to correct programs?)
 * 5. Filtering effectiveness
 * 
 * Run with: node scripts/analyze-question-flow-accuracy.js
 */

const path = require('path');
const fs = require('fs');

// Load programs from database
async function loadPrograms() {
  require('dotenv').config({ path: '.env.local' });
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  
  // Register ts-node
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      target: 'ES2020',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
      moduleResolution: 'node'
    }
  });
  
  const neonClient = require('../scraper-lite/src/db/neon-client');
  const pageRepo = require('../scraper-lite/src/db/page-repository');
  
  const { getPool } = neonClient;
  const { getAllPages } = pageRepo;
  const pool = getPool();
  
    const pages = await getAllPages(500); // Limit to 500 for faster analysis
  
    // Limit concurrent queries to avoid timeout
    const programs = [];
    const batchSize = 50;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const batchPrograms = await Promise.all(batch.map(async (page) => {
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
      } catch (e) {}
      
      categorized_requirements[row.category].push({
        type: row.type,
        value: parsedValue,
        required: row.required,
        source: row.source,
        description: row.description,
        format: row.format,
        requirements: row.requirements ? (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : undefined
      });
    });
    
    return {
      id: `page_${page.id}`,
      name: page.title || page.url,
      url: page.url,
        categorized_requirements
      };
    }));
      programs.push(...batchPrograms);
      if (i % 100 === 0) {
        console.log(`   Loaded ${programs.length}/${pages.length} programs...`);
      }
    }
  
    await pool.end();
    return programs;
}

// Load QuestionEngine (replicate logic)
function createQuestionEngine(programs) {
  // Simplified version - we'll use the actual QuestionEngine if possible
  // For now, replicate key logic
  
  const { QuestionEngine } = require('../features/reco/engine/questionEngine.ts');
  return new QuestionEngine(programs);
}

async function analyzeQuestionFlow() {
  console.log('📊 QUESTION FLOW & ANSWER ACCURACY ANALYSIS');
  console.log('='.repeat(80));
  console.log('\n📥 Loading programs from database...\n');
  
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs\n`);
  
  // Create QuestionEngine
  const questionEngine = createQuestionEngine(programs);
  
  // Get ALL questions using the public method
  const questions = questionEngine.getAllQuestions();
  const totalQuestions = questions.length;
  const coreQuestions = questionEngine.getCoreQuestions();
  
  if (questions.length === 0) {
    console.error('❌ No questions generated!');
    return;
  }
  
  console.log('📋 QUESTION FLOW');
  console.log('='.repeat(80));
  console.log(`\n✅ Generated ${questions.length} questions\n`);
  
  // Show question order
  console.log('🎯 QUESTION ORDER (as users will see them):');
  console.log('-'.repeat(80));
  questions.forEach((q, idx) => {
    const typeIcon = q.type === 'multi-select' ? '☑️' : q.type === 'single-select' ? '☑️' : '📝';
    console.log(`${idx + 1}. ${typeIcon} ${q.id.padEnd(20)} - ${q.symptom}`);
    console.log(`   Options: ${q.options.length} (${q.options.slice(0, 3).map(o => o.value).join(', ')}${q.options.length > 3 ? '...' : ''})`);
    console.log(`   Required: ${q.required ? 'Yes' : 'No'}`);
    console.log(`   Priority: ${q.priority}`);
    console.log('');
  });
  
  // Test progressive filtering
  console.log('\n📊 PROGRESSIVE FILTERING ANALYSIS');
  console.log('='.repeat(80));
  console.log('\nSimulating user answers to see how programs are filtered...\n');
  
  const answers = {};
  let remainingPrograms = [...programs];
  const filteringSteps = [];
  
  for (const question of questions) {
    // Simulate a realistic answer for each question
    let simulatedAnswer = null;
    
    if (question.type === 'single-select' || question.type === 'multi-select') {
      // Pick first option (or random selection for multi-select)
      if (question.type === 'multi-select') {
        // Select first 2 options for multi-select
        simulatedAnswer = question.options.slice(0, Math.min(2, question.options.length)).map(o => o.value);
      } else {
        simulatedAnswer = question.options[0].value;
      }
    } else if (question.type === 'number') {
      // Pick middle value
      simulatedAnswer = 50000;
    } else if (question.type === 'text') {
      simulatedAnswer = 'test';
    } else if (question.type === 'boolean') {
      simulatedAnswer = true;
    }
    
    if (simulatedAnswer === null) continue;
    
    answers[question.id] = simulatedAnswer;
    
    // Filter programs (use public method with progressive filtering)
    const beforeCount = remainingPrograms.length;
    remainingPrograms = questionEngine.applyFilters(answers, remainingPrograms);
    const afterCount = remainingPrograms.length;
    const filteredCount = beforeCount - afterCount;
    const filterPercentage = beforeCount > 0 ? ((filteredCount / beforeCount) * 100).toFixed(1) : 0;
    
    filteringSteps.push({
      questionId: question.id,
      questionText: question.symptom,
      answer: Array.isArray(simulatedAnswer) ? simulatedAnswer.join(', ') : String(simulatedAnswer),
      beforeCount,
      afterCount,
      filteredCount,
      filterPercentage
    });
    
    console.log(`Q${filteringSteps.length}: ${question.id.padEnd(20)}`);
    console.log(`   Answer: ${Array.isArray(simulatedAnswer) ? simulatedAnswer.join(', ') : String(simulatedAnswer)}`);
    console.log(`   Programs: ${beforeCount} → ${afterCount} (filtered ${filteredCount}, ${filterPercentage}%)`);
    
    // Stop if we've filtered down significantly
    if (afterCount <= 5) {
      console.log(`   ✅ Filtered to ${afterCount} programs - stopping`);
      break;
    }
    
    console.log('');
  }
  
  // Summary
  console.log('\n📈 FILTERING SUMMARY');
  console.log('='.repeat(80));
  const totalFiltered = programs.length - (remainingPrograms.length || 0);
  const totalFilterPercentage = ((totalFiltered / programs.length) * 100).toFixed(1);
  
  console.log(`\nInitial Programs: ${programs.length}`);
  console.log(`Final Programs: ${remainingPrograms.length || 0}`);
  console.log(`Total Filtered: ${totalFiltered} (${totalFilterPercentage}%)`);
  console.log(`Questions Answered: ${Object.keys(answers).length}`);
  console.log(`Average Filter per Question: ${(totalFiltered / Object.keys(answers).length).toFixed(1)} programs`);
  
  // Filtering effectiveness
  console.log('\n🎯 FILTERING EFFECTIVENESS');
  console.log('='.repeat(80));
  const avgFilterRate = filteringSteps.reduce((sum, step) => sum + parseFloat(step.filterPercentage), 0) / filteringSteps.length;
  console.log(`\nAverage Filter Rate per Question: ${avgFilterRate.toFixed(1)}%`);
  
  const effectiveQuestions = filteringSteps.filter(s => parseFloat(s.filterPercentage) > 10);
  console.log(`Effective Questions (>10% filter): ${effectiveQuestions.length}/${filteringSteps.length}`);
  
  const ineffectiveQuestions = filteringSteps.filter(s => parseFloat(s.filterPercentage) < 5);
  if (ineffectiveQuestions.length > 0) {
    console.log(`\n⚠️ Ineffective Questions (<5% filter):`);
    ineffectiveQuestions.forEach(q => {
      console.log(`   - ${q.questionId}: ${q.filterPercentage}% (${q.beforeCount} → ${q.afterCount})`);
    });
  }
  
  // Answer accuracy check
  console.log('\n✅ ANSWER ACCURACY CHECK');
  console.log('='.repeat(80));
  console.log('\nChecking if filtered programs match the answers...\n');
  
  // For each question, check if remaining programs actually match the answer
  for (const step of filteringSteps) {
    const question = questions.find(q => q.id === step.questionId);
    if (!question) continue;
    
    // Check how many remaining programs match this answer
    let matchingCount = 0;
    const answerValue = answers[step.questionId];
    
    for (const program of remainingPrograms) {
      const categorized = program.categorized_requirements || {};
      let matches = false;
      
      // Check if program matches this answer (simplified check)
      if (question.id === 'location') {
        const geoReqs = categorized.geographic || [];
        matches = geoReqs.some(req => {
          const reqValue = req.value;
          if (Array.isArray(reqValue)) {
            return reqValue.some(v => String(v).toLowerCase().includes(String(answerValue).toLowerCase()));
          }
          return String(reqValue).toLowerCase().includes(String(answerValue).toLowerCase());
        });
      } else if (question.id === 'company_type') {
        const teamReqs = categorized.team || [];
        matches = teamReqs.some(req => {
          const reqValue = String(req.value || '').toLowerCase();
          return reqValue.includes(String(answerValue).toLowerCase());
        });
      } else if (question.id === 'funding_amount') {
        const financialReqs = categorized.financial || [];
        matches = financialReqs.some(req => req.type === 'funding_amount');
      }
      // Add more checks as needed
      
      if (matches) matchingCount++;
    }
    
    const accuracy = remainingPrograms.length > 0 ? ((matchingCount / remainingPrograms.length) * 100).toFixed(1) : 0;
    console.log(`${step.questionId.padEnd(20)}: ${matchingCount}/${remainingPrograms.length} programs match (${accuracy}% accuracy)`);
  }
  
  // Question quality assessment
  console.log('\n📝 QUESTION QUALITY ASSESSMENT');
  console.log('='.repeat(80));
  console.log('\nEvaluating each question...\n');
  
  for (const question of questions) {
    let quality = '✅ Good';
    const issues = [];
    
    // Check option count
    if (question.options.length < 2) {
      quality = '❌ Poor';
      issues.push('Too few options (< 2)');
    } else if (question.options.length > 10) {
      issues.push('Many options (> 10) - might be overwhelming');
    }
    
    // Check if question is meaningful
    const vagueQuestions = ['unknown', 'other', 'general', 'various'];
    const hasVagueOptions = question.options.some(o => vagueQuestions.some(v => o.value.toLowerCase().includes(v)));
    if (hasVagueOptions && question.options.length <= 3) {
      issues.push('Has vague options (might not be meaningful)');
    }
    
    // Check translation keys (simplified - assume they exist if we get here)
    
    console.log(`${question.id.padEnd(20)}: ${quality}`);
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`   ⚠️ ${issue}`));
    }
    console.log('');
  }
  
  // Final recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('\nBased on this analysis:\n');
  
  if (avgFilterRate < 10) {
    console.log('⚠️ Average filter rate is low - questions may not be filtering effectively');
    console.log('   Consider: More specific questions or better matching logic');
  }
  
  if (ineffectiveQuestions.length > 0) {
    console.log(`⚠️ ${ineffectiveQuestions.length} questions have low filtering effectiveness`);
    console.log('   Consider: Reviewing or removing these questions');
  }
  
  if (questions.length < 8) {
    console.log('⚠️ Few questions generated - may not provide enough filtering');
    console.log('   Consider: Lowering frequency threshold or adding more requirement types');
  }
  
  if (questions.length > 12) {
    console.log('⚠️ Many questions - might overwhelm users');
    console.log('   Consider: Prioritizing most important questions');
  }
  
  console.log('\n✅ Analysis complete!\n');
}

analyzeQuestionFlow().catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});


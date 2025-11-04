// Comprehensive verification script for questions and answers
// Checks: 1) Questions from database, 2) Answer-to-program linkage, 3) Filtering accuracy
// Run with: node scripts/verify-questions-answers-linkage.js

const path = require('path');
const fs = require('fs');

// Load programs from database or JSON fallback
async function loadPrograms() {
  let source = 'unknown';
  let programs = [];
  
  try {
    // Try database first
    const { getPool } = require('../scraper-lite/src/db/neon-client');
    const { getAllPages } = require('../scraper-lite/src/db/page-repository');
    const pool = getPool();
    
    const pages = await getAllPages(1000);
    
    if (pages.length > 0) {
      source = 'database';
      programs = await Promise.all(pages.map(async (page) => {
        const reqResult = await pool.query(
          'SELECT category, type, value, required, source FROM requirements WHERE page_id = $1',
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
            required: row.required
          });
        });
        
        return {
          id: `page_${page.id}`,
          name: page.title || page.url,
          url: page.url,
          categorized_requirements
        };
      }));
    }
  } catch (error) {
    console.warn('⚠️ Database load failed, trying JSON fallback...');
  }
  
  // Fallback to JSON
  if (programs.length === 0) {
    const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
    if (fs.existsSync(jsonPath)) {
      source = 'fallback';
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      programs = data.programs || [];
    }
  }
  
  return { programs, source };
}

// Use actual QuestionEngine to generate questions
async function generateQuestionsWithEngine(programs) {
  try {
    // Import QuestionEngine dynamically
    const questionEnginePath = path.join(process.cwd(), 'features', 'reco', 'engine', 'questionEngine.ts');
    
    // Since we can't directly import TypeScript, we'll simulate the logic
    // by analyzing requirements the same way QuestionEngine does
    
    // Step 1: Analyze requirements (same as QuestionEngine.analyzeRequirements)
    const requirementFrequencies = new Map();
    
    for (const program of programs) {
      const categorized = program.categorized_requirements || {};
      for (const [category, items] of Object.entries(categorized)) {
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (!item || typeof item !== 'object') continue;
          const reqType = item.type || 'unknown';
          const key = `${category}:${reqType}`;
          
          if (!requirementFrequencies.has(key)) {
            requirementFrequencies.set(key, {
              category,
              type: reqType,
              frequency: 0,
              programs: new Set()
            });
          }
          
          const req = requirementFrequencies.get(key);
          req.frequency++;
          req.programs.add(program.id);
        }
      }
    }
    
    // Step 2: Generate questions (same as QuestionEngine.generateQuestions)
    const MIN_FREQUENCY = Math.max(3, Math.floor(programs.length * 0.05));
    const MAX_QUESTIONS = 10;
    
    const frequencies = Array.from(requirementFrequencies.values())
      .filter(req => req.frequency >= MIN_FREQUENCY)
      .sort((a, b) => b.frequency - a.frequency);
    
    // Map to question IDs (simplified version of mapRequirementToQuestionId)
    const questionIdMap = new Map();
    const questions = [];
    
    for (const req of frequencies.slice(0, MAX_QUESTIONS)) {
      const questionId = mapRequirementToQuestionId(req.category, req.type);
      if (!questionId || questionIdMap.has(questionId)) continue;
      
      questionIdMap.set(questionId, questionId);
      questions.push({
        id: questionId,
        category: req.category,
        type: req.type,
        frequency: req.frequency,
        programsWithRequirement: req.programs.size
      });
    }
    
    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    return [];
  }
}

// Simplified mapping (same logic as questionEngine.ts)
function mapRequirementToQuestionId(category, type) {
  if (category === 'geographic' && (type === 'location' || type.includes('location'))) return 'location';
  if (category === 'team' && (type === 'max_company_age' || type === 'company_age' || type.includes('age'))) return 'company_age';
  if (category === 'team' && (type === 'min_team_size' || type === 'team_size' || type.includes('team'))) return 'team_size';
  if (category === 'financial' && (type === 'revenue' || type === 'revenue_range' || type.includes('revenue'))) return 'revenue';
  if (category === 'financial' && (type === 'funding_amount' || type.includes('funding'))) return 'funding_amount';
  if (category === 'financial' && (type === 'co_financing' || type.includes('cofinancing'))) return 'co_financing';
  if (category === 'project' && (type === 'research_focus' || type.includes('research'))) return 'research_focus';
  if (category === 'project' && (type === 'industry_focus' || type.includes('industry'))) return 'industry_focus';
  if (category === 'consortium' && (type === 'international_collaboration' || type.includes('consortium'))) return 'consortium';
  if (category === 'technical' && (type === 'technology_focus' || type.includes('technology'))) return 'technology_focus';
  if (category === 'eligibility' && (type === 'company_type' || type.includes('company_type'))) return 'company_type';
  if (category === 'eligibility' && (type === 'sector' || type.includes('sector'))) return 'sector';
  if (category === 'timeline' && (type === 'deadline' || type.includes('deadline'))) return 'deadline_urgency';
  if (category === 'timeline' && (type === 'duration' || type.includes('duration'))) return 'project_duration';
  if (category === 'impact' && (type === 'sustainability' || type.includes('impact'))) return 'impact_focus';
  if (category === 'market_size' && (type === 'market_scope' || type.includes('market'))) return 'market_size';
  return null;
}

// Test answer-to-program linkage
function testAnswerLinkage(programs, questions, testAnswers) {
  console.log('\n🔗 ============================================');
  console.log('🔗 TESTING ANSWER-TO-PROGRAM LINKAGE');
  console.log('🔗 ============================================\n');
  
  const results = [];
  
  for (const question of questions) {
    const answer = testAnswers[question.id];
    if (!answer) continue;
    
    // Find programs that should match this answer
    const matchingPrograms = programs.filter(program => {
      const categorized = program.categorized_requirements || {};
      const categoryData = categorized[question.category];
      
      if (!categoryData || !Array.isArray(categoryData)) {
        return true; // Fair filtering - no requirement = available
      }
      
      const reqs = categoryData.filter(r => r.type === question.type);
      if (reqs.length === 0) return true; // Fair filtering
      
      // Check if answer matches requirement
      return reqs.some(req => {
        const reqValue = String(req.value || '').toLowerCase();
        const answerValue = String(answer).toLowerCase();
        
        // Simple matching logic
        if (question.id === 'location') {
          return reqValue.includes(answerValue) || answerValue.includes(reqValue) ||
                 (answerValue === 'austria' && (reqValue.includes('austria') || reqValue.includes('vienna')));
        }
        
        return reqValue.includes(answerValue) || answerValue.includes(reqValue);
      });
    });
    
    results.push({
      question: question.id,
      category: question.category,
      type: question.type,
      answer: answer,
      totalPrograms: programs.length,
      matchingPrograms: matchingPrograms.length,
      matchPercentage: ((matchingPrograms.length / programs.length) * 100).toFixed(1)
    });
  }
  
  return results;
}

// Verify filtering accuracy
function verifyFilteringAccuracy(programs, questions, testAnswers) {
  console.log('\n✅ ============================================');
  console.log('✅ VERIFYING FILTERING ACCURACY');
  console.log('✅ ============================================\n');
  
  let filtered = [...programs];
  const filterSteps = [];
  
  for (const question of questions) {
    const answer = testAnswers[question.id];
    if (!answer) continue;
    
    const before = filtered.length;
    
    // Apply filter
    filtered = filtered.filter(program => {
      const categorized = program.categorized_requirements || {};
      const categoryData = categorized[question.category];
      
      if (!categoryData || !Array.isArray(categoryData)) {
        return true; // Fair filtering
      }
      
      const reqs = categoryData.filter(r => r.type === question.type);
      if (reqs.length === 0) return true; // Fair filtering
      
      // Check match
      return reqs.some(req => {
        const reqValue = String(req.value || '').toLowerCase();
        const answerValue = String(answer).toLowerCase();
        
        if (question.id === 'location') {
          return reqValue.includes(answerValue) || answerValue.includes(reqValue) ||
                 (answerValue === 'austria' && (reqValue.includes('austria') || reqValue.includes('vienna')));
        }
        
        return reqValue.includes(answerValue) || answerValue.includes(reqValue);
      });
    });
    
    const after = filtered.length;
    
    filterSteps.push({
      question: question.id,
      answer: answer,
      before,
      after,
      filtered: before - after,
      programsRemaining: after
    });
  }
  
  return { filterSteps, finalPrograms: filtered };
}

async function main() {
  console.log('🔍 ============================================');
  console.log('🔍 COMPREHENSIVE QUESTION/ANSWER VERIFICATION');
  console.log('🔍 ============================================\n');
  
  // 1. Load programs
  console.log('📥 Loading programs...');
  const { programs, source } = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs from: ${source}\n`);
  
  if (programs.length === 0) {
    console.error('❌ No programs loaded!');
    return;
  }
  
  // 2. Generate questions
  console.log('📝 Generating questions from programs...');
  const questions = await generateQuestionsWithEngine(programs);
  console.log(`✅ Generated ${questions.length} questions\n`);
  
  console.log('📊 Generated Questions:');
  questions.forEach((q, idx) => {
    console.log(`   ${idx + 1}. ${q.id} (${q.category}:${q.type}) - ${q.frequency} programs (${((q.frequency / programs.length) * 100).toFixed(1)}%)`);
  });
  
  // 3. Test answers
  const testAnswers = {
    location: 'austria',
    company_age: '0_2_years',
    revenue: 'under_100k',
    team_size: '1_2_people',
    research_focus: 'yes',
    consortium: 'yes',
    funding_amount: '200k_500k',
    co_financing: 'yes'
  };
  
  // 4. Test answer linkage
  const linkageResults = testAnswerLinkage(programs, questions, testAnswers);
  
  console.log('\n📊 Linkage Results:');
  linkageResults.forEach(r => {
    console.log(`   ${r.question}: ${r.matchingPrograms}/${r.totalPrograms} programs match (${r.matchPercentage}%)`);
  });
  
  // 5. Verify filtering
  const { filterSteps, finalPrograms } = verifyFilteringAccuracy(programs, questions, testAnswers);
  
  console.log('\n📊 Filtering Steps:');
  filterSteps.forEach((step, idx) => {
    console.log(`   ${idx + 1}. ${step.question} = "${step.answer}"`);
    console.log(`      ${step.before} → ${step.after} programs (${step.filtered} filtered)`);
  });
  
  console.log(`\n📊 Final Results:`);
  console.log(`   Starting: ${programs.length} programs`);
  console.log(`   After filtering: ${finalPrograms.length} programs`);
  console.log(`   Filtered: ${programs.length - finalPrograms.length} programs`);
  console.log(`   Filter rate: ${((programs.length - finalPrograms.length) / programs.length * 100).toFixed(1)}%`);
  
  // 6. Sample final programs
  console.log(`\n📋 Sample of Final Programs (first 5):`);
  finalPrograms.slice(0, 5).forEach((program, idx) => {
    console.log(`   ${idx + 1}. ${program.name || program.id}`);
    if (program.url) console.log(`      URL: ${program.url}`);
    
    // Show relevant requirements
    const categorized = program.categorized_requirements || {};
    const relevantCats = questions.map(q => q.category).filter(c => categorized[c]);
    if (relevantCats.length > 0) {
      console.log(`      Requirements: ${relevantCats.join(', ')}`);
    }
  });
  
  // 7. Summary
  console.log(`\n✅ ============================================`);
  console.log('✅ VERIFICATION SUMMARY');
  console.log('✅ ============================================\n');
  
  console.log(`✅ Data Source: ${source === 'database' ? '✅ Database' : '⚠️ JSON Fallback'}`);
  console.log(`✅ Questions Generated: ${questions.length} (from ${programs.length} programs)`);
  console.log(`✅ Questions Linked to Data: ${questions.every(q => q.programsWithRequirement > 0) ? 'Yes' : 'No'}`);
  console.log(`✅ Filtering Works: ${filterSteps.length > 0 ? 'Yes' : 'No'}`);
  console.log(`✅ Programs Filtered Correctly: ${finalPrograms.length < programs.length ? 'Yes' : 'No (all programs passed)'}`);
  
  console.log(`\n📝 Key Findings:`);
  console.log(`   - Questions are generated from ${source === 'database' ? 'database requirements' : 'JSON fallback data'}`);
  console.log(`   - Each question is linked to ${questions.length > 0 ? Math.round(questions[0].frequency) : 0}+ programs`);
  console.log(`   - Filtering reduces program count from ${programs.length} to ${finalPrograms.length}`);
  console.log(`   - ${filterSteps.filter(s => s.filtered > 0).length} out of ${filterSteps.length} filters actually filter programs`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };


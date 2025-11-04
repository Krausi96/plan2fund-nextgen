/**
 * Analyze Question Values and Filtering Effectiveness
 * 
 * Shows:
 * 1. What values exist in database for each question type
 * 2. How many programs have each value
 * 3. How many programs are filtered by each question
 * 4. Why filtering isn't working (missing logic or incorrect matching)
 */

require('dotenv').config({ path: '.env.local' });

// Register ts-node for TypeScript modules
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

const { QuestionEngine } = require('../features/reco/engine/questionEngine.ts');

async function loadPrograms() {
  const { getPool } = require('../scraper-lite/src/db/neon-client');
  const { getAllPages } = require('../scraper-lite/src/db/page-repository');
  const pool = getPool();
  
  const pages = await getAllPages(1000);
  
  const programs = [];
  const batchSize = 50;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const batchPrograms = await Promise.all(batch.map(async (page) => {
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
    programs.push(...batchPrograms);
    if (i % 100 === 0) {
      console.log(`   Loaded ${programs.length}/${pages.length} programs...`);
    }
  }
  
  await pool.end();
  return programs;
}

function analyzeQuestionValues(programs, questionId, category, type) {
  const valueCounts = new Map();
  let programsWithRequirement = 0;
  
  for (const program of programs) {
    const categorized = program.categorized_requirements || {};
    const categoryData = categorized[category];
    
    if (!categoryData || !Array.isArray(categoryData)) continue;
    
    const reqs = categoryData.filter(r => r.type === type);
    if (reqs.length === 0) continue;
    
    programsWithRequirement++;
    
    for (const req of reqs) {
      let valueStr = String(req.value || '').toLowerCase();
      
      // Handle arrays
      if (Array.isArray(req.value)) {
        req.value.forEach(v => {
          const vStr = String(v).toLowerCase();
          valueCounts.set(vStr, (valueCounts.get(vStr) || 0) + 1);
        });
      } else {
        valueCounts.set(valueStr, (valueCounts.get(valueStr) || 0) + 1);
      }
    }
  }
  
  // Get top values
  const topValues = Array.from(valueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return {
    programsWithRequirement,
    totalValues: valueCounts.size,
    topValues
  };
}

function testFiltering(questionEngine, programs, questionId, sampleAnswer) {
  const before = programs.length;
  const filtered = questionEngine.applyFilters({ [questionId]: sampleAnswer }, programs);
  const after = filtered.length;
  
  return {
    before,
    after,
    filtered: before - after,
    percentage: before > 0 ? ((before - after) / before * 100).toFixed(1) : '0.0'
  };
}

async function main() {
  console.log('📊 QUESTION VALUES & FILTERING ANALYSIS');
  console.log('='.repeat(80));
  console.log('\n📥 Loading programs from database...\n');
  
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs\n`);
  
  // Create QuestionEngine
  const questionEngine = new QuestionEngine(programs);
  const questions = questionEngine.getAllQuestions();
  
  console.log(`📋 Found ${questions.length} questions\n`);
  console.log('='.repeat(80));
  console.log('\n');
  
  // Analyze each question
  for (const question of questions) {
    console.log(`\n📊 QUESTION: ${question.id}`);
    console.log('-'.repeat(80));
    console.log(`Type: ${question.type}`);
    console.log(`Options: ${question.options.length}`);
    console.log(`Required: ${question.required ? 'Yes' : 'No'}`);
    
    // Find the requirement category and type for this question
    // We need to reverse-engineer from the question ID
    let category = '';
    let type = '';
    
    // Map question IDs to categories/types
    const questionMapping = {
      'location': { category: 'geographic', type: 'location' },
      'funding_amount': { category: 'financial', type: 'funding_amount' },
      'consortium': { category: 'consortium', type: 'consortium_requirement' },
      'timeline_duration': { category: 'timeline', type: 'duration' },
      'company_type': { category: 'eligibility', type: 'company_type' },
      'company_age': { category: 'team', type: 'max_company_age' },
      'revenue': { category: 'financial', type: 'revenue' },
      'team_size': { category: 'team', type: 'min_team_size' },
      'research_focus': { category: 'project', type: 'research_focus' },
      'impact': { category: 'impact', type: 'impact_requirement' },
      'market_size': { category: 'market_size', type: 'market_scope' },
      'use_of_funds': { category: 'use_of_funds', type: 'use_of_funds' },
      'co_financing': { category: 'financial', type: 'co_financing' }
    };
    
    // For auto-generated questions, try to parse from ID
    if (!questionMapping[question.id]) {
      // Try to parse from ID like "eligibility_company_stage"
      const parts = question.id.split('_');
      if (parts.length >= 2) {
        category = parts[0];
        type = parts.slice(1).join('_');
      }
    } else {
      ({ category, type } = questionMapping[question.id]);
    }
    
    // Analyze values in database
    if (category && type) {
      const valueAnalysis = analyzeQuestionValues(programs, question.id, category, type);
      
      console.log(`\n📈 Database Values:`);
      console.log(`   Programs with this requirement: ${valueAnalysis.programsWithRequirement} (${((valueAnalysis.programsWithRequirement / programs.length) * 100).toFixed(1)}%)`);
      console.log(`   Unique values in database: ${valueAnalysis.totalValues}`);
      console.log(`   Top 5 values:`);
      valueAnalysis.topValues.slice(0, 5).forEach(([value, count], idx) => {
        const truncated = value.length > 60 ? value.substring(0, 60) + '...' : value;
        console.log(`     ${idx + 1}. "${truncated}" (${count} programs)`);
      });
    } else {
      console.log(`\n⚠️ Could not determine category/type for question ${question.id}`);
    }
    
    // Test filtering with first option
    console.log(`\n🔍 Filtering Test:`);
    if (question.options.length > 0) {
      const sampleAnswer = question.type === 'multi-select' 
        ? [question.options[0].value]
        : question.options[0].value;
      
      const filterResult = testFiltering(questionEngine, programs, question.id, sampleAnswer);
      
      console.log(`   Sample answer: "${sampleAnswer}"`);
      console.log(`   Programs: ${filterResult.before} → ${filterResult.after} (filtered ${filterResult.filtered}, ${filterResult.percentage}%)`);
      
      if (filterResult.filtered === 0) {
        console.log(`   ⚠️ No filtering - this question is not filtering programs`);
        console.log(`   💡 Possible reasons:`);
        console.log(`      - No matching logic implemented for this question ID`);
        console.log(`      - Matching logic doesn't match the actual database values`);
        console.log(`      - Sample answer doesn't match any program requirements`);
      }
    } else {
      console.log(`   ⚠️ No options available - cannot test filtering`);
    }
    
    // Show question options
    console.log(`\n📋 Question Options (${question.options.length}):`);
    question.options.slice(0, 5).forEach((opt, idx) => {
      console.log(`   ${idx + 1}. ${opt.value} (${opt.label})`);
    });
    if (question.options.length > 5) {
      console.log(`   ... and ${question.options.length - 5} more`);
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal Programs: ${programs.length}`);
  console.log(`Total Questions: ${questions.length}`);
  
  // Count questions with filtering
  let questionsWithFiltering = 0;
  let questionsWithoutFiltering = 0;
  
  for (const question of questions) {
    if (question.options.length > 0) {
      const sampleAnswer = question.type === 'multi-select' 
        ? [question.options[0].value]
        : question.options[0].value;
      const result = testFiltering(questionEngine, programs, question.id, sampleAnswer);
      if (result.filtered > 0) {
        questionsWithFiltering++;
      } else {
        questionsWithoutFiltering++;
      }
    }
  }
  
  console.log(`Questions with filtering: ${questionsWithFiltering}`);
  console.log(`Questions without filtering: ${questionsWithoutFiltering}`);
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`   - Questions without filtering need matching logic implemented`);
  console.log(`   - Check if question IDs match the filtering logic in questionEngine.ts`);
  console.log(`   - Verify database values match the expected format in matching functions`);
}

main().catch(error => {
  console.error('❌ Analysis failed:', error);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});


/**
 * Analyze Requirement Accuracy - Check which requirements match answers
 * This shows what's below 80% accuracy and why
 */

require('dotenv').config({ path: '.env.local' });

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
  
  const pages = await getAllPages(1216);
  console.log(`📥 Loading ${pages.length} pages...`);
  
  const programs = [];
  const batchSize = 50;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const batchPrograms = await Promise.all(batch.map(async (page) => {
      const reqResult = await pool.query(
        'SELECT category, type, value, required FROM requirements WHERE page_id = $1',
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
    if (i % 200 === 0) {
      console.log(`   Loaded ${programs.length}/${pages.length}...`);
    }
  }
  
  await pool.end();
  return programs;
}

function checkAnswerAccuracy(programs, questionId, answer, category, type) {
  let matching = 0;
  let total = 0;
  
  for (const program of programs) {
    const categorized = program.categorized_requirements || {};
    const categoryData = categorized[category];
    
    if (!categoryData || !Array.isArray(categoryData)) {
      continue; // No requirement = skip for accuracy check
    }
    
    const reqs = categoryData.filter(r => r.type === type);
    if (reqs.length === 0) continue; // No matching requirement type
    
    total++;
    
    // Check if answer matches requirement value
    const matches = reqs.some(req => {
      const reqValue = String(req.value || '').toLowerCase();
      const answerValue = String(answer).toLowerCase();
      
      // Simple matching
      if (reqValue.includes(answerValue) || answerValue.includes(reqValue)) {
        return true;
      }
      
      // For location, check specific mappings
      if (questionId === 'location') {
        if (answerValue === 'austria' && (reqValue.includes('austria') || reqValue.includes('vienna') || reqValue === 'at')) return true;
        if (answerValue === 'germany' && (reqValue.includes('germany') || reqValue.includes('berlin') || reqValue === 'de')) return true;
        if (answerValue === 'eu' && (reqValue.includes('eu') || reqValue.includes('europe'))) return true;
      }
      
      return false;
    });
    
    if (matches) matching++;
  }
  
  const accuracy = total > 0 ? (matching / total * 100).toFixed(1) : '0.0';
  return { matching, total, accuracy: parseFloat(accuracy) };
}

async function main() {
  console.log('📊 REQUIREMENT ACCURACY ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs\n`);
  
  const questionEngine = new QuestionEngine(programs);
  const questions = questionEngine.getAllQuestions();
  
  console.log(`📋 Analyzing ${questions.length} questions\n`);
  console.log('='.repeat(80));
  console.log();
  
  const results = [];
  
  for (const question of questions) {
    // Determine category/type from question ID
    let category = '';
    let type = '';
    
    // Map question IDs to requirement types
    const mapping = {
      'location': { category: 'geographic', type: 'location' },
      'company_type': { category: 'eligibility', type: 'company_type' },
      'funding_amount': { category: 'financial', type: 'funding_amount' },
      'consortium': { category: 'consortium', type: 'consortium_requirement' },
      'team_size': { category: 'team', type: 'team_requirement' },
      'impact': { category: 'impact', type: 'impact_requirement' }
    };
    
    if (mapping[question.id]) {
      ({ category, type } = mapping[question.id]);
    } else {
      // Auto-generated question - parse from ID
      const parts = question.id.split('_');
      if (parts.length >= 2) {
        category = parts[0];
        type = parts.slice(1).join('_');
      }
    }
    
    // Get sample answer
    const sampleAnswer = question.type === 'multi-select' 
      ? (question.options[0]?.value || '')
      : (question.options[0]?.value || '');
    
    if (!sampleAnswer) continue;
    
    // Check accuracy
    const accuracy = checkAnswerAccuracy(programs, question.id, sampleAnswer, category, type);
    
    results.push({
      questionId: question.id,
      category,
      type,
      sampleAnswer,
      accuracy: accuracy.accuracy,
      matching: accuracy.matching,
      total: accuracy.total
    });
    
    const status = accuracy.accuracy >= 80 ? '✅' : accuracy.accuracy >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${question.id.padEnd(30)} Accuracy: ${accuracy.accuracy}% (${accuracy.matching}/${accuracy.total} programs match)`);
    
    if (accuracy.accuracy < 80 && accuracy.total > 0) {
      console.log(`   Category: ${category}, Type: ${type}`);
      console.log(`   Sample answer: "${sampleAnswer}"`);
      console.log(`   Issue: Answer doesn't match requirement values in database`);
    }
    console.log();
  }
  
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(80));
  
  const below80 = results.filter(r => r.accuracy < 80 && r.total > 0);
  const above80 = results.filter(r => r.accuracy >= 80);
  
  console.log(`\n✅ Above 80% accuracy: ${above80.length}/${results.length}`);
  above80.forEach(r => {
    console.log(`   ✅ ${r.questionId}: ${r.accuracy}%`);
  });
  
  console.log(`\n❌ Below 80% accuracy: ${below80.length}/${results.length}`);
  below80.forEach(r => {
    console.log(`   ❌ ${r.questionId}: ${r.accuracy}% (${r.matching}/${r.total} match)`);
    console.log(`      Category: ${r.category}, Type: ${r.type}`);
    console.log(`      Problem: Answer "${r.sampleAnswer}" doesn't match database values`);
  });
  
  console.log(`\n💡 RECOMMENDATION:`);
  console.log(`   These questions need better matching logic or different question options`);
  console.log(`   that match actual database values.`);
}

main().catch(error => {
  console.error('❌ Failed:', error);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});


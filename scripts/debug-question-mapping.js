/**
 * Debug Question Mapping - See why questions aren't matching correctly
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
  
  const pages = await getAllPages(1216); // Load ALL pages
  
  console.log(`📥 Loading ${pages.length} pages...`);
  
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
    if (i % 200 === 0) {
      console.log(`   Loaded ${programs.length}/${pages.length} programs...`);
    }
  }
  
  await pool.end();
  return programs;
}

function mapRequirementToQuestionId(category, type) {
  // Same logic as QuestionEngine
  if (category === 'geographic' && (type === 'location' || type.includes('location') || type.includes('region') || type.includes('standort'))) {
    return 'location';
  }
  if (category === 'team' && (type === 'max_company_age' || type === 'company_age' || type.includes('age') || type.includes('unternehmen_alter'))) {
    return 'company_age';
  }
  if (category === 'team' && (type === 'min_team_size' || type === 'team_size' || type.includes('team') || type.includes('mitarbeiter') || type.includes('personal'))) {
    return 'team_size';
  }
  if (category === 'financial' && (type === 'revenue' || type === 'revenue_range' || type.includes('revenue') || type.includes('umsatz'))) {
    return 'revenue';
  }
  if (category === 'financial' && (type === 'funding_amount' || type.includes('funding') || type.includes('förderbetrag') || type.includes('förderhöhe'))) {
    return 'funding_amount';
  }
  if (category === 'financial' && (type === 'co_financing' || type.includes('cofinancing') || type.includes('eigenmittel') || type.includes('eigenanteil'))) {
    return 'co_financing';
  }
  if (category === 'co_financing' && (type === 'co_financing' || type.includes('cofinancing') || type.includes('eigenmittel') || type.includes('eigenanteil'))) {
    return 'co_financing';
  }
  if (category === 'use_of_funds' || (category === 'financial' && type.includes('use_of_funds'))) {
    return 'use_of_funds';
  }
  if (category === 'project' && (type === 'research_focus' || type.includes('research') || type.includes('forschung'))) {
    return 'research_focus';
  }
  if (category === 'consortium' && (type === 'international_collaboration' || type === 'cooperation' || type === 'consortium_required' || type.includes('consortium') || type.includes('partner') || type.includes('konsortium') || type.includes('cooperation'))) {
    return 'consortium';
  }
  if (category === 'eligibility' && (type === 'company_type' || type.includes('company_type') || type.includes('unternehmenstyp'))) {
    return 'company_type';
  }
  if (category === 'impact' && (type === 'sustainability' || type === 'employment_impact' || type === 'social' || type === 'climate_environmental' || type === 'impact_requirement' || type.includes('impact') || type.includes('wirkung') || type.includes('nachhaltigkeit'))) {
    return 'impact';
  }
  if (category === 'market_size' && (type === 'market_scope' || type.includes('market') || type.includes('markt'))) {
    return 'market_size';
  }
  
  return null;
}

async function main() {
  console.log('🔍 QUESTION MAPPING DEBUG');
  console.log('='.repeat(80));
  console.log();
  
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs\n`);
  
  // Analyze requirement frequencies
  const frequencyMap = new Map();
  
  for (const program of programs) {
    const categorized = program.categorized_requirements || {};
    for (const [category, items] of Object.entries(categorized)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const reqType = item.type || 'unknown';
        const key = `${category}:${reqType}`;
        
        if (!frequencyMap.has(key)) {
          frequencyMap.set(key, {
            category,
            type: reqType,
            frequency: 0,
            questionId: mapRequirementToQuestionId(category, reqType)
          });
        }
        frequencyMap.get(key).frequency++;
      }
    }
  }
  
  const frequencies = Array.from(frequencyMap.values())
    .sort((a, b) => b.frequency - a.frequency);
  
  console.log('📊 TOP REQUIREMENT TYPES AND THEIR MAPPINGS:');
  console.log('='.repeat(80));
  console.log();
  
  // Group by question ID
  const byQuestionId = new Map();
  
  frequencies.forEach(req => {
    const qId = req.questionId || 'UNMAPPED';
    if (!byQuestionId.has(qId)) {
      byQuestionId.set(qId, []);
    }
    byQuestionId.get(qId).push(req);
  });
  
  // Show mapped questions first
  const mappedQuestionIds = ['location', 'company_type', 'company_age', 'revenue', 'funding_amount', 
    'use_of_funds', 'impact', 'co_financing', 'research_focus', 'consortium', 'market_size', 'team_size'];
  
  console.log('✅ MAPPED QUESTIONS:');
  console.log('-'.repeat(80));
  mappedQuestionIds.forEach(qId => {
    const reqs = byQuestionId.get(qId) || [];
    if (reqs.length > 0) {
      const totalFreq = reqs.reduce((sum, r) => sum + r.frequency, 0);
      console.log(`\n📋 ${qId} (${totalFreq} total requirements):`);
      reqs.slice(0, 5).forEach(req => {
        console.log(`   - ${req.category}:${req.type} (${req.frequency} programs)`);
      });
      if (reqs.length > 5) {
        console.log(`   ... and ${reqs.length - 5} more requirement types`);
      }
    }
  });
  
  console.log('\n\n❌ UNMAPPED REQUIREMENT TYPES (will create auto-generated questions):');
  console.log('-'.repeat(80));
  const unmapped = (byQuestionId.get('UNMAPPED') || []).slice(0, 20);
  unmapped.forEach((req, idx) => {
    console.log(`${idx + 1}. ${req.category}:${req.type} (${req.frequency} programs)`);
  });
  
  // Now create QuestionEngine and see what it generates
  console.log('\n\n🔧 QUESTION ENGINE OUTPUT:');
  console.log('='.repeat(80));
  const questionEngine = new QuestionEngine(programs);
  const questions = questionEngine.getAllQuestions();
  
  console.log(`\n✅ Generated ${questions.length} questions:\n`);
  questions.forEach((q, idx) => {
    console.log(`${idx + 1}. ${q.id} (priority: ${q.priority}, required: ${q.required})`);
    console.log(`   Options: ${q.options.length}`);
  });
  
  // Check what's missing
  console.log('\n\n⚠️ MISSING MAPPINGS:');
  console.log('-'.repeat(80));
  const importantUnmapped = unmapped.filter(r => r.frequency >= 100);
  if (importantUnmapped.length > 0) {
    console.log('High-frequency requirement types that should be mapped:');
    importantUnmapped.forEach(req => {
      console.log(`   - ${req.category}:${req.type} (${req.frequency} programs)`);
      console.log(`     Could map to: [suggest mapping]`);
    });
  }
}

main().catch(error => {
  console.error('❌ Failed:', error);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});


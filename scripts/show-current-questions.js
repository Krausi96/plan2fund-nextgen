/**
 * Show Current Questions - What's actually being asked
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

async function main() {
  console.log('📋 CURRENT QUESTIONS BEING GENERATED');
  console.log('='.repeat(80));
  console.log();
  
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs\n`);
  
  const questionEngine = new QuestionEngine(programs);
  const questions = questionEngine.getAllQuestions();
  
  console.log(`📊 Total Questions: ${questions.length}\n`);
  console.log('='.repeat(80));
  console.log();
  
  questions.forEach((q, idx) => {
    console.log(`${idx + 1}. ${q.id.toUpperCase()}`);
    console.log(`   Question: ${q.symptom}`);
    console.log(`   Type: ${q.type}`);
    console.log(`   Required: ${q.required ? 'Yes' : 'No'}`);
    console.log(`   Options (${q.options.length}):`);
    q.options.forEach((opt, optIdx) => {
      console.log(`     ${optIdx + 1}. Value: "${opt.value}"`);
      console.log(`        Label: ${opt.label}`);
      if (opt.description) {
        console.log(`        Description: ${opt.description}`);
      }
    });
    console.log();
  });
  
  console.log('\n📊 QUESTION ORDER:');
  console.log(questions.map((q, idx) => `${idx + 1}. ${q.id}`).join(' → '));
}

main().catch(console.error);


/**
 * Quick test of current question engine state
 * Run this after new data is parsed to see what questions are generated
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
  }
  
  await pool.end();
  return programs;
}

async function main() {
  console.log('📊 CURRENT QUESTION ENGINE STATE');
  console.log('='.repeat(80));
  console.log();
  
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs\n`);
  
  const questionEngine = new QuestionEngine(programs);
  const questions = questionEngine.getAllQuestions();
  
  console.log(`📋 Questions Generated: ${questions.length}`);
  console.log(`📋 Question Order: ${questions.map(q => q.id).join(' → ')}`);
  console.log();
  
  console.log('Questions with options:');
  questions.forEach((q, idx) => {
    console.log(`  ${idx + 1}. ${q.id} - ${q.options.length} options (${q.required ? 'required' : 'optional'})`);
  });
}

main().catch(console.error);


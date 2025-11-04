/**
 * Analyze Data Sufficiency for Question Generation
 * 
 * Shows:
 * 1. What questions we can generate (have enough data)
 * 2. What questions we CAN'T generate (insufficient data)
 * 3. Why we only have 9 instead of 10 questions
 */

const path = require('path');
const fs = require('fs');

async function loadPrograms() {
  let source = 'unknown';
  let programs = [];
  
  // Try database first (same as API does)
  try {
    require('dotenv').config({ path: '.env.local' });
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    // Register ts-node to handle TypeScript imports (same as test script)
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
    
    // Load database modules (same pattern as API)
    const neonClient = require('../scraper-lite/src/db/neon-client');
    const pageRepo = require('../scraper-lite/src/db/page-repository');
    
    const { getPool } = neonClient;
    const { getAllPages } = pageRepo;
    const pool = getPool();
    
    // Load all pages (like API does)
    const pages = await getAllPages(1000);
    
    if (pages.length > 0) {
      source = 'database';
      
      // Transform pages to programs format with requirements (same as API)
      programs = await Promise.all(pages.map(async (page) => {
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
      
      console.log(`✅ Loaded ${programs.length} programs from DATABASE`);
      await pool.end();
      return { programs, source };
    }
  } catch (error) {
    console.warn(`⚠️ Database connection failed: ${error.message}`);
    console.log(`   Falling back to JSON file...\n`);
  }
  
  // Fallback to JSON file (what the API uses when database fails)
  const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    programs = data.programs || [];
    source = 'fallback';
    console.log(`⚠️ Using JSON fallback: ${programs.length} programs`);
    return { programs, source: 'fallback' };
  }
  
  return { programs: [], source: 'none' };
}

function mapRequirementToQuestionId(category, type) {
  if (category === 'geographic' && (type === 'location' || type.includes('location'))) return 'location';
  if (category === 'team' && (type === 'max_company_age' || type === 'company_age' || type.includes('age'))) return 'company_age';
  if (category === 'team' && (type === 'min_team_size' || type === 'team_size' || type.includes('team'))) return 'team_size';
  if (category === 'financial' && (type === 'revenue' || type === 'revenue_range' || type.includes('revenue'))) return 'revenue';
  if (category === 'financial' && (type === 'funding_amount' || type.includes('funding'))) return 'funding_amount';
  if (category === 'financial' && (type === 'co_financing' || type.includes('cofinancing'))) return 'co_financing';
  if (category === 'co_financing' && (type === 'co_financing' || type.includes('cofinancing'))) return 'co_financing';
  if (category === 'project' && (type === 'research_focus' || type.includes('research'))) return 'research_focus';
  if (category === 'consortium' && (type === 'international_collaboration' || type === 'cooperation' || type === 'consortium_required' || type.includes('consortium') || type.includes('partner'))) return 'consortium';
  if (category === 'eligibility' && (type === 'company_type' || type.includes('company_type'))) return 'company_type';
  if (category === 'market_size' && (type === 'market_scope' || type.includes('market'))) return 'market_size';
  if (category === 'use_of_funds' || (category === 'financial' && type.includes('use_of_funds'))) return 'use_of_funds';
  if (category === 'impact' && (type === 'sustainability' || type === 'employment_impact' || type === 'social' || type === 'climate_environmental' || type === 'impact_requirement' || type.includes('impact') || type.includes('wirkung') || type.includes('nachhaltigkeit'))) return 'impact';
  return null;
}

async function main() {
  console.log('📊 DATA SUFFICIENCY ANALYSIS');
  console.log('='.repeat(80));
  console.log('\n📥 Loading programs...\n');
  
  const { programs, source } = await loadPrograms();
  console.log(`\n📊 Total Programs: ${programs.length}`);
  console.log(`📊 Data Source: ${source === 'database' ? '✅ DATABASE' : '⚠️ JSON Fallback'}\n`);
  
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
          frequencyMap.set(key, { category, type: reqType, frequency: 0 });
        }
        frequencyMap.get(key).frequency++;
      }
    }
  }
  
  const frequencies = Array.from(frequencyMap.values())
    .sort((a, b) => b.frequency - a.frequency);
  
  const MIN_FREQUENCY = Math.max(3, Math.floor(programs.length * 0.03)); // 10 programs (3%)
  const LOWER_THRESHOLD = Math.max(2, Math.floor(programs.length * 0.01)); // 3 programs (1%)
  
  console.log('📊 THRESHOLDS:');
  console.log(`   Minimum Frequency (3%): ${MIN_FREQUENCY} programs`);
  console.log(`   Lower Threshold (1%): ${LOWER_THRESHOLD} programs\n`);
  
  // Analyze each requirement type
  const questionAnalysis = new Map();
  
  for (const req of frequencies) {
    const questionId = mapRequirementToQuestionId(req.category, req.type);
    if (!questionId) continue;
    
    if (!questionAnalysis.has(questionId)) {
      questionAnalysis.set(questionId, {
        id: questionId,
        category: req.category,
        type: req.type,
        frequency: req.frequency,
        percentage: ((req.frequency / programs.length) * 100).toFixed(1),
        meetsThreshold: req.frequency >= MIN_FREQUENCY,
        meetsLowerThreshold: req.frequency >= LOWER_THRESHOLD
      });
    } else {
      // If multiple requirement types map to same question, take the highest frequency
      const existing = questionAnalysis.get(questionId);
      if (req.frequency > existing.frequency) {
        questionAnalysis.set(questionId, {
          id: questionId,
          category: req.category,
          type: req.type,
          frequency: req.frequency,
          percentage: ((req.frequency / programs.length) * 100).toFixed(1),
          meetsThreshold: req.frequency >= MIN_FREQUENCY,
          meetsLowerThreshold: req.frequency >= LOWER_THRESHOLD
        });
      }
    }
  }
  
  const requiredQuestions = [
    { id: 'location', name: 'Location', order: 1 },
    { id: 'company_type', name: 'Company Type', order: 2 },
    { id: 'company_age', name: 'Company Age', order: 3 },
    { id: 'revenue', name: 'Revenue', order: 4 },
    { id: 'funding_amount', name: 'Funding Amount', order: 5 },
    { id: 'use_of_funds', name: 'Use of Funds', order: 6 },
    { id: 'impact', name: 'Impact', order: 7 },
    { id: 'co_financing', name: 'Co-financing', order: 8 },
    { id: 'research_focus', name: 'Research Focus', order: 9 },
    { id: 'consortium', name: 'Consortium', order: 10 },
    { id: 'market_size', name: 'Market Size', order: 11 },
    { id: 'team_size', name: 'Team Size', order: 12 }
  ];
  
  console.log('📋 REQUIRED QUESTIONS vs DATA AVAILABILITY:');
  console.log('='.repeat(80));
  
  const canGenerate = [];
  const cannotGenerate = [];
  
  requiredQuestions.forEach(req => {
    const analysis = questionAnalysis.get(req.id);
    if (analysis) {
      const status = analysis.meetsThreshold ? '✅' : (analysis.meetsLowerThreshold ? '⚠️' : '❌');
      const thresholdStatus = analysis.meetsThreshold 
        ? 'Meets 3% threshold' 
        : (analysis.meetsLowerThreshold ? 'Meets 1% threshold' : 'Below 1% threshold');
      
      console.log(`${req.order.toString().padStart(2)}. ${status} ${req.name.padEnd(20)} ${analysis.frequency.toString().padStart(3)} programs (${analysis.percentage.padStart(5)}%) - ${thresholdStatus}`);
      
      if (analysis.meetsLowerThreshold) {
        canGenerate.push(req);
      } else {
        cannotGenerate.push({ ...req, reason: `Only ${analysis.frequency} programs (need ${LOWER_THRESHOLD}+)` });
      }
    } else {
      console.log(`${req.order.toString().padStart(2)}. ❌ ${req.name.padEnd(20)} NO DATA - Requirement type not found in database`);
      cannotGenerate.push({ ...req, reason: 'No requirement data exists' });
    }
  });
  
  console.log('\n\n📊 SUMMARY:');
  console.log('='.repeat(80));
  console.log(`✅ Can Generate: ${canGenerate.length} questions`);
  canGenerate.forEach(q => console.log(`   ✅ ${q.name}`));
  
  console.log(`\n❌ Cannot Generate: ${cannotGenerate.length} questions`);
  cannotGenerate.forEach(q => {
    const analysis = questionAnalysis.get(q.id);
    if (analysis) {
      console.log(`   ❌ ${q.name}: ${analysis.frequency} programs (need ${LOWER_THRESHOLD}+) - ${q.reason}`);
    } else {
      console.log(`   ❌ ${q.name}: ${q.reason}`);
    }
  });
  
  console.log(`\n📈 CURRENT STATUS:`);
  console.log(`   Questions Generated: ${canGenerate.length} (target: 10)`);
  console.log(`   Missing: ${cannotGenerate.length} questions`);
  console.log(`   Data Source: ${programs.length} programs (${source})`);
  
  if (source === 'database') {
    console.log(`   ✅ Using FULL DATABASE - this is the best data available!`);
  } else {
    console.log(`   ⚠️ Using JSON FALLBACK - limited data`);
    console.log(`   💡 Database has 1,024+ programs (not connected)`);
  }
  
  console.log(`\n💡 CONCLUSION:`);
  if (cannotGenerate.length > 0) {
    if (source === 'database') {
      console.log(`   ⚠️ Even with DATABASE, we're missing ${cannotGenerate.length} questions:`);
      console.log(`   - ${cannotGenerate.map(q => q.name).join(', ')}`);
      console.log(`   - These requirement types either don't exist or are too rare in the data`);
      console.log(`   - This is a DATA QUALITY issue, not a connection issue`);
    } else {
      console.log(`   ⚠️ With JSON FALLBACK, we're missing ${cannotGenerate.length} questions:`);
      console.log(`   - Missing: ${cannotGenerate.map(q => q.name).join(', ')}`);
      console.log(`   - Current: ${programs.length} programs in fallback`);
      console.log(`   - 💡 Try connecting to DATABASE (1,024+ programs) to see if we have more data`);
    }
  } else {
    console.log(`   ✅ We have sufficient data for all required questions!`);
  }
  
  if (source === 'fallback') {
    console.log(`\n🔍 COMPARISON:`);
    console.log(`   Current (Fallback): ${programs.length} programs → ${canGenerate.length} questions`);
    console.log(`   Expected (Database): 1,024+ programs → Likely ${canGenerate.length + cannotGenerate.length} questions`);
    console.log(`   💡 Connect to database to verify if missing questions become available`);
  }
}

main().catch(console.error);


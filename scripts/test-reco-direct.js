// Direct test script - loads data directly from database/files
// No server required
// Run with: node scripts/test-reco-direct.js

const path = require('path');
const fs = require('fs');

// Load programs directly from database or JSON
async function loadProgramsDirect() {
  // Try database first
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
        eligibility_criteria: {} // Will be built from categorized_requirements
      };
    }));
    
    return programs;
  } catch (error) {
    console.warn('⚠️ Database load failed, trying JSON fallback...');
    
    // Fallback to JSON
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
    answers: {
      location: 'austria',
      company_age: '0_2_years',
      revenue: 'under_100k',
      team_size: '1_2_people',
      research_focus: 'no',
      consortium: 'no'
    }
  },
  {
    name: 'EU Research Company',
    answers: {
      location: 'eu',
      company_age: '5_10_years',
      revenue: '500k_2m',
      team_size: 'over_10_people',
      research_focus: 'yes',
      consortium: 'yes'
    }
  }
];

async function testDirect() {
  console.log('\n🧪 ============================================');
  console.log('🧪 TESTING WIZARD FLOW (Direct Database)');
  console.log('🧪 ============================================\n');

  try {
    // Load programs
    console.log('📥 Loading programs directly from database...');
    const programs = await loadProgramsDirect();
    console.log(`✅ Loaded ${programs.length} programs`);
    
    if (programs.length === 0) {
      console.error('❌ No programs loaded!');
      return;
    }

    // Check sample
    const sample = programs[0];
    console.log('\n📊 Sample Program:');
    console.log(`  ID: ${sample.id}`);
    console.log(`  Name: ${sample.name || 'No name'}`);
    console.log(`  Has categorized_requirements: ${!!sample.categorized_requirements}`);
    
    if (sample.categorized_requirements) {
      const categories = Object.keys(sample.categorized_requirements);
      console.log(`  Categories: ${categories.length} (${categories.slice(0, 5).join(', ')}...)`);
    }

    // Analyze requirements
    console.log('\n📊 Analyzing requirement frequencies...');
    const freq = analyzeRequirements(programs);
    console.log(`\nTop 10 most common:`);
    freq.slice(0, 10).forEach((req, idx) => {
      const pct = ((req.frequency / programs.length) * 100).toFixed(1);
      console.log(`  ${idx + 1}. ${req.category}:${req.type} - ${req.frequency} (${pct}%)`);
    });

    // Test scenarios
    for (const scenario of scenarios) {
      await testScenarioDirect(programs, scenario);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

function analyzeRequirements(programs) {
  const frequencyMap = new Map();
  
  for (const program of programs) {
    const categorized = program.categorized_requirements;
    if (!categorized || typeof categorized !== 'object') continue;

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
            values: new Map()
          });
        }

        const tracker = frequencyMap.get(key);
        tracker.frequency++;

        if (item.value !== undefined && item.value !== null) {
          const valueStr = normalizeValue(item.value);
          tracker.values.set(valueStr, (tracker.values.get(valueStr) || 0) + 1);
        }
      }
    }
  }

  return Array.from(frequencyMap.values())
    .sort((a, b) => b.frequency - a.frequency);
}

function normalizeValue(value) {
  if (typeof value === 'object' && value !== null) {
    if (value.min !== undefined && value.max !== undefined) {
      return `${value.min}-${value.max}`;
    }
    return JSON.stringify(value);
  }
  return String(value).toLowerCase().trim();
}

async function testScenarioDirect(programs, scenario) {
  console.log('\n' + '='.repeat(70));
  console.log(`📋 Testing: ${scenario.name}`);
  console.log('='.repeat(70));

  let filtered = [...programs];
  const flow = [];
  const questionOrder = ['location', 'company_age', 'revenue', 'team_size', 'research_focus', 'consortium'];
  
  for (let i = 0; i < questionOrder.length; i++) {
    const qId = questionOrder[i];
    const answer = scenario.answers[qId];
    if (answer === undefined) continue;

    const before = filtered.length;
    filtered = filterPrograms(filtered, qId, answer);
    const after = filtered.length;
    const filteredCount = before - after;
    const pct = before > 0 ? ((filteredCount / before) * 100).toFixed(1) : '0';

    console.log(`\n  ${i + 1}. ${qId} = ${answer}`);
    console.log(`     ${before} → ${after} (${pct}% filtered)`);

    flow.push({ question: qId, answer, before, after, filtered: pct + '%' });
  }

  console.log(`\n📊 Final: ${filtered.length} of ${programs.length} programs (${((programs.length - filtered.length) / programs.length * 100).toFixed(1)}% filtered)`);

  // Score
  const scored = scorePrograms(filtered, scenario.answers);
  const perfect = scored.filter(r => r.score >= 100);
  const high = scored.filter(r => r.score >= 80 && r.score < 100);

  console.log(`\n🎯 Scoring: ${scored.length} programs`);
  console.log(`   Perfect (100%): ${perfect.length}`);
  console.log(`   High (80-99%): ${high.length}`);

  if (perfect.length > 0) {
    console.log(`\n🎯 100% MATCHES:`);
    perfect.slice(0, 5).forEach((m, idx) => {
      console.log(`\n   ${idx + 1}. ${m.name}`);
      console.log(`      ID: ${m.id}`);
      console.log(`      Matched: ${m.matched.length} criteria`);
    });
  }
}

function filterPrograms(programs, qId, answer) {
  return programs.filter(p => {
    const cat = p.categorized_requirements || {};
    const elig = p.eligibility_criteria || {};
    
    switch (qId) {
      case 'location':
        return matchesLocation(p, cat, elig, answer);
      case 'company_age':
        return matchesCompanyAge(p, cat, elig, answer);
      case 'revenue':
        return matchesRevenue(p, cat, elig, answer);
      case 'team_size':
        return matchesTeamSize(p, cat, elig, answer);
      case 'research_focus':
        return answer === 'no' ? !requiresResearch(p, cat, elig) : true;
      case 'consortium':
        return answer === 'no' ? !requiresConsortium(p, cat, elig) : true;
      default:
        return true;
    }
  });
}

function matchesLocation(p, cat, elig, loc) {
  if (cat.geographic) {
    const geoReqs = cat.geographic.filter(r => r.type === 'location');
    if (geoReqs.length > 0) {
      const progLocs = geoReqs.map(r => String(r.value).toLowerCase());
      const userLoc = String(loc).toLowerCase();
      return progLocs.some(pl => pl.includes(userLoc) || userLoc.includes(pl));
    }
  }
  return true;
}

function matchesCompanyAge(p, cat, elig, answer) {
  const userAge = parseAge(answer);
  if (cat.team) {
    const ageReqs = cat.team.filter(r => r.type === 'max_company_age');
    if (ageReqs.length > 0) {
      const maxAge = ageReqs[0].value;
      if (typeof maxAge === 'number' && userAge > maxAge) return false;
    }
  }
  return true;
}

function matchesRevenue(p, cat, elig, answer) {
  const userRev = parseRevenue(answer);
  if (cat.financial) {
    const revReqs = cat.financial.filter(r => r.type === 'revenue_range');
    if (revReqs.length > 0) {
      const req = revReqs[0];
      if (req.value && typeof req.value === 'object') {
        const min = req.value.min || 0;
        const max = req.value.max || Infinity;
        if (userRev < min || userRev > max) return false;
      }
    }
  }
  return true;
}

function matchesTeamSize(p, cat, elig, answer) {
  const userSize = parseTeamSize(answer);
  if (cat.team) {
    const teamReqs = cat.team.filter(r => r.type === 'min_team_size');
    if (teamReqs.length > 0) {
      const minSize = teamReqs[0].value;
      if (typeof minSize === 'number' && userSize < minSize) return false;
    }
  }
  return true;
}

function requiresResearch(p, cat, elig) {
  return cat.project?.some(r => r.type === 'research_focus' && r.value) || false;
}

function requiresConsortium(p, cat, elig) {
  return cat.consortium?.some(r => r.type === 'international_collaboration' && r.value === true) || false;
}

function parseAge(answer) {
  if (answer.includes('0_2')) return 2;
  if (answer.includes('2_5')) return 5;
  if (answer.includes('5_10')) return 10;
  return 20;
}

function parseRevenue(answer) {
  if (answer.includes('under_100')) return 50000;
  if (answer.includes('100k_500')) return 250000;
  if (answer.includes('500k_2m')) return 1000000;
  return 5000000;
}

function parseTeamSize(answer) {
  if (answer.includes('1_2')) return 1;
  if (answer.includes('3_5')) return 3;
  if (answer.includes('6_10')) return 6;
  return 10;
}

function scorePrograms(programs, answers) {
  return programs.map(p => {
    const cat = p.categorized_requirements || {};
    const elig = p.eligibility_criteria || {};
    
    let score = 0;
    let max = 0;
    const matched = [];

    max += 20;
    if (answers.location && matchesLocation(p, cat, elig, answers.location)) {
      score += 20;
      matched.push('location');
    }

    max += 20;
    if (answers.company_age && matchesCompanyAge(p, cat, elig, answers.company_age)) {
      score += 20;
      matched.push('company_age');
    }

    max += 20;
    if (answers.revenue && matchesRevenue(p, cat, elig, answers.revenue)) {
      score += 20;
      matched.push('revenue');
    }

    max += 20;
    if (answers.team_size && matchesTeamSize(p, cat, elig, answers.team_size)) {
      score += 20;
      matched.push('team_size');
    }

    const pct = max > 0 ? Math.round((score / max) * 100) : 0;

    return {
      id: p.id,
      name: p.name || 'Unknown',
      score: pct,
      matched
    };
  }).sort((a, b) => b.score - a.score);
}

if (require.main === module) {
  testDirect().catch(console.error);
}

module.exports = { testDirect };


// Simple test script showing question tree - works without TypeScript
// Run with: node scripts/test-reco-tree-simple.js

const path = require('path');
const fs = require('fs');

// Load programs
async function loadPrograms() {
  try {
    const { getPool } = require('../scraper-lite/src/db/neon-client');
    const { getAllPages } = require('../scraper-lite/src/db/page-repository');
    const pool = getPool();
    const pages = await getAllPages(1000);
    
    if (pages.length === 0) throw new Error('No pages');
    
    const programs = await Promise.all(pages.map(async (page) => {
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
        categorized_requirements
      };
    }));
    
    return programs;
  } catch (error) {
    const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return data.programs || [];
    }
    throw error;
  }
}

// Analyze requirements to find question types
function analyzeRequirements(programs) {
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

// Map requirement to question ID
function mapToQuestionId(category, type) {
  // All the mappings from QuestionEngine
  if (category === 'geographic' && (type === 'location' || type.includes('location'))) return 'location';
  if (category === 'team' && (type === 'max_company_age' || type.includes('age'))) return 'company_age';
  if (category === 'team' && (type === 'min_team_size' || type.includes('team'))) return 'team_size';
  if (category === 'financial' && (type === 'revenue' || type.includes('revenue'))) return 'revenue';
  if (category === 'financial' && (type === 'funding_amount' || type.includes('funding'))) return 'funding_amount';
  if (category === 'financial' && (type === 'co_financing' || type.includes('cofinancing'))) return 'co_financing';
  if (category === 'project' && (type === 'research_focus' || type.includes('research'))) return 'research_focus';
  if (category === 'project' && (type === 'innovation_focus' || type.includes('innovation'))) return 'innovation_focus';
  if (category === 'project' && (type === 'sustainability_focus' || type.includes('sustainability'))) return 'sustainability_focus';
  if (category === 'project' && (type === 'industry_focus' || type.includes('industry'))) return 'industry_focus';
  if (category === 'consortium' && (type.includes('consortium') || type.includes('partner'))) return 'consortium';
  if (category === 'technical' && (type === 'trl_level' || type.includes('trl'))) return 'trl_level';
  if (category === 'technical' && (type === 'technology_focus' || type.includes('technology'))) return 'technology_focus';
  if (category === 'eligibility' && (type === 'company_type' || type.includes('company_type'))) return 'company_type';
  if (category === 'eligibility' && (type === 'sector' || type.includes('sector'))) return 'sector';
  if (category === 'timeline' && (type === 'deadline' || type.includes('deadline'))) return 'deadline_urgency';
  if (category === 'timeline' && (type === 'duration' || type.includes('duration'))) return 'project_duration';
  if (category === 'impact' && (type.includes('impact') || type.includes('nachhaltigkeit'))) return 'impact_focus';
  if (category === 'market_size' && (type.includes('market') || type.includes('markt'))) return 'market_size';
  if (category === 'revenue_model') return 'revenue_model';
  if (category === 'use_of_funds') return 'use_of_funds';
  if (category === 'capex_opex') return 'investment_type';
  if (category === 'legal' && type.includes('legal')) return 'legal_compliance';
  if (category === 'documents' && type.includes('document')) return 'has_documents';
  
  // Generic fallback
  if (type && type !== 'unknown') {
    return `${category}_${type}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  }
  return category;
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
      consortium: 'yes',
      innovation_focus: 'yes'
    }
  }
];

async function testFullTree() {
  console.log('\n🧪 ============================================');
  console.log('🧪 FULL QUESTION TREE TEST - ALL 18-19 CATEGORIES');
  console.log('🧪 ============================================\n');

  try {
    // Load programs
    console.log('📥 Loading programs...');
    const programs = await loadPrograms();
    console.log(`✅ Loaded ${programs.length} programs\n`);

    // Analyze requirements
    console.log('📊 Analyzing requirement frequencies...');
    const frequencies = analyzeRequirements(programs);
    
    console.log(`\n📋 TOP 30 MOST COMMON REQUIREMENT TYPES:`);
    frequencies.slice(0, 30).forEach((req, idx) => {
      const pct = ((req.frequency / programs.length) * 100).toFixed(1);
      const questionId = mapToQuestionId(req.category, req.type);
      console.log(`   ${idx + 1}. ${req.category}:${req.type} → ${questionId} (${req.frequency} programs, ${pct}%)`);
    });

    // Generate question list
    const questionMap = new Map();
    frequencies.forEach(req => {
      const questionId = mapToQuestionId(req.category, req.type);
      if (questionId && req.frequency >= Math.max(3, Math.floor(programs.length * 0.05))) {
        if (!questionMap.has(questionId)) {
          questionMap.set(questionId, {
            id: questionId,
            category: req.category,
            type: req.type,
            frequency: req.frequency,
            priority: questionMap.size
          });
        }
      }
    });

    const questions = Array.from(questionMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    console.log(`\n✅ GENERATED ${questions.length} QUESTIONS:`);
    questions.forEach((q, idx) => {
      console.log(`   ${idx + 1}. ${q.id} (${q.category}:${q.type}) - ${q.frequency} programs (priority: ${q.priority})`);
    });

    // Test each scenario
    for (const scenario of scenarios) {
      await testScenario(programs, scenario, questions);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testScenario(programs, scenario, questions) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 SCENARIO: ${scenario.name}`);
  console.log('='.repeat(80));

  let filtered = [...programs];
  const questionTree = [];
  const answers = {};
  
  // Simulate question flow - ask ALL questions in priority order
  // Show conditional logic: questions adapt based on remaining programs
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    // Check if this question should be asked based on remaining programs
    // Conditional: Only ask if there are programs that have this requirement
    const programsWithReq = filtered.filter(p => {
      const cat = p.categorized_requirements || {};
      return hasRequirement(cat, question.category, question.type);
    });
    
    // Skip if no programs have this requirement (conditional logic)
    if (programsWithReq.length === 0 && i > 3) {
      console.log(`\n   ${i + 1}. ⏭️  ${question.id} - SKIPPED (conditional: no programs with this requirement)`);
      continue;
    }
    
    const answer = scenario.answers[question.id];
    
    // If no answer provided, use a default or skip
    if (answer === undefined) {
      console.log(`\n   ${i + 1}. ❓ ${question.id}`);
      console.log(`      Category: ${question.category}:${question.type}`);
      console.log(`      Programs with this requirement: ${programsWithReq.length}`);
      console.log(`      ⚠️  No answer in scenario - skipping`);
      continue;
    }
    
    const programsBefore = filtered.length;
    
    // Simple filtering (simplified version)
    filtered = filterPrograms(filtered, question.id, answer);
    
    const programsAfter = filtered.length;
    const filteredCount = programsBefore - programsAfter;
    const effectiveness = programsBefore > 0 ? ((filteredCount / programsBefore) * 100).toFixed(1) : '0';
    
    answers[question.id] = answer;
    
    console.log(`\n   ${i + 1}. ❓ ${question.id}`);
    console.log(`      Category: ${question.category}:${question.type}`);
    console.log(`      Answer: ${answer}`);
    console.log(`      Programs: ${programsBefore} → ${programsAfter} (${effectiveness}% filtered)`);
    
    const isConditional = i > 2 && programsWithReq.length < filtered.length;
    
    questionTree.push({
      step: i + 1,
      questionId: question.id,
      category: question.category,
      answer,
      programsBefore,
      programsAfter,
      effectiveness: effectiveness + '%',
      isConditional,
      programsWithRequirement: programsWithReq.length
    });
    
    if (isConditional) {
      console.log(`      🔗 CONDITIONAL: Only ${programsWithReq.length} of ${filtered.length} programs have this requirement`);
    }
    
    // Stop if filtered enough
    if (programsAfter <= 5 && i >= 5) break;
  }

  console.log(`\n📊 FINAL STATE:`);
  console.log(`   Starting: ${programs.length} programs`);
  console.log(`   Final: ${filtered.length} programs`);
  console.log(`   Filter rate: ${((programs.length - filtered.length) / programs.length * 100).toFixed(1)}%`);
  console.log(`   Questions asked: ${questionTree.length}`);

  // Show tree
  console.log(`\n🌳 TOP-DOWN QUESTION TREE:`);
  console.log(`\n   ${programs.length} programs`);
  questionTree.forEach((q, idx) => {
    const indent = '   ' + '│  '.repeat(idx);
    const connector = idx === questionTree.length - 1 ? '└─' : '├─';
    console.log(`${indent}${connector} ${q.questionId} = ${q.answer}`);
    console.log(`${indent}${idx === questionTree.length - 1 ? '   ' : '│  '}  ${q.programsBefore} → ${q.programsAfter} (${q.effectiveness} filtered)`);
  });
  console.log(`   └─ ${filtered.length} programs remaining`);

  // Simple scoring
  const scored = scorePrograms(filtered, answers);
  const perfect = scored.filter(r => r.score >= 100);
  const high = scored.filter(r => r.score >= 80 && r.score < 100);
  
  console.log(`\n🎯 RESULTS:`);
  console.log(`   Perfect (100%): ${perfect.length}`);
  console.log(`   High (80-99%): ${high.length}`);
  
  if (perfect.length > 0) {
    console.log(`\n🎯 100% MATCHES:`);
    perfect.slice(0, 5).forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.name} (${m.score}%)`);
    });
  }
}

function filterPrograms(programs, questionId, answer) {
  return programs.filter(p => {
    const cat = p.categorized_requirements || {};
    
    switch (questionId) {
      case 'location':
        return matchesLocation(cat, answer);
      case 'company_age':
        return matchesAge(cat, answer);
      case 'revenue':
        return matchesRevenue(cat, answer);
      case 'team_size':
        return matchesTeamSize(cat, answer);
      case 'research_focus':
        return answer === 'no' ? !requiresResearch(cat) : true;
      case 'consortium':
        return answer === 'no' ? !requiresConsortium(cat) : true;
      default:
        return true;
    }
  });
}

function matchesLocation(cat, answer) {
  if (cat.geographic) {
    const locs = cat.geographic.filter(r => r.type === 'location');
    if (locs.length > 0) {
      const progLocs = locs.map(r => String(r.value).toLowerCase());
      const userLoc = String(answer).toLowerCase();
      return progLocs.some(l => l.includes(userLoc) || userLoc.includes(l));
    }
  }
  return true;
}

function matchesAge(cat, answer) {
  const userAge = answer.includes('0_2') ? 2 : answer.includes('2_5') ? 5 : 10;
  if (cat.team) {
    const ageReqs = cat.team.filter(r => r.type === 'max_company_age');
    if (ageReqs.length > 0) {
      const maxAge = ageReqs[0].value;
      if (typeof maxAge === 'number' && userAge > maxAge) return false;
    }
  }
  return true;
}

function matchesRevenue(cat, answer) {
  const userRev = answer.includes('under_100') ? 50000 : answer.includes('100k_500') ? 250000 : 1000000;
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

function matchesTeamSize(cat, answer) {
  const userSize = answer.includes('1_2') ? 1 : answer.includes('3_5') ? 3 : 6;
  if (cat.team) {
    const teamReqs = cat.team.filter(r => r.type === 'min_team_size');
    if (teamReqs.length > 0) {
      const minSize = teamReqs[0].value;
      if (typeof minSize === 'number' && userSize < minSize) return false;
    }
  }
  return true;
}

function requiresResearch(cat) {
  return cat.project?.some(r => r.type === 'research_focus' && r.value) || false;
}

function requiresConsortium(cat) {
  return cat.consortium?.some(r => r.type === 'international_collaboration' && r.value === true) || false;
}

function hasRequirement(cat, category, type) {
  if (!cat[category]) return false;
  return cat[category].some(r => r.type === type || r.type.includes(type) || type.includes(r.type));
}

function scorePrograms(programs, answers) {
  return programs.map(p => {
    const cat = p.categorized_requirements || {};
    let score = 0;
    let max = 0;
    
    max += 20;
    if (answers.location && matchesLocation(cat, answers.location)) score += 20;
    
    max += 20;
    if (answers.company_age && matchesAge(cat, answers.company_age)) score += 20;
    
    max += 20;
    if (answers.revenue && matchesRevenue(cat, answers.revenue)) score += 20;
    
    max += 20;
    if (answers.team_size && matchesTeamSize(cat, answers.team_size)) score += 20;
    
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    
    return {
      id: p.id,
      name: p.name || 'Unknown',
      score: pct
    };
  }).sort((a, b) => b.score - a.score);
}

if (require.main === module) {
  testFullTree().catch(console.error);
}

module.exports = { testFullTree };


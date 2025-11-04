// Test script for Recommendation Wizard System
// Run with: node scripts/test-reco-wizard.js
// Or: npm run test:reco

// Use built-in fetch (Node 18+) or https module
let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  // Fallback for older Node versions
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');
  
  fetch = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(urlObj, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => JSON.parse(data)
          });
        });
      });
      
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  };
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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
  },
  {
    name: 'International Scale-up',
    answers: {
      location: 'international',
      company_age: 'over_10_years',
      revenue: 'over_2m',
      team_size: 'over_10_people'
    }
  }
];

async function testWizardFlow() {
  console.log('\n🧪 ============================================');
  console.log('🧪 TESTING WIZARD FLOW');
  console.log('🧪 ============================================\n');

  try {
    // Step 1: Load programs
    console.log('📥 Step 1: Loading programs from API...');
    const response = await fetch(`${BASE_URL}/api/programs?enhanced=true`);
    const data = await response.json();
    const programs = data.programs || [];
    
    console.log(`✅ Loaded ${programs.length} programs`);
    
    if (programs.length === 0) {
      console.error('❌ No programs loaded! Check API endpoint.');
      return;
    }

    // Check sample program
    const sample = programs[0];
    console.log('\n📊 Sample Program Structure:');
    console.log(`  ID: ${sample.id}`);
    console.log(`  Name: ${sample.name || 'No name'}`);
    console.log(`  Has categorized_requirements: ${!!sample.categorized_requirements}`);
    
    if (sample.categorized_requirements) {
      const categories = Object.keys(sample.categorized_requirements);
      console.log(`  Categories: ${categories.length} (${categories.slice(0, 5).join(', ')}...)`);
      
      // Show sample requirements
      categories.slice(0, 3).forEach(cat => {
        const items = sample.categorized_requirements[cat];
        if (Array.isArray(items) && items.length > 0) {
          console.log(`    ${cat}: ${items.length} items`);
          if (items[0]) {
            console.log(`      Example: ${items[0].type} = ${JSON.stringify(items[0].value).substring(0, 50)}`);
          }
        }
      });
    }

    // Step 2: Test QuestionEngine (simulate client-side)
    console.log('\n🔄 Step 2: Testing QuestionEngine Logic...');
    
    // Analyze requirement frequencies manually (simulating QuestionEngine)
    const requirementFreq = analyzeRequirements(programs);
    
    console.log(`\n📊 Top 20 Most Common Requirement Types:`);
    requirementFreq.slice(0, 20).forEach((req, idx) => {
      const percentage = ((req.frequency / programs.length) * 100).toFixed(1);
      console.log(`  ${idx + 1}. ${req.category}:${req.type} - ${req.frequency} programs (${percentage}%)`);
    });

    // Step 3: Test each scenario
    for (const scenario of scenarios) {
      await testScenario(programs, scenario, requirementFreq);
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

async function testScenario(programs, scenario, requirementFreq) {
  console.log('\n' + '='.repeat(70));
  console.log(`📋 Testing Scenario: ${scenario.name}`);
  console.log('='.repeat(70));

  const questionFlow = [];
  let filteredPrograms = [...programs];
  let step = 1;

  // Simulate question flow
  const questionOrder = ['location', 'company_age', 'revenue', 'team_size', 'research_focus', 'consortium'];
  
  for (const questionId of questionOrder) {
    const answer = scenario.answers[questionId];
    if (answer === undefined) continue;

    const programsBefore = filteredPrograms.length;
    
    // Filter programs based on answer
    filteredPrograms = filterPrograms(filteredPrograms, questionId, answer);
    
    const programsAfter = filteredPrograms.length;
    const filtered = programsBefore - programsAfter;
    const effectiveness = programsBefore > 0 ? ((filtered / programsBefore) * 100).toFixed(1) : '0';

    console.log(`\n   Step ${step}: ${questionId}`);
    console.log(`      Answer: ${answer}`);
    console.log(`      Programs: ${programsBefore} → ${programsAfter} (filtered ${filtered}, ${effectiveness}%)`);

    questionFlow.push({
      step,
      question: questionId,
      answer,
      programsBefore,
      programsAfter,
      filtered,
      effectiveness: effectiveness + '%'
    });

    step++;

    // Stop if we've filtered enough
    if (programsAfter <= 5 && step > 5) {
      console.log(`   ✅ Filtered to ${programsAfter} programs, stopping`);
      break;
    }
  }

  console.log(`\n📊 Final State:`);
  console.log(`   Total programs: ${programs.length}`);
  console.log(`   Programs remaining: ${filteredPrograms.length}`);
  console.log(`   Filter rate: ${((programs.length - filteredPrograms.length) / programs.length * 100).toFixed(1)}%`);

  // Score programs
  console.log(`\n🎯 Scoring ${filteredPrograms.length} remaining programs...`);
  
  try {
    const scoreResults = await scorePrograms(filteredPrograms, scenario.answers);
    
    console.log(`\n📈 Scoring Results:`);
    console.log(`   Total scored: ${scoreResults.length}`);
    
    // Categorize by score
    const perfect = scoreResults.filter(r => r.score >= 100);
    const high = scoreResults.filter(r => r.score >= 80 && r.score < 100);
    const medium = scoreResults.filter(r => r.score >= 50 && r.score < 80);
    const low = scoreResults.filter(r => r.score < 50);

    console.log(`   Perfect (100%): ${perfect.length}`);
    console.log(`   High (80-99%): ${high.length}`);
    console.log(`   Medium (50-79%): ${medium.length}`);
    console.log(`   Low (<50%): ${low.length}`);

    if (perfect.length > 0) {
      console.log(`\n🎯 100% MATCHES FOUND:`);
      perfect.slice(0, 5).forEach((match, idx) => {
        console.log(`\n   ${idx + 1}. ${match.name}`);
        console.log(`      ID: ${match.id}`);
        console.log(`      Type: ${match.type || match.program_type || 'unknown'}`);
        console.log(`      Score: ${match.score}%`);
        console.log(`      Matched Criteria: ${match.matchedCriteria?.length || 0}`);
        if (match.matchedCriteria && match.matchedCriteria.length > 0) {
          console.log(`      Why it matches:`);
          match.matchedCriteria.slice(0, 5).forEach(c => {
            console.log(`        ✓ ${c.reason}`);
          });
        }
      });
    } else {
      console.log(`\n⚠️ No 100% matches found`);
      if (scoreResults.length > 0) {
        const best = scoreResults[0];
        console.log(`   Best match: ${best.name} (${best.score}%)`);
        console.log(`   Matched: ${best.matchedCriteria?.length || 0} criteria`);
        console.log(`   Gaps: ${best.gaps?.length || 0} missing`);
        if (best.matchedCriteria && best.matchedCriteria.length > 0) {
          console.log(`   Matches:`);
          best.matchedCriteria.slice(0, 3).forEach(c => {
            console.log(`     ✓ ${c.reason}`);
          });
        }
        if (best.gaps && best.gaps.length > 0) {
          console.log(`   Gaps:`);
          best.gaps.slice(0, 3).forEach(g => {
            console.log(`     ⚠ ${g.description}`);
          });
        }
      }
    }

    // Show question tree
    console.log(`\n🌳 Question Tree for ${scenario.name}:`);
    console.log(`   Starting: ${programs.length} programs`);
    questionFlow.forEach(q => {
      console.log(`   ${q.step}. ${q.question} = ${q.answer}`);
      console.log(`      ${q.programsBefore} → ${q.programsAfter} (${q.effectiveness} filtered)`);
    });
    console.log(`   Final: ${filteredPrograms.length} programs`);
    console.log(`   Top match: ${scoreResults[0]?.name || 'None'} (${scoreResults[0]?.score || 0}%)`);

  } catch (error) {
    console.error(`   ❌ Scoring failed: ${error.message}`);
  }
}

function filterPrograms(programs, questionId, answer) {
  return programs.filter(program => {
    const categorized = program.categorized_requirements || {};
    const eligibility = program.eligibility_criteria || {};

    switch (questionId) {
      case 'location':
        return matchesLocation(program, categorized, eligibility, answer);
      case 'company_age':
        return matchesCompanyAge(program, categorized, eligibility, answer);
      case 'revenue':
        return matchesRevenue(program, categorized, eligibility, answer);
      case 'team_size':
        return matchesTeamSize(program, categorized, eligibility, answer);
      case 'research_focus':
        if (answer === 'no') {
          return !requiresResearch(program, categorized, eligibility);
        }
        return true;
      case 'consortium':
        if (answer === 'no') {
          return !requiresConsortium(program, categorized, eligibility);
        }
        return true;
      default:
        return true;
    }
  });
}

function matchesLocation(program, categorized, eligibility, userLocation) {
  if (categorized.geographic) {
    const geoReqs = categorized.geographic.filter(r => r.type === 'location');
    if (geoReqs.length > 0) {
      const programLocations = geoReqs.map(r => String(r.value).toLowerCase());
      const userLoc = String(userLocation).toLowerCase();
      return programLocations.some(loc => 
        loc.includes(userLoc) || userLoc.includes(loc) ||
        (userLoc === 'austria' && (loc.includes('austria') || loc.includes('vienna'))) ||
        (userLoc === 'eu' && (loc.includes('eu') || loc.includes('europe')))
      );
    }
  }
  if (eligibility.location) {
    const progLoc = String(eligibility.location).toLowerCase();
    const userLoc = String(userLocation).toLowerCase();
    return progLoc.includes(userLoc) || userLoc.includes(progLoc);
  }
  return true; // No location requirement = available
}

function matchesCompanyAge(program, categorized, eligibility, answer) {
  const userAge = parseAge(answer);
  if (categorized.team) {
    const ageReqs = categorized.team.filter(r => r.type === 'max_company_age' || r.type === 'company_age');
    if (ageReqs.length > 0) {
      const maxAge = ageReqs[0].value;
      if (typeof maxAge === 'number' && userAge > maxAge) return false;
    }
  }
  if (eligibility.max_company_age && userAge > eligibility.max_company_age) {
    return false;
  }
  return true;
}

function matchesRevenue(program, categorized, eligibility, answer) {
  const userRev = parseRevenue(answer);
  if (categorized.financial) {
    const revReqs = categorized.financial.filter(r => r.type === 'revenue' || r.type === 'revenue_range');
    if (revReqs.length > 0) {
      const req = revReqs[0];
      if (req.value && typeof req.value === 'object') {
        const min = req.value.min || 0;
        const max = req.value.max || Infinity;
        if (userRev < min || userRev > max) return false;
      }
    }
  }
  if (eligibility.revenue_min && userRev < eligibility.revenue_min) return false;
  if (eligibility.revenue_max && userRev > eligibility.revenue_max) return false;
  return true;
}

function matchesTeamSize(program, categorized, eligibility, answer) {
  const userSize = parseTeamSize(answer);
  if (categorized.team) {
    const teamReqs = categorized.team.filter(r => r.type === 'min_team_size' || r.type === 'team_size');
    if (teamReqs.length > 0) {
      const minSize = teamReqs[0].value;
      if (typeof minSize === 'number' && userSize < minSize) return false;
    }
  }
  if (eligibility.min_team_size && userSize < eligibility.min_team_size) return false;
  return true;
}

function requiresResearch(program, categorized, eligibility) {
  if (categorized.project) {
    return categorized.project.some(r => r.type === 'research_focus' && r.value);
  }
  return !!eligibility.research_focus;
}

function requiresConsortium(program, categorized, eligibility) {
  if (categorized.consortium) {
    return categorized.consortium.some(r => r.type === 'international_collaboration' && r.value === true);
  }
  return !!eligibility.international_collaboration;
}

function parseAge(answer) {
  if (answer.includes('0_2') || answer.includes('2_years')) return 2;
  if (answer.includes('2_5') || answer.includes('5_years')) return 5;
  if (answer.includes('5_10') || answer.includes('10_years')) return 10;
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

async function scorePrograms(programs, answers) {
  // Simplified scoring - count how many requirements match
  return programs.map(program => {
    const categorized = program.categorized_requirements || {};
    const eligibility = program.eligibility_criteria || {};
    
    let score = 0;
    let maxScore = 0;
    const matchedCriteria = [];
    const gaps = [];

    // Location match
    maxScore += 20;
    if (answers.location && matchesLocation(program, categorized, eligibility, answers.location)) {
      score += 20;
      matchedCriteria.push({
        key: 'location',
        reason: `Location matches: ${answers.location}`
      });
    } else if (answers.location) {
      gaps.push({
        description: `Location requirement not met: ${answers.location}`
      });
    }

    // Age match
    maxScore += 20;
    if (answers.company_age && matchesCompanyAge(program, categorized, eligibility, answers.company_age)) {
      score += 20;
      matchedCriteria.push({
        key: 'company_age',
        reason: `Company age matches: ${answers.company_age}`
      });
    } else if (answers.company_age) {
      gaps.push({
        description: `Company age requirement not met: ${answers.company_age}`
      });
    }

    // Revenue match
    maxScore += 20;
    if (answers.revenue && matchesRevenue(program, categorized, eligibility, answers.revenue)) {
      score += 20;
      matchedCriteria.push({
        key: 'revenue',
        reason: `Revenue matches: ${answers.revenue}`
      });
    } else if (answers.revenue) {
      gaps.push({
        description: `Revenue requirement not met: ${answers.revenue}`
      });
    }

    // Team size match
    maxScore += 20;
    if (answers.team_size && matchesTeamSize(program, categorized, eligibility, answers.team_size)) {
      score += 20;
      matchedCriteria.push({
        key: 'team_size',
        reason: `Team size matches: ${answers.team_size}`
      });
    } else if (answers.team_size) {
      gaps.push({
        description: `Team size requirement not met: ${answers.team_size}`
      });
    }

    // Research focus
    if (answers.research_focus === 'yes') {
      maxScore += 10;
      if (requiresResearch(program, categorized, eligibility)) {
        score += 10;
        matchedCriteria.push({
          key: 'research_focus',
          reason: 'Research focus matches'
        });
      }
    }

    // Consortium
    if (answers.consortium === 'yes') {
      maxScore += 10;
      if (requiresConsortium(program, categorized, eligibility)) {
        score += 10;
        matchedCriteria.push({
          key: 'consortium',
          reason: 'Consortium requirement matches'
        });
      }
    }

    const percentageScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      id: program.id,
      name: program.name || program.title || 'Unknown',
      type: program.type || program.program_type || 'unknown',
      score: percentageScore,
      eligibility: percentageScore >= 80 ? 'high' : percentageScore >= 50 ? 'medium' : 'low',
      confidence: percentageScore / 100,
      matchedCriteria,
      gaps
    };
  }).sort((a, b) => b.score - a.score);
}

// Run tests
if (require.main === module) {
  testWizardFlow().catch(console.error);
}

module.exports = { testWizardFlow };


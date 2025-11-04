/**
 * Show Final Question Order After All Changes
 */

const path = require('path');
const fs = require('fs');

async function loadPrograms() {
  const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return data.programs || [];
  }
  return [];
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
  const programs = await loadPrograms();
  console.log('📊 FINAL QUESTION ORDER');
  console.log('='.repeat(80));
  console.log(`\nAnalyzing ${programs.length} programs...\n`);
  
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
  
  const MIN_FREQUENCY = Math.max(3, Math.floor(programs.length * 0.03));
  const LOWER_THRESHOLD = Math.max(2, Math.floor(programs.length * 0.01));
  const MAX_QUESTIONS = 10;
  
  const questionIdMap = new Map();
  const questions = [];
  let priority = 0;
  
  // First pass
  for (const req of frequencies) {
    if (req.frequency < MIN_FREQUENCY) continue;
    if (questions.length >= MAX_QUESTIONS) break;
    
    const questionId = mapRequirementToQuestionId(req.category, req.type);
    if (!questionId || questionIdMap.has(questionId)) continue;
    
    questionIdMap.set(questionId, questionId);
    questions.push({
      id: questionId,
      category: req.category,
      type: req.type,
      frequency: req.frequency,
      priority: priority++
    });
  }
  
  // Second pass
  for (const req of frequencies) {
    if (req.frequency < LOWER_THRESHOLD) continue;
    if (questions.length >= MAX_QUESTIONS) break;
    
    const questionId = mapRequirementToQuestionId(req.category, req.type);
    if (!questionId || questionIdMap.has(questionId)) continue;
    
    questionIdMap.set(questionId, questionId);
    questions.push({
      id: questionId,
      category: req.category,
      type: req.type,
      frequency: req.frequency,
      priority: priority++
    });
  }
  
  // Sort by importance (same as QuestionEngine)
  const importanceOrder = {
    'location': 1,
    'company_type': 2,
    'company_age': 3,
    'revenue': 4,
    'funding_amount': 5,
    'use_of_funds': 6,
    'impact': 7,
    'co_financing': 8,
    'research_focus': 9,
    'consortium': 10,
    'market_size': 11,
    'team_size': 12
  };
  
  questions.sort((a, b) => {
    const aImportance = importanceOrder[a.id] ?? 999;
    const bImportance = importanceOrder[b.id] ?? 999;
    if (aImportance !== bImportance) return aImportance - bImportance;
    return a.priority - b.priority;
  });
  
  console.log('📋 FINAL QUESTION ORDER (by importance, not frequency):');
  console.log('='.repeat(80));
  questions.forEach((q, idx) => {
    const importance = importanceOrder[q.id] || 'N/A';
    console.log(`${(idx + 1).toString().padStart(2)}. ${q.id.padEnd(20)} Importance: ${importance.toString().padStart(2)} | Frequency: ${q.frequency.toString().padStart(3)} programs (${((q.frequency / programs.length) * 100).toFixed(1)}%)`);
  });
  
  console.log(`\n✅ Total: ${questions.length} questions`);
  console.log(`✅ Order: ${questions.map(q => q.id).join(' → ')}`);
}

main().catch(console.error);


/**
 * Comprehensive Question-to-Program Linkage Analysis
 * 
 * This script shows:
 * 1. How many questions are generated (should be 10)
 * 2. How many programs each question filters
 * 3. Progressive filtering: Q1 → X programs, Q2 → Y programs, etc.
 * 4. Why filtering isn't working (0% effectiveness)
 * 
 * Run with: node scripts/analyze-question-to-program-linkage.js
 */

const path = require('path');
const fs = require('fs');

// Load programs
async function loadPrograms() {
  try {
    const { getPool } = require('../scraper-lite/src/db/neon-client');
    const { getAllPages } = require('../scraper-lite/src/db/page-repository');
    const pool = getPool();
    const pages = await getAllPages(1000);
    
    if (pages.length > 0) {
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
          url: page.url,
          categorized_requirements
        };
      }));
      
      return { programs, source: 'database' };
    }
  } catch (error) {
    console.warn('⚠️ Database failed, using JSON fallback...');
  }
  
  // Fallback to JSON
  const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return { programs: data.programs || [], source: 'fallback' };
  }
  
  return { programs: [], source: 'none' };
}

// Analyze requirement frequencies (same as QuestionEngine)
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
            values: new Map(),
            programs: new Set()
          });
        }
        
        const req = frequencyMap.get(key);
        req.frequency++;
        req.programs.add(program.id);
        
        const valueStr = String(item.value || '').toLowerCase();
        req.values.set(valueStr, (req.values.get(valueStr) || 0) + 1);
      }
    }
  }
  
  return Array.from(frequencyMap.values())
    .sort((a, b) => b.frequency - a.frequency);
}

// Map requirement to question ID (same as QuestionEngine)
function mapRequirementToQuestionId(category, type) {
  if (category === 'geographic' && (type === 'location' || type.includes('location'))) return 'location';
  if (category === 'team' && (type === 'max_company_age' || type === 'company_age' || type.includes('age'))) return 'company_age';
  if (category === 'team' && (type === 'min_team_size' || type === 'team_size' || type.includes('team'))) return 'team_size';
  if (category === 'financial' && (type === 'revenue' || type === 'revenue_range' || type.includes('revenue'))) return 'revenue';
  if (category === 'financial' && (type === 'funding_amount' || type.includes('funding'))) return 'funding_amount';
  if (category === 'financial' && (type === 'co_financing' || type.includes('cofinancing'))) return 'co_financing';
  if (category === 'project' && (type === 'research_focus' || type.includes('research'))) return 'research_focus';
  if (category === 'consortium' && (type === 'international_collaboration' || type.includes('consortium'))) return 'consortium';
  if (category === 'eligibility' && (type === 'company_type' || type.includes('company_type'))) return 'company_type';
  if (category === 'market_size' && (type === 'market_scope' || type.includes('market'))) return 'market_size';
  if (category === 'use_of_funds' || (category === 'financial' && type.includes('use_of_funds'))) return 'use_of_funds';
  
  return null;
}

// Test filtering with actual QuestionEngine logic
function testFiltering(programs, questionId, answer, category, type) {
  const before = programs.length;
  
  const filtered = programs.filter(program => {
    const categorized = program.categorized_requirements || {};
    const categoryData = categorized[category];
    
    // Fair filtering: if no requirement, program stays available
    if (!categoryData || !Array.isArray(categoryData)) {
      return true;
    }
    
    const reqs = categoryData.filter(r => r.type === type);
    if (reqs.length === 0) {
      return true; // Fair filtering
    }
    
    // Check if answer matches requirement
    return reqs.some(req => {
      const reqValue = String(req.value || '').toLowerCase();
      const answerValue = String(answer).toLowerCase();
      
      // Special handling for location
      if (questionId === 'location') {
        if (answerValue === 'austria') {
          return reqValue.includes('austria') || reqValue.includes('österreich') || reqValue.includes('vienna');
        }
        if (answerValue === 'germany') {
          return reqValue.includes('germany') || reqValue.includes('deutschland');
        }
        if (answerValue === 'eu') {
          return reqValue.includes('eu') || reqValue.includes('europe') || reqValue.includes('european');
        }
        return reqValue.includes(answerValue) || answerValue.includes(reqValue);
      }
      
      // Special handling for company_type
      if (questionId === 'company_type') {
        const mapping = {
          'startup': ['startup', 'new company', 'neues unternehmen'],
          'sme': ['sme', 'small', 'medium', 'klein', 'mittel'],
          'large': ['large', 'groß'],
          'research': ['research', 'forschung', 'university', 'universität']
        };
        
        const matches = mapping[answerValue] || [];
        return matches.some(m => reqValue.includes(m));
      }
      
      // Generic matching
      return reqValue.includes(answerValue) || answerValue.includes(reqValue);
    });
  });
  
  const after = filtered.length;
  return {
    before,
    after,
    filtered: before - after,
    effectiveness: before > 0 ? ((before - after) / before * 100).toFixed(1) : '0.0'
  };
}

async function main() {
  console.log('📊 QUESTION-TO-PROGRAM LINKAGE ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  // Load programs
  console.log('📥 Loading programs...');
  const { programs, source } = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs from: ${source}`);
  console.log();
  
  if (programs.length === 0) {
    console.error('❌ No programs loaded!');
    return;
  }
  
  // Analyze requirements
  console.log('📊 Analyzing requirement frequencies...');
  const requirementFrequencies = analyzeRequirements(programs);
  console.log(`✅ Found ${requirementFrequencies.length} unique requirement types`);
  console.log();
  
  // Generate questions (same logic as QuestionEngine)
  const MIN_FREQUENCY = Math.max(3, Math.floor(programs.length * 0.03)); // 3%
  const MAX_QUESTIONS = 10;
  
  const questionIdMap = new Map();
  const questions = [];
  
  console.log(`📝 Generating questions (MIN_FREQUENCY: ${MIN_FREQUENCY}, MAX_QUESTIONS: ${MAX_QUESTIONS})...`);
  console.log();
  
  // First pass
  for (const req of requirementFrequencies) {
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
      programsWithRequirement: req.programs.size
    });
  }
  
  // Second pass if needed
  if (questions.length < 5) {
    const LOWER_THRESHOLD = Math.max(2, Math.floor(programs.length * 0.01)); // 1%
    for (const req of requirementFrequencies) {
      if (questions.length >= MAX_QUESTIONS) break;
      if (req.frequency < LOWER_THRESHOLD) continue;
      
      const questionId = mapRequirementToQuestionId(req.category, req.type);
      if (!questionId || questionIdMap.has(questionId)) continue;
      
      questionIdMap.set(questionId, questionId);
      questions.push({
        id: questionId,
        category: req.category,
        type: req.type,
        frequency: req.frequency,
        programsWithRequirement: req.programs.size
      });
    }
  }
  
  console.log(`✅ Generated ${questions.length} questions`);
  console.log();
  
  // Show questions
  console.log('📋 GENERATED QUESTIONS:');
  console.log('='.repeat(80));
  questions.forEach((q, idx) => {
    console.log(`${idx + 1}. ${q.id}`);
    console.log(`   Category: ${q.category}, Type: ${q.type}`);
    console.log(`   Frequency: ${q.frequency} programs (${((q.frequency / programs.length) * 100).toFixed(1)}%)`);
    console.log(`   Programs with this requirement: ${q.programsWithRequirement}`);
    console.log();
  });
  
  // Test filtering for each question
  console.log('🔍 FILTERING EFFECTIVENESS PER QUESTION:');
  console.log('='.repeat(80));
  console.log();
  
  const filteringResults = [];
  
  for (const question of questions) {
    // Get sample answer based on question type
    let sampleAnswer = 'yes';
    
    if (question.id === 'location') {
      sampleAnswer = 'austria';
    } else if (question.id === 'company_type') {
      sampleAnswer = 'startup';
    } else if (question.id === 'market_size') {
      sampleAnswer = 'local';
    } else if (question.id === 'use_of_funds') {
      sampleAnswer = 'rd';
    } else if (question.id === 'team_size') {
      sampleAnswer = '1-5';
    } else if (question.id === 'funding_amount') {
      sampleAnswer = 'under_100k';
    }
    
    const result = testFiltering(programs, question.id, sampleAnswer, question.category, question.type);
    
    filteringResults.push({
      question: question.id,
      category: question.category,
      type: question.type,
      frequency: question.frequency,
      answer: sampleAnswer,
      ...result
    });
    
    const status = result.filtered > 0 ? '✅' : '⚠️';
    console.log(`${status} ${question.id}: ${result.before} → ${result.after} programs (${result.filtered} filtered, ${result.effectiveness}% effective)`);
    console.log(`   Answer tested: "${sampleAnswer}"`);
    console.log(`   Programs with requirement: ${question.frequency}`);
    console.log();
  }
  
  // Progressive filtering
  console.log('📈 PROGRESSIVE FILTERING (Question 1 → Question 2 → ...):');
  console.log('='.repeat(80));
  console.log();
  
  let remainingPrograms = [...programs];
  const progression = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const result = filteringResults[i];
    
    // Apply filter
    remainingPrograms = remainingPrograms.filter(program => {
      const categorized = program.categorized_requirements || {};
      const categoryData = categorized[question.category];
      
      if (!categoryData || !Array.isArray(categoryData)) return true;
      const reqs = categoryData.filter(r => r.type === question.type);
      if (reqs.length === 0) return true;
      
      return reqs.some(req => {
        const reqValue = String(req.value || '').toLowerCase();
        const answerValue = String(result.answer).toLowerCase();
        return reqValue.includes(answerValue) || answerValue.includes(reqValue);
      });
    });
    
    progression.push({
      question: question.id,
      before: i === 0 ? programs.length : progression[i - 1].after,
      after: remainingPrograms.length,
      filtered: (i === 0 ? programs.length : progression[i - 1].after) - remainingPrograms.length
    });
    
    console.log(`After Q${i + 1} (${question.id}): ${progression[i].before} → ${progression[i].after} programs (${progression[i].filtered} filtered)`);
  }
  
  // Summary
  console.log();
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total Programs: ${programs.length}`);
  console.log(`Questions Generated: ${questions.length} (target: 10)`);
  console.log(`Questions with Effective Filtering: ${filteringResults.filter(r => r.filtered > 0).length}`);
  console.log(`Questions with No Filtering: ${filteringResults.filter(r => r.filtered === 0).length}`);
  console.log(`Final Programs After All Questions: ${progression[progression.length - 1].after}`);
  console.log(`Total Filtered: ${programs.length - progression[progression.length - 1].after}`);
  console.log();
  
  if (questions.length < 10) {
    console.log('⚠️ ISSUE: Only ' + questions.length + ' questions generated (should be 10)');
    console.log('   Possible causes:');
    console.log('   - Too few requirement types meet frequency threshold');
    console.log('   - Many requirement types map to the same question ID');
    console.log('   - Some requirement types don\'t have a mapping to question ID');
    console.log();
  }
  
  if (filteringResults.every(r => r.filtered === 0)) {
    console.log('⚠️ CRITICAL ISSUE: No filtering is working (0% effectiveness for all questions)');
    console.log('   Possible causes:');
    console.log('   - Answer values don\'t match requirement values in database');
    console.log('   - Matching logic is too strict or incorrect');
    console.log('   - Requirement values are stored in different format');
    console.log('   - Sample answers used for testing don\'t match actual requirement values');
    console.log();
    console.log('💡 RECOMMENDATION: Check actual requirement values in programs');
    console.log('   Example: Check what values exist for location requirements');
    console.log('   The matching logic might need to be adjusted to match actual data format');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };


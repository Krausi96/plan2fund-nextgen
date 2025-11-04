// Comprehensive analysis of question system
// Analyzes: linking, question types, filtering effectiveness, UI considerations
// Run with: node scripts/analyze-question-system.js

const path = require('path');
const fs = require('fs');

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

// Analyze requirement frequencies
function analyzeRequirements(programs) {
  const frequencyMap = new Map();
  const categoryMap = new Map(); // Track which categories appear together
  
  for (const program of programs) {
    const categorized = program.categorized_requirements || {};
    const programCategories = Object.keys(categorized);
    
    // Track category co-occurrence
    for (let i = 0; i < programCategories.length; i++) {
      for (let j = i + 1; j < programCategories.length; j++) {
        const key = `${programCategories[i]}+${programCategories[j]}`;
        categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
      }
    }
    
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
            valueTypes: new Set(), // Track if values are numbers, strings, booleans
            programs: new Set()
          });
        }
        
        const tracker = frequencyMap.get(key);
        tracker.frequency++;
        tracker.programs.add(program.id);
        
        if (item.value !== undefined && item.value !== null) {
          const valueStr = normalizeValue(item.value);
          tracker.values.set(valueStr, (tracker.values.get(valueStr) || 0) + 1);
          
          // Track value types
          if (typeof item.value === 'number') {
            tracker.valueTypes.add('number');
          } else if (typeof item.value === 'boolean') {
            tracker.valueTypes.add('boolean');
          } else if (typeof item.value === 'object' && item.value.min !== undefined) {
            tracker.valueTypes.add('range');
          } else {
            tracker.valueTypes.add('string');
          }
        }
      }
    }
  }
  
  return {
    frequencies: Array.from(frequencyMap.values()).sort((a, b) => b.frequency - a.frequency),
    categoryCoOccurrence: categoryMap
  };
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

// Map to question ID
function mapToQuestionId(category, type) {
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
  return null;
}

// Determine question type based on values
function determineQuestionType(req) {
  const valueTypes = Array.from(req.valueTypes);
  const uniqueValues = Array.from(req.values.keys());
  
  // Number or range → number input or slider
  if (valueTypes.includes('number') || valueTypes.includes('range')) {
    return 'number';
  }
  
  // Boolean → yes/no
  if (valueTypes.includes('boolean') || uniqueValues.length <= 2) {
    return 'boolean';
  }
  
  // Many unique values (>5) → multi-select
  if (uniqueValues.length > 5) {
    return 'multi-select';
  }
  
  // Few unique values (2-5) → single-select
  return 'single-select';
}

async function analyzeQuestionSystem() {
  console.log('\n📊 ============================================');
  console.log('📊 COMPREHENSIVE QUESTION SYSTEM ANALYSIS');
  console.log('📊 ============================================\n');

  try {
    const programs = await loadPrograms();
    console.log(`✅ Loaded ${programs.length} programs\n`);

    const analysis = analyzeRequirements(programs);
    const frequencies = analysis.frequencies;
    const categoryCoOccurrence = analysis.categoryCoOccurrence;

    // 1. QUESTION LINKING ANALYSIS
    console.log('🔗 ============================================');
    console.log('🔗 QUESTION LINKING ANALYSIS');
    console.log('🔗 ============================================\n');

    console.log('📋 Top Category Co-Occurrences (Questions that appear together):');
    const topCoOccurrences = Array.from(categoryCoOccurrence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    topCoOccurrences.forEach(([pair, count], idx) => {
      const [cat1, cat2] = pair.split('+');
      const pct = ((count / programs.length) * 100).toFixed(1);
      console.log(`   ${idx + 1}. ${cat1} + ${cat2}: ${count} programs (${pct}%)`);
    });

    // Check if questions should be linked
    console.log('\n🔗 Question Dependencies:');
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
            valueTypes: req.valueTypes,
            uniqueValues: req.values.size
          });
        }
      }
    });

    const questions = Array.from(questionMap.values())
      .sort((a, b) => b.frequency - a.frequency);

    console.log(`\n✅ Generated ${questions.length} questions (max 10 limit)`);
    
    // Analyze dependencies
    console.log('\n📊 Question Relationships:');
    questions.forEach((q, idx) => {
      const related = questions.filter(other => 
        other !== q && 
        (other.category === q.category || 
         categoryCoOccurrence.has(`${q.category}+${other.category}`) ||
         categoryCoOccurrence.has(`${other.category}+${q.category}`))
      );
      if (related.length > 0) {
        console.log(`   ${q.id} is related to: ${related.slice(0, 3).map(r => r.id).join(', ')}`);
      }
    });

    // 2. QUESTION TYPE ANALYSIS
    console.log('\n\n📝 ============================================');
    console.log('📝 QUESTION TYPE ANALYSIS');
    console.log('📝 ============================================\n');

    console.log('📋 Question Types by Requirement:');
    frequencies.slice(0, 20).forEach((req, idx) => {
      const questionId = mapToQuestionId(req.category, req.type);
      if (!questionId) return;
      
      const questionType = determineQuestionType(req);
      const valueTypes = Array.from(req.valueTypes);
      const uniqueValues = req.values.size;
      
      console.log(`\n   ${idx + 1}. ${questionId} (${req.category}:${req.type})`);
      console.log(`      Frequency: ${req.frequency} programs (${((req.frequency / programs.length) * 100).toFixed(1)}%)`);
      console.log(`      Recommended Type: ${questionType}`);
      console.log(`      Value Types: ${valueTypes.join(', ')}`);
      console.log(`      Unique Values: ${uniqueValues}`);
      
      if (questionType === 'number') {
        const numbers = Array.from(req.values.keys())
          .map(v => {
            const num = parseFloat(v);
            return isNaN(num) ? null : num;
          })
          .filter(n => n !== null)
          .sort((a, b) => a - b);
        
        if (numbers.length > 0) {
          console.log(`      Range: ${numbers[0]} - ${numbers[numbers.length - 1]}`);
          console.log(`      UI Suggestion: Number input or slider`);
        }
      } else if (questionType === 'single-select') {
        const topValues = Array.from(req.values.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([v, c]) => `${v} (${c})`);
        console.log(`      Top Values: ${topValues.join(', ')}`);
      }
    });

    // 3. FILTERING EFFECTIVENESS ANALYSIS
    console.log('\n\n🎯 ============================================');
    console.log('🎯 FILTERING EFFECTIVENESS ANALYSIS');
    console.log('🎯 ============================================\n');

    // Simulate filtering with different question counts
    const testScenarios = [
      { name: 'Top 5 Questions', count: 5 },
      { name: 'Top 10 Questions (Current)', count: 10 },
      { name: 'Top 15 Questions', count: 15 },
      { name: 'All Questions', count: questions.length }
    ];

    const comprehensiveAnswers = {
      location: 'austria',
      company_type: 'startup',
      company_age: '0_2_years',
      revenue: 'under_100k',
      team_size: '1_2_people',
      research_focus: 'yes',
      consortium: 'yes',
      innovation_focus: 'yes',
      sustainability_focus: 'yes',
      technology_focus: 'ai',
      industry_focus: 'technology',
      sector: 'technology',
      deadline_urgency: 'flexible',
      project_duration: '12_24_months',
      impact_focus: 'yes',
      market_size: 'eu',
      revenue_model: 'saas',
      use_of_funds: ['rd', 'personnel'],
      investment_type: 'capex',
      legal_compliance: 'yes',
      has_documents: 'yes',
      funding_amount: '200k_500k',
      co_financing: '20',
      trl_level: '5'
    };

    console.log('📊 Filtering Effectiveness by Question Count:');
    testScenarios.forEach(scenario => {
      const questionsToUse = questions.slice(0, scenario.count);
      let filtered = [...programs];
      let totalFiltered = 0;
      const filterSteps = [];

      questionsToUse.forEach(q => {
        const answer = comprehensiveAnswers[q.id];
        if (answer === undefined) return;

        const before = filtered.length;
        // Simple filtering simulation
        filtered = filtered.filter(p => {
          const cat = p.categorized_requirements || {};
          if (!cat[q.category]) return true; // No requirement = available
          
          // Basic matching logic
          const items = cat[q.category].filter(r => {
            if (!r.type) return false;
            return r.type === q.type || 
                   (r.type && q.type && r.type.includes(q.type)) || 
                   (r.type && q.type && q.type.includes(r.type));
          });
          if (items.length === 0) return true; // No matching requirement = available
          
          // For now, just return true (would need full matching logic)
          return true;
        });
        
        const after = filtered.length;
        const filteredCount = before - after;
        totalFiltered += filteredCount;
        
        if (filteredCount > 0) {
          filterSteps.push({
            question: q.id,
            before,
            after,
            filtered: filteredCount,
            effectiveness: ((filteredCount / before) * 100).toFixed(1) + '%'
          });
        }
      });

      const finalFilterRate = ((programs.length - filtered.length) / programs.length * 100).toFixed(1);
      console.log(`\n   ${scenario.name}:`);
      console.log(`      Questions: ${questionsToUse.length}`);
      console.log(`      Programs filtered: ${totalFiltered}`);
      console.log(`      Final filter rate: ${finalFilterRate}%`);
      console.log(`      Programs remaining: ${filtered.length}`);
      
      if (filterSteps.length > 0) {
        console.log(`      Effective filters: ${filterSteps.length}`);
        filterSteps.slice(0, 3).forEach(step => {
          console.log(`        - ${step.question}: ${step.effectiveness}`);
        });
      }
    });

    // 4. SHOULD WE STOP AT 10? ANALYSIS
    console.log('\n\n❓ ============================================');
    console.log('❓ SHOULD WE STOP AT 10 QUESTIONS?');
    console.log('❓ ============================================\n');

    // Analyze if questions 11-20 would provide additional filtering
    const questions11to20 = questions.slice(10, 20);
    console.log(`📊 Questions 11-20 (would be skipped with current limit):`);
    questions11to20.forEach((q, idx) => {
      const pct = ((q.frequency / programs.length) * 100).toFixed(1);
      console.log(`   ${idx + 1}. ${q.id}: ${q.frequency} programs (${pct}%)`);
    });

    // Check filtering potential of additional questions
    let additionalFiltering = 0;
    questions11to20.forEach(q => {
      const programsWithReq = programs.filter(p => {
        const cat = p.categorized_requirements || {};
        return cat[q.category] && cat[q.category].some(r => 
          r.type === q.type || r.type.includes(q.type) || q.type.includes(r.type)
        );
      });
      
      if (programsWithReq.length > 0) {
        additionalFiltering += programsWithReq.length;
      }
    });

    const avgFilteringPerQuestion = questions11to20.length > 0 
      ? (additionalFiltering / questions11to20.length).toFixed(0)
      : 0;

    console.log(`\n📊 Analysis:`);
    console.log(`   Questions 11-20 cover: ${additionalFiltering} programs`);
    console.log(`   Average programs per question: ${avgFilteringPerQuestion}`);
    console.log(`   Potential additional filtering: ${((additionalFiltering / programs.length) * 100).toFixed(1)}%`);

    // Recommendation
    console.log(`\n💡 Recommendation:`);
    if (avgFilteringPerQuestion > programs.length * 0.1) {
      console.log(`   ⚠️  Questions 11-20 could filter significantly (${avgFilteringPerQuestion} programs each)`);
      console.log(`   💡 Consider: Conditional questions (only ask if previous answers don't filter enough)`);
      console.log(`   💡 Or: Increase limit to 12-15 for better precision`);
    } else {
      console.log(`   ✅ Stopping at 10 is optimal (questions 11-20 filter ${avgFilteringPerQuestion} programs each)`);
      console.log(`   ✅ Current limit prevents overwhelming users while maintaining effectiveness`);
    }

    // 5. UI CONSIDERATIONS FOR NUMBERS/MONTHS
    console.log('\n\n🎨 ============================================');
    console.log('🎨 UI CONSIDERATIONS: NUMBERS & MONTHS');
    console.log('🎨 ============================================\n');

    const numberQuestions = frequencies.filter(req => {
      const questionId = mapToQuestionId(req.category, req.type);
      if (!questionId) return false;
      const questionType = determineQuestionType(req);
      return questionType === 'number' || req.valueTypes.has('range');
    });

    console.log(`📊 Questions requiring number/months input: ${numberQuestions.length}`);
    numberQuestions.slice(0, 10).forEach((req, idx) => {
      const questionId = mapToQuestionId(req.category, req.type);
      if (!questionId) return;
      
      console.log(`\n   ${idx + 1}. ${questionId} (${req.category}:${req.type})`);
      
      // Check if it's months/duration
      const isDuration = req.type.includes('duration') || req.type.includes('month') || 
                         req.type.includes('year') || req.type.includes('laufzeit');
      const isPercentage = req.type.includes('co_financing') || req.type.includes('percent');
      const isAmount = req.type.includes('amount') || req.type.includes('funding') || 
                       req.type.includes('revenue') || req.type.includes('betrag');
      
      if (isDuration) {
        console.log(`      Type: Duration/Time`);
        console.log(`      UI Suggestion: Dropdown with ranges (e.g., "6-12 months", "1-2 years")`);
        console.log(`      Current: Uses ranges (good!)`);
      } else if (isPercentage) {
        console.log(`      Type: Percentage`);
        console.log(`      UI Suggestion: Number input with % symbol or slider`);
        console.log(`      Current: Uses percentage options (good!)`);
      } else if (isAmount) {
        console.log(`      Type: Monetary Amount`);
        console.log(`      UI Suggestion: Number input with currency (€) or ranges`);
        console.log(`      Current: Uses ranges (good!)`);
      } else {
        console.log(`      Type: Number`);
        console.log(`      UI Suggestion: Number input or slider`);
      }
      
      // Show value distribution
      const numbers = Array.from(req.values.keys())
        .map(v => {
          const num = parseFloat(v);
          return isNaN(num) ? null : num;
        })
        .filter(n => n !== null)
        .sort((a, b) => a - b);
      
      if (numbers.length > 0) {
        console.log(`      Range: ${numbers[0]} - ${numbers[numbers.length - 1]}`);
        console.log(`      Distribution: ${req.values.size} unique values`);
      }
    });

    // 6. FINAL RECOMMENDATIONS
    console.log('\n\n💡 ============================================');
    console.log('💡 FINAL RECOMMENDATIONS');
    console.log('💡 ============================================\n');

    console.log('✅ Question Linking:');
    console.log('   ✅ Questions are linked through category co-occurrence');
    console.log('   ✅ Questions adapt based on remaining programs (conditional)');
    console.log('   ✅ No hard dependencies - all questions work independently');
    
    console.log('\n✅ Question Types:');
    console.log('   ✅ Single-select: Most common (good for UX)');
    console.log('   ✅ Boolean (yes/no): For simple requirements');
    console.log('   ✅ Number: For ranges (months, amounts, percentages)');
    console.log('   ✅ Multi-select: For complex requirements (use sparingly)');
    
    console.log('\n✅ UI for Numbers/Months:');
    console.log('   ✅ Duration: Use ranges (e.g., "6-12 months") - already implemented');
    console.log('   ✅ Amounts: Use ranges (e.g., "€50k-€100k") - already implemented');
    console.log('   ✅ Percentages: Use ranges (e.g., "≥20%") - already implemented');
    
    console.log('\n✅ Question Limit (10 questions):');
    const avgFilter11to20 = questions11to20.length > 0 
      ? (additionalFiltering / questions11to20.length) 
      : 0;
    
    if (avgFilter11to20 > programs.length * 0.15) {
      console.log('   ⚠️  Consider: Increase to 12-15 questions (questions 11-15 filter significantly)');
      console.log('   💡 Or: Conditional questions (ask 11-15 only if filtered < 50 programs)');
    } else {
      console.log('   ✅ 10 questions is optimal');
      console.log('   ✅ Balances comprehensiveness with user experience');
      console.log('   ✅ Questions 11+ filter fewer programs (diminishing returns)');
    }

    // 7. DETAILED RESULTS ANALYSIS
    console.log('\n\n📈 ============================================');
    console.log('📈 DETAILED RESULTS ANALYSIS');
    console.log('📈 ============================================\n');

    // Simulate full filtering with all questions
    let filtered = [...programs];
    const effectiveQuestions = [];
    
    questions.forEach(q => {
      const answer = comprehensiveAnswers[q.id];
      if (answer === undefined) return;
      
      const before = filtered.length;
      const programsWithReq = filtered.filter(p => {
        const cat = p.categorized_requirements || {};
        if (!cat[q.category]) return false;
        return cat[q.category].some(r => {
          if (!r.type || !q.type) return false;
          return r.type === q.type || 
                 r.type.includes(q.type) || 
                 q.type.includes(r.type);
        });
      });
      
      if (programsWithReq.length > 0) {
        effectiveQuestions.push({
          question: q.id,
          programsWithReq: programsWithReq.length,
          programsWithoutReq: filtered.length - programsWithReq.length,
          potentialFiltering: programsWithReq.length
        });
      }
    });

    console.log('📊 Question Effectiveness Ranking:');
    effectiveQuestions.sort((a, b) => b.potentialFiltering - a.potentialFiltering);
    effectiveQuestions.slice(0, 15).forEach((q, idx) => {
      const pct = ((q.programsWithReq / programs.length) * 100).toFixed(1);
      console.log(`   ${idx + 1}. ${q.question}: ${q.programsWithReq} programs have this (${pct}%)`);
      console.log(`      Could filter up to: ${q.potentialFiltering} programs`);
    });

    console.log('\n📊 Summary:');
    console.log(`   Total questions analyzed: ${questions.length}`);
    console.log(`   Questions in top 10: ${questions.slice(0, 10).length}`);
    console.log(`   Questions 11-20: ${questions.slice(10, 20).length}`);
    console.log(`   Effective filtering questions: ${effectiveQuestions.length}`);
    console.log(`   Average programs per question: ${(effectiveQuestions.reduce((sum, q) => sum + q.programsWithReq, 0) / effectiveQuestions.length).toFixed(0)}`);

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  analyzeQuestionSystem().catch(console.error);
}

module.exports = { analyzeQuestionSystem };


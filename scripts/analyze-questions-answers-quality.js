/**
 * Comprehensive Question & Answer Quality Analysis Script
 * 
 * This script analyzes:
 * 1. All generated questions with their options
 * 2. Question translations (EN/DE)
 * 3. Question meaningfulness (per handover criteria)
 * 4. Answer-to-program linkage
 * 5. Filtering effectiveness
 * 
 * Run with: node scripts/analyze-questions-answers-quality.js
 */

const path = require('path');
const fs = require('fs');

// Load programs from JSON fallback or database
async function loadPrograms() {
  let source = 'unknown';
  let programs = [];
  
  try {
    // Try database first
    const { getPool } = require('../scraper-lite/src/db/neon-client');
    const { getAllPages } = require('../scraper-lite/src/db/page-repository');
    const pool = getPool();
    
    const pages = await getAllPages(1000);
    
    if (pages.length > 0) {
      source = 'database';
      programs = await Promise.all(pages.map(async (page) => {
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
    }
  } catch (error) {
    console.warn('⚠️ Database load failed, trying JSON fallback...');
  }
  
  // Fallback to JSON
  if (programs.length === 0) {
    const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
    if (fs.existsSync(jsonPath)) {
      source = 'fallback';
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      programs = data.programs || [];
    }
  }
  
  return { programs, source };
}

// Generate questions by analyzing requirements (same logic as QuestionEngine)
function generateQuestions(programs) {
  // Step 1: Analyze requirements
  const requirementFrequencies = new Map();
  
  for (const program of programs) {
    const categorized = program.categorized_requirements || {};
    for (const [category, items] of Object.entries(categorized)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const reqType = item.type || 'unknown';
        const key = `${category}:${reqType}`;
        
        if (!requirementFrequencies.has(key)) {
          requirementFrequencies.set(key, {
            category,
            type: reqType,
            frequency: 0,
            values: new Map()
          });
        }
        
        const req = requirementFrequencies.get(key);
        req.frequency++;
        
        // Store values for options
        const valueStr = String(item.value || '').toLowerCase();
        req.values.set(valueStr, (req.values.get(valueStr) || 0) + 1);
      }
    }
  }
  
  // Step 2: Generate questions (simplified version)
  const MIN_FREQUENCY = Math.max(3, Math.floor(programs.length * 0.03));
  const MAX_QUESTIONS = 10;
  
  const frequencies = Array.from(requirementFrequencies.values())
    .filter(req => req.frequency >= MIN_FREQUENCY)
    .sort((a, b) => b.frequency - a.frequency);
  
  // Map to question IDs (simplified version)
  const questionIdMap = new Map();
  const questions = [];
  
  for (const req of frequencies) {
    if (questions.length >= MAX_QUESTIONS) break;
    
    const questionId = mapRequirementToQuestionId(req.category, req.type);
    if (!questionId || questionIdMap.has(questionId)) continue;
    
    questionIdMap.set(questionId, questionId);
    
    // Create question object (simplified)
    const question = createQuestionFromRequirement(req, questionId, questions.length);
    if (question && question.options && question.options.length > 0) {
      questions.push({
        ...question,
        frequency: req.frequency,
        programsWithRequirement: req.frequency
      });
    }
  }
  
  return questions;
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
  
  // Removed questions (should not be generated):
  // industry_focus, technology_focus, sector, deadline_urgency, project_duration,
  // impact_focus, legal_compliance, has_documents, revenue_model, trl_level, investment_type
  
  return null;
}

// Map question ID to translation key (camelCase conversion)
function getQuestionTranslationKey(questionId) {
  const keyMap = {
    'company_type': 'companyType',
    'company_age': 'companyAge',
    'team_size': 'teamSize',
    'current_revenue': 'currentRevenue',
    'research_focus': 'researchFocus',
    'international_collaboration': 'internationalCollaboration',
    'co_financing': 'coFinancing',
    'funding_amount': 'fundingAmount',
    'market_size': 'marketSize',
    'use_of_funds': 'useOfFunds',
    'location': 'location'
  };
  return keyMap[questionId] || questionId;
}

// Create question object (simplified version)
function createQuestionFromRequirement(req, questionId, priority) {
  const translationKey = getQuestionTranslationKey(questionId);
  const baseQuestion = {
    id: questionId,
    symptom: `wizard.questions.${translationKey}`,
    type: 'single-select',
    required: questionId === 'location' || questionId === 'company_age' || questionId === 'revenue',
    category: req.category,
    priority
  };
  
  // Create options based on question type
  if (questionId === 'location') {
    const locations = Array.from(req.values.keys()).slice(0, 10);
    return {
      ...baseQuestion,
      options: locations.map(loc => ({
        value: loc,
        label: `wizard.options.${loc}`
      }))
    };
  }
  
  if (questionId === 'company_type') {
    return {
      ...baseQuestion,
      options: [
        { value: 'startup', label: 'wizard.options.startup' },
        { value: 'sme', label: 'wizard.options.sme' },
        { value: 'large', label: 'wizard.options.large' },
        { value: 'research', label: 'wizard.options.research' }
      ]
    };
  }
  
  if (questionId === 'research_focus' || questionId === 'consortium' || questionId === 'co_financing') {
    return {
      ...baseQuestion,
      options: [
        { value: 'yes', label: 'wizard.options.yes' },
        { value: 'no', label: 'wizard.options.no' }
      ]
    };
  }
  
  if (questionId === 'market_size') {
    return {
      ...baseQuestion,
      options: [
        { value: 'local', label: 'wizard.options.local' },
        { value: 'national', label: 'wizard.options.national' },
        { value: 'eu', label: 'wizard.options.eu' },
        { value: 'international', label: 'wizard.options.international' }
      ]
    };
  }
  
  if (questionId === 'use_of_funds') {
    return {
      ...baseQuestion,
      type: 'multi-select',
      options: [
        { value: 'rd', label: 'wizard.options.researchDevelopment' },
        { value: 'marketing', label: 'wizard.options.marketing' },
        { value: 'equipment', label: 'wizard.options.equipment' },
        { value: 'personnel', label: 'wizard.options.personnel' },
        { value: 'infrastructure', label: 'wizard.options.infrastructure' }
      ]
    };
  }
  
  // Generic question with yes/no
  return {
    ...baseQuestion,
    options: [
      { value: 'yes', label: 'wizard.options.yes' },
      { value: 'no', label: 'wizard.options.no' }
    ]
  };
}

// Load translations
function loadTranslations() {
  const enPath = path.join(__dirname, '../shared/i18n/translations/en.json');
  const dePath = path.join(__dirname, '../shared/i18n/translations/de.json');
  
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const de = JSON.parse(fs.readFileSync(dePath, 'utf-8'));
  
  return { en, de };
}

// Analyze question quality
function analyzeQuestionQuality(question, translations) {
  const { en, de } = translations;
  
  const analysis = {
    id: question.id,
    questionKey: question.symptom,
    enQuestion: en[question.symptom] || `[MISSING: ${question.symptom}]`,
    deQuestion: de[question.symptom] || `[MISSING: ${question.symptom}]`,
    hasTranslation: !!(en[question.symptom] && de[question.symptom]),
    options: question.options.map(opt => ({
      value: opt.value,
      labelKey: opt.label,
      enLabel: en[opt.label] || `[MISSING: ${opt.label}]`,
      deLabel: de[opt.label] || `[MISSING: ${opt.label}]`,
      hasTranslation: !!(en[opt.label] && de[opt.label])
    })),
    issues: [],
    isMeaningful: true
  };
  
  // Check for missing translations
  if (!analysis.hasTranslation) {
    analysis.issues.push(`Missing question translation`);
    analysis.isMeaningful = false;
  }
  
  const missingOptionTranslations = analysis.options.filter(opt => !opt.hasTranslation);
  if (missingOptionTranslations.length > 0) {
    analysis.issues.push(`${missingOptionTranslations.length} option(s) missing translations`);
    analysis.isMeaningful = false;
  }
  
  // Check for problematic questions (should have been removed)
  const problematicQuestions = [
    'has_documents', 'deadline_urgency', 'impact_focus', 'legal_compliance',
    'project_duration', 'industry_focus', 'technology_focus', 'sector',
    'revenue_model', 'trl_level', 'investment_type', 'innovation_focus',
    'sustainability_focus'
  ];
  
  if (problematicQuestions.includes(question.id)) {
    analysis.issues.push(`⚠️ This question should have been removed (problematic)`);
    analysis.isMeaningful = false;
  }
  
  return analysis;
}

// Test filtering effectiveness
function testFiltering(programs, questions, sampleAnswers) {
  const results = [];
  
  for (const question of questions) {
    const answer = sampleAnswers[question.id];
    if (!answer) continue;
    
    // Filter programs based on this answer
    const before = programs.length;
    const filtered = programs.filter(program => {
      const categorized = program.categorized_requirements || {};
      const categoryData = categorized[question.category];
      
      if (!categoryData || !Array.isArray(categoryData)) {
        return true; // Fair filtering
      }
      
      const reqs = categoryData.filter(r => r.type === question.type);
      if (reqs.length === 0) return true; // Fair filtering
      
      // Simple matching
      return reqs.some(req => {
        const reqValue = String(req.value || '').toLowerCase();
        const answerValue = String(answer).toLowerCase();
        return reqValue.includes(answerValue) || answerValue.includes(reqValue);
      });
    });
    
    const after = filtered.length;
    const filteredCount = before - after;
    const effectiveness = ((filteredCount / before) * 100).toFixed(1);
    
    results.push({
      questionId: question.id,
      answer,
      before,
      after,
      filtered: filteredCount,
      effectiveness: parseFloat(effectiveness),
      isEffective: filteredCount > 0
    });
  }
  
  return results;
}

async function main() {
  console.log('📊 COMPREHENSIVE QUESTION & ANSWER QUALITY ANALYSIS');
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
  
  // Generate questions
  console.log('📝 Generating questions...');
  const questions = generateQuestions(programs);
  console.log(`✅ Generated ${questions.length} questions`);
  console.log();
  
  // Load translations
  console.log('🌐 Loading translations...');
  const translations = loadTranslations();
  console.log(`✅ Loaded EN and DE translations`);
  console.log();
  
  // ============================================================================
  // SECTION 1: QUESTION ANALYSIS
  // ============================================================================
  
  console.log('='.repeat(80));
  console.log('SECTION 1: QUESTION ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  const questionAnalyses = questions.map(q => analyzeQuestionQuality(q, translations));
  
  questionAnalyses.forEach((analysis, idx) => {
    console.log(`${idx + 1}. Question: ${analysis.id}`);
    console.log(`   EN: "${analysis.enQuestion}"`);
    console.log(`   DE: "${analysis.deQuestion}"`);
    console.log(`   Type: ${questions[idx].type} | Required: ${questions[idx].required}`);
    console.log(`   Options (${analysis.options.length}):`);
    analysis.options.forEach(opt => {
      const status = opt.hasTranslation ? '✅' : '❌';
      console.log(`     ${status} ${opt.value}: "${opt.enLabel}" / "${opt.deLabel}"`);
    });
    
    if (analysis.issues.length > 0) {
      console.log(`   ⚠️ Issues:`);
      analysis.issues.forEach(issue => console.log(`      ${issue}`));
    } else {
      console.log(`   ✅ No issues detected`);
    }
    console.log();
  });
  
  // ============================================================================
  // SECTION 2: FILTERING EFFECTIVENESS
  // ============================================================================
  
  console.log('='.repeat(80));
  console.log('SECTION 2: FILTERING EFFECTIVENESS');
  console.log('='.repeat(80));
  console.log();
  
  // Create sample answers
  const sampleAnswers = {};
  questions.forEach(q => {
    if (q.options.length > 0) {
      sampleAnswers[q.id] = q.options[0].value;
    }
  });
  
  console.log('📝 Sample Answers (using first option for each question):');
  Object.entries(sampleAnswers).forEach(([qId, answer]) => {
    const question = questions.find(q => q.id === qId);
    const option = question.options.find(opt => opt.value === answer);
    const enLabel = translations.en[option.label] || option.value;
    console.log(`   ${qId}: ${answer} (${enLabel})`);
  });
  console.log();
  
  // Test filtering
  const filteringResults = testFiltering(programs, questions, sampleAnswers);
  
  console.log('🔍 Individual Question Filtering Effectiveness:');
  filteringResults.forEach(result => {
    const status = result.isEffective ? '✅' : '⚠️';
    console.log(`   ${status} ${result.questionId}: ${result.filtered} programs filtered (${result.effectiveness}% effective)`);
  });
  console.log();
  
  // ============================================================================
  // SECTION 3: QUALITY SUMMARY
  // ============================================================================
  
  console.log('='.repeat(80));
  console.log('SECTION 3: QUALITY SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  const meaningfulQuestions = questionAnalyses.filter(a => a.isMeaningful && a.issues.length === 0);
  const problematicQuestions = questionAnalyses.filter(a => !a.isMeaningful || a.issues.length > 0);
  const effectiveFilters = filteringResults.filter(r => r.isEffective).length;
  const ineffectiveFilters = filteringResults.filter(r => !r.isEffective).length;
  
  console.log('📈 Overall Statistics:');
  console.log(`   Total Questions: ${questions.length}`);
  console.log(`   Meaningful Questions: ${meaningfulQuestions.length}`);
  console.log(`   Questions with Issues: ${problematicQuestions.length}`);
  console.log(`   Effective Filters: ${effectiveFilters}`);
  console.log(`   Ineffective Filters: ${ineffectiveFilters}`);
  console.log();
  
  console.log('✅ Meaningful Questions (per handover criteria):');
  meaningfulQuestions.forEach(q => {
    console.log(`   ✅ ${q.id}: "${q.enQuestion}"`);
  });
  console.log();
  
  if (problematicQuestions.length > 0) {
    console.log('⚠️ Questions with Issues:');
    problematicQuestions.forEach(q => {
      console.log(`   ⚠️ ${q.id}: "${q.enQuestion}"`);
      q.issues.forEach(issue => console.log(`      ${issue}`));
    });
    console.log();
  }
  
  // ============================================================================
  // SECTION 4: RECOMMENDATIONS
  // ============================================================================
  
  console.log('='.repeat(80));
  console.log('SECTION 4: RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log();
  
  const recommendations = [];
  
  if (problematicQuestions.length > 0) {
    recommendations.push(`Review ${problematicQuestions.length} question(s) with issues`);
  }
  
  if (ineffectiveFilters > 0) {
    recommendations.push(`Review ${ineffectiveFilters} question(s) that don't filter programs effectively`);
  }
  
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:');
    recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec}`);
    });
  } else {
    console.log('✅ No recommendations - all questions are high quality!');
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

/**
 * Evaluate multiple answer scenarios through the guided recommendation flow.
 * For each scenario:
 *  - walks the QuestionEngine, preferring scenario-specific answers when available
 *  - logs the question order and chosen answers
 *  - runs the scoring engine and prints the top programme suggestions
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { QuestionEngine, SymptomQuestion } from '../features/reco/engine/questionEngine';
import { scoreProgramsEnhanced } from '../features/reco/engine/enhancedRecoEngine';
import { getAllPages, getPool } from '../scraper-lite/db/db';
import type { Program } from '../shared/types/requirements';

type AnswersMap = Record<string, any>;

interface Scenario {
  name: string;
  description: string;
  answers: AnswersMap;
}

const translations = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'shared', 'i18n', 'translations', 'en.json'), 'utf8')
);

function t(key: string | undefined, fallback: string): string {
  if (!key) return fallback;
  return translations[key] || fallback || key;
}

function resolveOptionLabel(question: SymptomQuestion, value: any): string {
  const opts = question.options || [];
  const opt = opts.find(o => String(o.value) === String(value));
  if (!opt) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }
  const label = opt.label ? t(opt.label, opt.label) : opt.label;
  return label || String(opt.value);
}

async function loadPrograms(limit = 200): Promise<Program[]> {
  const pages = await getAllPages(limit);
  const pool = getPool();
  const programs: Program[] = [];

  for (const page of pages) {
    const reqResult = await pool.query(
      'SELECT category, type, value, required, source, description, format, requirements FROM requirements WHERE page_id = $1',
      [page.id]
    );

    const categorized: Record<string, any[]> = {};
    reqResult.rows.forEach((row: any) => {
      if (!categorized[row.category]) categorized[row.category] = [];

      let parsedValue: any = row.value;
      if (typeof row.value === 'string') {
        try {
          if (row.value.startsWith('{') || row.value.startsWith('[')) {
            parsedValue = JSON.parse(row.value);
          }
        } catch {
          // leave as string
        }
      }

      categorized[row.category].push({
        type: row.type,
        value: parsedValue,
        required: row.required,
        source: row.source,
        description: row.description,
        format: row.format,
        requirements: row.requirements
          ? typeof row.requirements === 'string'
            ? JSON.parse(row.requirements)
            : row.requirements
          : undefined
      });
    });

    programs.push({
      id: `page_${page.id}`,
      name: page.title || page.url,
      type: page.funding_types?.[0] || 'program',
      program_type: page.funding_types?.[0] || 'grant',
      program_category:
        Array.isArray(page.program_focus) && page.program_focus.length > 0
          ? page.program_focus[0]
          : 'general',
      requirements: categorized,
      notes: page.description || '',
      link: page.url,
      maxAmount: page.funding_amount_max,
      target_personas: page.metadata_json?.target_personas || [],
      tags: page.metadata_json?.tags || [],
      decision_tree_questions: [],
      editor_sections: [],
      readiness_criteria: [],
      ai_guidance: null,
      categorized_requirements: categorized
    } as Program);
  }

  return programs;
}

const scenarios: Scenario[] = [
  {
    name: 'Pre-revenue Digital Grant',
    description: 'Early-stage SME seeking R&D grant support for a sustainability-focused digital product.',
    answers: {
      location: 'austria',
      company_type: 'sme',
      company_stage: 'inc_6_36m',
      team_size: '1to2',
      revenue_status: 'pre_revenue',
      co_financing: 'co_yes',
      industry_focus: ['digital'],
      funding_amount: 'under100k',
      use_of_funds: ['rd'],
      impact: ['economic'],
      deadline_urgency: 'urgent',
      project_duration: 'over10',
      rd_in_austria: 'yes',
      trl_level: 'trl_1_2',
      strategic_focus: ['sustainability']
    }
  },
  {
    name: 'Scaleup Manufacturing Loan',
    description: 'Established manufacturer looking for a loan/guarantee to finance equipment expansion.',
    answers: {
      location: 'austria',
      company_type: 'sme',
      company_stage: 'inc_gt_36m',
      team_size: 'over10',
      revenue_status: 'growing_revenue',
      co_financing: 'co_yes',
      industry_focus: ['manufacturing'],
      funding_amount: '500kto2m',
      use_of_funds: ['equipment'],
      impact: ['economic'],
      deadline_urgency: 'soon',
      project_duration: '5to10',
      rd_in_austria: 'no',
      trl_level: 'trl_7_8',
      strategic_focus: ['manufacturing']
    }
  },
  {
    name: 'Research Organisation Collaboration',
    description: 'University-led consortium focusing on health research, seeking grants with partial co-financing.',
    answers: {
      location: 'eu',
      company_type: 'research',
      company_stage: 'research_org',
      team_size: 'over10',
      revenue_status: 'pre_revenue',
      co_financing: 'co_partial',
      industry_focus: ['health'],
      funding_amount: '100kto500k',
      use_of_funds: ['personnel'],
      impact: ['environmental', 'social'],
      deadline_urgency: 'flexible',
      project_duration: '2to5',
      rd_in_austria: 'yes',
      trl_level: 'trl_3_4',
      strategic_focus: ['health', 'sustainability']
    }
  }
];

async function runScenario(enginePrograms: Program[], scenario: Scenario) {
  const engine = new QuestionEngine(enginePrograms);
  const answers: AnswersMap = {};
  const steps: Array<{ index: number; question: SymptomQuestion; chosenValue: any; label: string }> = [];

  let question = await engine.getNextQuestion(answers);
  let index = 1;

  while (question) {
    const scenarioValue = scenario.answers[question.id];
    let chosenValue: any;

    if (scenarioValue !== undefined) {
      chosenValue =
        question.type === 'multi-select' && !Array.isArray(scenarioValue)
          ? [scenarioValue]
          : scenarioValue;

      const options = question.options || [];
      const valuesToCheck = Array.isArray(chosenValue) ? chosenValue : [chosenValue];
      const allPresent = valuesToCheck.every(value =>
        options.some(opt => String(opt.value) === String(value))
      );
      if (!allPresent && options.length > 0) {
        chosenValue = question.type === 'multi-select' ? [options[0].value] : options[0].value;
      }
    } else {
      const fallback = question.options?.[0]?.value;
      chosenValue = question.type === 'multi-select' ? (fallback ? [fallback] : []) : fallback;
    }

    answers[question.id] = chosenValue;
    const label = question.type === 'multi-select'
      ? (Array.isArray(chosenValue) ? chosenValue.map(value => resolveOptionLabel(question, value)).join(', ') : '')
      : resolveOptionLabel(question, chosenValue);

    steps.push({
      index,
      question,
      chosenValue,
      label
    });

    index += 1;
    question = await engine.getNextQuestion(answers);
  }

  const filteredPrograms = engine.getFilteredProgramsForAnswers(answers);
  const scored = await scoreProgramsEnhanced(
    answers,
    'strict',
    filteredPrograms
  );
  const topPrograms = scored.slice(0, 5).map(program => ({
    id: program.id,
    name: program.name,
    type: program.program_type || program.type,
    score: program.score,
    unknownCriteria: program.unknownCriteria || [],
    matchSummary: program.matchSummary || {}
  }));

  return {
    scenario,
    steps,
    answers,
    remainingCount: filteredPrograms.length,
    topPrograms
  };
}

async function main() {
  console.log('🚀 Loading programme catalogue...');
  const programs = await loadPrograms(300);
  console.log(`ℹ️ Loaded ${programs.length} programmes from the database snapshot\n`);

  for (const scenario of scenarios) {
    console.log(`=== Scenario: ${scenario.name} ===`);
    console.log(`${scenario.description}\n`);

    const result = await runScenario(programs, scenario);

    console.log('Question Order & Answers:');
    for (const step of result.steps) {
      const questionText = t(step.question.symptom, step.question.symptom);
      console.log(
        `${step.index}. [${step.question.id}] ${questionText} → ${step.label || JSON.stringify(step.chosenValue)}`
      );
    }

    console.log('\nAnswers payload:', JSON.stringify(result.answers, null, 2));
    console.log(`\nRemaining programmes after filtering: ${result.remainingCount}`);

    console.log('Top recommendations:');
    result.topPrograms.forEach((program, idx) => {
      console.log(
        `  ${idx + 1}. ${program.name} (${program.type}) — score ${program.score ?? 'N/A'}`
      );
      const summaryEntries = Object.entries(program.matchSummary);
      if (summaryEntries.length > 0) {
        const summaryText = summaryEntries
          .map(([key, status]) => `${key}:${status}`)
          .join(', ');
        console.log(`     ↳ answered criteria → ${summaryText}`);
      }
      if (program.unknownCriteria.length > 0) {
        console.log(`     ↳ unknown criteria → ${program.unknownCriteria.join(', ')}`);
      }
    });

    console.log('\n---\n');
  }

  console.log('✔️ Scenario analysis complete');
}

main().catch(error => {
  console.error('❌ Failed to run scenario analysis:', error);
  process.exit(1);
});


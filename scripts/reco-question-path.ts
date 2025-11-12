/**
 * Inspect the guided recommendation flow.
 * Logs each question in the order it appears together with the auto-selected answer.
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env vars (.env.local preferred)
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { QuestionEngine, SymptomQuestion } from '../features/reco/engine/questionEngine';
import { getAllPages, getPool } from '../scraper-lite/db/db';
import type { Program } from '../shared/types/requirements';

type AnswersMap = Record<string, any>;

const translations = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'shared', 'i18n', 'translations', 'en.json'), 'utf8')
);

function t(key: string | undefined, fallback: string): string {
  if (!key) return fallback;
  return translations[key] || fallback || key;
}

function resolveOptionLabel(option: { label?: string; value: any }): string {
  if (!option.label) return String(option.value);
  return t(option.label, option.label);
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
          // leave original string
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

async function inspectQuestionPath() {
  console.log('🚀 Loading programs...');
  const programs = await loadPrograms();
  console.log(`ℹ️ Loaded ${programs.length} programs`);

  const engine = new QuestionEngine(programs);
  const answers: AnswersMap = {};
  const steps: Array<{ index: number; question: SymptomQuestion; answer: any; label: string }> = [];

  let question = await engine.getNextQuestion(answers);
  let index = 1;

  while (question) {
    const option = question.options?.[0];
    if (!option) break;

    const value = question.type === 'multi-select' ? [option.value] : option.value;
    answers[question.id] = value;

    steps.push({
      index,
      question,
      answer: value,
      label: question.type === 'multi-select'
        ? Array.isArray(value)
          ? value.map((v: any) =>
              resolveOptionLabel({ label: question.options?.find(o => o.value === v)?.label, value: v })
            ).join(', ')
          : String(value)
        : resolveOptionLabel(option)
    });

    index += 1;
    question = await engine.getNextQuestion(answers);
  }

  console.log('\n🧭 Question Path');
  steps.forEach(step => {
    const questionText = t(step.question.symptom, step.question.symptom);
    console.log(
      `${step.index}. [${step.question.id}] ${questionText} → ${step.label} (${JSON.stringify(step.answer)})`
    );
  });

  console.log('\n✅ Final answers object:');
  console.log(JSON.stringify(answers, null, 2));

  const filteredPrograms = engine.getFilteredProgramsForAnswers(answers);
  console.log(`\n🎯 Programs remaining after guided answers: ${filteredPrograms.length}`);
}

inspectQuestionPath()
  .then(() => {
    console.log('\n✔️ Question path inspection complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to inspect question path:', error);
    process.exit(1);
  });


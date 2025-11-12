/**
 * CLI script to run the guided recommendation flow end-to-end.
 * 1. Loads latest programs from the scraper-lite database.
 * 2. Instantiates the QuestionEngine and answers each question with the first available option.
 * 3. Scores the filtered programs and prints the top results.
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables (prefer .env.local)
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { getAllPages, getPool } from '../scraper-lite/db/db';
import { QuestionEngine } from '../features/reco/engine/questionEngine';
import { scoreProgramsEnhanced } from '../features/reco/engine/enhancedRecoEngine';
import type { Program } from '../shared/types/requirements';

type AnswersMap = Record<string, any>;

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
      if (!categorized[row.category]) {
        categorized[row.category] = [];
      }

      let parsedValue: any = row.value;
      if (typeof row.value === 'string') {
        try {
          if (row.value.startsWith('{') || row.value.startsWith('[')) {
            parsedValue = JSON.parse(row.value);
          }
        } catch {
          // keep original string
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
          : undefined,
      });
    });

    programs.push({
      id: `page_${page.id}`,
      name: page.title || page.url,
      type: page.funding_types?.[0] || 'program',
      program_type: page.funding_types?.[0] || 'grant',
      program_category: Array.isArray(page.program_focus) && page.program_focus.length > 0 ? page.program_focus[0] : 'general',
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
      categorized_requirements: categorized,
    } as Program);
  }

  return programs;
}

async function runGuidedFlow() {
  console.log('🚀 Loading programs from database…');
  const programs = await loadPrograms();
  console.log(`ℹ️ Loaded ${programs.length} programs`);

  const engine = new QuestionEngine(programs);
  const answers: AnswersMap = {};

  let question = await engine.getNextQuestion(answers);
  while (question) {
    const firstOption = question.options?.[0];
    if (!firstOption) {
      break;
    }

    const value = question.type === 'multi-select' ? [firstOption.value] : firstOption.value;
    answers[question.id] = value;
    console.log(`❓ ${question.symptom} → ${Array.isArray(value) ? value.join(', ') : value}`);

    question = await engine.getNextQuestion(answers);
  }

  console.log('\n✅ Final answers map:', answers);

  const filteredPrograms = engine.getFilteredProgramsForAnswers(answers);
  console.log(`🎯 Programs after filtering: ${filteredPrograms.length}`);

  const scored = await scoreProgramsEnhanced(answers, 'strict', filteredPrograms);
  console.log('\n🏆 Top recommendations:');
  scored.slice(0, 5).forEach((program, index) => {
    console.log(
      `${index + 1}. ${program.name} — score ${program.score?.total ?? 'N/A'} (${program.program_type})`
    );
  });
}

runGuidedFlow()
  .then(() => {
    console.log('\n✔️ Guided flow completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Guided flow failed:', error);
    process.exit(1);
  });


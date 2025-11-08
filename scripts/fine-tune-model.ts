#!/usr/bin/env ts-node
/**
 * Fine-tuning scaffold for Plan2Fund custom LLM.
 *
 * This script prepares instruction-following datasets from anonymized
 * plan data, program requirements and scraper logs. It does not actually run
 * the fine-tuning job but produces the artifacts required for HuggingFace
 * `trl` / LoRA training pipelines.
 *
 * Usage:
 *   pnpm ts-node scripts/fine-tune-model.ts --dataset ./tmp/dataset.jsonl
 *
 * Environment variables:
 *   DATA_COLLECTION_EXPORT   Path to exported anonymized plan data (JSON)
 *   TEMPLATE_USAGE_EXPORT    Path to template usage export (JSON)
 *   SCRAPER_METRICS_EXPORT   Path to scraper metrics export (JSON)
 */

import fs from 'fs';
import path from 'path';

interface CLIOptions {
  datasetPath: string;
  limit?: number;
}

interface InstructionExample {
  id: string;
  instruction: string;
  input: string;
  output: string;
  metadata?: Record<string, any>;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    datasetPath: './tmp/plan2fund-instructions.jsonl'
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dataset' && args[i + 1]) {
      options.datasetPath = args[i + 1];
      i += 1;
    } else if (arg === '--limit' && args[i + 1]) {
      options.limit = Number(args[i + 1]);
      i += 1;
    }
  }

  return options;
}

function loadJsonFile<T = any>(filePath?: string): T[] {
  if (!filePath) return [];
  if (!fs.existsSync(filePath)) {
    console.warn(`[fine-tune] File not found: ${filePath}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return parsed.data ?? [];
  } catch (error) {
    console.warn(`[fine-tune] Failed to parse ${filePath}:`, error);
    return [];
  }
}

function buildInstructionDataset(options: {
  plans: any[];
  templateUsage: any[];
  scraperMetrics: any[];
  limit?: number;
}): InstructionExample[] {
  const examples: InstructionExample[] = [];

  const addExample = (example: InstructionExample) => {
    examples.push(example);
  };

  options.plans.slice(0, options.limit ?? options.plans.length).forEach((plan, index) => {
    if (!plan.structure?.sections) return;

    // Example 1: Template generation from requirements
    if (plan.metadata?.program_requirements) {
      addExample({
        id: `template_gen_${index}`,
        instruction: 'Generate section templates tailored to these program requirements.',
        input: JSON.stringify(plan.metadata.program_requirements, null, 2),
        output: JSON.stringify(plan.structure.sections, null, 2),
        metadata: { task: 'template_generation' }
      });
    }

    // Example 2: Plan quality feedback
    addExample({
      id: `quality_feedback_${index}`,
      instruction: 'Provide actionable feedback to improve this business plan section.',
      input: plan.structure.sections
        .map((section: any) => `${section.title}\n${section.content || ''}`)
        .join('\n\n'),
      output: JSON.stringify(plan.qualityMetrics || {}, null, 2),
      metadata: { task: 'quality_feedback' }
    });
  });

  options.scraperMetrics.slice(0, options.limit ?? options.scraperMetrics.length).forEach((metric, index) => {
    addExample({
      id: `extraction_strategy_${index}`,
      instruction: 'Given the extraction history, recommend the best method for the next scrape.',
      input: JSON.stringify(metric, null, 2),
      output: metric.accuracy > 0.7 ? 'llm' : metric.accuracy > 0.4 ? 'hybrid' : 'regex',
      metadata: { task: 'extraction_strategy' }
    });
  });

  return examples;
}

function ensureDirectory(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveAsJsonl(filePath: string, data: InstructionExample[]) {
  ensureDirectory(filePath);
  const lines = data.map((item) => JSON.stringify(item));
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf-8');
  console.log(`[fine-tune] Wrote ${data.length} examples  ${filePath}`);
}

async function main() {
  const options = parseArgs();

  const plans = loadJsonFile(process.env.DATA_COLLECTION_EXPORT);
  const templateUsage = loadJsonFile(process.env.TEMPLATE_USAGE_EXPORT);
  const scraperMetrics = loadJsonFile(process.env.SCRAPER_METRICS_EXPORT);

  if (plans.length === 0) {
    console.warn('[fine-tune] No plan data found. Export anonymized plans via /api/data-collection/plans first.');
  }

  const dataset = buildInstructionDataset({
    plans,
    templateUsage,
    scraperMetrics,
    limit: options.limit,
  });

  if (dataset.length === 0) {
    console.warn('[fine-tune] Dataset empty. Aborting.');
    return;
  }

  saveAsJsonl(options.datasetPath, dataset);

  console.log(`\nNext steps:`);
  console.log(`1. Upload ${options.datasetPath} to your fine-tuning environment.`);
  console.log('2. Run LoRA fine-tuning, e.g. using HuggingFace TRL:');
  console.log('   accelerate launch train_lora.py \\');
  console.log('     --model_name_or_path mistralai/Mistral-7B-Instruct-v0.2 \\');
  console.log('     --dataset_path ./tmp/plan2fund-instructions.jsonl');
  console.log('3. Expose the resulting model via CUSTOM_LLM_ENDPOINT and set API key / model name.');
}

main().catch((error) => {
  console.error('[fine-tune] Unexpected error:', error);
  process.exit(1);
});

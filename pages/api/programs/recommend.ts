import { NextApiRequest, NextApiResponse } from 'next';
import {
  normalizeLocationAnswer,
  normalizeCompanyTypeAnswer,
  normalizeCompanyStageAnswer,
  normalizeFundingAmountAnswer,
  normalizeFundingAmountExtraction,
  matchLocations,
  matchCompanyTypes,
  matchFundingAmounts,
  matchCompanyStages,
} from '../../../features/reco/engine/normalization';

type UserAnswers = Record<string, any>;

interface GeneratedProgram {
  id: string;
  name: string;
  url?: string | null;
  source?: string;
  location?: string | null;
  company_type?: string | null;
  funding_types?: string[];
  metadata?: {
    funding_amount_min?: number | null;
    funding_amount_max?: number | null;
    currency?: string | null;
    location?: string | null;
    description?: string | null;
    region?: string | null;
    company_stage?: string | null;
  };
  categorized_requirements?: Record<string, any>;
}

const REQUIRED_FIELDS = ['location', 'company_type', 'funding_amount', 'company_stage'];
const DEFAULT_MAX_RESULTS = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const answers: UserAnswers = req.body?.answers || {};
  const maxResults = Number(req.body?.max_results) || DEFAULT_MAX_RESULTS;

  const missingFields = REQUIRED_FIELDS.filter((field) => answers[field] === undefined || answers[field] === null || answers[field] === '');
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required answers',
      missing: missingFields,
    });
  }

  let generated: GeneratedProgram[] = [];
  let llmError: string | null = null;
  let llmRawResponse: string | null = null;
  let fallbackUsed = false;

  try {
    const generation = await generateProgramsWithLLM(answers, maxResults * 2);
    generated = generation.programs;
    llmRawResponse = generation.raw;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[reco][recommend] LLM raw response preview:', (llmRawResponse || '').slice(0, 2000));
      console.log('[reco][recommend] Programs parsed from LLM:', generated.length);
    } else {
      console.log('[reco][recommend] LLM returned', generated.length, 'programs; raw length:', llmRawResponse?.length || 0);
    }
  } catch (error: any) {
    llmError = error?.message || 'Unknown LLM error';
    console.error('generateProgramsWithLLM failed:', llmError);
  }

  let matching = generated.filter((program) => matchesAnswers(program, answers));
  if (matching.length === 0 && generated.length > 0) {
    // Surface something instead of empty response
    matching = generated;
    fallbackUsed = true;
  }
  if (matching.length === 0) {
    matching = buildFallbackPrograms(answers, maxResults);
    fallbackUsed = true;
  }

  return res.status(200).json({
    success: true,
    programs: matching.slice(0, maxResults),
    count: matching.length,
    debug: {
      requiredMissing: missingFields.length,
      llmProgramCount: generated.length,
      afterFiltering: matching.length,
      llmError,
      llmRaw: llmRawResponse,
      fallbackUsed,
    },
  });
}

async function generateProgramsWithLLM(answers: UserAnswers, maxPrograms: number): Promise<{ programs: GeneratedProgram[]; raw: string | null }> {
  const profile = summarizeProfile(answers);
  const fundingPreference = inferFundingPreference(answers);

  let instructions = `You are an expert on European funding programs.
Return up to ${maxPrograms} programs that match this profile:

${profile}

Rules:
1. Include only programs available in the specified location or EU-wide if appropriate.
2. Company type and stage must be compatible with the user.
3. Funding range should align with the user's need (be lenient but stay relevant).
4. Every program must include a funding_types array describing the instrument (grant, loan, equity, guarantee, subsidy, convertible, other).
5. If a value is unknown, return null for that key but keep the key.

Return JSON only with this exact structure:
{
  "programs": [
    {
      "id": "string",
      "name": "string",
      "website": "https://example.com",
      "funding_types": ["grant","loan"],
      "funding_amount_min": 5000,
      "funding_amount_max": 20000,
      "currency": "EUR",
      "location": "Austria",
      "company_type": "startup",
      "company_stage": "inc_lt_6m",
      "description": "Two sentences explaining the program, audience, and amount",
      "metadata": {
        "region": "Austria",
        "program_focus": ["digital","innovation"]
      },
      "categorized_requirements": {}
    }
  ]
}

Example:
{
  "programs": [
    {
      "id": "aws_seedfinancing",
      "name": "AWS Seedfinancing",
      "website": "https://www.aws.at/seedfinancing",
      "funding_types": ["grant"],
      "funding_amount_min": 50000,
      "funding_amount_max": 800000,
      "currency": "EUR",
      "location": "Austria",
      "company_type": "startup",
      "company_stage": "inc_6_36m",
      "description": "Austria Wirtschaftsservice supports innovative startups with grants for prototypes and market entry.",
      "metadata": {
        "region": "Austria",
        "program_focus": ["innovation","technology"]
      },
      "categorized_requirements": {}
    }
  ]
}`;

  if (fundingPreference.allowMix) {
    instructions += `\n6. Provide a mix of funding instruments. Include at least one grant AND at least one non-grant option (loan, guarantee, or equity) if the profile can work with them.`;
  } else {
    instructions += `\n6. The user can only work with grants/subsidies. Do not suggest loans, guarantees, or equity instruments.`;
  }

  const messages = [
    { role: 'system' as const, content: 'Return funding programs as JSON only.' },
    { role: 'user' as const, content: instructions },
  ];

  const { isCustomLLMEnabled, callCustomLLM } = await import('../../../shared/lib/ai/customLLM');
  const OpenAI = (await import('openai')).default;

  let responseText: string | null = null;
  let rawResponse: string | null = null;

  if (isCustomLLMEnabled()) {
    const response = await callCustomLLM({
      messages,
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 2000,
    });
    responseText = response.output;
    rawResponse = response.output;
  } else if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.2,
    });
    responseText = completion.choices[0]?.message?.content || null;
    rawResponse = responseText;
  } else {
    throw new Error('No LLM configured');
  }

  if (!responseText) {
    return { programs: [], raw: rawResponse };
  }

  const parsed = parseLLMResponse(responseText);
  const programs = Array.isArray(parsed?.programs) ? parsed.programs : [];

  return {
    raw: rawResponse,
    programs: programs.map((program: any, index: number) => ({
      id: program.id || `llm_${index}`,
      name: program.name || `Program ${index + 1}`,
      url: program.website || program.url || null,
      location: program.location || null,
      company_type: program.company_type || null,
      funding_types: Array.isArray(program.funding_types) ? program.funding_types : [],
      metadata: {
        funding_amount_min: program.funding_amount_min ?? null,
        funding_amount_max: program.funding_amount_max ?? null,
        currency: program.currency || 'EUR',
        location: program.location || null,
        description: program.description || null,
        region: program.location || null,
        company_stage: program.company_stage || null,
      },
      source: 'llm_generated',
    })),
  };
}

function summarizeProfile(answers: UserAnswers): string {
  const lines: string[] = [];

  if (answers.location) {
    const region = answers.location_region ? ` (${answers.location_region})` : '';
    lines.push(`Location: ${answers.location}${region}`);
  }
  if (answers.company_type) {
    lines.push(`Company type: ${answers.company_type}`);
  }
  if (typeof answers.company_stage === 'number') {
    lines.push(`Company stage: ${answers.company_stage} months`);
  } else if (answers.company_stage) {
    lines.push(`Company stage: ${answers.company_stage}`);
  }
  if (answers.funding_amount !== undefined && answers.funding_amount !== null) {
    const amount = typeof answers.funding_amount === 'number'
      ? `€${answers.funding_amount.toLocaleString()}`
      : answers.funding_amount;
    lines.push(`Funding need: ${amount}`);
  }
  if (answers.industry_focus) {
    const industries = Array.isArray(answers.industry_focus) ? answers.industry_focus : [answers.industry_focus];
    lines.push(`Industry focus: ${industries.join(', ')}`);
  }
  if (answers.co_financing) {
    lines.push(`Co-financing: ${answers.co_financing}`);
  }
  if (answers.impact) {
    const impacts = Array.isArray(answers.impact) ? answers.impact : [answers.impact];
    lines.push(`Impact: ${impacts.join(', ')}`);
  }

  return lines.join('\n');
}

function inferFundingPreference(answers: UserAnswers) {
  const instruments = new Set<string>(['grant']);
  const coFinancing = (answers.co_financing || '').toString().toLowerCase();
  const stageMonths = typeof answers.company_stage === 'number' ? answers.company_stage : null;
  const stageCategory = typeof answers.company_stage === 'string' ? answers.company_stage : null;

  if (coFinancing !== 'co_no') {
    instruments.add('loan');
    instruments.add('guarantee');
  }

  const allowEquity =
    (stageMonths !== null && stageMonths >= 6) ||
    (stageMonths === null &&
      stageCategory !== null &&
      stageCategory !== 'idea' &&
      stageCategory !== 'pre_company');

  if (allowEquity) {
    instruments.add('equity');
  }

  return {
    values: Array.from(instruments),
    allowMix: coFinancing !== 'co_no',
  };
}

function parseLLMResponse(responseText: string) {
  try {
    return JSON.parse(sanitizeLLMResponse(responseText));
  } catch (error) {
    console.warn('Failed to parse LLM JSON:', error);
    return {};
  }
}

function sanitizeLLMResponse(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed.replace(/```json|```/g, '');
    return withoutFence.trim();
  }
  return trimmed;
}

function normalizeCompanyStageValue(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    if (value < 0) return 'pre_company';
    if (value < 6) return 'inc_lt_6m';
    if (value < 36) return 'inc_6_36m';
    return 'inc_gt_36m';
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return null;
}

function matchesAnswers(program: GeneratedProgram, answers: UserAnswers): boolean {
  const categorized = program.categorized_requirements || {};
  const metadata = program.metadata || {};

  if (answers.location) {
    const userLocation = normalizeLocationAnswer(answers.location);
    const programLocation = metadata.location || program.location || categorized.geographic?.[0]?.value;
    if (programLocation) {
      const normalizedProgramLocation = normalizeLocationAnswer(programLocation);
      if (!matchLocations(userLocation, normalizedProgramLocation)) {
        return false;
      }
    }
  }

  if (answers.company_type) {
    const userType = normalizeCompanyTypeAnswer(answers.company_type);
    const programType = program.company_type || categorized.eligibility?.[0]?.value;
    if (programType) {
      const normalizedProgramType = normalizeCompanyTypeAnswer(programType);
      if (!matchCompanyTypes(userType, normalizedProgramType)) {
        return false;
      }
    }
  }

  if (answers.company_stage !== undefined && answers.company_stage !== null) {
    const userStageValue = normalizeCompanyStageValue(answers.company_stage);
    if (userStageValue) {
      const userStage = normalizeCompanyStageAnswer(userStageValue);
      const programStageValue =
        (program as any).company_stage ||
        metadata.company_stage ||
        categorized.eligibility?.find((item: any) => item.type === 'company_stage')?.value;
      if (programStageValue) {
        const normalizedProgramStage = normalizeCompanyStageAnswer(programStageValue);
        if (!matchCompanyStages(userStage, normalizedProgramStage)) {
          return false;
        }
      }
    }
  }

  if (answers.funding_amount !== undefined && answers.funding_amount !== null) {
    const userAmount = normalizeFundingAmountAnswer(answers.funding_amount);
    const programAmount = normalizeFundingAmountExtraction(
      metadata.funding_amount_min ?? null,
      metadata.funding_amount_max ?? null
    );
    if (programAmount && !matchFundingAmounts(userAmount, programAmount)) {
      const userNeed = typeof answers.funding_amount === 'number' ? answers.funding_amount : userAmount.max;
      const min = metadata.funding_amount_min || 0;
      const max = metadata.funding_amount_max || 0;
      const tolerance = userNeed < 10000 ? 5 : 3;
      const withinTolerance =
        (min === 0 || min <= userNeed * tolerance) &&
        (max === 0 || max <= userNeed * tolerance * 1.5);
      if (!withinTolerance) {
        return false;
      }
    }
  }

  return true;
}

function buildFallbackPrograms(answers: UserAnswers, maxPrograms: number): GeneratedProgram[] {
  const programs: GeneratedProgram[] = [];
  for (let i = 0; i < Math.max(1, maxPrograms); i++) {
    programs.push({
      id: `fallback_${i + 1}`,
      name: `General Funding Option ${i + 1}`,
      url: null,
      funding_types: ['grant'],
      metadata: {
        funding_amount_min: typeof answers.funding_amount === 'number' ? Math.max(1000, answers.funding_amount * 0.5) : 5000,
        funding_amount_max: typeof answers.funding_amount === 'number' ? answers.funding_amount * 2 : 20000,
        currency: 'EUR',
        description: 'Suggested program based on your profile. Please verify details manually.',
        location: answers.location || 'Austria',
        region: answers.location || 'Austria',
      },
      source: 'fallback',
    });
  }
  return programs;
}


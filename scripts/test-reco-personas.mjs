#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://localhost:3000';
const baseUrl = (process.env.RECO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const bypassToken =
  process.env.VERCEL_BYPASS_TOKEN ||
  process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS ||
  process.env.VERCEL_PROTECTION_BYPASS ||
  process.env.VERCEL_PROTECTION_BYPASS_TOKEN ||
  process.env.PROTECTION_BYPASS_TOKEN ||
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

console.log(`[reco-test] Base URL: ${baseUrl}`);
console.log(`[reco-test] Bypass header: ${bypassToken ? 'enabled' : 'not set'}`);

const personas = [
  {
    name: 'Micro Grant Founder',
    description: 'Austria-based idea/seed team seeking a grant under €50k.',
    answers: {
      location: 'austria',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: 15000,
      industry_focus: ['digital'],
      co_financing: 'co_no',
    },
  },
  {
    name: 'Growth SME Loan',
    description: 'German SME needing ~€250k with co-financing capacity.',
    answers: {
      location: 'germany',
      company_type: 'sme',
      company_stage: 'inc_gt_36m',
      funding_amount: 250000,
      industry_focus: ['manufacturing'],
      co_financing: 'co_yes',
    },
  },
  {
    name: 'Equity Scaleup',
    description: 'EU sustainability scale-up looking for ~€750k equity.',
    answers: {
      location: 'eu',
      company_type: 'startup',
      company_stage: 'inc_gt_36m',
      funding_amount: 750000,
      industry_focus: ['sustainability'],
      co_financing: 'co_yes',
    },
  },
];

async function runPersona(persona) {
  const url = `${baseUrl}/api/programs/recommend`;
  const payload = { answers: persona.answers, max_results: 10 };
  const start = Date.now();

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (bypassToken) {
      headers['x-vercel-protection-bypass'] = bypassToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const raw = await response.text();
    const duration = Date.now() - start;

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.log('━━━━━━━━━━━━━━━━━━');
      console.log(`Persona: ${persona.name}`);
      console.log('Failed to parse JSON:', err.message);
      console.log(raw.slice(0, 400));
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━');
    console.log(`Persona: ${persona.name}`);
    console.log(persona.description);

    if (!response.ok) {
      console.log(`HTTP ${response.status} ${response.statusText}`);
      console.dir(data, { depth: 3 });
      return;
    }

    const programs = Array.isArray(data.programs) ? data.programs : [];
    const fallbackCount = programs.filter((p) => p.source === 'fallback').length;

    console.log(`Duration: ${duration}ms`);
    console.log(`Programs returned: ${programs.length}`);
    console.log(`Fallback entries: ${fallbackCount}`);
    if (data.debug) {
      console.log('Debug summary:', {
        llmError: data.debug.llmError,
        llmProgramCount: data.debug.llmProgramCount,
        afterFiltering: data.debug.afterFiltering,
        fallbackUsed: data.debug.fallbackUsed,
      });
    }

    programs.slice(0, 3).forEach((program, idx) => {
      console.log(
        `  ${idx + 1}. ${(program.name || 'Unnamed')} | source=${program.source || 'unknown'}`
      );
    });
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━');
    console.log(`Persona: ${persona.name}`);
    console.log('Request failed:', error.message);
  }
}

(async () => {
  console.log(`Testing /api/programs/recommend via ${baseUrl}`);
  for (const persona of personas) {
    await runPersona(persona);
  }
})();



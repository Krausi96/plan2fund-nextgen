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

// const stagingToken = process.env.STAGING_BYPASS_TOKEN; // placeholder for future staging runs
// const extraHeaders = { 'x-plan2fund-test': 'true' }; // enable when backend supports QA flags

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
  {
    name: 'Research Institution Grant',
    description: 'Austrian research institution seeking EU funding for innovation project.',
    answers: {
      location: 'austria',
      company_type: 'research',
      company_stage: 'research_org',
      funding_amount: 500000,
      industry_focus: ['health', 'research'],
      co_financing: 'co_yes',
      impact_focus: ['research', 'innovation'],
    },
  },
  {
    name: 'Early Stage with Support',
    description: 'Pre-company idea stage seeking grants + coaching/mentoring support.',
    answers: {
      location: 'germany',
      company_type: 'prefounder',
      company_stage: 'pre_company',
      funding_amount: 50000,
      industry_focus: ['digital'],
      co_financing: 'co_no',
      use_of_funds: ['product_development', 'hiring'],
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

    // Count funding types
    const fundingTypeCounts = {};
    programs.forEach((p) => {
      const types = p.funding_types || p.metadata?.funding_types || [];
      types.forEach((type) => {
        fundingTypeCounts[type] = (fundingTypeCounts[type] || 0) + 1;
      });
    });
    if (Object.keys(fundingTypeCounts).length > 0) {
      console.log('Funding types:', fundingTypeCounts);
    }

    // Show first 3 programs with details
    programs.slice(0, 3).forEach((program, idx) => {
      const types = program.funding_types || program.metadata?.funding_types || [];
      const typesStr = types.length > 0 ? ` | types=[${types.join(', ')}]` : ' | types=[]';
      const org = program.metadata?.organization ? ` | org=${program.metadata.organization}` : '';
      const coFin = program.metadata?.co_financing_required ? ` | co-fin=${program.metadata.co_financing_percentage || 'yes'}%` : '';
      const desc = program.description || program.metadata?.description || '';
      const descPreview = desc ? ` | desc="${desc.substring(0, 60)}${desc.length > 60 ? '...' : ''}"` : '';
      console.log(
        `  ${idx + 1}. ${(program.name || 'Unnamed')} | source=${program.source || 'unknown'}${typesStr}${org}${coFin}${descPreview}`
      );
    });
    
    // Check for bias: count grants vs non-grants
    const grantCount = Object.entries(fundingTypeCounts).reduce((sum, [type, count]) => {
      return sum + (type.toLowerCase().includes('grant') || type.toLowerCase().includes('subsidy') ? count : 0);
    }, 0);
    const nonGrantCount = Object.entries(fundingTypeCounts).reduce((sum, [type, count]) => {
      return sum + (!type.toLowerCase().includes('grant') && !type.toLowerCase().includes('subsidy') ? count : 0);
    }, 0);
    console.log(`Bias check: ${grantCount} grant/subsidy mentions vs ${nonGrantCount} non-grant mentions`);
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



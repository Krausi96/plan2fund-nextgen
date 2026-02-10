/**
 * Blueprint Generator Service (Lean + Self-Learning)
 * Generates structured funding blueprint from program + context
 */

import { callLLM, type LLMRequest } from '@/platform/ai/llmClient';
import { parseBlueprintResponse } from '@/platform/ai/parsers/responseParsers';
import type { Blueprint } from '@/platform/core/types/blueprint';

/**
 * Fallback blueprint when LLM generation fails
 */
function createFallbackBlueprint(program: ProgramInfo): any {
  return {
    programId: program.id,
    programName: program.name,
    structure: {
      documents: [{
        id: 'main',
        name: 'Application',
        required: true,
      }],
      sections: [
        {
          id: 'executive_summary',
          documentId: 'main',
          title: 'Executive Summary',
          required: true,
          critical: true,
        },
        {
          id: 'business_description',
          documentId: 'main',
          title: 'Business Description',
          required: true,
        },
      ],
    },
    requirements: {
      global: [],
      bySection: {},
    },
    validation: {},
    diagnostics: {
      confidence: 0,
      assumptions: ['Using default template due to LLM failure'],
      missingInfo: ['Unable to extract specific requirements'],
    },
  };
}

/* =========================================================
   TYPES
========================================================= */

export interface RequirementItem {
  id: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  evidence?: string;
}

interface ProgramInfo {
  id: string;
  name: string;
  description: string;
  funding_types: string[];
  application_requirements?: any;
}

/* =========================================================
   MAIN GENERATOR
========================================================= */

export async function generateBlueprint(
  program: ProgramInfo,
  userContext: Record<string, any>
): Promise<Blueprint> {
  try {
    console.log(`[blueprint] generating for ${program.name}`);

    
    const prompt = buildBlueprintPrompt(program, userContext, '');

    const request: LLMRequest = {
      messages: [
        {
          role: 'system',
          content:
            'You generate professional funding application blueprints from program requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 5000,
    };

    const response = await callLLM(request);
    const parsed = parseBlueprintResponseLocal(response.output);

    console.log(`[blueprint] generated successfully for ${program.name}`);
    return parsed;

  } catch (err) {
    console.error(`[blueprint] failed for ${program.name}`, err);
    return createFallbackBlueprint(program);
  }
}

/* =========================================================
   PROMPT BUILDER (SHORT + STRONG)
========================================================= */

function buildBlueprintPrompt(
  program: ProgramInfo,
  userContext: Record<string, any>,
  learnedHints: string
): string {

return `
Create a COMPLETE funding application blueprint.

PROGRAM
${program.name}
${program.description || ''}

CONTEXT
Location: ${userContext?.location || 'N/A'}
Stage: ${userContext?.company_stage || 'N/A'}
Funding: ${userContext?.funding_amount || 'N/A'}

${learnedHints}

EXTRACT ALL REAL REQUIREMENTS:
- required documents
- required sections + subsections
- required content per section
- innovation / market / tech expectations
- evidence required (tables, CVs, proof, annex)
- financial expectations
- formatting or submission constraints

The examples above are illustrative only.
Include ANY additional requirements found.
Be precise and professional.

RETURN JSON:

{
 "programId": "${program.id}",
 "programName": "${program.name}",

 "structure":{
  "documents":[{"id":"main","name":"Application","required":true}],
  "sections":[
    {"id":"market","documentId":"main","title":"Market","required":true}
  ]
 },

 "requirements":{
  "global":[],
  "bySection":{
   "market":[
    {"id":"tam","description":"Provide TAM/SAM/SOM","severity":"major"}
   ]
  }
 },

 "validation":{
  "financial":{"yearsRequired":3},
  "formatting":{"maxPages":30}
 },

 "guidance":{
  "sectionTips":{
   "market":["Be specific and use numbers"]
  }
 },

 "diagnostics":{"confidence":80}
}
`;
}

/* =========================================================
   PARSER
========================================================= */

function parseBlueprintResponseLocal(responseText: string): Blueprint {
  try {
    const parsed = parseBlueprintResponse(responseText);

    if (!parsed?.structure?.sections) {
      throw new Error('Invalid blueprint structure');
    }

    return parsed as Blueprint;

  } catch (error) {
    console.error('[blueprint] parse failed:', error);
    throw new Error('Invalid blueprint response format');
  }
}

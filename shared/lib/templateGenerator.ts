/**
 * LLM Template Generator
 * Generates program-specific section templates from scraped requirements
 * Based on strategic analysis report recommendations (Area 3)
 */

import OpenAI from 'openai';
import { SectionTemplate } from './templates/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProgramRequirements {
  programId: string;
  programName: string;
  categorized_requirements: Record<string, Array<{
    value: string;
    type?: string;
    source?: string;
  }>>;
  metadata?: {
    funding_types?: string[];
    program_focus?: string[];
    region?: string;
  };
}

interface GeneratedSection {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  wordCount?: { min: number; max: number };
  required?: boolean;
  order?: number;
}

/**
 * Generate section templates from program requirements using LLM
 */
export async function generateTemplatesFromRequirements(
  requirements: ProgramRequirements
): Promise<SectionTemplate[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OPENAI_API_KEY - template generation disabled');
    return [];
  }

  try {
    // Prepare requirement summary for LLM
    const requirementSummary = summarizeRequirements(requirements);
    
    // Get master sections to understand structure
    const { MASTER_SECTIONS } = await import('./templates/sections');
    // Use grants submission as default, but could be enhanced to detect funding type
    const masterSections = MASTER_SECTIONS.grants?.submission || [];
    
    // Generate prompts for LLM
    const systemPrompt = createSystemPrompt(masterSections);
    const userPrompt = createUserPrompt(requirements, requirementSummary);
    
    // Call LLM
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });
    
    const llmResponse = JSON.parse(completion.choices[0].message?.content || '{}');
    return transformLLMResponse(llmResponse, requirements, masterSections);
    
  } catch (error: any) {
    console.error('LLM template generation failed:', error?.message || String(error));
    return [];
  }
}

/**
 * Summarize requirements into text for LLM
 */
function summarizeRequirements(requirements: ProgramRequirements): string {
  const parts: string[] = [];
  
  parts.push(`Program: ${requirements.programName || requirements.programId}`);
  
  if (requirements.metadata?.funding_types) {
    parts.push(`Funding types: ${requirements.metadata.funding_types.join(', ')}`);
  }
  
  if (requirements.metadata?.program_focus) {
    parts.push(`Focus areas: ${requirements.metadata.program_focus.join(', ')}`);
  }
  
  // Summarize key requirement categories
  const keyCategories = [
    'eligibility_criteria', 'company_type', 'company_stage',
    'environmental_impact', 'social_impact', 'economic_impact',
    'innovation_focus', 'technology_area', 'sector_focus',
    'use_of_funds', 'application_process', 'evaluation_criteria'
  ];
  
  keyCategories.forEach(category => {
    const items = requirements.categorized_requirements[category];
    if (items && items.length > 0) {
      const values = items.map(item => item.value).join('; ');
      parts.push(`${category}: ${values}`);
    }
  });
  
  return parts.join('\n');
}

/**
 * Create system prompt for LLM
 */
function createSystemPrompt(masterSections: SectionTemplate[]): string {
  const sectionIds = masterSections.map(s => s.id).join(', ');
  
  return `You are a business plan template generator for funding programs.

Your task is to analyze program requirements and generate section templates that guide users to write content that meets those requirements.

Available master sections: ${sectionIds}

For each relevant section, generate:
1. A description that explains what to write (incorporating program-specific requirements)
2. 3-5 prompts that guide the user to address program requirements
3. Word count range (if program specifies)
4. Whether the section is required (based on program requirements)

Focus on:
- Making prompts program-specific (e.g., if program emphasizes sustainability, add prompts about environmental impact)
- Ensuring requirements are addressed in the prompts
- Keeping descriptions concise but actionable

Return JSON with this structure:
{
  "sections": [
    {
      "id": "section_id_from_master",
      "description": "Program-specific description",
      "prompts": ["prompt 1", "prompt 2", ...],
      "wordCount": {"min": 200, "max": 800},
      "required": true
    }
  ]
}`;
}

/**
 * Create user prompt with program requirements
 */
function createUserPrompt(
  requirements: ProgramRequirements,
  summary: string
): string {
  return `Generate section templates for this funding program:

${summary}

Key requirements to address:
${Object.entries(requirements.categorized_requirements)
  .filter(([_, items]) => items && items.length > 0)
  .map(([category, items]) => {
    const values = items.map((item: any) => item.value).join('; ');
    return `- ${category}: ${values}`;
  })
  .join('\n')}

Generate templates that help users write content meeting these requirements.`;
}

/**
 * Transform LLM response into SectionTemplate format
 */
function transformLLMResponse(
  llmResponse: any,
  requirements: ProgramRequirements,
  masterSections: SectionTemplate[]
): SectionTemplate[] {
  if (!llmResponse.sections || !Array.isArray(llmResponse.sections)) {
    return [];
  }
  
  const masterById = new Map(masterSections.map(s => [s.id, s]));
  const generated: SectionTemplate[] = [];
  
  for (const section of llmResponse.sections) {
    const master = masterById.get(section.id);
    if (!master) continue; // Skip if section doesn't exist in master
    
    generated.push({
      ...master,
      description: section.description || master.description,
      prompts: section.prompts || master.prompts,
      wordCountMin: section.wordCount?.min || master.wordCountMin,
      wordCountMax: section.wordCount?.max || master.wordCountMax,
      required: section.required !== undefined ? section.required : master.required,
      order: section.order !== undefined ? section.order : master.order,
      category: master.category, // Keep master category
      validationRules: master.validationRules, // Keep master validation rules
      source: {
        verified: false,
        verifiedDate: new Date().toISOString(),
        officialProgram: requirements.programName,
        sourceUrl: null,
        version: 'llm-generated-v1'
      }
    });
  }
  
  return generated;
}

/**
 * Suggest which master section fits a requirement category (for dynamic mapping)
 */
export async function suggestSectionForCategory(
  category: string,
  categoryValue: string,
  masterSections: SectionTemplate[]
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  try {
    const sectionIds = masterSections.map(s => `${s.id}: ${s.title}`).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a section classifier. Given a requirement category and its value, suggest which master section ID it belongs to.

Available sections:
${sectionIds}

Return only the section ID (e.g., "marketOpportunity"), nothing else.`
        },
        {
          role: 'user',
          content: `Category: ${category}\nValue: ${categoryValue}\n\nWhich section ID does this belong to?`
        }
      ],
      max_tokens: 50,
    });
    
    const suggestedId = completion.choices[0].message?.content?.trim();
    return masterSections.find(s => s.id === suggestedId) ? suggestedId : null;
    
  } catch (error) {
    console.error('Section suggestion failed:', error);
    return null;
  }
}


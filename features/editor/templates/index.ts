// ========= PLAN2FUND — UNIFIED TEMPLATE REGISTRY =========
// Consolidated template system: API, types, overrides, and generator
// Data is in data.ts (re-exports from sections.ts, documents.ts, templateKnowledge.ts)

// ============================================================================
// TYPES (re-exported from types.ts)
// ============================================================================

export type {
  SectionQuestion,
  SectionTemplate,
  DocumentTemplate
} from './types';

// Import types for function signatures
import { type SectionTemplate, type DocumentTemplate } from './types';

// ============================================================================
// DATA IMPORTS
// ============================================================================

import { 
  MASTER_SECTIONS, 
  MASTER_DOCUMENTS,
  getStandardSections,
  getSectionById,
  getSectionsByCategory,
  getTemplateKnowledge,
  getAllFrameworks,
  getExpertQuestions,
  type StandardSection,
  type TemplateKnowledge
} from './data';

// ============================================================================
// TEMPLATE REGISTRY API
// ============================================================================

/**
 * Get sections for a funding type and product type
 * SIMPLEST APPROACH: Always use master templates (verified, foolproof)
 * 
 * @param fundingType - The funding type (grants, bankLoans, equity, visa)
 * @param productType - The product type (strategy, review, submission)
 * @param programId - DEPRECATED: Not used (always returns master)
 * @param baseUrl - DEPRECATED: Not used
 * 
 * Master templates are based on official sources (Horizon Europe, FFG, WKO, Sequoia)
 * and are verified to work for all programs.
 */
export async function getSections(
  fundingType: string,
  productType: string = 'submission',
  _programId?: string,
  _baseUrl?: string
): Promise<SectionTemplate[]> {
  // SIMPLEST: Always return master template
  // No program-specific overrides, no merging, no complexity
  return MASTER_SECTIONS[fundingType]?.[productType] || 
         MASTER_SECTIONS.grants.submission;
}

/**
 * Get documents for funding type, product, and optional program
 * Priority: Program-specific → Master → Default
 */
export async function getDocuments(
  fundingType: string,
  productType: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate[]> {
  const masterDocs = MASTER_DOCUMENTS[fundingType]?.[productType] || [];
  
  // If programId provided, load program-specific and merge
  if (programId) {
    const programDocs = await loadProgramDocuments(programId, baseUrl);
    if (programDocs.length > 0) {
      return mergeDocuments(masterDocs, programDocs);
    }
  }
  
  return masterDocs;
}

/**
 * Get specific document by ID
 */
export async function getDocument(
  fundingType: string,
  productType: string,
  docId: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate | undefined> {
  const docs = await getDocuments(fundingType, productType, programId, baseUrl);
  return docs.find((d: DocumentTemplate) => d.id === docId);
}

/**
 * Get specific section by ID
 */
export async function getSection(
  fundingType: string,
  sectionId: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate | undefined> {
  const sections = await getSections(fundingType, productType, programId, baseUrl);
  return sections.find((s: SectionTemplate) => s.id === sectionId);
}

// ============================================================================
// PROGRAM-SPECIFIC OVERRIDES
// ============================================================================

/**
 * Merge program-specific documents with master documents
 * Program documents override master documents by ID
 */
function mergeDocuments(
  masterDocuments: DocumentTemplate[],
  programDocuments: DocumentTemplate[]
): DocumentTemplate[] {
  const merged: DocumentTemplate[] = [];
  const programById = new Map(programDocuments.map(d => [d.id, d]));
  
  // Start with master documents
  for (const master of masterDocuments) {
    // If program has override, use it; otherwise use master
    const override = programById.get(master.id);
    if (override) {
      merged.push({
        ...master,
        ...override, // Program-specific overrides master
        source: {
          verified: override.source?.verified ?? master.source?.verified ?? false,
          verifiedDate: override.source?.verifiedDate || master.source?.verifiedDate,
          officialProgram: override.source?.officialProgram || master.source?.officialProgram,
          sourceUrl: override.source?.sourceUrl || master.source?.sourceUrl,
          version: override.source?.version || master.source?.version
        }
      });
      programById.delete(master.id);
    } else {
      merged.push(master);
    }
  }
  
  // Add any program-specific documents not in master
  for (const programDoc of programById.values()) {
    merged.push(programDoc);
  }
  
  return merged;
}

/**
 * Load program-specific documents from database
 * Parses categorized_requirements.documents and converts to DocumentTemplate format
 */
async function loadProgramDocuments(programId: string, baseUrl?: string): Promise<DocumentTemplate[]> {
  try {
    // Load from API (which loads from database)
    // baseUrl needed for server-side (API routes)
    const apiUrl = baseUrl 
      ? `${baseUrl}/api/programs/${programId}/requirements`
      : typeof window !== 'undefined' 
        ? `/api/programs/${programId}/requirements`
        : `http://localhost:3000/api/programs/${programId}/requirements`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    const categorizedRequirements = data.categorized_requirements;
    
    if (!categorizedRequirements || !categorizedRequirements.documents) return [];
    
    // Parse documents from categorized_requirements
    const documents = categorizedRequirements.documents as Array<{
      value: string | string[];
      description?: string;
      format?: string;
      required?: boolean;
      requirements?: string[];
    }>;
    
    // Convert to DocumentTemplate format
    return documents.map((doc, idx) => {
      const value = Array.isArray(doc.value) ? doc.value.join(', ') : doc.value;
      const docId = `prog_doc_${idx}`;
      
      return {
        id: docId,
        name: value || 'Required Document',
        description: doc.description || value || '',
        required: doc.required !== false,
        format: (doc.format?.toLowerCase() as any) || 'pdf',
        maxSize: '10MB',
        template: `# ${value}\n\n## Document Description\n${doc.description || 'Program-specific required document.'}\n\n## Requirements\n${doc.requirements ? doc.requirements.map(r => `- ${r}`).join('\n') : '- Please provide as required by program'}`,
        instructions: doc.requirements || ['Follow program-specific requirements'],
        examples: [],
        commonMistakes: [],
        category: 'submission',
        fundingTypes: [data.program_type || 'grants'],
        source: {
          verified: true,
          verifiedDate: new Date().toISOString(),
          officialProgram: data.program_name
        }
      };
    });
  } catch (error) {
    console.error('Error loading program documents:', error);
    return [];
  }
}

// ============================================================================
// LLM TEMPLATE GENERATOR
// ============================================================================

import OpenAI from 'openai';
import { trackTemplateUsage } from '@/shared/user/analytics/dataCollection';
import { isCustomLLMEnabled, callCustomLLM } from '@/shared/lib/ai/customLLM';

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
    const masterSections = MASTER_SECTIONS.grants?.submission || [];
    
    // Generate prompts for LLM
    const systemPrompt = createSystemPrompt(masterSections);
    const userPrompt = createUserPrompt(requirements, requirementSummary);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    let responsePayload: string | null = null;

    if (isCustomLLMEnabled()) {
      try {
        const custom = await callCustomLLM({
          messages,
          responseFormat: 'json',
          maxTokens: 2000,
          temperature: 0.3,
        });
        responsePayload = custom.output;
      } catch (customError) {
        console.warn('Custom LLM template generation failed, using OpenAI fallback:', customError);
      }
    }

    if (!responsePayload) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.3,
      });
      responsePayload = completion.choices[0].message?.content || '{}';
    }

    let llmResponse: any;
    try {
      llmResponse = typeof responsePayload === 'string'
        ? JSON.parse(responsePayload)
        : responsePayload;
    } catch (parseError: any) {
      throw new Error(`Failed to parse template generator response: ${parseError?.message || parseError}`);
    }
    const generatedTemplates = transformLLMResponse(llmResponse, requirements, masterSections);
    
    // Track template generation (non-blocking)
    if (generatedTemplates.length > 0) {
      generatedTemplates.forEach(template => {
        trackTemplateUsage(template.id, 'section', false).catch(err => 
          console.error('Failed to track template usage:', err)
        );
      });
    }
    
    return generatedTemplates;
    
  } catch (error: any) {
    console.error('LLM template generation failed:', error?.message || String(error));
    return [];
  }
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
    
    const suggestedId = completion.choices[0].message?.content?.trim() || null;
    return suggestedId && masterSections.find(s => s.id === suggestedId) ? suggestedId : null;
    
  } catch (error) {
    console.error('Section suggestion failed:', error);
    return null;
  }
}

// Helper functions for LLM generation
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
        sourceUrl: undefined,
        version: 'llm-generated-v1'
      }
    });
  }
  
  return generated;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export master templates for direct access
export { MASTER_SECTIONS, MASTER_DOCUMENTS };

// Export template knowledge helpers
export { getTemplateKnowledge, getAllFrameworks, getExpertQuestions };
export type { TemplateKnowledge };

// Export standard sections helpers
export { getStandardSections, getSectionById, getSectionsByCategory };
export type { StandardSection };

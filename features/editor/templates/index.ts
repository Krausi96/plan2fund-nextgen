// ========= PLAN2FUND — UNIFIED TEMPLATE REGISTRY =========
// Simple template system - master templates only

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
// DATA IMPORTS (direct - no data.ts needed)
// ============================================================================

import { 
  MASTER_SECTIONS, 
  getStandardSections,
  getSectionById,
  getSectionsByCategory,
  type StandardSection
} from './sections';

import { 
  MASTER_DOCUMENTS
} from './documents';

import { 
  getTemplateKnowledge,
  type TemplateKnowledge
} from './templateKnowledge';

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
  _fundingType: string, // DEPRECATED: Ignored - no funding type distinction
  productType: string = 'submission',
  _programId?: string,
  _baseUrl?: string
): Promise<SectionTemplate[]> {
  // SIMPLEST: Only product type matters (strategy/review/submission)
  // No funding type distinction, no program-specific overrides
  return MASTER_SECTIONS[productType] || MASTER_SECTIONS.submission;
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
// LLM SECTION SUGGESTION (for categoryConverters)
// ============================================================================

import OpenAI from 'openai';

// Lazy initialization - only create client when actually needed (not during build)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Suggest which master section fits a requirement category (for dynamic mapping)
 * Used by categoryConverters.ts
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
    
    const completion = await getOpenAI().chat.completions.create({
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

// ============================================================================
// EXPORTS
// ============================================================================

// Export master templates for direct access
export { MASTER_SECTIONS, MASTER_DOCUMENTS };

// Export template knowledge helpers
export { getTemplateKnowledge };
export type { TemplateKnowledge };

// Export standard sections helpers
export { getStandardSections, getSectionById, getSectionsByCategory };
export type { StandardSection };

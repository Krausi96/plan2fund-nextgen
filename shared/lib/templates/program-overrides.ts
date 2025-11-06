// ========= PLAN2FUND — PROGRAM-SPECIFIC TEMPLATE OVERRIDES =========
// Program-specific templates override master templates
// Loaded from database and merged with master

import { SectionTemplate, DocumentTemplate } from './types';

/**
 * Merge program-specific sections with master sections
 * Program sections override master sections by ID
 */
export function mergeSections(
  masterSections: SectionTemplate[],
  programSections: SectionTemplate[]
): SectionTemplate[] {
  const merged: SectionTemplate[] = [];
  const programById = new Map(programSections.map(s => [s.id, s]));
  
  // Start with master sections
  for (const master of masterSections) {
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
  
  // Add any program-specific sections not in master
  for (const programSection of programById.values()) {
    merged.push(programSection);
  }
  
  return merged.sort((a, b) => a.order - b.order);
}

/**
 * Merge program-specific documents with master documents
 * Program documents override master documents by ID
 */
export function mergeDocuments(
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
 * Load program-specific sections from database
 * Uses LLM template generation if available, falls back to rule-based categoryConverters
 */
export async function loadProgramSections(programId: string, baseUrl?: string): Promise<SectionTemplate[]> {
  try {
    // Load from API (which loads from database)
    // baseUrl needed for server-side (API routes)
    const apiUrl = baseUrl 
      ? `${baseUrl}/api/programmes/${programId}/requirements`
      : typeof window !== 'undefined' 
        ? `/api/programmes/${programId}/requirements`
        : `http://localhost:3000/api/programmes/${programId}/requirements`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    const categorizedRequirements = data.categorized_requirements;
    
    if (!categorizedRequirements) return [];
    
    // Try LLM template generation first (if API key available)
    if (process.env.OPENAI_API_KEY) {
      try {
        const { generateTemplatesFromRequirements } = await import('@/shared/lib/templateGenerator');
        const llmTemplates = await generateTemplatesFromRequirements({
          programId,
          programName: data.program_name || programId,
          categorized_requirements: categorizedRequirements,
          metadata: {
            funding_types: data.funding_types,
            program_focus: data.program_focus,
            region: data.region
          }
        });
        
        if (llmTemplates.length > 0) {
          console.log(`✅ Generated ${llmTemplates.length} LLM templates for program ${programId}`);
          return llmTemplates;
        }
      } catch (llmError) {
        console.warn('LLM template generation failed, using fallback:', llmError);
      }
    }
    
    // Fallback to rule-based categoryConverters
    const { CategoryConverter } = await import('@/features/editor/engine/categoryConverters');
    const converter = new CategoryConverter();
    
    // Get program type
    const programType = data.program_type || 'grants';
    
    // Convert to editor sections (which uses master + enhancements)
    const editorSections = converter.convertToEditorSections(categorizedRequirements, programType);
    
    // Convert EditorSection[] to SectionTemplate[]
    return editorSections.map(es => ({
      id: es.id,
      title: es.section_name,
      description: es.guidance || es.placeholder || '',
      required: es.required !== false,
      wordCountMin: es.word_count_min || 200,
      wordCountMax: es.word_count_max || 800,
      order: es.order || 0,
      category: es.category || 'general',
      prompts: es.hints || [es.prompt],
      validationRules: {
        requiredFields: es.validation_rules?.filter((r: any) => r.required).map((r: any) => r.field) || [],
        formatRequirements: es.validation_rules?.map((r: any) => r.format) || []
      },
      source: {
        verified: true,
        verifiedDate: new Date().toISOString(),
        officialProgram: data.program_name
      }
    }));
  } catch (error) {
    console.error('Error loading program sections:', error);
    return [];
  }
}

/**
 * Load program-specific documents from database
 * Parses categorized_requirements.documents and converts to DocumentTemplate format
 */
export async function loadProgramDocuments(programId: string, baseUrl?: string): Promise<DocumentTemplate[]> {
  try {
    // Load from API (which loads from database)
    // baseUrl needed for server-side (API routes)
    const apiUrl = baseUrl 
      ? `${baseUrl}/api/programmes/${programId}/requirements`
      : typeof window !== 'undefined' 
        ? `/api/programmes/${programId}/requirements`
        : `http://localhost:3000/api/programmes/${programId}/requirements`;
    
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


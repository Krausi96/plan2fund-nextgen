// ============================================================================
// API LOGIC FOR LOADING PROGRAM DOCUMENTS AND SECTIONS
// ============================================================================

import type { DocumentTemplate, SectionTemplate } from './types';

export async function loadProgramDocuments(programId: string, baseUrl?: string): Promise<DocumentTemplate[]> {
  try {
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
    
    const documents = categorizedRequirements.documents as Array<{
      value: string | string[];
      description?: string;
      format?: string;
      required?: boolean;
      requirements?: string[];
    }>;
    
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
        origin: 'program' as const,
        programId: programId,
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

export function mergeDocuments(
  masterDocuments: DocumentTemplate[],
  programDocuments: DocumentTemplate[]
): DocumentTemplate[] {
  const merged: DocumentTemplate[] = [];
  const programById = new Map(programDocuments.map(d => [d.id, d]));
  
  // Mark master documents with origin
  const masterWithOrigin = masterDocuments.map(doc => ({
    ...doc,
    origin: (doc.origin || 'master') as 'master' | 'program' | 'custom'
  }));
  
  for (const master of masterWithOrigin) {
    const override = programById.get(master.id);
    if (override) {
      // Program version overrides master, preserve stricter requirements
      merged.push({
        ...master,
        ...override,
        origin: 'program' as const,
        required: override.required !== false || master.required, // Stricter requirement wins
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
  
  // Add remaining program-only documents
  for (const programDoc of programById.values()) {
    merged.push({
      ...programDoc,
      origin: 'program' as const
    });
  }
  
  return merged;
}

/**
 * Load program-specific section requirements from API
 */
export async function loadProgramSections(programId: string, baseUrl?: string): Promise<SectionTemplate[]> {
  try {
    const apiUrl = baseUrl 
      ? `${baseUrl}/api/programs/${programId}/requirements`
      : typeof window !== 'undefined' 
        ? `/api/programs/${programId}/requirements`
        : `http://localhost:3000/api/programs/${programId}/requirements`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    const categorizedRequirements = data.categorized_requirements;
    
    if (!categorizedRequirements) return [];
    
    // Map program requirements to section templates
    // This is a simplified mapping - in practice, you'd have more sophisticated matching
    const sections: SectionTemplate[] = [];
    
    // Check for section-like requirements in various categories
    const sectionCategories = ['project_description', 'innovation', 'impact', 'financial', 'market', 'team', 'risk'];
    
    sectionCategories.forEach((category, idx) => {
      const requirements = categorizedRequirements[category];
      if (requirements && Array.isArray(requirements) && requirements.length > 0) {
        // Create a section template from program requirements
        const sectionId = `prog_${category}_${idx}`;
        const req = requirements[0];
        const value = Array.isArray(req.value) ? req.value.join(' ') : String(req.value || '');
        
        sections.push({
          id: sectionId,
          title: value || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: req.description || value || `Program-specific requirement for ${category}`,
          required: req.required !== false,
          wordCountMin: 150,
          wordCountMax: 500,
          order: 100 + idx, // Place after master sections
          category: category,
          prompts: [value || `Describe ${category}`],
          validationRules: {
            requiredFields: [],
            formatRequirements: req.requirements || []
          },
          visibility: 'programOnly' as const,
          origin: 'program' as const,
          severity: req.required !== false ? 'hard' as const : 'soft' as const,
          programId: programId,
          source: {
            verified: true,
            verifiedDate: new Date().toISOString(),
            officialProgram: data.program_name
          }
        });
      }
    });
    
    return sections;
  } catch (error) {
    console.error('Error loading program sections:', error);
    return [];
  }
}

/**
 * Merge master sections with program-specific sections
 * Deduplicates by ID/slug, preserves stricter requirements, records origins
 */
export function mergeSections(
  masterSections: SectionTemplate[],
  programSections: SectionTemplate[]
): SectionTemplate[] {
  const merged: SectionTemplate[] = [];
  const programById = new Map<string, SectionTemplate>();
  const programBySlug = new Map<string, SectionTemplate>();
  
  // Index program sections by ID and slug (for fuzzy matching)
  programSections.forEach(section => {
    programById.set(section.id, section);
    const slug = section.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (!programBySlug.has(slug)) {
      programBySlug.set(slug, section);
    }
  });
  
  // Mark master sections with origin
  const masterWithOrigin = masterSections.map(section => ({
    ...section,
    origin: (section.origin || 'master') as 'master' | 'program' | 'custom',
    visibility: section.visibility || 'essential' as const
  }));
  
  // Process master sections and merge with program equivalents
  for (const master of masterWithOrigin) {
    const masterSlug = master.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const programMatch = programById.get(master.id) || programBySlug.get(masterSlug);
    
    if (programMatch) {
      // Merge: program requirements override master, preserve stricter rules
      merged.push({
        ...master,
        ...programMatch,
        // Preserve master's structure but apply program overrides
        title: programMatch.title || master.title,
        description: programMatch.description || master.description,
        required: programMatch.required !== false || master.required, // Stricter requirement wins
        wordCountMin: programMatch.wordCountMin || master.wordCountMin,
        wordCountMax: programMatch.wordCountMax || master.wordCountMax,
        // Merge prompts and questions
        prompts: [...master.prompts, ...(programMatch.prompts || [])],
        questions: [...(master.questions || []), ...(programMatch.questions || [])],
        origin: 'program' as const,
        severity: programMatch.severity || (programMatch.required !== false ? 'hard' as const : 'soft' as const),
        visibility: programMatch.visibility || master.visibility || 'essential' as const,
        programId: programMatch.programId,
        source: {
          verified: programMatch.source?.verified ?? master.source?.verified ?? false,
          verifiedDate: programMatch.source?.verifiedDate || master.source?.verifiedDate,
          officialProgram: programMatch.source?.officialProgram || master.source?.officialProgram,
          sourceUrl: programMatch.source?.sourceUrl || master.source?.sourceUrl,
          version: programMatch.source?.version || master.source?.version
        }
      });
      programById.delete(master.id);
      programBySlug.delete(masterSlug);
    } else {
      merged.push(master);
    }
  }
  
  // Add remaining program-only sections
  for (const programSection of programById.values()) {
    merged.push({
      ...programSection,
      origin: 'program' as const,
      visibility: programSection.visibility || 'programOnly' as const
    });
  }
  
  // Sort by order
  return merged.sort((a, b) => a.order - b.order);
}


// ============================================================================
// API LOGIC FOR LOADING PROGRAM REQUIREMENTS AND MERGING
// ============================================================================

import type { DocumentTemplate, SectionTemplate } from './types';

export async function loadProgramDocuments(programId: string, baseUrl?: string): Promise<DocumentTemplate[]> {
  try {
    // Always use relative URL on client-side (baseUrl should be undefined)
    // For server-side, use environment variable or fallback
    let apiUrl: string;
    if (baseUrl) {
      apiUrl = `${baseUrl}/api/programs/${programId}/requirements`;
    } else if (typeof window !== 'undefined') {
      // Client-side: use relative URL
      apiUrl = `/api/programs/${programId}/requirements`;
    } else {
      // Server-side: use environment variable
      const serverUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || '';
      apiUrl = serverUrl 
        ? `${serverUrl}/api/programs/${programId}/requirements`
        : `/api/programs/${programId}/requirements`;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn(`Failed to load program documents: ${response.status} ${response.statusText}`);
      return [];
    }
    
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
  
  for (const master of masterDocuments) {
    const override = programById.get(master.id);
    if (override) {
      merged.push({
        ...master,
        ...override,
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
  
  for (const programDoc of programById.values()) {
    merged.push(programDoc);
  }
  
  return merged;
}

/**
 * Load program section requirements from API
 * Similar to loadProgramDocuments but for sections
 */
export async function loadProgramSections(programId: string, baseUrl?: string): Promise<SectionTemplate[]> {
  try {
    // Always use relative URL on client-side (baseUrl should be undefined)
    // For server-side, use environment variable or fallback
    let apiUrl: string;
    if (baseUrl) {
      apiUrl = `${baseUrl}/api/programs/${programId}/requirements`;
    } else if (typeof window !== 'undefined') {
      // Client-side: use relative URL
      apiUrl = `/api/programs/${programId}/requirements`;
    } else {
      // Server-side: use environment variable
      const serverUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || '';
      apiUrl = serverUrl 
        ? `${serverUrl}/api/programs/${programId}/requirements`
        : `/api/programs/${programId}/requirements`;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn(`Failed to load program sections: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    const categorizedRequirements = data.categorized_requirements;
    
    if (!categorizedRequirements) return [];
    
    // Map categorized requirements to sections
    // For now, we'll create sections from key categories that map to business plan sections
    const sections: SectionTemplate[] = [];
    
    // Map project requirements to sections
    if (categorizedRequirements.project && Array.isArray(categorizedRequirements.project)) {
      categorizedRequirements.project.forEach((req: any, idx: number) => {
        const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value || '');
        if (!value) return;
        
        sections.push({
          id: `prog_section_project_${idx}`,
          title: value,
          description: req.description || value,
          required: req.required !== false,
          wordCountMin: 0, // Will be merged with master if duplicate
          wordCountMax: 0,
          order: 1000 + idx, // Place program sections after master
          category: 'project',
          prompts: req.requirements ? (Array.isArray(req.requirements) ? req.requirements : [req.requirements]) : [],
          questions: [],
          validationRules: {
            requiredFields: [],
            formatRequirements: []
          },
          origin: 'program',
          programId: programId,
          visibility: 'programOnly',
          severity: req.required === false ? 'soft' : 'hard',
          tags: [req.type || 'project']
        });
      });
    }
    
    // Map financial requirements
    if (categorizedRequirements.financial && Array.isArray(categorizedRequirements.financial)) {
      categorizedRequirements.financial.forEach((req: any, idx: number) => {
        const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value || '');
        if (!value) return;
        
        sections.push({
          id: `prog_section_financial_${idx}`,
          title: value,
          description: req.description || value,
          required: req.required !== false,
          wordCountMin: 0,
          wordCountMax: 0,
          order: 1000 + idx,
          category: 'financial',
          prompts: req.requirements ? (Array.isArray(req.requirements) ? req.requirements : [req.requirements]) : [],
          questions: [],
          validationRules: {
            requiredFields: [],
            formatRequirements: []
          },
          origin: 'program',
          programId: programId,
          visibility: 'programOnly',
          severity: req.required === false ? 'soft' : 'hard',
          tags: [req.type || 'financial']
        });
      });
    }
    
    // Map technical requirements
    if (categorizedRequirements.technical && Array.isArray(categorizedRequirements.technical)) {
      categorizedRequirements.technical.forEach((req: any, idx: number) => {
        const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value || '');
        if (!value) return;
        
        sections.push({
          id: `prog_section_technical_${idx}`,
          title: value,
          description: req.description || value,
          required: req.required !== false,
          wordCountMin: 0,
          wordCountMax: 0,
          order: 1000 + idx,
          category: 'technical',
          prompts: req.requirements ? (Array.isArray(req.requirements) ? req.requirements : [req.requirements]) : [],
          questions: [],
          validationRules: {
            requiredFields: [],
            formatRequirements: []
          },
          origin: 'program',
          programId: programId,
          visibility: 'programOnly',
          severity: req.required === false ? 'soft' : 'hard',
          tags: [req.type || 'technical']
        });
      });
    }
    
    return sections;
  } catch (error) {
    console.error('Error loading program sections:', error);
    return [];
  }
}

/**
 * Merge master sections with program sections
 * Deduplicates by ID or slug, preserves stricter requirements, records origin metadata
 */
export function mergeSections(
  masterSections: SectionTemplate[],
  programSections: SectionTemplate[]
): SectionTemplate[] {
  const merged: SectionTemplate[] = [];
  const programById = new Map(programSections.map(s => [s.id, s]));
  const programBySlug = new Map<string, SectionTemplate>();
  
  // Build slug map for fuzzy matching (normalize titles to slugs)
  programSections.forEach(section => {
    const slug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (slug && !programBySlug.has(slug)) {
      programBySlug.set(slug, section);
    }
  });
  
  // Process master sections first
  for (const master of masterSections) {
    // Check for exact ID match
    const programMatch = programById.get(master.id);
    
    if (programMatch) {
      // Merge: program overrides master, but preserve stricter requirements
      merged.push({
        ...master,
        ...programMatch,
        // Preserve stricter word counts
        wordCountMin: Math.max(master.wordCountMin, programMatch.wordCountMin || 0),
        wordCountMax: programMatch.wordCountMax > 0 
          ? (master.wordCountMax > 0 ? Math.min(master.wordCountMax, programMatch.wordCountMax) : programMatch.wordCountMax)
          : master.wordCountMax,
        // Preserve stricter required flag
        required: master.required || programMatch.required,
        // Merge questions (program questions override master)
        questions: programMatch.questions && programMatch.questions.length > 0
          ? programMatch.questions
          : master.questions,
        // Set origin metadata
        origin: 'program',
        programId: programMatch.programId,
        visibility: programMatch.visibility || master.visibility || 'essential',
        severity: programMatch.severity || master.severity,
        tags: [...(master.tags || []), ...(programMatch.tags || [])]
      });
      programById.delete(master.id);
    } else {
      // Check for fuzzy slug match
      const masterSlug = master.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const fuzzyMatch = programBySlug.get(masterSlug);
      
      if (fuzzyMatch) {
        // Merge with fuzzy match
        merged.push({
          ...master,
          ...fuzzyMatch,
          id: master.id, // Keep master ID
          title: master.title, // Keep master title
          wordCountMin: Math.max(master.wordCountMin, fuzzyMatch.wordCountMin || 0),
          wordCountMax: fuzzyMatch.wordCountMax > 0 
            ? (master.wordCountMax > 0 ? Math.min(master.wordCountMax, fuzzyMatch.wordCountMax) : fuzzyMatch.wordCountMax)
            : master.wordCountMax,
          required: master.required || fuzzyMatch.required,
          questions: fuzzyMatch.questions && fuzzyMatch.questions.length > 0
            ? fuzzyMatch.questions
            : master.questions,
          origin: 'program',
          programId: fuzzyMatch.programId,
          visibility: fuzzyMatch.visibility || master.visibility || 'essential',
          severity: fuzzyMatch.severity || master.severity,
          tags: [...(master.tags || []), ...(fuzzyMatch.tags || [])]
        });
        programById.delete(fuzzyMatch.id);
        programBySlug.delete(masterSlug);
      } else {
        // No match - keep master as-is, mark origin
        merged.push({
          ...master,
          origin: master.origin || 'master'
        });
      }
    }
  }
  
  // Add remaining program sections (program-only additions)
  for (const programSection of programById.values()) {
    merged.push({
      ...programSection,
      origin: 'program',
      visibility: programSection.visibility || 'programOnly'
    });
  }
  
  // Sort by order
  return merged.sort((a, b) => a.order - b.order);
}


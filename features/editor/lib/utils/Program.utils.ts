/**
 * DOCUMENT SETUP UTILITIES
 * 
 * Contains utility functions for Step 2: Document Setup functionality.
 * Handles program connection, document structure generation, and setup workflows.
 */

import type { ProgramSummary } from '../types/types';
import type { FundingProgram, DocumentStructure, SetupDiagnostics } from '../types/Program-Types';

/**
 * Normalize program input (URL or ID) to extract program ID.
 * 
 * Handles both direct program IDs and URLs containing program IDs.
 * Used in ProgramSelection component to parse user input.
 * 
 * @param input - User input (could be ID or URL)
 * @returns Normalized program ID or null if invalid
 */
export function normalizeProgramInput(input: string): string | null {
  if (!input || !input.trim()) return null;
  
  const trimmed = input.trim();
  
  // If it's already a simple ID, return it
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to extract from URL
  try {
    const url = new URL(trimmed);
    // Extract ID from pathname or return hostname
    const pathParts = url.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || url.hostname;
  } catch {
    // Not a valid URL, return trimmed input
    return trimmed;
  }
}

/**
 * Normalize raw program data into FundingProgram format
 * Processes funding program information for document setup
 */
export function normalizeFundingProgram(rawProgramData: any): FundingProgram {
  // Extract funding types with fallback
  const fundingTypes = rawProgramData.funding_types || 
                      rawProgramData.type ? [rawProgramData.type] : 
                      ['grant'];
  
  // Parse amount range
  let amountRange: { min?: number; max?: number; currency: string } | undefined;
  if (rawProgramData.funding_amount_min || rawProgramData.funding_amount_max) {
    amountRange = {
      min: rawProgramData.funding_amount_min,
      max: rawProgramData.funding_amount_max,
      currency: rawProgramData.currency || 'EUR'
    };
  } else if (rawProgramData.amountRange) {
    // Try to parse string amount range
    const match = rawProgramData.amountRange.match(/[€$£]\s*([\d,]+)\s*-\s*[€$£]?\s*([\d,]+)/);
    if (match) {
      amountRange = {
        min: parseInt(match[1].replace(/,/g, '')),
        max: parseInt(match[2].replace(/,/g, '')),
        currency: rawProgramData.amountRange.includes('€') ? 'EUR' : 'USD'
      };
    }
  }
  
  // Normalize use of funds
  const useOfFunds = rawProgramData.use_of_funds || 
                    rawProgramData.useOfFunds || 
                    ['general_business_purposes'];
  
  // Normalize deliverables
  const deliverables = rawProgramData.deliverables || 
                      rawProgramData.required_documents || 
                      ['business_plan'];
  
  // Normalize requirements
  const requirements = rawProgramData.requirements || 
                      rawProgramData.required_sections || 
                      [];
  
  // Normalize focus areas
  const focusAreas = rawProgramData.focus_areas || 
                    rawProgramData.program_focus || 
                    rawProgramData.focusAreas || 
                    [];
  
  // Normalize evidence required
  const evidenceRequired = rawProgramData.evidence_required || 
                          rawProgramData.evidenceRequired || 
                          [];
  
  return {
    id: rawProgramData.id || rawProgramData.programId || `program_${Date.now()}`,
    name: rawProgramData.name || rawProgramData.programName || 'Unnamed Program',
    provider: rawProgramData.organization || rawProgramData.provider || 'Unknown Provider',
    region: rawProgramData.region || rawProgramData.location || 'Global',
    
    fundingTypes: fundingTypes as ('grant' | 'loan' | 'equity' | 'subsidy')[],
    amountRange,
    deadline: rawProgramData.deadline || null,
    
    useOfFunds,
    coFinancingRequired: rawProgramData.co_financing_required ?? false,
    coFinancingPercentage: rawProgramData.co_financing_percentage || undefined,
    focusAreas,
    
    deliverables,
    requirements,
    formattingRules: {
      length: rawProgramData.page_limit ? { 
        maxPages: rawProgramData.page_limit 
      } : undefined,
      language: rawProgramData.language || 'English',
      attachments: rawProgramData.attachments || []
    },
    
    evidenceRequired,
    applicationRequirements: {
      documents: rawProgramData.application_requirements?.documents || [],
      sections: rawProgramData.application_requirements?.sections || [],
      financialRequirements: {
        financial_statements_required: rawProgramData.application_requirements?.financial_requirements?.financial_statements_required || [],
        years_required: rawProgramData.application_requirements?.financial_requirements?.years_required || [],
        co_financing_proof_required: rawProgramData.application_requirements?.financial_requirements?.co_financing_proof_required || false,
        own_funds_proof_required: rawProgramData.application_requirements?.financial_requirements?.own_funds_proof_required || false
      }
    },
    rawData: rawProgramData
  };
}

/**
 * Normalize ProgramSummary for document setup
 * Adds setup tracking fields to existing ProgramSummary
 */
export function normalizeProgramSetup(programSummary: ProgramSummary): ProgramSummary {
  // Return the same object with blueprint fields initialized if needed
  return {
    ...programSummary,
    documentStructure: programSummary.documentStructure !== undefined ? programSummary.documentStructure : undefined,
    setupStatus: programSummary.setupStatus || 'none',
    setupVersion: programSummary.setupVersion || '1.0',
    setupSource: programSummary.setupSource || 'program',
    setupDiagnostics: programSummary.setupDiagnostics !== undefined ? programSummary.setupDiagnostics : undefined
  };
}

/**
 * Create minimal ProgramSummary from program data (backward compatibility)
 * @deprecated Use normalizeFundingProgram() instead for new code
 */
export function generateProgramBlueprint(programData: any): ProgramSummary {
  // Simplified version for backward compatibility
  const mockSummary: ProgramSummary = {
    id: programData.id || `program_${Date.now()}`,
    name: programData.name || 'Unnamed Program',
    type: programData.type || programData.funding_types?.[0] || 'grant',
    amountRange: programData.amountRange || 
      (programData.funding_amount_min && programData.funding_amount_max 
        ? `€${programData.funding_amount_min.toLocaleString()} - €${programData.funding_amount_max.toLocaleString()}`
        : programData.amountRange),
    deadline: programData.deadline || null,
    
    // Blueprint fields (minimal for compatibility)
    source: 'program',
    requiredDocuments: ['business-plan'],
    requiredSections: ['executive-summary', 'company-description', 'market-analysis', 'financial-plan'],
    requirementSchemas: [],
    validationRules: [],
    formattingRules: [],
    complianceStrictness: 'medium',
    programFocus: [],
    fundingTypes: [],
    useOfFunds: [],
    coFinancingRequired: false,
    region: undefined,
    organization: undefined,
    typicalTimeline: undefined,
    competitiveness: undefined,
    categorizedRequirements: {}
  };
  
  return mockSummary;
}

/**
 * Generate DocumentStructure from FundingProgram
 * Creates complete document structure for generation
 */
export function generateDocumentStructureFromProfile(profile: FundingProgram): DocumentStructure {
  // Generate documents from parsed requirements
  const documents = profile.applicationRequirements.documents.map((doc, index) => ({
    id: `doc_${index}_${doc.document_name.replace(/\s+/g, '_').toLowerCase()}`,
    name: doc.document_name,
    purpose: `Required for ${profile.name}`,
    required: doc.required,
    templateId: doc.format === 'pdf' ? 'pdf_template' : 'default_template'
  }));
  
  // Generate sections from parsed requirements
  const sections = profile.applicationRequirements.sections.flatMap((section, sectionIndex) => 
    section.subsections.map((subsection, subIndex) => ({
      id: `sec_${sectionIndex}_${subIndex}_${section.title.replace(/\s+/g, '_').toLowerCase()}_${subsection.title.replace(/\s+/g, '_').toLowerCase()}`,
      documentId: 'main_document',
      title: `${section.title}: ${subsection.title}`,
      type: subsection.required ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
      required: subsection.required,
      programCritical: true,
      aiPrompt: `Write detailed content for ${subsection.title} in the context of ${profile.name}`,
      checklist: [`Address ${subsection.title} requirements`, `Include relevant details`, `Follow program guidelines`]
    }))
  );
  
  // Generate requirements from financial and other requirements
  const requirements = [
    // Financial requirements
    ...profile.applicationRequirements.financialRequirements.financial_statements_required.map((stmt, index) => ({
      id: `req_financial_${index}`,
      scope: 'section' as const,
      category: 'financial' as const,
      severity: 'major' as const,
      rule: `Must include ${stmt} statement`,
      target: stmt,
      evidenceType: 'financial_document'
    })),
    // Document requirements
    ...profile.applicationRequirements.documents.filter(doc => doc.required).map((doc, index) => ({
      id: `req_doc_${index}`,
      scope: 'document' as const,
      category: 'formatting' as const,
      severity: 'blocker' as const,
      rule: `Document must be in ${doc.format} format from ${doc.authority}`,
      target: doc.document_name,
      evidenceType: 'document_submission'
    }))
  ];
  
  // Generate validation rules
  const validationRules = [
    // Presence validation for required documents
    ...profile.applicationRequirements.documents.filter(doc => doc.required).map((doc, index) => ({
      id: `val_doc_presence_${index}`,
      type: 'presence' as const,
      scope: doc.document_name,
      errorMessage: `${doc.document_name} is required and must be submitted`
    })),
    // Financial statement validation
    ...profile.applicationRequirements.financialRequirements.financial_statements_required.map((stmt, index) => ({
      id: `val_financial_${index}`,
      type: 'presence' as const,
      scope: stmt,
      errorMessage: `${stmt} statement is required for financial evaluation`
    }))
  ];
  
  // Generate AI guidance
  const aiGuidance = sections.map(section => ({
    sectionId: section.id,
    prompt: section.aiPrompt || `Write professional content for ${section.title}`,
    checklist: section.checklist || [`Cover all ${section.title} aspects`, `Maintain professional tone`],
    examples: [`Example content for ${section.title}...`]
  }));
  
  return {
    structureId: `structure_${profile.id}_${Date.now()}`,
    version: '1.0',
    source: 'program' as const,
    documents,
    sections,
    requirements,
    validationRules,
    aiGuidance,
    renderingRules: {
      titlePage: { includeLogo: true, includeDate: true },
      tableOfContents: { autoGenerate: true },
      references: { citationStyle: 'APA' },
      appendices: { autoNumber: true }
    },
    conflicts: [],
    warnings: profile.applicationRequirements.documents.some(doc => !doc.reuseable) ? 
      ['Some documents cannot be reused for other applications'] : [],
    confidenceScore: profile.applicationRequirements.documents.length > 0 && 
                    profile.applicationRequirements.sections.length > 0 ? 90 : 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'program_utils'
  };
}

// generateBlueprintFromProfile removed - unused placeholder function

/**
 * Simplified URL validation - removed complex domain-specific parsing
 * @deprecated Use direct program data input instead
 */
export async function parseProgramFromUrl(url: string): Promise<any> {
  try {
    new URL(url); // Basic URL validation
    console.warn('⚠️ Complex URL parsing removed - use direct program input');
    return null;
  } catch (error) {
    console.error('❌ Invalid URL:', error);
    return null;
  }
}

/**
 * Migrate legacy ProgramSummary to new document setup system
 */
export function migrateLegacySetup(programSummary: ProgramSummary): {
  fundingProgram: FundingProgram | null;
  structure: DocumentStructure | null;
  status: 'none' | 'draft' | 'confirmed' | 'locked';
  diagnostics: SetupDiagnostics;
} {
  // Check if already migrated
  if (programSummary.blueprint && programSummary.blueprintStatus !== 'none') {
    return {
      fundingProgram: null, // Legacy setups don't have FundingProgram
      structure: programSummary.documentStructure || null,
      status: programSummary.setupStatus || 'draft',
      diagnostics: programSummary.setupDiagnostics || {
        warnings: [],
        missingFields: [],
        confidence: 85
      }
    };
  }
  
  try {
    // Create FundingProgram from legacy data
    const fundingProgram: FundingProgram = {
      id: programSummary.id,
      name: programSummary.name,
      provider: programSummary.organization || 'Unknown Provider',
      region: programSummary.region || 'Global',
      
      fundingTypes: [programSummary.type || 'grant'] as ('grant' | 'loan' | 'equity' | 'subsidy')[],
      amountRange: programSummary.amountRange ? {
        min: undefined, // Would need parsing
        max: undefined, // Would need parsing
        currency: 'EUR'
      } : undefined,
      deadline: programSummary.deadline || undefined,
      
      useOfFunds: programSummary.useOfFunds || ['general_business_purposes'],
      coFinancingRequired: programSummary.coFinancingRequired || false,
      coFinancingPercentage: undefined,
      focusAreas: programSummary.programFocus || [],
      
      deliverables: programSummary.requiredDocuments || ['business_plan'],
      requirements: programSummary.requiredSections || [
        'executive_summary',
        'company_description', 
        'market_analysis',
        'financial_plan'
      ],
      formattingRules: {
        language: 'English',
        attachments: []
      },
      
      evidenceRequired: [],
      applicationRequirements: {
        documents: programSummary.application_requirements?.documents || [],
        sections: programSummary.application_requirements?.sections || [],
        financialRequirements: programSummary.application_requirements?.financial_requirements || {
          financial_statements_required: [],
          years_required: [],
          co_financing_proof_required: false,
          own_funds_proof_required: false
        }
      },
      rawData: programSummary
    };
    
    // Note: Document structure generation would happen here in full implementation
    // For now, return the funding program for migration
    
    return {
      fundingProgram,
      structure: null, // Will be generated separately
      status: 'none' as const,
      diagnostics: {
        warnings: ['Legacy program migrated - limited information available'],
        missingFields: ['Detailed requirements', 'Specific deadlines'],
        confidence: 60
      }
    };
    
  } catch (error) {
    console.warn('Failed to migrate legacy program:', error);
    return {
      fundingProgram: null,
      structure: null,
      status: 'none' as const,
      diagnostics: {
        warnings: ['Failed to migrate legacy program'],
        missingFields: [],
        confidence: 0
      }
    };
  }
}
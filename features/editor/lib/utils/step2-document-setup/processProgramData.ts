/**
 * PROGRAM PROCESSING UTILITIES
 * 
 * Contains functions for processing program data and converting to document structures.
 */

import type { ProgramSummary } from '../../types/types';
import type { FundingProgram, DocumentStructure, SetupDiagnostics } from '../../types/Program-Types';

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
  const documents = profile.applicationRequirements.documents.length > 0 
    ? profile.applicationRequirements.documents.map((doc, index) => ({
        id: `doc_${index}_${doc.document_name.replace(/\s+/g, '_').toLowerCase()}`,
        name: doc.document_name,
        purpose: `Required for ${profile.name}`,
        required: doc.required,
        templateId: doc.format === 'pdf' ? 'pdf_template' : 'default_template'
      }))
    : [{
        id: 'main_document',
        name: `${profile.name} Application`,
        purpose: `Main document for ${profile.name}`,
        required: true
      }];

  // Determine the primary document ID for sections
  const primaryDocumentId = documents[0].id;
  
  // Generate sections from parsed requirements
  let sections = profile.applicationRequirements.sections.map((section, sectionIndex) => {
    // Create subsections for this section
    const rawSubsections = section.subsections.map((subsection, subIndex) => ({
      id: `subsec_${sectionIndex}_${subIndex}_${subsection.title.replace(/\s+/g, '_').toLowerCase()}`,
      title: subsection.title,
      rawText: '' // Initially empty, will be filled by the AI or user
    }));
    
    // Determine appropriate document for this section based on content
    let sectionDocumentId = primaryDocumentId; // Default to primary document
    
    // Map sections to appropriate documents based on keywords and business logic
    const sectionLower = section.title.toLowerCase();
    
    // Try to find a document that matches the section content
    if (sectionLower.includes('financial') || sectionLower.includes('finance')) {
      // Try to find Financial Statements document
      const financialDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('financial') || 
        doc.name.toLowerCase().includes('statement')
      );
      if (financialDoc) {
        sectionDocumentId = financialDoc.id;
      }
    } else if (sectionLower.includes('project') || sectionLower.includes('business') || sectionLower.includes('description')) {
      // Try to find Business Plan document
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    } else if (sectionLower.includes('market') || sectionLower.includes('competition')) {
      // Try to find a suitable document for market sections
      const marketDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan') ||
        doc.name.toLowerCase().includes('marketing')
      );
      if (marketDoc) {
        sectionDocumentId = marketDoc.id;
      }
    } else if (sectionLower.includes('team') || sectionLower.includes('qualification') || sectionLower.includes('personnel')) {
      // Team sections often go in business plan
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    } else if (sectionLower.includes('innovation') || sectionLower.includes('technology') || sectionLower.includes('patent')) {
      // Innovation sections might go in proof of innovation or business plan
      const innovationDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('innovation') || 
        doc.name.toLowerCase().includes('patent') ||
        doc.name.toLowerCase().includes('technical')
      );
      if (innovationDoc) {
        sectionDocumentId = innovationDoc.id;
      } else {
        // Default to business plan if no specific innovation document
        const businessPlanDoc = documents.find(doc => 
          doc.name.toLowerCase().includes('business') || 
          doc.name.toLowerCase().includes('plan')
        );
        if (businessPlanDoc) {
          sectionDocumentId = businessPlanDoc.id;
        }
      }
    } else if (sectionLower.includes('objective') || sectionLower.includes('goal') || sectionLower.includes('summary')) {
      // Executive summaries and objectives often go in business plan
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    }
    
    // If no specific document found and we have a business plan document, default to business plan
    // Otherwise, fall back to primary document
    if (sectionDocumentId === primaryDocumentId) {
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    }
    
    return {
      id: `sec_${sectionIndex}_${section.title.replace(/\s+/g, '_').toLowerCase()}`,
      documentId: sectionDocumentId, // Associate section with appropriate document
      title: section.title,
      type: section.required ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
      required: section.required,
      programCritical: true,
      aiPrompt: `Write detailed content for ${section.title} in the context of ${profile.name}`,
      checklist: [`Address ${section.title} requirements`, `Include relevant details`, `Follow program guidelines`],
      rawSubsections: rawSubsections
    };
  });
  
  // After initial assignment, redistribute sections more evenly if some documents are empty
  const documentIds = documents.map(doc => doc.id);
  if (documentIds.length > 1 && sections.length > 0) {
    // Group sections by document
    const sectionsByDocument: Record<string, any[]> = {};
    documentIds.forEach(id => sectionsByDocument[id] = []);
    
    sections.forEach(section => {
      if (sectionsByDocument[section.documentId]) {
        sectionsByDocument[section.documentId].push(section);
      } else {
        // If section doesn't match any known document, assign to first document
        sectionsByDocument[documentIds[0]].push(section);
      }
    });
    
    // Identify documents with no sections
    const emptyDocuments = documentIds.filter(id => sectionsByDocument[id].length === 0);
    
    // If there are documents without sections, redistribute sections more evenly
    if (emptyDocuments.length > 0 && sections.length >= documentIds.length) {
      // Create a new sections array with more even distribution
      const redistributedSections: any[] = [];
      
      // Create copies of sections to avoid mutation issues
      const allSections = sections.map(s => ({ ...s }));
      
      // Distribute sections more evenly among documents
      allSections.forEach((section, index) => {
        const targetDocumentId = documentIds[index % documentIds.length];
        const updatedSection = { ...section, documentId: targetDocumentId };
        redistributedSections.push(updatedSection);
      });
      
      sections = redistributedSections;
    }
  }  const requirements = [
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
    })),
    // Program-level requirements
    ...(profile.requirements || []).map((req, index) => ({
      id: `req_program_${index}`,
      scope: 'section' as const,
      category: 'market' as const, // Using 'market' as a general category for program requirements
      severity: 'major' as const,
      rule: `Must address ${req} requirement`,
      target: req,
      evidenceType: 'content'
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
    
    // Generate document structure from application requirements when available
    let structure: DocumentStructure | null = null;
    try {
      if (fundingProgram.applicationRequirements.documents.length > 0 ||
          fundingProgram.applicationRequirements.sections.length > 0) {
        structure = generateDocumentStructureFromProfile(fundingProgram);
      }
    } catch (e) {
      console.warn('Failed to generate document structure from legacy program:', e);
    }
    
    return {
      fundingProgram,
      structure,
      status: structure ? 'draft' : 'none',
      diagnostics: {
        warnings: structure
          ? ['Legacy program migrated from application requirements']
          : ['Legacy program migrated - limited information available'],
        missingFields: structure ? [] : ['Detailed requirements', 'Specific deadlines'],
        confidence: structure ? 80 : 60
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
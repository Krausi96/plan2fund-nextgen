/**
 * DOCUMENT SETUP UTILITIES
 * 
 * Contains utility functions for Step 2: Document Setup functionality.
 * Handles program connection, document structure generation, and setup workflows.
 */

import type { ProgramSummary } from '../types/types';
import type { FundingProgram, DocumentStructure, SetupDiagnostics } from '../types/Program-Types';

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
 * Normalize raw program data to ProgramProfile format
 * Compatibility wrapper for normalizeFundingProgram
 */
export function normalizeToProgramProfile(rawProgramData: any) {
  return normalizeFundingProgram(rawProgramData);
}

/**
 * Generate DocumentBlueprint from ProgramProfile
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

export function generateBlueprintFromProfile(profile: FundingProgram): any {
  // Placeholder implementation - would generate full DocumentBlueprint
  return {
    id: `blueprint_${profile.id}`,
    version: '1.0',
    source: 'program' as const,
    documents: [],
    sections: [],
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'setup_utils'
  };
}

/**
 * Parse program information from URL
 * Extracts funding program details from official program websites
 */
export async function parseProgramFromUrl(url: string): Promise<any> {
  try {
    // Extract domain and path information
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    // Domain-based parsing logic
    const domainLower = domain.toLowerCase();
    
    // AWS parsing
    if (domainLower.includes('aws.') || domainLower.includes('amazon')) {
      return parseAwsProgram(url, path);
    }
    
    // Austrian programs
    if (domainLower.includes('.at') || domainLower.includes('aws.at')) {
      return parseAustrianProgram(url, domain, path);
    }
    
    // EU programs
    if (domainLower.includes('europa.eu') || domainLower.includes('ec.europa')) {
      return parseEuProgram(url, path);
    }
    
    // Generic parser as fallback
    return parseGenericProgram(url, domain, path);
    
  } catch (error) {
    console.error('❌ URL parsing failed:', error);
    return null;
  }
}

function parseAwsProgram(url: string, path: string): any {
  const pathLower = path.toLowerCase();
  
  // Determine program type from URL path
  let programName = 'AWS Funding Program';
  let programType = 'grant';
  
  if (pathLower.includes('innovation') || pathLower.includes('seed')) {
    programName = 'AWS Innovation Grant';
    programType = 'grant';
  } else if (pathLower.includes('activate') || pathLower.includes('startup')) {
    programName = 'AWS Activate for Startups';
    programType = 'grant';
  } else if (pathLower.includes('credit') || pathLower.includes('loan')) {
    programName = 'AWS Credit Program';
    programType = 'loan';
  }
  
  return {
    id: `aws-${Date.now()}`,
    name: programName,
    type: programType,
    organization: 'Amazon Web Services',
    description: `Program information extracted from ${url}`,
    source_url: url,
    // Standard application requirements structure
    application_requirements: {
      documents: [
        {
          document_name: 'Business Plan',
          required: true,
          format: 'pdf',
          authority: 'AWS',
          reuseable: false
        },
        {
          document_name: 'Financial Projections',
          required: true,
          format: 'excel',
          authority: 'AWS',
          reuseable: true
        },
        {
          document_name: 'Technical Documentation',
          required: true,
          format: 'pdf',
          authority: 'External Expert',
          reuseable: false
        }
      ],
      sections: [
        {
          title: 'Executive Summary',
          required: true,
          subsections: [
            { title: 'Project Overview', required: true },
            { title: 'Innovation Aspects', required: true }
          ]
        },
        {
          title: 'Technical Description',
          required: true,
          subsections: [
            { title: 'Technology Used', required: true },
            { title: 'Development Plan', required: true }
          ]
        }
      ],
      financial_requirements: {
        financial_statements_required: ['Profit & Loss', 'Cashflow'],
        years_required: [1, 3],
        co_financing_proof_required: true,
        own_funds_proof_required: true
      }
    }
  };
}

function parseAustrianProgram(url: string, domain: string, _path: string): any {
  return {
    id: `at-${Date.now()}`,
    name: 'Austrian Funding Program',
    type: 'grant',
    organization: domain,
    description: `Austrian program information extracted from ${url}`,
    source_url: url,
    application_requirements: {
      documents: [
        {
          document_name: 'Projektbeschreibung',
          required: true,
          format: 'pdf',
          authority: 'Fördergeber',
          reuseable: false
        },
        {
          document_name: 'Finanzplan',
          required: true,
          format: 'excel',
          authority: 'Fördergeber',
          reuseable: true
        }
      ],
      sections: [
        {
          title: 'Projektübersicht',
          required: true,
          subsections: [
            { title: 'Ziele und Innovation', required: true }
          ]
        }
      ],
      financial_requirements: {
        financial_statements_required: ['GuV', 'Liquiditätsplan'],
        years_required: [1, 2],
        co_financing_proof_required: true,
        own_funds_proof_required: false
      }
    }
  };
}

function parseEuProgram(url: string, _path: string): any {
  return {
    id: `eu-${Date.now()}`,
    name: 'EU Funding Program',
    type: 'grant',
    organization: 'European Commission',
    description: `EU program information extracted from ${url}`,
    source_url: url,
    application_requirements: {
      documents: [
        {
          document_name: 'Project Proposal',
          required: true,
          format: 'pdf',
          authority: 'EC',
          reuseable: false
        },
        {
          document_name: 'Budget Breakdown',
          required: true,
          format: 'excel',
          authority: 'EC',
          reuseable: false
        }
      ],
      sections: [
        {
          title: 'Executive Summary',
          required: true,
          subsections: [
            { title: 'Project Impact', required: true }
          ]
        }
      ],
      financial_requirements: {
        financial_statements_required: ['Financial Statement', 'Work Plan'],
        years_required: [2, 3],
        co_financing_proof_required: true,
        own_funds_proof_required: true
      }
    }
  };
}

function parseGenericProgram(url: string, domain: string, _path: string): any {
  return {
    id: `generic-${Date.now()}`,
    name: `${domain} Program`,
    type: 'grant',
    organization: domain,
    description: `Program information extracted from ${url}`,
    source_url: url,
    application_requirements: {
      documents: [
        {
          document_name: 'Application Form',
          required: true,
          format: 'pdf',
          authority: 'Program Provider',
          reuseable: false
        }
      ],
      sections: [
        {
          title: 'Program Application',
          required: true,
          subsections: [
            { title: 'Project Details', required: true }
          ]
        }
      ],
      financial_requirements: {
        financial_statements_required: ['Financial Plan'],
        years_required: [1],
        co_financing_proof_required: false,
        own_funds_proof_required: false
      }
    }
  };
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
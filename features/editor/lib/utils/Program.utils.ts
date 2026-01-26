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
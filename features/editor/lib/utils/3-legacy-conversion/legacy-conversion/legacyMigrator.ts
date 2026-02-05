import type { ProgramSummary, FundingProgram, DocumentStructure, SetupDiagnostics } from '../../../types/types';

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
      requirements: programSummary.requiredSections ||
        [
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
        documents: [],
        sections: [],
        financialRequirements: {
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
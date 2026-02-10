/**
 * PROGRAM NORMALIZATION UTILITIES
 * 
 * Contains functions for normalizing raw program data into standardized FundingProgram format.
 */

import type { ProgramSummary, FundingProgram } from '@/platform/core/types';

/**
 * Normalize raw program data into FundingProgram format
 * Processes funding program information for document setup
 */
export function normalizeFundingProgram(rawProgramData: any): any {
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
    type: rawProgramData.type || 'grant',
    organization: rawProgramData.organization || rawProgramData.provider || 'Unknown Provider',
    region: rawProgramData.region || rawProgramData.location || 'Global',
    
    fundingTypes: fundingTypes as ('grant' | 'loan' | 'equity' | 'subsidy')[],
    amountRange: amountRange && amountRange.min !== undefined && amountRange.max !== undefined 
      ? amountRange 
      : { min: 0, max: 1000000 }, // Provide default
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
      financialRequirements: rawProgramData.application_requirements?.financial_requirements || {} as any
    },
    rawData: rawProgramData
  };
}

/**
 * Normalize ProgramSummary for document setup
 * Adds setup tracking fields to existing ProgramSummary
 */
export function normalizeProgramSetup(programSummary: any): any {
  // Return the same object with blueprint fields initialized if needed
  return {
    ...programSummary,
    setupStatus: programSummary.setupStatus || 'none',
    setupVersion: programSummary.setupVersion || '1.0',
    setupSource: programSummary.setupSource || 'program',
  };
}

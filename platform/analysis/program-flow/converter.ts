import type { ProgramSummary } from '@/features/editor/lib/types/types';

/**
 * Create minimal ProgramSummary from program data (backward compatibility)
 * @deprecated Use normalizeFundingProgram() instead for new code
 */
export function generateProgramBlueprint(programData: any): any {
  // Simplified version for backward compatibility
  const mockSummary: ProgramSummary = {
    id: programData.id || `program_${Date.now()}`,
    name: programData.name || 'Unnamed Program',
    // @ts-ignore - ProgramSummary doesn't have 'type' in new schema
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

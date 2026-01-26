import type { ProgramSummary, DocumentBlueprint } from './types/types';

/**
 * BLUEPRINT EXTENSION FUNCTIONS
 * Extends existing functionality to support Document Blueprint system
 */

/**
 * Normalize ProgramSummary for blueprint generation
 * Adds blueprint tracking fields to existing ProgramSummary
 */
export function normalizeProgramSummary(programSummary: ProgramSummary): ProgramSummary {
  // Return the same object with blueprint fields initialized if needed
  return {
    ...programSummary,
    blueprint: programSummary.blueprint !== undefined ? programSummary.blueprint : undefined,
    blueprintStatus: programSummary.blueprintStatus || 'none',
    blueprintVersion: programSummary.blueprintVersion || '1.0',
    blueprintSource: programSummary.blueprintSource || 'program',
    blueprintDiagnostics: programSummary.blueprintDiagnostics !== undefined ? programSummary.blueprintDiagnostics : undefined
  };
}

/**
 * Generate complete DocumentBlueprint from ProgramSummary
 * Uses existing functions to create blueprint structure
 */
export function generateBlueprintFromProfile(programSummary: ProgramSummary): DocumentBlueprint {
  // Use existing functions but wrap them in blueprint structure
  const programData = {
    funding_types: programSummary.fundingTypes || [programSummary.type || 'grant'],
    program_focus: programSummary.programFocus || [],
    funding_amount_min: undefined, // Would come from actual program data
    funding_amount_max: undefined,
    deadline: programSummary.deadline,
    co_financing_required: programSummary.coFinancingRequired,
    co_financing_percentage: undefined
  };
  
  return {
    id: programSummary.id,
    version: '1.0',
    source: programSummary.source || 'program',
    documents: determineRequiredDocuments(programData).map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      purpose: `Required for ${programSummary.name}`,
      required: true
    })),
    sections: determineRequiredSections(programData).map(id => ({
      id,
      documentId: 'business-plan',
      title: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      type: 'required',
      required: true,
      programCritical: true
    })),
    requirements: generateRequirementSchemas(programData).map((schema, index) => ({
      id: `req-${index}`,
      scope: 'document',
      category: schema.type,
      severity: 'major',
      rule: `Comply with ${schema.type} requirements`,
      evidenceType: schema.type
    })),
    validationRules: generateValidationRules(programData),
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  };
}

/**
 * Main entry point: Create program blueprint from ProgramSummary
 * Uses existing logic with new blueprint wrapper
 */
export function createProgramBlueprint(programSummary: ProgramSummary): DocumentBlueprint {
  return generateBlueprintFromProfile(programSummary);
}

/**
 * Generate default blueprint for funding type
 * Reuses existing determination logic
 */
export function generateDefaultBlueprint(fundingType: string): DocumentBlueprint {
  const mockProgramData = { funding_types: [fundingType] };
  
  return {
    id: `default-${fundingType}`,
    version: '1.0',
    source: 'standard',
    documents: determineRequiredDocuments(mockProgramData).map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      purpose: 'Standard document',
      required: true
    })),
    sections: determineRequiredSections(mockProgramData).map(id => ({
      id,
      documentId: 'business-plan',
      title: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      type: 'required',
      required: true,
      programCritical: false
    })),
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [`Using default blueprint for ${fundingType} type`],
    confidenceScore: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system'
  };
}

/**
 * Sync template state from plan metadata.
 * 
 * Updates the store's template-related state (disabled sections/documents,
 * custom sections/documents) based on the current plan's metadata.
 * 
 * @param plan - Current business plan
 * @param setState - Zustand set function
 * @param getState - Zustand get function
 */
export function syncTemplateStateFromPlan(
  plan: any,
  setState: (partial: any) => void,
  getState: () => any
): void {
  if (!plan?.metadata) return;
  
  setState({
    disabledSectionIds: plan.metadata.disabledSectionIds || [],
    disabledDocumentIds: plan.metadata.disabledDocumentIds || [],
    customSections: plan.metadata.customSections || [],
    customDocuments: plan.metadata.customDocuments || [],
    selectedProduct: plan.productType || getState().selectedProduct,
  });
}

/**
 * ============================================================================
 * EDITOR UTILITIES
 * ====================================================================================
 * 
 * General-purpose utility functions used throughout the editor.
 * 
 * USED BY:
 *   - Sidebar.tsx - shouldIgnoreClick()
 *   - DocumentsBar.tsx - shouldIgnoreClick()
 *   - ProgramSelection.tsx - normalizeProgramInput()
 * ============================================================================
 */

/**
 * Check if a click event should be ignored to prevent card selection.
 * 
 * Prevents card click handlers from firing when user clicks on interactive elements
 * like buttons, checkboxes, or inputs. This allows users to interact with controls
 * inside cards without accidentally selecting the card.
 * 
 * @param element - The HTML element that was clicked
 * @returns true if the click should be ignored, false otherwise
 */
export function shouldIgnoreClick(element: HTMLElement): boolean {
  // Check if clicked element is an interactive tag
  const tagName = element.tagName.toLowerCase();
  const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
  if (interactiveTags.includes(tagName)) return true;
  
  // Check if element has data-badge attribute (origin badge)
  if (element.hasAttribute('data-badge') || element.closest('[data-badge="true"]')) {
    return true;
  }
  
  // Check if element is inside an interactive element
  const interactiveParent = element.closest('button, input, select, textarea, a, [data-badge="true"]');
  if (interactiveParent) return true;
  
  return false;
}

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
 * Transform program data into blueprint format
 * Maps program requirements to document structure and validation rules
 */
/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use createProgramBlueprint() instead
 */
export function generateProgramBlueprint(programData: any): ProgramSummary {
  // Use new pipeline but return compatible format
  const mockSummary: ProgramSummary = {
    id: programData.id || `program_${Date.now()}`,
    name: programData.name || 'Unnamed Program',
    type: programData.type || programData.funding_types?.[0] || 'grant',
    amountRange: programData.amountRange || 
      (programData.funding_amount_min && programData.funding_amount_max 
        ? `€${programData.funding_amount_min.toLocaleString()} - €${programData.funding_amount_max.toLocaleString()}`
        : programData.amountRange),
    deadline: programData.deadline || null,
    
    // Blueprint fields
    source: 'program',
    requiredDocuments: determineRequiredDocuments(programData),
    requiredSections: determineRequiredSections(programData),
    requirementSchemas: generateRequirementSchemas(programData),
    validationRules: generateValidationRules(programData),
    formattingRules: generateFormattingRules(programData),
    complianceStrictness: determineComplianceStrictness(programData),
    programFocus: programData.program_focus || [],
    fundingTypes: programData.funding_types || [],
    useOfFunds: programData.use_of_funds || [],
    coFinancingRequired: programData.co_financing_required ?? false,
    region: programData.region || programData.location || null,
    organization: programData.organization || programData.metadata?.organization || null,
    typicalTimeline: programData.typical_timeline || programData.metadata?.typical_timeline || null,
    competitiveness: programData.competitiveness || programData.metadata?.competitiveness || null,
    categorizedRequirements: programData.categorized_requirements || {}
  };
  
  return mockSummary;
}

function determineRequiredDocuments(programData: any): string[] {
  const documents: string[] = ['business-plan'];
  
  // Add financial documents for loan/investment programs
  if (programData.funding_types?.includes('loan') || programData.funding_types?.includes('equity')) {
    documents.push('financial-projections', 'cash-flow-statement');
  }
  
  // Add research documents for innovation programs
  if (programData.program_focus?.includes('research') || programData.program_focus?.includes('innovation')) {
    documents.push('research-plan', 'ip-description');
  }
  
  return documents;
}

function determineRequiredSections(programData: any): string[] {
  const sections: string[] = [
    'executive-summary',
    'company-description',
    'market-analysis',
    'financial-plan'
  ];
  
  // Add team section for investor-focused programs
  if (programData.funding_types?.includes('equity') || programData.funding_types?.includes('venture_capital')) {
    sections.push('management-team');
  }
  
  // Add technical section for innovation programs
  if (programData.program_focus?.includes('technology') || programData.program_focus?.includes('innovation')) {
    sections.push('technical-description');
  }
  
  // Add impact section for sustainability/social programs
  if (programData.program_focus?.includes('sustainability') || programData.program_focus?.includes('social')) {
    sections.push('impact-assessment');
  }
  
  return sections;
}

function generateRequirementSchemas(programData: any): any[] {
  const schemas: any[] = [];
  
  // Financial requirements schema
  if (programData.funding_amount_min || programData.funding_amount_max) {
    schemas.push({
      type: 'financial',
      minAmount: programData.funding_amount_min,
      maxAmount: programData.funding_amount_max,
      currency: programData.currency || 'EUR',
      required: true
    });
  }
  
  // Timeline requirements schema
  if (programData.deadline) {
    schemas.push({
      type: 'timeline',
      deadline: programData.deadline,
      openDeadline: programData.open_deadline ?? false,
      required: true
    });
  }
  
  // Co-financing requirements schema
  if (programData.co_financing_required !== undefined) {
    schemas.push({
      type: 'cofinancing',
      required: programData.co_financing_required,
      percentage: programData.co_financing_percentage || null
    });
  }
  
  return schemas;
}

function generateValidationRules(programData: any): any[] {
  const rules: any[] = [];
  
  // Company stage validation
  if (programData.company_stage) {
    rules.push({
      field: 'companyStage',
      allowedValues: [programData.company_stage],
      errorMessage: `Must be ${programData.company_stage} stage company`
    });
  }
  
  // Industry focus validation
  if (programData.program_focus && programData.program_focus.length > 0) {
    rules.push({
      field: 'industryFocus',
      allowedValues: programData.program_focus,
      errorMessage: `Should align with ${programData.program_focus.join(', ')} focus`
    });
  }
  
  // Financial validation
  if (programData.funding_amount_min) {
    rules.push({
      field: 'fundingNeeded',
      minValue: programData.funding_amount_min * 0.5, // Allow 50% variance
      maxValue: programData.funding_amount_max * 2,   // Allow 100% variance
      errorMessage: `Funding request should be between ${programData.funding_amount_min * 0.5} and ${programData.funding_amount_max * 2}`
    });
  }
  
  return rules;
}

function generateFormattingRules(programData: any): any[] {
  return [
    {
      type: 'document',
      format: 'pdf',
      maxLength: 50, // pages
      requiredSections: determineRequiredSections(programData)
    },
    {
      type: 'financial',
      currency: programData.currency || 'EUR',
      decimalPlaces: 2
    }
  ];
}

function determineComplianceStrictness(programData: any): 'low' | 'medium' | 'high' {
  // High strictness for government/grant programs
  if (programData.type === 'grant' || programData.organization?.toLowerCase().includes('government')) {
    return 'high';
  }
  
  // Medium for institutional programs
  if (programData.type === 'loan' || programData.type === 'equity') {
    return 'medium';
  }
  
  // Low for general programs
  return 'low';
}


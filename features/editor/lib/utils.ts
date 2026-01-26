import type { ProgramSummary } from './types/types';

/**
 * ============================================================================  
 * EDITOR UTILITIES
 * ============================================================================  
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
 * Legacy function - kept for backward compatibility
 * @deprecated Use createProgramBlueprint() instead
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
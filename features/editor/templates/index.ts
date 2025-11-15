// ========= PLAN2FUND — EDITOR TEMPLATE REGISTRY =========
// Editor-specific templates for sections and template knowledge
// Documents remain in shared/templates

import { SectionTemplate } from './types';
import { MASTER_SECTIONS } from './sections';

// ============================================================================
// SECTION TEMPLATE REGISTRY
// ============================================================================

/**
 * Get sections for a funding type and product type
 * SIMPLEST APPROACH: Always use master templates (verified, foolproof)
 * 
 * @param fundingType - The funding type (grants, bankLoans, equity, visa)
 * @param productType - The product type (strategy, review, submission)
 * @param programId - DEPRECATED: Not used (always returns master)
 * @param baseUrl - DEPRECATED: Not used
 * 
 * Master templates are based on official sources (Horizon Europe, FFG, WKO, Sequoia)
 * and are verified to work for all programs.
 */
export async function getSections(
  fundingType: string,
  productType: string = 'submission',
  _programId?: string,
  _baseUrl?: string
): Promise<SectionTemplate[]> {
  // SIMPLEST: Always return master template
  // No program-specific overrides, no merging, no complexity
  return MASTER_SECTIONS[fundingType]?.[productType] || 
         MASTER_SECTIONS.grants.submission;
}

/**
 * Get specific section by ID
 */
export async function getSection(
  fundingType: string,
  sectionId: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate | undefined> {
  const sections = await getSections(fundingType, productType, programId, baseUrl);
  return sections.find((s: SectionTemplate) => s.id === sectionId);
}

// Export master templates for direct access
export { MASTER_SECTIONS };
export * from './types';
export { getTemplateKnowledge } from './templateKnowledge';
export type { TemplateKnowledge } from './templateKnowledge';


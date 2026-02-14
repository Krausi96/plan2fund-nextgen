/**
 * BLUEPRINT INSTANTIATION UTILITIES
 * 
 * Contains functions for instantiating PlanDocuments from DocumentStructures.
 */

import type { PlanSection, PlanDocument, ProductType } from '@/platform/core/types';
import type { DocumentStructure } from '@/platform/core/types';


/**
 * Infer ProductType from DocumentStructure or Blueprint characteristics
 * 
 * Maps blueprint source and structure type to appropriate ProductType.
 * Used in Step 3 (BlueprintInstantiation) to determine product type before creating plan.
 * 
 * Logic:
 * - Programs → 'submission' (grant applications)
 * - Strategy structures → 'strategy'
 * - Review/revision → 'review'
 * - Default → 'submission' (business plans, templates)
 * 
 * @param structure - Either DocumentStructure or Blueprint
 * @returns ProductType ('submission' | 'strategy' | 'review')
 */
export function inferProductTypeFromBlueprint(structure: any): ProductType {
  // Handle new Blueprint interface
  if ('programId' in structure) {
    // const blueprint = structure as Blueprint; // Blueprint type removed
    if (structure.programName?.toLowerCase().includes('strategy')) {
      return 'strategy';
    }
    

    
    // Default to submission for business plans and templates
    return 'submission';
  }
  
  // Handle old DocumentStructure interface
  const documentStructure = structure as DocumentStructure;
  
  // Check source first - programs are typically for submissions
  if (documentStructure.metadata?.source === 'program') {
    return 'submission';
  }
  
  // Check structure ID for type hints
  const structureId = documentStructure.metadata?.createdAt || ''; // Use createdAt as fallback since structureId doesn't exist in new interface
  
  if (structureId.includes('strategy')) {
    return 'strategy';
  }
  

  
  // Default to submission for business plans and templates
  return 'submission';
}

/**
 * Instantiate PlanDocument from DocumentStructure or Blueprint
 * 
 * Converts blueprint (Step 2 output) into editable PlanDocument (Step 3 output).
 * Handles both old DocumentStructure and new Blueprint formats.
 * Overrides template sections with blueprint-defined sections.
 * Preserves blueprint metadata for AI guidance and validation.
 * 
 * Responsibilities:
 * - Convert DocumentStructure/Blueprint sections → PlanSection[]
 * - Preserve blueprint requirements, validation rules, AI guidance
 * - Store blueprint reference in plan metadata
 * - Set required/optional/programCritical flags
 * - Merge with existing title page data from Step 1
 * 
 * @param structure - Either DocumentStructure or Blueprint from Step 2
 * @param productType - Inferred or selected ProductType
 * @param existingTitlePage - Optional title page data from Step 1
 * @returns Complete PlanDocument ready for editor
 */
export function instantiatePlanFromStructure(
  structure: any,
  productType: ProductType,
  existingTitlePage?: any
): PlanDocument {
  // Handle DocumentStructure interface (single path)
  // Handle old DocumentStructure interface
  const documentStructure = structure as DocumentStructure;
    
  // Convert blueprint sections to plan sections
  // OPTION A: Each section now owns its requirements directly
  const planSections: PlanSection[] = documentStructure.sections.map((section: any) => {
    console.log('[instantiation] SECTION:', section.title, 'reqs:', section.requirements?.length || 0);
    return {
      key: section.id,
      id: section.id,
      title: section.title,
      content: '',
      requirements: section.requirements || [],
      fields: {
        displayTitle: section.title,
        sectionNumber: null,
        blueprintRequired: section.required,
      },
      status: 'draft',
    };
  });

  // Create plan with blueprint sections
  const plan: PlanDocument = {
    language: 'en',
    productType: productType,
    settings: {
      includeTitlePage: true,
      includePageNumbers: true,
      titlePage: existingTitlePage || {
        title: '',
        companyName: '',
        date: new Date().toISOString().split('T')[0],
      },
    },
    sections: planSections,
    metadata: {
      disabledSectionIds: [],
      disabledDocumentIds: [],
      customSections: [],
      customDocuments: [],
      // Store document structure reference
      structureSource: documentStructure.metadata?.source || 'program'
    },
    references: [],
    appendices: [],
  };

  return plan;
}

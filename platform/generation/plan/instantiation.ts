/**
 * BLUEPRINT INSTANTIATION UTILITIES
 * 
 * Contains functions for instantiating PlanDocuments from DocumentStructures.
 */

import type { PlanSection, PlanDocument, ProductType, Blueprint } from '@/platform/core/types';
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
    const blueprint = structure as Blueprint;
    if (blueprint.programName?.toLowerCase().includes('strategy')) {
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
  const structureId = documentStructure.metadata?.generatedAt || ''; // Use generatedAt as fallback since structureId doesn't exist in new interface
  
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
export function instantiateFromBlueprint(
  structure: any,
  productType: ProductType,
  existingTitlePage?: any
): PlanDocument {
  // Check if it's the new Blueprint interface
  if ('programId' in structure) {
    // @ts-ignore - Blueprint schema has evolved, properties may not exist
    const blueprint = structure as Blueprint;
    
    // Convert blueprint sections to plan sections
    const planSections: PlanSection[] = (blueprint.structure?.sections ?? []).map((section: any) => ({
      key: section.id,
      id: section.id,
      title: section.title,
      content: '',
      fields: {
        displayTitle: section.title,
        sectionNumber: null,
        // Store blueprint metadata for AI and validation
        blueprintRequired: section.required,
        blueprintProgramCritical: section.critical,
        blueprintAiPrompt: (blueprint.guidance as any)?.generationPrompts?.[section.id],
        blueprintChecklist: blueprint.requirements?.bySection?.[section.id]?.map((req: any) => req.description) || [],
        blueprintRequirements: blueprint.requirements?.bySection?.[section.id] || [],
      },
      status: 'draft',
    }));

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
        // Store blueprint reference
        blueprintId: blueprint.programId,
        blueprintVersion: '1.0',
        blueprintSource: 'program',
        // Store blueprint artifacts for AI and validation
        blueprintRequirements: blueprint.requirements,
        blueprintValidationRules: blueprint.validation,
        blueprintAiGuidance: blueprint.guidance,
        blueprintRenderingRules: {},
      },
      references: [],
      appendices: [],
    };

    return plan;
  } else {
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
        fields: {
          displayTitle: section.title,
          sectionNumber: null,
          blueprintRequired: section.required,
          blueprintProgramCritical: section.programCritical,
          blueprintAiPrompt: section.aiPrompt,
          blueprintChecklist: section.checklist,
          blueprintRequirements: section.requirements || [],
          subchapters: section.rawSubsections?.map((subsection: any, index: number) => ({
            id: subsection.id,
            title: subsection.title,
            numberLabel: `${index + 1}`,
          })) || [],
        },
        status: 'draft',
      };
    });;

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
        // Store blueprint reference
        blueprintId: documentStructure.metadata?.generatedAt || '',
        blueprintVersion: documentStructure.metadata?.version || '',
        blueprintSource: documentStructure.metadata?.source || 'program',
        // Store blueprint artifacts for AI and validation
        // Note: blueprint requirements are now at section level, not here
        blueprintValidationRules: documentStructure.validationRules,
        blueprintAiGuidance: documentStructure.aiGuidance,
        blueprintRenderingRules: documentStructure.renderingRules,
      },
      references: [],
      appendices: [],
    };

    return plan;
  }
}

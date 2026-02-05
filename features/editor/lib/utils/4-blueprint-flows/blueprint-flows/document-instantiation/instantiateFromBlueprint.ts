/**
 * BLUEPRINT INSTANTIATION UTILITIES
 * 
 * Contains functions for instantiating PlanDocuments from DocumentStructures.
 */

import type { ProductType, PlanSection, PlanDocument } from '../../../../types/types';
import type { DocumentStructure } from '../../../../types/program/program-types';

/**
 * Infer ProductType from DocumentStructure characteristics
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
 * @param structure - DocumentStructure blueprint
 * @returns ProductType ('submission' | 'strategy' | 'review')
 */
export function inferProductTypeFromBlueprint(structure: DocumentStructure): ProductType {
  // Check source first - programs are typically for submissions
  if (structure.source === 'program') {
    return 'submission';
  }
  
  // Check structure ID for type hints
  const structureId = structure.structureId?.toLowerCase() || '';
  
  if (structureId.includes('strategy')) {
    return 'strategy';
  }
  
  if (structureId.includes('upgrade')) {
    return 'upgrade';
  }
  
  // Default to submission for business plans and templates
  return 'submission';
}

/**
 * Instantiate PlanDocument from DocumentStructure blueprint
 * 
 * Converts blueprint (Step 2 output) into editable PlanDocument (Step 3 output).
 * Overrides template sections with blueprint-defined sections.
 * Preserves blueprint metadata for AI guidance and validation.
 * 
 * Responsibilities:
 * - Convert DocumentStructure sections → PlanSection[]
 * - Preserve blueprint requirements, validation rules, AI guidance
 * - Store blueprint reference in plan metadata
 * - Set required/optional/programCritical flags
 * - Merge with existing title page data from Step 1
 * 
 * @param blueprint - DocumentStructure from Step 2
 * @param productType - Inferred or selected ProductType
 * @param existingTitlePage - Optional title page data from Step 1
 * @returns Complete PlanDocument ready for editor
 */
export function instantiateFromBlueprint(
  blueprint: DocumentStructure,
  productType: ProductType,
  existingTitlePage?: any
): PlanDocument {
  // Convert blueprint sections to plan sections
  const planSections: PlanSection[] = blueprint.sections.map((section: any) => ({
    key: section.id,
    id: section.id,
    title: section.title,
    content: '',
    fields: {
      displayTitle: section.title,
      sectionNumber: null,
      // Store blueprint metadata for AI and validation
      blueprintRequired: section.required,
      blueprintProgramCritical: section.programCritical,
      blueprintAiPrompt: section.aiPrompt,
      blueprintChecklist: section.checklist,
      // Preserve subsections if they exist in the template
      subchapters: section.rawSubsections?.map((subsection: any, index: number) => ({
        id: subsection.id,
        title: subsection.title,
        numberLabel: `${index + 1}`,
      })) || [],
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
      blueprintId: blueprint.structureId,
      blueprintVersion: blueprint.version,
      blueprintSource: blueprint.source,
      // Store blueprint artifacts for AI and validation
      blueprintRequirements: blueprint.requirements,
      blueprintValidationRules: blueprint.validationRules,
      blueprintAiGuidance: blueprint.aiGuidance,
      blueprintRenderingRules: blueprint.renderingRules,
    },
    references: [],
    appendices: [],
  };

  return plan;
}
/**
 * ENHANCE DOCUMENT STRUCTURE WITH SPECIAL SECTIONS
 * 
 * Adds Title Page, TOC, References, and Appendices to any document structure
 * Ensures all components have access to complete section list
 * 
 * This file handles section creation - ensuring system sections exist in document structures.
 */

import type { DocumentStructure } from '../../types/Program-Types';
import type { TranslationFunction } from './types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../constants';

/**
 * Convert SectionTemplate to document structure section format
 */
function convertSectionTemplate(template: any): any {
  return {
    id: template.id,
    documentId: 'main_document',
    title: template.title || template.name || '',
    type: (template.required ? 'required' : 'optional') as 'required' | 'optional' | 'conditional',
    required: template.required !== false,
    programCritical: false,
    aiPrompt: template.aiPrompt || `Write detailed content for ${template.title || template.name}`,
    checklist: template.checklist || [`Address ${template.title || template.name} requirements`],
    // Preserve subsections if they exist in the template
    ...(template.rawSubsections && { rawSubsections: template.rawSubsections })
  };
}

/**
 * Enhance document structure with special sections
 * Adds Title Page, TOC, References, and Appendices to any document structure
 * Ensures all components have access to complete section list
 * 
 * @param documentStructure - Original document structure
 * @param t - Translation function
 * @returns Enhanced document structure with special sections
 */
export function enhanceWithSpecialSections(
  documentStructure: DocumentStructure | null,
  t: TranslationFunction
): DocumentStructure | null {
  if (!documentStructure) return null;
  
  // Convert template sections if needed
  const baseSections = Array.isArray(documentStructure.sections) 
    ? documentStructure.sections.map(section => 
        typeof section === 'object' && 'id' in section && 'title' in section
          ? section
          : convertSectionTemplate(section as unknown as any)
    )
    : [];

  // Check for each special section individually instead of all-or-nothing approach
  const existingSectionIds = new Set(baseSections.map(s => s.id));
  
  const specialSectionsToAdd = [];
  
  // Add Title Page if not present
  if (!existingSectionIds.has(METADATA_SECTION_ID)) {
    specialSectionsToAdd.push({
      id: METADATA_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.metadata' as any) || 'Title Page',
      type: 'required' as const,
      required: true,
      programCritical: false,
      icon: '📕'
    });
  }
  
  // Add TOC if not present
  if (!existingSectionIds.has(ANCILLARY_SECTION_ID)) {
    specialSectionsToAdd.push({
      id: ANCILLARY_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.ancillary' as any) || 'Table of Contents',
      type: 'required' as const,
      required: true,
      programCritical: false,
      icon: '📑'
    });
  }
  
  // Add References if not present
  if (!existingSectionIds.has(REFERENCES_SECTION_ID)) {
    specialSectionsToAdd.push({
      id: REFERENCES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.references' as any) || 'References',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📚'
    });
  }
  
  // Add Tables/Data if not present
  if (!existingSectionIds.has(TABLES_DATA_SECTION_ID)) {
    specialSectionsToAdd.push({
      id: TABLES_DATA_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.tablesData' as any) || 'Tables and Data',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📊'
    });
  }
  
  // Add Figures/Images if not present
  if (!existingSectionIds.has(FIGURES_IMAGES_SECTION_ID)) {
    specialSectionsToAdd.push({
      id: FIGURES_IMAGES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.figuresImages' as any) || 'Figures and Images',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '🖼️'
    });
  }
  
  // Add Appendices if not present
  if (!existingSectionIds.has(APPENDICES_SECTION_ID)) {
    specialSectionsToAdd.push({
      id: APPENDICES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.appendices' as any) || 'Appendices',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📎'
    });
  }
  
  const result = {
    ...documentStructure,
    sections: [
      ...specialSectionsToAdd.filter(s => [METADATA_SECTION_ID, ANCILLARY_SECTION_ID].includes(s.id)),
      ...baseSections,
      ...specialSectionsToAdd.filter(s => ![METADATA_SECTION_ID, ANCILLARY_SECTION_ID].includes(s.id))
    ]
  };

  return result;
}
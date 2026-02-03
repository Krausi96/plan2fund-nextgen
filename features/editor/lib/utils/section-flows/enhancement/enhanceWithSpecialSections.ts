/**
 * ENHANCE DOCUMENT STRUCTURE WITH SPECIAL SECTIONS
 * 
 * Creates hierarchical document structure:
 * - Single document: Maintains flat structure with special sections
 * - Multiple documents: Creates main document with Title Page, TOC, Core sections
 *   and converts additional documents to Appendices (A, B, etc.), with shared sections at end
 * 
 * This file handles section creation - ensuring system sections exist in document structures.
 */

import type { DocumentStructure } from '../../../types/program/program-types';
import type { TranslationFunction } from '../types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../../constants';

/**
 * Convert SectionTemplate to document structure section format
 */
function convertSectionTemplate(template: any): any {
  return {
    id: template.id,
    documentId: template.documentId || 'main_document',
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
 * Creates hierarchical structure when multiple documents exist
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

  // Check if we have multiple documents
  const hasMultipleDocuments = documentStructure.documents.length > 1;
  
  if (!hasMultipleDocuments) {
    // For single document, use the original logic
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
  } else {
    // For multiple documents, create hierarchical structure
    const mainDocumentId = documentStructure.documents[0]?.id || 'main_document';
    
    // Separate sections by document
    const sectionsByDocument: Record<string, any[]> = {};
    documentStructure.documents.forEach(doc => sectionsByDocument[doc.id] = []);
    
    baseSections.forEach(section => {
      if (sectionsByDocument[section.documentId]) {
        sectionsByDocument[section.documentId].push(section);
      } else {
        // If section doesn't belong to any defined document, assign to main document
        sectionsByDocument[mainDocumentId].push(section);
      }
    });
    
    // Create new sections array with hierarchical order:
    // 1. Main document sections (with special sections first)
    const mainDocumentSections = sectionsByDocument[mainDocumentId] || [];
    const mainDocumentSectionIds = new Set(mainDocumentSections.map(s => s.id));
    
    // Add special sections for main document
    const mainSpecialSectionsToAdd = [];
    
    if (!mainDocumentSectionIds.has(METADATA_SECTION_ID)) {
      mainSpecialSectionsToAdd.push({
        id: METADATA_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.metadata' as any) || 'Title Page',
        type: 'required' as const,
        required: true,
        programCritical: false,
        icon: '📕'
      });
    }
    
    if (!mainDocumentSectionIds.has(ANCILLARY_SECTION_ID)) {
      mainSpecialSectionsToAdd.push({
        id: ANCILLARY_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.ancillary' as any) || 'Table of Contents',
        type: 'required' as const,
        required: true,
        programCritical: false,
        icon: '📑'
      });
    }
    
    // Add other main document sections
    const mainSectionsOrdered = [
      ...mainSpecialSectionsToAdd,
      ...mainDocumentSections
    ];
    
    // 2. Additional documents as appendices
    const appendixSections: any[] = [];
    const additionalDocuments = documentStructure.documents.slice(1); // Skip first document
    
    additionalDocuments.forEach((doc, index) => {
      const docSections = sectionsByDocument[doc.id] || [];
      
      // Create an appendix section header for each additional document
      const appendixSection = {
        id: `appendix_${doc.id}`,
        documentId: doc.id,
        title: `Appendix ${String.fromCharCode(65 + index)}: ${doc.name}`,
        type: 'optional' as const,
        required: doc.required,
        programCritical: false,
        aiPrompt: `Provide content for ${doc.name} as an appendix to the main document`,
        checklist: [`Ensure ${doc.name} content is properly formatted as an appendix`, `Cross-reference this appendix in the main document if needed`]
      };
      
      appendixSections.push(appendixSection);
      
      // Add all sections from this document
      appendixSections.push(...docSections);
    });
    
    // 3. Shared sections at the end
    const allSectionIds = new Set([...mainDocumentSectionIds, ...appendixSections.map(s => s.id)]);
    const sharedSectionsToAdd = [];
    
    if (!allSectionIds.has(REFERENCES_SECTION_ID)) {
      sharedSectionsToAdd.push({
        id: REFERENCES_SECTION_ID,
        documentId: mainDocumentId, // Reference section belongs to main document
        title: t('editor.section.references' as any) || 'References',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '📚'
      });
    }
    
    if (!allSectionIds.has(TABLES_DATA_SECTION_ID)) {
      sharedSectionsToAdd.push({
        id: TABLES_DATA_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.tablesData' as any) || 'Tables and Data',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '📊'
      });
    }
    
    if (!allSectionIds.has(FIGURES_IMAGES_SECTION_ID)) {
      sharedSectionsToAdd.push({
        id: FIGURES_IMAGES_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.figuresImages' as any) || 'Figures and Images',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '🖼️'
      });
    }
    
    // Combine all sections in the proper order: Main → Appendices → Shared
    const allSections = [
      ...mainSectionsOrdered,
      ...appendixSections,
      ...sharedSectionsToAdd
    ];
    
    const result = {
      ...documentStructure,
      sections: allSections
    };

    return result;
  }
}
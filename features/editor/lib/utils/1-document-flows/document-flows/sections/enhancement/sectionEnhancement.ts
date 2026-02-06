/**
 * SECTION ENhANCEMENT
 * 
 * Contains functions for enhancing document structures with special sections
 */

import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID,
} from '../../../../../constants';

import { SpecialSectionType, getSpecialSectionConfig } from './sectionDetection';

/**
 * Create a special section object
 */
export function createSpecialSection(
  type: SpecialSectionType,
  documentId: string,
  t: (key: any) => string,
  customTitle?: string
): any {
  const config = getSpecialSectionConfig(type);
  
  return {
    id: config.id,
    documentId,
    title: customTitle || t(config.titleKey as any) || getDefaultTitle(type),
    type: config.type,
    required: config.type === 'required',
    programCritical: false,
    icon: config.icon
  };
}

/**
 * Get default title for special section type
 */
function getDefaultTitle(type: SpecialSectionType): string {
  const titles: Record<SpecialSectionType, string> = {
    metadata: 'Title Page',
    ancillary: 'Table of Contents',
    references: 'References',
    appendices: 'Appendices',
    tables_data: 'Tables and Data',
    figures_images: 'Figures and Images'
  };
  return titles[type];
}

/**
 * Enhance document structure with missing special sections
 */
export function enhanceWithSpecialSections(
  documentStructure: any,
  t: (key: any) => string,
  hasMultipleDocuments: boolean = false
): any {
  if (!documentStructure) return null;
  
  // Convert template sections if needed
  const baseSections = Array.isArray(documentStructure.sections)
    ? documentStructure.sections.map((section: any) =>
        typeof section === 'object' && 'id' in section && 'title' in section
          ? section
          : convertSectionTemplate(section as unknown as any)
      )
    : [];
  
  if (!hasMultipleDocuments) {
    // For single document, ensure all special sections exist
    const existingSectionIds = new Set(baseSections.map((s: any) => s.id));
    const specialSectionsToAdd = [];
    
    // Define all special section types to check
    const specialSectionTypes: SpecialSectionType[] = ['metadata', 'ancillary', 'references', 'tables_data', 'figures_images', 'appendices'];
    
    // Check each special section type
    specialSectionTypes.forEach(type => {
      const config = getSpecialSectionConfig(type);
      if (!existingSectionIds.has(config.id)) {
        specialSectionsToAdd.push(
          createSpecialSection(type, 'main_document', t)
        );
      }
    });
    
    // Don't add appendices section if we have existing appendices
    const hasExistingAppendices = baseSections.some((section: any) =>
      section.title.toLowerCase().includes('appendix') ||
      section.title.toLowerCase().includes('appendices') ||
      section.id.startsWith('appendix_')
    );
    
    if (!existingSectionIds.has(APPENDICES_SECTION_ID) && !hasExistingAppendices) {
      // Only add appendices if it's not already in the list
      if (!specialSectionsToAdd.some(s => s.id === APPENDICES_SECTION_ID)) {
        specialSectionsToAdd.push(
          createSpecialSection('appendices', 'main_document', t)
        );
      }
    }
    
    return {
      ...documentStructure,
      sections: [
        ...specialSectionsToAdd.filter(s => [METADATA_SECTION_ID, ANCILLARY_SECTION_ID].includes(s.id)),
        ...baseSections,
        ...specialSectionsToAdd.filter(s => ![METADATA_SECTION_ID, ANCILLARY_SECTION_ID].includes(s.id))
      ]
    };
  } else {
    // For multiple documents, create hierarchical structure
    const mainDocumentId = documentStructure.documents[0]?.id || 'main_document';
    
    // Separate sections by document
    const sectionsByDocument: Record<string, any[]> = {};
    documentStructure.documents.forEach((doc: any) => sectionsByDocument[doc.id] = []);
    
    baseSections.forEach((section: any) => {
      const targetDocId = section.documentId || mainDocumentId;
      if (sectionsByDocument[targetDocId]) {
        sectionsByDocument[targetDocId].push(section);
      } else {
        sectionsByDocument[mainDocumentId].push(section);
      }
    });
    
    // Process main document sections
    const mainDocumentSections = sectionsByDocument[mainDocumentId] || [];
    const mainDocumentSectionIds = new Set(mainDocumentSections.map((s: any) => s.id));
    
    // Add missing special sections to main document
    const mainSpecialSectionsToAdd: any[] = [];
    
    // Only add metadata and ancillary to main document
    ['metadata', 'ancillary'].forEach(type => {
      const typedType = type as SpecialSectionType;
      const config = getSpecialSectionConfig(typedType);
      if (!mainDocumentSectionIds.has(config.id)) {
        mainSpecialSectionsToAdd.push(
          createSpecialSection(typedType, mainDocumentId, t)
        );
      }
    });
    
    // Check for existing appendices
    const hasExistingAppendices = baseSections.some((section: any) =>
      section.title.toLowerCase().includes('appendix') ||
      section.title.toLowerCase().includes('appendices') ||
      section.id.startsWith('appendix_')
    );
    
    // Filter out the generic APPENDICES_SECTION_ID from main document sections when there are multiple documents
    const filteredMainDocumentSections = mainDocumentSections.filter((section: any) =>
      section.id !== APPENDICES_SECTION_ID
    );
    
    // Combine main sections
    const mainSectionsOrdered = [
      ...mainSpecialSectionsToAdd,
      ...filteredMainDocumentSections
    ];
    
    // Process additional documents as appendices
    const additionalDocuments = documentStructure.documents.slice(1);
    const appendixSections: any[] = [];
    
    if (hasExistingAppendices || additionalDocuments.length === 0) {
      // If we have existing appendices, process normally
      additionalDocuments.forEach((doc: any, index: number) => {
        const docSections = sectionsByDocument[doc.id] || [];
        const appendixLetter = String.fromCharCode(65 + index); // A, B, C...
        const expectedAppendixTitle = `Appendix ${appendixLetter}: ${doc.name}`;
        
        const filteredDocSections = docSections.filter((section: any) =>
          section.title !== expectedAppendixTitle &&
          section.id !== APPENDICES_SECTION_ID
        );
        
        appendixSections.push(...filteredDocSections);
      });
    } else {
      // Create appendix sections from additional documents
      additionalDocuments.forEach((doc: any) => {
        const docSections = sectionsByDocument[doc.id] || [];
        const filteredDocSections = docSections.filter((section: any) =>
          section.id !== APPENDICES_SECTION_ID
        );
        
        appendixSections.push(...filteredDocSections);
      });
    }
    
    // Add shared sections (references, tables, figures) at the end
    const allSectionIds = new Set([...Array.from(mainDocumentSectionIds), ...appendixSections.map((s: any) => s.id)]);
    const sharedSectionsToAdd: any[] = [];
    
    // Add shared special sections
    ['references', 'tables_data', 'figures_images'].forEach(type => {
      const typedType = type as SpecialSectionType;
      const config = getSpecialSectionConfig(typedType);
      if (!allSectionIds.has(config.id)) {
        sharedSectionsToAdd.push(
          createSpecialSection(typedType, mainDocumentId, t)
        );
      }
    });
    
    // Filter out appendices section if we have individual appendices
    const hasMultipleDocuments = documentStructure.documents.length > 1;
    const filteredSharedSectionsToAdd = hasMultipleDocuments
      ? sharedSectionsToAdd.filter((section: any) => section.id !== APPENDICES_SECTION_ID)
      : sharedSectionsToAdd;
    
    // Combine all sections
    const allSections = [
      ...mainSectionsOrdered,
      ...appendixSections,
      ...filteredSharedSectionsToAdd
    ];
    
    // Final cleanup: ensure no APPENDICES_SECTION_ID remains when there are multiple documents
    const finalSections = hasMultipleDocuments
      ? allSections.filter((section: any) => section.id !== APPENDICES_SECTION_ID)
      : allSections;
    
    return {
      ...documentStructure,
      sections: finalSections
    };
  }
}

// Helper function to convert section template
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
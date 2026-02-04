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
    
    // Debug: Check base sections for any with 'Appx' in the title
    const appxBaseSections = baseSections.filter(section => section.title.includes('Appx'));
    if (appxBaseSections.length > 0) {
      console.log('🔍 DEBUG: Base sections already contain Appx suffix (single document case):', appxBaseSections);
    }
    
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
    
    // Don't add Appendices section if we have multiple documents since they are handled as document-based appendices
    // Also check if there are already appendix-type sections in the structure
    const hasExistingAppendices = baseSections.some(section => 
      section.title.toLowerCase().includes('appendix') || 
      section.title.toLowerCase().includes('appendices') ||
      section.id.startsWith('appendix_')
    );
    
    // Only add the generic appendices section if we don't have multiple documents and no existing appendices
    if (!existingSectionIds.has(APPENDICES_SECTION_ID) && !hasMultipleDocuments && !hasExistingAppendices) {
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
    // Debug: Check base sections for any with 'Appx' in the title
    const appxBaseSectionsMulti = baseSections.filter(section => section.title.includes('Appx'));
    if (appxBaseSectionsMulti.length > 0) {
      console.log('🔍 DEBUG: Base sections already contain Appx suffix (multi document case):', appxBaseSectionsMulti);
    }
    
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
    
    
    // 2. Additional documents as appendices
    const appendixSections: any[] = [];
    const additionalDocuments = documentStructure.documents.slice(1); // Skip first document
    
    // Check if there are already existing appendix sections in the main document
    const existingAppendixSections = baseSections.filter(section => 
      section.title.toLowerCase().includes('appendix') || 
      section.title.toLowerCase().includes('appendices') ||
      section.id.startsWith('appendix_')
    );
    
    // Filter out the generic APPENDICES_SECTION_ID from main document sections when there are multiple documents
    // This prevents duplicate appendices display (individual appendices + generic appendices section)
    const filteredMainDocumentSections = mainDocumentSections.filter(section => 
      section.id !== APPENDICES_SECTION_ID
    );
    
    // Recreate mainSectionsOrdered with filtered content
    const mainSectionsOrdered = [
      ...mainSpecialSectionsToAdd,
      ...filteredMainDocumentSections
    ];
    
    // Only create appendix sections from additional documents if we don't have conflicting appendix sections
    const shouldCreateAppendixDocs = existingAppendixSections.length === 0;
        
    if (shouldCreateAppendixDocs) {
      additionalDocuments.forEach((doc) => {
        const docSections = sectionsByDocument[doc.id] || [];
                
        // Add all sections from this document - no need to create a separate appendix header section
        // The document structure itself will serve as the appendix grouping
        const filteredDocSections = docSections.filter(section => 
          section.id !== APPENDICES_SECTION_ID // Filter out generic appendices sections
        );
                
        appendixSections.push(...filteredDocSections);
      });
    } else {
      // If we have existing appendices, add the additional documents' sections directly
      // without creating new appendix wrapper sections
      additionalDocuments.forEach((doc, index) => {
        const docSections = sectionsByDocument[doc.id] || [];
            

            
        // Filter out any sections that would duplicate the appendix naming pattern
        const appendixLetter = String.fromCharCode(65 + index); // A, B, C...
        const expectedAppendixTitle = `Appendix ${appendixLetter}: ${doc.name}`;
                
        const filteredDocSections = docSections.filter(section => 
          section.title !== expectedAppendixTitle &&
          section.id !== APPENDICES_SECTION_ID  // Also filter out generic appendices sections
        );
                
        appendixSections.push(...filteredDocSections);
      });
    }
    
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
    
    // Don't add a generic appendices section if we already have document-based appendices
    // The appendices are handled as additional documents in the structure
    
    // Also filter out any existing APPENDICES_SECTION_ID from base sections when multiple documents exist
    // to prevent duplicate appendices rendering
    const hasMultipleDocuments = documentStructure.documents.length > 1;
    const filteredSharedSectionsToAdd = hasMultipleDocuments 
      ? sharedSectionsToAdd.filter(section => section.id !== APPENDICES_SECTION_ID)
      : sharedSectionsToAdd;
    
    // Combine all sections in the proper order: Main → Appendices → Shared
    // Filter out the generic APPENDICES_SECTION_ID if we have multiple documents (individual appendices)
    const allSections = [
      ...mainSectionsOrdered,
      ...appendixSections,
      ...filteredSharedSectionsToAdd
    ];
    
    // Final cleanup: Ensure no APPENDICES_SECTION_ID remains when there are multiple documents
    // This handles any edge cases where it might slip through
    let finalSections = documentStructure.documents.length > 1 
      ? allSections.filter(section => section.id !== APPENDICES_SECTION_ID)
      : allSections;
    

    

    
    const result = {
      ...documentStructure,
      sections: finalSections
    };

    return result;
  }
}
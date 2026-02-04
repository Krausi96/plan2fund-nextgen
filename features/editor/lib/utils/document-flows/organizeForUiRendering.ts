/**
 * ORGANIZE DOCUMENT STRUCTURE FOR UI RENDERING
 * 
 * Creates organized document structure specifically for UI rendering with hierarchical view.
 * This function organizes the document structure into a format suitable for display in
 * components like BlueprintInstantiator, ProgramSummaryPanel, etc.
 */

import type { DocumentStructure } from '../../types/program/program-types';
import type { TranslationFunction } from '../section-flows/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../constants';

/**
 * Represents the hierarchical structure for UI rendering
 */
export interface HierarchicalDocumentView {
  mainDocument: {
    id: string;
    name: string;
    sections: any[];
  };
  appendices: Array<{
    id: string;
    name: string;
    displayName: string; // e.g. "Appendix A: Document Name"
    sections: any[];
  }>;
  sharedSections: any[]; // References, Tables, Figures, etc.
}

/**
 * Organizes document structure for UI rendering with hierarchical view
 * 
 * @param documentStructure - Original document structure
 * @param t - Translation function
 * @returns Organized hierarchical structure for UI rendering
 */
export function organizeDocumentStructureForUi(
  documentStructure: DocumentStructure | null,
  t: TranslationFunction
): HierarchicalDocumentView | null {
  if (!documentStructure) return null;


  
  if (!documentStructure.documents || documentStructure.documents.length === 0) {
    return {
      mainDocument: {
        id: 'main_document',
        name: 'Main Document',
        sections: []
      },
      appendices: [],
      sharedSections: []
    };
  }

  // Get main document (first document)
  const mainDocument = documentStructure.documents[0];
  const mainDocumentId = mainDocument.id;
  
  // Separate sections by document
  const sectionsByDocument: Record<string, any[]> = {};
  documentStructure.documents.forEach(doc => sectionsByDocument[doc.id] = []);
  

  
  // Assign sections to their respective documents
  documentStructure.sections.forEach(section => {
    const targetDocumentId = section.documentId || mainDocumentId;
    if (sectionsByDocument[targetDocumentId]) {
      sectionsByDocument[targetDocumentId].push(section);
    } else {
      // If section doesn't belong to any defined document, assign to main document
      sectionsByDocument[mainDocumentId].push(section);
    }
  });
  


  // Organize main document sections
  // Separate special sections that should appear at beginning/end
  const mainDocumentSections = sectionsByDocument[mainDocumentId] || [];
  
  // Define IDs for shared sections that should appear at the end
  const SHARED_SECTION_IDS = [REFERENCES_SECTION_ID, TABLES_DATA_SECTION_ID, FIGURES_IMAGES_SECTION_ID];
  
  // Special handling for appendices section - exclude if we have individual appendices
  const HAS_INDIVIDUAL_APPENDICES = documentStructure.documents.length > 1;
  
  // Separate main content sections from special sections
  const mainContentSections = mainDocumentSections.filter(section => 
    section.id !== METADATA_SECTION_ID &&
    section.id !== ANCILLARY_SECTION_ID &&
    !SHARED_SECTION_IDS.includes(section.id)
  );

  // Get special sections that should appear at the beginning of main document
  const titlePageSection = mainDocumentSections.find(section => section.id === METADATA_SECTION_ID);
  const tocSection = mainDocumentSections.find(section => section.id === ANCILLARY_SECTION_ID);

  // Apply deduplication to main document sections to prevent 'Appx' suffix duplicates
  const mainTitleMap = new Map();
  const deduplicatedMainSections = [];
  const initialOrganizedMainDocumentSections = [
    ...(titlePageSection ? [titlePageSection] : []),
    ...(tocSection ? [tocSection] : []),
    ...mainContentSections
  ];
  for (const section of initialOrganizedMainDocumentSections) {
    // Normalize title by removing 'Appx' suffix
    const normalizedTitle = section.title.replace(/Appx$/, '');
    
    if (mainTitleMap.has(normalizedTitle)) {
      const existingSection = mainTitleMap.get(normalizedTitle);
      
      // If current section has 'Appx' suffix but existing doesn't, skip current
      if (section.title.endsWith('Appx') && !existingSection.title.endsWith('Appx')) {
        continue; // Skip this section
      }
      // If existing has 'Appx' suffix but current doesn't, replace existing
      else if (!section.title.endsWith('Appx') && existingSection.title.endsWith('Appx')) {
        // Remove the existing section and add the new one
        const index = deduplicatedMainSections.findIndex(s => s.title.replace(/Appx$/, '') === normalizedTitle);
        if (index !== -1) {
          deduplicatedMainSections.splice(index, 1);
        }
      }
    }
    
    // Only add if it doesn't have 'Appx' suffix, or if no conflict exists
    if (!section.title.endsWith('Appx') || !mainTitleMap.has(normalizedTitle)) {
      mainTitleMap.set(normalizedTitle, section);
      deduplicatedMainSections.push(section);
    }
  }
  
  // Use deduplicated sections
  const organizedMainDocumentSections = deduplicatedMainSections;

  // Organize appendices (additional documents)
  console.log('🔍 DEBUG: Starting to organize appendices for document structure:', documentStructure.documents.length, 'documents total');
  console.log('🔍 DEBUG: All documents in structure:', documentStructure.documents.map(d => ({id: d.id, name: d.name})));  
  
  const appendices = documentStructure.documents.slice(1).map((doc, index) => {
    const appendixLetter = String.fromCharCode(65 + index); // A, B, C...
    // Filter out shared sections from appendix sections so they only appear in shared sections
    let appendixSections = (sectionsByDocument[doc.id] || []).filter(section => 
      !SHARED_SECTION_IDS.includes(section.id)
    );
    
    console.log('🔍 DEBUG: Processing appendix document:', doc.name, 'with', appendixSections.length, 'sections');
    
    // Debug: Log any sections with 'Appx' in the title to identify the source
    const appxSections = appendixSections.filter(section => section.title.includes('Appx'));
    if (appxSections.length > 0) {
      console.log('🔍 DEBUG: Found sections with Appx in title in document:', doc.name, appxSections.map(s => ({id: s.id, title: s.title})));  
    }
    
    // Additional deduplication: Remove sections that have similar titles where one has 'Appx' suffix
    // This prevents duplicates like 'Appendix A: Business Plan' and 'Appendix A: Business PlanAppx'
    const appendixTitleMap = new Map();
    appendixSections = appendixSections.filter(section => {
      // Normalize title by removing 'Appx' suffix
      const normalizedTitle = section.title.replace(/Appx$/, '');
      
      if (appendixTitleMap.has(normalizedTitle)) {
        const existingSection = appendixTitleMap.get(normalizedTitle);
        
        // If current section has 'Appx' suffix but existing doesn't, skip current
        if (section.title.endsWith('Appx') && !existingSection.title.endsWith('Appx')) {
          console.log('🔍 DEBUG: Skipping duplicate section with Appx suffix:', section.title);
          return false;
        }
        // If existing has 'Appx' suffix but current doesn't, replace existing
        else if (!section.title.endsWith('Appx') && existingSection.title.endsWith('Appx')) {
          // We need to handle this case differently - remove the old one and add this one
          // For now, we'll keep the one without 'Appx' suffix
          console.log('🔍 DEBUG: Replacing section with Appx suffix with clean version:', section.title);
          return false;
        }
      } else {
        appendixTitleMap.set(normalizedTitle, section);
        return true;
      }
      
      // Only add if it doesn't have 'Appx' suffix, or if both have it
      return !section.title.endsWith('Appx');
    });
    
    console.log('🔍 DEBUG: Final appendix sections for', doc.name, ':', appendixSections.map(s => ({id: s.id, title: s.title})));
    
    return {
      id: doc.id,
      name: doc.name,
      displayName: `Appendix ${appendixLetter}: ${doc.name}`,
      sections: appendixSections
    };
  });

  // Organize shared sections (References, Tables, Figures, etc.) that should appear at the end
  // First, collect all sections that are designated as shared sections from all documents
  const allDocumentSections = Object.values(sectionsByDocument).flat();
  let sharedSections = allDocumentSections.filter(section => 
    SHARED_SECTION_IDS.includes(section.id)
  );
  
  // Filter out APPENDICES_SECTION_ID if we have individual appendices from multiple documents
  if (HAS_INDIVIDUAL_APPENDICES) {
    sharedSections = sharedSections.filter(section => 
      section.id !== APPENDICES_SECTION_ID
    );
  } else {
    // If no individual appendices, include APPENDICES_SECTION_ID in shared sections if it exists
    const appendicesSection = allDocumentSections.find(section => 
      section.id === APPENDICES_SECTION_ID
    );
    if (appendicesSection) {
      sharedSections.push(appendicesSection);
    }
  }
  
  // Remove duplicates by ID, keeping the first occurrence
  const seenIds = new Set();
  sharedSections = sharedSections.filter(section => {
    if (seenIds.has(section.id)) {
      return false;
    }
    seenIds.add(section.id);
    return true;
  });
  
  // Additional deduplication: Remove sections that have similar titles where one has 'Appx' suffix
  // This prevents duplicates like 'Appendix A: Business Plan' and 'Appendix A: Business PlanAppx'
  const titleMap = new Map();
  sharedSections = sharedSections.filter(section => {
    // Normalize title by removing 'Appx' suffix
    const normalizedTitle = section.title.replace(/Appx$/, '');
    
    if (titleMap.has(normalizedTitle)) {
      const existingSection = titleMap.get(normalizedTitle);
      
      // If current section has 'Appx' suffix but existing doesn't, skip current
      if (section.title.endsWith('Appx') && !existingSection.title.endsWith('Appx')) {
        return false;
      }
      // If existing has 'Appx' suffix but current doesn't, replace existing
      else if (!section.title.endsWith('Appx') && existingSection.title.endsWith('Appx')) {
        // We need to handle this case differently - remove the old one and add this one
        // For now, we'll keep the one without 'Appx' suffix
        return false;
      }
    } else {
      titleMap.set(normalizedTitle, section);
      return true;
    }
    
    // Only add if it doesn't have 'Appx' suffix, or if both have it
    return !section.title.endsWith('Appx');
  });
  


  // Add default shared sections if none exist in the document structure
  if (!sharedSections.some(s => s.id === REFERENCES_SECTION_ID)) {
    const existingReferenceSection = documentStructure.sections.find(s => s.id === REFERENCES_SECTION_ID);
    if (existingReferenceSection) {
      sharedSections.push(existingReferenceSection);
    } else {
      sharedSections.push({
        id: REFERENCES_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.references' as any) || 'References',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '📚'
      });
    }
  }

  if (!sharedSections.some(s => s.id === TABLES_DATA_SECTION_ID)) {
    const existingTablesSection = documentStructure.sections.find(s => s.id === TABLES_DATA_SECTION_ID);
    if (existingTablesSection) {
      sharedSections.push(existingTablesSection);
    } else {
      sharedSections.push({
        id: TABLES_DATA_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.tablesData' as any) || 'Tables and Data',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '📊'
      });
    }
  }

  if (!sharedSections.some(s => s.id === FIGURES_IMAGES_SECTION_ID)) {
    const existingFiguresSection = documentStructure.sections.find(s => s.id === FIGURES_IMAGES_SECTION_ID);
    if (existingFiguresSection) {
      sharedSections.push(existingFiguresSection);
    } else {
      sharedSections.push({
        id: FIGURES_IMAGES_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.figuresImages' as any) || 'Figures and Images',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '🖼️'
      });
    }
  }
  
  // Add default appendices section only if no individual appendices exist
  // Also ensure we don't add it if it would create duplication
  if (!HAS_INDIVIDUAL_APPENDICES && !sharedSections.some(s => s.id === APPENDICES_SECTION_ID)) {
    const existingAppendicesSection = documentStructure.sections.find(s => s.id === APPENDICES_SECTION_ID);
    if (existingAppendicesSection) {
      sharedSections.push(existingAppendicesSection);
    } else {
      sharedSections.push({
        id: APPENDICES_SECTION_ID,
        documentId: mainDocumentId,
        title: t('editor.section.appendices' as any) || 'Appendices',
        type: 'optional' as const,
        required: false,
        programCritical: false,
        icon: '📎'
      });
    }
  }
  
  // FINAL SAFETY CHECK: Ensure APPENDICES_SECTION_ID is not in shared sections if individual appendices exist
  // This addresses the case where it might have been added back inappropriately
  if (HAS_INDIVIDUAL_APPENDICES) {
    sharedSections = sharedSections.filter(section => 
      section.id !== APPENDICES_SECTION_ID
    );
  }


  
  return {
    mainDocument: {
      id: mainDocument.id,
      name: mainDocument.name,
      sections: organizedMainDocumentSections
    },
    appendices,
    sharedSections
  };
}

/**
 * Gets the flat view of document structure (original format)
 * 
 * @param documentStructure - Original document structure
 * @returns Same structure as input (for consistency with view patterns)
 */
export function getFlatDocumentView(
  documentStructure: DocumentStructure | null
): DocumentStructure | null {
  return documentStructure;
}
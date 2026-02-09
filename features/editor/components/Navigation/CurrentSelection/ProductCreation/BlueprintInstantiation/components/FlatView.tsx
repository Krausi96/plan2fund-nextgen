import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { getSectionIcon } from '@/features/editor/lib';
import { sortSectionsForMultiDocument } from '@/features/editor/lib/utils/1-document-flows/document-flows/organizeForUiRendering';
import { enhanceWithSpecialSections } from '@/features/editor/lib/utils/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';

interface FlatViewProps {
  documentStructure: any;
  expandedDocuments: Record<string, boolean>;
  expandedSubsections: Record<string, boolean>;
  expandedSubsectionDetails: Record<string, boolean>;
  toggleDocument: (documentId: string) => void;
  setExpandedSubsections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setExpandedSubsectionDetails: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function FlatView({
  documentStructure,
  expandedDocuments,
  expandedSubsections,
  expandedSubsectionDetails,
  toggleDocument,
  setExpandedSubsections,
  setExpandedSubsectionDetails
}: FlatViewProps) {
  const { t } = useI18n();
  
  // First, apply the centralized enhancement to get the base structure with special sections
  const baseEnhancedStructure = enhanceWithSpecialSections(documentStructure, t as any, documentStructure?.documents?.length > 1) || documentStructure;
  
  // For FlatView multidocument scenarios, we need to ensure each document has its own complete set of special sections
  const enhancedDocumentStructure = (() => {
    if (documentStructure?.documents?.length > 1) {
      // Create a new structure with special sections duplicated for each document
      const allSections = [...baseEnhancedStructure.sections];
      
      // Identify all special section IDs
      const specialSectionIds = [
        'metadata', 'ancillary', 'references', 'tables_data', 'figures_images', 'appendices'
      ];
      
      // For each document, ensure it has its own special sections
      documentStructure.documents.forEach((doc: any) => {
        const docSections = allSections.filter((section: any) => section.documentId === doc.id);
        const existingDocSectionIds = new Set(docSections.map((section: any) => section.id));
        
        // Add missing special sections for this document
        specialSectionIds.forEach(sectionId => {
          if (!existingDocSectionIds.has(sectionId)) {
            let sectionTitle = '';
            let sectionType: 'required' | 'optional' = 'optional';
            let sectionIcon = '🧾';
            
            if (sectionId === 'metadata') {
              sectionTitle = t('editor.section.metadata' as any) || 'Title Page';
              sectionType = 'required';
              sectionIcon = '📕';
            } else if (sectionId === 'ancillary') {
              sectionTitle = t('editor.section.ancillary' as any) || 'Table of Contents';
              sectionType = 'required';
              sectionIcon = '📑';
            } else if (sectionId === 'references') {
              sectionTitle = t('editor.section.references' as any) || 'References';
              sectionIcon = '📚';
            } else if (sectionId === 'tables_data') {
              sectionTitle = t('editor.section.tablesData' as any) || 'Tables and Data';
              sectionIcon = '📊';
            } else if (sectionId === 'figures_images') {
              sectionTitle = t('editor.section.figuresImages' as any) || 'Figures and Images';
              sectionIcon = '🖼️';
            } else if (sectionId === 'appendices') {
              sectionTitle = t('editor.section.appendices' as any) || 'Appendices';
              sectionIcon = '📎';
            }
            
            allSections.push({
              id: sectionId,
              documentId: doc.id,
              title: sectionTitle,
              type: sectionType,
              required: sectionType === 'required',
              programCritical: false,
              icon: sectionIcon,
              content: '',
              rawSubsections: []
            });
          }
        });
      });
      
      return {
        ...baseEnhancedStructure,
        sections: allSections
      };
    } else {
      // For single document, use the standard enhancement
      return baseEnhancedStructure;
    }
  })();
  
  // Create a proper document-specific section grouping for FlatView
  // Different logic for single vs multidocument scenarios
  
  const sectionsByDocument: Record<string, any[]> = {};
  
  // Initialize each document with an empty array
  enhancedDocumentStructure?.documents?.forEach((doc: any) => {
    sectionsByDocument[doc.id] = [];
  });
  
  if (enhancedDocumentStructure?.documents?.length > 1) {
    // Multidocument scenario: Use documentId to group sections
    enhancedDocumentStructure?.sections?.forEach((section: any) => {
      let targetDocumentId = section.documentId;
      
      // If no explicit documentId, default to the first document
      if (!targetDocumentId) {
        targetDocumentId = enhancedDocumentStructure?.documents?.[0]?.id;
      }
      
      // If target document doesn't exist in our structure, use first document
      if (!sectionsByDocument[targetDocumentId]) {
        targetDocumentId = enhancedDocumentStructure?.documents?.[0]?.id;
      }
      
      // Add section to the appropriate document's array
      if (sectionsByDocument[targetDocumentId]) {
        sectionsByDocument[targetDocumentId].push(section);
      }
    });
    
    // Apply canonical ordering to each document
    Object.keys(sectionsByDocument).forEach(docId => {
      sectionsByDocument[docId] = sortSectionsForMultiDocument(sectionsByDocument[docId], 
        enhancedDocumentStructure.documents.filter((doc: any) => doc.id === docId));
    });
    
  } else {
    // Single document scenario: Use original logic
    enhancedDocumentStructure?.sections?.forEach((section: any) => {
      // Determine which document this section belongs to
      let targetDocumentId = section.documentId;
      
      // If no explicit documentId, default to the first document
      if (!targetDocumentId) {
        targetDocumentId = enhancedDocumentStructure?.documents?.[0]?.id;
      }
      
      // If target document doesn't exist in our structure, use first document
      if (!sectionsByDocument[targetDocumentId]) {
        targetDocumentId = enhancedDocumentStructure?.documents?.[0]?.id;
      }
      
      // Add section to the appropriate document's array
      if (sectionsByDocument[targetDocumentId]) {
        sectionsByDocument[targetDocumentId].push(section);
      }
    });
  }
  
  return (
    <>
      {enhancedDocumentStructure?.documents?.map((doc: any) => {
        // Auto-expand the document if there's only one document
        const isExpanded = (enhancedDocumentStructure?.documents?.length === 1) || (expandedDocuments[doc.id] ?? true);
        
        // Get sections for this specific document
        const documentSections = sectionsByDocument[doc.id] || [];
        
        // For FlatView, we need to manually order sections to ensure proper placement
        // (canonical ordering has problematic multidocument logic that misplaces appendices)
        
        // Identify special sections that should come first vs. last
        const titlePageSection = documentSections.find((s: any) => s.id === 'metadata');
        const tocSection = documentSections.find((s: any) => s.id === 'ancillary');
        
        const endingSections = documentSections.filter((s: any) => 
          ['references', 'tables_data', 'figures_images', 'appendices'].includes(s.id)
        );
        
        const middleSections = documentSections.filter((s: any) => 
          s.id !== 'metadata' && 
          s.id !== 'ancillary' && 
          !['references', 'tables_data', 'figures_images', 'appendices'].includes(s.id)
        );
        
        // Arrange in the proper order: Title Page -> TOC -> Middle sections -> Ending sections
        const sortedDocumentSections = [
          ...(titlePageSection ? [titlePageSection] : []),
          ...(tocSection ? [tocSection] : []),
          ...middleSections,
          ...endingSections
        ];
        
        return (
          <div key={doc.id} className="border border-white/10 rounded-lg bg-slate-700/20">
            {/* Document Header */}
            <div 
              className="flex items-center gap-2 p-3 cursor-pointer hover:bg-white/5 rounded-t-lg"
              onClick={() => toggleDocument(doc.id)}
            >
              <span className="text-blue-400">📄</span>
              <span className="text-white font-semibold flex-1 truncate" title={doc.name}>{doc.name}</span>
              <span className="text-white/70 transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                ▼
              </span>
            </div>
            
            {/* Sections List */}
            {isExpanded && (
              <div className="p-3 pt-0 border-t border-white/10">
                <div className="space-y-2 ml-4">
                  {/* Render sections for this document with proper canonical order */}
                  {sortedDocumentSections.map((section: any) => {
                    const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
                    const showAllSubsections = expandedSubsectionDetails[section.id] ?? false;
                    
                    // Show only first 3 subsections in summary view
                    const subsections = section.rawSubsections || section.fields?.subchapters || [];
                    const visibleSubsections = showAllSubsections 
                      ? subsections 
                      : subsections?.slice(0, 3) || [];
                    
                    const hasMoreSubsections = subsections && subsections.length > 3;
                    
                    // Determine if this is a required section, optional section, or special section
                    const isRequired = section.required !== false && section.required !== undefined;
                    const isOptional = section.required === false;
                    
                    return (
                      <div key={section.id}>
                        <div 
                          className="flex items-center gap-2 text-white/90 text-sm cursor-pointer hover:bg-white/5 p-1 rounded"
                          onClick={() => {
                            setExpandedSubsections(prev => ({
                              ...prev,
                              [section.id]: !isSubsectionsExpanded
                            }));
                          }}
                        >
                          <span className="text-white/60 text-sm">
                            {isSubsectionsExpanded ? '▼' : '▶'}
                          </span>
                          <span className="text-red-400">
                            {getSectionIcon(section.id)}
                          </span>
                          <span className="flex-1 truncate" title={t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}>{t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}</span>
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                            {section.isRequirement ? 'Requirement' : isRequired ? 'Required' : isOptional ? 'Optional' : 'Special'}
                          </span>
                        </div>
                        {/* Display subsections if they exist */}
                        {subsections && subsections.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {isSubsectionsExpanded && (
                              <div className="space-y-1 mt-1 pl-2 border-l-2 border-white/20">
                                {visibleSubsections.map((subsection: any) => (
                                  <div key={`${section.id}-${subsection.id}`} className="flex items-center gap-2 text-white/70 text-xs pl-2">
                                    <span className="text-xs">📌</span>
                                    <span className="truncate" title={t(`editor.subsection.${subsection.id}` as any) !== `editor.subsection.${subsection.id}` ? t(`editor.subsection.${subsection.id}` as any) : subsection.title}>{t(`editor.subsection.${subsection.id}` as any) !== `editor.subsection.${subsection.id}` ? t(`editor.subsection.${subsection.id}` as any) : subsection.title}</span>
                                  </div>
                                ))}
                                {hasMoreSubsections && !showAllSubsections && (
                                  <button
                                    className="text-xs text-blue-400 hover:text-blue-300 pl-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedSubsectionDetails(prev => ({
                                        ...prev,
                                        [section.id]: true
                                      }));
                                    }}
                                  >
                                    + {subsections.length - 3} {t('editor.ui.more' as any) || 'more'}
                                  </button>
                                )}
                                {showAllSubsections && hasMoreSubsections && (
                                  <button
                                    className="text-xs text-blue-400 hover:text-blue-300 pl-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedSubsectionDetails(prev => ({
                                        ...prev,
                                        [section.id]: false
                                      }));
                                    }}
                                  >
                                    Show less...
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
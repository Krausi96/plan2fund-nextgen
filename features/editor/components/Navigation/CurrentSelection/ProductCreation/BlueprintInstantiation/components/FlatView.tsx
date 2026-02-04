import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { getSectionIcon, sortSectionsByCanonicalOrder } from '@/features/editor/lib';

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
  
  // Group sections by document and sort them
  const getSectionsByDocument = () => {
    if (!documentStructure?.sections) return {};
    
    // Sort sections by canonical order first
    const sortedSections = sortSectionsByCanonicalOrder(documentStructure.sections, documentStructure.documents || []);
    
    const grouped: Record<string, any[]> = {};
    sortedSections.forEach(section => {
      const docId = section.documentId || 'main_document';
      if (!grouped[docId]) {
        grouped[docId] = [];
      }
      grouped[docId].push(section);
    });
    return grouped;
  };

  const sectionsByDoc = getSectionsByDocument();

  // Get required sections for a document (sorted)
  const getRequiredSections = (documentId: string) => {
    // If no sections are grouped by documentId, show all sections under the single document
    if (Object.keys(sectionsByDoc).length === 0 && documentStructure?.sections?.length) {
      return sortSectionsByCanonicalOrder(
        documentStructure.sections.filter((section: any) => section.required !== false),
        documentStructure.documents || []
      );
    }
    return sortSectionsByCanonicalOrder(
      sectionsByDoc[documentId]?.filter((section: any) => section.required !== false) || [],
      documentStructure?.documents || []
    );
  };

  // Get optional sections for a document (sorted)
  const getOptionalSections = (documentId: string) => {
    // If no sections are grouped by documentId, show all sections under the single document
    if (Object.keys(sectionsByDoc).length === 0 && documentStructure?.sections?.length) {
      return sortSectionsByCanonicalOrder(
        documentStructure.sections.filter((section: any) => section.required === false),
        documentStructure.documents || []
      );
    }
    return sortSectionsByCanonicalOrder(
      sectionsByDoc[documentId]?.filter((section: any) => section.required === false) || [],
      documentStructure?.documents || []
    );
  };

  return (
    <>
      {documentStructure?.documents?.map((doc: any) => {
        // Auto-expand the document if there's only one document
        const isExpanded = (documentStructure?.documents?.length === 1) || (expandedDocuments[doc.id] ?? true);
        const requiredSections = getRequiredSections(doc.id);
        const optionalSections = getOptionalSections(doc.id);
        
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
                  {/* Required Sections */}
                  {requiredSections.map((section: any) => {
                    const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
                    const showAllSubsections = expandedSubsectionDetails[section.id] ?? false;
                    
                    // Show only first 3 subsections in summary view
                    const subsections = section.rawSubsections || section.fields?.subchapters || [];
                    const visibleSubsections = showAllSubsections 
                      ? subsections 
                      : subsections?.slice(0, 3) || [];
                    
                    const hasMoreSubsections = subsections && subsections.length > 3;
                    
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
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Required</span>
                        </div>
                        {/* Display subsections if they exist */}
                        {section.rawSubsections && section.rawSubsections.length > 0 && (
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
                                    + {section.rawSubsections.length - 3} {t('editor.ui.more' as any) || 'more'}
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
                  
                  {/* Optional Sections */}
                  {optionalSections.map((section: any) => {
                    const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
                    const showAllSubsections = expandedSubsectionDetails[section.id] ?? false;
                    
                    // Show only first 3 subsections in summary view
                    const subsections = section.rawSubsections || section.fields?.subchapters || [];
                    const visibleSubsections = showAllSubsections 
                      ? subsections 
                      : subsections?.slice(0, 3) || [];
                    
                    const hasMoreSubsections = subsections && subsections.length > 3;
                    
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
                          <input
                            type="checkbox"
                            checked={true} // Assuming optional sections are enabled by default
                            className="w-4 h-4 rounded text-blue-500 bg-slate-600 border-slate-500 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span>
                            {getSectionIcon(section.id)}
                          </span>
                          <span className="flex-1 truncate" title={t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}>{t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}</span>
                          <button className="text-xs text-blue-400 hover:text-blue-300 underline">Rename</button>
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
                  
                  {/* Special sections that may not be assigned to a specific document */}
                  {documentStructure?.sections?.filter((section: any) => {
                    // Don't show the generic 'appendices' section if there are individual appendices (multiple documents)
                    const hasIndividualAppendices = documentStructure.documents && documentStructure.documents.length > 1;
                    if (hasIndividualAppendices && section.id === 'appendices') {
                      return false;
                    }
                    return section.documentId !== doc.id && 
                      (section.type === 'metadata' || section.type === 'ancillary' || 
                       section.id === 'references' || section.id === 'tables_data' || 
                       section.id === 'figures_images' || section.id === 'appendices');
                  }).map((section: any) => {
                    const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
                    const showAllSubsections = expandedSubsectionDetails[section.id] ?? false;
                    
                    // Show only first 3 subsections in summary view
                    const subsections = section.rawSubsections || section.fields?.subchapters || [];
                    const visibleSubsections = showAllSubsections 
                      ? subsections 
                      : subsections?.slice(0, 3) || [];
                    
                    const hasMoreSubsections = subsections && subsections.length > 3;
                    
                    return (
                      <div key={`special-${section.id}`}>
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
                          <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Special</span>
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
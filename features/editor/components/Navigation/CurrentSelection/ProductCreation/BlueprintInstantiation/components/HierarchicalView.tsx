import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { getSectionIcon } from '@/features/editor/lib';
import { organizeDocumentStructureForUi } from '@/features/editor/lib/utils/document-flows/organizeForUiRendering';

interface HierarchicalViewProps {
  documentStructure: any;
  expandedDocuments: Record<string, boolean>;
  expandedSubsections: Record<string, boolean>;
  expandedSubsectionDetails: Record<string, boolean>;
  toggleDocument: (documentId: string) => void;
  setExpandedSubsections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setExpandedSubsectionDetails: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function HierarchicalView({
  documentStructure,
  expandedDocuments,
  expandedSubsections,
  expandedSubsectionDetails,
  toggleDocument,
  setExpandedSubsections,
  setExpandedSubsectionDetails
}: HierarchicalViewProps) {
  const { t } = useI18n();

  // Get hierarchical view from library function
  const hierarchicalView = organizeDocumentStructureForUi(documentStructure, t);
  

  
  if (!hierarchicalView) return null;

  return (
    <>
      {/* Main Document */}
      <div key={hierarchicalView.mainDocument.id} className="border border-white/10 rounded-lg bg-slate-700/20">
        {/* Document Header */}
        <div 
          className="flex items-center gap-2 p-3 cursor-pointer hover:bg-white/5 rounded-t-lg"
          onClick={() => toggleDocument(hierarchicalView.mainDocument.id)}
        >
          <span className="text-blue-400">📋</span>
          <span className="text-white font-semibold flex-1 truncate" title={hierarchicalView.mainDocument.name}>{hierarchicalView.mainDocument.name} (Main)</span>
          <span className="text-white/70 transform transition-transform duration-200" style={{ transform: true ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            ▼
          </span>
        </div>
        
        {/* Main Document Sections List */}
        <div className="p-3 pt-0 border-t border-white/10">
          <div className="space-y-2 ml-4">
            {/* Main Document Sections - filter out empty special sections */}
            {hierarchicalView.mainDocument.sections.filter((section: any) => {
              // Don't show appendices section in main document if it's empty or should be in shared sections
              if (section.id === 'appendices') {
                // If we have individual appendices, don't show generic appendices in main document
                const hasIndividualAppendices = hierarchicalView.appendices.length > 0;
                if (hasIndividualAppendices) {
                  return false;
                }
                // If there are no subsections/content, hide empty appendices section
                const hasContent = section.rawSubsections && section.rawSubsections.length > 0;
                if (!hasContent) {
                  return false;
                }
              }
              return true;
            }).map((section: any) => {
              const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
              const showAllSubsections = expandedSubsectionDetails[section.id] ?? false;
              
              // Show only first 3 subsections in summary view
              const subsections = section.rawSubsections || [];
              const visibleSubsections = showAllSubsections 
                ? subsections 
                : subsections.slice(0, 3);
              
              const hasMoreSubsections = subsections.length > 3;
              
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
                      {section.isRequirement ? 'Requirement' : 'Required'}
                    </span>
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
            
            {/* Appendices Section - for additional documents */}
            {hierarchicalView.appendices.length > 0 && (
              <div>
                <div 
                  className="flex items-center gap-2 text-white font-semibold mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                  onClick={() => toggleDocument('appendices')}
                >
                  <div className="flex items-center gap-2">
                    <span>📎</span>
                    <span className="truncate flex-1 font-semibold">
                      Appendices
                    </span>
                  </div>
                  <span className="text-blue-300 transform transition-transform duration-200 ml-2">
                    {(expandedDocuments['appendices'] ?? true) ? '▼' : '▶'}
                  </span>
                </div>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-blue-500/30 pl-3 ${(expandedDocuments['appendices'] ?? true) ? 'max-h-[1000px]' : 'max-h-0'}`}
                >
                  <div className="space-y-2 py-1">
                    {/* Additional documents treated as appendices - each with its sections */}
                    {hierarchicalView.appendices.map((appendix: any) => (
                      <div key={`appendix-${appendix.id}`} className="space-y-1">
                        {/* Appendix Header */}
                        <div className="text-blue-200 text-sm flex items-center gap-2 truncate" title={appendix.displayName}>
                          <span>🧾</span>
                          <span className="truncate flex-1 font-semibold">
                            {appendix.displayName}
                          </span>
                        </div>
                        
                        {/* Appendix Sections - if they exist */}
                        {appendix.sections && appendix.sections.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {appendix.sections.map((section: any) => {
                              const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
                              const showAllSubsections = expandedSubsectionDetails[section.id] ?? false;
                              
                              // Show only first 3 subsections in summary view
                              const subsections = section.rawSubsections || [];
                              const visibleSubsections = showAllSubsections 
                                ? subsections 
                                : subsections.slice(0, 3);
                              
                              const hasMoreSubsections = subsections.length > 3;
                              
                              return (
                                <div key={section.id} className="mt-1">
                                  <div 
                                    className="flex items-center gap-2 text-white/80 text-xs cursor-pointer hover:bg-white/5 p-1 rounded"
                                    onClick={() => {
                                      setExpandedSubsections(prev => ({
                                        ...prev,
                                        [section.id]: !isSubsectionsExpanded
                                      }));
                                    }}
                                  >
                                    <span className="text-white/50 text-xs">
                                      {isSubsectionsExpanded ? '▼' : '▶'}
                                    </span>
                                    <span className="text-orange-400 text-xs">
                                      {getSectionIcon(section.id)}
                                    </span>
                                    <span className="flex-1 truncate" title={t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}>{t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}</span>
                                    <span className="text-xs bg-orange-500/20 text-orange-300 px-1 py-0.5 rounded text-[0.6rem]">
                                      {section.isRequirement ? 'Req' : 'Appx'}
                                    </span>
                                  </div>
                                  {/* Display subsections if they exist */}
                                  {section.rawSubsections && section.rawSubsections.length > 0 && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      {isSubsectionsExpanded && (
                                        <div className="space-y-1 mt-1 pl-2 border-l-2 border-orange-500/30">
                                          {visibleSubsections.map((subsection: any) => (
                                            <div key={`${section.id}-${subsection.id}`} className="flex items-center gap-2 text-white/60 text-[0.6rem] pl-2">
                                              <span className="text-[0.6rem]">📍</span>
                                              <span className="truncate" title={t(`editor.subsection.${subsection.id}` as any) !== `editor.subsection.${subsection.id}` ? t(`editor.subsection.${subsection.id}` as any) : subsection.title}>{t(`editor.subsection.${subsection.id}` as any) !== `editor.subsection.${subsection.id}` ? t(`editor.subsection.${subsection.id}` as any) : subsection.title}</span>
                                            </div>
                                          ))}
                                          {hasMoreSubsections && !showAllSubsections && (
                                            <button
                                              className="text-[0.6rem] text-orange-400 hover:text-orange-300 pl-2"
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
                                              className="text-[0.6rem] text-orange-400 hover:text-orange-300 pl-2"
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Shared Sections Group */}
            {hierarchicalView.sharedSections.length > 0 && (
              <div>
                <div 
                  className="flex items-center gap-2 text-white font-semibold mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                  onClick={() => toggleDocument('shared-sections')}
                >
                  <div className="flex items-center gap-2">
                    <span>📝</span>
                    <span className="truncate flex-1 font-semibold">
                      {t('editor.section.sharedSections' as any) !== 'editor.section.sharedSections' ? t('editor.section.sharedSections' as any) : 'Shared Sections'}
                    </span>
                  </div>
                  <span className="text-blue-300 transform transition-transform duration-200 ml-2">
                    {(expandedDocuments['shared-sections'] ?? true) ? '▼' : '▶'}
                  </span>
                </div>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-blue-500/30 pl-3 ${(expandedDocuments['shared-sections'] ?? true) ? 'max-h-[1000px]' : 'max-h-0'}`}
                >
                  <div className="space-y-1 py-1">
                    {/* Shared sections like References, Tables, Figures - excluding appendices if individual appendices exist */}
                    {hierarchicalView.sharedSections.filter((section: any) => {
                      // Don't show the generic 'appendices' section if there are individual appendices (multiple documents)
                      const hasIndividualAppendices = hierarchicalView.appendices.length > 0;
                      if (hasIndividualAppendices && section.id === 'appendices') {
                        return false;
                      }
                      return true;
                    }).map((section: any) => (
                      <div key={section.id} className="flex items-center gap-2 text-blue-200 text-sm">
                        <span>{getSectionIcon(section.id)}</span>
                        <span className="font-semibold">
                          {t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : section.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
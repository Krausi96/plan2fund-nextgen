import React, { useState } from 'react';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { getSectionIcon } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import { organizeForUiRendering } from '@/features/editor/lib/utils/organizeForUiRendering';


interface ProgramSummaryPanelProps {
  onClear?: () => void;
  documentStructure?: any;
  showHeader?: boolean;
  headerTitle?: string;
}

export function ProgramSummaryPanel({ onClear, documentStructure: propDocumentStructure, showHeader = true, headerTitle }: ProgramSummaryPanelProps) {
  const { t } = useI18n();
  // TODO Phase 10: programProfile and programSummary don't exist in new store
  // These were old editor-specific state that needs to be consolidated
  const selectedProgram = useProject((state) => state.selectedProgram);
  const storeDocumentStructure = useProject((state) => state.documentStructure);
  const documentStructure = propDocumentStructure || storeDocumentStructure;
  
  // For now, use selectedProgram as fallback for hasProgramData check
  const programProfile = selectedProgram || null;
  const programSummary = selectedProgram || null;
  const hasProgramData = !!(programProfile || programSummary);
  
  // Get organized document structure for UI rendering
  const hierarchicalView = documentStructure ? organizeForUiRendering(documentStructure) : null;
  
  // State for document expansion
  const [expandedDocuments, setExpandedDocuments] = useState<Record<string, boolean>>({});
  
  // Toggle document expansion
  const toggleDocument = (documentId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  };
  

  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Improved Header with Action Buttons */}
      <div className="mb-2">
        {showHeader && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">📄</span>
              </div>
              <h3 className="text-white font-bold text-lg">{headerTitle || t('editor.desktop.program.panels.programSummary')}</h3>
            </div>
            
            {/* Action Buttons - Top Right (REFRESH REMOVED) */}
            <div className="flex gap-1.5">
              <button
                onClick={onClear}
                disabled={!hasProgramData}
                className="w-8 h-8 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center"
                title="Clear"
              >
                <span>🗑️</span>
              </button>
            </div>
          </div>
        )}
        
        {hasProgramData ? (
          <div className="h-0"></div>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">📋</div>
            <p className="text-white/80 text-sm">
              {t('requirementsChecker.selectProgram')}
            </p>
          </div>
        )}
      </div>

      {/* Program Content */}
      {hasProgramData && documentStructure && (
        <div className="space-y-3 mb-4 flex-1">
          
          {/* Document Tree Structure - WITH SELECTED INDICATOR */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-300 text-base">📁</span>
              <h4 className="text-blue-200 font-semibold text-sm flex-1">{t('editor.desktop.program.panels.requiredDocuments')}</h4>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                {t('editor.desktop.program.panels.documents.selected')}
              </span>
            </div>
                        
            <div className="space-y-2 ml-2">
              {/* Handle program structure when no documents exist */}
              {/* Check if we have multiple documents to determine display strategy */}
              {(!documentStructure.documents || documentStructure.documents.length === 0 || documentStructure.documents.length === 1) ? (
                <div>
                  {/* Document Header */}
                  <div className="flex items-center gap-2 text-white font-medium mb-2">
                    <span className="text-blue-300 text-base">📋</span>
                    <span className="truncate flex-1 font-semibold">
                      {programSummary?.name || programProfile?.name || 'Program Document'}
                    </span>
                  </div>
                  
                  {/* Program Sections - use hierarchical view to ensure title page and TOC are included */}
                  <div className="ml-6 border-l-2 border-blue-500/30 pl-3 max-h-[1000px]">
                    <div className="space-y-2 py-1">
                      {/* Get sections using the hierarchical view to include special sections */}
                      {(() => {
                        const allSections = [
                          ...(hierarchicalView?.mainDocument.sections || []),
                          ...(hierarchicalView?.sharedSections || [])
                        ];
                        
                        if (allSections.length > 0) {
                          return allSections.map((section: any, idx: number) => (
                            <div key={idx} className="text-blue-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
                              <span>{getSectionIcon(section.id)}</span>
                              <span className="truncate flex-1">
                                {t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : (section.title || section.name)}
                              </span>
                              {section.required && (
                                <span className="text-red-400 font-bold flex-shrink-0">*</span>
                              )}
                            </div>
                          ));
                        } else {
                          return (
                            <div className="text-blue-200 text-sm flex items-center gap-2">
                              <span>No sections defined</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                /* Multiple documents - treat additional documents as appendices */
                <div className="space-y-3">
                  {/* Main Document */}
                  {documentStructure.documents.slice(0, 1).map((doc: any, index: number) => {
                    const docId = doc.id || `doc-${index}`;
                    const isExpanded = expandedDocuments[docId] ?? true; // Default to expanded
                                      
                    return (
                      <div key={docId}>
                        {/* Document Header with Collapse Toggle */}
                        <div 
                          className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                          onClick={() => toggleDocument(docId)}
                        >
                          <div className="flex items-center gap-2">
                            <span>📋</span>
                            <span className="truncate flex-1 font-semibold" title={doc.name}>
                              {doc.name} (Main)
                            </span>
                          </div>
                          <span className="text-blue-300 transform transition-transform duration-200 ml-2">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                                          
                        {/* Collapsible Nested Sections for Main Document */}
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-blue-500/30 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                        >
                          <div className="space-y-2 py-1">
                            {/* Show main document sections using the consistent hierarchical view to ensure special sections are included */}
                            {(hierarchicalView?.mainDocument.sections || []).map((section: any, idx: number) => (
                              <div key={`${section.id}-${idx}`} className="text-blue-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
                                <span>
                                  {getSectionIcon(section.id)}
                                </span>
                                <span className="truncate flex-1">
                                  {t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : (section.title || section.name)}
                                </span>
                                {section.required && (
                                  <span className="text-red-400 font-bold flex-shrink-0">*</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                                
                                
                  {/* Appendices Section - for additional documents */}
                  {documentStructure.documents.length > 1 && (
                    <div>
                      <div 
                        className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
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
                          {/* Additional documents treated as appendices */}
                          {documentStructure.documents.slice(1).map((doc: any, index: number) => {
                            const appendixLetter = String.fromCharCode(65 + index); // A, B, C...
                            return (
                              <div key={`appendix-${doc.id}`} className="text-blue-200 text-sm flex items-center gap-2 truncate" title={`Appendix ${appendixLetter}: ${doc.name}`}>
                                <span>🧾</span>
                                <span className="truncate flex-1">
                                  Appendix {appendixLetter}: {doc.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                                
                                
                  {/* Shared Sections Group */}
                  {(hierarchicalView?.sharedSections || []).length > 0 && (
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
                          {(hierarchicalView?.sharedSections || []).map((section: any, idx: number) => (
                            <div key={`${section.id}-${idx}`} className="text-blue-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
                              <span>{getSectionIcon(section.id)}</span>
                              <span className="truncate flex-1 font-semibold">
                                {t(`editor.section.${section.id}` as any) !== `editor.section.${section.id}` ? t(`editor.section.${section.id}` as any) : (section.title || section.name)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>                          
        </div>
      )}
    </div>
  );
}
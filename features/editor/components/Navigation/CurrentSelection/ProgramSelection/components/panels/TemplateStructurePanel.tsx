import React from 'react';
import { useEditorStore, getSectionIcon } from '@/features/editor/lib';
import { organizeDocumentStructureForUi } from '@/features/editor/lib/utils/1-document-flows/document-flows/organizeForUiRendering';
import { useI18n } from '@/shared/contexts/I18nContext';

interface TemplateStructurePanelProps {
  selectedOption?: 'program' | 'template' | 'free' | null;
  // Add callback props for actual functionality
  onClearTemplate?: () => void;
}

export function TemplateStructurePanel({ selectedOption, onClearTemplate }: TemplateStructurePanelProps) {
  const { t } = useI18n();
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = setupWizard.documentStructure;

  // Use hierarchical organization for proper document structure display
  const organizedStructure = organizeDocumentStructureForUi(documentStructure, t);
  
  // Get sections by document from organized structure
  // Only show template data when template option is selected AND we have template data
  const hasTemplateData = selectedOption === 'template' && !!documentStructure?.source && documentStructure.source === 'template';

  // Collapsible state management
  const [expandedDocuments, setExpandedDocuments] = React.useState<Record<string, boolean>>({});

  // Toggle document expansion
  const toggleDocument = (docId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  // Access store actions
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);

  // Actual clear functionality - UPDATE TO EMPTY STATE WITHOUT CLOSING
  const handleClear = () => {
    if (onClearTemplate) {
      onClearTemplate();
    } else {
      // Default clear behavior - reset to empty state
      console.log('🗑️ Clearing template structure - updating to empty state');
      setDocumentStructure(null);
      setSetupStatus('none');
      setSetupDiagnostics(null);
      // DO NOT clear selectedOption - keep panel open and selection intact
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Improved Header with Action Buttons */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🔍</span>
            </div>
            <h3 className="text-white font-bold text-lg">{t('editor.desktop.program.panels.templateAnalysis' as any)}</h3>
          </div>
          
          {/* Action Buttons - Top Right (REFRESH REMOVED) */}
          <div className="flex gap-1.5">
            <button
              onClick={handleClear}
              disabled={!hasTemplateData}
              className="w-8 h-8 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center"
              title="Clear"
            >
              <span>🗑️</span>
            </button>
          </div>
        </div>
        
        {!hasTemplateData && (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">🧩</div>
            <p className="text-white/80 text-sm">
              {t('editor.desktop.program.uploadTemplateHint' as any)}
            </p>
          </div>
        )}
      </div>

      {/* Template Content */}
      {hasTemplateData && (
        <div className="space-y-4 mb-4 flex-1">
          {/* Document Tree Structure */}
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-300 text-lg">📁</span>
              <h4 className="text-purple-200 font-semibold text-base flex-1">{t('editor.desktop.program.panels.requiredDocuments')}</h4>
            </div>
                        
            <div className="space-y-2 ml-2">
              {/* Main Document */}
              {organizedStructure && (
                <div>
                  <div 
                    className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                    onClick={() => toggleDocument(organizedStructure.mainDocument.id)}
                  >
                    <span className="text-purple-300 text-lg">📋</span>
                    <span className="truncate flex-1" title={`${organizedStructure.mainDocument.name} (Main document)`}>
                      {organizedStructure.mainDocument.name} (Main document)
                    </span>
                    <span className="text-purple-300 transform transition-transform duration-200 ml-2">
                      {(expandedDocuments[organizedStructure.mainDocument.id] ?? true) ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  {/* Collapsible Main Document Sections */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-purple-500/30 pl-3 ${(expandedDocuments[organizedStructure.mainDocument.id] ?? true) ? 'max-h-[1000px]' : 'max-h-0'}`}
                  >
                    <div className="space-y-2 py-1">
                      {organizedStructure.mainDocument.sections.map((section: any, idx: number) => {
                        const sectionId = section.id || idx;
                        const sectionTitle = section.title || section.name || section;
                        const icon = getSectionIcon(sectionId);

                        return (
                          <div key={idx} className="text-purple-200 text-sm flex items-center gap-2 truncate" title={sectionTitle}>
                            <span>{icon}</span>
                            <span className="truncate flex-1">
                              {t(`editor.section.${sectionId}` as any) !== `editor.section.${sectionId}` ? t(`editor.section.${sectionId}` as any) : sectionTitle}
                            </span>
                            {section.required && (
                              <span className="text-red-400 font-bold flex-shrink-0">*</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Appendices */}
              {organizedStructure && organizedStructure.appendices.length > 0 && (
                <div>
                  <div 
                    className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                    onClick={() => toggleDocument('appendices')}
                  >
                    <span className="text-purple-300 text-lg">📎</span>
                    <span className="truncate flex-1" title="Appendices">
                      Appendices
                    </span>
                    <span className="text-purple-300 transform transition-transform duration-200 ml-2">
                      {(expandedDocuments['appendices'] ?? true) ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-purple-500/30 pl-3 ${(expandedDocuments['appendices'] ?? true) ? 'max-h-[1000px]' : 'max-h-0'}`}
                  >
                    <div className="space-y-2 py-1">
                      {organizedStructure.appendices.map((appendix, appendixIdx) => (
                        <div key={appendix.id}>
                          <div 
                            className="flex items-center gap-2 text-purple-200 text-sm font-medium mb-1"
                          >
                            <span>🧾</span>
                            <span className="truncate flex-1" title={`Appendix ${String.fromCharCode(65 + appendixIdx)}: ${appendix.name}`}>
                              Appendix {String.fromCharCode(65 + appendixIdx)}: {appendix.name}
                            </span>
                          </div>
                          
                          <div className="ml-4 space-y-1">
                            {appendix.sections.map((section: any, idx: number) => {
                              const sectionId = section.id || idx;
                              const sectionTitle = section.title || section.name || section;
                              const icon = getSectionIcon(sectionId);

                              return (
                                <div key={idx} className="text-purple-200 text-xs flex items-center gap-2 truncate" title={sectionTitle}>
                                  <span>{icon}</span>
                                  <span className="truncate flex-1">
                                    {t(`editor.section.${sectionId}` as any) !== `editor.section.${sectionId}` ? t(`editor.section.${sectionId}` as any) : sectionTitle}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Shared Sections */}
              {organizedStructure && organizedStructure.sharedSections.length > 0 && (
                <div>
                  <div 
                    className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                    onClick={() => toggleDocument('shared-sections')}
                  >
                    <span className="text-purple-300 text-lg">📝</span>
                    <span className="truncate flex-1" title="Shared Sections">
                      Shared Sections
                    </span>
                    <span className="text-purple-300 transform transition-transform duration-200 ml-2">
                      {(expandedDocuments['shared-sections'] ?? true) ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-purple-500/30 pl-3 ${(expandedDocuments['shared-sections'] ?? true) ? 'max-h-[1000px]' : 'max-h-0'}`}
                  >
                    <div className="space-y-2 py-1">
                      {organizedStructure.sharedSections.map((section: any, idx: number) => {
                        const sectionId = section.id || idx;
                        const sectionTitle = section.title || section.name || section;
                        const icon = getSectionIcon(sectionId);

                        return (
                          <div key={idx} className="text-purple-200 text-sm flex items-center gap-2 truncate" title={sectionTitle}>
                            <span>{icon}</span>
                            <span className="truncate flex-1">
                              {t(`editor.section.${sectionId}` as any) !== `editor.section.${sectionId}` ? t(`editor.section.${sectionId}` as any) : sectionTitle}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
            
        </div>
      )}

    </div>
  );
}
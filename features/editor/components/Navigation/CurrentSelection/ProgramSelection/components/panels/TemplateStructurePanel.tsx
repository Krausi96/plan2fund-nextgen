import React from 'react';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { getSectionIcon } from '@/features/editor/lib';
import { organizeForUiRendering } from '@/features/editor/lib/utils/organizeForUiRendering';
import { useI18n } from '@/shared/contexts/I18nContext';
import { hasFundingOverlay, getFundingOverlayInfo } from '@/platform/analysis';
import { Button } from '@/shared/components/ui/button';
import { normalizeFundingProgram } from '@/features/editor/lib';
import { overlayFundingRequirements } from '@/platform/analysis';

interface TemplateStructurePanelProps {
  selectedOption?: 'program' | 'template' | 'free' | null;
  // Add callback props for actual functionality
  onClearTemplate?: () => void;
  showHeader?: boolean;
  headerTitle?: string;
  documentStructure?: any;
}

export function TemplateStructurePanel({ selectedOption, onClearTemplate, showHeader = true, headerTitle, documentStructure: propDocumentStructure }: TemplateStructurePanelProps) {
  const { t } = useI18n();
  const storeDocumentStructure = useProject((state) => state.documentStructure);
  const documentStructure = propDocumentStructure || storeDocumentStructure;

  // Use hierarchical organization for proper document structure display
  const organizedStructure = organizeForUiRendering(documentStructure);

  // Show template data when we have a document structure with source === 'template', 'overlay', or 'document'
  // Note: selectedOption prop may not be passed when used from BlueprintInstantiation
  const hasTemplateData = !!documentStructure?.metadata?.source && (documentStructure.metadata.source === 'template' || documentStructure.metadata.source === 'overlay' || documentStructure.metadata.source === 'document');

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
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setSetupDiagnostics = useProject((state) => state.setSetupDiagnostics);
  const setSelectedProgram = useProject((state) => state.selectProgram);
  
  // Check if already has funding overlay
  const hasOverlay = documentStructure ? hasFundingOverlay(documentStructure) : false;
  const overlayInfo = documentStructure ? getFundingOverlayInfo(documentStructure) : null;

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
        {showHeader && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">🔍</span>
              </div>
              <h3 className="text-white font-bold text-lg">{headerTitle || t('editor.desktop.program.panels.templateAnalysis' as any)}</h3>
            </div>
            
            {/* Action Buttons - Top Right */}
            <div className="flex gap-1.5">
              {/* Connect Funding Program Button */}
              {!hasOverlay ? (
                <Button
                  onClick={() => {
                    // Signal to parent to open program finder
                    window.dispatchEvent(new CustomEvent('openProgramFinder', { detail: { mode: 'overlay' } }));
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                  title="Connect funding program"
                >
                  <span>💰</span>
                  <span className="hidden sm:inline">Connect Funding</span>
                </Button>
              ) : (
                <div className="flex items-center gap-1 bg-green-600/30 text-green-300 px-2 py-1 rounded-lg text-xs">
                  <span>✅</span>
                  <span className="hidden sm:inline">{overlayInfo?.programName || 'Funding Connected'}</span>
                </div>
              )}
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
        )}

        {/* Funding Overlay Info Banner */}
        {hasOverlay && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400">💰</span>
              <span className="text-green-200 font-medium text-sm">Funding Requirements Active</span>
            </div>
            <p className="text-green-300/70 text-xs">
              {overlayInfo?.programName} requirements overlaid on your document
            </p>
          </div>
        )}

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
                      {organizedStructure.appendices.map(( appendix: any, appendixIdx: any) => (
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
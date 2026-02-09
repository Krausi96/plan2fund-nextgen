import React from 'react';
import { useEditorStore } from '@/features/editor/lib';
import { MASTER_SECTIONS } from '@/features/editor/lib/templates';
import { useI18n } from '@/shared/contexts/I18nContext';
import { getSectionIcon } from '@/features/editor/lib';
import { sortSectionsForSingleDocument } from '@/features/editor/lib/utils/1-document-flows/document-flows/organizeForUiRendering';

interface StandardStructurePanelProps {
  selectedOption?: 'program' | 'template' | 'free' | null;
  // Add callback props for actual functionality
  onClearStructure?: () => void;
  showHeader?: boolean;
  headerTitle?: string;
  documentStructure?: any;
}

export function StandardStructurePanel({ selectedOption, onClearStructure, showHeader = true, headerTitle, documentStructure: propDocumentStructure }: StandardStructurePanelProps) {
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = propDocumentStructure || setupWizard.documentStructure;
  
  const { t } = useI18n();
  
  // Store actions for document structure management
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  const setInferredProductType = useEditorStore((state) => state.setInferredProductType);
  // Note: setSelectedOption is managed locally in ProgramSelection component

  const getRequiredDocuments = () => {
    return documentStructure?.documents || [];
  };

  const getRequiredSections = () => {
    // When document structure exists and has sections (like from upload/upgrade), use those with canonical sorting
    // This ensures real document data is shown instead of template data for upgrade option
    if (documentStructure?.sections && documentStructure.sections.length > 0) {
      return sortSectionsForSingleDocument(documentStructure.sections);
    }
    
    // Otherwise, fall back to template sections based on inferred product type
    const productType = setupWizard.inferredProductType;
    let sections: any[] = [];
    
    if (productType && MASTER_SECTIONS[productType]) {
      sections = MASTER_SECTIONS[productType];
    }
    
    // Sort sections according to canonical order
    return sortSectionsForSingleDocument(sections);
  };

  // Handle case when no documents exist but we have product type
  // Only use template structure if there's no document structure at all
  const hasTemplateStructure = setupWizard.inferredProductType && 
                                getRequiredDocuments().length === 0 &&
                                (!documentStructure || !documentStructure.sections || documentStructure.sections.length === 0) &&
                                selectedOption !== 'free';

  // Show structure data when free option is selected with standard/upgrade structure OR when any document structure exists for other options
  const hasStructureData = (selectedOption === 'free' && 
                          !!documentStructure?.source && (documentStructure.source === 'standard' || documentStructure.source === 'upgrade') &&
                          (documentStructure?.sections?.length > 0 || documentStructure?.documents?.length > 0))
                        || 
                          (selectedOption !== 'free' && documentStructure && 
                          (documentStructure?.sections?.length > 0 || documentStructure?.documents?.length > 0));
  
  // Collapsible state management
  const [expandedDocuments, setExpandedDocuments] = React.useState<Record<string, boolean>>({});
  
  // Toggle document expansion
  const toggleDocument = (docId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };
  
  // Actual clear functionality - UPDATE TO EMPTY STATE WITHOUT CLOSING
  const handleClear = () => {
    if (onClearStructure) {
      onClearStructure();
    } else {
      // Default clear behavior - reset to empty state
      console.log('🗑️ Clearing standard structure - updating to empty state');
      setDocumentStructure(null);
      setSetupStatus('none');
      setSetupDiagnostics(null);
      setInferredProductType(null);
      // DO NOT clear selectedOption - keep panel open and selection intact
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      
      {/* Improved Header with Action Buttons */}
      <div className="mb-2">
        {showHeader && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">📋</span>
              </div>
              <h3 className="text-white font-bold text-lg">{headerTitle || t('editor.desktop.program.panels.standardStructure')}</h3>
            </div>
            
            {/* Action Buttons - Top Right (REFRESH REMOVED) */}
            <div className="flex gap-1.5">
              <button
                onClick={handleClear}
                disabled={!hasStructureData}
                className="w-8 h-8 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center"
                title="Clear"
              >
                <span>🗑️</span>
              </button>
            </div>
          </div>
        )}
        
        {hasStructureData ? (
          <div className="h-0"></div>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">📋</div>
            <p className="text-white/80 text-sm">
              {t('editor.ui.selectSection')}
            </p>
          </div>
        )}
      </div>

      {/* Standard Content */}
      {hasStructureData && (
        <div className="space-y-3 mb-4 flex-1">
          
          {/* Document Tree Structure - WITH SELECTED INDICATOR */}
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-300 text-base">📁</span>
              <h4 className="text-green-200 font-semibold text-sm flex-1">{t('editor.desktop.program.panels.requiredDocuments')}</h4>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                {t('editor.desktop.program.panels.documents.selected')}
              </span>
            </div>
                      
            <div className="space-y-2 ml-2">
              {/* Handle template structure when no documents exist */}
              {hasTemplateStructure ? (
                <div>
                  {/* Document Header */}
                  <div className="flex items-center gap-2 text-white font-medium mb-2">
                    <span className="truncate flex-1">
                      {setupWizard.inferredProductType === 'submission' ? t('editor.desktop.program.document.businessPlan') : 
                       setupWizard.inferredProductType === 'strategy' ? t('editor.desktop.program.document.strategyDocument') : 
                       'Standard Document'}
                    </span>
                  </div>
                  
                  {/* Template Sections */}
                  <div className="ml-6 border-l-2 border-green-500/30 pl-3 max-h-[1000px]">
                    <div className="space-y-2 py-1">
                      {/* Actual Template Sections - dynamically rendered with proper icons */}
                      {getRequiredSections().map((section: any, idx: number) => {
                        const sectionId = section.id || idx;
                        const sectionTitle = section.title || section.name || section;
                        const icon = getSectionIcon(sectionId);
                        
                        return (
                          <div key={idx} className="text-green-200 text-sm flex items-center gap-2 truncate" title={sectionTitle}>
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
              ) : (
                /* Original document iteration logic */
                getRequiredDocuments().map((doc: any, index: number) => {
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
                          <span>📄</span>
                          <span className="truncate flex-1" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                        <span className="text-green-300 transform transition-transform duration-200 ml-2">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                              
                      {/* Collapsible Nested Sections */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-green-500/30 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                      >
                        <div className="space-y-2 py-1">
                          {/* SHOW ACTUAL DOCUMENT STRUCTURE SECTIONS - NO HARDCODED DUPLICATES */}
                          {getRequiredSections()
                            .filter(section => section.documentId === doc.id) // Only show sections that belong to this specific document
                            .map((section: any, idx: number) => (
                              <div key={`${section.id}-${idx}`} className="text-green-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
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
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
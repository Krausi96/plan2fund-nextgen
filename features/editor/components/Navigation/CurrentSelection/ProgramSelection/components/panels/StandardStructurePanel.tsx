import React from 'react';
import { useEditorStore } from '@/features/editor/lib';
import { MASTER_SECTIONS } from '@/features/editor/lib/templates';
import { useI18n } from '@/shared/contexts/I18nContext';

interface StandardStructurePanelProps {
  selectedOption?: 'program' | 'template' | 'free' | null;
  // Add callback props for actual functionality
  onClearStructure?: () => void;
}

export function StandardStructurePanel({ selectedOption, onClearStructure }: StandardStructurePanelProps) {
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = setupWizard.documentStructure;
  
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
    // Get actual sections from MASTER_SECTIONS based on inferred product type
    const productType = setupWizard.inferredProductType;
    if (productType && MASTER_SECTIONS[productType]) {
      return MASTER_SECTIONS[productType];
    }
    // Fallback to document structure sections
    return documentStructure?.sections || [];
  };

  // Handle case when no documents exist but we have product type
  const hasTemplateStructure = setupWizard.inferredProductType && getRequiredDocuments().length === 0;

  // Helper function to convert structure ID to human-readable name
  const getStructureDisplayName = () => {
    if (!documentStructure?.structureId) return 'Custom structure';
    
    const structureId = documentStructure.structureId;
    
    // Extract structure type from ID (format: standard-{type}-{timestamp})
    const match = structureId.match(/^standard-([^-]+)-\d+$/);
    if (match) {
      const type = match[1];
      const structureNames: Record<string, string> = {
        'business-plan': t('editor.desktop.program.document.businessPlan') + ' (Submission)',
        'strategy': t('editor.desktop.program.document.strategyDocument')
        // NOTE: pitch-deck removed as it's not a valid product type
      };
      return structureNames[type] || `${type.replace(/-/g, ' ')} Structure`;
    }
    
    // Fallback for other formats
    return structureId.replace(/^standard-/, '').replace(/-\d+$/, '').replace(/-/g, ' ');
  };



  // Only show structure data when free option is selected AND we have standard structure data
  const hasStructureData = selectedOption === 'free' && !!documentStructure?.source && documentStructure.source === 'standard';
  
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">📋</span>
            </div>
            <h3 className="text-white font-bold text-lg">Standard Structure</h3>
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
        
        {hasStructureData ? (
          <div className="h-0"></div>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">📋</div>
            <p className="text-white/80 text-sm">
              Select a base structure to start
            </p>
          </div>
        )}
      </div>

      {/* Standard Content */}
      {hasStructureData && (
        <div className="space-y-4 mb-4 flex-1">
          
          {/* Selected Structure Display */}
          <div className="bg-slate-800/50 rounded-xl border border-green-400/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0 border-2 border-green-400">
                <span className="text-green-300 text-lg">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base mb-1 truncate" title={getStructureDisplayName()}>
                  Selected: {getStructureDisplayName()}
                </h3>
                <p className="text-green-300 text-xs truncate">
                  Standard document structure (Product Type: {setupWizard.inferredProductType || 'unknown'})
                </p>
              </div>
            </div>
          </div>
          
          {/* Document Tree Structure */}
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-300 text-lg">📁</span>
              <h4 className="text-green-200 font-semibold text-base flex-1">Document Structure</h4>
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
                      {/* Standard Document Structure - USING EXISTING TRANSLATION KEYS */}
                      <div className="text-green-200 text-sm flex items-center gap-2">
                        <span>📕</span>
                        <span>{t('editor.section.metadata')}</span>
                      </div>
                      <div className="text-green-200 text-sm flex items-center gap-2">
                        <span>📑</span>
                        <span>{t('editor.section.ancillary')}</span>
                      </div>
                      
                      {/* Actual Template Sections */}
                      {getRequiredSections()
                        .slice(0, 8)
                        .map((section: any, idx: number) => (
                          <div key={idx} className="text-green-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
                            <span>🧾</span>
                            <span className="truncate flex-1">
                              {section.id === 'executive_summary' ? t('editor.desktop.program.section.executiveSummary') :
                               section.id === 'project_description' ? t('editor.desktop.program.section.projectDescription') :
                               section.id === 'market_analysis' ? t('editor.desktop.program.section.marketAnalysis') :
                               section.id === 'financial_plan' ? t('editor.desktop.program.section.financialPlan') :
                               section.id === 'team_qualifications' ? t('editor.desktop.program.section.teamQualifications') :
                               section.id === 'risk_assessment' ? t('editor.desktop.program.section.riskAssessment') :
                               section.id === 'business_model_canvas' ? t('editor.desktop.program.section.businessModelCanvas') :
                               section.id === 'go_to_market_strategy' ? t('editor.desktop.program.section.goToMarket') :
                               section.id === 'unit_economics' ? t('editor.desktop.program.section.unitEconomics') :
                               section.id === 'milestones_next_steps' ? t('editor.desktop.program.section.milestonesNextSteps') :
                               (section.title || section.name)}
                            </span>
                            {section.required && (
                              <span className="text-red-400 font-bold flex-shrink-0">*</span>
                            )}
                          </div>
                        ))}
                      
                      {/* Additional Document Elements - CONSOLIDATED TRANSLATION KEYS */}
                      <div className="text-green-200 text-sm flex items-center gap-2">
                        <span>📚</span>
                        <span>{t('editor.section.references')}</span>
                      </div>
                      <div className="text-green-200 text-sm flex items-center gap-2">
                        <span>📊</span>
                        <span>{t('editor.desktop.program.document.tablesData')}</span>
                      </div>
                      <div className="text-green-200 text-sm flex items-center gap-2">
                        <span>🖼️</span>
                        <span>{t('editor.desktop.program.document.figuresImages')}</span>
                      </div>
                      <div className="text-green-200 text-sm flex items-center gap-2">
                        <span>📎</span>
                        <span>{t('editor.section.appendices')}</span>
                      </div>
                      
                      {getRequiredSections().length > 8 && (
                        <div className="text-green-300 text-sm italic">
                          +{getRequiredSections().length - 8} more sections
                        </div>
                      )}
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
                        <span className="truncate flex-1" title={doc.name}>
                          {doc.name}
                        </span>
                        <span className="text-green-300 transform transition-transform duration-200 ml-2">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                              
                      {/* Collapsible Nested Sections */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-green-500/30 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                      >
                        <div className="space-y-2 py-1">
                          {/* Standard Document Structure - USING EXISTING TRANSLATION KEYS */}
                          <div className="text-green-200 text-sm flex items-center gap-2">
                            <span>📕</span>
                            <span>{t('editor.section.metadata')}</span>
                          </div>
                          <div className="text-green-200 text-sm flex items-center gap-2">
                            <span>📑</span>
                            <span>{t('editor.section.ancillary')}</span>
                          </div>
                          
                          {/* Document Sections - SHOW ACTUAL TEMPLATE SECTIONS */}
                          {getRequiredSections()
                            .filter(section => section.documentId === doc.id || !section.documentId) // Handle both template and document structure formats
                            .slice(0, 8)
                            .map((section: any, idx: number) => (
                              <div key={idx} className="text-green-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
                                <span>🧾</span>
                                <span className="truncate flex-1">{section.title || section.name}</span>
                                {section.required && (
                                  <span className="text-red-400 font-bold flex-shrink-0">*</span>
                                )}
                              </div>
                            ))}
                          
                          {/* Additional Document Elements */}
                          <div className="text-green-200 text-sm flex items-center gap-2">
                            <span>📚</span>
                            <span>{t('editor.section.references')}</span>
                          </div>
                          <div className="text-green-200 text-sm flex items-center gap-2">
                            <span>📊</span>
                            <span>{t('editor.desktop.program.document.tablesData')}</span>
                          </div>
                          <div className="text-green-200 text-sm flex items-center gap-2">
                            <span>🖼️</span>
                            <span>{t('editor.desktop.program.document.figuresImages')}</span>
                          </div>
                          <div className="text-green-200 text-sm flex items-center gap-2">
                            <span>📎</span>
                            <span>{t('editor.section.appendices')}</span>
                          </div>
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
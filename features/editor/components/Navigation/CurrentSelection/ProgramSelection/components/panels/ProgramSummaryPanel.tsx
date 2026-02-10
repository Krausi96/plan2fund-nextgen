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
  // Get program data from store
  const selectedProgram = useProject((state) => state.selectedProgram);
  const storeDocumentStructure = useProject((state) => state.documentStructure);
  const documentStructure = propDocumentStructure || storeDocumentStructure;
  
  const hasProgramData = !!selectedProgram;
  
  // Get organized document structure for UI rendering
  const hierarchicalView = documentStructure ? organizeForUiRendering(documentStructure) : null;
  
  // State for document expansion
  const [expandedDocuments, setExpandedDocuments] = useState<Record<string, boolean>>({
    requiredDocuments: true,
  });

  // Toggle document expansion
  const toggleDocument = (documentId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  };

  // Helper to format deadline
  const formatDeadline = (deadline: string | null | undefined) => {
    if (!deadline) return 'Not specified';
    try {
      const date = new Date(deadline);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return deadline;
    }
  };

  // Helper to get eligible costs from requirements
  const getEligibleCosts = () => {
    const requirements = (selectedProgram as any)?.requirements || (selectedProgram as any)?.useOfFunds || [];
    if (Array.isArray(requirements)) {
      return requirements.slice(0, 5).map(r => typeof r === 'string' ? r : r.title || r.name || 'Cost');
    }
    return [];
  };

  // Debug: Log program data structure
  React.useEffect(() => {
    if (selectedProgram) {
      console.log('📦 selectedProgram structure:', {
        focus_areas: (selectedProgram as any)?.focus_areas,
        focusAreas: (selectedProgram as any)?.focusAreas,
        use_of_funds: (selectedProgram as any)?.use_of_funds,
        useOfFunds: (selectedProgram as any)?.useOfFunds,
        applicationRequirements: (selectedProgram as any)?.applicationRequirements,
        application_requirements: (selectedProgram as any)?.application_requirements,
        deliverables: (selectedProgram as any)?.deliverables,
        requirements: (selectedProgram as any)?.requirements
      });
    }
  }, [selectedProgram]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">📄</span>
              </div>
              <h3 className="text-white font-bold text-lg">{headerTitle || t('editor.desktop.program.panels.programSummary')}</h3>
            </div>
            
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
        
        {!hasProgramData && (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">📋</div>
            <p className="text-white/80 text-sm">
              {t('requirementsChecker.selectProgram')}
            </p>
          </div>
        )}
      </div>

      {/* Program Content */}
      {hasProgramData && (
        <div className="space-y-4 mb-4 flex-1 overflow-y-auto">
          {/* Section 1: Program Overview */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧾</span>
              <h4 className="text-white font-bold text-sm">{t('editor.desktop.program.summary.programOverview')}</h4>
            </div>
            <div className="border-b border-white/10 my-2"></div>
            
            <div className="space-y-2 ml-4 text-xs">
              {/* Program Name - Provider - Deadline */}
              <div className="flex items-start gap-2">
                <span className="text-white/60 min-w-fit font-medium">{t('editor.desktop.program.summary.programName')}:</span>
                <span className="text-white/80">{(selectedProgram as any)?.name || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white/60 min-w-fit font-medium">{t('editor.desktop.program.summary.provider')}:</span>
                <span className="text-white/80">{(selectedProgram as any)?.organization || (selectedProgram as any)?.provider || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white/60 min-w-fit font-medium">{t('editor.desktop.program.summary.deadline')}:</span>
                <span className="text-white/80">{formatDeadline((selectedProgram as any)?.deadline)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Required Documents */}
          {documentStructure && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setExpandedDocuments(prev => ({ ...prev, requiredDocuments: !prev.requiredDocuments }))}
              >
                <span className="text-lg">📄</span>
                <h4 className="text-white font-bold text-sm flex-1">{t('editor.desktop.program.panels.requiredDocuments')}</h4>
                <span className="text-white/60 text-sm">{expandedDocuments.requiredDocuments ? '▼' : '▶'}</span>
              </div>
              <div className="border-b border-white/10 my-2"></div>
              
              {expandedDocuments.requiredDocuments && documentStructure && (
                  <div className="space-y-2 ml-2">
                    {/* Handle program structure when no documents exist */}
                    {(!documentStructure.documents || documentStructure.documents.length === 0 || documentStructure.documents.length === 1) ? (
                      <div>
                        {/* Document Header */}
                        <div className="flex items-center gap-2 text-white font-medium mb-2">
                          <span className="text-blue-300 text-base">📋</span>
                          <span className="truncate flex-1 font-semibold">
                            {(selectedProgram as any)?.name || 'Program Document'}
                          </span>
                        </div>
                        
                        {/* Program Sections */}
                        <div className="ml-6 border-l-2 border-blue-500/30 pl-3 max-h-[1000px]">
                          <div className="space-y-2 py-1">
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
                                    <span>{t('editor.desktop.program.summary.noSectionsDefined')}</span>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Multiple documents */
                      <div className="space-y-3">
                        {/* Main Document */}
                        {documentStructure.documents.slice(0, 1).map((doc: any, index: number) => {
                          const docId = doc.id || `doc-${index}`;
                          const isExpanded = expandedDocuments[docId] ?? true;
                          
                          return (
                            <div key={docId}>
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
                              
                              <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-blue-500/30 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                              >
                                <div className="space-y-2 py-1">
                                  {(hierarchicalView?.mainDocument.sections || []).map((section: any, idx: number) => (
                                    <div key={`${section.id}-${idx}`} className="text-blue-200 text-sm flex items-center gap-2 truncate" title={section.title || section.name}>
                                      <span>{getSectionIcon(section.id)}</span>
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
                        
                        {/* Appendices */}
                        {documentStructure.documents.length > 1 && (
                          <div>
                            <div 
                              className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                              onClick={() => toggleDocument('appendices')}
                            >
                              <div className="flex items-center gap-2">
                                <span>📎</span>
                                <span className="truncate flex-1 font-semibold">Appendices</span>
                              </div>
                              <span className="text-blue-300 transform transition-transform duration-200 ml-2">
                                {(expandedDocuments['appendices'] ?? true) ? '▼' : '▶'}
                              </span>
                            </div>
                            
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-blue-500/30 pl-3 ${(expandedDocuments['appendices'] ?? true) ? 'max-h-[1000px]' : 'max-h-0'}`}
                            >
                              <div className="space-y-2 py-1">
                                {documentStructure.documents.slice(1).map((doc: any, index: number) => {
                                  const appendixLetter = String.fromCharCode(65 + index);
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
                        
                        {/* Shared Sections */}
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
              )}
            </div>
          )}

          {/* Section 3: Focus Areas */}
          {((selectedProgram as any)?.focusAreas !== undefined || (selectedProgram as any)?.program_focus !== undefined || (selectedProgram as any)?.focus_areas !== undefined) && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h4 className="text-white font-bold text-sm">{t('editor.desktop.program.summary.focusAreas')}</h4>
              </div>
              <div className="border-b border-white/10 my-2"></div>
              
              <div className="ml-4 flex flex-wrap gap-2">
                {((selectedProgram as any)?.focusAreas || (selectedProgram as any)?.program_focus || (selectedProgram as any)?.focus_areas || []).map((area: string, idx: number) => (
                  <span key={idx} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Financial Expectations */}
          {((selectedProgram as any)?.applicationRequirements !== undefined || (selectedProgram as any)?.application_requirements !== undefined || (selectedProgram as any)?.financialRequirements !== undefined) && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <h4 className="text-white font-bold text-sm">{t('editor.desktop.program.summary.financialExpectations')}</h4>
              </div>
              <div className="border-b border-white/10 my-2"></div>
              
              <div className="ml-4 space-y-2 text-xs">
                {Array.isArray((selectedProgram as any)?.applicationRequirements?.financialRequirements) &&
                (selectedProgram as any)?.applicationRequirements?.financialRequirements.map((req: any, idx: number) => (
                  <div key={idx} className="text-white/80">
                    • {req.description || req.type || `Financial Requirement ${idx + 1}`}
                  </div>
                ))}
                {(selectedProgram as any)?.applicationRequirements?.financial_requirements?.financial_statements_required &&
                Array.isArray((selectedProgram as any)?.applicationRequirements?.financial_requirements?.financial_statements_required) &&
                (selectedProgram as any)?.applicationRequirements?.financial_requirements.financial_statements_required.slice(0, 3).map((stmt: any, idx: number) => (
                  <div key={idx} className="text-white/80">
                    • {typeof stmt === 'string' ? stmt.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : stmt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Eligible Costs */}
          {((selectedProgram as any)?.use_of_funds !== undefined || (selectedProgram as any)?.useOfFunds !== undefined || (selectedProgram as any)?.requirements !== undefined || getEligibleCosts().length > 0) && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h4 className="text-white font-bold text-sm">{t('editor.desktop.program.summary.eligibleCosts')}</h4>
              </div>
              <div className="border-b border-white/10 my-2"></div>
              
              <div className="ml-4 grid grid-cols-2 gap-2">
                {((selectedProgram as any)?.use_of_funds || (selectedProgram as any)?.useOfFunds || (selectedProgram as any)?.requirements || getEligibleCosts() || []).map((cost: any, idx: number) => (
                  <div key={idx} className="text-xs text-white/80 flex items-center gap-1">
                    <span>✓</span>
                    <span>{typeof cost === 'string' ? cost.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : (cost.title || cost.name || cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Additional Requirements */}
          {((selectedProgram as any)?.requirements !== undefined || (selectedProgram as any)?.applicationRequirements?.sections !== undefined || (selectedProgram as any)?.delivery_requirements !== undefined || (selectedProgram as any)?.deliverables !== undefined) && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧩</span>
                <h4 className="text-white font-bold text-sm">{t('editor.desktop.program.summary.additionalRequirements')}</h4>
              </div>
              <div className="border-b border-white/10"></div>
              
              <div className="ml-4 space-y-2 text-xs">
                {Array.isArray((selectedProgram as any)?.requirements) &&
                (selectedProgram as any)?.requirements.map((req: any, idx: number) => (
                  <div key={idx} className="text-white/80">
                    • {typeof req === 'string' ? req : req.title || req.name || `Requirement ${idx + 1}`}
                  </div>
                ))}
                {Array.isArray((selectedProgram as any)?.applicationRequirements?.sections) &&
                (selectedProgram as any)?.applicationRequirements?.sections.slice(0, 3).map((section: any, idx: number) => (
                  <div key={idx} className="text-white/80">
                    • {section.title || `Section ${idx + 1}`}
                  </div>
                ))}
                {Array.isArray((selectedProgram as any)?.deliverables) &&
                (selectedProgram as any)?.deliverables.slice(0, 3).map((req: any, idx: number) => (
                  <div key={idx} className="text-white/80">
                    • {typeof req === 'string' ? req.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : req.title || req.name || `Deliverable ${idx + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

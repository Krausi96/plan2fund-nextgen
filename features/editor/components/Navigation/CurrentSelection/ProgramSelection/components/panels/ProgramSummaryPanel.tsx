import React, { useState } from 'react';
import { useEditorStore, getSectionIcon } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

interface ProgramSummaryPanelProps {
  onClear?: () => void;
}

export function ProgramSummaryPanel({ onClear }: ProgramSummaryPanelProps) {
  const { t } = useI18n();
  const programProfile = useEditorStore((state) => state.setupWizard?.programProfile);
  const programSummary = useEditorStore((state) => state.programSummary);

  // Get program data with fallback chain
  const getProgramName = () => {
    if (programProfile) return programProfile.name;
    if (programSummary) return programSummary.name;
    return 'No program selected';
  };



  const getRequiredDocuments = () => {
    // Only return documents if we actually have program data
    if (!hasProgramData) {
      return [];
    }
    
    // First check programProfile (normalized funding program)
    if (programProfile?.applicationRequirements?.documents?.length) {
      return programProfile.applicationRequirements.documents;
    }
    // Then check programSummary (legacy format)
    if (programSummary?.requiredDocuments?.length) {
      return programSummary.requiredDocuments;
    }
    
    // No fallback - return empty array if no actual documents found
    return [];
  };

  const getKeyRequirements = () => {
    // Only return requirements if we actually have program data
    if (!hasProgramData) {
      return [];
    }
    
    // Check programProfile first (has requirements array)
    if (programProfile?.requirements?.length) {
      // Handle different requirement data formats
      const reqs = programProfile.requirements;
      if (Array.isArray(reqs)) {
        // If it's already an array of strings
        if (typeof reqs[0] === 'string') {
          return reqs;
        }
        // If it's an array of objects, extract meaningful text
        return reqs.map((req: any, index: number) => {
          if (typeof req === 'string') return req;
          if (req.title) return req.title;
          if (req.name) return req.name;
          if (req.description) return req.description;
          if (req.content) return req.content;
          return `Requirement ${index + 1}`;
        });
      }
      // If it's a single object, try to extract requirements
      if (typeof reqs === 'object') {
        const extracted: string[] = [];
        Object.entries(reqs).forEach(([key, value]) => {
          if (key.toLowerCase().includes('require') || key.toLowerCase().includes('must') || key.toLowerCase().includes('should')) {
            extracted.push(`${key}: ${value}`);
          }
        });
        if (extracted.length > 0) return extracted as string[];
      }
      return [];
    }
    // Then check programSummary
    if (programSummary?.keyRequirements?.length) {
      return programSummary.keyRequirements;
    }
    
    // No fallback - return empty array if no actual requirements found
    return [];
  };

  const hasProgramData = !!(programProfile || programSummary);
  
  // Debug logging for panel state
  React.useEffect(() => {
    console.log('🔍 ProgramSummaryPanel DATA DEBUG:', {
      programProfileExists: !!programProfile,
      programProfileName: programProfile?.name,
      programProfileData: programProfile,
      programSummaryExists: !!programSummary,
      programSummaryName: programSummary?.name,
      programSummaryData: programSummary,
      hasProgramData,
      getProgramNameResult: getProgramName(),
      requiredDocumentsCount: getRequiredDocuments().length,
      keyRequirementsCount: getKeyRequirements().length
    });
  }, [programProfile, programSummary, hasProgramData]);
  
  // Force re-render when program data changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    if (hasProgramData) {
      forceUpdate();
    }
  }, [hasProgramData, programProfile, programSummary]);
  
  // Debug logs to see what data is available
  React.useEffect(() => {
    const keyReqs = getKeyRequirements();
    console.log('🔍 ProgramSummaryPanel RENDER TRIGGERED:', {
      timestamp: new Date().toISOString(),
      hasProgramData,
      programProfileExists: !!programProfile,
      programSummaryExists: !!programSummary,
      programProfileName: programProfile?.name,
      programSummaryName: programSummary?.name,
      programProfileData: programProfile ? {
        id: programProfile.id,
        name: programProfile.name,
        hasApplicationRequirements: !!programProfile.applicationRequirements,
        hasRequirementsArray: !!programProfile.requirements,
        requirementsArray: programProfile.requirements,
        documents: programProfile.applicationRequirements?.documents,
        sections: programProfile.applicationRequirements?.sections,
        financialRequirements: programProfile.applicationRequirements?.financialRequirements,
        documentsCount: programProfile.applicationRequirements?.documents?.length || 0,
        sectionsCount: programProfile.applicationRequirements?.sections?.length || 0
      } : null,
      programSummaryData: programSummary ? {
        id: programSummary.id,
        name: programSummary.name,
        hasRequiredDocuments: !!programSummary.requiredDocuments,
        hasKeyRequirements: !!programSummary.keyRequirements,
        requiredDocuments: programSummary.requiredDocuments,
        keyRequirements: programSummary.keyRequirements,
        documentsCount: programSummary.requiredDocuments?.length || 0
      } : null,
      extractedKeyRequirements: keyReqs,
      keyRequirementsCount: keyReqs.length,
      firstFewRequirements: keyReqs.slice(0, 5)
    });
    
    // Log the actual requirements content
    if (keyReqs.length > 0) {
      console.log('📋 ACTUAL REQUIREMENTS CONTENT:', keyReqs);
    }
  }, [hasProgramData, programProfile, programSummary]);

  // Get document structure from store
  const documentStructure = useEditorStore((state) => state.setupWizard.documentStructure);
  
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">📄</span>
            </div>
            <h3 className="text-white font-bold text-lg">{t('editor.desktop.program.panels.programSummary')}</h3>
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
                    <span className="truncate flex-1">
                      {programSummary?.name || programProfile?.name || 'Program Document'}
                    </span>
                  </div>
                  
                  {/* Program Sections */}
                  <div className="ml-6 border-l-2 border-blue-500/30 pl-3 max-h-[1000px]">
                    <div className="space-y-2 py-1">
                      {/* Actual Program Sections - dynamically rendered with proper icons */}
                      {documentStructure.sections && documentStructure.sections.length > 0 ? (
                        documentStructure.sections.map((section: any, idx: number) => {
                          const sectionId = section.id || idx;
                          const sectionTitle = section.title || section.name || section;
                          const icon = getSectionIcon(sectionId);
                          
                          return (
                            <div key={idx} className="text-blue-200 text-sm flex items-center gap-2 truncate" title={sectionTitle}>
                              <span>{icon}</span>
                              <span className="truncate flex-1">
                                {t(`editor.section.${sectionId}` as any) !== `editor.section.${sectionId}` ? t(`editor.section.${sectionId}` as any) : sectionTitle}
                              </span>
                              {section.required && (
                                <span className="text-red-400 font-bold flex-shrink-0">*</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-blue-200 text-sm flex items-center gap-2">
                          <span>No sections defined</span>
                        </div>
                      )}
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
                            {/* Show main document sections excluding special sections that should appear elsewhere */}
                            {documentStructure.sections
                              .filter((section: any) => 
                                section.documentId === doc.id && 
                                ![APPENDICES_SECTION_ID, REFERENCES_SECTION_ID, TABLES_DATA_SECTION_ID, FIGURES_IMAGES_SECTION_ID].includes(section.id)
                              )
                              .map((section: any, idx: number) => (
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
                        {/* References */}
                        {documentStructure.sections.some((section: any) => section.id === REFERENCES_SECTION_ID) && (
                          <div className="flex items-center gap-2 text-blue-200 text-sm">
                            <span>📚</span>
                            <span className="font-semibold">
                              {t('editor.section.references' as any) !== 'editor.section.references' ? t('editor.section.references' as any) : 'References'}
                            </span>
                          </div>
                        )}
                        
                        {/* Tables/Data */}
                        {documentStructure.sections.some((section: any) => section.id === TABLES_DATA_SECTION_ID) && (
                          <div className="flex items-center gap-2 text-blue-200 text-sm">
                            <span>📊</span>
                            <span className="font-semibold">
                              {t('editor.section.tablesData' as any) !== 'editor.section.tablesData' ? t('editor.section.tablesData' as any) : 'Tables and Data'}
                            </span>
                          </div>
                        )}
                        
                        {/* Figures/Images */}
                        {documentStructure.sections.some((section: any) => section.id === FIGURES_IMAGES_SECTION_ID) && (
                          <div className="flex items-center gap-2 text-blue-200 text-sm">
                            <span>🖼️</span>
                            <span className="font-semibold">
                              {t('editor.section.figuresImages' as any) !== 'editor.section.figuresImages' ? t('editor.section.figuresImages' as any) : 'Figures and Images'}
                            </span>
                          </div>
                        )}
                      </div>
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
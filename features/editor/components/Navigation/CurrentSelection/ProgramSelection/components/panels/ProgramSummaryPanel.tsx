import React from 'react';
import { useEditorStore, getSectionIcon } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

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

  const getFundingType = () => {
    if (programProfile) return programProfile.fundingTypes?.join(', ') || 'N/A';
    if (programSummary) return programSummary.type || 'N/A';
    return 'N/A';
  };

  const getRegion = () => {
    if (programProfile) return programProfile.region || 'N/A';
    return 'N/A';
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
  
  // Get documents and sections from document structure
  const documents = documentStructure?.documents || [];
  const sections = documentStructure?.sections || [];
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Improved Header with Action Buttons */}
      <div className="mb-4">
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
          <>
            <h4 className="text-white font-semibold text-base mb-2 truncate" title={getProgramName()}>
              Program: {getProgramName()}
            </h4>
            <div className="w-full h-px bg-white my-1"></div>
            <div className="space-y-3">
              <div className="text-white/80 text-sm">📜 Funding Type: {getFundingType()}</div>
              <div className="text-white/80 text-sm">🌎 Region: {getRegion()}</div>
            </div>
            <div className="w-full h-px bg-white/20 my-1"></div>
          </>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">📋</div>
            <p className="text-white/80 text-sm">
              {t('requirementsChecker.selectProgram')}
            </p>
          </div>
        )}
      </div>

      {/* Show document structure when available */}
      {hasProgramData && documentStructure && (
        <div className="space-y-3 mt-2">
          <div className="text-white font-semibold text-sm border-b border-white/20 pb-1">Documents & Structure:</div>
          
          {/* Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <div className="text-white/70 text-xs uppercase tracking-wide">Documents ({documents.length}):</div>
              <div className="space-y-1 ml-2">
                {documents.map((doc, index) => (
                  <div key={doc.id} className="flex items-center gap-2 text-white/90 text-sm">
                    <span className="text-blue-400">📄</span>
                    <span className="truncate">{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sections List */}
          {sections.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-white/70 text-xs uppercase tracking-wide">Sections ({sections.length}):</div>
              <div className="space-y-1 ml-2 max-h-40 overflow-y-auto">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center gap-2 text-white/80 text-sm">
                    <span className="text-red-400">{getSectionIcon(section.id)}</span>
                    <span className="truncate">{section.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${section.required ? 'bg-red-500/30 text-red-300' : 'bg-gray-500/30 text-gray-300'}`}>
                      {section.required ? 'Req' : 'Opt'}
                    </span>
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
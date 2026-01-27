import React, { useState } from 'react';
import { useConfiguratorState, useEditorStore } from '@/features/editor/lib';

interface BlueprintPanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
}

export function BlueprintPanel({ onGenerate, onEdit, onClear }: BlueprintPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const configuratorState = useConfiguratorState();
  const setupWizard = useEditorStore((state) => state.setupWizard);
  
  // Get document setup data from state
  const documentStructure = setupWizard.documentStructure || null;
  
  // Debug logging
  React.useEffect(() => {
    console.log('📊 BlueprintPanel state update:', {
      hasDocumentStructure: !!documentStructure,
      documentCount: documentStructure?.documents?.length || 0,
      sectionCount: documentStructure?.sections?.length || 0,
      setupStatus: setupWizard.setupStatus,
      programProfile: !!setupWizard.programProfile
    });
  }, [documentStructure, setupWizard]);
  const programSummary = configuratorState.programSummary;
  const setupDiagnostics = setupWizard.setupDiagnostics;
  
  const getSourceDisplay = () => {
    if (documentStructure?.source) return documentStructure.source;
    if (programSummary?.source) return programSummary.source;
    if (programSummary) return 'program';
    return 'none';
  };

  const getStatusDisplay = () => {
    if (setupWizard.setupStatus) return setupWizard.setupStatus;
    if (programSummary?.setupStatus) return programSummary.setupStatus;
    if (programSummary) return 'draft';
    return 'none';
  };

  const getDocumentCount = () => {
    if (documentStructure?.documents) return documentStructure.documents.length;
    if (programSummary?.requiredDocuments) return programSummary.requiredDocuments.length;
    return documentStructure ? 1 : 0; // Default business plan
  };

  const getSectionCount = () => {
    if (documentStructure?.sections) return documentStructure.sections.length;
    if (programSummary?.requiredSections) return programSummary.requiredSections.length;
    return documentStructure ? 4 : 0; // Default sections
  };

  const getConfidenceScore = () => {
    if (setupDiagnostics?.confidence !== undefined) return setupDiagnostics.confidence;
    if (documentStructure?.confidenceScore !== undefined) return documentStructure.confidenceScore;
    if (programSummary?.setupDiagnostics?.confidence) return programSummary.setupDiagnostics.confidence;
    return programSummary ? 75 : 0; // Default confidence
  };

  const getWarningCount = () => {
    if (setupDiagnostics?.warnings) return setupDiagnostics.warnings.length;
    if (documentStructure?.warnings) return documentStructure.warnings.length;
    if (programSummary?.setupDiagnostics?.warnings) return programSummary.setupDiagnostics.warnings.length;
    return 0;
  };

  const getRequirementsCount = () => {
    if (documentStructure?.requirements) return documentStructure.requirements.length;
    return programSummary?.requirementSchemas?.length || 0;
  };

  const getValidationRulesCount = () => {
    if (documentStructure?.validationRules) return documentStructure.validationRules.length;
    return programSummary?.validationRules?.length || 0;
  };

  const hasCriticalWarnings = () => {
    const warnings = setupDiagnostics?.warnings || 
                    documentStructure?.warnings || 
                    programSummary?.setupDiagnostics?.warnings || [];
    return warnings.some((warning: string) => 
      warning.toLowerCase().includes('critical') || 
      warning.toLowerCase().includes('missing') ||
      warning.toLowerCase().includes('required')
    );
  };

  const getProgramName = () => {
    if (documentStructure) return documentStructure.structureId;
    if (programSummary) return programSummary.name;
    return 'No program selected';
  };

  const getVersion = () => {
    if (documentStructure) return documentStructure.version;
    if (setupWizard.setupVersion) return setupWizard.setupVersion;
    return '1.0';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getUpdatedAt = () => {
    if (documentStructure?.updatedAt) return formatDate(documentStructure.updatedAt);
    return 'Just now';
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Group sections by document
  const getSectionsByDocument = () => {
    if (!documentStructure?.sections) return {};
    
    const grouped: Record<string, any[]> = {};
    documentStructure.sections.forEach(section => {
      const docId = section.documentId || 'main_document';
      if (!grouped[docId]) {
        grouped[docId] = [];
      }
      grouped[docId].push(section);
    });
    return grouped;
  };

  // Mock unmapped headings (in a real implementation, this would come from analysis)
  const getUnmappedHeadings = () => {
    return [
      { text: 'Appendix A: Financial Statements', confidence: 45 },
      { text: 'Team Bios', confidence: 30 },
      { text: 'Market Research Data', confidence: 65 }
    ];
  };

  const sectionsByDoc = getSectionsByDocument();
  const unmappedHeadings = getUnmappedHeadings();

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">📋</span>
          </div>
          <h3 className="text-white font-bold text-lg">Document Setup</h3>
          <span className="ml-auto px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
            v{getVersion()}
          </span>
        </div>
        <p className="text-white/70 text-sm truncate" title={getProgramName()}>
          {getProgramName()}
        </p>
        <p className="text-white/50 text-xs mt-1">
          Updated: {getUpdatedAt()}
        </p>
      </div>

      {/* Blueprint Status */}
      <div className="space-y-3 mb-4 flex-1">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">Source</span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full capitalize">
              {getSourceDisplay()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Status</span>
            <span className={`px-2 py-1 text-xs rounded-full capitalize ${
              getStatusDisplay() === 'confirmed' ? 'bg-green-500/20 text-green-300' :
              getStatusDisplay() === 'draft' ? 'bg-yellow-500/20 text-yellow-300' :
              getStatusDisplay() === 'locked' ? 'bg-purple-500/20 text-purple-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {getStatusDisplay()}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-blue-300 text-sm font-medium">Documents</div>
            <div className="text-white text-lg font-bold">{getDocumentCount()}</div>
            <div className="text-white/60 text-xs">required</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-green-300 text-sm font-medium">Sections</div>
            <div className="text-white text-lg font-bold">{getSectionCount()}</div>
            <div className="text-white/60 text-xs">required</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-purple-300 text-sm font-medium">Requirements</div>
            <div className="text-white text-lg font-bold">{getRequirementsCount()}</div>
            <div className="text-white/60 text-xs">defined</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-orange-300 text-sm font-medium">Validation</div>
            <div className="text-white text-lg font-bold">{getValidationRulesCount()}</div>
            <div className="text-white/60 text-xs">rules</div>
          </div>
        </div>

        {/* Tree Structure Preview */}
        {documentStructure && (
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <span>🌳</span>
                Structure Tree
              </h4>
              <span className="text-white/60 text-xs">
                {Object.keys(sectionsByDoc).length} documents
              </span>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {documentStructure.documents.map(doc => (
                <div key={doc.id} className="border-l-2 border-blue-400 pl-2">
                  <div 
                    className="flex items-center justify-between py-1 cursor-pointer hover:bg-white/5 rounded px-1"
                    onClick={() => toggleSection(doc.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-300">📄</span>
                      <span className="text-white text-sm font-medium">{doc.name}</span>
                      <span className="text-white/60 text-xs">
                        ({sectionsByDoc[doc.id]?.length || 0} sections)
                      </span>
                    </div>
                    <span className="text-white/60 text-xs">
                      {doc.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  
                  {expandedSections[doc.id] && sectionsByDoc[doc.id] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {sectionsByDoc[doc.id].map(section => (
                        <div key={section.id} className="flex items-center gap-2 py-1">
                          <span className="text-green-400 text-xs">└─</span>
                          <span className={`text-xs ${
                            section.required ? 'text-white font-medium' : 'text-white/70'
                          }`}>
                            {section.title}
                          </span>
                          {section.programCritical && (
                            <span className="px-1 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                              Critical
                            </span>
                          )}
                          <span className={`ml-auto text-xs ${
                            section.type === 'required' ? 'text-green-400' :
                            section.type === 'optional' ? 'text-yellow-400' : 'text-purple-400'
                          }`}>
                            {section.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mapping Confidence */}
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-3">
          <h4 className="text-indigo-200 font-medium mb-3 flex items-center gap-2">
            <span>🎯</span>
            Mapping Confidence
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-indigo-300 text-sm">Overall Structure</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      getConfidenceScore() >= 80 ? 'bg-green-500' :
                      getConfidenceScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${getConfidenceScore()}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium w-8 text-right">
                  {getConfidenceScore()}%
                </span>
              </div>
            </div>
            
            {documentStructure?.sections && (
              <div className="pt-2 border-t border-indigo-700/30">
                <div className="text-indigo-300 text-sm mb-2">Section Mapping</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-white/80">Mapped: {documentStructure.sections.filter(s => s.type !== 'unmapped').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-white/80">Unmapped: {documentStructure.sections.filter(s => s.type === 'unmapped').length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unmapped Headings */}
        {unmappedHeadings.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
            <h4 className="text-amber-200 font-medium mb-3 flex items-center gap-2">
              <span>❓</span>
              Unmapped Headings
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {unmappedHeadings.map((heading, index) => (
                <div key={index} className="flex items-center justify-between bg-amber-800/20 rounded p-2">
                  <div className="flex-1">
                    <div className="text-amber-100 text-sm truncate" title={heading.text}>
                      {heading.text}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          heading.confidence >= 60 ? 'bg-green-500' :
                          heading.confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${heading.confidence}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium w-8 text-right ${
                      heading.confidence >= 60 ? 'text-green-300' :
                      heading.confidence >= 40 ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {heading.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2 text-amber-300 text-xs">
              These headings couldn't be automatically mapped to program requirements
            </div>
          </div>
        )}

        {/* Confidence & Warnings */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    getConfidenceScore() >= 80 ? 'bg-green-500' :
                    getConfidenceScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${getConfidenceScore()}%` }}
                ></div>
              </div>
              <span className="text-white font-medium w-8 text-right">
                {getConfidenceScore()}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Warnings</span>
            <span className={`${getWarningCount() > 0 ? (hasCriticalWarnings() ? 'text-red-400' : 'text-orange-400') : 'text-green-400'} font-medium`}>
              {getWarningCount()}
            </span>
          </div>
        </div>

        {/* Warnings List (if any) */}
        {(setupDiagnostics?.warnings && setupDiagnostics.warnings.length > 0 || 
          documentStructure?.warnings && documentStructure.warnings.length > 0) && (
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-sm">⚠️</span>
              <span className="text-amber-300 text-sm font-medium">Warnings</span>
            </div>
            <ul className="text-amber-200 text-xs space-y-1 max-h-20 overflow-y-auto">
              {[...(setupDiagnostics?.warnings || []), ...(documentStructure?.warnings || [])].slice(0, 3).map((warning, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{warning}</span>
                </li>
              ))}
              {([...(setupDiagnostics?.warnings || []), ...(documentStructure?.warnings || [])].length > 3) && (
                <li className="text-amber-400/80 italic">+{[...(setupDiagnostics?.warnings || []), ...(documentStructure?.warnings || [])].length - 3} more warnings</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onGenerate}
            disabled={!programSummary && !documentStructure}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>🔄</span>
            <span>Regenerate</span>
          </button>
          <button
            onClick={onEdit}
            disabled={!documentStructure}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
          <button
            onClick={onClear}
            disabled={!documentStructure && !programSummary}
            className="px-3 py-2 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <span>🗑️</span>
            <span>Clear</span>
          </button>
        </div>
        
        {/* Status indicator */}
        <div className="mt-3 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            getStatusDisplay() === 'confirmed' ? 'bg-green-500/20 text-green-300' :
            getStatusDisplay() === 'draft' ? 'bg-yellow-500/20 text-yellow-300' :
            getStatusDisplay() === 'locked' ? 'bg-purple-500/20 text-purple-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              getStatusDisplay() === 'confirmed' ? 'bg-green-400' :
              getStatusDisplay() === 'draft' ? 'bg-yellow-400' :
              getStatusDisplay() === 'locked' ? 'bg-purple-400' : 'bg-gray-400'
            }`}></div>
            {getStatusDisplay() === 'confirmed' ? 'Ready for export' :
             getStatusDisplay() === 'draft' ? 'Draft - needs review' :
             getStatusDisplay() === 'locked' ? 'Locked - finalized' :
             'No document structure'}
          </div>
        </div>
      </div>
    </div>
  );
}
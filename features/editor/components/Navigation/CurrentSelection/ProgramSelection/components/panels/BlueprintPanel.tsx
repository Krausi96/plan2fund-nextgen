import React from 'react';
import { useConfiguratorState, useEditorStore } from '@/features/editor/lib';

interface BlueprintPanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
}

export function BlueprintPanel({ onGenerate, onEdit, onClear }: BlueprintPanelProps) {

  const configuratorState = useConfiguratorState();
  const setupWizard = useEditorStore((state) => state.setupWizard);
  
  // Get document setup data from state
  const documentStructure = setupWizard.documentStructure || null;
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
import React from 'react';
import { useConfiguratorState, useEditorStore } from '@/features/editor/lib';

interface ProgramSummaryPanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
}

export function ProgramSummaryPanel({ onGenerate, onEdit, onClear }: ProgramSummaryPanelProps) {
  const configuratorState = useConfiguratorState();
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const programProfile = setupWizard.programProfile;
  const programSummary = configuratorState.programSummary;

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
    if (programProfile?.applicationRequirements?.documents) 
      return programProfile.applicationRequirements.documents;
    if (programSummary?.requiredDocuments) 
      return programSummary.requiredDocuments;
    return [];
  };

  const getRequiredSections = () => {
    if (programProfile?.applicationRequirements?.sections) 
      return programProfile.applicationRequirements.sections;
    if (programSummary?.requiredSections) 
      return programSummary.requiredSections;
    return [];
  };

  const getKeyRequirements = () => {
    if (programProfile?.requirements) return programProfile.requirements;
    if (programSummary?.keyRequirements) return programSummary.keyRequirements;
    return [];
  };

  const hasProgramData = programProfile || programSummary;

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
            <div className="space-y-1">
              <div className="text-white/80 text-sm">📜 Funding Type: {getFundingType()}</div>
              <div className="text-white/80 text-sm">🌎 Region: {getRegion()}</div>
            </div>
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
            
            <div className="space-y-3 ml-2">
              {getRequiredDocuments().map((doc: any, docIndex: number) => (
                <div key={docIndex}>
                  <div className="flex items-center gap-2 text-white font-medium mb-2">
                    <span className="text-blue-300">🧾</span>
                    <span className="truncate" title={doc.name || doc.document_name || doc}>
                      {doc.name || doc.document_name || doc}
                    </span>
                    {doc.required !== undefined && doc.required && (
                      <span className="text-red-400 font-bold">*</span>
                    )}
                  </div>
                  
                  {/* Nested Sections under Document */}
                  <div className="ml-6 space-y-2 border-l-2 border-white/20 pl-3">
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
              ))}
              
              {getRequiredDocuments().length === 0 && (
                <div className="text-white/60 text-sm italic text-center py-2">No documents specified</div>
              )}
            </div>
          </div>
            
          {/* Key Requirements */}
          {getKeyRequirements().length > 0 && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-300 text-lg">⚠️</span>
                <h4 className="text-amber-200 font-semibold text-base">Key Requirements</h4>
              </div>
              <ul className="space-y-2">
                {getKeyRequirements().slice(0, 4).map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-amber-100 text-sm">
                    <span className="mt-1.5 flex-shrink-0">•</span>
                    <span className="truncate" title={req}>{req}</span>
                  </li>
                ))}
                {getKeyRequirements().length > 4 && (
                  <li className="text-amber-400 text-sm italic text-center pt-2">+{getKeyRequirements().length - 4} more requirements</li>
                )}
              </ul>
            </div>
          )}
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
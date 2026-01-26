import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useConfiguratorState, useEditorStore } from '@/features/editor/lib';

interface BlueprintPanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
}

export function BlueprintPanel({ onGenerate, onEdit, onClear }: BlueprintPanelProps) {
  const { t } = useI18n();
  const configuratorState = useConfiguratorState();
  const setupWizard = useEditorStore((state) => state.setupWizard);
  
  // Get blueprint data from state (will be extended later)
  const blueprint = setupWizard.blueprint || null;
  const programSummary = configuratorState.programSummary;
  
  const getSourceDisplay = () => {
    if (blueprint?.source) return blueprint.source;
    if (programSummary) return 'program';
    return 'none';
  };

  const getStatusDisplay = () => {
    if (setupWizard.blueprintStatus) return setupWizard.blueprintStatus;
    if (programSummary) return 'draft';
    return 'none';
  };

  const getDocumentCount = () => {
    if (blueprint?.documents) return blueprint.documents.length;
    if (programSummary?.requiredDocuments) return programSummary.requiredDocuments.length;
    return 0;
  };

  const getSectionCount = () => {
    if (blueprint?.sections) return blueprint.sections.length;
    if (programSummary?.requiredSections) return programSummary.requiredSections.length;
    return 0;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">📋</span>
          </div>
          <h3 className="text-white font-bold text-lg">Blueprint</h3>
        </div>
        <p className="text-white/70 text-sm">
          {t('editor.desktop.program.blueprint.panelDescription' as any) || 'Current document structure and requirements'}
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
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full capitalize">
              {getStatusDisplay()}
            </span>
          </div>
        </div>

        {/* Metrics */}
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
        </div>

        {/* Confidence & Warnings */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">Confidence</span>
            <span className="text-white font-medium">--%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-sm">Warnings</span>
            <span className="text-orange-400 font-medium">0</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onGenerate}
            disabled={!programSummary && !blueprint}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
          >
            Generate
          </button>
          <button
            onClick={onEdit}
            disabled={!blueprint}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onClear}
            disabled={!blueprint && !programSummary}
            className="px-3 py-2 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
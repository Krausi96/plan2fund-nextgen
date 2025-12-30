import React, { useState } from 'react';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';

import { useConfiguratorState, useEditorActions, useEditorStore } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type CurrentSelectionProps = {
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * CurrentSelection component
 * Inline expandable configuration panel
 * Shows compact badges when collapsed, expands to full-width panel inline
 */
function CurrentSelection({}: CurrentSelectionProps) {
  const { t } = useI18n();
  const { selectedProductMeta, programSummary } = useConfiguratorState();
  // Removed unused section/document counts since we're now showing ReadinessCheck and MyProject instead of stats
  const isConfiguratorOpen = useEditorStore((state) => state.isConfiguratorOpen);
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));

  // No overlay positioning needed - inline expansion

  // Translations
  const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'No selection';
  const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'No program';
  // Removed sectionsLabel and documentsLabel since we're no longer showing those stats

  // Track active navigation tab
  const [activeTab, setActiveTab] = useState<'product' | 'program'>('product');

  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Compact info row - shows current selections nicely distributed
  const CompactInfoRow = () => {
    const hasSelections = !!selectedProductMeta;

    // Always show the panel with 4-column layout
    return (
      <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-3 py-2 text-white shadow-lg w-full">
        {/* Header with Start/Edit button - aligned with DocumentsBar and Sidebar separators */}
        <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
          <h3 className="text-base font-bold uppercase tracking-wide text-white">
            {t('editor.desktop.selection.current' as any) || 'Aktuelle Auswahl'}
          </h3>
          <button
            onClick={handleToggle}
            className={`px-3 py-2 text-sm font-bold rounded flex items-center gap-1.5 transition-all ${
              hasSelections
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {hasSelections ? (
              <>
                <span>⚙️</span>
                <span>{t('editor.desktop.selection.edit' as any) || 'Edit'}</span>
              </>
            ) : (
              <>
                <span>✏️</span>
                <span>{t('editor.desktop.selection.start' as any) || 'Start'}</span>
              </>
            )}
          </button>
        </div>

        {/* Cards in vertical layout - stacked instead of horizontal */}
        <div className="flex flex-col gap-2 text-xs pt-2">
          {/* Card 1: My Project */}
          <div className="min-w-0 border-b border-white/10 pb-2">
            <MyProject />
          </div>

          {/* Card 2: Product */}
          <div className="min-w-0 border-b border-white/10 pb-2">
            <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
              {t('editor.desktop.selection.productLabel' as any) || 'Product'}
            </div>
            <div className="flex items-start gap-1.5">
              {selectedProductMeta?.icon && (
                <span className="text-sm leading-none flex-shrink-0">{selectedProductMeta.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm leading-snug truncate" title={selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : noSelectionCopy}>
                  {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : noSelectionCopy}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Program */}
          <div className="min-w-0 border-b border-white/10 pb-2">
            <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
              {t('editor.desktop.selection.programLabel' as any) || 'Program'}
            </div>
            <div className="text-white font-semibold text-sm leading-snug truncate" title={programSummary?.name || noProgramCopy}>
              {programSummary?.name || noProgramCopy}
            </div>
          </div>

          {/* Card 4: Readiness Check */}
          <div className="min-w-0">
            <ReadinessCheck />
          </div>
        </div>
      </div>
    );
  };

  // Simple inline expansion - no portal, just expands downward with absolute positioning
  const InlineExpansion = () => {
    if (!isConfiguratorOpen) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 z-50 w-full">
        {/* Expanded panel */}
        <div className="rounded-lg border-2 border-blue-400 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/20 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {t('editor.desktop.selection.current' as any) || 'Configure Selection'}
            </h3>
            <button
              onClick={handleToggle}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* 2-Column Layout: Navigation | Content */}
          <div className="grid grid-cols-[180px_1fr] gap-0">
            {/* Left: Navigation Tabs */}
            <div className="border-r border-white/20 py-3">
              <button
                onClick={() => setActiveTab('product')}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                  activeTab === 'product'
                    ? 'bg-blue-600/30 text-white border-l-2 border-blue-400'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="mr-2">📦</span>
                {t('editor.desktop.config.step1.title' as any) || 'Product'}
                {selectedProductMeta && <span className="ml-2 text-xs text-green-400">✓</span>}
              </button>
              <button
                onClick={() => setActiveTab('program')}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                  activeTab === 'program'
                    ? 'bg-blue-600/30 text-white border-l-2 border-blue-400'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="mr-2">🎯</span>
                {t('editor.desktop.config.step2.title' as any) || 'Program'}
                {programSummary && <span className="ml-2 text-xs text-green-400">✓</span>}
              </button>
            </div>

            {/* Right: Active Content */}
            <div className="px-4 py-3">
              <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                {activeTab === 'product' && <ProductSelection />}
                {activeTab === 'program' && <ProgramSelection />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <CompactInfoRow />
      <InlineExpansion />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);

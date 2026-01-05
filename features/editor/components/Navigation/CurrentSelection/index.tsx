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

  // Compact info row - shows current selections with improved layout
  const CompactInfoRow = () => {
    const hasSelections = !!selectedProductMeta || !!programSummary;

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

        {/* Improved layout with better spacing */}
        <div className="flex flex-col gap-2 text-xs pt-2">
          {/* My Project and Readiness Check side by side */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0 border-b border-white/10 pb-2">
              <MyProject />
            </div>
            <div className="flex-1 min-w-0 border-b border-white/10 pb-2">
              <ReadinessCheck />
            </div>
          </div>
          
          {/* Product and Program side by side */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0 border-b border-white/10 pb-2">
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
            
            <div className="flex-1 min-w-0 border-b border-white/10 pb-2">
              <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
                {t('editor.desktop.selection.programLabel' as any) || 'Program'}
              </div>
              <div className="text-white font-semibold text-sm leading-snug truncate" title={programSummary?.name || noProgramCopy}>
                {programSummary?.name || noProgramCopy}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Simple inline expansion with horizontal tabs - no portal, just expands downward with absolute positioning
  const InlineExpansion = () => {
    if (!isConfiguratorOpen) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 z-50 w-full">
        {/* Expanded panel */}
        <div className="rounded-lg border-2 border-blue-400 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {t('editor.desktop.selection.current' as any) || 'Configure Selection'}
            </h3>
            <button
              onClick={handleToggle}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ×
            </button>
          </div>
          
          {/* Horizontal Tabs */}
          <div className="flex border-b border-white/20 bg-slate-800">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>📦</span>
              {t('editor.desktop.config.step1.title' as any) || 'Product'}
              {selectedProductMeta && <span className="ml-1 text-xs text-green-400">✓</span>}
            </button>
            <button
              onClick={() => setActiveTab('program')}
              className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'program'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>🎯</span>
              {t('editor.desktop.config.step2.title' as any) || 'Program'}
              {programSummary && <span className="ml-1 text-xs text-green-400">✓</span>}
            </button>
          </div>

          {/* Dynamic height content area - no fixed height limit */}
          <div className="p-4 bg-slate-800/50 max-h-[60vh]">
            <div className="overflow-y-auto">
              {activeTab === 'product' && <ProductSelection />}
              {activeTab === 'program' && <ProgramSelection />}
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
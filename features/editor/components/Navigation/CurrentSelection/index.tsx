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
  // Removed unused translations since we're no longer showing sections/documents stats

  // Track active navigation tab
  const [activeTab, setActiveTab] = useState<'product' | 'program'>('product');
  


  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Compact info row - shows current selections with improved layout
  const CompactInfoRow = () => {
    const hasSelections = !!selectedProductMeta || !!programSummary;

    return (
      <div className="flex flex-col bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-0 py-0 text-white w-full">
        {/* SINGLE-LINE HEADER WITH ALL ELEMENTS INLINE - Reduced spacing */}
        <div className="flex flex-col px-4 py-1">
          {/* First Line - Header with Action Button and Selection Info */}
          <div className="flex items-center justify-between">
            {/* Current Selection Label - Left side */}
            <div className="text-white font-bold text-lg whitespace-nowrap">
              {t('editor.desktop.selection.current' as any) || 'Aktuelle Auswahl:'}
            </div>
            
            {/* All 4 Parameters - Perfectly even distribution - Takes remaining space */}
            <div className="grid grid-cols-4 gap-5 text-[11px] flex-grow max-w-3xl">
                {/* Mein Projekt */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-white/60 font-medium text-[9px] whitespace-nowrap mb-0.5">Mein Projekt</span>
                  <div className="text-white font-medium w-full">
                    <MyProject />
                  </div>
                </div>
                
                {/* PLAN - Core Products with Icons */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-white/60 font-medium text-[9px] whitespace-nowrap mb-0.5">PLAN</span>
                  <div className="flex items-center justify-center gap-1 w-full">
                    {selectedProductMeta?.icon && (
                      <span className="text-sm leading-none flex-shrink-0">{selectedProductMeta.icon}</span>
                    )}
                    <span className="text-white font-medium truncate">
                      {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : 'No plan'}
                    </span>
                  </div>
                </div>
                
                {/* Programm/Vorlage - Actual Programs */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-white/60 font-medium text-[9px] whitespace-nowrap mb-0.5">
                    Programm
                  </span>
                  <span className="text-white font-medium truncate w-full">
                    {programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'}
                  </span>
                </div>
                
                {/* Readiness Check */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-white/60 font-medium text-[9px] whitespace-nowrap mb-0.5">Readiness</span>
                  <div className="text-white font-medium w-full flex justify-center">
                    <ReadinessCheck />
                  </div>
                </div>
              </div>
            
            {/* Action Button - Right side */}
            <button
              onClick={handleToggle}
              className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
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
          
          {/* Separation Line - Reduced margins */}
          <div className="border-b border-white/50 mt-1 mb-0.5"></div>
          

        </div>
      </div>
    );
  };

  // Simple inline expansion with horizontal tabs - full-width expansion below header
  const InlineExpansion = () => {
    if (!isConfiguratorOpen) return null;

    return (
      <div className="mt-4 w-full">
        {/* Expanded panel */}
        <div className="rounded-lg border-2 border-blue-400 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975">
            <h2 className="text-lg font-bold uppercase tracking-wide text-white">
              {t('editor.desktop.selection.current' as any) || 'Configure Selection'}
            </h2>
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
              className={`flex-1 px-6 py-4 text-center text-base font-medium transition-colors flex items-center justify-center gap-2 ${
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
              className={`flex-1 px-6 py-4 text-center text-base font-medium transition-colors flex items-center justify-center gap-2 ${
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
          <div className="p-6 bg-slate-800/50 max-h-[60vh]">
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
    <div className="w-full">
      <CompactInfoRow />
      <InlineExpansion />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);
import React, { useState } from 'react';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import SectionsDocumentsManagement from './SectionsDocumentsManagement/SectionsDocumentsManagement';
import { useConfiguratorState, useEditorActions, useEditorStore, useSectionsAndDocumentsCounts, useDocumentsBarState, type DocumentTemplate } from '@/features/editor/lib';
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
  const { enabledSectionsCount, totalSectionsCount, enabledDocumentsCount, totalDocumentsCount } = useSectionsAndDocumentsCounts();
  const { clickedDocumentId, documents, disabledDocuments, actions: docActions } = useDocumentsBarState();
  const isConfiguratorOpen = useEditorStore((state) => state.isConfiguratorOpen);
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));

  // No overlay positioning needed - inline expansion

  // Translations
  const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'No selection';
  const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'No program';
  const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'Sections';
  const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'Documents';

  // Track active navigation tab
  const [activeTab, setActiveTab] = useState<'product' | 'program' | 'sections'>('product');

  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Compact info row - shows current selections nicely distributed
  const CompactInfoRow = () => {
    const hasSelections = !!selectedProductMeta;

    // Always show the panel with 4-column layout
    return (
      <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-4 py-3 text-white shadow-lg w-full">
        {/* Header with Start/Edit button */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
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

        {/* Cards in one row - 4 columns: Product | Program | Sections | Documents */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          {/* Card 1: Product */}
          <div className="flex items-start gap-1.5 min-w-0">
            {selectedProductMeta?.icon && (
              <span className="text-sm leading-none flex-shrink-0">{selectedProductMeta.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
                {t('editor.desktop.selection.productLabel' as any) || 'Product'}
              </div>
              <div className="text-white font-semibold text-sm leading-snug truncate" title={selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : noSelectionCopy}>
                {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : noSelectionCopy}
              </div>
            </div>
          </div>

          {/* Card 2: Program */}
          <div className="flex-1 min-w-0">
            <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
              {t('editor.desktop.selection.programLabel' as any) || 'Program'}
            </div>
            <div className="text-white font-semibold text-sm leading-snug truncate" title={programSummary?.name || noProgramCopy}>
              {programSummary?.name || noProgramCopy}
            </div>
          </div>

          {/* Card 3: Sections */}
          <div className="flex flex-col">
            <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
              {sectionsLabel}
            </div>
            <div className="font-bold text-white text-lg">
              {enabledSectionsCount}/{totalSectionsCount}
            </div>
          </div>

          {/* Card 4: Documents */}
          <div className="flex flex-col">
            <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
              {documentsLabel}
            </div>
            <div className="font-bold text-white text-lg">
              {enabledDocumentsCount}/{totalDocumentsCount}
            </div>
          </div>
        </div>
        
        {/* Document cards row - horizontal scroll */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', maxHeight: '120px' }}>
            {/* Add button */}
            <button
              type="button"
              onClick={docActions.toggleAddDocument}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 w-[100px] h-[100px] flex-shrink-0"
            >
              <span className="text-xl leading-none">＋</span>
              <span className="text-xs">{t('editor.desktop.documents.addButton' as any) || 'Add'}</span>
            </button>

            {/* Core product card */}
            {selectedProductMeta && (
              <div
                onClick={() => docActions.setClickedDocumentId('core-product')}
                className={`relative border rounded-lg p-2 transition-all w-[100px] h-[100px] flex flex-col items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  clickedDocumentId === 'core-product' ? 'border-blue-400 bg-blue-600/20' : clickedDocumentId ? 'opacity-50 border-white/10' : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl leading-none flex-shrink-0">{selectedProductMeta.icon || '📄'}</span>
                <div className="w-full text-center">
                  <h4 className="text-[10px] font-semibold leading-snug text-white break-words line-clamp-2">
                    {t(selectedProductMeta.label as any) || selectedProductMeta.label}
                  </h4>
                </div>
              </div>
            )}

            {/* Document cards */}
            {documents.map((doc: DocumentTemplate) => {
              const isDisabled = disabledDocuments.has(doc.id);
              const isRequired = doc.required ?? false;
              const isSelected = clickedDocumentId === doc.id;
              const isUnselected = Boolean(clickedDocumentId && clickedDocumentId !== doc.id);
              
              const cardClass = isDisabled
                ? 'opacity-50 border-white/10'
                : isSelected
                ? 'border-blue-400 bg-blue-600/20'
                : isUnselected
                ? 'opacity-50 border-white/10'
                : isRequired
                ? 'border-amber-400 bg-amber-600/20'
                : 'border-white/20 bg-white/5 hover:bg-white/10';

              return (
                <div
                  key={doc.id}
                  onClick={() => !isDisabled && docActions.setClickedDocumentId(doc.id)}
                  className={`relative border rounded-lg p-2 transition-all w-[100px] h-[100px] flex flex-col items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${cardClass}`}
                >
                  <span className="text-2xl leading-none flex-shrink-0">📄</span>
                  <h4 className={`text-[10px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2 w-full text-center`}>
                    {doc.name}
                  </h4>
                  <div className="absolute top-1 right-1 z-10">
                    {docActions.toggleDocument && (
                      <input
                        type="checkbox"
                        checked={!isDisabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          docActions.toggleDocument(doc.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`w-3 h-3 rounded border cursor-pointer ${isDisabled ? 'border-white/30 bg-white/10' : isRequired ? 'border-amber-500 bg-amber-600/30' : 'border-blue-500 bg-blue-600/30'}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
              <button
                onClick={() => setActiveTab('sections')}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                  activeTab === 'sections'
                    ? 'bg-blue-600/30 text-white border-l-2 border-blue-400'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="mr-2">📋</span>
                {t('editor.desktop.config.step3.title' as any) || 'Sections & Docs'}
              </button>
            </div>

            {/* Right: Active Content */}
            <div className="px-4 py-3">
              <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                {activeTab === 'product' && <ProductSelection />}
                {activeTab === 'program' && <ProgramSelection />}
                {activeTab === 'sections' && <SectionsDocumentsManagement />}
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

import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  type DocumentTemplate,
  useDocumentsBarState,
} from '@/features/editor/lib';

export default function DocumentsBar({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { isEditing, showAddDocument, expandedDocumentId, selectedProductMeta, clickedDocumentId, documents, disabledDocuments, documentCounts, actions } = useDocumentsBarState();
  
  // Show empty state when no documents are available (even if product is selected)
  const showEmptyState = documents.length === 0 && !selectedProductMeta;
  // Compact mode - horizontal layout with small cards
  if (compact) {
    return (
      <div className="relative w-full">
        {/* Header with count */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-white/80">
            {t('editor.desktop.documents.title' as any) || 'Documents'}
          </h3>
        </div>

        {/* Compact horizontal scrollable cards */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', minHeight: '70px' }}>
          {showEmptyState && (
            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-center w-[90px] h-[60px] flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xl">📄</span>
              <span className="text-white/60 text-[8px] mt-1">{t('editor.desktop.documents.noDocumentsYet' as any) || 'None'}</span>
            </div>
          )}

          {!expandedDocumentId && !showEmptyState && (
            <button
              type="button"
              onClick={actions.toggleAddDocument}
              className={showAddDocument ? 'px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1 w-[90px] h-[60px] flex-shrink-0' : 'px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-1 w-[90px] h-[60px] flex-shrink-0'}
            >
              <span className="text-lg leading-none">＋</span>
              <span className="text-[9px]">{t('editor.desktop.documents.addButton' as any) || 'Add'}</span>
            </button>
          )}

          {selectedProductMeta && !expandedDocumentId && (
            <div
              onClick={() => actions.setClickedDocumentId('core-product')}
              className={`relative border rounded-lg p-2 transition-all w-[90px] h-[60px] flex flex-col items-center justify-center gap-1 flex-shrink-0 cursor-pointer ${clickedDocumentId === 'core-product' ? 'border-blue-400 bg-blue-600/20' : clickedDocumentId ? 'opacity-50 border-white/10' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
            >
              <span className="text-xl leading-none flex-shrink-0">{selectedProductMeta.icon || '📄'}</span>
              <h4 className="text-[8px] font-semibold text-white truncate w-full text-center">
                {selectedProductMeta ? t(selectedProductMeta.label as any) || selectedProductMeta.label || 'No selection' : 'No selection'}
              </h4>
            </div>
          )}

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
                onClick={() => !isDisabled && actions.setClickedDocumentId(doc.id)}
                className={`relative border rounded-lg p-2 transition-all w-[90px] h-[60px] flex flex-col items-center justify-center gap-1 flex-shrink-0 cursor-pointer ${cardClass}`}
              >
                <span className="text-xl leading-none flex-shrink-0">📄</span>
                <h4 className={`text-[8px] font-semibold ${isDisabled ? 'text-white/50 line-through' : 'text-white'} truncate w-full text-center`}>
                  {doc.name}
                </h4>
                <div className="absolute top-0.5 right-0.5 z-10 flex items-center gap-0.5">
                  {actions.toggleDocument && (
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        actions.toggleDocument(doc.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-2.5 h-2.5 rounded border cursor-pointer ${isDisabled ? 'border-white/30 bg-white/10' : isRequired ? 'border-amber-500 bg-amber-600/30' : 'border-blue-500 bg-blue-600/30'} text-blue-600`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default mode - full normal cards view
  if (isEditing) {
    return (
      <div className="border border-white/20 bg-white/10 rounded-lg p-4 mb-3">
        <div className="space-y-2">
          <div className="text-white/60 text-xs text-center p-4">
            <p>Edit form placeholder - SectionDocumentEditForm needs to be implemented</p>
            <button onClick={actions.cancelEdit} className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-xs">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full pb-3">
      {/* Header with separator */}
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
          {t('editor.desktop.documents.title' as any) || 'Deine Dokumente'} ({documentCounts.totalCount})
        </h2>
      </div>
      
      {/* Document cards row */}
      <div className="flex gap-2 overflow-x-auto pb-1 justify-center" style={{ scrollbarWidth: 'thin', minHeight: '90px', maxHeight: '140px' }}>
        {showEmptyState && (
          <div className="border rounded-lg bg-white/5 border-white/10 text-center flex flex-col items-center justify-center gap-2" style={{ width: '272px', height: '94px' }}>
            <span className="text-4xl leading-none">📄</span>
            <div className="text-white/60 text-sm font-semibold">
              {t('editor.desktop.documents.noDocumentsYet' as any) || 'No Documents Yet'}
            </div>
          </div>
        )}

        {!expandedDocumentId && !showEmptyState && (
          <button
            type="button"
            onClick={actions.toggleAddDocument}
            className={`rounded-lg transition-colors flex flex-col items-center justify-center gap-1.5 p-2 ${
              showAddDocument 
                ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <span className="text-xl leading-none">＋</span>
            <span className="text-[10px] font-semibold">{t('editor.desktop.documents.addButton' as any) || 'Add'}</span>
          </button>
        )}

        {showAddDocument && !expandedDocumentId && (
          <div className="text-white/60 text-xs p-2 border border-dashed border-white/20 rounded text-center">
            {/* Template form will be implemented here */}
          </div>
        )}

        {selectedProductMeta && !expandedDocumentId && (
          <div
            onClick={() => actions.setClickedDocumentId('core-product')}
            className={`relative border rounded-lg p-1.5 transition-all w-[70px] h-[85px] flex flex-col items-center justify-center gap-1 flex-shrink-0 cursor-pointer ${clickedDocumentId === 'core-product' ? 'border-blue-400 bg-blue-600/20' : clickedDocumentId ? 'opacity-50 border-white/10' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
          >
            <span className="text-xl leading-none flex-shrink-0">{selectedProductMeta.icon || '📄'}</span>
            <div className="w-full text-center">
              <h4 className="text-[9px] font-semibold leading-tight text-white break-words line-clamp-2">
                {selectedProductMeta ? t(selectedProductMeta.label as any) || selectedProductMeta.label || 'No selection' : 'No selection'}
              </h4>
            </div>
          </div>
        )}

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
              onClick={() => !isDisabled && actions.setClickedDocumentId(doc.id)}
              className={`relative border rounded-lg p-1.5 transition-all w-[70px] h-[85px] flex flex-col items-center justify-center gap-1 flex-shrink-0 cursor-pointer ${cardClass}`}
            >
              <span className="text-lg leading-none flex-shrink-0">📄</span>
              <div className="w-full text-center">
                <h4 className={`text-[9px] font-semibold leading-tight ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                  {doc.name}
                </h4>
              </div>
              <div className="absolute top-0.5 right-0.5 z-10 flex items-center gap-0.5">
                {actions.editDocument && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      actions.editDocument(doc)
                    }}
                    className="text-white/60 hover:text-white text-[10px] transition-opacity"
                  >
                    ✏️
                  </button>
                )}
                {actions.toggleDocument && (
                  <input
                    type="checkbox"
                    checked={!isDisabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      actions.toggleDocument(doc.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-3 h-3 rounded border-2 cursor-pointer ${
                      isDisabled
                        ? 'border-white/30 bg-white/10'
                        : isRequired
                        ? 'border-amber-500 bg-amber-600/30 opacity-90'
                        : 'border-blue-500 bg-blue-600/30'
                    } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                  />
                )}
                {doc.origin === 'custom' && actions.removeCustomDocument && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      actions.removeCustomDocument(doc.id);
                    }}
                    className="text-red-300 hover:text-red-200 text-xs font-bold px-1 py-0.5 rounded hover:bg-red-500/20 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

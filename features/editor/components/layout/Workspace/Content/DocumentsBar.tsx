import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { DesktopEditForm } from '@/features/editor/components/layout/Desktop/DesktopEditForm';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { useI18n } from '@/shared/contexts/I18nContext';

type DocumentsBarProps = {
  filteredDocuments: DocumentTemplate[];
  disabledDocuments: Set<string>;
  enabledDocumentsCount: number;
  expandedDocumentId: string | null;
  editingDocument: DocumentTemplate | null;
  selectedProductMeta: { value: string; label: string; description: string; icon?: string } | null;
  clickedDocumentId: string | null;
  showAddDocument: boolean;
  newDocumentName: string;
  newDocumentDescription: string;
  onToggleDocument: (id: string) => void;
  onSelectDocument: (id: string | null) => void;
  onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => void;
  onSaveDocument: (item: SectionTemplate | DocumentTemplate) => void;
  onCancelEdit: () => void;
  onToggleAddDocument: () => void;
  onAddCustomDocument: () => void;
  onSetNewDocumentName: (name: string) => void;
  onSetNewDocumentDescription: (desc: string) => void;
  onRemoveCustomDocument: (id: string) => void;
  getOriginBadge: (origin?: string, isSelected?: boolean) => React.ReactNode;
};

export default function DocumentsBar({
  filteredDocuments,
  disabledDocuments,
  enabledDocumentsCount,
  expandedDocumentId,
  editingDocument,
  selectedProductMeta,
  clickedDocumentId,
  showAddDocument,
  newDocumentName,
  newDocumentDescription,
  onToggleDocument,
  onSelectDocument,
  onEditDocument,
  onSaveDocument,
  onCancelEdit,
  onToggleAddDocument,
  onAddCustomDocument,
  onSetNewDocumentName,
  onSetNewDocumentDescription,
  onRemoveCustomDocument,
  getOriginBadge
}: DocumentsBarProps) {
  const { t } = useI18n();

  // If editing, show edit form in a modal/overlay style
  if (expandedDocumentId && editingDocument) {
    return (
      <div className="w-full border-b border-white/10 pb-3 mb-3">
        <div className="bg-white/10 rounded-lg border border-white/20 p-3">
          <DesktopEditForm
            type="document"
            item={editingDocument}
            onSave={onSaveDocument}
            onCancel={onCancelEdit}
            getOriginBadge={getOriginBadge}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-white/10 pb-3 mb-3">
      {/* Header - aligned with Sidebar header height */}
      <div className="flex-shrink-0 mb-2">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white border-b border-white/50">
          {t('editor.desktop.documents.title' as any) || 'Deine Dokumente'} ({enabledDocumentsCount})
        </h2>
      </div>
      <div className="text-xs text-white/50 mb-2 flex-shrink-0 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span>✏️</span>
          <span>{t('editor.desktop.documents.legend.edit' as any) || 'Bearbeiten'}</span>
        </span>
        <span className="flex items-center gap-1">
          <input type="checkbox" className="w-2.5 h-2.5" disabled />
          <span>{t('editor.desktop.documents.legend.toggle' as any) || 'Hinzufügen/Deselektieren'}</span>
        </span>
      </div>

      {/* Horizontal Scrollable Container - Original 3-column grid style, but horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {/* Add Document Button - Original style */}
        {!expandedDocumentId && (
          <button
            type="button"
            onClick={onToggleAddDocument}
            className={`relative flex-shrink-0 border rounded-lg p-1.5 flex flex-col items-center justify-center gap-1.5 text-center text-[11px] font-semibold tracking-tight transition-all w-[90px] h-[80px] ${
              showAddDocument
                ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
            }`}
          >
            <span className="text-2xl leading-none">＋</span>
            <span>{t('editor.desktop.documents.addButton' as any) || 'Hinzufügen'}</span>
          </button>
        )}

        {/* Add Document Form - Original style */}
        {showAddDocument && !expandedDocumentId && (
          <div className="flex-shrink-0 col-span-3 border border-white/20 bg-white/10 rounded-lg p-2.5 space-y-2 min-w-[420px]">
            <p className="text-xs text-white/70 font-semibold mb-2">
              {t('editor.desktop.documents.custom.title' as any) || 'Ein benutzerdefiniertes Dokument zu Ihrem Plan hinzufügen'}
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-white/70 block mb-1">
                  {t('editor.desktop.documents.custom.name' as any) || 'Name *'}
                </label>
                <input
                  type="text"
                  value={newDocumentName}
                  onChange={(e) => onSetNewDocumentName(e.target.value)}
                  placeholder={t('editor.desktop.documents.custom.namePlaceholder' as any) || 'z.B. Finanzplan'}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] text-white/70 block mb-1">
                  {t('editor.desktop.documents.custom.description' as any) || 'Beschreibung'}
                </label>
                <textarea
                  value={newDocumentDescription}
                  onChange={(e) => onSetNewDocumentDescription(e.target.value)}
                  placeholder={t('editor.desktop.documents.custom.descriptionPlaceholder' as any) || 'Optionale Beschreibung des Dokuments'}
                  rows={2}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={onAddCustomDocument}
                disabled={!newDocumentName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('editor.desktop.documents.custom.add' as any) || 'Hinzufügen'}
              </Button>
              <Button
                onClick={onToggleAddDocument}
                variant="ghost"
                className="text-white/60 hover:text-white text-xs px-3 py-1"
              >
                {t('editor.desktop.documents.custom.cancel' as any) || 'Abbrechen'}
              </Button>
            </div>
          </div>
        )}

        {/* Main Document Card - Core Product - Original style */}
        {selectedProductMeta && !expandedDocumentId && (
          <div
            onClick={() => {
              onSelectDocument(null);
            }}
            className={`relative flex-shrink-0 border rounded-lg p-1.5 cursor-pointer transition-all group w-[90px] h-[80px] ${
              clickedDocumentId === null
                ? 'border-blue-400/60 bg-blue-600/20 ring-2 ring-blue-400/40' // Selected
                : clickedDocumentId
                ? 'border-blue-300/30 bg-blue-500/5 opacity-50' // Unselected when another is selected
                : 'border-blue-500/50 bg-blue-500/10' // Normal blue when no selection
            } hover:border-blue-400/60`}
          >
            <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
              <div className={`w-3.5 h-3.5 rounded border-2 ${
                clickedDocumentId === null
                  ? 'border-blue-500 bg-blue-600/30' 
                  : clickedDocumentId
                  ? 'border-blue-300/50 bg-blue-600/20'
                  : 'border-blue-500 bg-blue-600/30'
              } flex items-center justify-center`}>
                <svg className="w-2 h-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 pt-2 min-h-[40px]">
              <span className="text-xl leading-none flex-shrink-0">
                {selectedProductMeta.icon ?? '📄'}
              </span>
              <div className="w-full text-center min-h-[24px] flex items-center justify-center">
                <h4 className="text-[10px] font-semibold leading-snug text-white break-words line-clamp-2">
                  {selectedProductMeta.label}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Document Cards - Original style */}
        {filteredDocuments.map((doc) => {
          const isDisabled = disabledDocuments.has(doc.id);
          const isRequired = doc.required;
          const isSelected = clickedDocumentId === doc.id;
          const isUnselected = clickedDocumentId && clickedDocumentId !== doc.id;

          return (
            <div
              key={doc.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (
                  target.tagName === 'INPUT' &&
                  target.getAttribute('type') === 'checkbox'
                ) {
                  return;
                }
                if (
                  target.closest('button') ||
                  target.closest('input[type="checkbox"]') ||
                  target.closest('[data-badge="true"]') ||
                  target.closest('[class*="Badge"]') ||
                  target.getAttribute('data-badge') === 'true'
                ) {
                  return;
                }
                onSelectDocument(doc.id);
              }}
              className={`relative flex-shrink-0 border rounded-lg p-1.5 cursor-pointer transition-all w-[90px] h-[80px] ${
                isSelected
                  ? 'border-blue-400/60 bg-blue-600/20 ring-2 ring-blue-400/40'
                  : isUnselected
                  ? 'border-white/10 bg-white/5 opacity-50'
                  : isDisabled
                  ? 'border-white/10 bg-white/5 opacity-60'
                  : isRequired
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-white/20 bg-white/10'
              } hover:border-white/40 group`}
            >
              <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditDocument(doc, e);
                  }}
                  className="text-white/60 hover:text-white text-xs transition-opacity"
                >
                  ✏️
                </button>
                <input
                  type="checkbox"
                  checked={!isDisabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleDocument(doc.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                    isDisabled
                      ? 'border-white/30 bg-white/10'
                      : isRequired
                      ? 'border-amber-500 bg-amber-600/30 opacity-90'
                      : 'border-blue-500 bg-blue-600/30'
                  } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                />
              </div>

              <div className="flex flex-col items-center gap-1 pt-2 min-h-[40px] w-full">
                <span className="text-xl leading-none flex-shrink-0">📄</span>
                <div className="w-full text-center min-h-[24px] flex items-center justify-center gap-1">
                  <h4
                    className={`text-[10px] font-semibold leading-snug ${
                      isDisabled ? 'text-white/50 line-through' : 'text-white'
                    } break-words line-clamp-2`}
                  >
                    {doc.name}
                  </h4>
                  {getOriginBadge(doc.origin, isSelected) && (
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="inline-block select-none"
                      data-badge="true"
                    >
                      {getOriginBadge(doc.origin, isSelected)}
                    </span>
                  )}
                </div>
                {doc.origin === 'custom' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveCustomDocument(doc.id);
                    }}
                    className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
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


import React from 'react';
import { SectionDocumentEditForm } from '@/features/editor/components/layout/Workspace/shared/SectionDocumentEditForm';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { useI18n } from '@/shared/contexts/I18nContext';

// ============================================================================
// TYPES
// ============================================================================

type DocumentsBarProps = {
  filteredDocuments: DocumentTemplate[];
  disabledDocuments: Set<string>;
  enabledDocumentsCount: number;
  expandedDocumentId: string | null;
  editingDocument: DocumentTemplate | null;
  selectedProductMeta: { value: string; label: string; description: string; icon?: string } | null;
  clickedDocumentId: string | null;
  showAddDocument: boolean;
  onToggleDocument: (id: string) => void;
  onSelectDocument: (id: string | null) => void;
  onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => void;
  onSaveDocument: (item: SectionTemplate | DocumentTemplate) => void;
  onCancelEdit: () => void;
  onToggleAddDocument: () => void;
  onRemoveCustomDocument: (id: string) => void;
  getOriginBadge: (origin?: string, isSelected?: boolean) => React.ReactNode;
  isNewUser?: boolean;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// TODO: AddDocumentForm will be recreated as shared component in layout/Workspace/shared/AddItemForm.tsx

/**
 * Core Product Document Card
 */
function CoreProductCard({
  selectedProductMeta,
  clickedDocumentId,
  onSelectDocument
}: {
  selectedProductMeta: { value: string; label: string; description: string; icon?: string } | null;
  clickedDocumentId: string | null;
  onSelectDocument: (id: string | null) => void;
}) {
  if (!selectedProductMeta) return null;

  return (
    <div
      onClick={() => onSelectDocument(null)}
      className={`relative flex-shrink-0 border rounded-lg p-1.5 cursor-pointer transition-all group w-[90px] h-[80px] ${
        clickedDocumentId === null
          ? 'border-blue-400/60 bg-blue-600/20 ring-2 ring-blue-400/40'
          : clickedDocumentId
          ? 'border-blue-300/30 bg-blue-500/5 opacity-50'
          : 'border-blue-500/50 bg-blue-500/10'
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
  );
}

/**
 * Document Card Component
 */
function DocumentCard({
  doc,
  isDisabled,
  isRequired,
  isSelected,
  isUnselected,
  onSelectDocument,
  onToggleDocument,
  onEditDocument,
  onRemoveCustomDocument,
  getOriginBadge
}: {
  doc: DocumentTemplate;
  isDisabled: boolean;
  isRequired: boolean;
  isSelected: boolean;
  isUnselected: boolean;
  onSelectDocument: (id: string | null) => void;
  onToggleDocument: (id: string) => void;
  onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => void;
  onRemoveCustomDocument: (id: string) => void;
  getOriginBadge: (origin?: string, isSelected?: boolean) => React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox' ||
      target.closest('button') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[data-badge="true"]') ||
      target.closest('[class*="Badge"]') ||
      target.getAttribute('data-badge') === 'true'
    ) {
      return;
    }
    onSelectDocument(doc.id);
  };

  return (
    <div
      onClick={handleClick}
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
      {/* Action buttons */}
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
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
            isDisabled
              ? 'border-white/30 bg-white/10'
              : isRequired
              ? 'border-amber-500 bg-amber-600/30 opacity-90'
              : 'border-blue-500 bg-blue-600/30'
          } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
        />
      </div>

      {/* Document content */}
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
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DocumentsBar({
  filteredDocuments,
  disabledDocuments,
  enabledDocumentsCount,
  expandedDocumentId,
  editingDocument,
  selectedProductMeta,
  clickedDocumentId,
  showAddDocument,
  onToggleDocument,
  onSelectDocument,
  onEditDocument,
  onSaveDocument,
  onCancelEdit,
  onToggleAddDocument,
  onRemoveCustomDocument,
  getOriginBadge,
  isNewUser = false
}: DocumentsBarProps) {
  const { t } = useI18n();

  // ============================================================================
  // RENDER: Edit Mode
  // ============================================================================
  if (expandedDocumentId && editingDocument) {
    return (
      <div className="w-full border-b border-white/10 pb-3 mb-3">
        <div className="bg-white/10 rounded-lg border border-white/20 p-3">
          <SectionDocumentEditForm
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

  // ============================================================================
  // RENDER: Normal View
  // ============================================================================
  return (
    <div 
      className="relative w-full border-b border-white/10 pb-3 mb-3"
      style={{
        zIndex: showAddDocument ? 100 : 10,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 mb-2">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white border-b border-white/50">
          {t('editor.desktop.documents.title' as any) || 'Deine Dokumente'} ({enabledDocumentsCount})
        </h2>
      </div>

      {/* Legend */}
      {!isNewUser && (
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
      )}

      {/* Horizontal Scrollable Container */}
      <div 
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        style={{
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
        }}
      >
        {/* New User Message - TODO: Replace with shared EmptyState component */}
        {isNewUser && (
          <div className="relative flex-shrink-0 border border-dashed border-white/20 rounded-lg p-1.5 text-center text-[11px] text-white/60 w-[110px] h-[90px]">
            [Empty State - To be recreated as shared component]
          </div>
        )}

        {/* Add Document Button */}
        {!expandedDocumentId && !isNewUser && (
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

        {/* Add Document Form - TODO: Replace with shared AddItemForm component */}
        {showAddDocument && !expandedDocumentId && (
          <div className="text-white/60 text-xs p-2 border border-dashed border-white/20 rounded">
            [Add Document Form - To be recreated as shared component]
          </div>
        )}

        {/* Core Product Card */}
        {selectedProductMeta && !expandedDocumentId && (
          <CoreProductCard
            selectedProductMeta={selectedProductMeta}
            clickedDocumentId={clickedDocumentId}
            onSelectDocument={onSelectDocument}
          />
        )}

        {/* Document Cards */}
        {filteredDocuments.map((doc) => {
          const isDisabled = disabledDocuments.has(doc.id);
          const isRequired = doc.required;
          const isSelected = clickedDocumentId === doc.id;
          const isUnselected = Boolean(clickedDocumentId && clickedDocumentId !== doc.id);

          return (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isDisabled={isDisabled}
              isRequired={isRequired}
              isSelected={isSelected}
              isUnselected={isUnselected}
              onSelectDocument={onSelectDocument}
              onToggleDocument={onToggleDocument}
              onEditDocument={onEditDocument}
              onRemoveCustomDocument={onRemoveCustomDocument}
              getOriginBadge={getOriginBadge}
            />
          );
        })}
      </div>
    </div>
  );
}

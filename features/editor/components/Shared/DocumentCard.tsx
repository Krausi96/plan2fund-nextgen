// Reusable document card component extracted from DocumentsBar

import React from 'react';
import {
  DOCUMENTS_BAR_STYLES,
  shouldIgnoreClick,
  type DocumentTemplate,
} from '@/features/editor/lib';

export interface DocumentCardProps {
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
}

/**
 * Document Card Component
 */
export function DocumentCard({
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
}: DocumentCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (shouldIgnoreClick(target)) {
      return;
    }
    onSelectDocument(doc.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`${DOCUMENTS_BAR_STYLES.documentCard[isSelected ? 'selected' : isUnselected ? 'unselected' : isDisabled ? 'disabled' : isRequired ? 'required' : 'default']} group`}
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

/**
 * Core Product Card Component
 */
export function CoreProductCard({
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
      className={DOCUMENTS_BAR_STYLES.coreProductCard[clickedDocumentId === null ? 'selected' : clickedDocumentId ? 'unselected' : 'default']}
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


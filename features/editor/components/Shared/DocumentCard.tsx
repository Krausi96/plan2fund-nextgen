import React from 'react';
import {
  type DocumentTemplate,
  type ProductOption,
  shouldIgnoreClick,
} from '@/features/editor/lib';

export interface DocumentCardProps {
  doc: DocumentTemplate;
  isDisabled: boolean;
  isRequired: boolean;
  isSelected: boolean;
  isUnselected: boolean;
  onSelectDocument: (id: string) => void;
  onToggleDocument?: (id: string) => void;
  onEditDocument?: (doc: DocumentTemplate, e: React.MouseEvent) => void;
  onRemoveCustomDocument?: (id: string) => void;
  getOriginBadge?: () => React.ReactNode;
}

export interface CoreProductCardProps {
  selectedProductMeta: ProductOption;
  clickedDocumentId: string | null;
  onSelectDocument: (id: string | null) => void;
}

/**
 * Document card component
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
  getOriginBadge,
}: DocumentCardProps) {
  const isCustom = doc.origin === 'custom';
  
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
      onClick={(e) => {
        if (isDisabled || shouldIgnoreClick(e.target as HTMLElement)) return;
        onSelectDocument(doc.id);
      }}
      className={`relative border rounded-lg p-3 transition-all ${cardClass} group`}
    >
      {/* Action buttons */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
        {onEditDocument && (
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
        )}
        {onToggleDocument && (
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
        )}
      </div>

      {/* Document content */}
      <div className="flex flex-col items-center gap-2 pt-4 min-h-[60px]">
        <span className="text-2xl leading-none flex-shrink-0">📄</span>
        <div className="w-full text-center">
          <h4 className={`text-xs font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
            {doc.name}
          </h4>
          {doc.description && (
            <p className="text-[10px] text-white/60 mt-1 line-clamp-2">{doc.description}</p>
          )}
        </div>
        {isCustom && onRemoveCustomDocument && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveCustomDocument(doc.id);
            }}
            className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        )}
        {getOriginBadge && doc.origin && (
          <div className="mt-1">{getOriginBadge()}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Core product card component
 */
export function CoreProductCard({
  selectedProductMeta,
  clickedDocumentId,
  onSelectDocument,
}: CoreProductCardProps) {
  const isSelected = clickedDocumentId === 'core-product';
  
  const cardClass = isSelected
    ? 'border-blue-400 bg-blue-600/20'
    : clickedDocumentId
    ? 'opacity-50 border-white/10'
    : 'border-white/20 bg-white/5 hover:bg-white/10';

  return (
    <div
      onClick={() => onSelectDocument('core-product')}
      className={`relative border rounded-lg p-3 transition-all ${cardClass} cursor-pointer`}
    >
      <div className="flex flex-col items-center gap-2 pt-4 min-h-[60px]">
        <span className="text-3xl leading-none flex-shrink-0">{selectedProductMeta.icon || '📄'}</span>
        <div className="w-full text-center">
          <h4 className="text-xs font-semibold leading-snug text-white break-words line-clamp-2">
            {selectedProductMeta.label}
          </h4>
          {selectedProductMeta.description && (
            <p className="text-[10px] text-white/60 mt-1 line-clamp-2">{selectedProductMeta.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

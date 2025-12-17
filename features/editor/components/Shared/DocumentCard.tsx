import React from 'react';
import {
  type DocumentTemplate,
  type ProductOption,
  DOCUMENTS_BAR_STYLES,
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
    ? DOCUMENTS_BAR_STYLES.documentCard.disabled
    : isSelected
    ? DOCUMENTS_BAR_STYLES.documentCard.selected
    : isUnselected
    ? DOCUMENTS_BAR_STYLES.documentCard.unselected
    : isRequired
    ? DOCUMENTS_BAR_STYLES.documentCard.required
    : DOCUMENTS_BAR_STYLES.documentCard.default;

  const checkboxClass = isDisabled
    ? DOCUMENTS_BAR_STYLES.documentCard.checkbox.disabled
    : isRequired
    ? DOCUMENTS_BAR_STYLES.documentCard.checkbox.required
    : DOCUMENTS_BAR_STYLES.documentCard.checkbox.default;

  return (
    <div
      onClick={(e) => {
        if (isDisabled || shouldIgnoreClick(e.target as HTMLElement)) return;
        onSelectDocument(doc.id);
      }}
      className={`${DOCUMENTS_BAR_STYLES.documentCard.base} ${cardClass}`}
    >
      {/* Action buttons */}
      <div className={DOCUMENTS_BAR_STYLES.documentCard.actions}>
        {onEditDocument && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditDocument(doc, e);
            }}
            className={DOCUMENTS_BAR_STYLES.documentCard.editButton}
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
            className={`${DOCUMENTS_BAR_STYLES.documentCard.checkbox.base} ${checkboxClass}`}
          />
        )}
      </div>

      {/* Document content */}
      <div className={DOCUMENTS_BAR_STYLES.documentCard.content}>
        <span className={DOCUMENTS_BAR_STYLES.documentCard.icon}>📄</span>
        <div className="w-full text-center">
          <h4 className={isDisabled ? DOCUMENTS_BAR_STYLES.documentCard.titleDisabled : DOCUMENTS_BAR_STYLES.documentCard.title}>
            {doc.name}
          </h4>
          {doc.description && (
            <p className={DOCUMENTS_BAR_STYLES.documentCard.description}>{doc.description}</p>
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
            className={DOCUMENTS_BAR_STYLES.documentCard.removeButton}
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
    ? DOCUMENTS_BAR_STYLES.coreProductCard.selected
    : clickedDocumentId
    ? DOCUMENTS_BAR_STYLES.coreProductCard.unselected
    : DOCUMENTS_BAR_STYLES.coreProductCard.default;

  return (
    <div
      onClick={() => onSelectDocument('core-product')}
      className={`${DOCUMENTS_BAR_STYLES.coreProductCard.base} ${cardClass}`}
    >
      <div className={DOCUMENTS_BAR_STYLES.documentCard.content}>
        <span className={DOCUMENTS_BAR_STYLES.documentCard.iconLarge}>{selectedProductMeta.icon || '📄'}</span>
        <div className={DOCUMENTS_BAR_STYLES.documentCard.contentInner}>
          <h4 className={DOCUMENTS_BAR_STYLES.documentCard.title}>
            {selectedProductMeta.label}
          </h4>
          {selectedProductMeta.description && (
            <p className={DOCUMENTS_BAR_STYLES.documentCard.description}>{selectedProductMeta.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

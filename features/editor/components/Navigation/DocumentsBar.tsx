import React from 'react';
import { DocumentCard, CoreProductCard } from '../Shared/DocumentCard';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  type DocumentTemplate,
  useDocumentsBarState,
  DOCUMENTS_BAR_STYLES,
} from '@/features/editor/lib';

export default function DocumentsBar() {
  const { t } = useI18n();
  const { isEditing, showAddDocument, isNewUser, expandedDocumentId, selectedProductMeta, clickedDocumentId, documents, disabledDocuments, documentCounts, actions } = useDocumentsBarState();

  if (isEditing) {
    return (
      <div className={DOCUMENTS_BAR_STYLES.editFormContainer}>
        <div className={DOCUMENTS_BAR_STYLES.editFormInner}>
          <div className="text-white/60 text-xs text-center p-4">
            <p>Edit form placeholder - SectionDocumentEditForm needs to be implemented</p>
            <button onClick={actions.cancelEdit} className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-xs">
              {t('editor.ui.cancel' as any) || 'Abbrechen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col" style={DOCUMENTS_BAR_STYLES.container(showAddDocument)}>
      <div className="flex-shrink-0 mb-2">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
          {t('editor.desktop.documents.title' as any) || 'Deine Dokumente'} ({documentCounts.enabledCount})
        </h2>
      </div>

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

      <div className={DOCUMENTS_BAR_STYLES.scrollContainer.className} style={DOCUMENTS_BAR_STYLES.scrollContainer.style}>
        {isNewUser && (
          <div className={DOCUMENTS_BAR_STYLES.emptyStateCard}>
            <div className={DOCUMENTS_BAR_STYLES.emptyStateIcon}>
              <span className="text-4xl">📄</span>
            </div>
            <div className={DOCUMENTS_BAR_STYLES.emptyStateText}>
              {t('editor.desktop.documents.noDocumentsYet' as any) || 'Noch keine Dokumente'}
            </div>
          </div>
        )}

        {!expandedDocumentId && !isNewUser && (
          <button
            type="button"
            onClick={actions.toggleAddDocument}
            className={showAddDocument ? DOCUMENTS_BAR_STYLES.addButton.active : DOCUMENTS_BAR_STYLES.addButton.inactive}
          >
            <span className="text-2xl leading-none">＋</span>
            <span>{t('editor.desktop.documents.addButton' as any) || 'Hinzufügen'}</span>
          </button>
        )}

        {showAddDocument && !expandedDocumentId && (
          <div className="text-white/60 text-xs p-2 border border-dashed border-white/20 rounded text-center">
            {/* Template form will be implemented here */}
          </div>
        )}

        {selectedProductMeta && !expandedDocumentId && (
          <CoreProductCard
            selectedProductMeta={selectedProductMeta}
            clickedDocumentId={clickedDocumentId}
            onSelectDocument={actions.setClickedDocumentId}
          />
        )}

        {documents.length === 0 && !isNewUser && selectedProductMeta && !expandedDocumentId && (
          <div className={DOCUMENTS_BAR_STYLES.emptyStateCard}>
            <div className={DOCUMENTS_BAR_STYLES.emptyStateIcon}>
              <span className="text-4xl">📄</span>
            </div>
            <div className={DOCUMENTS_BAR_STYLES.emptyStateText}>
              {t('editor.desktop.documents.empty' as any) || 'Noch keine Dokumente'}
            </div>
          </div>
        )}

        {documents.map((doc: DocumentTemplate) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            isDisabled={disabledDocuments.has(doc.id)}
            isRequired={doc.required ?? false}
            isSelected={clickedDocumentId === doc.id}
            isUnselected={Boolean(clickedDocumentId && clickedDocumentId !== doc.id)}
            onSelectDocument={actions.setClickedDocumentId}
            onToggleDocument={actions.toggleDocument}
            onEditDocument={actions.editDocument}
            onRemoveCustomDocument={actions.removeCustomDocument}
            getOriginBadge={() => null}
          />
        ))}
      </div>
    </div>
  );
}

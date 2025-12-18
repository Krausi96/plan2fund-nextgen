import React from 'react';
import { DocumentCard, CoreProductCard } from '../Shared/DocumentCard';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  type DocumentTemplate,
  useDocumentsBarState,
} from '@/features/editor/lib';

export default function DocumentsBar() {
  const { t } = useI18n();
  const { isEditing, showAddDocument, isNewUser, expandedDocumentId, selectedProductMeta, clickedDocumentId, documents, disabledDocuments, documentCounts, actions } = useDocumentsBarState();

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
    <div className="relative w-full border-b border-white/10 pb-3 mb-3">
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

      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {isNewUser && (
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center max-w-[150px] flex-shrink-0">
            <div className="text-4xl mb-2 flex justify-center">
              <span className="text-4xl">📄</span>
            </div>
            <div className="text-white/60 text-sm">
              {t('editor.desktop.documents.noDocumentsYet' as any) || 'Noch keine Dokumente'}
            </div>
          </div>
        )}

        {!expandedDocumentId && !isNewUser && (
          <button
            type="button"
            onClick={actions.toggleAddDocument}
            className={showAddDocument ? 'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]' : 'px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]'}
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

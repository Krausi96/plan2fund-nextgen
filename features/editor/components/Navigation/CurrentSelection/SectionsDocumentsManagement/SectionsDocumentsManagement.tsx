import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { InfoTooltip } from '../../../Shared/InfoTooltip';
import {
  useSectionsDocumentsManagementState,
} from '@/features/editor/lib';

type SectionsDocumentsManagementProps = {
  // Props removed - component uses unified hook directly
};

/**
 * SectionsDocumentsManagement component
 * Handles Step 3 of the configurator: Sections and Documents management with toggle lists and add forms
 * Optimized: Uses unified hook instead of 8+ individual hooks
 */
export default function SectionsDocumentsManagement({}: SectionsDocumentsManagementProps = {}) {
  const { t } = useI18n();
  const {
    sections: sectionsToShow,
    documents: documentsToShow,
    counts: { enabledSectionsCount, totalSectionsCount, enabledDocumentsCount, totalDocumentsCount },
    selectedProduct,
    selectedProductMeta,
    programSummary,
    showAddSection,
    showAddDocument,
    actions,
  } = useSectionsDocumentsManagementState();

  return (
    <div className="mb-3 pb-3">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-white/90 uppercase">
          {t('editor.desktop.config.step3.title' as any) || 'SECTIONS & DOCUMENTS'}
        </span>
        <InfoTooltip
          title={t('editor.desktop.config.step3.title' as any) || 'Sections & Documents'}
          content={t('editor.desktop.config.step3.description' as any) || 'Sections and documents are automatically generated based on your plan type and connected program. You can customize them.'}
        />
      </div>
      
      {/* Status Message based on program connection */}
      {programSummary ? (
        <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-2.5 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-green-300 text-sm flex-shrink-0">✅</span>
            <p className="text-xs text-white/90 leading-relaxed">
              {t('editor.desktop.config.step3.editingWithProgram' as any) || 'Editing sections/documents with program-specific content.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-2.5 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-300 text-sm flex-shrink-0">ℹ️</span>
            <p className="text-xs text-white/90 leading-relaxed">
              {t('editor.desktop.config.step3.editingWithoutProgram' as any) || 'Editing sections/documents. Connect a program in Step 2 to add program-specific content.'}
            </p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <p className="text-sm text-white/80">
          {t('editor.desktop.config.step3.description' as any) || 'Sections and documents are automatically generated based on your plan type and connected program. You can customize them.'}
        </p>
        
        {/* Documents List - Moved above Sections */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/90 uppercase">
              {t('editor.desktop.selection.documentsLabel' as any) || 'DOCUMENTS'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {enabledDocumentsCount}/{totalDocumentsCount}
              </span>
              <button
                onClick={actions.toggleAddDocument}
                className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                title={t('editor.desktop.documents.addButton' as any) || 'Add Document'}
              >
                + {t('editor.desktop.documents.addButton' as any) || 'Add'}
              </button>
            </div>
          </div>
          
          {showAddDocument && (
            <div className="mb-3 p-3 border border-dashed border-white/20 rounded-lg text-white/60 text-xs text-center">
              Add document functionality will be available after template rebuild
            </div>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {/* Core Product Document - Always shown first */}
            {selectedProduct && selectedProductMeta && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-600/10 border border-blue-400/20">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">{selectedProductMeta.icon || '📄'}</span>
                  <span className="text-sm font-semibold text-white truncate">
                    {selectedProductMeta.label}
                  </span>
                  <span className="text-xs text-white/60">(Core Product)</span>
                </div>
                <span className="text-xs text-green-400 font-semibold">✓ Always Active</span>
              </div>
            )}
            
            {/* Additional Documents */}
            {documentsToShow.length > 0 ? (
              documentsToShow.map((document) => {
                const isCustom = document.origin === 'custom';
                return (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs">
                        {document.isDisabled ? '❌' : '✅'}
                        {isCustom && ' ➕'}
                      </span>
                      <span className={`text-sm truncate ${document.isDisabled ? 'text-white/50' : 'text-white'}`}>
                        {document.name}
                      </span>
                    </div>
                    <button
                      onClick={() => actions.toggleDocument(document.id)}
                      className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                        document.isDisabled
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {document.isDisabled 
                        ? (t('editor.desktop.documents.activate' as any) || 'Activate')
                        : (t('editor.desktop.documents.deactivate' as any) || 'Deactivate')
                      }
                    </button>
                  </div>
                );
              })
            ) : !selectedProduct ? (
              <p className="text-sm text-white/60 text-center py-4">
                {t('editor.desktop.documents.emptyHint' as any) || 'No documents available'}
              </p>
            ) : null}
          </div>
        </div>

        {/* Sections List */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/90 uppercase">
              {t('editor.desktop.selection.sectionsLabel' as any) || 'SECTIONS'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {enabledSectionsCount}/{totalSectionsCount}
              </span>
              <button
                onClick={actions.toggleAddSection}
                className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                title={t('editor.desktop.sections.addButton' as any) || 'Add Section'}
              >
                + {t('editor.desktop.sections.addButton' as any) || 'Add'}
              </button>
            </div>
          </div>
          
          {showAddSection && (
            <div className="mb-3 p-3 border border-dashed border-white/20 rounded-lg text-white/60 text-xs text-center">
              Add section functionality will be available after template rebuild
            </div>
          )}
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {sectionsToShow.length > 0 ? (
              sectionsToShow.map((section) => {
                const isCustom = section.origin === 'custom';
                
                return (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors ${
                      section.isSpecial ? 'bg-blue-600/10 border border-blue-400/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs">
                        {section.isDisabled ? '❌' : '✅'}
                        {isCustom && ' ➕'}
                        {section.isSpecial && ' 📋'}
                      </span>
                      <span className={`text-sm truncate ${section.isDisabled ? 'text-white/50' : 'text-white'}`}>
                        {section.title}
                      </span>
                    </div>
                    <button
                      onClick={() => actions.toggleSection(section.id)}
                      className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                        section.isDisabled
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {section.isDisabled 
                        ? (t('editor.desktop.sections.activate' as any) || 'Activate')
                        : (t('editor.desktop.sections.deactivate' as any) || 'Deactivate')
                      }
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-white/60 text-center py-4">
                {t('editor.desktop.sections.emptyHint' as any) || 'No sections available'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

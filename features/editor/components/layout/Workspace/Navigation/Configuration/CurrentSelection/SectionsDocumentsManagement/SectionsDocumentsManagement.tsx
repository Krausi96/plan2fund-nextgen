import React, { useMemo } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { InfoTooltip } from '../RequirementsDisplay/RequirementsDisplay';
import { 
  isSpecialSectionId,
  buildSectionsForConfig,
  buildDocumentsForConfig,
  getDocumentCounts,
  getSectionTitle,
} from '@/features/editor/lib/helpers';
import type { ProductOption } from '../shared';

type SectionsDocumentsManagementProps = {
  // Sections & Documents data
  allSections?: SectionTemplate[];
  allDocuments?: DocumentTemplate[];
  disabledSections?: Set<string>;
  disabledDocuments?: Set<string>;
  enabledSectionsCount: number;
  totalSectionsCount: number;
  enabledDocumentsCount: number;
  totalDocumentsCount: number;
  // Toggle handlers
  onToggleSection?: (sectionId: string) => void;
  onToggleDocument?: (documentId: string) => void;
  // Add custom items
  showAddDocument?: boolean;
  showAddSection?: boolean;
  onToggleAddDocument?: () => void;
  onToggleAddSection?: () => void;
  onAddCustomDocument?: () => void;
  onAddCustomSection?: () => void;
  // Product info for core product display
  productType?: ProductType;
  selectedProductMeta?: ProductOption | null;
  // Program info for status message
  programSummary?: ProgramSummary | null;
};

/**
 * SectionsDocumentsManagement component
 * Handles Step 3 of the configurator: Sections and Documents management with toggle lists and add forms
 */
export default function SectionsDocumentsManagement({
  allSections = [],
  allDocuments = [],
  disabledSections = new Set(),
  disabledDocuments = new Set(),
  enabledSectionsCount,
  totalSectionsCount,
  enabledDocumentsCount,
  totalDocumentsCount,
  onToggleSection,
  onToggleDocument,
  showAddDocument = false,
  showAddSection = false,
  onToggleAddDocument,
  onToggleAddSection,
  onAddCustomDocument,
  onAddCustomSection,
  productType,
  selectedProductMeta,
  programSummary
}: SectionsDocumentsManagementProps) {
  const { t } = useI18n();

  // Use centralized section building logic
  const sectionsToShow = useMemo(() => {
    const getTitle = (sectionId: string, originalTitle: string) =>
      getSectionTitle(sectionId, originalTitle, t);

    return buildSectionsForConfig({
      allSections,
      disabledSectionIds: Array.from(disabledSections),
      includeAncillary: true,
      includeReferences: true,
      includeAppendices: true,
      getTitle,
    });
  }, [allSections, disabledSections, t]);

  // Use centralized document building logic
  const documentsToShow = useMemo(() => {
    return buildDocumentsForConfig({
      allDocuments,
      disabledDocumentIds: Array.from(disabledDocuments),
      selectedProductMeta: null,
    });
  }, [allDocuments, disabledDocuments]);

  return (
    <div className="mb-4 pb-2">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-white/90 uppercase">
          {t('editor.desktop.config.step3.title' as any) || 'ABSCHNITTE & DOKUMENTE'}
        </span>
        <InfoTooltip
          title={t('editor.desktop.config.step3.title' as any) || 'Abschnitte & Dokumente'}
          content={t('editor.desktop.config.step3.description' as any) || 'Abschnitte und Dokumente werden automatisch basierend auf Ihrem Plan-Typ und verbundenem Programm generiert. Sie können sie anpassen.'}
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
          {t('editor.desktop.config.step3.description' as any) || 'Abschnitte und Dokumente werden automatisch basierend auf Ihrem Plan-Typ und verbundenem Programm generiert. Sie können sie anpassen.'}
        </p>
        
        {/* Documents List - Moved above Sections */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/90 uppercase">
              {t('editor.desktop.selection.documentsLabel' as any) || 'DOKUMENTE'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {enabledDocumentsCount}/{totalDocumentsCount}
              </span>
              {onToggleAddDocument && (
                <button
                  onClick={onToggleAddDocument}
                  className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  title={t('editor.desktop.documents.addButton' as any) || 'Add Document'}
                >
                  + {t('editor.desktop.documents.addButton' as any) || 'Add'}
                </button>
              )}
            </div>
          </div>
          
          {/* Add Document Form - TODO: Replace with shared AddItemForm component */}
          {showAddDocument && onSetNewDocumentName && onSetNewDocumentDescription && onAddCustomDocument && (
            <div className="mb-3 p-3 border border-dashed border-white/20 rounded-lg text-white/60 text-xs">
              [Add Document Form - To be recreated as shared component]
            </div>
          )}
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {/* Core Product Document - Always shown first */}
            {productType && selectedProductMeta && (
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
                    {onToggleDocument && (
                      <button
                        onClick={() => onToggleDocument(document.id)}
                        className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                          document.isDisabled
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {document.isDisabled 
                          ? (t('editor.desktop.sections.activate' as any) || 'Activate')
                          : (t('editor.desktop.sections.deactivate' as any) || 'Deactivate')
                        }
                      </button>
                    )}
                  </div>
                );
              })
            ) : !productType ? (
              <p className="text-sm text-white/60 text-center py-4">
                {t('editor.desktop.documents.emptyHint' as any) || 'Keine Dokumente verfügbar'}
              </p>
            ) : null}
          </div>
        </div>

        {/* Sections List */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/90 uppercase">
              {t('editor.desktop.selection.sectionsLabel' as any) || 'ABSCHNITTE'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {enabledSectionsCount}/{totalSectionsCount}
              </span>
              {onToggleAddSection && (
                <button
                  onClick={onToggleAddSection}
                  className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  title={t('editor.desktop.sections.addButton' as any) || 'Add Section'}
                >
                  + {t('editor.desktop.sections.addButton' as any) || 'Add'}
                </button>
              )}
            </div>
          </div>
          
          {/* Add Section Form - TODO: Replace with shared AddItemForm component */}
          {showAddSection && onSetNewSectionTitle && onSetNewSectionDescription && onAddCustomSection && (
            <div className="mb-3 p-3 border border-dashed border-white/20 rounded-lg text-white/60 text-xs">
              [Add Section Form - To be recreated as shared component]
            </div>
          )}
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
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
                    {onToggleSection && (
                      <button
                        onClick={() => onToggleSection(section.id)}
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
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-white/60 text-center py-4">
                {t('editor.desktop.sections.emptyHint' as any) || 'Keine Abschnitte verfügbar'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





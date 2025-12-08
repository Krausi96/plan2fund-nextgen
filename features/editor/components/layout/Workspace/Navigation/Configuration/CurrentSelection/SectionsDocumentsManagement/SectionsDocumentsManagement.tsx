import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { METADATA_SECTION_ID, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/lib/hooks/useEditorStore';
import { InfoTooltip } from '../RequirementsDisplay/RequirementsDisplay';

type ProductOption = {
  value: ProductType;
  label: string;
  description: string;
  icon?: string;
};

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
  newDocumentName?: string;
  newDocumentDescription?: string;
  newSectionTitle?: string;
  newSectionDescription?: string;
  onToggleAddDocument?: () => void;
  onToggleAddSection?: () => void;
  onAddCustomDocument?: () => void;
  onAddCustomSection?: () => void;
  onSetNewDocumentName?: (name: string) => void;
  onSetNewDocumentDescription?: (desc: string) => void;
  onSetNewSectionTitle?: (title: string) => void;
  onSetNewSectionDescription?: (desc: string) => void;
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
  newDocumentName = '',
  newDocumentDescription = '',
  newSectionTitle = '',
  newSectionDescription = '',
  onToggleAddDocument,
  onToggleAddSection,
  onAddCustomDocument,
  onAddCustomSection,
  onSetNewDocumentName,
  onSetNewDocumentDescription,
  onSetNewSectionTitle,
  onSetNewSectionDescription,
  productType,
  selectedProductMeta,
  programSummary
}: SectionsDocumentsManagementProps) {
  const { t } = useI18n();

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
          
          {/* Add Document Form */}
          {showAddDocument && onSetNewDocumentName && onSetNewDocumentDescription && onAddCustomDocument && (
            <div className="mb-3 p-3 border border-blue-400/30 bg-blue-600/10 rounded-lg space-y-2">
              <p className="text-xs text-white/90 font-semibold mb-2">
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
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onAddCustomDocument}
                  disabled={!newDocumentName.trim()}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('editor.desktop.documents.custom.add' as any) || 'Hinzufügen'}
                </button>
                <button
                  onClick={onToggleAddDocument}
                  className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {t('editor.desktop.documents.custom.cancel' as any) || 'Abbrechen'}
                </button>
              </div>
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
            {allDocuments.length > 0 ? (
              allDocuments.map((document) => {
                const isDisabled = disabledDocuments.has(document.id);
                const isCustom = document.origin === 'custom';
                return (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs">
                        {isDisabled ? '❌' : '✅'}
                        {isCustom && ' ➕'}
                      </span>
                      <span className={`text-sm truncate ${isDisabled ? 'text-white/50' : 'text-white'}`}>
                        {document.name}
                      </span>
                    </div>
                    {onToggleDocument && (
                      <button
                        onClick={() => onToggleDocument(document.id)}
                        className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                          isDisabled
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isDisabled 
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
          
          {/* Add Section Form */}
          {showAddSection && onSetNewSectionTitle && onSetNewSectionDescription && onAddCustomSection && (
            <div className="mb-3 p-3 border border-blue-400/30 bg-blue-600/10 rounded-lg space-y-2">
              <p className="text-xs text-white/90 font-semibold mb-2">
                {t('editor.desktop.sections.custom.title' as any) || 'Ein benutzerdefinierter Abschnitt zu Ihrem Plan hinzufügen'}
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/70 block mb-1">
                    {t('editor.desktop.sections.custom.name' as any) || 'Titel *'}
                  </label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => onSetNewSectionTitle(e.target.value)}
                    placeholder={t('editor.desktop.sections.custom.namePlaceholder' as any) || 'z.B. Zusammenfassung'}
                    className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/70 block mb-1">
                    {t('editor.desktop.sections.custom.description' as any) || 'Beschreibung'}
                  </label>
                  <textarea
                    value={newSectionDescription}
                    onChange={(e) => onSetNewSectionDescription(e.target.value)}
                    placeholder={t('editor.desktop.sections.custom.descriptionPlaceholder' as any) || 'Optionale Beschreibung des Abschnitts'}
                    rows={2}
                    className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onAddCustomSection}
                  disabled={!newSectionTitle.trim()}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('editor.desktop.sections.custom.add' as any) || 'Hinzufügen'}
                </button>
                <button
                  onClick={onToggleAddSection}
                  className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {t('editor.desktop.sections.custom.cancel' as any) || 'Abbrechen'}
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(() => {
              // Create special sections: METADATA, ANCILLARY (TOC), REFERENCES, APPENDICES
              const metadataSection: SectionTemplate = {
                id: METADATA_SECTION_ID,
                title: t('editor.section.metadata' as any) || 'Title Page',
                description: '',
                required: true,
                wordCountMin: 0,
                wordCountMax: 0,
                order: 0,
                category: 'metadata',
                prompts: [],
                questions: [],
                validationRules: { requiredFields: [], formatRequirements: [] },
                origin: 'master'
              };
              
              const ancillarySection: SectionTemplate = {
                id: ANCILLARY_SECTION_ID,
                title: t('editor.section.ancillary' as any) || 'Table of Contents',
                description: 'Includes List of Tables and List of Figures',
                required: false,
                wordCountMin: 0,
                wordCountMax: 0,
                order: 1,
                category: 'ancillary',
                prompts: [],
                questions: [],
                validationRules: { requiredFields: [], formatRequirements: [] },
                origin: 'master'
              };
              
              const referencesSection: SectionTemplate = {
                id: REFERENCES_SECTION_ID,
                title: t('editor.section.references' as any) || 'References',
                description: '',
                required: false,
                wordCountMin: 0,
                wordCountMax: 0,
                order: 9998,
                category: 'references',
                prompts: [],
                questions: [],
                validationRules: { requiredFields: [], formatRequirements: [] },
                origin: 'master'
              };
              
              const appendicesSection: SectionTemplate = {
                id: APPENDICES_SECTION_ID,
                title: t('editor.section.appendices' as any) || 'Appendices',
                description: '',
                required: false,
                wordCountMin: 0,
                wordCountMax: 0,
                order: 9999,
                category: 'appendices',
                prompts: [],
                questions: [],
                validationRules: { requiredFields: [], formatRequirements: [] },
                origin: 'master'
              };
              
              // Combine: METADATA, ANCILLARY first, then regular sections, then REFERENCES, APPENDICES last
              const sectionsToShow = [metadataSection, ancillarySection, ...allSections, referencesSection, appendicesSection];
              
              return sectionsToShow.length > 0 ? (
                sectionsToShow.map((section) => {
                  const isDisabled = disabledSections.has(section.id);
                  const isCustom = section.origin === 'custom';
                  const isSpecialSection = section.id === METADATA_SECTION_ID || section.id === ANCILLARY_SECTION_ID || section.id === REFERENCES_SECTION_ID || section.id === APPENDICES_SECTION_ID;
                  
                  return (
                    <div
                      key={section.id}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors ${
                        isSpecialSection ? 'bg-blue-600/10 border border-blue-400/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs">
                          {isDisabled ? '❌' : '✅'}
                          {isCustom && ' ➕'}
                          {isSpecialSection && ' 📋'}
                        </span>
                        <span className={`text-sm truncate ${isDisabled ? 'text-white/50' : 'text-white'}`}>
                          {section.title}
                        </span>
                      </div>
                      {onToggleSection && (
                        <button
                          onClick={() => onToggleSection(section.id)}
                          className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                            isDisabled
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {isDisabled 
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
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}


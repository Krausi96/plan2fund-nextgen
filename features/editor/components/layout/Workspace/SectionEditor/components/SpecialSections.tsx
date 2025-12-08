// Special Sections Handler component for InlineSectionEditor
// Handles Title Page, Table of Contents, References, and Appendices editing UI

import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { METADATA_SECTION_ID } from '@/features/editor/lib/hooks/useEditorStore';
import type { BusinessPlan } from '@/features/editor/lib/types/plan';

type InlineSectionEditorSpecialSectionsProps = {
  // Section type flags
  isMetadataSection: boolean;
  isAncillarySection: boolean;
  isReferencesSection: boolean;
  isAppendicesSection: boolean;
  
  // Plan data
  plan: BusinessPlan;
  
  // Callbacks
  onTitlePageChange: (titlePage: any) => void;
  onReferenceAdd: (reference: any) => void;
  onAppendixAdd: (item: any) => void;
  
  // Stats for display
  titlePageFields: { completed: number; total: number };
  tocStats: { sections: number; withPages: number };
  referencesCount: number;
  appendicesCount: number;
};

export default function InlineSectionEditorSpecialSections({
  isMetadataSection,
  isAncillarySection,
  isReferencesSection,
  isAppendicesSection,
  plan,
  onTitlePageChange,
  onReferenceAdd,
  onAppendixAdd,
  titlePageFields,
  tocStats,
  referencesCount,
  appendicesCount
}: InlineSectionEditorSpecialSectionsProps) {
  const { t } = useI18n();
  
  return (
    <>
      {/* Enhanced Context Section for Special Sections */}
      <div className="border-b border-white/20 p-3 bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-white/90 flex items-center gap-2">
            {isMetadataSection && `📄 ${t('editor.section.metadata' as any) || 'Title Page'}`}
            {isAncillarySection && `📑 ${t('editor.section.ancillary' as any) || 'Table of Contents'}`}
            {isReferencesSection && `📚 ${t('editor.section.references' as any) || 'References'}`}
            {isAppendicesSection && `📎 ${t('editor.section.appendices' as any) || 'Appendices'}`}
          </div>
          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {isMetadataSection && (
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && onTitlePageChange) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          onTitlePageChange({ ...plan.titlePage, logoUrl: reader.result });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="text-xs px-2 py-1 rounded border border-white/20 bg-slate-700/50 hover:bg-slate-600 text-white/80 hover:text-white transition-colors"
              >
                {t('editor.desktop.documents.addButton' as any) || 'Upload Logo'}
              </button>
            )}
            {isReferencesSection && plan.references && (
              <button
                onClick={() => {
                  const citation = prompt(t('editor.ui.answerPlaceholder' as any) || 'Enter citation:');
                  if (citation && onReferenceAdd) {
                    onReferenceAdd({
                      id: `ref_${Date.now()}`,
                      citation: citation.trim(),
                      url: ''
                    });
                  }
                }}
                className="text-xs px-2 py-1 rounded border border-white/20 bg-slate-700/50 hover:bg-slate-600 text-white/80 hover:text-white transition-colors"
              >
                + {t('editor.desktop.sections.addButton' as any) || 'Add'}
              </button>
            )}
            {isAppendicesSection && plan.appendices && (
              <button
                onClick={() => {
                  const title = prompt(t('editor.ui.answerPlaceholder' as any) || 'Enter appendix title:');
                  if (title && onAppendixAdd) {
                    onAppendixAdd({
                      id: `appendix_${Date.now()}`,
                      title: title.trim(),
                      description: ''
                    });
                  }
                }}
                className="text-xs px-2 py-1 rounded border border-white/20 bg-slate-700/50 hover:bg-slate-600 text-white/80 hover:text-white transition-colors"
              >
                + {t('editor.desktop.sections.addButton' as any) || 'Add'}
              </button>
            )}
          </div>
        </div>
        
        {/* Context Information */}
        <div className="text-xs text-white/70 space-y-1">
          {isMetadataSection && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">
                {t('editor.ui.edit' as any) || 'Editing:'}
              </span>
              <span className="text-white/90">
                {plan.titlePage?.logoUrl 
                  ? (t('editor.section.metadata' as any) || 'Logo')
                  : plan.titlePage?.companyName
                  ? (t('editor.section.metadata' as any) || 'Company')
                  : (t('editor.section.metadata' as any) || 'General Information')}
              </span>
            </div>
          )}
          {isAncillarySection && plan.ancillary && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">
                {t('editor.section.ancillary' as any) || 'TOC:'}
              </span>
              <span className="text-white/90">
                {plan.ancillary.tableOfContents?.length || 0} {t('editor.desktop.selection.sectionsLabel' as any) || 'sections'}
                {plan.ancillary.tableOfContents && plan.ancillary.tableOfContents.length > 0 && (
                  <span className="text-white/60 ml-1">
                    ({plan.ancillary.tableOfContents.filter(e => e.page).length} {t('editor.desktop.selection.sectionsLabel' as any) || 'with pages'})
                  </span>
                )}
              </span>
            </div>
          )}
          {isReferencesSection && plan.references && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">
                {t('editor.section.references' as any) || 'References:'}
              </span>
              <span className="text-white/90">
                {plan.references.length} {plan.references.length === 1 
                  ? (t('editor.section.references' as any) || 'reference')
                  : (t('editor.section.references' as any) || 'references')}
              </span>
            </div>
          )}
          {isAppendicesSection && plan.appendices && (
            <div className="flex items-center gap-2">
              <span className="text-white/60">
                {t('editor.section.appendices' as any) || 'Appendices:'}
              </span>
              <span className="text-white/90">
                {plan.appendices.length} {plan.appendices.length === 1
                  ? (t('editor.section.appendices' as any) || 'appendix')
                  : (t('editor.section.appendices' as any) || 'appendices')}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer for Special Sections */}
      <div className="flex items-center justify-between gap-2 p-2.5 border-t border-white/20 bg-slate-800/50 flex-shrink-0">
        <div className="text-xs text-white/70 flex items-center gap-2">
          {isMetadataSection && (
            <>
              <span>
                {titlePageFields.completed}/{titlePageFields.total} {t('editor.ui.complete' as any) || 'fields'}
              </span>
              {titlePageFields.completed === titlePageFields.total && (
                <span className="text-green-400">✓ {t('editor.ui.complete' as any) || 'Complete'}</span>
              )}
            </>
          )}
          {isAncillarySection && (
            <>
              <span>
                {tocStats.sections} {t('editor.desktop.selection.sectionsLabel' as any) || 'sections'}
                {tocStats.withPages > 0 && (
                  <span className="text-white/50 ml-1">
                    ({tocStats.withPages} {t('editor.desktop.selection.sectionsLabel' as any) || 'with pages'})
                  </span>
                )}
              </span>
            </>
          )}
          {isReferencesSection && (
            <>
              <span>
                {referencesCount} {t('editor.section.references' as any) || 'references'}
              </span>
            </>
          )}
          {isAppendicesSection && (
            <>
              <span>
                {appendicesCount} {t('editor.section.appendices' as any) || 'appendices'}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isMetadataSection && (
            <button
              onClick={() => {
                // Scroll to preview title page or focus on it
                const titlePageElement = document.querySelector(`[data-section-id="${METADATA_SECTION_ID}"]`);
                if (titlePageElement) {
                  titlePageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="text-xs px-3 py-1.5 rounded border border-white/20 bg-slate-700/50 hover:bg-slate-600 text-white/80 hover:text-white transition-colors"
            >
              {t('editor.ui.edit' as any) || 'View in Preview'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}


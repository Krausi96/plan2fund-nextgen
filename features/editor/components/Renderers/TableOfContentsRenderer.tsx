// ========= PLAN2FUND — TABLE OF CONTENTS RENDERER =========
// Renders the table of contents page

import React from 'react';
import { 
  type PlanSection,
  ANCILLARY_SECTION_ID,
  PAGE_STYLE,
  calculatePageNumber,
  getTranslation,
  useDisabledSectionsSet,
} from '@/features/editor/lib';
import { type PreviewSettings } from './DocumentRenderer';

interface TableOfContentsRendererProps {
  plan: any;
  sectionsToRender: PlanSection[];
  previewSettings?: PreviewSettings;
}

export default function TableOfContentsRenderer({
  plan,
  sectionsToRender,
  previewSettings = {}
}: TableOfContentsRendererProps) {
  // Access store directly - no prop drilling needed
  const disabledSections = useDisabledSectionsSet();
  const isGerman = plan.language === 'de';
  const t = getTranslation(isGerman);

  if (disabledSections.has(ANCILLARY_SECTION_ID)) {
    return null;
  }

  const renderTocEntry = (
    label: React.ReactNode,
    pageNumber?: number | string,
    options?: { isSubEntry?: boolean }
  ) => {
    const isSubEntry = options?.isSubEntry ?? false;
    return (
      <div
        className={`flex items-center ${isSubEntry ? 'ml-6 text-sm text-gray-700 font-medium' : 'text-base font-semibold text-gray-900'} py-1.5`}
      >
        <span className="min-w-0 truncate">
          {label}
        </span>
        <span className="flex-1 border-b border-dotted border-gray-300 mx-2" />
        {plan.settings.includePageNumbers && pageNumber !== undefined && (
          <span
            className={`${isSubEntry ? 'text-xs text-gray-600' : 'text-sm text-gray-800'} font-medium whitespace-nowrap`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  };

  return (
    <div 
      className="export-preview-page export-preview-toc-page"
      data-section-id={ANCILLARY_SECTION_ID}
      style={PAGE_STYLE}
    >
      <div className="export-preview-page-scaler">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t.tableOfContents}
          </h2>
          <div className="space-y-1">
            {/* Auto-generated entries from sections */}
            {sectionsToRender.map((section: PlanSection, sectionIndex: number) => {
              const sectionNumber = section.fields?.sectionNumber ?? null;
              const sectionLabel = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;
              const subchapters = section.fields?.subchapters || [];
              const sectionWordCount = section.content ? section.content.split(' ').length : 0;
              const sectionPageNumber = calculatePageNumber(sectionIndex, plan.settings.includeTitlePage ?? false);
              
              return (
                <div key={section.key} className="space-y-1">
                  {renderTocEntry(
                    <span className="flex flex-col">
                      <span className="truncate">
                        {sectionLabel}
                      </span>
                      {previewSettings.showWordCount && section.content && (
                        <span className="text-[11px] font-normal text-gray-500">
                          {sectionWordCount} words
                        </span>
                      )}
                    </span>,
                    sectionPageNumber
                  )}
                  {subchapters.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {subchapters.map((sub: { id: string; title: string; numberLabel: string }) => {
                        const subLabel = `${sub.numberLabel ? `${sub.numberLabel}. ` : ''}${sub.title}`;
                        return (
                          <React.Fragment key={sub.id}>
                            {renderTocEntry(
                              <span>{subLabel}</span>,
                              sectionPageNumber,
                              { isSubEntry: true }
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Manual TOC entries */}
            {plan.ancillary?.tableOfContents?.filter((entry: any) => !entry.hidden).map((entry: any) => (
              <div key={entry.id} className="space-y-1">
                {renderTocEntry(
                  <span className="text-gray-600">
                    {entry.title || 'Untitled'}
                  </span>,
                  entry.page ? String(entry.page) : undefined
                )}
              </div>
            ))}
            
            {/* List of Tables in TOC */}
            {(() => {
              const hasTables = sectionsToRender.some((section) => 
                section.tables && Object.keys(section.tables || {}).length > 0
              );
              if (hasTables) {
                const listOfTablesPageNumber = calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false);
                return (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {renderTocEntry(t.listOfTables, listOfTablesPageNumber)}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* List of Figures in TOC */}
            {(() => {
              const hasFigures = sectionsToRender.some((section) => 
                section.figures && section.figures.length > 0
              );
              if (hasFigures) {
                const listOfFiguresPageNumber = calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false, 1);
                return (
                  <div>
                    {renderTocEntry(t.listOfFigures, listOfFiguresPageNumber)}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* References in TOC */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              {renderTocEntry(
                t.references,
                calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false, 2)
              )}
            </div>
            
            {/* Appendices in TOC */}
            <div>
              {renderTocEntry(
                t.appendices,
                calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false, 3)
              )}
            </div>
          </div>
          {/* Footer with page number for TOC */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{t.page} {plan.settings.includeTitlePage ? 2 : 1}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


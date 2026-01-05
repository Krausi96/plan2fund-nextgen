import React from 'react';
import type { PlanDocument, PlanSection } from '@/features/editor/lib';
import { PAGE_STYLE, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID, calculatePageNumber, shouldDisplayPageNumber } from '@/features/editor/lib';

interface TableOfContentsRendererProps {
  planDocument: PlanDocument;
  sectionsToRender: PlanSection[];
  disabledSections: Set<string>;
  t: {
    tableOfContents: string;
    listOfTables: string;
    listOfFigures: string;
    references: string;
    appendices: string;
    page: string;
  };
}

export function TableOfContentsRenderer({ planDocument, sectionsToRender, disabledSections, t }: TableOfContentsRendererProps) {
  if (disabledSections.has(ANCILLARY_SECTION_ID)) return null;
  
  const renderTocEntry = (label: React.ReactNode, pageNumber?: number | string, isSubEntry = false) => (
    <div className={`flex items-center ${isSubEntry ? 'ml-6 text-sm text-gray-700 font-medium' : 'text-base font-semibold text-gray-900'} py-1.5`}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex-1 border-b border-dotted border-gray-300 mx-2" />
      {planDocument.settings.includePageNumbers && pageNumber !== undefined && (
        <span className={`${isSubEntry ? 'text-xs text-gray-600' : 'text-sm text-gray-800'} font-medium whitespace-nowrap`}>{pageNumber}</span>
      )}
    </div>
  );
  
  const hasTables = sectionsToRender.some(s => s.tables && Object.keys(s.tables || {}).length > 0);
  const hasFigures = sectionsToRender.some(s => s.figures && s.figures.length > 0);
  
  return (
    <div className="export-preview-page export-preview-toc-page" data-section-id={ANCILLARY_SECTION_ID} style={PAGE_STYLE}>
      <div className="export-preview-page-scaler">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.tableOfContents}</h2>
          <div className="space-y-1">
            {sectionsToRender.map((section, sectionIndex) => {
              const sectionNumber = section.fields?.sectionNumber ?? null;
              const sectionLabel = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;
              const subchapters = section.fields?.subchapters || [];
              const sectionPageNumber = calculatePageNumber(sectionIndex, planDocument.settings.includeTitlePage ?? false, 0, section.key, planDocument.sections);
              return (
                <div key={section.key} className="space-y-1">
                  {renderTocEntry(<span className="truncate">{sectionLabel}</span>, sectionPageNumber)}
                  {subchapters.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {subchapters.map((sub: { id: string; title: string; numberLabel: string }) => (
                        <React.Fragment key={sub.id}>
                          {renderTocEntry(<span>{sub.numberLabel ? `${sub.numberLabel}. ` : ''}{sub.title}</span>, sectionPageNumber, true)}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {planDocument.ancillary?.tableOfContents?.filter((entry: any) => !entry.hidden).map((entry: any) => (
              <div key={entry.id} className="space-y-1">
                {renderTocEntry(<span className="text-gray-600">{entry.title || 'Untitled'}</span>, entry.page ? String(entry.page) : undefined)}
              </div>
            ))}
            {hasTables && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                {renderTocEntry(t.listOfTables, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 0, 'list_of_tables', planDocument.sections))}
              </div>
            )}
            {hasFigures && (
              <div>{renderTocEntry(t.listOfFigures, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 1, 'list_of_figures', planDocument.sections))}</div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200">
              {renderTocEntry(t.references, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 2, REFERENCES_SECTION_ID, planDocument.sections))}
            </div>
            <div>{renderTocEntry(t.appendices, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 3, APPENDICES_SECTION_ID, planDocument.sections))}</div>
          </div>
          {planDocument.settings.includePageNumbers && (  // Using -1 as sectionIndex for TOC
            <div className="export-preview-page-footer">
              <div>© {planDocument.settings.titlePage?.companyName || 'Author'}</div>
              {!shouldDisplayPageNumber(-1, 'table_of_contents', planDocument.sections) && <div>Confidentiality: Restricted</div>}
              {shouldDisplayPageNumber(-1, 'table_of_contents', planDocument.sections) && <div>{t.page} {planDocument.settings.includeTitlePage ? 2 : 1}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

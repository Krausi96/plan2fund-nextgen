import React from 'react';
import type { PlanDocument, PlanSection } from '@/features/editor/lib';
import { PAGE_STYLE, calculatePageNumber, formatTableLabel, shouldDisplayPageNumber } from '@/features/editor/lib';

interface SectionRendererProps {
  section: PlanSection;
  sectionIndex: number;
  planDocument: PlanDocument;
  previewMode: 'preview' | 'formatted' | 'print';
  t: {
    page: string;
    figure: string;
  };
}

export function SectionRenderer({ section, sectionIndex, planDocument, previewMode, t }: SectionRendererProps) {
  const hasContent = section.content && section.content.trim().length > 0;
  const displayTitle = section.fields?.displayTitle || section.title;
  const pageNumber = calculatePageNumber(sectionIndex, planDocument.settings.includeTitlePage ?? false, 0, section.key, planDocument.sections);
  
  return (
    <div 
      id={`section-${section.id || section.key}`}
      key={section.key} 
      data-section-id={section.key} 
      className="export-preview-page export-preview-section" 
      style={PAGE_STYLE}
    >
      <div className="export-preview-page-scaler">
        <div className="flex h-full flex-col space-y-4">
          <div className="border-b border-gray-200 pb-2 flex-shrink-0">
            <h2 className="text-2xl font-semibold text-gray-900">{displayTitle}</h2>
          </div>
          <div className={`prose max-w-none flex-1 overflow-y-auto min-h-0 ${previewMode === 'formatted' ? 'font-serif' : 'font-sans'}`}>
            {hasContent ? (
              <div className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content || '' }} />
            ) : (
              <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">No content available for this section</div>
            )}
          </div>
          {section.tables && Object.keys(section.tables).length > 0 && (
            <div className="mt-6 space-y-4">
              {Object.entries(section.tables).map(([tableKey, table]: [string, any]) => {
                if (!table || !table.rows || table.rows.length === 0) return null;
                return (
                  <div key={tableKey} className="border border-gray-200 rounded-lg overflow-hidden">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 p-3 bg-gray-50 border-b border-gray-200">{formatTableLabel(tableKey)}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            {table.headers && table.headers.map((header: string, idx: number) => (
                              <th key={idx} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows && table.rows.map((row: any[], rowIdx: number) => (
                            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {row.map((cell: any, cellIdx: number) => (
                                <td key={cellIdx} className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{String(cell || '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {section.figures && section.figures.length > 0 && (
            <div className="mt-6 space-y-4">
              {section.figures.map((figure: any, idx) => (
                <div key={figure.id || idx} className="space-y-2">
                  {figure.uri && <img src={figure.uri} alt={figure.altText || figure.title || 'Figure'} className="w-full rounded-lg border border-gray-200" />}
                  {(figure.caption || figure.description || figure.source || (figure.tags && figure.tags.length > 0)) && (
                    <div className="text-sm text-gray-600 space-y-1 mt-2">
                      {figure.description && <p className="text-xs text-gray-600">{figure.description}</p>}
                      {figure.caption && <p className="italic text-sm">{figure.caption}</p>}
                      {figure.source && <p className="text-xs text-gray-500">Source: {figure.source}</p>}
                      {figure.tags && figure.tags.length > 0 && <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tags: {figure.tags.join(', ')}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {planDocument.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <div>© {planDocument.settings.titlePage?.companyName || 'Author'}</div>
              {!shouldDisplayPageNumber(sectionIndex, section.key, planDocument.sections) && <div>Confidentiality: Restricted</div>}
              {shouldDisplayPageNumber(sectionIndex, section.key, planDocument.sections) && <div>{t.page} {pageNumber}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

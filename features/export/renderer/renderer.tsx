// ========= PLAN2FUND — EXPORT PREVIEW RENDERER =========
// Lightweight component that renders plan previews inside the editor

import React from 'react';
import { PlanDocument, Table } from '@/features/editor/types/plan';

export interface PreviewOptions {
  showWatermark?: boolean;
  watermarkText?: string;
  previewMode?: 'preview' | 'formatted' | 'print';
  selectedSections?: Set<string>;
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
}

interface ExportRendererProps extends PreviewOptions {
  plan: PlanDocument;
}

function ExportRenderer({
  plan,
  showWatermark = false,
  watermarkText = 'DRAFT',
  previewMode = 'preview',
  selectedSections,
  previewSettings = {}
}: ExportRendererProps) {
  const sectionsToRender = selectedSections && selectedSections.size > 0
    ? plan.sections.filter(section => selectedSections.has(section.key))
    : plan.sections;

  return (
    <div className={`export-preview ${previewMode}`}>
      {showWatermark && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
          <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">
            {watermarkText}
          </div>
        </div>
      )}
      
      <div className="relative z-10 space-y-8">
        {plan.settings.includeTitlePage && (
          <div className="preview-title-page border-b border-gray-200/80 py-12 text-center">
            {plan.settings.titlePage?.logoUrl && (
              <img src={plan.settings.titlePage.logoUrl} alt="Company Logo" className="mx-auto mb-4 h-24 object-contain" />
            )}
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-gray-400">
              Business Plan Draft
            </p>
            <h1 className="preview-title mb-3 text-[34px] font-semibold leading-[1.15] text-slate-900">
              {plan.settings.titlePage?.title || 'Business Plan'}
            </h1>
            {plan.settings.titlePage?.subtitle && (
              <p className="text-base text-gray-600">{plan.settings.titlePage.subtitle}</p>
            )}
            {plan.settings.titlePage?.companyName && (
              <p className="text-sm text-gray-500">
                {plan.settings.titlePage.companyName}
                {plan.settings.titlePage?.legalForm && ` (${plan.settings.titlePage.legalForm})`}
              </p>
            )}
            {plan.settings.titlePage?.teamHighlight && (
              <p className="text-sm text-gray-500">{plan.settings.titlePage.teamHighlight}</p>
            )}
            {plan.settings.titlePage?.author && (
              <p className="mt-4 text-sm font-medium text-gray-600">{plan.settings.titlePage.author}</p>
            )}
            {plan.settings.titlePage?.contactInfo && (
              <div className="mt-2 text-xs text-gray-500">
                {plan.settings.titlePage.contactInfo.email && <p>{plan.settings.titlePage.contactInfo.email}</p>}
                {plan.settings.titlePage.contactInfo.phone && <p>{plan.settings.titlePage.contactInfo.phone}</p>}
                {plan.settings.titlePage.contactInfo.website && <p>{plan.settings.titlePage.contactInfo.website}</p>}
                {plan.settings.titlePage.contactInfo.address && <p>{plan.settings.titlePage.contactInfo.address}</p>}
                {plan.settings.titlePage.headquartersLocation && <p>{plan.settings.titlePage.headquartersLocation}</p>}
              </div>
            )}
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gray-400">
              {plan.settings.titlePage?.date || new Date().toLocaleDateString()}
            </p>
            {plan.settings.titlePage?.confidentialityStatement && (
              <p className="mt-4 text-xs text-gray-500 italic max-w-xl mx-auto">
                {plan.settings.titlePage.confidentialityStatement}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
          <div className="space-y-1">
            {sectionsToRender.map((section) => {
              const sectionNumber = section.fields?.sectionNumber ?? null;
              const sectionLabel = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;
              const subchapters = section.fields?.subchapters || [];
              
              return (
                <div key={section.key} className="space-y-1">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      {sectionLabel}
                    </span>
                    {previewSettings.showWordCount && section.content && (
                      <span className="text-xs text-gray-500">
                        {section.content.split(' ').length} words
                      </span>
                    )}
                  </div>
                  {subchapters.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {subchapters.map((sub: { id: string; title: string; numberLabel: string }) => (
                        <div key={sub.id} className="text-sm text-gray-600">
                          {sub.numberLabel}. {sub.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              const hasAnyAttachments = sectionsToRender.some((section) => 
                (section.tables && Object.keys(section.tables || {}).length > 0) || 
                (section.figures && section.figures && section.figures.length > 0)
              );
              if (hasAnyAttachments) {
                return (
                  <div className="flex justify-between items-center py-1 mt-2 pt-2 border-t border-gray-200">
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      Attachments
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {sectionsToRender.map((section) => {
          const hasContent = section.content && section.content.trim().length > 0;
          const wordCount = section.content ? section.content.split(' ').length : 0;
          const charCount = section.content ? section.content.length : 0;
          const displayTitle = section.fields?.displayTitle || section.title;
          const actualStatus = section.status || (hasContent ? 'aligned' : 'missing');
          const isComplete = actualStatus === 'aligned';
          
          return (
            <div key={section.key} className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-900">{displayTitle}</h2>
                {previewSettings.showCompletionStatus && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {isComplete ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Incomplete
                      </span>
                    )}
                    {previewSettings.showWordCount && (
                      <span>{wordCount} words</span>
                    )}
                    {previewSettings.showCharacterCount && (
                      <span>{charCount} characters</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className={`prose max-w-none ${
                previewMode === 'formatted' ? 'font-serif' : 'font-sans'
              }`}>
                {hasContent ? (
                  <div 
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: section.content || '' }}
                  />
                ) : (
                  <div className="text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    No content available for this section
                  </div>
                )}
              </div>

              {/* Render Tables & Charts if they exist */}
              {section.tables && Object.keys(section.tables).length > 0 && (
                <div className="mt-6 space-y-4">
                  {Object.entries(section.tables).map(([tableKey, table]) => {
                    if (!table) return null;
                    return (
                      <div key={tableKey}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          {formatTableLabel(tableKey)}
                        </h4>
                        {renderTable(table)}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Render Figures if they exist */}
              {section.figures && section.figures.length > 0 && (
                <div className="mt-6 space-y-4">
                  {section.figures.map((figure: any, idx) => (
                    <div key={idx} className="space-y-2">
                      {figure.uri && (
                        <img
                          src={figure.uri}
                          alt={figure.altText || figure.title || 'Figure'}
                          className="w-full rounded-lg border border-gray-200"
                        />
                      )}
                      {figure.caption && (
                        <p className="text-sm italic text-gray-600">{figure.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Attachments section at the end */}
        {(() => {
          const allAttachments: Array<{ type: string; name: string; sectionTitle: string; sectionNumber: number | null }> = [];
          sectionsToRender.forEach((section) => {
            const sectionNumber = section.fields?.sectionNumber ?? null;
            if (section.tables && Object.keys(section.tables).length > 0) {
              Object.keys(section.tables).forEach((tableKey) => {
                allAttachments.push({
                  type: 'table',
                  name: formatTableLabel(tableKey),
                  sectionTitle: section.title,
                  sectionNumber
                });
              });
            }
            if (section.figures && section.figures.length > 0) {
              section.figures.forEach((figure: any) => {
                allAttachments.push({
                  type: figure.type || 'figure',
                  name: figure.title || 'Figure',
                  sectionTitle: section.title,
                  sectionNumber
                });
              });
            }
          });

          if (allAttachments.length > 0) {
            return (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">Attachments</h2>
                </div>
                <div className="space-y-3">
                  {allAttachments.map((attachment, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-semibold">{attachment.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({attachment.type}) — {attachment.sectionNumber !== null ? `${attachment.sectionNumber}. ` : ''}{attachment.sectionTitle}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* References section */}
        {plan.references && plan.references.length > 0 && (
          <div className="section-block space-y-4">
            <div className="section-heading border-b border-gray-200/80 pb-3">
              <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">References</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              {plan.references.map((ref) => (
                <li key={ref.id}>
                  {ref.citation} {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">[{ref.url}]</a>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Appendices section */}
        {plan.appendices && plan.appendices.length > 0 && (
          <div className="section-block space-y-4">
            <div className="section-heading border-b border-gray-200/80 pb-3">
              <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">Appendices</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              {plan.appendices.map((appendix) => (
                <li key={appendix.id}>
                  <strong>{appendix.title}</strong>: {appendix.description}
                  {appendix.fileUrl && <a href={appendix.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> [Link]</a>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportRenderer;

function formatTableLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}

function renderTable(table: Table) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 border-b border-gray-200">Item</th>
            {table.columns.map((column, index) => (
              <th key={index} className="text-right px-3 py-2 border-b border-gray-200">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700">{row.label}</td>
              {row.values.map((value, valueIndex) => (
                <td key={valueIndex} className="px-3 py-2 text-right text-gray-600">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

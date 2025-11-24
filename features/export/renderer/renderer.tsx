// ========= PLAN2FUND — EXPORT PREVIEW RENDERER =========
// Lightweight component that renders plan previews inside the editor

import React from 'react';
import { PlanDocument, Table } from '@/features/editor/types/plan';

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

  // Language support
  const isGerman = plan.language === 'de';
  const t = {
    businessPlan: isGerman ? 'Geschäftsplan' : 'Business Plan',
    tableOfContents: isGerman ? 'Inhaltsverzeichnis' : 'Table of Contents',
    listOfTables: isGerman ? 'Tabellenverzeichnis' : 'List of Tables',
    listOfFigures: isGerman ? 'Abbildungsverzeichnis' : 'List of Figures',
    references: isGerman ? 'Referenzen' : 'References',
    appendices: isGerman ? 'Anhänge' : 'Appendices',
    email: isGerman ? 'E-Mail' : 'Email',
    phone: isGerman ? 'Telefon' : 'Phone',
    website: isGerman ? 'Website' : 'Website',
    page: isGerman ? 'Seite' : 'Page',
    noTablesYet: isGerman ? 'Noch keine Tabellen hinzugefügt. Tabellen erscheinen hier, sobald Sie sie zu Ihren Abschnitten hinzufügen.' : 'No tables added yet. Tables will appear here once you add them to your sections.',
    noFiguresYet: isGerman ? 'Noch keine Abbildungen hinzugefügt. Bilder und Abbildungen erscheinen hier, sobald Sie sie zu Ihren Abschnitten hinzufügen.' : 'No figures added yet. Images and figures will appear here once you add them to your sections.',
    noReferencesYet: isGerman ? 'Noch keine Referenzen hinzugefügt. Fügen Sie Zitate und Referenzen hinzu, um Ihren Geschäftsplan zu unterstützen.' : 'No references added yet. Add citations and references to support your business plan.',
    noAppendicesYet: isGerman ? 'Noch keine Anhänge hinzugefügt. Fügen Sie ergänzende Materialien, Dokumente oder zusätzliche Informationen hier hinzu.' : 'No appendices added yet. Add supplementary materials, documents, or additional information here.',
    figure: isGerman ? 'Abbildung' : 'Figure'
  };

  return (
    <div className={`export-preview ${previewMode}`}>
      {showWatermark && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
          <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">
            {watermarkText}
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        {plan.settings.includeTitlePage && (() => {
          const dateLocale = isGerman ? 'de-DE' : 'en-US';
          
          return (
            <div 
              className="preview-title-page export-preview-page flex flex-col justify-between py-12 px-8"
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white'
              }}
            >
              {/* Top Section: Logo and Document Type */}
              <div className="flex-shrink-0 flex flex-col items-center mb-8">
                {plan.settings.titlePage?.logoUrl && (
                  <div className="mb-6">
                    <img 
                      src={plan.settings.titlePage.logoUrl} 
                      alt="Company Logo" 
                      className="mx-auto h-20 object-contain" 
                    />
                  </div>
                )}
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                  {t.businessPlan}
                </p>
              </div>

              {/* Center Section: Title and Company Info */}
              <div className="flex-1 flex flex-col justify-center items-center text-center max-w-2xl mx-auto px-4">
                <h1 className="preview-title mb-3 text-2xl sm:text-3xl font-bold leading-tight text-slate-900">
                  {plan.settings.titlePage?.title || t.businessPlan}
                </h1>
                
                {plan.settings.titlePage?.subtitle && (
                  <p className="text-sm text-gray-600 font-normal leading-relaxed mb-4">
                    {plan.settings.titlePage.subtitle}
                  </p>
                )}

                {plan.settings.titlePage?.companyName && (
                  <div className="mb-2">
                    <p className="text-base font-semibold text-gray-800">
                      {plan.settings.titlePage.companyName}
                      {plan.settings.titlePage?.legalForm && (
                        <span className="font-normal text-gray-600"> ({plan.settings.titlePage.legalForm})</span>
                      )}
                    </p>
                    {plan.settings.titlePage?.teamHighlight && (
                      <p className="text-xs text-gray-600 italic mt-1">{plan.settings.titlePage.teamHighlight}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Section: Author, Contact, Date */}
              <div className="flex-shrink-0 w-full mt-auto pt-8">
                {plan.settings.titlePage?.author && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-700 mb-2">
                      <span className="font-semibold">{isGerman ? 'Autor' : 'Author'}:</span>{' '}
                      <span className="font-normal">{plan.settings.titlePage.author}</span>
                    </p>
                    {plan.settings.titlePage?.contactInfo && (
                      <div className="space-y-1 text-xs text-gray-600">
                        {plan.settings.titlePage.contactInfo.email && (
                          <p>
                            <span className="font-medium text-gray-700">{t.email}:</span>{' '}
                            <span>{plan.settings.titlePage.contactInfo.email}</span>
                          </p>
                        )}
                        {plan.settings.titlePage.contactInfo.phone && (
                          <p>
                            <span className="font-medium text-gray-700">{t.phone}:</span>{' '}
                            <span>{plan.settings.titlePage.contactInfo.phone}</span>
                          </p>
                        )}
                        {plan.settings.titlePage.contactInfo.website && (
                          <p>
                            <span className="font-medium text-gray-700">{t.website}:</span>{' '}
                            <a 
                              href={plan.settings.titlePage.contactInfo.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {plan.settings.titlePage.contactInfo.website}
                            </a>
                          </p>
                        )}
                        {(plan.settings.titlePage.contactInfo.address || plan.settings.titlePage.headquartersLocation) && (
                          <p className="mt-1">
                            <span className="font-medium text-gray-700">{isGerman ? 'Adresse' : 'Address'}:</span>{' '}
                            <span>{plan.settings.titlePage.contactInfo.address || plan.settings.titlePage.headquartersLocation}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="w-full flex justify-between items-end pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">{isGerman ? 'Datum' : 'Date'}:</span>{' '}
                      <span>{plan.settings.titlePage?.date || new Date().toLocaleDateString(dateLocale, { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </p>
                  </div>
                  {plan.settings.titlePage?.confidentialityStatement && (
                    <div className="text-right max-w-md">
                      <p className="text-xs text-gray-500 italic leading-relaxed">
                        {plan.settings.titlePage.confidentialityStatement}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div 
          className="export-preview-page export-preview-toc-page"
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            background: 'white'
          }}
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.tableOfContents}
            </h2>
            <div className="space-y-1">
            {sectionsToRender.map((section, sectionIndex) => {
              const sectionNumber = section.fields?.sectionNumber ?? null;
              const sectionLabel = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;
              const subchapters = section.fields?.subchapters || [];
              // Calculate page number: TOC is page 1 (or 2 if title page exists), sections start from there
              const sectionPageNumber = sectionIndex + (plan.settings.includeTitlePage ? 2 : 1);
              
              return (
                <div key={section.key} className="space-y-1">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      {sectionLabel}
                    </span>
                    <div className="flex items-center gap-3">
                      {plan.settings.includePageNumbers && (
                        <span className="text-xs text-gray-400 font-medium">
                          {sectionPageNumber}
                        </span>
                      )}
                      {previewSettings.showWordCount && section.content && (
                        <span className="text-xs text-gray-500">
                          {section.content.split(' ').length} words
                        </span>
                      )}
                    </div>
                  </div>
                  {subchapters.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {subchapters.map((sub: { id: string; title: string; numberLabel: string }) => (
                        <div key={sub.id} className="flex justify-between items-center text-sm text-gray-600">
                          <span>
                            {sub.numberLabel ? `${sub.numberLabel}. ` : ''}{sub.title}
                          </span>
                          {plan.settings.includePageNumbers && (
                            <span className="text-xs text-gray-400 font-medium ml-2">
                              {sectionPageNumber}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {/* List of Tables in TOC */}
            {(() => {
              const hasTables = sectionsToRender.some((section) => 
                section.tables && Object.keys(section.tables || {}).length > 0
              );
              if (hasTables) {
                const listOfTablesPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1);
                return (
                  <div className="flex justify-between items-center py-1 mt-2 pt-2 border-t border-gray-200">
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      {t.listOfTables}
                    </span>
                    {plan.settings.includePageNumbers && (
                      <span className="text-xs text-gray-400 font-medium">
                        {listOfTablesPageNumber}
                      </span>
                    )}
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
                const listOfFiguresPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 1;
                return (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      {t.listOfFigures}
                    </span>
                    {plan.settings.includePageNumbers && (
                      <span className="text-xs text-gray-400 font-medium">
                        {listOfFiguresPageNumber}
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* References in TOC */}
            <div className="flex justify-between items-center py-1 mt-2 pt-2 border-t border-gray-200">
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                {t.references}
              </span>
              {plan.settings.includePageNumbers && (
                <span className="text-xs text-gray-400 font-medium">
                  {sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 2}
                </span>
              )}
            </div>
            
            {/* Appendices in TOC */}
            <div className="flex justify-between items-center py-1">
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                {t.appendices}
              </span>
              {plan.settings.includePageNumbers && (
                <span className="text-xs text-gray-400 font-medium">
                  {sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 3}
                </span>
              )}
            </div>
            </div>
          </div>
          {/* Footer with page number for TOC */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{plan.settings.includeTitlePage ? 2 : 1}</span>
            </div>
          )}
        </div>

        {sectionsToRender.map((section, sectionIndex) => {
          const hasContent = section.content && section.content.trim().length > 0;
          const wordCount = section.content ? section.content.split(' ').length : 0;
          const charCount = section.content ? section.content.length : 0;
          const displayTitle = section.fields?.displayTitle || section.title;
          const actualStatus = section.status || (hasContent ? 'aligned' : 'missing');
          const isComplete = actualStatus === 'aligned';
          // Calculate page number: TOC is page 1 (or 2 if title page exists), sections start from there
          const pageNumber = sectionIndex + (plan.settings.includeTitlePage ? 2 : 1);
          
          return (
            <div 
              key={section.key} 
              className="export-preview-page export-preview-section"
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white'
              }}
            >
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-200 pb-2 flex-shrink-0">
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
              
              <div className={`prose max-w-none flex-1 overflow-y-auto min-h-0 ${
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
              {/* Footer with page number */}
              {plan.settings.includePageNumbers && (
                <div className="export-preview-page-footer">
                  <span>{pageNumber}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* List of Tables */}
        {(() => {
          const allTables: Array<{ name: string; sectionTitle: string; sectionNumber: number | null }> = [];
          sectionsToRender.forEach((section) => {
            const sectionNumber = section.fields?.sectionNumber ?? null;
            if (section.tables && Object.keys(section.tables).length > 0) {
              Object.keys(section.tables).forEach((tableKey) => {
                allTables.push({
                  name: formatTableLabel(tableKey),
                  sectionTitle: section.title,
                  sectionNumber
                });
              });
            }
          });

          const listOfTablesPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1);

          return (
            <div 
              className="export-preview-page export-preview-section"
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white'
              }}
            >
              <div className="section-block space-y-4">
                <div className="section-heading border-b border-gray-200/80 pb-3">
                  <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.listOfTables}</h2>
                </div>
                {allTables.length > 0 ? (
                  <div className="space-y-2">
                    {allTables.map((table, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        <span className="font-semibold">{table.name}</span>
                        <span className="text-gray-500 ml-2">
                          — {table.sectionNumber !== null ? `${table.sectionNumber}. ` : ''}{table.sectionTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    {t.noTablesYet}
                  </div>
                )}
              </div>
              {/* Footer with page number */}
              {plan.settings.includePageNumbers && (
                <div className="export-preview-page-footer">
                  <span>{listOfTablesPageNumber}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* List of Figures */}
        {(() => {
          const allFigures: Array<{ name: string; sectionTitle: string; sectionNumber: number | null }> = [];
          sectionsToRender.forEach((section) => {
            const sectionNumber = section.fields?.sectionNumber ?? null;
            if (section.figures && section.figures.length > 0) {
              section.figures.forEach((figure: any) => {
                  allFigures.push({
                    name: figure.title || t.figure,
                    sectionTitle: section.title,
                    sectionNumber
                  });
              });
            }
          });

          const listOfFiguresPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 1;

          return (
            <div 
              className="export-preview-page export-preview-section"
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white'
              }}
            >
              <div className="section-block space-y-4">
                <div className="section-heading border-b border-gray-200/80 pb-3">
                  <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.listOfFigures}</h2>
                </div>
              {allFigures.length > 0 ? (
                <div className="space-y-2">
                  {allFigures.map((figure, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-semibold">{figure.name}</span>
                      <span className="text-gray-500 ml-2">
                        — {figure.sectionNumber !== null ? `${figure.sectionNumber}. ` : ''}{figure.sectionTitle}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  {t.noFiguresYet}
                </div>
              )}
              </div>
              {/* Footer with page number */}
              {plan.settings.includePageNumbers && (
                <div className="export-preview-page-footer">
                  <span>{listOfFiguresPageNumber}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* References section */}
        <div 
          className="export-preview-page export-preview-section"
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            background: 'white'
          }}
        >
          <div className="section-block space-y-4">
            <div className="section-heading border-b border-gray-200/80 pb-3">
              <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.references}</h2>
            </div>
          {plan.references && plan.references.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              {plan.references.map((ref) => (
                <li key={ref.id}>
                  {ref.citation} {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">[{ref.url}]</a>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              {t.noReferencesYet}
            </div>
          )}
          </div>
          {/* Footer with page number */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 2}</span>
            </div>
          )}
        </div>

        {/* Appendices section */}
        <div 
          className="export-preview-page export-preview-section"
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            background: 'white'
          }}
        >
          <div className="section-block space-y-4">
            <div className="section-heading border-b border-gray-200/80 pb-3">
              <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.appendices}</h2>
            </div>
          {plan.appendices && plan.appendices.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              {plan.appendices.map((appendix) => (
                <li key={appendix.id}>
                  <strong>{appendix.title}</strong>: {appendix.description}
                  {appendix.fileUrl && <a href={appendix.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> [Link]</a>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              {t.noAppendicesYet}
            </div>
          )}
          </div>
          {/* Footer with page number */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 3}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExportRenderer;

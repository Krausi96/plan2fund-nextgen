import React from 'react';
import type { PlanDocument, PlanSection } from '@/features/editor/lib';
import { 
  PAGE_STYLE, 
  ANCILLARY_SECTION_ID, 
  REFERENCES_SECTION_ID, 
  APPENDICES_SECTION_ID,
  calculatePageNumber,
  shouldDisplayPageNumber,
  formatTableLabel
} from '@/features/editor/lib';

interface AncillaryRenderersProps {
  planDocument: PlanDocument;
  sectionsToRender: PlanSection[];
  disabledSections: Set<string>;
  t: {
    listOfTables: string;
    listOfFigures: string;
    references: string;
    appendices: string;
    page: string;
    figure: string;
    noReferencesYet: string;
    noAppendicesYet: string;
  };
}

export function ListOfTablesRenderer({ planDocument, sectionsToRender, disabledSections, t }: AncillaryRenderersProps) {
  if (disabledSections.has(ANCILLARY_SECTION_ID)) return null;
  
  const allTables: Array<{ id: string; name: string; sectionTitle: string; sectionNumber: number | null }> = [];
  sectionsToRender.forEach((section) => {
    const sectionNumber = section.fields?.sectionNumber ?? null;
    if (section.tables && Object.keys(section.tables).length > 0) {
      Object.keys(section.tables).forEach((tableKey) => {
        const metadata = section.fields?.tableMetadata?.[tableKey] ?? null;
        allTables.push({ id: metadata?.id || tableKey, name: metadata?.name || formatTableLabel(tableKey), sectionTitle: section.title, sectionNumber });
      });
    }
  });
  const manualTables = planDocument.ancillary?.listOfTables || [];
  const allTableEntries = [...allTables, ...manualTables.map((t: any) => ({ id: t.id, name: t.label, sectionTitle: '', sectionNumber: null }))];
  if (allTableEntries.length === 0) return null;
  
  const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 0, 'list_of_tables', planDocument.sections);
  
  return (
    <div className="export-preview-page export-preview-section" data-section-id={ANCILLARY_SECTION_ID} style={PAGE_STYLE}>
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.listOfTables}</h2>
          </div>
          <div className="space-y-3">
            {allTableEntries.map((table: any) => (
              <div key={table.id} className="text-sm text-gray-700 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{table.name}</span>
                  {table.sectionTitle && (
                    <span className="text-gray-500 ml-2">— {table.sectionNumber !== null ? `${table.sectionNumber}. ` : ''}{table.sectionTitle}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {planDocument.settings.includePageNumbers && (  // Using -1 as sectionIndex for ancillary sections
          <div className="export-preview-page-footer">
            <div>© {planDocument.settings.titlePage?.companyName || 'Author'}</div>
            {!shouldDisplayPageNumber(-1, 'list_of_figures', planDocument.sections) && <div>Confidentiality: Restricted</div>}
            {shouldDisplayPageNumber(-1, 'list_of_figures', planDocument.sections) && <div>{t.page} {pageNumber}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ListOfFiguresRenderer({ planDocument, sectionsToRender, disabledSections, t }: AncillaryRenderersProps) {
  if (disabledSections.has(ANCILLARY_SECTION_ID)) return null;
  
  const allFigures: Array<{ id?: string; name: string; sectionTitle: string; sectionNumber: number | null }> = [];
  sectionsToRender.forEach((section) => {
    const sectionNumber = section.fields?.sectionNumber ?? null;
    if (section.figures && section.figures.length > 0) {
      section.figures.forEach((figure: any) => {
        allFigures.push({ id: figure.id, name: figure.title || t.figure, sectionTitle: section.title, sectionNumber });
      });
    }
  });
  const manualFigures = planDocument.ancillary?.listOfIllustrations || [];
  const allFigureEntries = [...allFigures, ...manualFigures.map((f: any) => ({ id: f.id, name: f.label, sectionTitle: '', sectionNumber: null }))];
  if (allFigureEntries.length === 0) return null;
  
  const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 1, 'list_of_figures', planDocument.sections);
  
  return (
    <div className="export-preview-page export-preview-section" data-section-id={ANCILLARY_SECTION_ID} style={PAGE_STYLE}>
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.listOfFigures}</h2>
          </div>
          <div className="space-y-3">
            {allFigureEntries.map((figure: any) => (
              <div key={figure.id || figure.name} className="text-sm text-gray-700 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{figure.name}</span>
                  {figure.sectionTitle && (
                    <span className="text-gray-500 ml-2">— {figure.sectionNumber !== null ? `${figure.sectionNumber}. ` : ''}{figure.sectionTitle}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {planDocument.settings.includePageNumbers && (  // Using -1 as sectionIndex for ancillary sections
          <div className="export-preview-page-footer">
            <div>© {planDocument.settings.titlePage?.companyName || 'Author'}</div>
            {shouldDisplayPageNumber(-1, 'list_of_figures', planDocument.sections) && <div>{t.page} {pageNumber}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReferencesRenderer({ planDocument, sectionsToRender, disabledSections, t }: AncillaryRenderersProps) {
  if (disabledSections.has(REFERENCES_SECTION_ID)) return null;
  
  const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 2, REFERENCES_SECTION_ID, planDocument.sections);
  
  return (
    <div className="export-preview-page export-preview-section" data-section-id={REFERENCES_SECTION_ID} style={PAGE_STYLE}>
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.references}</h2>
          </div>
          {planDocument.references && planDocument.references.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
              {planDocument.references.map((ref: any) => (
                <li key={ref.id}>
                  <div className="space-y-2">
                    <div>{ref.citation || <span className="text-gray-400 italic">No citation</span>}</div>
                    {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">[{ref.url}]</a>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">{t.noReferencesYet}</div>
          )}
        </div>
        {planDocument.settings.includePageNumbers && (  // Using -1 as sectionIndex for ancillary sections
          <div className="export-preview-page-footer">
            <div>© {planDocument.settings.titlePage?.companyName || 'Author'}</div>
            {!shouldDisplayPageNumber(-1, REFERENCES_SECTION_ID, planDocument.sections) && <div>Confidentiality: Restricted</div>}
            {shouldDisplayPageNumber(-1, REFERENCES_SECTION_ID, planDocument.sections) && <div>{t.page} {pageNumber}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppendicesRenderer({ planDocument, sectionsToRender, disabledSections, t }: AncillaryRenderersProps) {
  if (disabledSections.has(APPENDICES_SECTION_ID)) return null;
  
  const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 3, APPENDICES_SECTION_ID, planDocument.sections);
  
  return (
    <div className="export-preview-page export-preview-section" data-section-id={APPENDICES_SECTION_ID} style={PAGE_STYLE}>
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 className="text-[21px] font-semibold tracking-tight text-slate-900">{t.appendices}</h2>
          </div>
          {planDocument.appendices && planDocument.appendices.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
              {planDocument.appendices.map((appendix) => (
                <li key={appendix.id} className="space-y-2">
                  <strong>{appendix.title || <span className="text-gray-400 italic">No title</span>}</strong>
                  <div>{appendix.description || <span className="text-gray-400 italic">No description</span>}</div>
                  {appendix.fileUrl && <a href={appendix.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">[Link]</a>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">{t.noAppendicesYet}</div>
          )}
        </div>
        {planDocument.settings.includePageNumbers && (  // Using -1 as sectionIndex for ancillary sections
          <div className="export-preview-page-footer">
            <div>© {planDocument.settings.titlePage?.companyName || 'Author'}</div>
            {!shouldDisplayPageNumber(-1, APPENDICES_SECTION_ID, planDocument.sections) && <div>Confidentiality: Restricted</div>}
            {shouldDisplayPageNumber(-1, APPENDICES_SECTION_ID, planDocument.sections) && <div>{t.page} {pageNumber}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

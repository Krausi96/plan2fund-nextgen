import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { 
  type PlanDocument, 
  type PlanSection,
  usePreviewState,
  PAGE_STYLE,
  calculatePageNumber,
  getTranslation,
  formatTableLabel,
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  useDisabledSectionsSet,
  useEditorActions,
} from '@/features/editor/lib';

type ZoomPreset = '50' | '75' | '100' | '125' | '150' | '200';
type PreviewMode = 'preview' | 'formatted' | 'print';

const ZOOM_PRESETS: Record<ZoomPreset, number> = {
  '50': 0.5, '75': 0.75, '100': 1, '125': 1.25, '150': 1.5, '200': 2
};

const getPreviewPadding = (width: number) => Math.min(40, width * 0.05);
const getInitialPreviewPadding = () => typeof window !== 'undefined' ? getPreviewPadding(window.innerWidth) : 40;
const calculateViewportZoom = (viewMode: 'page' | 'fluid', zoomPreset: ZoomPreset, fitScale: number) => {
  if (viewMode === 'fluid') return 1;
  return ZOOM_PRESETS[zoomPreset] * fitScale;
};
const calculateFitScale = (width: number, height: number) => {
  const pageWidth = 210 * 3.779527559;
  const pageHeight = 297 * 3.779527559;
  const scaleX = (width - 80) / pageWidth;
  const scaleY = (height - 80) / pageHeight;
  return Math.min(scaleX, scaleY, 1);
};
const createViewportStyle = (padding: number) => ({ padding: `${padding}px` });
const createZoomStyle = (zoom: number) => ({ transform: `scale(${zoom})`, transformOrigin: 'top left' });
const getViewModeButtonClass = (current: 'page' | 'fluid', mode: 'page' | 'fluid') => 
  `px-3 py-1 rounded text-sm font-medium transition-colors ${
    current === mode ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
  }`;
const getZoomButtonClass = (current: ZoomPreset, id: ZoomPreset) =>
  `px-2 py-1 rounded text-xs font-medium transition-colors ${
    current === id ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
  }`;

// Helper function to get field value from plan
const getFieldValue = (plan: PlanDocument, fieldKey: string): string | undefined => {
  const titlePage = plan.settings?.titlePage;
  if (!titlePage) return undefined;
  switch (fieldKey) {
    case 'title': return titlePage.title;
    case 'subtitle': return titlePage.subtitle;
    case 'companyName': return titlePage.companyName;
    case 'legalForm': return titlePage.legalForm;
    case 'teamHighlight': return titlePage.teamHighlight;
    case 'author': return (titlePage.contactInfo as any)?.name || titlePage.companyName;
    case 'email': return titlePage.contactInfo?.email;
    case 'phone': return titlePage.contactInfo?.phone;
    case 'website': return titlePage.contactInfo?.website;
    case 'address': return titlePage.contactInfo?.address || titlePage.headquartersLocation;
    case 'date': return titlePage.date;
    case 'confidentialityStatement': return titlePage.confidentialityStatement;
    default: return undefined;
  }
};

function PreviewPanel() {
  const { t: i18nT } = useI18n();
  const previewState = usePreviewState();
  const { plan, isNewUser, hasPlan } = previewState;
  const disabledSections = useDisabledSectionsSet();
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));
  const [viewMode, setViewMode] = useState<'page' | 'fluid'>('page');
  const [showWatermark, setShowWatermark] = useState(true);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('100');
  const [fitScale, setFitScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [previewPadding, setPreviewPadding] = useState(() => getInitialPreviewPadding());
  
  const onOpenConfigurator = () => {
    actions.setIsConfiguratorOpen(true);
  };
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePadding = () => setPreviewPadding(getPreviewPadding(window.innerWidth));
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  useEffect(() => {
    if (viewMode !== 'page' || typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      setFitScale(1);
      return;
    }
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect || {};
      if (!width || !height) return;
      setFitScale(calculateFitScale(width, height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [viewMode]);

  const planDocument = useMemo<PlanDocument | null>(() => plan ? plan as PlanDocument : null, [plan]);
  const viewportZoom = calculateViewportZoom(viewMode, zoomPreset, fitScale);
  const zoomStyle = createZoomStyle(viewportZoom);
  const previewMode: PreviewMode = viewMode === 'page' ? 'formatted' : 'preview';
  const isGerman = planDocument?.language === 'de';
  const t = getTranslation(isGerman);
  const sectionsToRender = planDocument?.sections || [];

  if (isNewUser || !hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900/40 rounded-lg">
        <div className="max-w-md space-y-6">
          {/* Large icon with pencil */}
          <div className="flex justify-center relative">
            <div className="text-6xl mb-2 relative">
              <span className="relative z-10">📝</span>
            </div>
          </div>
          
          {/* CTA Button */}
          {onOpenConfigurator && (
            <button
              onClick={onOpenConfigurator}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {(() => {
                const key = 'editor.desktop.preview.emptyState.cta';
                const translated = i18nT(key as any) as string;
                const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
                return isMissing ? (isGerman ? 'Plan starten' : 'Start Your Plan') : translated;
              })()}
            </button>
          )}
          
          {/* Description */}
          <p className="text-white/80 text-sm leading-relaxed">
            {(() => {
              const key = 'editor.desktop.preview.emptyState.description';
              const translated = i18nT(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? (isGerman ? 'Es gibt viele Wege, such dir deinen aus.' : 'There are many ways, choose yours.') : translated;
            })()}
          </p>
          
          {/* Options */}
          <div className="mt-4 flex flex-col gap-6 text-left text-xs text-white/60">
            <div className="group relative flex items-center gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 group-hover:w-10 group-hover:h-10 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xl group-hover:text-lg transition-all duration-200">
                📋
              </span>
              <span className="flex-1 cursor-help">{(() => {
                const key = 'editor.desktop.preview.emptyState.optionA';
                const translated = i18nT(key as any) as string;
                const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
                return isMissing ? (isGerman 
                  ? 'Wähle einen Plan (Strategiedokument, Individueller Business-Plan oder Upgrade) aus. Du kannst später ein Förderprogramm hinzufügen, um programmspezifische Anforderungen und Empfehlungen zu erhalten.'
                  : 'Start by selecting a plan (Strategy, Review, or Submission). You can add a funding program later to get program-specific requirements and recommendations.') : translated;
              })()}</span>
            </div>
            <div className="group relative flex items-center gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 group-hover:w-10 group-hover:h-10 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xl group-hover:text-lg transition-all duration-200">
                🔍
              </span>
              <span className="flex-1 cursor-help">{(() => {
                const key = 'editor.desktop.preview.emptyState.optionB';
                const translated = i18nT(key as any) as string;
                const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
                return isMissing ? (isGerman
                  ? 'Suche oder verbinde ein Förderprogramm. Wir empfehlen die notwendigen Dokumente und stellen programmspezifische Anforderungen und Dokumentenvorlagen bereit.'
                  : "Start by finding or connecting a funding program. We'll recommend a plan and provide program-specific requirements and document templates.") : translated;
              })()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!planDocument) {
    return (
      <div className="flex items-center justify-center h-full w-full text-white/60 text-sm">
        Start drafting your sections to see the live business plan preview here.
      </div>
    );
  }

  const viewportStyle = createViewportStyle(previewPadding);

  const renderTitlePage = () => {
    if (!planDocument.settings.includeTitlePage || disabledSections.has(METADATA_SECTION_ID)) return null;
    const tp = planDocument.settings.titlePage;
    const fv = (key: string) => getFieldValue(planDocument, key);
    return (
      <div className="preview-title-page export-preview-page" data-section-id={METADATA_SECTION_ID} style={PAGE_STYLE}>
        <div className="export-preview-page-scaler">
          <div className="flex flex-col justify-between h-full py-16 px-10">
            <div className="flex-shrink-0 flex flex-col items-center mb-12">
              {tp?.logoUrl && <img src={tp.logoUrl} alt="Company Logo" className="mx-auto h-24 object-contain mb-8" />}
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{t.businessPlan}</p>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto px-6">
              <h1 className="preview-title mb-4 text-3xl sm:text-4xl font-bold leading-tight text-slate-900">{fv('title') || 'Plan Title'}</h1>
              {fv('subtitle') && <p className="text-base text-gray-600 font-normal leading-relaxed mb-6 max-w-2xl block">{fv('subtitle')}</p>}
              <div className="mb-4">
                <div className="text-lg font-semibold text-gray-800 block">{fv('companyName') || 'Company Name'}</div>
                {fv('legalForm') && <span className="font-normal text-gray-600 ml-2">{fv('legalForm')}</span>}
                {fv('teamHighlight') && <p className="text-sm text-gray-600 italic mt-2 block">{fv('teamHighlight')}</p>}
              </div>
            </div>
            <div className="flex-shrink-0 w-full mt-auto pt-10">
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-3">
                  <span className="font-semibold">{t.author}:</span> <span className="font-normal">{fv('author') || 'Author / Company Name'}</span>
                </p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  {fv('email') && <p><span className="font-medium text-gray-700">{t.email}:</span> {fv('email')}</p>}
                  {fv('phone') && <p><span className="font-medium text-gray-700">{t.phone}:</span> {fv('phone')}</p>}
                  {fv('website') && <p><span className="font-medium text-gray-700">{t.website}:</span> <a href={fv('website')} className="text-blue-600 hover:text-blue-800 underline">{fv('website')}</a></p>}
                  {fv('address') && <p className="mt-2"><span className="font-medium text-gray-700">{t.address}:</span> {fv('address')}</p>}
                </div>
              </div>
              <div className="w-full flex justify-between items-end pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">{t.date}:</span> {fv('date') || 'YYYY-MM-DD'}</p>
                {fv('confidentialityStatement') && <div className="text-right max-w-md"><p className="text-xs text-gray-500 italic leading-relaxed block">{fv('confidentialityStatement')}</p></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTableOfContents = () => {
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
                const sectionPageNumber = calculatePageNumber(sectionIndex, planDocument.settings.includeTitlePage ?? false);
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
                  {renderTocEntry(t.listOfTables, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false))}
                </div>
              )}
              {hasFigures && (
                <div>{renderTocEntry(t.listOfFigures, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 1))}</div>
              )}
              <div className="mt-2 pt-2 border-t border-gray-200">
                {renderTocEntry(t.references, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 2))}
              </div>
              <div>{renderTocEntry(t.appendices, calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 3))}</div>
            </div>
            {planDocument.settings.includePageNumbers && (
              <div className="export-preview-page-footer"><span>{t.page} {planDocument.settings.includeTitlePage ? 2 : 1}</span></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (section: PlanSection, sectionIndex: number) => {
    const hasContent = section.content && section.content.trim().length > 0;
    const displayTitle = section.fields?.displayTitle || section.title;
    const pageNumber = calculatePageNumber(sectionIndex, planDocument.settings.includeTitlePage ?? false);
    return (
      <div key={section.key} data-section-id={section.key} className="export-preview-page export-preview-section" style={PAGE_STYLE}>
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
              <div className="export-preview-page-footer"><span>{t.page} {pageNumber}</span></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render List of Tables
  const renderListOfTables = () => {
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
    const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false);
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
          {planDocument.settings.includePageNumbers && (
            <div className="export-preview-page-footer"><span>{t.page} {pageNumber}</span></div>
          )}
        </div>
      </div>
    );
  };

  const renderListOfFigures = () => {
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
    const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 1);
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
          {planDocument.settings.includePageNumbers && (
            <div className="export-preview-page-footer"><span>{t.page} {pageNumber}</span></div>
          )}
        </div>
      </div>
    );
  };

  // Render References
  const renderReferences = () => {
    if (disabledSections.has(REFERENCES_SECTION_ID)) return null;
    const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 2);
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
          {planDocument.settings.includePageNumbers && (
            <div className="export-preview-page-footer"><span>{t.page} {pageNumber}</span></div>
          )}
        </div>
      </div>
    );
  };

  const renderAppendices = () => {
    if (disabledSections.has(APPENDICES_SECTION_ID)) return null;
    const pageNumber = calculatePageNumber(sectionsToRender.length, planDocument.settings.includeTitlePage ?? false, 3);
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
          {planDocument.settings.includePageNumbers && (
            <div className="export-preview-page-footer"><span>{t.page} {pageNumber}</span></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-white/60">View</span>
          <button className={getViewModeButtonClass(viewMode, 'page')} onClick={() => setViewMode('page')}>Page</button>
          <button className={getViewModeButtonClass(viewMode, 'fluid')} onClick={() => setViewMode('fluid')}>Fluid</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="rounded border-white/20 bg-transparent text-blue-400 focus:ring-blue-400" />
            Watermark
          </label>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wide text-white/60">Zoom</span>
            {(Object.keys(ZOOM_PRESETS) as ZoomPreset[]).map((id) => (
              <button key={id} className={getZoomButtonClass(zoomPreset, id)} onClick={() => setZoomPreset(id)}>
                {id}%
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-800/30">
        <div ref={viewportRef} className="w-full min-h-full" style={viewportStyle}>
          <div className={`export-preview ${previewMode}`} style={zoomStyle}>
            {showWatermark && (
              <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
                <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">DRAFT</div>
              </div>
            )}
            <div className="relative z-10" style={{ margin: 0, padding: 0 }}>
              {renderTitlePage()}
              {renderTableOfContents()}
              {sectionsToRender.map((section, index) => renderSection(section, index))}
              {renderListOfTables()}
              {renderListOfFigures()}
              {renderReferences()}
              {renderAppendices()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;

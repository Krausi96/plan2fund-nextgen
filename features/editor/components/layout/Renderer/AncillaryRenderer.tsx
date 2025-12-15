// ========= PLAN2FUND — ANCILLARY RENDERER =========
// Renders List of Tables, List of Figures, References, and Appendices

import React from 'react';
import { PlanDocument, PlanSection } from '@/features/editor/lib/types';
import { ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID, formatTableLabel, getFieldValue } from '@/features/editor/lib/helpers';

interface AncillaryRendererProps {
  plan: PlanDocument;
  sectionsToRender: PlanSection[];
  editingSectionId: string | null;
  editingField: string | null;
  editValue: string;
  setEditingField: (field: string | null) => void;
  setEditValue: (value: string) => void;
  onSectionClick?: (sectionId: string) => void;
  onAncillaryChange?: (updates: Partial<any>) => void;
  onReferenceAdd?: (reference: any) => void;
  onReferenceUpdate?: (reference: any) => void;
  onReferenceDelete?: (referenceId: string) => void;
  onAppendixAdd?: (item: any) => void;
  onAppendixUpdate?: (item: any) => void;
  onAppendixDelete?: (appendixId: string) => void;
  disabledSections?: Set<string>;
}

export default function AncillaryRenderer({
  plan,
  sectionsToRender,
  editingSectionId,
  editingField,
  editValue,
  setEditingField,
  setEditValue,
  onSectionClick,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  disabledSections = new Set()
}: AncillaryRendererProps) {
  const isEditingAncillary = editingSectionId === ANCILLARY_SECTION_ID;
  const isEditingReferences = editingSectionId === REFERENCES_SECTION_ID;
  const isEditingAppendices = editingSectionId === APPENDICES_SECTION_ID;
  const isGerman = plan.language === 'de';
  
  const t = {
    listOfTables: isGerman ? 'Tabellenverzeichnis' : 'List of Tables',
    listOfFigures: isGerman ? 'Abbildungsverzeichnis' : 'List of Figures',
    references: isGerman ? 'Referenzen' : 'References',
    appendices: isGerman ? 'Anhänge' : 'Appendices',
    page: isGerman ? 'Seite' : 'Page',
    figure: isGerman ? 'Abbildung' : 'Figure',
    noTablesYet: isGerman ? 'Noch keine Tabellen hinzugefügt. Tabellen erscheinen hier, sobald Sie sie zu Ihren Abschnitten hinzufügen.' : 'No tables added yet. Tables will appear here once you add them to your sections.',
    noFiguresYet: isGerman ? 'Noch keine Abbildungen hinzugefügt. Bilder und Abbildungen erscheinen hier, sobald Sie sie zu Ihren Abschnitten hinzufügen.' : 'No figures added yet. Images and figures will appear here once you add them to your sections.',
    noReferencesYet: isGerman ? 'Noch keine Referenzen hinzugefügt. Fügen Sie Zitate und Referenzen hinzu, um Ihren Geschäftsplan zu unterstützen.' : 'No references added yet. Add citations and references to support your business plan.',
    noAppendicesYet: isGerman ? 'Noch keine Anhänge hinzugefügt. Fügen Sie ergänzende Materialien, Dokumente oder zusätzliche Informationen hier hinzu.' : 'No appendices added yet. Add supplementary materials, documents, or additional information here.'
  };

  const startEditing = (fieldKey: string, targetSectionId: string) => {
    const isInEditMode = editingSectionId === targetSectionId;
    if (!isInEditMode) {
      onSectionClick?.(targetSectionId);
    }
    setEditingField(fieldKey);
    setEditValue(getFieldValue(plan, fieldKey));
  };

  const handleClick = (e: React.MouseEvent, sectionId: string, isEditing: boolean) => {
    const target = e.target as HTMLElement;
    if (isEditing) {
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
        return;
      }
    }
    if (!isEditing) {
      onSectionClick?.(sectionId);
    }
  };

  const pageStyle = {
    width: '210mm',
    height: '297mm',
    backgroundColor: 'white',
    background: 'white',
    margin: 0,
    marginTop: 0,
    marginBottom: 0
  };

  // List of Tables
  const allTables: Array<{
    id: string;
    name: string;
    description?: string;
    source?: string;
    tags?: string[];
    sectionTitle: string;
    sectionNumber: number | null;
    isAuto?: boolean;
    page?: number;
  }> = [];
  sectionsToRender.forEach((section) => {
    const sectionNumber = section.fields?.sectionNumber ?? null;
    if (section.tables && Object.keys(section.tables).length > 0) {
      Object.keys(section.tables).forEach((tableKey) => {
        const metadata = section.fields?.tableMetadata?.[tableKey] ?? null;
        allTables.push({
          id: metadata?.id || tableKey,
          name: metadata?.name || formatTableLabel(tableKey),
          description: metadata?.description,
          source: metadata?.source,
          tags: metadata?.tags,
          sectionTitle: section.title,
          sectionNumber,
          isAuto: true
        });
      });
    }
  });

  const listOfTablesPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1);
  const manualTables = plan.ancillary?.listOfTables || [];
  const allTableEntries = [
    ...allTables.map(t => ({ ...t, isAuto: true })),
    ...manualTables.map(t => ({ 
      id: t.id, 
      name: t.label, 
      description: undefined, 
      source: undefined, 
      tags: undefined,
      sectionTitle: '',
      sectionNumber: null,
      page: t.page,
      isAuto: false 
    }))
  ];

  // List of Figures
  const allFigures: Array<{
    id?: string;
    name: string;
    caption?: string;
    description?: string;
    source?: string;
    tags?: string[];
    sectionTitle: string;
    sectionNumber: number | null;
    isAuto?: boolean;
    page?: number;
  }> = [];
  sectionsToRender.forEach((section) => {
    const sectionNumber = section.fields?.sectionNumber ?? null;
    if (section.figures && section.figures.length > 0) {
      section.figures.forEach((figure: any) => {
        allFigures.push({
          id: figure.id,
          name: figure.title || t.figure,
          caption: figure.caption,
          description: figure.description,
          source: figure.source,
          tags: figure.tags,
          sectionTitle: section.title,
          sectionNumber,
          isAuto: true
        });
      });
    }
  });

  const listOfFiguresPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 1;
  const manualFigures = plan.ancillary?.listOfIllustrations || [];
  const allFigureEntries = [
    ...allFigures,
    ...manualFigures.map(f => ({ 
      id: f.id, 
      name: f.label, 
      caption: undefined, 
      description: undefined, 
      source: undefined, 
      tags: undefined,
      sectionTitle: '',
      sectionNumber: null,
      page: f.page,
      isAuto: false 
    }))
  ];

  return (
    <>
      {/* List of Tables */}
      {allTableEntries.length > 0 && (
        <div 
          className={`export-preview-page export-preview-section ${!isEditingAncillary ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={ANCILLARY_SECTION_ID}
          onClick={(e) => handleClick(e, ANCILLARY_SECTION_ID, isEditingAncillary)}
          style={pageStyle}
        >
          <div className="export-preview-page-scaler">
            <div className="section-block space-y-4">
              <div className="section-heading border-b border-gray-200/80 pb-3">
                <h2 
                  className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditingAncillary) {
                      onSectionClick?.(ANCILLARY_SECTION_ID);
                    }
                  }}
                >
                  {t.listOfTables}
                </h2>
              </div>
              <div className="space-y-3">
                {allTableEntries.map((table: any) => {
                  const isEditingLabel = isEditingAncillary && !table.isAuto && editingField === `table-label-${table.id}`;
                  const isEditingPage = isEditingAncillary && !table.isAuto && editingField === `table-page-${table.id}`;
                  
                  return (
                    <div key={table.id} className={`text-sm text-gray-700 space-y-0.5 group`}>
                      <div className="flex items-center gap-2">
                        {isEditingLabel ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (onAncillaryChange && !table.isAuto) {
                                const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                  t.id === table.id ? { ...t, label: editValue } : t
                                );
                                onAncillaryChange({ listOfTables: updated });
                              }
                              setEditingField(null);
                              setEditValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingField(null);
                                setEditValue('');
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (onAncillaryChange && !table.isAuto) {
                                  const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                    t.id === table.id ? { ...t, label: editValue } : t
                                  );
                                  onAncillaryChange({ listOfTables: updated });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                            className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-semibold"
                          />
                        ) : (
                          <span className={`font-semibold ${table.isAuto ? '' : 'cursor-pointer group/label relative inline-block rounded px-1 py-0.5 transition-all hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}>
                            {table.isAuto ? (
                              <>
                                {table.name}
                                {isEditingAncillary && (
                                  <span className="text-xs text-gray-400 italic ml-2">(auto-generated)</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(`table-label-${table.id}`, ANCILLARY_SECTION_ID);
                                  }}
                                  title="Click to edit"
                                >
                                  {table.name || 'Untitled'}
                                </span>
                                <span className="absolute -top-1 -right-1 opacity-70">
                                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </span>
                              </>
                            )}
                          </span>
                        )}
                        {!table.isAuto && (
                          <>
                            {isEditingPage ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  if (onAncillaryChange) {
                                    const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                      t.id === table.id ? { ...t, page: parseInt(editValue) || undefined } : t
                                    );
                                    onAncillaryChange({ listOfTables: updated });
                                  }
                                  setEditingField(null);
                                  setEditValue('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingField(null);
                                    setEditValue('');
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (onAncillaryChange) {
                                      const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                        t.id === table.id ? { ...t, page: parseInt(editValue) || undefined } : t
                                      );
                                      onAncillaryChange({ listOfTables: updated });
                                    }
                                    setEditingField(null);
                                    setEditValue('');
                                  }
                                }}
                                autoFocus
                                className="w-16 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                placeholder="Page"
                              />
                            ) : (
                              <span
                                className="cursor-pointer group/page relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50 text-gray-500 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(`table-page-${table.id}`, ANCILLARY_SECTION_ID);
                                }}
                                title="Click to edit page"
                              >
                                {table.page ? `Page ${table.page}` : '+ Add page'}
                              </span>
                            )}
                            {isEditingAncillary && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onAncillaryChange) {
                                    const updated = (plan.ancillary?.listOfTables || []).filter(t => t.id !== table.id);
                                    onAncillaryChange({ listOfTables: updated });
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                                title="Delete entry"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {table.isAuto && table.sectionTitle && (
                          <span className="text-gray-500 ml-2">
                            — {table.sectionNumber !== null ? `${table.sectionNumber}. ` : ''}{table.sectionTitle}
                          </span>
                        )}
                      </div>
                      {table.description && (
                        <p className="text-xs text-gray-500">{table.description}</p>
                      )}
                      {table.source && (
                        <p className="text-xs text-gray-500">Source: {table.source}</p>
                      )}
                      {table.tags && table.tags.length > 0 && (
                        <p className="text-[11px] text-gray-400 uppercase">Tags: {table.tags.join(', ')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {isEditingAncillary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAncillaryChange) {
                      const updated = [
                        ...(plan.ancillary?.listOfTables || []),
                        { id: `table_${Date.now()}`, label: 'New table', page: undefined, type: 'table' as const }
                      ];
                      onAncillaryChange({ listOfTables: updated });
                    }
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  + Add Table Entry
                </button>
              )}
            </div>
            {plan.settings.includePageNumbers && (
              <div className="export-preview-page-footer">
                <span>{t.page} {listOfTablesPageNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List of Figures */}
      {allFigureEntries.length > 0 && (
        <div 
          className={`export-preview-page export-preview-section ${!isEditingAncillary ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={ANCILLARY_SECTION_ID}
          onClick={(e) => handleClick(e, ANCILLARY_SECTION_ID, isEditingAncillary)}
          style={pageStyle}
        >
          <div className="export-preview-page-scaler">
            <div className="section-block space-y-4">
              <div className="section-heading border-b border-gray-200/80 pb-3">
                <h2 
                  className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditingAncillary) {
                      onSectionClick?.(ANCILLARY_SECTION_ID);
                    }
                  }}
                >
                  {t.listOfFigures}
                </h2>
              </div>
              <div className="space-y-3">
                {allFigureEntries.map((figure: any) => {
                  const isEditingLabel = isEditingAncillary && !figure.isAuto && editingField === `figure-label-${figure.id}`;
                  const isEditingPage = isEditingAncillary && !figure.isAuto && editingField === `figure-page-${figure.id}`;
                  
                  return (
                    <div key={figure.id || figure.name} className={`text-sm text-gray-700 space-y-0.5 group`}>
                      <div className="flex items-center gap-2">
                        {isEditingLabel ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (onAncillaryChange && !figure.isAuto) {
                                const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                  f.id === figure.id ? { ...f, label: editValue } : f
                                );
                                onAncillaryChange({ listOfIllustrations: updated });
                              }
                              setEditingField(null);
                              setEditValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingField(null);
                                setEditValue('');
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (onAncillaryChange && !figure.isAuto) {
                                  const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                    f.id === figure.id ? { ...f, label: editValue } : f
                                  );
                                  onAncillaryChange({ listOfIllustrations: updated });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                            className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-semibold"
                          />
                        ) : (
                          <span className={`font-semibold ${figure.isAuto ? '' : 'cursor-pointer group/label relative inline-block rounded px-1 py-0.5 transition-all hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}>
                            {figure.isAuto ? (
                              <>
                                {figure.name}
                                {isEditingAncillary && (
                                  <span className="text-xs text-gray-400 italic ml-2">(auto-generated)</span>
                                )}
                              </>
                            ) : (
                              <>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(`figure-label-${figure.id}`, ANCILLARY_SECTION_ID);
                                  }}
                                  title="Click to edit"
                                >
                                  {figure.name || 'Untitled'}
                                </span>
                                <span className="absolute -top-1 -right-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </span>
                              </>
                            )}
                          </span>
                        )}
                        {!figure.isAuto && (
                          <>
                            {isEditingPage ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  if (onAncillaryChange) {
                                    const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                      f.id === figure.id ? { ...f, page: parseInt(editValue) || undefined } : f
                                    );
                                    onAncillaryChange({ listOfIllustrations: updated });
                                  }
                                  setEditingField(null);
                                  setEditValue('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingField(null);
                                    setEditValue('');
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (onAncillaryChange) {
                                      const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                        f.id === figure.id ? { ...f, page: parseInt(editValue) || undefined } : f
                                      );
                                      onAncillaryChange({ listOfIllustrations: updated });
                                    }
                                    setEditingField(null);
                                    setEditValue('');
                                  }
                                }}
                                autoFocus
                                className="w-16 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                placeholder="Page"
                              />
                            ) : (
                              <span
                                className="cursor-pointer group/page relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50 text-gray-500 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(`figure-page-${figure.id}`, ANCILLARY_SECTION_ID);
                                }}
                                title="Click to edit page"
                              >
                                {figure.page ? `Page ${figure.page}` : '+ Add page'}
                              </span>
                            )}
                            {isEditingAncillary && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onAncillaryChange) {
                                    const updated = (plan.ancillary?.listOfIllustrations || []).filter(f => f.id !== figure.id);
                                    onAncillaryChange({ listOfIllustrations: updated });
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                                title="Delete entry"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {figure.isAuto && figure.sectionTitle && (
                          <span className="text-gray-500 ml-2">
                            — {figure.sectionNumber !== null ? `${figure.sectionNumber}. ` : ''}{figure.sectionTitle}
                          </span>
                        )}
                      </div>
                      {figure.description && (
                        <p className="text-xs text-gray-500">{figure.description}</p>
                      )}
                      {figure.caption && (
                        <p className="text-xs text-gray-500 italic">{figure.caption}</p>
                      )}
                      {figure.source && (
                        <p className="text-xs text-gray-500">Source: {figure.source}</p>
                      )}
                      {figure.tags && figure.tags.length > 0 && (
                        <p className="text-[11px] text-gray-400 uppercase">Tags: {figure.tags.join(', ')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {isEditingAncillary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAncillaryChange) {
                      const updated = [
                        ...(plan.ancillary?.listOfIllustrations || []),
                        { id: `figure_${Date.now()}`, label: 'New figure', page: undefined, type: 'image' as const }
                      ];
                      onAncillaryChange({ listOfIllustrations: updated });
                    }
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  + Add Figure Entry
                </button>
              )}
            </div>
            {plan.settings.includePageNumbers && (
              <div className="export-preview-page-footer">
                <span>{t.page} {listOfFiguresPageNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* References section */}
      {!disabledSections.has(REFERENCES_SECTION_ID) && (
        <div 
          className={`export-preview-page export-preview-section ${!isEditingReferences ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={REFERENCES_SECTION_ID}
          onClick={(e) => handleClick(e, REFERENCES_SECTION_ID, isEditingReferences)}
          style={pageStyle}
        >
          <div className="export-preview-page-scaler">
            <div className="section-block space-y-4">
              <div className="section-heading border-b border-gray-200/80 pb-3">
                <h2 
                  className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick?.(REFERENCES_SECTION_ID);
                  }}
                >
                  {t.references}
                </h2>
              </div>
              {plan.references && plan.references.length > 0 ? (
                <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
                  {plan.references.map((ref) => {
                    const isEditingCitation = isEditingReferences && editingField === `ref-citation-${ref.id}`;
                    const isEditingUrl = isEditingReferences && editingField === `ref-url-${ref.id}`;
                    
                    return (
                      <li key={ref.id} className="group">
                        <div className="space-y-2">
                          {isEditingCitation ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (onReferenceUpdate) {
                                  onReferenceUpdate({ ...ref, citation: editValue });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingField(null);
                                  setEditValue('');
                                }
                              }}
                              autoFocus
                              className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                              placeholder="Citation"
                            />
                          ) : (
                            <span
                              className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditingReferences) {
                                  setEditingField(`ref-citation-${ref.id}`);
                                  setEditValue(ref.citation || '');
                                } else {
                                  startEditing(`ref-citation-${ref.id}`, REFERENCES_SECTION_ID);
                                }
                              }}
                              title="Click to edit citation"
                            >
                              {ref.citation || <span className="text-gray-400 italic">Click to add citation</span>}
                              <span className="absolute -top-1 -right-1 opacity-70">
                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </span>
                            </span>
                          )}
                          {isEditingUrl ? (
                            <input
                              type="url"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (onReferenceUpdate) {
                                  onReferenceUpdate({ ...ref, url: editValue });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingField(null);
                                  setEditValue('');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (onReferenceUpdate) {
                                    onReferenceUpdate({ ...ref, url: editValue });
                                  }
                                  setEditingField(null);
                                  setEditValue('');
                                }
                              }}
                              autoFocus
                              className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                              placeholder="URL"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {ref.url ? (
                                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                  [{ref.url}]
                                </a>
                              ) : (
                                <span
                                  className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-dashed border-blue-200/50 text-gray-400 italic text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(`ref-url-${ref.id}`, REFERENCES_SECTION_ID);
                                  }}
                                  title="Click to add URL"
                                >
                                  + Add URL
                                </span>
                              )}
                              {isEditingReferences && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onReferenceDelete) {
                                      onReferenceDelete(ref.id);
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                                  title="Delete reference"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  {t.noReferencesYet}
                </div>
              )}
              {isEditingReferences && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReferenceAdd) {
                      onReferenceAdd({
                        id: `ref_${Date.now()}`,
                        citation: '',
                        url: '',
                        accessedDate: new Date().toISOString().split('T')[0]
                      });
                    }
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  + Add Reference
                </button>
              )}
            </div>
            {plan.settings.includePageNumbers && (
              <div className="export-preview-page-footer">
                <span>{t.page} {sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 2}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appendices section */}
      {!disabledSections.has(APPENDICES_SECTION_ID) && (
        <div 
          className={`export-preview-page export-preview-section ${!isEditingAppendices ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={APPENDICES_SECTION_ID}
          onClick={(e) => handleClick(e, APPENDICES_SECTION_ID, isEditingAppendices)}
          style={pageStyle}
        >
          <div className="export-preview-page-scaler">
            <div className="section-block space-y-4">
              <div className="section-heading border-b border-gray-200/80 pb-3">
                <h2 
                  className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionClick?.(APPENDICES_SECTION_ID);
                  }}
                >
                  {t.appendices}
                </h2>
              </div>
              {plan.appendices && plan.appendices.length > 0 ? (
                <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
                  {plan.appendices.map((appendix) => {
                    const isEditingTitle = isEditingAppendices && editingField === `appendix-title-${appendix.id}`;
                    const isEditingDescription = isEditingAppendices && editingField === `appendix-description-${appendix.id}`;
                    const isEditingFileUrl = isEditingAppendices && editingField === `appendix-fileUrl-${appendix.id}`;
                    
                    return (
                      <li key={appendix.id} className="group space-y-2">
                        {isEditingTitle ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (onAppendixUpdate) {
                                onAppendixUpdate({ ...appendix, title: editValue });
                              }
                              setEditingField(null);
                              setEditValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingField(null);
                                setEditValue('');
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (onAppendixUpdate) {
                                  onAppendixUpdate({ ...appendix, title: editValue });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                            className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-semibold"
                            placeholder="Appendix title"
                          />
                        ) : (
                          <strong
                            className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(`appendix-title-${appendix.id}`, APPENDICES_SECTION_ID);
                            }}
                            title="Click to edit title"
                          >
                            {appendix.title || <span className="text-gray-400 italic">Click to add title</span>}
                            <span className="absolute -top-1 -right-1 opacity-70">
                              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </span>
                          </strong>
                        )}
                        {isEditingDescription ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              if (onAppendixUpdate) {
                                onAppendixUpdate({ ...appendix, description: editValue });
                              }
                              setEditingField(null);
                              setEditValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingField(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                            className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                            placeholder="Description"
                            rows={2}
                          />
                        ) : (
                          <span
                            className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(`appendix-description-${appendix.id}`, APPENDICES_SECTION_ID);
                            }}
                            title="Click to edit description"
                          >
                            {appendix.description || <span className="text-gray-400 italic">Click to add description</span>}
                            <span className="absolute -top-1 -right-1 opacity-70">
                              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </span>
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {isEditingFileUrl ? (
                            <input
                              type="url"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (onAppendixUpdate) {
                                  onAppendixUpdate({ ...appendix, fileUrl: editValue });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingField(null);
                                  setEditValue('');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (onAppendixUpdate) {
                                    onAppendixUpdate({ ...appendix, fileUrl: editValue });
                                  }
                                  setEditingField(null);
                                  setEditValue('');
                                }
                              }}
                              autoFocus
                              className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                              placeholder="File URL"
                            />
                          ) : (
                            <>
                              {appendix.fileUrl ? (
                                <a href={appendix.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                                  [Link]
                                </a>
                              ) : (
                                <span
                                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors inline-block text-gray-400 italic text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(`appendix-fileUrl-${appendix.id}`, APPENDICES_SECTION_ID);
                                  }}
                                  title="Click to add file URL"
                                >
                                  + Add File URL
                                </span>
                              )}
                              {isEditingAppendices && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAppendixDelete) {
                                      onAppendixDelete(appendix.id);
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                                  title="Delete appendix"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  {t.noAppendicesYet}
                </div>
              )}
              {isEditingAppendices && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAppendixAdd) {
                      onAppendixAdd({
                        id: `appendix_${Date.now()}`,
                        title: '',
                        description: '',
                        fileUrl: ''
                      });
                    }
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  + Add Appendix
                </button>
              )}
            </div>
            {plan.settings.includePageNumbers && (
              <div className="export-preview-page-footer">
                <span>{t.page} {sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 3}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}




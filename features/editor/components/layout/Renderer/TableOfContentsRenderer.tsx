// ========= PLAN2FUND — TABLE OF CONTENTS RENDERER =========
// Renders the table of contents page

import React from 'react';
import { PlanDocument, PlanSection } from '@/features/editor/lib/types/plan';
import { ANCILLARY_SECTION_ID } from '@/features/editor/lib/helpers/editorHelpers';
import { getFieldValue } from '@/features/editor/lib/helpers/renderHelpers';

interface TableOfContentsRendererProps {
  plan: PlanDocument;
  sectionsToRender: PlanSection[];
  editingSectionId: string | null;
  editingField: string | null;
  editValue: string;
  setEditingField: (field: string | null) => void;
  setEditValue: (value: string) => void;
  onSectionClick?: (sectionId: string) => void;
  onAncillaryChange?: (updates: Partial<any>) => void;
  disabledSections?: Set<string>;
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
}

export default function TableOfContentsRenderer({
  plan,
  sectionsToRender,
  editingSectionId,
  editingField,
  editValue,
  setEditingField,
  setEditValue,
  onSectionClick,
  onAncillaryChange,
  disabledSections = new Set(),
  previewSettings = {}
}: TableOfContentsRendererProps) {
  const isEditingAncillary = editingSectionId === ANCILLARY_SECTION_ID;
  const isGerman = plan.language === 'de';
  
  const t = {
    tableOfContents: isGerman ? 'Inhaltsverzeichnis' : 'Table of Contents',
    listOfTables: isGerman ? 'Tabellenverzeichnis' : 'List of Tables',
    listOfFigures: isGerman ? 'Abbildungsverzeichnis' : 'List of Figures',
    references: isGerman ? 'Referenzen' : 'References',
    appendices: isGerman ? 'Anhänge' : 'Appendices',
    page: isGerman ? 'Seite' : 'Page'
  };

  if (disabledSections.has(ANCILLARY_SECTION_ID)) {
    return null;
  }

  const startEditing = (fieldKey: string, targetSectionId: string) => {
    const isInEditMode = editingSectionId === targetSectionId;
    if (!isInEditMode) {
      onSectionClick?.(targetSectionId);
    }
    setEditingField(fieldKey);
    setEditValue(getFieldValue(plan, fieldKey));
  };

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
      className={`export-preview-page export-preview-toc-page ${!isEditingAncillary ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
      data-section-id={ANCILLARY_SECTION_ID}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (isEditingAncillary) {
          if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
            return;
          }
        }
        if (!isEditingAncillary) {
          onSectionClick?.(ANCILLARY_SECTION_ID);
        }
      }}
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: 'white',
        background: 'white',
        margin: 0,
        marginTop: 0,
        marginBottom: 0
      }}
    >
      <div className="export-preview-page-scaler">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t.tableOfContents}
          </h2>
          <div className="space-y-1">
            {/* Auto-generated entries from sections - editable */}
            {sectionsToRender.map((section, sectionIndex) => {
              const sectionNumber = section.fields?.sectionNumber ?? null;
              const sectionLabel = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;
              const subchapters = section.fields?.subchapters || [];
              const sectionWordCount = section.content ? section.content.split(' ').length : 0;
              const sectionPageNumber = sectionIndex + (plan.settings.includeTitlePage ? 2 : 1);
              
              const isEditingTitle = isEditingAncillary && editingField === `toc-section-title-${section.key}`;
              
              return (
                <div key={section.key} className="space-y-1 group">
                  {renderTocEntry(
                    <span className="flex flex-col">
                      <span className="truncate flex items-center gap-2">
                        {isEditingTitle ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              setEditingField(null);
                              setEditValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingField(null);
                                setEditValue('');
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                setEditingField(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                            className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                          />
                        ) : (
                          <span
                            className={`cursor-pointer group/title relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50`}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(`toc-section-title-${section.key}`, ANCILLARY_SECTION_ID);
                            }}
                            title="Click to edit"
                          >
                            {sectionLabel}
                            {isEditingAncillary && (
                              <span className="text-xs text-gray-400 italic ml-2">(auto-generated)</span>
                            )}
                            <span className="absolute -top-1 -right-1 opacity-70">
                              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </span>
                          </span>
                        )}
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
                        const isEditingSubTitle = isEditingAncillary && editingField === `toc-sub-title-${sub.id}`;
                        return (
                          <React.Fragment key={sub.id}>
                            {renderTocEntry(
                              <span className="flex items-center gap-2">
                                {isEditingSubTitle ? (
                                  <input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      setEditingField(null);
                                      setEditValue('');
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        setEditingField(null);
                                        setEditValue('');
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setEditingField(null);
                                        setEditValue('');
                                      }
                                    }}
                                    autoFocus
                                    className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                  />
                                ) : (
                                  <span
                                    className={`cursor-pointer group/sub relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(`toc-sub-title-${sub.id}`, ANCILLARY_SECTION_ID);
                                    }}
                                    title="Click to edit"
                                  >
                                    {`${sub.numberLabel ? `${sub.numberLabel}. ` : ''}${sub.title}`}
                                    {isEditingAncillary && (
                                      <span className="text-xs text-gray-400 italic ml-2">(auto)</span>
                                    )}
                                    <span className="absolute -top-1 -right-1 opacity-70">
                                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </span>
                                  </span>
                                )}
                              </span>,
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
            {plan.ancillary?.tableOfContents?.filter(entry => !entry.hidden).map((entry) => (
              <div key={entry.id} className="space-y-1">
                {renderTocEntry(
                  <span className="flex items-center gap-2">
                    <span className="text-gray-600">
                      {entry.title || 'Untitled'}
                      <span className="text-xs text-gray-400 italic ml-2">(manual entry - edit in metadata panel)</span>
                    </span>
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
                const listOfTablesPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1);
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
                const listOfFiguresPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 1;
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
                sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 2
              )}
            </div>
            
            {/* Appendices in TOC */}
            <div>
              {renderTocEntry(
                t.appendices,
                sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 3
              )}
            </div>
            
            {/* Add new TOC entry button */}
            {isEditingAncillary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAncillaryChange) {
                    const updated = [
                      ...(plan.ancillary?.tableOfContents || []),
                      { id: `toc_${Date.now()}`, title: 'New entry', hidden: false }
                    ];
                    onAncillaryChange({ tableOfContents: updated });
                  }
                }}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
              >
                + Add TOC Entry
              </button>
            )}
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


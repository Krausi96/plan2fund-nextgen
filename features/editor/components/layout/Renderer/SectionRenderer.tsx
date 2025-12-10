// ========= PLAN2FUND — SECTION RENDERER =========
// Renders individual plan sections

import React from 'react';
import { PlanDocument, PlanSection } from '@/features/editor/lib/types/plan';
import { formatTableLabel, renderTable } from '@/features/editor/lib/helpers/renderHelpers';

interface SectionRendererProps {
  section: PlanSection;
  sectionIndex: number;
  plan: PlanDocument;
  previewMode?: 'preview' | 'formatted' | 'print';
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
  onSectionClick?: (sectionId: string) => void;
}

export default function SectionRenderer({
  section,
  sectionIndex,
  plan,
  previewMode = 'preview',
  previewSettings = {},
  onSectionClick
}: SectionRendererProps) {
  const isGerman = plan.language === 'de';
  const t = {
    page: isGerman ? 'Seite' : 'Page'
  };

  const hasContent = section.content && section.content.trim().length > 0;
  const wordCount = section.content ? section.content.split(' ').length : 0;
  const charCount = section.content ? section.content.length : 0;
  const displayTitle = section.fields?.displayTitle || section.title;
  const actualStatus = section.status || (hasContent ? 'aligned' : 'missing');
  const isComplete = actualStatus === 'aligned';
  const pageNumber = sectionIndex + (plan.settings.includeTitlePage ? 2 : 1);

  return (
    <div 
      key={section.key}
      data-section-id={section.key}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-section-id]') === e.currentTarget) {
          onSectionClick?.(section.key);
        }
      }}
      className={`export-preview-page export-preview-section ${onSectionClick ? 'cursor-pointer hover:bg-blue-50/30 transition-colors rounded-lg' : ''}`}
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: 'white',
        background: 'white',
        margin: 0,
        marginTop: 0,
        marginBottom: 0,
        position: 'relative'
      }}
    >
      {/* Click overlay to ensure clicks work - only on empty areas */}
      {onSectionClick && (
        <div 
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target === e.currentTarget || target.classList.contains('export-preview-page')) {
              onSectionClick(section.key);
            }
          }}
          onPointerDown={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'DIV' || target.classList.contains('export-preview-page')) {
              return;
            }
            e.stopPropagation();
          }}
          style={{ zIndex: 10, pointerEvents: 'none' }}
        />
      )}
      <div 
        className="export-preview-page-scaler" 
        style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}
        onClick={(e) => {
          if (onSectionClick && (e.target as HTMLElement).tagName === 'H2') {
            onSectionClick(section.key);
          }
        }}
      >
        <div className="flex h-full flex-col space-y-4">
          <div className="border-b border-gray-200 pb-2 flex-shrink-0 flex items-start justify-between">
            <h2 
              className="text-2xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                if (onSectionClick) {
                  e.stopPropagation();
                  onSectionClick(section.key);
                }
              }}
            >
              {displayTitle}
            </h2>
            {previewSettings.showCompletionStatus && (
              <div className="flex items-center gap-2 text-xs text-gray-500 ml-4">
                {isComplete ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span className="hidden sm:inline">Complete</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span className="hidden sm:inline">Incomplete</span>
                  </span>
                )}
                {previewSettings.showWordCount && <span className="text-gray-400">• {wordCount} words</span>}
                {previewSettings.showCharacterCount && <span className="text-gray-400">• {charCount} chars</span>}
              </div>
            )}
          </div>

          <div
            className={`prose max-w-none flex-1 overflow-y-auto min-h-0 ${
              previewMode === 'formatted' ? 'font-serif' : 'font-sans'
            }`}
          >
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
                if (!table || !table.rows || table.rows.length === 0) return null;
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
                <div key={figure.id || idx} className="space-y-2">
                  {figure.uri && (
                    <img
                      src={figure.uri}
                      alt={figure.altText || figure.title || 'Figure'}
                      className="w-full rounded-lg border border-gray-200"
                    />
                  )}
                  {(figure.caption || figure.description || figure.source || (figure.tags && figure.tags.length > 0)) && (
                    <div className="text-sm text-gray-600 space-y-1 mt-2">
                      {figure.description && <p className="text-xs text-gray-600">{figure.description}</p>}
                      {figure.caption && <p className="italic text-sm">{figure.caption}</p>}
                      {figure.source && <p className="text-xs text-gray-500">Source: {figure.source}</p>}
                      {figure.tags && figure.tags.length > 0 && (
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tags: {figure.tags.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer with page number */}
        {plan.settings.includePageNumbers && (
          <div className="export-preview-page-footer">
            <span>{t.page} {pageNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}


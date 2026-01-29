import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { PlanDocument, PlanSection } from '@/features/editor/lib';
import { PAGE_STYLE, calculatePageNumber, formatTableLabel, shouldDisplayPageNumber } from '@/features/editor/lib';

/**
 * Sanitize HTML content to prevent XSS attacks
 * All user-provided and LLM-generated content must be sanitized before rendering
 */
function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'title']
  });
}

interface SectionRendererProps {
  section: PlanSection;
  sectionIndex: number;
  planDocument: PlanDocument;
  previewMode: 'preview' | 'formatted' | 'print';
  t: {
    page: string;
    figure: string;
  };
  // Inline editing props
  isEditing?: boolean;
  editContent?: string;
  onStartEdit?: (sectionKey: string, content: string) => void;
  onSaveEdit?: (save: boolean) => void;
  onEditChange?: (content: string) => void;
  editInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function SectionRenderer({ 
  section, 
  sectionIndex, 
  planDocument, 
  previewMode, 
  t,
  isEditing = false,
  editContent = '',
  onStartEdit,
  onSaveEdit,
  onEditChange,
  editInputRef
}: SectionRendererProps) {
  const hasContent = section.content && section.content.trim().length > 0;
  const displayTitle = section.fields?.displayTitle || section.title;
  const pageNumber = calculatePageNumber(sectionIndex, planDocument.settings.includeTitlePage ?? false, 0, section.key, planDocument.sections);
  
  // Check if this section is editable
  const isEditableSection = [
    'executive-summary',
    'company-description',
    'market-analysis',
    'products-services',
    'marketing-sales',
    'team-organization',
    'implementation-plan',
    'risk-analysis',
    'milestones-goals'
  ].includes(section.key);
  
  return (
    <div 
      id={`section-${section.id || section.key}`}
      key={section.key} 
      data-section-id={section.key} 
      className="export-preview-page export-preview-section" 
      style={PAGE_STYLE}
    >
      <div className="flex h-full flex-col space-y-4">
        <div className="border-b border-gray-200 pb-2 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">{displayTitle}</h2>
          {/* Edit button for editable sections */}
          {isEditableSection && !isEditing && (
            <button
              onClick={() => onStartEdit?.(section.key, section.content || '')}
              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors flex items-center gap-1"
              title="Edit this section"
            >
              <span>✏️</span>
              Edit
            </button>
          )}
          {/* Cancel button when editing */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveEdit?.(true)}
                className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors flex items-center gap-1"
                title="Save changes (Ctrl+Enter)"
              >
                <span>💾</span>
                Save
              </button>
              <button
                onClick={() => onSaveEdit?.(false)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center gap-1"
                title="Cancel editing (Escape)"
              >
                <span>❌</span>
                Cancel
              </button>
            </div>
          )}
        </div>
          <div className={`prose max-w-none flex-1 overflow-y-auto min-h-0 ${previewMode === 'formatted' ? 'font-serif' : 'font-sans'}`}>
            {isEditing ? (
              // Edit mode - textarea with full content
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => onEditChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    onSaveEdit?.(true);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onSaveEdit?.(false);
                  }
                }}
                className="w-full h-full min-h-[300px] p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="Edit section content... (Ctrl+Enter to save, Escape to cancel)"
                autoFocus
              />
            ) : hasContent ? (
              // View mode - sanitized content
              <div 
                className={`text-gray-800 leading-relaxed ${isEditableSection ? 'cursor-text hover:bg-blue-50 p-2 rounded -m-2 transition-colors' : ''}`}
                dangerouslySetInnerHTML={{ __html: sanitizeContent(section.content || '') }} 
                onClick={isEditableSection ? () => onStartEdit?.(section.key, section.content || '') : undefined}
              />
            ) : (
              // No content placeholder
              <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                No content available for this section
                {isEditableSection && (
                  <div className="mt-2">
                    <button
                      onClick={() => onStartEdit?.(section.key, '')}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-xs transition-colors"
                    >
                      Add content
                    </button>
                  </div>
                )}
              </div>
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
  );
}

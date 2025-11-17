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

const ExportRenderer: React.FC<ExportRendererProps> = ({
  plan,
  showWatermark = false,
  watermarkText = 'DRAFT',
  previewMode = 'preview',
  selectedSections,
  previewSettings = {}
}) => {
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
          <div className="text-center py-12 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{plan.settings.titlePage?.title || 'Business Plan'}</h1>
            {plan.settings.titlePage?.subtitle && (
              <p className="text-lg text-gray-700 mb-1">{plan.settings.titlePage.subtitle}</p>
            )}
            {plan.settings.titlePage?.author && (
              <p className="text-base text-gray-600 mb-1">{plan.settings.titlePage.author}</p>
            )}
            <p className="text-sm text-gray-500">{plan.settings.titlePage?.date || new Date().toLocaleDateString()}</p>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
          <div className="space-y-1">
            {sectionsToRender.map((section, index) => (
              <div key={section.key} className="flex justify-between items-center py-1">
                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  {index + 1}. {section.title}
                </span>
                {previewSettings.showWordCount && section.content && (
                  <span className="text-xs text-gray-500">
                    {section.content.split(' ').length} words
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {sectionsToRender.map((section) => {
          const hasContent = section.content && section.content.trim().length > 0;
          const wordCount = section.content ? section.content.split(' ').length : 0;
          const charCount = section.content ? section.content.length : 0;
          
          return (
            <div key={section.key} className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                {previewSettings.showCompletionStatus && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {hasContent ? (
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
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {section.content}
                  </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

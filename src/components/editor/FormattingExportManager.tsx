// ========= PLAN2FUND — FORMATTING & EXPORT MANAGER =========
// Phase 4: Formatting options, tone customization, and export functionality

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanDocument } from '@/types/plan';
// TemplateConfig not used in this component
import { exportManager } from '@/lib/export';

interface FormattingExportManagerProps {
  currentPlan: PlanDocument;
  onFormattingChange?: (formatting: FormattingConfig) => void;
  onExport?: (format: ExportFormat) => void;
  showToneCustomization?: boolean;
  showExportOptions?: boolean;
}

interface FormattingConfig {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  headerStyle: 'formal' | 'modern' | 'minimal';
  tone: 'formal' | 'enthusiastic' | 'technical' | 'conversational';
  language: 'en' | 'de';
  pageNumbers: boolean;
  tableOfContents: boolean;
}

type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';

export default function FormattingExportManager({
  currentPlan,
  onFormattingChange,
  onExport,
  showToneCustomization = true,
  showExportOptions = true
}: FormattingExportManagerProps) {
  const [formatting, setFormatting] = useState<FormattingConfig>({
    fontFamily: 'Arial',
    fontSize: 12,
    lineSpacing: 1.5,
    margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    headerStyle: 'formal',
    tone: 'formal',
    language: 'en',
    pageNumbers: true,
    tableOfContents: true
  });
  const [showFormattingPanel, setShowFormattingPanel] = useState(false);

  const handleFormattingChange = (field: keyof FormattingConfig, value: any) => {
    const newFormatting = { ...formatting, [field]: value };
    setFormatting(newFormatting);
    if (onFormattingChange) {
      onFormattingChange(newFormatting);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      // Map UI format to lib format (remove HTML as it's not supported)
      const libFormat = format === 'html' ? 'JSON' : format.toUpperCase() as 'PDF' | 'DOCX' | 'JSON' | 'SUBMISSION_PACK';
      
      // Use the actual export manager (with type assertion for compatibility)
      const result = await exportManager.exportPlan(currentPlan as any, {
        format: libFormat,
        quality: 'standard',
        includeWatermark: true,
        isPaid: false
      });
      
      if (result.success) {
        console.log('Export successful:', result);
        // Trigger download or show success message
      } else {
        console.error('Export failed:', result.error);
        // Show error message to user
      }
    } catch (error) {
      console.error('Export error:', error);
      // Fallback to callback if provided
      if (onExport) {
        onExport(format);
      }
    }
  };

  const getToneDescription = (tone: string) => {
    const descriptions = {
      formal: 'Professional and business-appropriate language',
      enthusiastic: 'Energetic and optimistic tone to show passion',
      technical: 'Precise and detailed language for technical audiences',
      conversational: 'Friendly and approachable tone for general audiences'
    };
    return descriptions[tone as keyof typeof descriptions] || '';
  };

  return (
    <div className="formatting-export-manager space-y-6">
      {/* Formatting Controls */}
      {showToneCustomization && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🎨 Formatting & Tone</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFormattingPanel(!showFormattingPanel)}
            >
              {showFormattingPanel ? 'Hide' : 'Customize'}
            </Button>
          </div>

          {showFormattingPanel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Tone
                </label>
                <select
                  value={formatting.tone}
                  onChange={(e) => handleFormattingChange('tone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="formal">Formal</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="technical">Technical</option>
                  <option value="conversational">Conversational</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getToneDescription(formatting.tone)}
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formatting.language}
                  onChange={(e) => handleFormattingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={formatting.fontFamily}
                  onChange={(e) => handleFormattingChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <input
                  type="number"
                  value={formatting.fontSize}
                  onChange={(e) => handleFormattingChange('fontSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="8"
                  max="18"
                />
              </div>

              {/* Header Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Style
                </label>
                <select
                  value={formatting.headerStyle}
                  onChange={(e) => handleFormattingChange('headerStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="formal">Formal</option>
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formatting.pageNumbers}
                    onChange={(e) => handleFormattingChange('pageNumbers', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Page Numbers</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formatting.tableOfContents}
                    onChange={(e) => handleFormattingChange('tableOfContents', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Table of Contents</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Options */}
      {showExportOptions && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">📤 Export Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2"
            >
              <span>📄</span>
              <span>PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('docx')}
              className="flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Word</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('html')}
              className="flex items-center space-x-2"
            >
              <span>🌐</span>
              <span>HTML</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('markdown')}
              className="flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Markdown</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

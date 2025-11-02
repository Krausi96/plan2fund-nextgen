// ========= PLAN2FUND — EXPORT SETTINGS COMPONENT =========
// Comprehensive export settings with format, quality, and styling options

import React, { useState } from 'react';
import { ExportOptions } from '@/features/export/renderer/renderer';

interface ExportSettingsProps {
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
  isOpen: boolean;
  hasAddonPack: boolean;
}

const ExportSettings: React.FC<ExportSettingsProps> = ({
  onExport,
  onClose,
  isOpen,
  hasAddonPack
}) => {
  const [format, setFormat] = useState<'PDF' | 'DOCX'>('PDF');
  const [quality, setQuality] = useState<'draft' | 'standard' | 'premium'>('standard');
  const [theme, setTheme] = useState<'serif' | 'sans' | 'modern' | 'classic'>('sans');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [spacing, setSpacing] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [includeWatermark, setIncludeWatermark] = useState(!hasAddonPack);
  const [watermarkText, setWatermarkText] = useState('DRAFT');
  const [showTableOfContents, setShowTableOfContents] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  if (!isOpen) return null;

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      includeWatermark,
      watermarkText: watermarkText || 'DRAFT',
      quality,
      theme,
      fontSize,
      spacing,
      showTableOfContents,
      showPageNumbers
    };
    
    onExport(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Export Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormat('PDF')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    format === 'PDF'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-medium">PDF</div>
                  <div className="text-sm text-gray-500">High-quality print format</div>
                </button>
                <button
                  onClick={() => setFormat('DOCX')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    format === 'DOCX'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium">DOCX</div>
                  <div className="text-sm text-gray-500">Editable Word document</div>
                </button>
              </div>
            </div>

            {/* Quality Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Quality
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'draft', label: 'Draft', desc: 'Fast, basic quality', icon: '⚡' },
                  { value: 'standard', label: 'Standard', desc: 'Good quality, balanced', icon: '⭐' },
                  { value: 'premium', label: 'Premium', desc: 'Best quality, slower', icon: '💎' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setQuality(option.value as any)}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      quality === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Document Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'sans', label: 'Sans Serif', desc: 'Arial, clean and modern' },
                  { value: 'serif', label: 'Serif', desc: 'Times, traditional and formal' },
                  { value: 'modern', label: 'Modern', desc: 'Helvetica, contemporary' },
                  { value: 'classic', label: 'Classic', desc: 'Georgia, elegant and readable' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as any)}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      theme === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size and Spacing */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Font Size
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'small', label: 'Small (12px)' },
                    { value: 'medium', label: 'Medium (14px)' },
                    { value: 'large', label: 'Large (16px)' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFontSize(option.value as any)}
                      className={`w-full p-2 text-left border rounded transition-colors ${
                        fontSize === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Line Spacing
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'compact', label: 'Compact (1.4x)' },
                    { value: 'normal', label: 'Normal (1.6x)' },
                    { value: 'relaxed', label: 'Relaxed (1.8x)' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSpacing(option.value as any)}
                      className={`w-full p-2 text-left border rounded transition-colors ${
                        spacing === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Watermark Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Watermark Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm">Include watermark</span>
                </label>
                
                {includeWatermark && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="DRAFT"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showTableOfContents}
                    onChange={(e) => setShowTableOfContents(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm">Include table of contents</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPageNumbers}
                    onChange={(e) => setShowPageNumbers(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm">Include page numbers</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <span className="mr-2">📥</span>
              Export {format}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSettings;

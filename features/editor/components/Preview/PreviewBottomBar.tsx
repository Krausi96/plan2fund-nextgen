import React, { useState } from 'react';
import { DocumentSettings } from '@/shared/components/editor/DocumentSettings';
import { type DocumentStyleConfig } from '@/shared/components/editor/DocumentStyles';

interface PreviewBottomBarProps {
  documentStyle: DocumentStyleConfig;
  onStyleChange: (config: DocumentStyleConfig) => void;
  onExport: (styleConfig: DocumentStyleConfig, format: 'pdf' | 'docx') => void;
  readinessData: {
    productType: string | null;
    programName: string | null;
    completionPercentage: number;
  };
}

export function PreviewBottomBar({ 
  documentStyle, 
  onStyleChange,
  onExport,
  readinessData
}: PreviewBottomBarProps) {
  const [showStyling, setShowStyling] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf');

  const handleExport = () => {
    onExport(documentStyle, selectedFormat);
  };

  return (
    <div className="border-t border-white/20 bg-slate-900/90 backdrop-blur-sm">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Readiness Check */}
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-xs font-medium">Readiness:</span>
            <div className="flex items-center gap-2">
              {readinessData.productType && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded font-medium">
                  {readinessData.productType.charAt(0).toUpperCase() + readinessData.productType.slice(1)}
                </span>
              )}
              {readinessData.programName ? (
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded font-medium">
                  {readinessData.programName}
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded font-medium">
                  No Program
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">Complete:</span>
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${readinessData.completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-white/60 text-xs w-8">
                {readinessData.completionPercentage}%
              </span>
            </div>
          </div>

          {/* Right: Actions and Styling */}
          <div className="flex items-center gap-2">
            {/* Styling Toggle */}
            <button
              onClick={() => setShowStyling(!showStyling)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showStyling 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              🎨 Style
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'docx')}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-l text-white text-xs focus:outline-none"
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
              </select>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-r font-medium transition-colors"
              >
                Export
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded font-medium transition-colors"
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Expandable Styling Panel */}
        {showStyling && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="max-h-60 overflow-y-auto">
              <DocumentSettings
                config={documentStyle}
                onChange={onStyleChange}
                className="bg-slate-800/50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
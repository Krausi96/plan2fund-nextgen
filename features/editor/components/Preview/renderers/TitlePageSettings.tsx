import React, { useState } from 'react';
import { 
  TitlePageStyle, 
  TitlePageTheme, 
  TitlePageStyleConfig,
  DEFAULT_TITLE_PAGE_CONFIG
} from './TitlePageStyles';

interface TitlePageSettingsProps {
  config: TitlePageStyleConfig;
  onChange: (config: TitlePageStyleConfig) => void;
}

export function TitlePageSettings({ config, onChange }: TitlePageSettingsProps) {
  const updateConfig = (updates: Partial<TitlePageStyleConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-4">Title Page Settings</h3>
      
      <div className="space-y-4">
        {/* Layout Style */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Layout Style
          </label>
          <select
            value={config.layout}
            onChange={(e) => updateConfig({ layout: e.target.value as TitlePageStyle })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          >
            <option value="minimal">Minimal</option>
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>

        {/* Color Theme */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Color Theme
          </label>
          <select
            value={config.theme}
            onChange={(e) => updateConfig({ theme: e.target.value as TitlePageTheme })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          >
            <option value="default">Default</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Text Alignment
          </label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map(align => (
              <button
                key={align}
                onClick={() => updateConfig({ textAlign: align })}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  config.textAlign === align
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-white text-sm">
            <input
              type="checkbox"
              checked={config.showLogo}
              onChange={(e) => updateConfig({ showLogo: e.target.checked })}
              className="rounded"
            />
            Show Logo
          </label>
          
          <label className="flex items-center gap-2 text-white text-sm">
            <input
              type="checkbox"
              checked={config.showProductType}
              onChange={(e) => updateConfig({ showProductType: e.target.checked })}
              className="rounded"
            />
            Show Product Type
          </label>
        </div>
      </div>
    </div>
  );
}
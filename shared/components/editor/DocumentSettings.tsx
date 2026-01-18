import { 
  DocumentStyleConfig, 
  DEFAULT_DOCUMENT_STYLE,
  applyDocumentStyles
} from '@/features/editor/components/Preview/renderers/DocumentStyles';

interface DocumentSettingsProps {
  config: DocumentStyleConfig;
  onChange: (config: DocumentStyleConfig) => void;
  className?: string;
}

export function DocumentSettings({ config, onChange, className = '' }: DocumentSettingsProps) {
  const updateConfig = (updates: Partial<DocumentStyleConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border border-slate-700 ${className}`}>
      <h3 className="text-white font-semibold mb-4 text-lg">Document Settings</h3>
      
      <div className="space-y-6">
        {/* Global Appearance */}
        <div>
          <h4 className="text-white font-medium mb-3">Appearance</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Theme
              </label>
              <select
                value={config.theme}
                onChange={(e) => updateConfig({ theme: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="default">Default</option>
                <option value="professional">Professional</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Colors
              </label>
              <select
                value={config.colorScheme}
                onChange={(e) => updateConfig({ colorScheme: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="warm">Warm</option>
              </select>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div>
          <h4 className="text-white font-medium mb-3">Typography</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Font
              </label>
              <select
                value={config.fontFamily}
                onChange={(e) => updateConfig({ fontFamily: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="sans">Sans</option>
                <option value="serif">Serif</option>
                <option value="mono">Mono</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Size
              </label>
              <select
                value={config.fontSize}
                onChange={(e) => updateConfig({ fontSize: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Spacing
              </label>
              <select
                value={config.lineHeight}
                onChange={(e) => updateConfig({ lineHeight: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div>
          <h4 className="text-white font-medium mb-3">Layout</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Margins
              </label>
              <select
                value={config.pageMargins}
                onChange={(e) => updateConfig({ pageMargins: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="narrow">Narrow</option>
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Alignment
              </label>
              <select
                value={config.textAlign}
                onChange={(e) => updateConfig({ textAlign: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="left">Left</option>
                <option value="justify">Justify</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <h4 className="text-white font-medium mb-3">Sections</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white text-xs">
              <input
                type="checkbox"
                checked={config.showPageNumbers}
                onChange={(e) => updateConfig({ showPageNumbers: e.target.checked })}
                className="rounded w-3 h-3"
              />
              Show Page Numbers
            </label>
            
            <label className="flex items-center gap-2 text-white text-xs">
              <input
                type="checkbox"
                checked={config.showSectionNumbers}
                onChange={(e) => updateConfig({ showSectionNumbers: e.target.checked })}
                className="rounded w-3 h-3"
              />
              Show Section Numbers
            </label>
            
            <div className="mt-2">
              <label className="block text-white text-xs font-medium mb-1">
                Spacing
              </label>
              <select
                value={config.sectionSpacing}
                onChange={(e) => updateConfig({ sectionSpacing: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>
        </div>

        {/* Headers & Footers */}
        <div>
          <h4 className="text-white font-medium mb-3">Headers & Footers</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Header
              </label>
              <select
                value={config.headerStyle}
                onChange={(e) => updateConfig({ headerStyle: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="minimal">Minimal</option>
                <option value="detailed">Detailed</option>
                <option value="none">None</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white text-xs font-medium mb-1">
                Footer
              </label>
              <select
                value={config.footerStyle}
                onChange={(e) => updateConfig({ footerStyle: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                <option value="minimal">Minimal</option>
                <option value="detailed">Detailed</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="pt-2">
          <button
            onClick={() => onChange(DEFAULT_DOCUMENT_STYLE)}
            className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
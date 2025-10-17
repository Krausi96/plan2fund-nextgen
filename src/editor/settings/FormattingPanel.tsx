// ========= PLAN2FUND — FORMATTING PANEL =========
// Settings panel for document formatting options

import { PlanDocument } from '@/types/plan';

interface FormattingPanelProps {
  settings: PlanDocument['settings'];
  onSettingsChange: (settings: PlanDocument['settings']) => void;
}

export default function FormattingPanel({ settings, onSettingsChange }: FormattingPanelProps) {
  const handleSettingChange = (key: keyof PlanDocument['settings'], value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleGraphToggle = (graphType: keyof PlanDocument['settings']['graphs'], enabled: boolean) => {
    onSettingsChange({
      ...settings,
      graphs: {
        ...settings.graphs,
        [graphType]: enabled
      }
    });
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Formatting Settings</h3>
      
      {/* Title Page */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Include Title Page</label>
        <input
          type="checkbox"
          checked={settings.includeTitlePage}
          onChange={(e) => handleSettingChange('includeTitlePage', e.target.checked)}
          className="rounded"
        />
      </div>

      {/* Page Numbers */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Include Page Numbers</label>
        <input
          type="checkbox"
          checked={settings.includePageNumbers}
          onChange={(e) => handleSettingChange('includePageNumbers', e.target.checked)}
          className="rounded"
        />
      </div>

      {/* Citations */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Citations</label>
        <select
          value={settings.citations}
          onChange={(e) => handleSettingChange('citations', e.target.value)}
          className="w-full border rounded px-3 py-1 text-sm"
        >
          <option value="none">None</option>
          <option value="simple">Simple</option>
        </select>
      </div>

      {/* Captions */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Include Captions</label>
        <input
          type="checkbox"
          checked={settings.captions}
          onChange={(e) => handleSettingChange('captions', e.target.checked)}
          className="rounded"
        />
      </div>

      {/* Graphs */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Include Graphs</label>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Revenue & Costs</span>
            <input
              type="checkbox"
              checked={settings.graphs.revenueCosts || false}
              onChange={(e) => handleGraphToggle('revenueCosts', e.target.checked)}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Cash Flow</span>
            <input
              type="checkbox"
              checked={settings.graphs.cashflow || false}
              onChange={(e) => handleGraphToggle('cashflow', e.target.checked)}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Use of Funds</span>
            <input
              type="checkbox"
              checked={settings.graphs.useOfFunds || false}
              onChange={(e) => handleGraphToggle('useOfFunds', e.target.checked)}
              className="rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

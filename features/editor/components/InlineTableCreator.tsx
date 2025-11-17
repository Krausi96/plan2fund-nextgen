// ========= PLAN2FUND — DATA & MEDIA PANEL =========
// Repurposed InlineTableCreator -> curates datasets, KPIs, media assets in the unified editor.

import React, { useMemo, useState } from 'react';
import { Dataset, KPI, MediaAsset } from '@/features/editor/types/plan';

type Tab = 'datasets' | 'kpis' | 'media';

interface DataPanelProps {
  datasets: Dataset[];
  kpis: KPI[];
  media: MediaAsset[];
  onDatasetCreate: (dataset: Dataset) => void;
  onKpiCreate: (kpi: KPI) => void;
  onMediaCreate: (asset: MediaAsset) => void;
}

function createDataset(name: string, description: string, columnInput: string): Dataset {
  const columns = columnInput
    .split(',')
    .map((col) => col.trim())
    .filter(Boolean)
    .map((col) => {
      const [label, unit] = col.split(':').map((token) => token.trim());
      return { name: label, type: 'number' as const, unit };
    });

  return {
    id: `dataset_${Date.now()}`,
    name: name || 'Untitled dataset',
    description,
    columns: columns.length ? columns : [{ name: 'Value', type: 'number' }],
    rows: [],
    tags: [],
    usageCount: 0,
    lastUpdated: new Date().toISOString()
  };
}

function createKPI(name: string, value: number, unit?: string): KPI {
  return {
    id: `kpi_${Date.now()}`,
    name,
    value,
    unit,
    description: '',
  };
}

function createMediaAsset(title: string, type: MediaAsset['type'], uri?: string): MediaAsset {
  return {
    id: `media_${Date.now()}`,
    type,
    title: title || `${type.toUpperCase()} asset`,
    uri,
  };
}

export default function DataPanel({
  datasets,
  kpis,
  media,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate
}: DataPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('datasets');

  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [datasetColumns, setDatasetColumns] = useState('Month:number, Revenue:number (EUR)');

  const [kpiName, setKpiName] = useState('');
  const [kpiValue, setKpiValue] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');

  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaAsset['type']>('image');
  const [mediaUri, setMediaUri] = useState('');

  const datasetList = useMemo(() => datasets ?? [], [datasets]);
  const kpiList = useMemo(() => kpis ?? [], [kpis]);
  const mediaList = useMemo(() => media ?? [], [media]);

  const handleDatasetSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!datasetName.trim()) return;
    onDatasetCreate(createDataset(datasetName, datasetDescription, datasetColumns));
    setDatasetName('');
    setDatasetDescription('');
    setDatasetColumns('Month:number, Revenue:number (EUR)');
  };

  const handleKpiSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!kpiName.trim()) return;
    onKpiCreate(createKPI(kpiName, Number(kpiValue) || 0, kpiUnit));
    setKpiName('');
    setKpiValue('');
    setKpiUnit('');
  };

  const handleMediaSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!mediaTitle.trim()) return;
    onMediaCreate(createMediaAsset(mediaTitle, mediaType, mediaUri));
    setMediaTitle('');
    setMediaUri('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200">
        {(['datasets', 'kpis', 'media'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            {tab === 'datasets' && 'Datasets'}
            {tab === 'kpis' && 'KPIs'}
            {tab === 'media' && 'Media'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'datasets' && (
          <>
            <form onSubmit={handleDatasetSubmit} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add dataset</h3>
              <input
                value={datasetName}
                onChange={(event) => setDatasetName(event.target.value)}
                placeholder="Dataset name"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <textarea
                value={datasetDescription}
                onChange={(event) => setDatasetDescription(event.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <input
                value={datasetColumns}
                onChange={(event) => setDatasetColumns(event.target.value)}
                placeholder="Column, Type (optional unit)"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-md"
              >
                Create dataset
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Library
              </h4>
              {datasetList.length === 0 && (
                <p className="text-xs text-gray-500">No datasets yet.</p>
              )}
              {datasetList.map((dataset) => (
                <div key={dataset.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{dataset.name}</p>
                      {dataset.description && (
                        <p className="text-xs text-gray-500">{dataset.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{dataset.columns.length} columns</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'kpis' && (
          <>
            <form onSubmit={handleKpiSubmit} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add KPI</h3>
              <input
                value={kpiName}
                onChange={(event) => setKpiName(event.target.value)}
                placeholder="KPI name"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={kpiValue}
                  onChange={(event) => setKpiValue(event.target.value)}
                  type="number"
                  placeholder="Value"
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
                <input
                  value={kpiUnit}
                  onChange={(event) => setKpiUnit(event.target.value)}
                  placeholder="Unit"
                  className="w-28 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-md"
              >
                Track KPI
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                KPI tracker
              </h4>
              {kpiList.length === 0 && (
                <p className="text-xs text-gray-500">No KPIs tracked yet.</p>
              )}
              {kpiList.map((kpi) => (
                <div key={kpi.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">{kpi.name}</p>
                  <p className="text-xs text-gray-600">
                    {kpi.value} {kpi.unit}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'media' && (
          <>
            <form onSubmit={handleMediaSubmit} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Add media</h3>
              <input
                value={mediaTitle}
                onChange={(event) => setMediaTitle(event.target.value)}
                placeholder="Title"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <select
                value={mediaType}
                onChange={(event) => setMediaType(event.target.value as MediaAsset['type'])}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="image">Image</option>
                <option value="table">Table</option>
                <option value="chart">Chart</option>
                <option value="kpi">KPI snapshot</option>
              </select>
              <input
                value={mediaUri}
                onChange={(event) => setMediaUri(event.target.value)}
                placeholder="Link or upload placeholder"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-md"
              >
                Add media
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Library
              </h4>
              {mediaList.length === 0 && (
                <p className="text-xs text-gray-500">No media assets yet.</p>
              )}
              {mediaList.map((asset) => (
                <div key={asset.id} className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">
                    {asset.title}{' '}
                    <span className="text-xs text-gray-400 uppercase">({asset.type})</span>
                  </p>
                  {asset.description && (
                    <p className="text-xs text-gray-500">{asset.description}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

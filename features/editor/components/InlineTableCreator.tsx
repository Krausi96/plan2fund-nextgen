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
  activeQuestionId?: string | null;
  onAttachDataset?: (dataset: Dataset) => void;
  onAttachKpi?: (kpi: KPI) => void;
  onAttachMedia?: (asset: MediaAsset) => void;
}

function createDataset(
  name: string,
  description: string,
  columnInput: string,
  tagsInput: string
): Dataset {
  const columns = columnInput
    .split(',')
    .map((col) => col.trim())
    .filter(Boolean)
    .map((col) => {
      const [label, typeSegment = 'number'] = col.split(':').map((token) => token.trim());
      const cleanedType = typeSegment.replace(/\(.*\)/, '').trim().toLowerCase();
      const unitMatch = typeSegment.match(/\((.*?)\)/);
      const type: Dataset['columns'][number]['type'] =
        cleanedType === 'date' ? 'date' : cleanedType === 'string' ? 'string' : 'number';
      return { name: label, type, unit: unitMatch?.[1] };
    });

  return {
    id: `dataset_${Date.now()}`,
    name: name || 'Untitled dataset',
    description,
    columns: columns.length ? columns : [{ name: 'Value', type: 'number' }],
    rows: [],
    tags: tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    usageCount: 0,
    lastUpdated: new Date().toISOString()
  };
}

function createKPI(
  name: string,
  value: number,
  unit?: string,
  target?: number,
  description?: string
): KPI {
  return {
    id: `kpi_${Date.now()}`,
    name,
    value,
    unit,
    description,
    target,
  };
}

function createMediaAsset(
  title: string,
  type: MediaAsset['type'],
  uri: string,
  caption: string,
  altText: string,
  figureNumber: string,
  tagsInput: string
): MediaAsset {
  return {
    id: `media_${Date.now()}`,
    type,
    title: title || `${type.toUpperCase()} asset`,
    uri,
    caption,
    altText,
    figureNumber,
    tags: tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  };
}

export default function DataPanel({
  datasets,
  kpis,
  media,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate,
  activeQuestionId,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia
}: DataPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('datasets');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingItem, setViewingItem] = useState<{ type: Tab; id: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: Tab; id: string } | null>(null);

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [datasetColumns, setDatasetColumns] = useState('Month:number, Revenue:number (EUR)');
  const [datasetTags, setDatasetTags] = useState('financial, projections');

  const [kpiName, setKpiName] = useState('');
  const [kpiValue, setKpiValue] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiDescription, setKpiDescription] = useState('');

  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaAsset['type']>('image');
  const [mediaUri, setMediaUri] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaAltText, setMediaAltText] = useState('');
  const [mediaFigure, setMediaFigure] = useState('');
  const [mediaTags, setMediaTags] = useState('');

  const datasetList = useMemo(() => datasets ?? [], [datasets]);
  const kpiList = useMemo(() => kpis ?? [], [kpis]);
  const mediaList = useMemo(() => media ?? [], [media]);
  const canAttach = Boolean(activeQuestionId);

  const handleDatasetSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!datasetName.trim()) return;
    onDatasetCreate(createDataset(datasetName, datasetDescription, datasetColumns, datasetTags));
    setDatasetName('');
    setDatasetDescription('');
    setDatasetColumns('Month:number, Revenue:number (EUR)');
    setDatasetTags('');
  };

  const handleKpiSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!kpiName.trim()) return;
    onKpiCreate(
      createKPI(
        kpiName,
        Number(kpiValue) || 0,
        kpiUnit,
        kpiTarget ? Number(kpiTarget) : undefined,
        kpiDescription
      )
    );
    setKpiName('');
    setKpiValue('');
    setKpiUnit('');
    setKpiTarget('');
    setKpiDescription('');
  };

  const handleMediaSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!mediaTitle.trim()) return;
    onMediaCreate(
      createMediaAsset(
        mediaTitle,
        mediaType,
        mediaUri,
        mediaCaption,
        mediaAltText,
        mediaFigure,
        mediaTags
      )
    );
    setMediaTitle('');
    setMediaUri('');
    setMediaCaption('');
    setMediaAltText('');
    setMediaFigure('');
    setMediaTags('');
  };

  // Filter items based on search query
  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasetList;
    const query = searchQuery.toLowerCase();
    return datasetList.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [datasetList, searchQuery]);

  const filteredKpis = useMemo(() => {
    if (!searchQuery.trim()) return kpiList;
    const query = searchQuery.toLowerCase();
    return kpiList.filter(
      (k) =>
        k.name.toLowerCase().includes(query) ||
        k.description?.toLowerCase().includes(query)
    );
  }, [kpiList, searchQuery]);

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaList;
    const query = searchQuery.toLowerCase();
    return mediaList.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.caption?.toLowerCase().includes(query) ||
        m.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [mediaList, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-navigation Pills */}
      <div className="flex gap-2 p-2 border-b border-gray-200 bg-gray-50">
        {(['datasets', 'kpis', 'media'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchQuery(''); // Clear search when switching tabs
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab === 'datasets' && `📊 Datasets${datasetList.length > 0 ? ` (${datasetList.length})` : ''}`}
            {tab === 'kpis' && `📈 KPIs${kpiList.length > 0 ? ` (${kpiList.length})` : ''}`}
            {tab === 'media' && `📷 Media${mediaList.length > 0 ? ` (${mediaList.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Search/Filter */}
      {(datasetList.length > 3 || kpiList.length > 3 || mediaList.length > 3) && (
        <div className="p-2 border-b border-gray-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!canAttach && (
          <div className="text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
            Select a question in the workspace to enable quick attachments.
          </div>
        )}
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
              <input
                value={datasetTags}
                onChange={(event) => setDatasetTags(event.target.value)}
                placeholder="Tags (comma separated)"
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
              {filteredDatasets.length === 0 && (
                <p className="text-xs text-gray-500">
                  {searchQuery ? `No datasets match "${searchQuery}"` : 'No datasets yet.'}
                </p>
              )}
              {filteredDatasets.map((dataset) => {
                const isExpanded = expandedItems.has(dataset.id);
                return (
                  <div
                    key={dataset.id}
                    className="border border-gray-100 rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    {/* Collapsed Header - Always Visible */}
                    <button
                      type="button"
                      onClick={() => toggleItem(dataset.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <span className="text-lg">📊</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{dataset.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{dataset.columns.length} columns</span>
                            {dataset.lastUpdated && (
                              <span className="text-xs text-gray-400">
                                • {new Date(dataset.lastUpdated).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>

                    {/* Expanded Content - Shown when expanded */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                        {dataset.description && (
                          <p className="text-xs text-gray-600 mt-2">{dataset.description}</p>
                        )}
                        {dataset.tags && dataset.tags.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-1">Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {dataset.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {dataset.columns.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-1">Columns:</p>
                            <div className="space-y-1">
                              {dataset.columns.map((col, idx) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  • {col.name} ({col.type}{col.unit ? `, ${col.unit}` : ''})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {onAttachDataset && (
                            <button
                              type="button"
                              disabled={!canAttach}
                              onClick={() => onAttachDataset(dataset)}
                              className={`flex-1 text-xs font-semibold border rounded-md py-1.5 ${
                                canAttach
                                  ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                                  : 'text-gray-400 border-gray-100 cursor-not-allowed'
                              }`}
                            >
                              Attach
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem({ type: 'datasets', id: dataset.id });
                              console.log('Edit dataset:', dataset.id);
                            }}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingItem({ type: 'datasets', id: dataset.id });
                            }}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              <div className="flex gap-2">
                <input
                  value={kpiTarget}
                  onChange={(event) => setKpiTarget(event.target.value)}
                  type="number"
                  placeholder="Target"
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
                <textarea
                  value={kpiDescription}
                  onChange={(event) => setKpiDescription(event.target.value)}
                  placeholder="Description / assumptions"
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
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
              {filteredKpis.length === 0 && (
                <p className="text-xs text-gray-500">
                  {searchQuery ? `No KPIs match "${searchQuery}"` : 'No KPIs tracked yet.'}
                </p>
              )}
              {filteredKpis.map((kpi) => {
                const isExpanded = expandedItems.has(kpi.id);
                return (
                  <div
                    key={kpi.id}
                    className="border border-gray-100 rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    {/* Collapsed Header - Always Visible */}
                    <button
                      type="button"
                      onClick={() => toggleItem(kpi.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <span className="text-lg">📈</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{kpi.name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {kpi.value} {kpi.unit || ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>

                    {/* Expanded Content - Shown when expanded */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                        {kpi.target && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Target:</p>
                            <p className="text-xs text-gray-600">{kpi.target} {kpi.unit || ''}</p>
                          </div>
                        )}
                        {kpi.description && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Description:</p>
                            <p className="text-xs text-gray-600">{kpi.description}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {onAttachKpi && (
                            <button
                              type="button"
                              disabled={!canAttach}
                              onClick={() => onAttachKpi(kpi)}
                              className={`flex-1 text-xs font-semibold border rounded-md py-1.5 ${
                                canAttach
                                  ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                                  : 'text-gray-400 border-gray-100 cursor-not-allowed'
                              }`}
                            >
                              Attach
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem({ type: 'kpis', id: kpi.id });
                              console.log('Edit KPI:', kpi.id);
                            }}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingItem({ type: 'kpis', id: kpi.id });
                            }}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              <textarea
                value={mediaCaption}
                onChange={(event) => setMediaCaption(event.target.value)}
                placeholder="Caption / description"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <input
                value={mediaAltText}
                onChange={(event) => setMediaAltText(event.target.value)}
                placeholder="Alt text"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={mediaFigure}
                  onChange={(event) => setMediaFigure(event.target.value)}
                  placeholder="Figure #"
                  className="w-32 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
                <input
                  value={mediaTags}
                  onChange={(event) => setMediaTags(event.target.value)}
                  placeholder="Tags"
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
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
              {filteredMedia.length === 0 && (
                <p className="text-xs text-gray-500">
                  {searchQuery ? `No media assets match "${searchQuery}"` : 'No media assets yet.'}
                </p>
              )}
              {filteredMedia.map((asset) => {
                const isExpanded = expandedItems.has(asset.id);
                const iconMap: Record<string, string> = {
                  image: '📷',
                  table: '📊',
                  chart: '📈',
                  kpi: '📊'
                };
                return (
                  <div
                    key={asset.id}
                    className="border border-gray-100 rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    {/* Collapsed Header - Always Visible */}
                    <button
                      type="button"
                      onClick={() => toggleItem(asset.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2 flex-1 text-left">
                        <span className="text-lg">{iconMap[asset.type] || '📎'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {asset.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 uppercase">{asset.type}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>

                    {/* Expanded Content - Shown when expanded */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                        {asset.description && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Description:</p>
                            <p className="text-xs text-gray-600">{asset.description}</p>
                          </div>
                        )}
                        {asset.caption && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Caption:</p>
                            <p className="text-xs text-gray-600">{asset.caption}</p>
                          </div>
                        )}
                        {asset.altText && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Alt text:</p>
                            <p className="text-xs text-gray-600">{asset.altText}</p>
                          </div>
                        )}
                        {asset.figureNumber && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Figure #:</p>
                            <p className="text-xs text-gray-600">{asset.figureNumber}</p>
                          </div>
                        )}
                        {asset.uri && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">URI:</p>
                            <p className="text-xs text-gray-600 break-all">{asset.uri}</p>
                          </div>
                        )}
                        {asset.tags && asset.tags.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-1">Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {asset.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {onAttachMedia && (
                            <button
                              type="button"
                              disabled={!canAttach}
                              onClick={() => onAttachMedia(asset)}
                              className={`flex-1 text-xs font-semibold border rounded-md py-1.5 ${
                                canAttach
                                  ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                                  : 'text-gray-400 border-gray-100 cursor-not-allowed'
                              }`}
                            >
                              Attach
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem({ type: 'media', id: asset.id });
                              console.log('Edit media:', asset.id);
                            }}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingItem({ type: 'media', id: asset.id });
                            }}
                            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingItem(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button onClick={() => setViewingItem(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-4">
              {viewingItem.type === 'datasets' && (
                <div>
                  <p className="text-sm text-gray-600">Dataset preview functionality coming soon.</p>
                </div>
              )}
              {viewingItem.type === 'kpis' && (
                <div>
                  <p className="text-sm text-gray-600">KPI preview functionality coming soon.</p>
                </div>
              )}
              {viewingItem.type === 'media' && (
                <div>
                  <p className="text-sm text-gray-600">Media preview functionality coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Chart/Table Customization) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customize</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">Customization editor coming soon. This will include:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Axis customization (labels, scales, formats)</li>
                <li>Color customization (series, background, grid)</li>
                <li>Chart type selection</li>
                <li>Label and legend positioning</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

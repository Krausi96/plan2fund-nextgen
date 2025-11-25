// ========= PLAN2FUND — DATA & MEDIA PANEL =========
// Revamped per Layout v3: info banner, CTA row, quick-add templates, library cards.

import React, { useMemo, useState } from 'react';
import { Dataset, KPI, MediaAsset } from '@/features/editor/types/plan';
import {
  suggestKPIsFromDataset,
  tagDatasetWithFinancialVariables,
  createKPIFromSuggestion
} from '@/features/editor/utils/dataHelpers';

type Tab = 'datasets' | 'kpis' | 'media';
type Composer = 'dataset' | 'kpi' | 'media' | null;

const TYPE_ICONS: Record<string, string> = {
  datasets: '📊',
  kpis: '📈',
  media: '📷',
  table: '📊',
  chart: '📈',
  image: '📷',
  kpi: '📊'
};

interface DataPanelProps {
  datasets: Dataset[];
  kpis: KPI[];
  media: MediaAsset[];
  onDatasetCreate: (dataset: Dataset) => void;
  onKpiCreate: (kpi: KPI) => void;
  onMediaCreate: (asset: MediaAsset) => void;
  activeQuestionId?: string | null;
  sectionId: string;
  sectionTitle?: string;
  onAttachDataset?: (dataset: Dataset) => void;
  onAttachKpi?: (kpi: KPI) => void;
  onAttachMedia?: (asset: MediaAsset) => void;
  onAskForStructure?: () => void;
  onMarkComplete?: (questionId: string) => void;
}

function createDataset(
  name: string,
  description: string,
  columnInput: string,
  tagsInput: string,
  sectionId: string
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

  const timestamp = new Date().toISOString();
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
    sectionId,
    relatedQuestions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastUpdated: timestamp
  };
}

function createKPI(
  name: string,
  value: number,
  unit?: string,
  target?: number,
  description?: string,
  sectionId?: string
): KPI {
  const timestamp = new Date().toISOString();
  return {
    id: `kpi_${Date.now()}`,
    name,
    value,
    unit,
    description,
    target,
    sectionId: sectionId ?? 'unknown',
    relatedQuestions: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createMediaAsset(
  title: string,
  type: MediaAsset['type'],
  uri: string,
  caption: string,
  altText: string,
  figureNumber: string,
  tagsInput: string,
  sectionId: string
): MediaAsset {
  const timestamp = new Date().toISOString();
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
      .filter(Boolean),
    sectionId,
    relatedQuestions: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function formatQuestionBadge(questionId?: string) {
  if (!questionId) return null;
  const match = questionId.match(/q(\d+)/i);
  if (match) {
    return `Q${match[1].padStart(2, '0')}`;
  }
  return questionId;
}

function getPrimaryQuestionLink(entity?: { questionId?: string; relatedQuestions?: string[] }) {
  if (!entity) return undefined;
  return entity.relatedQuestions && entity.relatedQuestions.length > 0
    ? entity.relatedQuestions[0]
    : entity.questionId;
}

export default function DataPanel({
  datasets,
  kpis,
  media,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate,
  activeQuestionId,
  sectionId,
  sectionTitle: _sectionTitle,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  onAskForStructure: _onAskForStructure,
  onMarkComplete: _onMarkComplete
}: DataPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('datasets');
  const [activeComposer, setActiveComposer] = useState<Composer>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingItem, setViewingItem] = useState<{ type: Tab; id: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: Tab; id: string } | null>(null);

  const datasetList = useMemo(() => datasets ?? [], [datasets]);
  const kpiList = useMemo(() => kpis ?? [], [kpis]);
  const mediaList = useMemo(() => media ?? [], [media]);
  const canAttach = Boolean(activeQuestionId);

  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [datasetColumns, setDatasetColumns] = useState('Item:string, Amount:number (EUR)');
  const [datasetTags, setDatasetTags] = useState('');

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

  const handleDatasetSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!datasetName.trim()) return;
    const newDataset = createDataset(
      datasetName,
      datasetDescription,
      datasetColumns,
      datasetTags,
      sectionId
    );
    // Auto-tag with financial variables
    const taggedDataset = tagDatasetWithFinancialVariables(newDataset);
    onDatasetCreate(taggedDataset);
    setDatasetName('');
    setDatasetDescription('');
    setDatasetColumns('Item:string, Amount:number (EUR)');
    setDatasetTags('');
    setActiveComposer(null);
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
        kpiDescription,
        sectionId
      )
    );
    setKpiName('');
    setKpiValue('');
    setKpiUnit('');
    setKpiTarget('');
    setKpiDescription('');
    setActiveComposer(null);
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
        mediaTags,
        sectionId
      )
    );
    setMediaTitle('');
    setMediaUri('');
    setMediaCaption('');
    setMediaAltText('');
    setMediaFigure('');
    setMediaTags('');
    setActiveComposer(null);
  };

  const getCollectionByTab = (tab: Tab): Array<Dataset | KPI | MediaAsset> => {
    if (tab === 'datasets') return filteredDatasets;
    if (tab === 'kpis') return filteredKpis;
    return filteredMedia;
  };

  const ensureCardExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  const handleCardToggle = (itemId: string) => {
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

  const handleNavigateItem = (tab: Tab, currentId: string, direction: 'prev' | 'next') => {
    const collection = getCollectionByTab(tab);
    const currentIndex = collection.findIndex((item) => item.id === currentId);
    if (currentIndex === -1) return;
    const offset = direction === 'next' ? 1 : -1;
    const target = collection[currentIndex + offset];
    if (target) {
      ensureCardExpanded(target.id);
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          document
            .getElementById(`${tab}-${target.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    }
  };

  const handlePrimaryAction = (composer: Exclude<Composer, null>) => {
    setActiveComposer((prev) => (prev === composer ? null : composer));
    setActiveTab(composer === 'dataset' ? 'datasets' : composer === 'kpi' ? 'kpis' : 'media');
  };

  const renderPagination = (tab: Tab, id: string, index: number, total: number) => (
    <div className="flex items-center justify-between text-[11px] text-white/60">
      <span>
        {index + 1} of {total}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleNavigateItem(tab, id, 'prev')}
          disabled={index === 0}
          className="px-2 py-0.5 rounded border border-white/20 disabled:opacity-30 text-white/80 hover:bg-white/10"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => handleNavigateItem(tab, id, 'next')}
          disabled={index === total - 1}
          className="px-2 py-0.5 rounded border border-white/20 disabled:opacity-30 text-white/80 hover:bg-white/10"
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderActions = (
    tab: Tab,
    id: string,
    attachHandler?: () => void
  ) => (
    <div className="flex flex-wrap gap-2 pt-2">
      {attachHandler && (
        <button
          type="button"
          onClick={attachHandler}
          disabled={!canAttach}
          className={`flex-1 text-xs font-semibold rounded-xl border px-3 py-1.5 ${
            canAttach
              ? 'text-blue-400 border-blue-400/50 hover:bg-blue-500/20'
              : 'text-white/40 border-white/10 cursor-not-allowed'
          }`}
        >
          Attach
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditingItem({ type: tab, id })}
        className="text-xs font-semibold text-white/80 border border-white/20 rounded-xl px-3 py-1.5 hover:bg-white/10"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setViewingItem({ type: tab, id })}
        className="text-xs font-semibold text-white/80 border border-white/20 rounded-xl px-3 py-1.5 hover:bg-white/10"
      >
        View
      </button>
      <button
        type="button"
        className="text-xs font-semibold text-red-400 border border-red-400/50 rounded-xl px-3 py-1.5 hover:bg-red-500/20"
      >
        Delete
      </button>
    </div>
  );

  const totalItems = datasetList.length + kpiList.length + mediaList.length;

  return (
    <div className="flex flex-col space-y-3">
      {/* Header Section */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <h3 className="text-sm font-semibold text-white/90 mb-1">Data & Media</h3>
        <p className="text-xs text-white/70 leading-relaxed">
          Add tables, KPIs, and media to support your answers.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Add New</p>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handlePrimaryAction('dataset')}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition text-left ${
              activeComposer === 'dataset'
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-white/20 bg-white/5 text-white/90 hover:border-blue-400 hover:bg-white/10'
            }`}
          >
            <span className="text-lg">📊</span>
            <div className="flex-1">
              <div className="font-semibold text-xs">Add Table</div>
            </div>
          </button>
          <button
            onClick={() => handlePrimaryAction('kpi')}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition text-left ${
              activeComposer === 'kpi'
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-white/20 bg-white/5 text-white/90 hover:border-blue-400 hover:bg-white/10'
            }`}
          >
            <span className="text-lg">📈</span>
            <div className="flex-1">
              <div className="font-semibold text-xs">Add KPI</div>
            </div>
          </button>
          <button
            onClick={() => handlePrimaryAction('media')}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition text-left ${
              activeComposer === 'media'
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-white/20 bg-white/5 text-white/90 hover:border-blue-400 hover:bg-white/10'
            }`}
          >
            <span className="text-lg">📷</span>
            <div className="flex-1">
              <div className="font-semibold text-xs">Add Media</div>
            </div>
          </button>
        </div>
      </div>

      {/* Composer Form */}
      {activeComposer && (
        <div className="border-t border-white/10 pt-3">
          <div className="bg-white/5 rounded-lg border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {activeComposer === 'dataset' && '📊 New Table'}
                {activeComposer === 'kpi' && '📈 New KPI'}
                {activeComposer === 'media' && '📷 New Media'}
              </p>
              <button
                type="button"
                onClick={() => setActiveComposer(null)}
                className="text-xs text-white/60 hover:text-white px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
          {activeComposer === 'dataset' && (
            <form onSubmit={handleDatasetSubmit} className="space-y-3">
              <input
                value={datasetName}
                onChange={(event) => setDatasetName(event.target.value)}
                placeholder="Dataset name"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <textarea
                value={datasetDescription}
                onChange={(event) => setDatasetDescription(event.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                value={datasetColumns}
                onChange={(event) => setDatasetColumns(event.target.value)}
                placeholder="Column name:type (optional unit)"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                value={datasetTags}
                onChange={(event) => setDatasetTags(event.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl"
              >
                Create dataset
              </button>
            </form>
          )}

          {activeComposer === 'kpi' && (
            <form onSubmit={handleKpiSubmit} className="space-y-3">
              <input
                value={kpiName}
                onChange={(event) => setKpiName(event.target.value)}
                placeholder="KPI name"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={kpiValue}
                  onChange={(event) => setKpiValue(event.target.value)}
                  type="number"
                  placeholder="Value"
                  className="border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
                <input
                  value={kpiUnit}
                  onChange={(event) => setKpiUnit(event.target.value)}
                  placeholder="Unit"
                  className="border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={kpiTarget}
                  onChange={(event) => setKpiTarget(event.target.value)}
                  type="number"
                  placeholder="Target"
                  className="border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
                <textarea
                  value={kpiDescription}
                  onChange={(event) => setKpiDescription(event.target.value)}
                  placeholder="Description / assumptions"
                  className="border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl"
              >
                Track KPI
              </button>
            </form>
          )}

          {activeComposer === 'media' && (
            <form onSubmit={handleMediaSubmit} className="space-y-3">
              <input
                value={mediaTitle}
                onChange={(event) => setMediaTitle(event.target.value)}
                placeholder="Title"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <select
                value={mediaType}
                onChange={(event) => setMediaType(event.target.value as MediaAsset['type'])}
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
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
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <textarea
                value={mediaCaption}
                onChange={(event) => setMediaCaption(event.target.value)}
                placeholder="Caption / description"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <input
                value={mediaAltText}
                onChange={(event) => setMediaAltText(event.target.value)}
                placeholder="Alt text"
                className="w-full border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={mediaFigure}
                  onChange={(event) => setMediaFigure(event.target.value)}
                  placeholder="Figure #"
                  className="border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
                <input
                  value={mediaTags}
                  onChange={(event) => setMediaTags(event.target.value)}
                  placeholder="Tags"
                  className="border border-white/20 bg-white/5 text-white placeholder:text-white/50 rounded-xl px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl"
              >
                Add media
              </button>
            </form>
          )}
          </div>
        </div>
      )}

      {/* Library Section */}
      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">Your Library</p>
          {totalItems > 0 && (
            <span className="text-xs text-white/60">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-2">
          {(['datasets', 'kpis', 'media'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === 'datasets' ? datasetList.length : tab === 'kpis' ? kpiList.length : mediaList.length;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/20 text-white/70 hover:border-blue-400 hover:bg-white/10'
                }`}
              >
                {tab === 'datasets' && `📊 Tables (${count})`}
                {tab === 'kpis' && `📈 KPIs (${count})`}
                {tab === 'media' && `📷 Media (${count})`}
              </button>
            );
          })}
        </div>

        {/* Search */}
        {totalItems > 0 && (
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/50 px-3 py-2 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-3"
          />
        )}

        {/* Empty State */}
        {totalItems === 0 && !activeComposer && (
          <div className="text-center py-6 bg-white/5 rounded-lg border border-white/10">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs font-medium text-white/90 mb-1">No data yet</p>
            <p className="text-xs text-white/60">
              Click "Add Table", "Add KPI", or "Add Media" above to get started.
            </p>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {activeTab === 'datasets' && filteredDatasets.length === 0 && totalItems > 0 && (
            <p className="text-xs text-white/60 text-center py-4">
              {searchQuery ? `No tables match "${searchQuery}"` : 'No tables in this section.'}
            </p>
          )}
          {activeTab === 'kpis' && filteredKpis.length === 0 && totalItems > 0 && (
            <p className="text-xs text-white/60 text-center py-4">
              {searchQuery ? `No KPIs match "${searchQuery}"` : 'No KPIs in this section.'}
            </p>
          )}
          {activeTab === 'media' && filteredMedia.length === 0 && totalItems > 0 && (
            <p className="text-xs text-white/60 text-center py-4">
              {searchQuery ? `No media items match "${searchQuery}"` : 'No media in this section.'}
            </p>
          )}

          {activeTab === 'datasets' &&
            filteredDatasets.map((dataset, index) => {
              const isExpanded = expandedItems.has(dataset.id);
              const questionBadge = formatQuestionBadge(getPrimaryQuestionLink(dataset));
              return (
                <div
                  key={dataset.id}
                  id={`datasets-${dataset.id}`}
                  className="border border-white/10 rounded-2xl bg-white/5 shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 rounded-2xl"
                    onClick={() => handleCardToggle(dataset.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TYPE_ICONS.datasets}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{dataset.name}</p>
                        <p className="text-[11px] text-white/60">
                          {dataset.columns.length} columns
                          {dataset.lastUpdated && ` • ${new Date(dataset.lastUpdated).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-white/50">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {questionBadge && (
                          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                            Attached to {questionBadge}
                          </span>
                        )}
                        <span className="text-[10px] text-white/50">Section scope</span>
                      </div>
                      {dataset.description && (
                        <p className="text-xs text-white/80">{dataset.description}</p>
                      )}
                      {dataset.columns.length > 0 && (
                        <div>
                          <p className="text-[11px] text-white/50 mb-1">Columns</p>
                          <div className="text-xs text-white/80 space-y-1">
                            {dataset.columns.map((col, idx) => (
                              <div key={idx}>
                                • {col.name} ({col.type}
                                {col.unit ? `, ${col.unit}` : ''})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {dataset.tags && dataset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dataset.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* KPI Suggestions */}
                      {(() => {
                        const suggestions = suggestKPIsFromDataset(dataset, datasetList);
                        if (suggestions.length === 0) return null;
                        return (
                          <div className="border-t border-white/10 pt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold text-white/90">Suggested KPIs</p>
                              <span className="text-[10px] text-white/50">Auto-detected</span>
                            </div>
                            <div className="space-y-1.5">
                              {suggestions.slice(0, 3).map((suggestion, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start justify-between gap-2 p-2 bg-blue-500/20 rounded-lg border border-blue-400/30"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white">{suggestion.name}</p>
                                    <p className="text-[10px] text-white/80 mt-0.5">{suggestion.description}</p>
                                    {suggestion.suggestedValue !== undefined && (
                                      <p className="text-[10px] text-blue-300 mt-1">
                                        {suggestion.suggestedValue.toLocaleString()} {suggestion.unit || ''}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newKpi = createKPIFromSuggestion(suggestion, sectionId);
                                      onKpiCreate(newKpi);
                                    }}
                                    className="flex-shrink-0 px-2 py-1 text-[10px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                  >
                                    Create
                                  </button>
                                </div>
                              ))}
                              {suggestions.length > 3 && (
                                <p className="text-[10px] text-white/60 text-center">
                                  +{suggestions.length - 3} more suggestions available
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      {renderPagination('datasets', dataset.id, index, filteredDatasets.length)}
                      {renderActions(
                        'datasets',
                        dataset.id,
                        onAttachDataset ? () => onAttachDataset(dataset) : undefined
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {activeTab === 'kpis' &&
            filteredKpis.map((kpi, index) => {
              const isExpanded = expandedItems.has(kpi.id);
              const questionBadge = formatQuestionBadge(getPrimaryQuestionLink(kpi));
              return (
                <div
                  key={kpi.id}
                  id={`kpis-${kpi.id}`}
                  className="border border-white/10 rounded-2xl bg-white/5 shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 rounded-2xl"
                    onClick={() => handleCardToggle(kpi.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TYPE_ICONS.kpis}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{kpi.name}</p>
                        <p className="text-[11px] text-white/60">
                          {kpi.value} {kpi.unit || ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-white/50">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {questionBadge && (
                          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                            Attached to {questionBadge}
                          </span>
                        )}
                        {kpi.target && (
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            Target {kpi.target}
                          </span>
                        )}
                      </div>
                      {kpi.description && (
                        <p className="text-xs text-white/80">{kpi.description}</p>
                      )}
                      {renderPagination('kpis', kpi.id, index, filteredKpis.length)}
                      {renderActions('kpis', kpi.id, onAttachKpi ? () => onAttachKpi(kpi) : undefined)}
                    </div>
                  )}
                </div>
              );
            })}

          {activeTab === 'media' &&
            filteredMedia.map((asset, index) => {
              const isExpanded = expandedItems.has(asset.id);
              const questionBadge = formatQuestionBadge(getPrimaryQuestionLink(asset));
              return (
                <div
                  key={asset.id}
                  id={`media-${asset.id}`}
                  className="border border-white/10 rounded-2xl bg-white/5 shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 rounded-2xl"
                    onClick={() => handleCardToggle(asset.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TYPE_ICONS[asset.type] || TYPE_ICONS.media}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{asset.title}</p>
                        <p className="text-[11px] text-white/60 uppercase">{asset.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-white/50">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {questionBadge && (
                          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                            Attached to {questionBadge}
                          </span>
                        )}
                        {asset.figureNumber && (
                          <span className="text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                            Fig. {asset.figureNumber}
                          </span>
                        )}
                      </div>
                      {asset.caption && (
                        <p className="text-xs text-white/80">{asset.caption}</p>
                      )}
                      {asset.uri && (
                        <p className="text-[11px] text-blue-400 break-all">{asset.uri}</p>
                      )}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {renderPagination('media', asset.id, index, filteredMedia.length)}
                      {renderActions(
                        'media',
                        asset.id,
                        onAttachMedia ? () => onAttachMedia(asset) : undefined
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {viewingItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button onClick={() => setViewingItem(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600">Preview experience coming soon.</p>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-slate-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customize</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">
                Advanced chart/table editing is coming soon. Planned capabilities include:
              </p>
              <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                <li>Axis customization (labels, scales, formats)</li>
                <li>Color themes per series</li>
                <li>Chart type switching</li>
                <li>Legend and annotation controls</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


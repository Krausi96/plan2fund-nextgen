// ========= PLAN2FUND — DATA & MEDIA PANEL =========
// Revamped per Layout v3: info banner, CTA row, quick-add templates, library cards.

import React, { useMemo, useState } from 'react';
import { Dataset, KPI, MediaAsset } from '@/features/editor/types/plan';
import {
  suggestKPIsFromDataset,
  tagDatasetWithFinancialVariables,
  createKPIFromSuggestion
} from '@/features/editor/utils/tableInitializer';

type Tab = 'datasets' | 'kpis' | 'media';
type Composer = 'dataset' | 'kpi' | 'media' | null;

const DATA_PANEL_HEADLINE = 'Keep this section evidence-driven.';
const DATA_PANEL_SUPPORT =
  'Create supporting datasets, KPIs, or media, then attach them to your active prompt so reviewers see proof alongside the narrative.';

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
  sectionTitle,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  onAskForStructure
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

  const attachmentsForActiveQuestion = useMemo(() => {
    if (!activeQuestionId) return 0;
    const matchesRelated = (entity: { relatedQuestions?: string[]; questionId?: string }) =>
      entity.relatedQuestions?.includes(activeQuestionId) || entity.questionId === activeQuestionId;
    const datasetMatches = datasetList.filter(matchesRelated).length;
    const kpiMatches = kpiList.filter(matchesRelated).length;
    const mediaMatches = mediaList.filter(matchesRelated).length;
    return datasetMatches + kpiMatches + mediaMatches;
  }, [datasetList, kpiList, mediaList, activeQuestionId]);

  const summaryChips = [
    { label: 'Datasets', count: datasetList.length },
    { label: 'KPIs', count: kpiList.length },
    { label: 'Media', count: mediaList.length },
    { label: 'Linked to current Q', count: attachmentsForActiveQuestion }
  ];

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
    <div className="flex items-center justify-between text-[11px] text-slate-500">
      <span>
        {index + 1} of {total}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleNavigateItem(tab, id, 'prev')}
          disabled={index === 0}
          className="px-2 py-0.5 rounded border border-slate-200 disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => handleNavigateItem(tab, id, 'next')}
          disabled={index === total - 1}
          className="px-2 py-0.5 rounded border border-slate-200 disabled:opacity-30"
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
              ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
              : 'text-slate-400 border-slate-100 cursor-not-allowed'
          }`}
        >
          Attach
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditingItem({ type: tab, id })}
        className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setViewingItem({ type: tab, id })}
        className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50"
      >
        View
      </button>
      <button
        type="button"
        className="text-xs font-semibold text-red-600 border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );

  return (
    <div className="space-y-5 rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 p-5 space-y-3 text-white shadow-inner">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/70 mb-1">
            {sectionTitle || 'Data guidance'}
          </p>
          <p className="text-lg font-semibold">{DATA_PANEL_HEADLINE}</p>
          <p className="text-sm text-white/80 mt-1">{DATA_PANEL_SUPPORT}</p>
          {!canAttach && (
            <p className="mt-2 text-[11px] font-semibold text-white/80">
              Select a question to enable quick attachments.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {summaryChips.map((chip) => (
            <div
              key={chip.label}
              className="rounded-xl bg-white/15 px-3 py-2 flex items-center justify-between text-xs font-semibold text-white"
            >
              <span>{chip.label}</span>
              <span className="text-sm">{chip.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(
          [
            { key: 'dataset', label: 'Add table', icon: '📊' },
            { key: 'kpi', label: 'Add KPI', icon: '📈' },
            { key: 'media', label: 'Add media', icon: '📷' }
          ] as Array<{ key: Exclude<Composer, null>; label: string; icon: string }>
        ).map((action) => {
          const isActive = activeComposer === action.key;
          return (
            <button
              key={action.key}
              onClick={() => handlePrimaryAction(action.key)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40'
              }`}
            >
              <span>{action.label}</span>
              <span>{action.icon}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Need structure ideas?</p>
          <span className="text-[11px] text-slate-400">AI assist</span>
        </div>
        <p className="text-xs text-slate-600">
          Ask the Assistant to suggest a dataset, KPI, or media template. When AI returns a
          structure, paste it into one of the composers below.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (onAskForStructure) {
                onAskForStructure();
              }
            }}
            disabled={!activeQuestionId || !onAskForStructure}
            className="flex-1 min-w-[140px] rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Ask for structure
          </button>
          <button
            type="button"
            onClick={() => handlePrimaryAction('dataset')}
            className="flex-1 min-w-[140px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/70"
          >
            Open dataset composer
          </button>
          <button
            type="button"
            onClick={() => handlePrimaryAction('kpi')}
            className="flex-1 min-w-[140px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/70"
          >
            Open KPI composer
          </button>
          <button
            type="button"
            onClick={() => handlePrimaryAction('media')}
            className="flex-1 min-w-[140px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/70"
          >
            Open media composer
          </button>
        </div>
      </div>

      {activeComposer && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              {activeComposer === 'dataset' && 'New dataset'}
              {activeComposer === 'kpi' && 'New KPI'}
              {activeComposer === 'media' && 'New media'}
            </p>
            <button
              type="button"
              onClick={() => setActiveComposer(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close ✕
            </button>
          </div>
          {activeComposer === 'dataset' && (
            <form onSubmit={handleDatasetSubmit} className="space-y-3">
              <input
                value={datasetName}
                onChange={(event) => setDatasetName(event.target.value)}
                placeholder="Dataset name"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <textarea
                value={datasetDescription}
                onChange={(event) => setDatasetDescription(event.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={datasetColumns}
                onChange={(event) => setDatasetColumns(event.target.value)}
                placeholder="Column name:type (optional unit)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={datasetTags}
                onChange={(event) => setDatasetTags(event.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={kpiValue}
                  onChange={(event) => setKpiValue(event.target.value)}
                  type="number"
                  placeholder="Value"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  value={kpiUnit}
                  onChange={(event) => setKpiUnit(event.target.value)}
                  placeholder="Unit"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={kpiTarget}
                  onChange={(event) => setKpiTarget(event.target.value)}
                  type="number"
                  placeholder="Target"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <textarea
                  value={kpiDescription}
                  onChange={(event) => setKpiDescription(event.target.value)}
                  placeholder="Description / assumptions"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={mediaType}
                onChange={(event) => setMediaType(event.target.value as MediaAsset['type'])}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
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
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <textarea
                value={mediaCaption}
                onChange={(event) => setMediaCaption(event.target.value)}
                placeholder="Caption / description"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={mediaAltText}
                onChange={(event) => setMediaAltText(event.target.value)}
                placeholder="Alt text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={mediaFigure}
                  onChange={(event) => setMediaFigure(event.target.value)}
                  placeholder="Figure #"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  value={mediaTags}
                  onChange={(event) => setMediaTags(event.target.value)}
                  placeholder="Tags"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
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
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(['datasets', 'kpis', 'media'] as Tab[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:border-blue-200'
                  }`}
                >
                  {tab === 'datasets' && `📊 Datasets (${datasetList.length})`}
                  {tab === 'kpis' && `📈 KPIs (${kpiList.length})`}
                  {tab === 'media' && `📷 Media (${mediaList.length})`}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="flex-1 min-w-[140px] rounded-full border border-slate-200 px-4 py-1.5 text-xs text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>

        <div className="space-y-3">
          {activeTab === 'datasets' && filteredDatasets.length === 0 && (
            <p className="text-xs text-slate-500">
              {searchQuery ? `No datasets match "${searchQuery}"` : 'No datasets yet.'}
            </p>
          )}
          {activeTab === 'kpis' && filteredKpis.length === 0 && (
            <p className="text-xs text-slate-500">
              {searchQuery ? `No KPIs match "${searchQuery}"` : 'No KPIs yet.'}
            </p>
          )}
          {activeTab === 'media' && filteredMedia.length === 0 && (
            <p className="text-xs text-slate-500">
              {searchQuery ? `No media items match "${searchQuery}"` : 'No media yet.'}
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
                  className="border border-slate-100 rounded-2xl bg-white shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 rounded-2xl"
                    onClick={() => handleCardToggle(dataset.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TYPE_ICONS.datasets}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{dataset.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {dataset.columns.length} columns
                          {dataset.lastUpdated && ` • ${new Date(dataset.lastUpdated).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {questionBadge && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            Attached to {questionBadge}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">Section scope</span>
                      </div>
                      {dataset.description && (
                        <p className="text-xs text-slate-600">{dataset.description}</p>
                      )}
                      {dataset.columns.length > 0 && (
                        <div>
                          <p className="text-[11px] text-slate-400 mb-1">Columns</p>
                          <div className="text-xs text-slate-600 space-y-1">
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
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
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
                          <div className="border-t border-slate-100 pt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold text-slate-700">Suggested KPIs</p>
                              <span className="text-[10px] text-slate-400">Auto-detected</span>
                            </div>
                            <div className="space-y-1.5">
                              {suggestions.slice(0, 3).map((suggestion, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start justify-between gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-blue-900">{suggestion.name}</p>
                                    <p className="text-[10px] text-blue-700 mt-0.5">{suggestion.description}</p>
                                    {suggestion.suggestedValue !== undefined && (
                                      <p className="text-[10px] text-blue-600 mt-1">
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
                                <p className="text-[10px] text-slate-500 text-center">
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
                  className="border border-slate-100 rounded-2xl bg-white shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 rounded-2xl"
                    onClick={() => handleCardToggle(kpi.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TYPE_ICONS.kpis}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{kpi.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {kpi.value} {kpi.unit || ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {questionBadge && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            Attached to {questionBadge}
                          </span>
                        )}
                        {kpi.target && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Target {kpi.target}
                          </span>
                        )}
                      </div>
                      {kpi.description && (
                        <p className="text-xs text-slate-600">{kpi.description}</p>
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
                  className="border border-slate-100 rounded-2xl bg-white shadow-sm"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 rounded-2xl"
                    onClick={() => handleCardToggle(asset.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TYPE_ICONS[asset.type] || TYPE_ICONS.media}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
                        <p className="text-[11px] text-slate-500 uppercase">{asset.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {questionBadge && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            Attached to {questionBadge}
                          </span>
                        )}
                        {asset.figureNumber && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            Fig. {asset.figureNumber}
                          </span>
                        )}
                      </div>
                      {asset.caption && (
                        <p className="text-xs text-slate-600">{asset.caption}</p>
                      )}
                      {asset.uri && (
                        <p className="text-[11px] text-blue-600 break-all">{asset.uri}</p>
                      )}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
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
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
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


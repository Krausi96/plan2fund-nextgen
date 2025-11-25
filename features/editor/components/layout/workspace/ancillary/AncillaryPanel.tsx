// ========= PLAN2FUND — ANCILLARY EDITOR PANEL =========
// Former requirements modal now controls title page, ToC, references & lightweight checker.

import React, { useMemo, useState } from 'react';
import {
  AncillaryContent,
  AppendixItem,
  BusinessPlan,
  FigureListItem,
  Footnote,
  Reference,
  TableOfContentsEntry
} from '@/features/editor/types/plan';
import { ProgressSummary } from '@/features/editor/hooks/useEditorStore';
import { Card } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';

interface AncillaryPanelProps {
  plan: BusinessPlan;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (referenceId: string) => void;
  onAppendixAdd: (item: AppendixItem) => void;
  onAppendixUpdate: (item: AppendixItem) => void;
  onAppendixDelete: (appendixId: string) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
}

const sectionClasses =
  'rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg space-y-3 backdrop-blur-sm';
const inputClasses =
  'w-full text-sm rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/70 transition focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:border-transparent';
const sectionHeadingClasses = 'text-lg font-semibold uppercase tracking-wide text-white drop-shadow';
const actionButtonClass =
  'inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-blue-500 transition';
const deleteButtonClass = 'text-xs font-semibold text-rose-200 hover:text-rose-50';
const dashedZoneClasses =
  'border border-dashed border-white/25 rounded-2xl bg-slate-900/35 p-4 space-y-3 backdrop-blur-sm';
const cardClasses = 'border border-white/15 rounded-xl bg-slate-900/35 p-3 space-y-2';
const labelMuted = 'text-xs text-white/75';

function TocRow({
  entry,
  onChange
}: {
  entry: TableOfContentsEntry;
  onChange: (entry: TableOfContentsEntry) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3">
      <input
        value={entry.title}
        onChange={(event) => onChange({ ...entry, title: event.target.value })}
        className={`${inputClasses} flex-1`}
      />
      <label className="flex items-center gap-1 text-xs text-white/70">
        <input
          type="checkbox"
          checked={entry.hidden ?? false}
          onChange={(event) => onChange({ ...entry, hidden: event.target.checked })}
          className="accent-blue-400"
        />
        Hide
      </label>
    </div>
  );
}

export default function AncillaryPanel({
  plan,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirements,
  progressSummary = []
}: AncillaryPanelProps) {
  const { t } = useI18n();
  const ancillary = plan.ancillary;
  const references = plan.references;
  const appendices = plan.appendices ?? [];
  const ancillaryLabel = (t('editor.section.ancillaryLabel' as any) as string) || 'Ancillary';
  const ancillaryTitle =
    (t('editor.section.front_back_matter' as any) as string) || 'Anhang & Formalien';
  const ancillaryIntro =
    (t('editor.section.front_back_matter_intro' as any) as string) ||
    'Pflege Titelblätter, Pflichtangaben, Quellen und Anhänge zentral gemäss dem aktuellen Plan-Layout, damit Reviewer immer die aktuelle Version sehen.';
  const [newReference, setNewReference] = useState({
    citation: '',
    url: '',
  });
  const [newFootnote, setNewFootnote] = useState({
    content: '',
    referenceId: '',
  });
  const [newAppendix, setNewAppendix] = useState({
    title: '',
    description: '',
    fileUrl: '',
  });

  const tableOfContents = useMemo(() => ancillary?.tableOfContents ?? [], [ancillary]);
  const listOfIllustrations = useMemo(() => ancillary?.listOfIllustrations ?? [], [ancillary]);
  const listOfTables = useMemo(() => ancillary?.listOfTables ?? [], [ancillary]);
  const footnotes = useMemo(() => ancillary?.footnotes ?? [], [ancillary]);

  const handleReferenceCreate = () => {
    if (!newReference.citation.trim()) return;
    onReferenceAdd({
      id: `ref_${Date.now()}`,
      citation: newReference.citation,
      url: newReference.url,
      accessedDate: new Date().toISOString().split('T')[0]
    });
    setNewReference({ citation: '', url: '' });
  };

  const updateTocEntry = (entry: TableOfContentsEntry, index: number) => {
    const next = [...tableOfContents];
    next[index] = entry;
    onAncillaryChange({ tableOfContents: next });
  };

  const addTocEntry = () => {
    const next = [
      ...tableOfContents,
      { id: `toc_${Date.now()}`, title: 'New section', hidden: false }
    ];
    onAncillaryChange({ tableOfContents: next });
  };

  const removeTocEntry = (index: number) => {
    const next = tableOfContents.filter((_, idx) => idx !== index);
    onAncillaryChange({ tableOfContents: next });
  };

  const updateFigureList = (
    list: FigureListItem[],
    type: 'illustrations' | 'tables',
    index: number,
    item: FigureListItem
  ) => {
    const next = [...list];
    next[index] = item;
    const key = type === 'illustrations' ? 'listOfIllustrations' : 'listOfTables';
    onAncillaryChange({ [key]: next } as Partial<AncillaryContent>);
  };

  const addFigureEntry = (type: 'illustrations' | 'tables') => {
    const nextList = [
      ...(type === 'illustrations' ? listOfIllustrations : listOfTables),
      {
        id: `figure_${Date.now()}`,
        label: 'New entry',
        page: undefined,
        type: type === 'tables' ? 'table' : ('image' as FigureListItem['type'])
      }
    ];
    const key = type === 'illustrations' ? 'listOfIllustrations' : 'listOfTables';
    onAncillaryChange({ [key]: nextList } as Partial<AncillaryContent>);
  };

  const removeFigureEntry = (type: 'illustrations' | 'tables', index: number) => {
    const base = type === 'illustrations' ? listOfIllustrations : listOfTables;
    const next = base.filter((_, idx) => idx !== index);
    const key = type === 'illustrations' ? 'listOfIllustrations' : 'listOfTables';
    onAncillaryChange({ [key]: next } as Partial<AncillaryContent>);
  };

  const handleFootnoteCreate = () => {
    if (!newFootnote.content.trim()) return;
    const next = [
      ...footnotes,
      {
        id: `footnote_${Date.now()}`,
        content: newFootnote.content,
        referenceId: newFootnote.referenceId || undefined
      }
    ];
    onAncillaryChange({ footnotes: next });
    setNewFootnote({ content: '', referenceId: '' });
  };

  const updateFootnote = (index: number, updates: Partial<Footnote>) => {
    const next = [...footnotes];
    next[index] = { ...next[index], ...updates };
    onAncillaryChange({ footnotes: next });
  };

  const removeFootnote = (index: number) => {
    const next = footnotes.filter((_, idx) => idx !== index);
    onAncillaryChange({ footnotes: next });
  };

  const handleAppendixCreate = () => {
    if (!newAppendix.title.trim()) return;
    onAppendixAdd({
      id: `appendix_${Date.now()}`,
      title: newAppendix.title,
      description: newAppendix.description,
      fileUrl: newAppendix.fileUrl
    });
    setNewAppendix({ title: '', description: '', fileUrl: '' });
  };

  return (
    <div className="space-y-3">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl lg:sticky lg:top-4 lg:z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-800" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
        <div className="relative z-10 space-y-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
              {ancillaryLabel}
            </p>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold text-white">{ancillaryTitle}</h1>
              <button
                type="button"
                onClick={onRunRequirements}
                className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-300/60"
              >
                {(t('editor.ui.runRequirements' as any) as string) || 'Run requirements'}
              </button>
            </div>
          </div>
          <p className="text-sm text-white/80 max-w-3xl">{ancillaryIntro}</p>
        </div>
      </Card>

      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-0 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-800/40 to-slate-800/80" />
        <div className="absolute inset-0 bg-black/15 backdrop-blur-xl" />
        <div className="relative z-10 flex flex-col h-full space-y-5 overflow-y-auto p-6 text-white">
        <section className={sectionClasses}>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClasses}>Table of contents</h3>
            <button onClick={addTocEntry} className={actionButtonClass}>
              + Add entry
            </button>
          </div>
        {tableOfContents.length === 0 && (
          <p className={labelMuted}>No entries yet. Use “Add entry”.</p>
        )}
        <div className="space-y-2">
          {tableOfContents.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-2">
              <TocRow entry={entry} onChange={(next) => updateTocEntry(next, index)} />
              <button onClick={() => removeTocEntry(index)} className={deleteButtonClass}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

        <section className={sectionClasses}>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClasses}>List of illustrations</h3>
            <button onClick={() => addFigureEntry('illustrations')} className={actionButtonClass}>
              + Add item
            </button>
          </div>
        {listOfIllustrations.length === 0 && (
          <p className={labelMuted}>No illustrations yet.</p>
        )}
        <div className="space-y-2">
          {listOfIllustrations.map((entry, index) => (
            <div key={entry.id} className={cardClasses}>
              <input
                value={entry.label}
                onChange={(event) =>
                  updateFigureList(
                    listOfIllustrations,
                    'illustrations',
                    index,
                    { ...entry, label: event.target.value }
                  )
                }
                className={inputClasses}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={entry.type}
                  onChange={(event) =>
                    updateFigureList(
                      listOfIllustrations,
                      'illustrations',
                      index,
                      { ...entry, type: event.target.value as FigureListItem['type'] }
                    )
                  }
                  className={`${inputClasses} flex-1`}
                >
                  <option className="text-slate-900" value="image">
                    Image
                  </option>
                  <option className="text-slate-900" value="chart">
                    Chart
                  </option>
                  <option className="text-slate-900" value="table">
                    Table
                  </option>
                </select>
                <input
                  value={entry.page ?? ''}
                  onChange={(event) => {
                    const value = event.target.value ? Number(event.target.value) : undefined;
                    updateFigureList(
                      listOfIllustrations,
                      'illustrations',
                      index,
                      { ...entry, page: value }
                    );
                  }}
                  placeholder="Page #"
                  className={`${inputClasses} w-full sm:w-32`}
                />
                <button
                  onClick={() => removeFigureEntry('illustrations', index)}
                  className={deleteButtonClass}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

        <section className={sectionClasses}>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClasses}>List of tables</h3>
            <button onClick={() => addFigureEntry('tables')} className={actionButtonClass}>
              + Add table
            </button>
          </div>
        {listOfTables.length === 0 && (
          <p className={labelMuted}>No tables registered.</p>
        )}
        <div className="space-y-2">
          {listOfTables.map((entry, index) => (
            <div key={entry.id} className={cardClasses}>
              <input
                value={entry.label}
                onChange={(event) =>
                  updateFigureList(
                    listOfTables,
                    'tables',
                    index,
                    { ...entry, label: event.target.value }
                  )
                }
                className={inputClasses}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={entry.page ?? ''}
                  onChange={(event) => {
                    const value = event.target.value ? Number(event.target.value) : undefined;
                    updateFigureList(
                      listOfTables,
                      'tables',
                      index,
                      { ...entry, page: value }
                    );
                  }}
                  placeholder="Page #"
                  className={`${inputClasses} w-full sm:w-32`}
                />
                <button
                  onClick={() => removeFigureEntry('tables', index)}
                  className={deleteButtonClass}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

        <section className={sectionClasses}>
          <h3 className={sectionHeadingClasses}>References</h3>
        <div className="space-y-2">
          {references.length === 0 && <p className={labelMuted}>No references yet.</p>}
          {references.map((reference) => (
            <div key={reference.id} className={cardClasses}>
              <textarea
                value={reference.citation}
                onChange={(event) =>
                  onReferenceUpdate({ ...reference, citation: event.target.value })
                }
                className={`${inputClasses} min-h-[90px]`}
              />
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="truncate">{reference.url}</span>
                <button onClick={() => onReferenceDelete(reference.id)} className={deleteButtonClass}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={dashedZoneClasses}>
          <textarea
            value={newReference.citation}
            onChange={(event) =>
              setNewReference((state) => ({ ...state, citation: event.target.value }))
            }
            placeholder="APA/MLA citation"
            className={`${inputClasses} min-h-[80px]`}
          />
          <input
            value={newReference.url}
            onChange={(event) =>
              setNewReference((state) => ({ ...state, url: event.target.value }))
            }
            placeholder="URL"
            className={inputClasses}
          />
          <button
            onClick={handleReferenceCreate}
            className="w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Add reference
          </button>
        </div>
      </section>

        <section className={sectionClasses}>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClasses}>Appendices</h3>
          <span className="text-xs text-white/60">{appendices.length} items</span>
        </div>
        {appendices.length === 0 && (
          <p className={labelMuted}>No appendix items yet.</p>
        )}
        <div className="space-y-2">
          {appendices.map((appendix) => (
            <div key={appendix.id} className={cardClasses}>
              <input
                value={appendix.title}
                onChange={(event) =>
                  onAppendixUpdate({ ...appendix, title: event.target.value })
                }
                className={inputClasses}
              />
              <textarea
                value={appendix.description ?? ''}
                onChange={(event) =>
                  onAppendixUpdate({ ...appendix, description: event.target.value })
                }
                className={`${inputClasses} min-h-[80px]`}
              />
              <div className="flex flex-col gap-2 text-xs text-white/70 sm:flex-row sm:items-center">
                <input
                  value={appendix.fileUrl ?? ''}
                  onChange={(event) =>
                    onAppendixUpdate({ ...appendix, fileUrl: event.target.value })
                  }
                  placeholder="Link to file"
                  className={`${inputClasses} flex-1`}
                />
                <button onClick={() => onAppendixDelete(appendix.id)} className={deleteButtonClass}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={dashedZoneClasses}>
          <input
            value={newAppendix.title}
            onChange={(event) =>
              setNewAppendix((state) => ({ ...state, title: event.target.value }))
            }
            placeholder="Appendix title"
            className={inputClasses}
          />
          <textarea
            value={newAppendix.description}
            onChange={(event) =>
              setNewAppendix((state) => ({ ...state, description: event.target.value }))
            }
            placeholder="Description"
            className={`${inputClasses} min-h-[80px]`}
          />
          <input
            value={newAppendix.fileUrl}
            onChange={(event) =>
              setNewAppendix((state) => ({ ...state, fileUrl: event.target.value }))
            }
            placeholder="File URL / attachment"
            className={inputClasses}
          />
          <button
            onClick={handleAppendixCreate}
            className="w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Add appendix
          </button>
        </div>
      </section>

        <section className={sectionClasses}>
          <h3 className={sectionHeadingClasses}>Footnotes & inline citations</h3>
        {footnotes.length === 0 && (
          <p className={labelMuted}>No footnotes captured yet.</p>
        )}
        <div className="space-y-2">
          {footnotes.map((footnote, index) => (
            <div key={footnote.id} className={cardClasses}>
              <textarea
                value={footnote.content}
                onChange={(event) =>
                  updateFootnote(index, { content: event.target.value })
                }
                className={`${inputClasses} min-h-[80px]`}
              />
              <div className="flex flex-col gap-2 text-xs text-white/70 sm:flex-row sm:items-center">
                <select
                  value={footnote.referenceId ?? ''}
                  onChange={(event) =>
                    updateFootnote(index, { referenceId: event.target.value || undefined })
                  }
                  className={`${inputClasses} flex-1`}
                >
                  <option className="text-slate-900" value="">
                    Link reference (optional)
                  </option>
                  {references.map((reference) => (
                    <option className="text-slate-900" key={reference.id} value={reference.id}>
                      {reference.citation.slice(0, 60)}
                    </option>
                  ))}
                </select>
                <button onClick={() => removeFootnote(index)} className={deleteButtonClass}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={dashedZoneClasses}>
          <textarea
            value={newFootnote.content}
            onChange={(event) =>
              setNewFootnote((state) => ({ ...state, content: event.target.value }))
            }
            placeholder="Footnote content"
            className={`${inputClasses} min-h-[80px]`}
          />
          <select
            value={newFootnote.referenceId}
            onChange={(event) =>
              setNewFootnote((state) => ({ ...state, referenceId: event.target.value }))
            }
            className={inputClasses}
          >
            <option className="text-slate-900" value="">
              Link reference (optional)
            </option>
            {references.map((reference) => (
              <option className="text-slate-900" key={reference.id} value={reference.id}>
                {reference.citation.slice(0, 60)}
              </option>
            ))}
          </select>
          <button
            onClick={handleFootnoteCreate}
            className="w-full rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Add footnote
          </button>
        </div>
      </section>

      {progressSummary.length > 0 && (
        <section className={sectionClasses}>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClasses}>Requirements snapshot</h3>
            {onRunRequirements && (
              <button onClick={onRunRequirements} className={actionButtonClass}>
                Refresh
              </button>
            )}
          </div>
          <div className="space-y-2">
            {progressSummary.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                  <span>{item.title}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
        </div>
      </Card>
    </div>
  );
}


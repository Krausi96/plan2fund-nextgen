// ========= PLAN2FUND — ANCILLARY EDITOR PANEL =========
// Former requirements modal now controls title page, ToC, references & lightweight checker.

import React, { useMemo, useState } from 'react';
import {
  AncillaryContent,
  AppendixItem,
  FigureListItem,
  Footnote,
  Reference,
  TableOfContentsEntry,
  TitlePage
} from '@/features/editor/types/plan';

interface ProgressItem {
  id: string;
  title: string;
  progress: number;
}

interface AncillaryEditorPanelProps {
  titlePage: TitlePage;
  ancillary: AncillaryContent;
  references: Reference[];
  appendices: AppendixItem[];
  onTitlePageChange: (titlePage: TitlePage) => void;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (referenceId: string) => void;
  onAppendixAdd: (item: AppendixItem) => void;
  onAppendixUpdate: (item: AppendixItem) => void;
  onAppendixDelete: (appendixId: string) => void;
  onRunRequirementsCheck?: () => void;
  progressSummary?: ProgressItem[];
}

function TitleField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm mb-3">
      <span className="text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
    </label>
  );
}

function TocRow({
  entry,
  onChange
}: {
  entry: TableOfContentsEntry;
  onChange: (entry: TableOfContentsEntry) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg bg-white">
      <input
        value={entry.title}
        onChange={(event) => onChange({ ...entry, title: event.target.value })}
        className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
      />
      <label className="text-xs text-gray-500 flex items-center gap-1">
        <input
          type="checkbox"
          checked={entry.hidden ?? false}
          onChange={(event) => onChange({ ...entry, hidden: event.target.checked })}
        />
        Hide
      </label>
    </div>
  );
}

export default function AncillaryEditorPanel({
  titlePage,
  ancillary,
  references,
  appendices,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirementsCheck,
  progressSummary = []
}: AncillaryEditorPanelProps) {
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

  const handleTitlePageUpdate = (path: (string | number)[], value: string) => {
    let updated: TitlePage = {
      ...titlePage,
      contactInfo: { ...titlePage.contactInfo }
    };

    if (path[0] === 'contactInfo' && typeof path[1] === 'string') {
      updated = {
        ...updated,
        contactInfo: {
          ...updated.contactInfo,
          [path[1]]: value
        }
      };
    } else if (typeof path[0] === 'string') {
      (updated as any)[path[0]] = value;
    }

    onTitlePageChange(updated);
  };

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
    <div className="flex flex-col h-full p-4 space-y-5 overflow-y-auto">
      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Title page</h3>
          <button
            onClick={onRunRequirementsCheck}
            className="text-xs font-semibold text-blue-600"
          >
            Run requirements
          </button>
        </div>
        <TitleField
          label="Plan title"
          value={titlePage.planTitle}
          onChange={(value) => handleTitlePageUpdate(['planTitle'], value)}
        />
        <TitleField
          label="Company name"
          value={titlePage.companyName}
          onChange={(value) => handleTitlePageUpdate(['companyName'], value)}
        />
        <TitleField
          label="Value proposition"
          value={titlePage.valueProp ?? ''}
          onChange={(value) => handleTitlePageUpdate(['valueProp'], value)}
          placeholder="Optional"
        />
        <TitleField
          label="Date"
          value={titlePage.date}
          onChange={(value) => handleTitlePageUpdate(['date'], value)}
        />
        <TitleField
          label="Contact email"
          value={titlePage.contactInfo.email}
          onChange={(value) => handleTitlePageUpdate(['contactInfo', 'email'], value)}
        />
        <TitleField
          label="Phone"
          value={titlePage.contactInfo.phone ?? ''}
          onChange={(value) => handleTitlePageUpdate(['contactInfo', 'phone'], value)}
        />
        <TitleField
          label="Website"
          value={titlePage.contactInfo.website ?? ''}
          onChange={(value) => handleTitlePageUpdate(['contactInfo', 'website'], value)}
        />
        <label className="block text-sm mb-3">
          <span className="text-gray-600">Address</span>
          <textarea
            value={titlePage.contactInfo.address ?? ''}
            onChange={(event) => handleTitlePageUpdate(['contactInfo', 'address'], event.target.value)}
            rows={2}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm mb-3">
          <span className="text-gray-600">Logo URL</span>
          <div className="flex gap-2 mt-1">
            <input
              value={titlePage.logoUrl ?? ''}
              onChange={(event) => handleTitlePageUpdate(['logoUrl'], event.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-md text-gray-600"
            >
              Upload
            </button>
          </div>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Confidentiality statement</span>
          <textarea
            value={titlePage.confidentialityStatement ?? ''}
            onChange={(event) => handleTitlePageUpdate(['confidentialityStatement'], event.target.value)}
            rows={3}
            className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Table of contents</h3>
          <button
            onClick={addTocEntry}
            className="text-xs font-semibold text-blue-600"
          >
            + Add entry
          </button>
        </div>
        {tableOfContents.length === 0 && (
          <p className="text-xs text-gray-500">No entries yet. Use “Add entry”.</p>
        )}
        <div className="space-y-2">
          {tableOfContents.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-2">
              <TocRow entry={entry} onChange={(next) => updateTocEntry(next, index)} />
              <button
                onClick={() => removeTocEntry(index)}
                className="text-xs text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">List of illustrations</h3>
          <button
            onClick={() => addFigureEntry('illustrations')}
            className="text-xs font-semibold text-blue-600"
          >
            + Add item
          </button>
        </div>
        {listOfIllustrations.length === 0 && (
          <p className="text-xs text-gray-500">No illustrations yet.</p>
        )}
        <div className="space-y-2">
          {listOfIllustrations.map((entry, index) => (
            <div key={entry.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
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
                className="w-full text-sm border border-gray-200 rounded px-2 py-1"
              />
              <div className="flex gap-2">
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
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="image">Image</option>
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
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
                  className="w-28 text-sm border border-gray-200 rounded px-2 py-1"
                />
                <button
                  onClick={() => removeFigureEntry('illustrations', index)}
                  className="text-xs text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">List of tables</h3>
          <button
            onClick={() => addFigureEntry('tables')}
            className="text-xs font-semibold text-blue-600"
          >
            + Add table
          </button>
        </div>
        {listOfTables.length === 0 && (
          <p className="text-xs text-gray-500">No tables registered.</p>
        )}
        <div className="space-y-2">
          {listOfTables.map((entry, index) => (
            <div key={entry.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
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
                className="w-full text-sm border border-gray-200 rounded px-2 py-1"
              />
              <div className="flex gap-2">
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
                  className="w-28 text-sm border border-gray-200 rounded px-2 py-1"
                />
                <button
                  onClick={() => removeFigureEntry('tables', index)}
                  className="text-xs text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-gray-900">References</h3>
        <div className="space-y-2">
          {references.length === 0 && (
            <p className="text-xs text-gray-500">No references yet.</p>
          )}
          {references.map((reference) => (
            <div key={reference.id} className="border border-gray-100 rounded-lg p-2">
              <textarea
                value={reference.citation}
                onChange={(event) =>
                  onReferenceUpdate({ ...reference, citation: event.target.value })
                }
                className="w-full text-sm border border-gray-200 rounded p-2 mb-2"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{reference.url}</span>
                <button
                  onClick={() => onReferenceDelete(reference.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2">
          <textarea
            value={newReference.citation}
            onChange={(event) =>
              setNewReference((state) => ({ ...state, citation: event.target.value }))
            }
            placeholder="APA/MLA citation"
            className="w-full text-sm border border-gray-200 rounded p-2"
          />
          <input
            value={newReference.url}
            onChange={(event) =>
              setNewReference((state) => ({ ...state, url: event.target.value }))
            }
            placeholder="URL"
            className="w-full text-sm border border-gray-200 rounded p-2"
          />
          <button
            onClick={handleReferenceCreate}
            className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-md"
          >
            Add reference
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Appendices</h3>
          <span className="text-xs text-gray-400">{appendices.length} items</span>
        </div>
        {appendices.length === 0 && (
          <p className="text-xs text-gray-500">No appendix items yet.</p>
        )}
        <div className="space-y-2">
          {appendices.map((appendix) => (
            <div key={appendix.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <input
                value={appendix.title}
                onChange={(event) =>
                  onAppendixUpdate({ ...appendix, title: event.target.value })
                }
                className="w-full text-sm border border-gray-200 rounded px-2 py-1"
              />
              <textarea
                value={appendix.description ?? ''}
                onChange={(event) =>
                  onAppendixUpdate({ ...appendix, description: event.target.value })
                }
                className="w-full text-sm border border-gray-200 rounded px-2 py-1"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <input
                  value={appendix.fileUrl ?? ''}
                  onChange={(event) =>
                    onAppendixUpdate({ ...appendix, fileUrl: event.target.value })
                  }
                  placeholder="Link to file"
                  className="flex-1 border border-gray-200 rounded px-2 py-1 mr-2"
                />
                <button
                  onClick={() => onAppendixDelete(appendix.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2">
          <input
            value={newAppendix.title}
            onChange={(event) =>
              setNewAppendix((state) => ({ ...state, title: event.target.value }))
            }
            placeholder="Appendix title"
            className="w-full text-sm border border-gray-200 rounded px-2 py-1"
          />
          <textarea
            value={newAppendix.description}
            onChange={(event) =>
              setNewAppendix((state) => ({ ...state, description: event.target.value }))
            }
            placeholder="Description"
            className="w-full text-sm border border-gray-200 rounded px-2 py-1"
          />
          <input
            value={newAppendix.fileUrl}
            onChange={(event) =>
              setNewAppendix((state) => ({ ...state, fileUrl: event.target.value }))
            }
            placeholder="File URL / attachment"
            className="w-full text-sm border border-gray-200 rounded px-2 py-1"
          />
          <button
            onClick={handleAppendixCreate}
            className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-md"
          >
            Add appendix
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Footnotes & inline citations</h3>
        {footnotes.length === 0 && (
          <p className="text-xs text-gray-500">No footnotes captured yet.</p>
        )}
        <div className="space-y-2">
          {footnotes.map((footnote, index) => (
            <div key={footnote.id} className="border border-gray-100 rounded-lg p-2 space-y-2">
              <textarea
                value={footnote.content}
                onChange={(event) =>
                  updateFootnote(index, { content: event.target.value })
                }
                className="w-full text-sm border border-gray-200 rounded p-2"
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <select
                  value={footnote.referenceId ?? ''}
                  onChange={(event) =>
                    updateFootnote(index, { referenceId: event.target.value || undefined })
                  }
                  className="flex-1 border border-gray-200 rounded px-2 py-1"
                >
                  <option value="">Link reference (optional)</option>
                  {references.map((reference) => (
                    <option key={reference.id} value={reference.id}>
                      {reference.citation.slice(0, 60)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeFootnote(index)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2">
          <textarea
            value={newFootnote.content}
            onChange={(event) =>
              setNewFootnote((state) => ({ ...state, content: event.target.value }))
            }
            placeholder="Footnote content"
            className="w-full text-sm border border-gray-200 rounded p-2"
          />
          <select
            value={newFootnote.referenceId}
            onChange={(event) =>
              setNewFootnote((state) => ({ ...state, referenceId: event.target.value }))
            }
            className="w-full text-sm border border-gray-200 rounded p-2"
          >
            <option value="">Link reference (optional)</option>
            {references.map((reference) => (
              <option key={reference.id} value={reference.id}>
                {reference.citation.slice(0, 60)}
              </option>
            ))}
          </select>
          <button
            onClick={handleFootnoteCreate}
            className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-md"
          >
            Add footnote
          </button>
        </div>
      </section>

      {progressSummary.length > 0 && (
        <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Requirements snapshot</h3>
            {onRunRequirementsCheck && (
              <button
                onClick={onRunRequirementsCheck}
                className="text-xs font-semibold text-blue-600"
              >
                Refresh
              </button>
            )}
          </div>
          <div className="space-y-2">
            {progressSummary.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{item.title}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


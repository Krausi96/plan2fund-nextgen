// ========= PLAN2FUND — ANCILLARY EDITOR PANEL =========
// Former requirements modal now controls title page, ToC, references & lightweight checker.

import React, { useMemo, useState } from 'react';
import {
  AncillaryContent,
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
  onTitlePageChange: (titlePage: TitlePage) => void;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (referenceId: string) => void;
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
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onRunRequirementsCheck,
  progressSummary = []
}: AncillaryEditorPanelProps) {
  const [newReference, setNewReference] = useState({
    citation: '',
    url: '',
  });

  const tableOfContents = useMemo(() => ancillary?.tableOfContents ?? [], [ancillary]);

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


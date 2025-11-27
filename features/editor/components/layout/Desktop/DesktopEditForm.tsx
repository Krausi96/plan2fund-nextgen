import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import type { SectionTemplate, DocumentTemplate } from '@templates';

type EditFormProps = {
  type: 'section' | 'document';
  item: SectionTemplate | DocumentTemplate;
  onSave: (item: SectionTemplate | DocumentTemplate) => void;
  onCancel: () => void;
  getOriginBadge: (origin?: string) => React.ReactNode;
};

export function DesktopEditForm({ type, item, onSave, onCancel, getOriginBadge }: EditFormProps) {
  // Use local state to prevent parent re-renders on every keystroke
  const [localItem, setLocalItem] = useState<SectionTemplate | DocumentTemplate>(item);

  // Update local state when item prop changes (e.g., when switching items)
  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const handleSave = () => {
    onSave(localItem);
  };

  const isSection = type === 'section';
  const sectionItem = isSection ? (localItem as SectionTemplate) : null;
  const documentItem = !isSection ? (localItem as DocumentTemplate) : null;

  return (
    <div className="flex-1 overflow-y-auto min-h-0 pr-1">
      <div className="border rounded-lg p-4 bg-white/10 border-white/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isSection ? '📋' : '📄'}</span>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isSection ? 'Abschnitt bearbeiten' : 'Dokument bearbeiten'}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {localItem.required && (
                  <Badge variant="warning" className="bg-amber-600/30 text-amber-200 border-0 text-[9px] px-1.5 py-0.5">
                    Erf.
                  </Badge>
                )}
                {getOriginBadge(localItem.origin)}
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white text-lg font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/70 block mb-1">
              {isSection ? 'Titel *' : 'Name *'}
            </label>
            <input
              type="text"
              value={isSection ? sectionItem!.title : documentItem!.name}
              onChange={(e) => {
                if (isSection) {
                  setLocalItem({ ...sectionItem!, title: e.target.value } as SectionTemplate);
                } else {
                  setLocalItem({ ...documentItem!, name: e.target.value } as DocumentTemplate);
                }
              }}
              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/70 block mb-1">Beschreibung</label>
            <textarea
              value={localItem.description}
              onChange={(e) => setLocalItem({ ...localItem, description: e.target.value })}
              rows={3}
              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
            />
          </div>

          {isSection && sectionItem ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/70 block mb-1">Min. Wörter</label>
                <input
                  type="number"
                  value={sectionItem.wordCountMin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setLocalItem({ ...sectionItem, wordCountMin: isNaN(val) ? 0 : val } as SectionTemplate);
                  }}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/70 block mb-1">Max. Wörter</label>
                <input
                  type="number"
                  value={sectionItem.wordCountMax === Number.MAX_SAFE_INTEGER ? '' : sectionItem.wordCountMax}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : Number.MAX_SAFE_INTEGER;
                    setLocalItem({ ...sectionItem, wordCountMax: (!isNaN(val) && val > 0) ? val : Number.MAX_SAFE_INTEGER } as SectionTemplate);
                  }}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  placeholder="∞"
                />
              </div>
            </div>
          ) : documentItem ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/70 block mb-1">Format</label>
                <select
                  value={documentItem.format}
                  onChange={(e) => {
                    setLocalItem({ ...documentItem, format: e.target.value as any } as DocumentTemplate);
                  }}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="xlsx">XLSX</option>
                  <option value="pptx">PPTX</option>
                  <option value="text">TEXT</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/70 block mb-1">Max. Größe</label>
                <input
                  type="text"
                  value={documentItem.maxSize}
                  onChange={(e) => {
                    setLocalItem({ ...documentItem, maxSize: e.target.value } as DocumentTemplate);
                  }}
                  placeholder="10MB"
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                />
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5"
            >
              Speichern
            </Button>
            <Button
              onClick={onCancel}
              variant="ghost"
              className="flex-1 text-white/60 hover:text-white text-xs px-3 py-1.5"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


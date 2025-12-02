import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { useI18n } from '@/shared/contexts/I18nContext';

type DesktopEditFormProps = {
  type: 'section' | 'document';
  item: SectionTemplate | DocumentTemplate;
  onSave: (item: SectionTemplate | DocumentTemplate) => void;
  onCancel: () => void;
  getOriginBadge?: (origin?: string, isSelected?: boolean) => React.ReactNode;
};

export function DesktopEditForm({
  type,
  item,
  onSave,
  onCancel,
  getOriginBadge
}: DesktopEditFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(type === 'section' ? (item as SectionTemplate).title : (item as DocumentTemplate).name);
  const [description, setDescription] = useState(item.description || '');

  const handleSave = () => {
    if (type === 'section') {
      const section = item as SectionTemplate;
      onSave({
        ...section,
        title: title.trim(),
        description: description.trim()
      });
    } else {
      const document = item as DocumentTemplate;
      onSave({
        ...document,
        name: title.trim(),
        description: description.trim()
      });
    }
  };

  const isSection = type === 'section';
  const nameLabel = isSection 
    ? (t('editor.desktop.sections.custom.name' as any) || 'Titel *')
    : (t('editor.desktop.documents.custom.name' as any) || 'Name *');
  const descriptionLabel = isSection
    ? (t('editor.desktop.sections.custom.description' as any) || 'Beschreibung')
    : (t('editor.desktop.documents.custom.description' as any) || 'Beschreibung');
  const saveLabel = t('editor.desktop.edit.save' as any) || 'Speichern';
  const cancelLabel = t('editor.desktop.edit.cancel' as any) || 'Abbrechen';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">
          {isSection 
            ? (t('editor.desktop.sections.edit.title' as any) || 'Abschnitt bearbeiten')
            : (t('editor.desktop.documents.edit.title' as any) || 'Dokument bearbeiten')}
        </h3>
        {getOriginBadge && item.origin && (
          <div>{getOriginBadge(item.origin, false)}</div>
        )}
      </div>

      <div>
        <label className="text-[10px] text-white/70 block mb-1">
          {nameLabel}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
          autoFocus
        />
      </div>

      <div>
        <label className="text-[10px] text-white/70 block mb-1">
          {descriptionLabel}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSave}
          disabled={!title.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveLabel}
        </Button>
        <Button
          onClick={onCancel}
          variant="ghost"
          className="text-white/60 hover:text-white text-xs px-3 py-1"
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}


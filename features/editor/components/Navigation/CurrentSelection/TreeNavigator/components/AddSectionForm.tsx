import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';

interface AddSectionFormProps {
  newSectionTitle: string;
  setNewSectionTitle: (title: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export function AddSectionForm({ 
  newSectionTitle, 
  setNewSectionTitle, 
  onAdd, 
  onCancel 
}: AddSectionFormProps) {
  const { t } = useI18n();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      onAdd();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2 space-y-2">
      <input
        type="text"
        value={newSectionTitle}
        onChange={(e) => setNewSectionTitle(e.target.value)}
        placeholder={t('editor.desktop.sections.placeholder' as any) || 'Enter section title...'}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex-1"
        >
          {t('editor.desktop.sections.add' as any) || 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
        >
          {t('editor.desktop.cancel' as any) || 'Cancel'}
        </button>
      </div>
    </form>
  );
}
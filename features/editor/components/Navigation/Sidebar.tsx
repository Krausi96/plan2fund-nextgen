import React, { useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  useSidebarState,
  useEditorStore,
} from '@/features/editor/lib';

type SidebarProps = {
  collapsed?: boolean;
};

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { t } = useI18n();
  const { sections, disabledSections, actions, sectionCounts, isEditing, showAddSection, activeSectionId, editingSection } = useSidebarState();
  
  // Local state for add section form
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
  // Local state for edit section form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequired, setEditRequired] = useState(false);
  
  // Local state for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string; title: string} | null>(null);
  
  // Initialize edit form when editingSection changes
  React.useEffect(() => {
    if (editingSection) {
      setEditTitle(editingSection.title || editingSection.name || '');
      setEditDescription(editingSection.description || '');
      setEditRequired(editingSection.required || false);
    }
  }, [editingSection]);
  
  // Show empty state when no sections are available (even if product is selected)
  const showEmptyState = sections.length === 0;

  if (isEditing && editingSection) {
    return (
      <div className="w-full p-4 border border-blue-400 bg-blue-600/10 rounded-lg">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">
            {t('editor.desktop.sections.edit.title' as any) || 'Edit Section Metadata'}
          </h4>
          
          {/* Title Field */}
          <div>
            <label className="text-xs text-white/80 mb-1 block">
              {t('editor.desktop.sections.edit.sectionTitle' as any) || 'Section Title'}
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400"
              placeholder={t('editor.desktop.sections.edit.sectionTitlePlaceholder' as any) || 'e.g. Executive Summary'}
            />
          </div>
          
          {/* Description Field */}
          <div>
            <label className="text-xs text-white/80 mb-1 block">
              {t('editor.desktop.sections.edit.description' as any) || 'Description (optional)'}
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400 resize-none"
              placeholder={t('editor.desktop.sections.edit.descriptionPlaceholder' as any) || 'Brief description of this section'}
              rows={2}
            />
          </div>
          
          {/* Required Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-required"
              checked={editRequired}
              onChange={(e) => setEditRequired(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-600/30 text-blue-600 focus:ring-1 focus:ring-blue-500/50"
            />
            <label htmlFor="edit-required" className="text-xs text-white/80 cursor-pointer">
              {t('editor.desktop.sections.edit.required' as any) || 'Mark as required'}
            </label>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                // TODO: Implement save logic
                console.log('Save metadata:', { title: editTitle, description: editDescription, required: editRequired });
                actions.cancelEdit();
              }}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors"
            >
              {t('editor.desktop.sections.edit.save' as any) || 'Save'}
            </button>
            <button 
              onClick={actions.cancelEdit} 
              className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm font-semibold transition-colors"
            >
              {t('editor.desktop.sections.custom.cancel' as any) || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-80 p-4 bg-slate-800 border-2 border-red-400 rounded-lg shadow-xl">
            <h4 className="text-base font-bold text-white mb-2">
              {t('editor.desktop.sections.delete.title' as any) || 'Remove Section?'}
            </h4>
            <p className="text-sm text-white/80 mb-4">
              {(t('editor.desktop.sections.delete.message' as any) || 'Are you sure you want to remove "{title}"?').replace('{title}', deleteConfirm.title)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  actions.removeCustomSection(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded transition-colors"
              >
                {t('editor.desktop.sections.delete.confirm' as any) || 'Remove'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
              >
                {t('editor.desktop.sections.delete.cancel' as any) || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-shrink-0 mb-3 px-3 pt-2">
        <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white text-center flex-1">
            {t('editor.desktop.sections.title' as any) || (useEditorStore.getState().plan?.language === 'de' ? 'Abschnitte' : 'Sections')} ({sectionCounts.totalCount})
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="space-y-2">
        {showEmptyState && (
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center flex flex-col items-center justify-center">
            <div className="text-4xl mb-2 flex justify-center">
              <span className="text-4xl">📋</span>
            </div>
            <div className="text-white/60 text-sm">
              {t('editor.desktop.sections.noSectionsYet' as any) || 'No Sections Yet'}
            </div>
          </div>
        )}

        {!collapsed && !showEmptyState && (
          <button
            type="button"
            onClick={actions.toggleAddSection}
            className={`w-full rounded-lg transition-colors flex flex-col items-center justify-center gap-1.5 p-2 ${
              showAddSection 
                ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <span className="text-xl leading-none">＋</span>
            <span className="text-[10px] font-semibold">{t('editor.desktop.sections.addButton' as any) || 'Add Section'}</span>
          </button>
        )}

        {showAddSection && !collapsed && (
          <div className="w-full p-4 border border-blue-400 bg-blue-600/10 rounded-lg">
            <h4 className="text-sm font-bold text-white mb-3">
              {t('editor.desktop.sections.custom.title' as any) || 'Add a custom section to your plan'}
            </h4>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder={t('editor.desktop.sections.custom.titlePlaceholder' as any) || 'e.g. Financial Plan'}
              className="w-full px-3 py-2 mb-3 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (newSectionTitle.trim()) {
                    actions.addCustomSection(newSectionTitle.trim());
                    setNewSectionTitle('');
                  }
                }}
                disabled={!newSectionTitle.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/40 text-white text-sm font-semibold rounded transition-colors"
              >
                {t('editor.desktop.sections.custom.add' as any) || 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewSectionTitle('');
                  actions.toggleAddSection();
                }}
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
              >
                {t('editor.desktop.sections.custom.cancel' as any) || 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {sections.map((section) => {
          const isDisabled = disabledSections.has(section.id);
          const isActive = section.id === activeSectionId;
          const isRequired = section.required ?? false;
          const isCustom = section.origin === 'custom';
          
          const cardClass = isDisabled
            ? 'opacity-50 border-white/10'
            : isActive
            ? 'border-blue-400 bg-blue-600/20'
            : isRequired
            ? 'border-amber-400 bg-amber-600/20'
            : 'border-white/20 bg-white/5 hover:bg-white/10';

          return (
            <div
              key={section.id}
              onClick={() => {
                if (isDisabled) return;
                
                // Set active section with source - the PreviewWorkspace handles the scrolling via useEffect
                actions.setActiveSectionId(section.id, 'sidebar');
              }}
              className={`relative border rounded-lg p-2 transition-all w-full flex flex-col items-center justify-center gap-1.5 cursor-pointer ${cardClass}`}
            >
              <span className="text-xl leading-none flex-shrink-0">📋</span>
              <div className="w-full text-center">
                <h4 className={`text-[10px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                  {section.title}
                </h4>
              </div>
              <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                {actions.toggleSection && (
                  <input
                    type="checkbox"
                    checked={!isDisabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      actions.toggleSection(section.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                      isDisabled
                        ? 'border-white/30 bg-white/10'
                        : isRequired
                        ? 'border-amber-500 bg-amber-600/30 opacity-90'
                        : 'border-blue-500 bg-blue-600/30'
                    } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                  />
                )}
                {actions.editSection && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      actions.editSection(section);
                    }}
                    className="text-white/60 hover:text-white text-xs transition-opacity"
                  >
                    ✏️
                  </button>
                )}
                {isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirm({ id: section.id, title: section.title });
                    }}
                    className="text-red-400 hover:text-red-200 text-base font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                    title="Remove custom section"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}


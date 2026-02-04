import { useI18n } from '@/shared/contexts/I18nContext';
import React, { useState } from 'react';

interface ControlsPanelProps {
  viewMode: 'hierarchical' | 'flat';
  setViewMode: (mode: 'hierarchical' | 'flat') => void;
  onAddDocument: (name: string) => void;
  onAddSection: (name: string) => void;
}

export function ControlsPanel({ 
  viewMode, 
  setViewMode, 
  onAddDocument, 
  onAddSection 
}: ControlsPanelProps) {
  const { t } = useI18n();
  
  // Use direct i18n keys with type casting - include ALL needed translations
  const typedT = t as any;
  const translations = {
    // Controls panel translations
    controlsTitle: typedT('editor.desktop.blueprint.controls.title'),
    addDocument: typedT('editor.desktop.blueprint.controls.addDocument'),
    addSection: typedT('editor.desktop.blueprint.controls.addSection'),
    versionToggle: typedT('editor.desktop.blueprint.controls.versionToggle'),
    shortVersion: typedT('editor.desktop.blueprint.controls.shortVersion'),
    longVersion: typedT('editor.desktop.blueprint.controls.longVersion'),
    addButton: typedT('editor.desktop.blueprint.controls.add'),
    renameButton: typedT('editor.desktop.blueprint.controls.rename'),
    requiredLabel: typedT('editor.desktop.blueprint.controls.required'),
    optionalLabel: typedT('editor.desktop.blueprint.controls.optional'),
    
    // Placeholder translations
    documentPlaceholder: typedT('editor.desktop.blueprint.placeholder.documentName'),
    sectionPlaceholder: typedT('editor.desktop.blueprint.placeholder.sectionName')
  };

  const [newDocumentName, setNewDocumentName] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const handleAddDocument = () => {
    if (!newDocumentName.trim()) return;
    onAddDocument(newDocumentName);
    setNewDocumentName('');
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    onAddSection(newSectionTitle);
    setNewSectionTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 sticky top-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-400 text-lg">⚙️</span>
          <h3 className="text-white font-bold text-lg">{translations.controlsTitle || 'Controls'}</h3>
        </div>
        
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="pt-3 border-t border-white/10">
            <label className="block text-white/80 text-sm mb-2">View Mode</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${viewMode === 'hierarchical' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700/50 text-white/80 border-slate-500/30 hover:bg-slate-600/50'}`}
                onClick={() => setViewMode('hierarchical')}
              >
                Hierarchical
              </button>
              <button
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${viewMode === 'flat' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700/50 text-white/80 border-slate-500/30 hover:bg-slate-600/50'}`}
                onClick={() => setViewMode('flat')}
              >
                Flat
              </button>
            </div>
          </div>
          
          {/* Add Document Button */}
          <div>
            <label className="block text-white/80 text-sm mb-2">{translations.addDocument || 'Add New Document'}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                placeholder={translations.documentPlaceholder || "Document name..."}
                className="flex-1 text-sm bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDocument()}
              />
              <button
                onClick={handleAddDocument}
                disabled={!newDocumentName.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium whitespace-nowrap"
              >
                {translations.addButton || 'Add'}
              </button>
            </div>
          </div>
          
          {/* Add Section Button */}
          <div>
            <label className="block text-white/80 text-sm mb-2">{translations.addSection || 'Add Custom Section'}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder={translations.sectionPlaceholder || "Section name..."}
                className="flex-1 text-sm bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
              />
              <button
                onClick={handleAddSection}
                disabled={!newSectionTitle.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium whitespace-nowrap"
              >
                {translations.addButton || 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
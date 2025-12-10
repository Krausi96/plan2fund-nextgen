import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/contexts/I18nContext';
import type { Section } from '@/features/editor/lib/types/plan';

type SectionEditorHeaderProps = {
  section: Section | null;
  activeQuestionId: string | null;
  isSpecialSection: boolean;
  isMetadataSection: boolean;
  isAncillarySection: boolean;
  isReferencesSection: boolean;
  isAppendicesSection: boolean;
  onClose: () => void;
  onPanelMouseDown: (e: React.MouseEvent) => void;
  onQuestionSelect: (questionId: string) => void;
};

export function SectionEditorHeader({
  section,
  activeQuestionId,
  isSpecialSection,
  isMetadataSection,
  isAncillarySection,
  isReferencesSection,
  isAppendicesSection,
  onClose,
  onPanelMouseDown,
  onQuestionSelect
}: SectionEditorHeaderProps) {
  const { t } = useI18n();

  return (
    <div 
      className="p-2.5 border-b border-white/20 bg-gradient-to-r from-slate-800/90 to-slate-900/90 cursor-move select-none flex-shrink-0"
      onMouseDown={onPanelMouseDown}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white truncate flex-1 min-w-0">
          {section?.title || 'Section'}
        </h2>
        
        {/* Question Navigation - Inline with title (Normal Sections) */}
        {!isSpecialSection && section && section.questions.length > 1 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {section.questions.map((q, index) => {
              const isActive = q.id === activeQuestionId;
              const status = q.status;
              return (
                <button
                  key={q.id}
                  onClick={() => onQuestionSelect(q.id)}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                      : 'border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700'
                  }`}
                >
                  <span>{index + 1}</span>
                  {status === 'complete' && <span className="text-xs">✅</span>}
                  {status === 'unknown' && <span className="text-xs">❓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Special Section Navigation - Field/View Navigation */}
        {isSpecialSection && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isMetadataSection && (
              <>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  🖼️ Logo
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  🏢 {t('editor.desktop.selection.programLabel' as any) || 'Company'}
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📧 Kontakt
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📅 Datum
                </button>
              </>
            )}
            {isAncillarySection && (
              <>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📋 Übersicht
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  🏗️ Struktur
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  🎨 Formatierung
                </button>
              </>
            )}
            {isReferencesSection && (
              <>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📝 Liste
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📐 Format
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📥 Importieren
                </button>
              </>
            )}
            {isAppendicesSection && (
              <>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📋 Liste
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  ➕ {t('editor.desktop.sections.addButton' as any) || 'Hinzufügen'}
                </button>
                <button className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium transition-all">
                  📦 Organisieren
                </button>
              </>
            )}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/70 hover:bg-white/10 hover:text-white flex-shrink-0 h-6 w-6 p-0"
          aria-label="Close editor"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}


import React from 'react';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';
import { SectionCard } from '../Shared/SectionCard';
import {
  type SectionTemplate,
  useSidebarState,
  isSpecialSectionId,
} from '@/features/editor/lib';

// Simple completion calculation - in a real app this would check actual section content
function calculateCompletion(_section: any): number {
  // Placeholder implementation - return random completion for demo purposes
  // In a real app, this would check the actual section content/answers
  return Math.floor(Math.random() * 101);
}

// Map completion percentage to progress intent
function getProgressIntent(completion: number): "primary" | "success" | "warning" | "neutral" {
  if (completion >= 100) return "success";
  if (completion >= 50) return "warning";
  if (completion > 0) return "primary";
  return "neutral";
}

type SidebarProps = {
  collapsed?: boolean;
};

type SectionNavigationTreeProps = {
  activeSectionId: string | null;
  collapsed: boolean;
  isNewUser: boolean;
  sections: ReturnType<typeof useSidebarState>['sections'];
  disabledSections: ReturnType<typeof useSidebarState>['disabledSections'];
  actions: ReturnType<typeof useSidebarState>['actions'];
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SectionNavigationTree({
  activeSectionId,
  collapsed,
  isNewUser,
  sections,
  disabledSections,
  actions,
}: SectionNavigationTreeProps) {

  // Determine display mode
  const showAsCards = !collapsed && (actions.toggleSection !== undefined || actions.editSection !== undefined);

  const displaySections = isNewUser ? [] : sections;

  if (collapsed) {
    return (
      <div className="space-y-1" style={{ paddingBottom: '1rem' }}>
        {displaySections.map((section) => {
          const completion = calculateCompletion(section);
          const isActive = section.id === activeSectionId;
          const isDisabled = disabledSections.has(section.id);
          const buttonClass = isDisabled 
            ? 'opacity-50 cursor-not-allowed'
            : isActive 
            ? 'bg-blue-600/40 border-blue-400'
            : 'bg-white/5 border-white/10 hover:bg-white/10';
          
          return (
            <button
              key={section.id}
              onClick={() => !isDisabled && actions.setActiveSectionId(section.id)}
              disabled={isDisabled}
              className={`w-full p-2 rounded-lg transition-all ${buttonClass}`}
              title={isDisabled ? `${section.title} (Disabled)` : section.title}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">
                  {completion === 100 ? '✅' : completion > 0 ? '⚠️' : '❌'}
                </span>
                {completion < 100 && (
                  <span className="text-[8px] text-white/70">{completion}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (showAsCards) {
    return (
      <div className="space-y-2 flex flex-col items-center" style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem' }}>
        {displaySections.map((section) => {
          const isActive = section.id === activeSectionId;
          const isDisabled = disabledSections.has(section.id);

          return (
            <SectionCard
              key={section.id}
              section={section}
              isActive={isActive}
              isDisabled={isDisabled}
              onSelect={actions.setActiveSectionId}
              onToggle={actions.toggleSection}
              onEdit={(s) => {
                const sectionTemplate: SectionTemplate = {
                  id: s.id,
                  title: s.title,
                  origin: s.origin,
                  required: s.required,
                };
                actions.editSection(sectionTemplate);
              }}
              onRemoveCustom={() => {
                // Remove custom section - handled by store actions
                actions.setActiveSectionId(null);
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2" style={{ paddingBottom: '1rem' }}>
      {displaySections.map((section, sectionIndex: number) => {
        const completion = calculateCompletion(section);
        const isSpecialSection = isSpecialSectionId(section.id);
        const isActive = section.id === activeSectionId;
        const isDisabled = disabledSections.has(section.id);
        const sectionOrigin = section.origin;
        const isRequired = section.required ?? false;
        const isCustom = sectionOrigin === 'custom';
        
        const listClass = isDisabled
          ? 'opacity-50 border-white/10'
          : isActive
          ? 'border-blue-400 bg-blue-600/20'
          : isRequired
          ? 'border-amber-400 bg-amber-600/20'
          : 'border-white/20 bg-white/5 hover:bg-white/10';

        return (
          <div
            key={section.id}
            className={`w-full rounded-lg border-2 px-3 py-2 transition-all ${listClass}`}
          >
            <button
              onClick={() => !isDisabled && actions.setActiveSectionId(section.id)}
              disabled={isDisabled}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!isSpecialSection && (
                      <span className="text-[9px] font-bold tracking-wide text-white/70">
                        {String(sectionIndex).padStart(2, '0')}
                      </span>
                    )}
                    <span className={`text-xs font-semibold truncate ${isDisabled ? 'line-through text-white/50' : ''}`}>
                      {section.title}
                    </span>
                  </div>
                  <Progress value={completion} intent={getProgressIntent(completion)} size="xs" />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {actions.toggleSection && (
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        actions.toggleSection(section.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                        isDisabled
                          ? 'border-white/30 bg-white/10'
                          : isRequired
                          ? 'border-amber-500 bg-amber-600/30 opacity-90'
                          : 'border-blue-500 bg-blue-600/30'
                      }`}
                    />
                  )}
                  {actions.editSection && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const sectionTemplate: SectionTemplate = {
                          id: section.id,
                          title: section.title,
                          origin: section.origin,
                          required: section.required,
                        };
                        actions.editSection(sectionTemplate);
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
                        // Remove custom section - would need store action for this
                        // For now, just log
                        console.log('Remove custom section:', section.id);
                      }}
                      className="text-red-300 hover:text-red-200 text-xs font-bold px-1 rounded hover:bg-red-500/20"
                    >
                      ×
                    </button>
                  )}
                  <span className="text-[10px] font-bold text-white">{completion}%</span>
                  {isActive && <span className="text-blue-400">●</span>}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { t } = useI18n();
  const { isNewUser, sections, disabledSections, actions, sectionCounts, isEditing, showAddSection, activeSectionId, editingSection } = useSidebarState();

  return (
    <div className={collapsed ? 'w-16' : 'w-80'} style={{
      width: collapsed ? '150px' : '320px',
      minWidth: collapsed ? '150px' : '320px',
      maxWidth: collapsed ? '150px' : '320px',
    }}>
      <div className="relative w-full flex-1 flex flex-col min-h-0">
        {!collapsed && (
          <h2 className="text-lg font-bold uppercase tracking-wide text-white mb-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
            {(t('editor.desktop.sections.title' as any) as string) || 'Deine Abschnitte'} ({sectionCounts.totalCount})
          </h2>
        )}

        {!collapsed && !isNewUser && (
          <>
            <div className="text-xs text-white/50 mb-2 flex items-center gap-2">
              <span className="flex items-center gap-1 flex-1">
                <span>✏️</span>
                <span>{t('editor.desktop.sections.legend.edit' as any) || 'Bearbeiten'}</span>
              </span>
              <span className="flex items-center gap-1 flex-1 justify-center">
                <input type="checkbox" className="w-2.5 h-2.5" disabled />
                <span>{t('editor.desktop.sections.legend.toggle' as any) || 'Hinzufügen'}</span>
              </span>
              <span className="flex items-center gap-1 flex-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-yellow-400/80" />
                <span>{t('editor.desktop.sections.legend.source' as any) || 'Herkunft anzeigen'}</span>
              </span>
            </div>
            {!isEditing && (
              <div className="mb-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={actions.toggleAddSection}
                  className={showAddSection ? 'w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2' : 'w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2'}
                >
                  <span className="text-2xl leading-none">＋</span>
                  <span>{t('editor.desktop.sections.addButton' as any) || 'Abschnitt hinzufügen'}</span>
                </button>
              </div>
            )}
          </>
        )}

        {!collapsed && isNewUser && (
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center max-w-[150px]">
            Select a product to start creating your business plan
          </div>
        )}

        {!collapsed && showAddSection && !isEditing && (
          <div className="mb-2 flex-shrink-0 border border-dashed border-white/20 rounded-lg p-3 text-white/60 text-xs text-center">
            {/* Add section form - TODO: Implement when needed */}
          </div>
        )}

        {!collapsed && isEditing && editingSection && (
          <div className="mb-2 flex-shrink-0 border border-white/20 bg-white/10 rounded-lg p-3 text-white/60 text-xs text-center">
            <p>Edit form placeholder - SectionDocumentEditForm needs to be implemented</p>
            <button onClick={actions.cancelEdit} className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-xs">
              Cancel
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0" style={{ overflow: 'hidden' }}>
          <div style={{ paddingBottom: '1.5rem' }}>
            <SectionNavigationTree
              activeSectionId={activeSectionId ?? null}
              collapsed={collapsed}
              isNewUser={isNewUser}
              sections={sections}
              disabledSections={disabledSections}
              actions={actions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


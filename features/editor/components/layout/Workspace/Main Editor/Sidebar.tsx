import React, { useState } from 'react';

import { ANCILLARY_SECTION_ID, METADATA_SECTION_ID } from '@/features/editor/hooks/useEditorStore';
import { BusinessPlan } from '@/features/editor/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';

type SidebarProps = {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  filteredSectionIds?: string[] | null; // When provided, only show these sections (null = show all)
  collapsed?: boolean; // New prop for collapsed state
  onToggleCollapse?: () => void; // New prop for toggle
};

export default function Sidebar({ 
  plan, 
  activeSectionId, 
  onSelectSection, 
  filteredSectionIds,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.();
  };

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-[60px]' : 'w-[240px]'
    }`}>
      <div className="relative w-full flex-1 overflow-hidden">
        {!isCollapsed && (
          <div className="mb-2 pb-1 border-b border-white/50">
            <h2 className="text-base font-bold uppercase tracking-wide text-white">
              {(t('editor.header.planSections' as any) as string) || 'Plan Sections'}
            </h2>
          </div>
        )}
        <SectionNavigationTree
          plan={plan}
          activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
          onSelectSection={onSelectSection}
          filteredSectionIds={filteredSectionIds}
          collapsed={isCollapsed}
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleCollapse}
        className="mt-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '►' : '◄'}
      </Button>
    </div>
  );
}

function SectionNavigationTree({
  plan,
  activeSectionId,
  onSelectSection,
  filteredSectionIds,
  collapsed
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  filteredSectionIds?: string[] | null;
  collapsed: boolean;
}) {
  const { t } = useI18n();

  const getSectionTitle = (sectionId: string, originalTitle: string): string => {
    if (sectionId === METADATA_SECTION_ID || sectionId === ANCILLARY_SECTION_ID) {
      return (t('editor.section.metadata' as any) as string) || 'Plan Metadata';
    }
    if (originalTitle.startsWith('editor.section.')) {
      const translated = t(originalTitle as any) as string;
      return translated || originalTitle;
    }
    const translationKey = `editor.section.${sectionId}` as any;
    const translated = t(translationKey) as string;
    if (translated === translationKey && originalTitle.startsWith('editor.')) {
      const titleTranslated = t(originalTitle as any) as string;
      return titleTranslated !== originalTitle ? titleTranslated : originalTitle;
    }
    return translated !== translationKey ? translated : originalTitle;
  };

  const planSectionsToShow = React.useMemo(() => {
    if (filteredSectionIds === null || filteredSectionIds === undefined) {
      return plan.sections;
    }
    return plan.sections.filter(section => filteredSectionIds.includes(section.id));
  }, [plan.sections, filteredSectionIds]);

  const sections = [
    {
      id: METADATA_SECTION_ID,
      title: getSectionTitle(METADATA_SECTION_ID, (t('editor.section.metadata' as any) as string) || 'Plan Metadata'),
      progress: undefined,
      questions: []
    },
    ...planSectionsToShow.map((section) => ({ ...section, title: getSectionTitle(section.id, section.title) }))
  ];

  const handleClick = (sectionId: string) => {
    if (sectionId === ANCILLARY_SECTION_ID) {
      onSelectSection(METADATA_SECTION_ID);
    } else {
      onSelectSection(sectionId);
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col gap-2 overflow-y-auto">
        {sections.map((section) => {
          const totalQuestions = section.questions.length;
          const answeredQuestions = section.questions.filter((question) => question.status === 'complete').length;
          const completion =
            section.progress ?? (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
          const isMetadata = section.id === METADATA_SECTION_ID || section.id === ANCILLARY_SECTION_ID;
          const isActive = section.id === activeSectionId || (isMetadata && (activeSectionId === METADATA_SECTION_ID || activeSectionId === ANCILLARY_SECTION_ID));
          
          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={`w-full p-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-500/30 border border-blue-400'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
              title={section.title}
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

  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      {sections.map((section, index) => {
        const totalQuestions = section.questions.length;
        const answeredQuestions = section.questions.filter((question) => question.status === 'complete').length;
        const completion =
          section.progress ?? (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
        const isMetadata = section.id === METADATA_SECTION_ID || section.id === ANCILLARY_SECTION_ID;
        const isActive = section.id === activeSectionId || (isMetadata && (activeSectionId === METADATA_SECTION_ID || activeSectionId === ANCILLARY_SECTION_ID));
        const progressIntent: 'success' | 'warning' | 'neutral' =
          completion === 100 ? 'success' : completion > 0 ? 'warning' : 'neutral';

        return (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className={`w-full rounded-lg border-2 px-3 py-2 text-left transition-all ${
              isActive
                ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg'
                : 'border-white/50 bg-white/10 text-white hover:border-blue-300/70 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!isMetadata && (
                    <span className="text-[9px] font-bold tracking-wide text-white/70">
                      {String(index).padStart(2, '0')}
                    </span>
                  )}
                  <span className="text-xs font-semibold truncate">{section.title}</span>
                </div>
                <Progress value={completion} intent={progressIntent} size="xs" />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] font-bold text-white">{completion}%</span>
                {isActive && <span className="text-blue-400">●</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


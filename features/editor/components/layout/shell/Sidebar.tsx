import React from 'react';

import { ANCILLARY_SECTION_ID, METADATA_SECTION_ID } from '@/features/editor/hooks/useEditorStore';
import { BusinessPlan } from '@/features/editor/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';

type SidebarProps = {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
};

export default function Sidebar({ plan, activeSectionId, onSelectSection }: SidebarProps) {
  const { t } = useI18n();
  return (
    <div className="relative rounded-lg border border-blue-600/50 overflow-hidden backdrop-blur-lg shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
      <div className="relative z-10 py-2 px-2.5">
        <div className="mb-1">
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">
            {(t('editor.header.planSections' as any) as string) || 'Plan Sections'}
          </h2>
        </div>
        <SectionNavigationBar
          plan={plan}
          activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
          onSelectSection={onSelectSection}
        />
      </div>
    </div>
  );
}

type IconProps = React.SVGProps<SVGSVGElement>;

const ChevronLeftIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5 15.75 12l-7.5 7.5" />
  </svg>
);

function SectionNavigationBar({
  plan,
  activeSectionId,
  onSelectSection
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}) {
  const { t } = useI18n();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const getSectionTitle = (sectionId: string, originalTitle: string): string => {
    if (sectionId === ANCILLARY_SECTION_ID) {
      return (t('editor.section.front_back_matter' as any) as string) || 'Supporting Materials';
    }
    if (sectionId === METADATA_SECTION_ID) {
      return (t('editor.section.metadata' as any) as string) || 'Metadata';
    }
    const translationKey = `editor.section.${sectionId}` as any;
    const translated = t(translationKey) as string;
    return translated || originalTitle;
  };

  const sections = [
    {
      id: METADATA_SECTION_ID,
      title: getSectionTitle(METADATA_SECTION_ID, (t('editor.section.metadata' as any) as string) || 'Metadata'),
      progress: undefined,
      questions: []
    },
    ...plan.sections.map((section) => ({ ...section, title: getSectionTitle(section.id, section.title) })),
    {
      id: ANCILLARY_SECTION_ID,
      title: getSectionTitle(ANCILLARY_SECTION_ID, 'Supporting Materials'),
      progress: undefined,
      questions: []
    }
  ];

  const scrollBy = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
    }
  };

  const handleKeyNavigation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      scrollBy('left');
      event.preventDefault();
    }
    if (event.key === 'ArrowRight') {
      scrollBy('right');
      event.preventDefault();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => scrollBy('left')}
        aria-label="Scroll sections left"
        className="border border-white/30 bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div
        ref={scrollContainerRef}
        className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Plan sections"
        tabIndex={0}
        onKeyDown={handleKeyNavigation}
      >
        {sections.map((section, index) => {
          const totalQuestions = section.questions.length;
          const answeredQuestions = section.questions.filter((question) => question.status === 'complete').length;
          const completion =
            section.progress ?? (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
          const isAncillary = section.id === ANCILLARY_SECTION_ID;
          const isMetadata = section.id === METADATA_SECTION_ID;
          const isActive = section.id === activeSectionId;
          const progressIntent: 'success' | 'warning' | 'neutral' =
            completion === 100 ? 'success' : completion > 0 ? 'warning' : 'neutral';

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              className={`min-w-[200px] rounded-xl border-2 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isActive
                  ? 'border-blue-400 bg-blue-500/30 text-white shadow-xl shadow-blue-900/30 backdrop-blur-md'
                  : 'border-white/50 bg-blue-400/20 text-white hover:border-blue-300/70 hover:bg-blue-400/30 backdrop-blur-sm'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  {!isAncillary && !isMetadata && (
                    <span className="text-xs font-bold tracking-[0.2em] text-white drop-shadow-sm">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white drop-shadow-sm">{completion}%</span>
                </div>
                <Progress value={completion} intent={progressIntent} size="xs" />
                <p className="text-base font-bold leading-snug text-white drop-shadow-sm">{section.title}</p>
              </div>
            </button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => scrollBy('right')}
        aria-label="Scroll sections right"
        className="border border-white/30 bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}


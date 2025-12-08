import React from 'react';

import { ANCILLARY_SECTION_ID, METADATA_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/lib/hooks/useEditorStore';
import { BusinessPlan } from '@/features/editor/lib/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';
import { SectionDocumentEditForm } from '@/features/editor/components/shared/SectionDocumentEditForm';
import type { SectionTemplate, DocumentTemplate } from '@templates';

type SidebarProps = {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  filteredSectionIds?: string[] | null; // When provided, only show these sections (null = show all)
  collapsed?: boolean;
  // Template management props (from Column 3)
  filteredSections?: SectionTemplate[];
  allSections?: SectionTemplate[]; // All sections for counting
  disabledSections?: Set<string>;
  expandedSectionId?: string | null;
  editingSection?: SectionTemplate | null;
  showAddSection?: boolean;
  newSectionTitle?: string;
  newSectionDescription?: string;
  onToggleSection?: (id: string) => void;
  onEditSection?: (section: SectionTemplate, e: React.MouseEvent) => void;
  onSaveSection?: (item: SectionTemplate | DocumentTemplate) => void;
  onCancelEdit?: () => void;
  onToggleAddSection?: () => void;
  onAddCustomSection?: () => void;
  onSetNewSectionTitle?: (title: string) => void;
  onSetNewSectionDescription?: (desc: string) => void;
  onRemoveCustomSection?: (id: string) => void;
  getOriginBadge?: (origin?: string, isSelected?: boolean) => React.ReactNode;
  selectedProductMeta?: { value: string; label: string; description: string; icon?: string } | null;
  programSummary?: { name: string; amountRange?: string | null } | null;
};

export default function Sidebar({ 
  plan, 
  activeSectionId, 
  onSelectSection, 
  filteredSectionIds,
  collapsed = false,
  // Template management props
  filteredSections,
  allSections,
  disabledSections = new Set(),
  expandedSectionId,
  editingSection,
  showAddSection = false,
  newSectionTitle = '',
  newSectionDescription = '',
  onToggleSection,
  onEditSection,
  onSaveSection,
  onCancelEdit,
  onToggleAddSection,
  onAddCustomSection,
  onSetNewSectionTitle,
  onSetNewSectionDescription,
  onRemoveCustomSection,
  getOriginBadge,
  selectedProductMeta,
  programSummary
}: SidebarProps) {
  const { t } = useI18n();
  const isCollapsed = collapsed;


  // Calculate total sections count (all sections, not just filtered)
  const allSectionsCount = allSections?.length ?? plan.sections.length;

  // If editing a section, show edit form
  const isEditing = expandedSectionId && editingSection;

  return (
    <div 
      className={`flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-[60px]' : 'w-[320px]'
      }`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        maxWidth: isCollapsed ? '60px' : '320px',
        width: isCollapsed ? '60px' : '320px',
        minWidth: isCollapsed ? '60px' : '320px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
        flexShrink: 0,
        flexGrow: 0,
        boxSizing: 'border-box'
      }}
    >
      <div className="relative w-full flex-1 flex flex-col min-h-0" style={{ flexBasis: 0, minHeight: 0, maxHeight: '100%', maxWidth: '100%', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        {!isCollapsed && (
          <h2 className="text-lg font-bold uppercase tracking-wide text-white mb-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)' }}>
            {(t('editor.desktop.sections.title' as any) as string) || 'Deine Abschnitte'} ({allSectionsCount})
          </h2>
        )}

        {/* Header info and Add Section Button */}
        {!isCollapsed && (
          <>
            <div className="text-[10px] text-white/50 mb-2 flex-shrink-0 flex items-center justify-between w-full">
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
            {!isEditing && onToggleAddSection && (
              <div className="mb-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onToggleAddSection}
                  className={`relative w-full border rounded-lg p-2.5 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold tracking-tight transition-all ${
                    showAddSection
                      ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                      : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span className="text-2xl leading-none">＋</span>
                  <span>{t('editor.desktop.sections.addButton' as any) || 'Abschnitt hinzufügen'}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Section Form - Original style */}
        {!isCollapsed && showAddSection && !isEditing && onAddCustomSection && (
          <div className="mb-2 flex-shrink-0 border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
            <p className="text-xs text-white/80 font-semibold mb-2">
              {t('editor.desktop.sections.custom.title' as any) || 'Einen benutzerdefinierten Abschnitt zu Ihrem Plan hinzufügen'}
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-white/70 block mb-1">
                  {t('editor.desktop.sections.custom.name' as any) || 'Titel *'}
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => onSetNewSectionTitle?.(e.target.value)}
                  placeholder={t('editor.desktop.sections.custom.namePlaceholder' as any) || 'z.B. Zusammenfassung'}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] text-white/70 block mb-1">
                  {t('editor.desktop.sections.custom.description' as any) || 'Beschreibung'}
                </label>
                <textarea
                  value={newSectionDescription}
                  onChange={(e) => onSetNewSectionDescription?.(e.target.value)}
                  placeholder={t('editor.desktop.sections.custom.descriptionPlaceholder' as any) || 'Optionale Beschreibung des Abschnitts'}
                  rows={2}
                  className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={onAddCustomSection}
                disabled={!newSectionTitle.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('editor.desktop.sections.custom.add' as any) || 'Hinzufügen'}
              </Button>
              <Button
                onClick={onToggleAddSection}
                variant="ghost"
                className="text-white/60 hover:text-white text-xs px-3 py-1"
              >
                {t('editor.desktop.sections.custom.cancel' as any) || 'Abbrechen'}
              </Button>
            </div>
          </div>
        )}

        {/* Edit Section Form */}
        {!isCollapsed && isEditing && editingSection && onSaveSection && onCancelEdit && (
          <div className="mb-2 flex-shrink-0 border border-white/20 bg-white/10 rounded-lg p-3">
            <SectionDocumentEditForm
              type="section"
              item={editingSection}
              onSave={onSaveSection}
              onCancel={onCancelEdit}
              getOriginBadge={getOriginBadge || (() => null)}
            />
          </div>
        )}

        {/* Sections Tree */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowX: 'hidden' }}>
          <div style={{ paddingBottom: '80px' }}>
            <SectionNavigationTree
              plan={plan}
              activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
              onSelectSection={onSelectSection}
              filteredSectionIds={filteredSectionIds}
              collapsed={isCollapsed}
              // Template management props
              filteredSections={filteredSections}
              allSections={allSections}
              disabledSections={disabledSections}
              onToggleSection={onToggleSection}
              onEditSection={onEditSection}
              onRemoveCustomSection={onRemoveCustomSection}
              getOriginBadge={getOriginBadge}
              selectedProductMeta={selectedProductMeta}
              programSummary={programSummary}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionNavigationTree({
  plan,
  activeSectionId,
  onSelectSection,
  filteredSectionIds,
  collapsed,
  filteredSections,
  allSections,
  disabledSections = new Set(),
  onToggleSection,
  onEditSection,
  onRemoveCustomSection,
  getOriginBadge,
  selectedProductMeta,
  programSummary
}: {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  filteredSectionIds?: string[] | null;
  collapsed: boolean;
  filteredSections?: SectionTemplate[];
  allSections?: SectionTemplate[]; // All sections for counting
  disabledSections?: Set<string>;
  onToggleSection?: (id: string) => void;
  onEditSection?: (section: SectionTemplate, e: React.MouseEvent) => void;
  onRemoveCustomSection?: (id: string) => void;
  getOriginBadge?: (origin?: string, isSelected?: boolean) => React.ReactNode;
  selectedProductMeta?: { value: string; label: string; description: string; icon?: string } | null;
  programSummary?: { name: string; amountRange?: string | null } | null;
}) {
  const { t } = useI18n();

  const getSectionTitle = (sectionId: string, originalTitle: string): string => {
    if (sectionId === METADATA_SECTION_ID) {
      return (t('editor.section.metadata' as any) as string) || 'Title Page';
    }
    if (sectionId === ANCILLARY_SECTION_ID) {
      return (t('editor.section.ancillary' as any) as string) || 'Table of Contents';
    }
    if (sectionId === REFERENCES_SECTION_ID) {
      return (t('editor.section.references' as any) as string) || 'References';
    }
    if (sectionId === APPENDICES_SECTION_ID) {
      return (t('editor.section.appendices' as any) as string) || 'Appendices';
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

  // Map plan sections to include template info from filteredSections
  // When showing cards, use allSections templates but map to plan sections for data
  const sectionsWithTemplate = React.useMemo(() => {
    const baseSections = [
      {
        id: METADATA_SECTION_ID,
        title: getSectionTitle(METADATA_SECTION_ID, (t('editor.section.metadata' as any) as string) || 'Title Page'),
        progress: undefined,
        questions: [],
        origin: undefined as any,
        required: false
      },
      {
        id: ANCILLARY_SECTION_ID,
        title: getSectionTitle(ANCILLARY_SECTION_ID, (t('editor.section.ancillary' as any) as string) || 'Table of Contents'),
        progress: undefined,
        questions: [],
        origin: undefined as any,
        required: false
      },
      ...planSectionsToShow.map((section) => {
        const templateInfo = filteredSections?.find(s => s.id === section.id);
        return {
          ...section,
          title: getSectionTitle(section.id, section.title),
          origin: templateInfo?.origin,
          required: templateInfo?.required ?? false
        };
      }),
      {
        id: REFERENCES_SECTION_ID,
        title: getSectionTitle(REFERENCES_SECTION_ID, (t('editor.section.references' as any) as string) || 'References'),
        progress: undefined,
        questions: [],
        origin: undefined as any,
        required: false
      },
      {
        id: APPENDICES_SECTION_ID,
        title: getSectionTitle(APPENDICES_SECTION_ID, (t('editor.section.appendices' as any) as string) || 'Appendices'),
        progress: undefined,
        questions: [],
        origin: undefined as any,
        required: false
      }
    ];
    return baseSections;
  }, [planSectionsToShow, filteredSections, t, getSectionTitle]);

  const sections = sectionsWithTemplate;
  
  // Determine if we should show as cards - show cards when template management is available
  // This ensures all products show the same card UI with emojis, edit icons, checkboxes, and origin indicators
  // Show cards if we have template management props (allSections or handlers) OR if filteredSections has items
  const hasTemplateManagement = allSections !== undefined || onToggleSection !== undefined || onEditSection !== undefined;
  const showAsCards = !collapsed && (hasTemplateManagement || (filteredSections !== undefined && filteredSections.length > 0));
  
  // When showing cards, filter to show all sections (from allSections templates) but use plan section data
  const sectionsForCards = React.useMemo(() => {
    if (!showAsCards || !allSections) return sections;
    
    // Always include special sections: METADATA first, ANCILLARY second
    const metadataSection = {
      id: METADATA_SECTION_ID,
      title: getSectionTitle(METADATA_SECTION_ID, (t('editor.section.metadata' as any) as string) || 'Title Page'),
      progress: undefined,
      questions: [],
      origin: undefined as any,
      required: false
    };
    
    const ancillarySection = {
      id: ANCILLARY_SECTION_ID,
      title: getSectionTitle(ANCILLARY_SECTION_ID, (t('editor.section.ancillary' as any) as string) || 'Table of Contents'),
      progress: undefined,
      questions: [],
      origin: undefined as any,
      required: false
    };
    
    // Map allSections templates to plan sections to get questions/progress
    const mappedSections = allSections.map((template) => {
      const planSection = plan.sections.find(s => s.id === template.id);
      if (!planSection) {
        // If no plan section exists, create a minimal section from template
        return {
          id: template.id,
          title: getSectionTitle(template.id, template.title),
          questions: [],
          progress: undefined,
          origin: template.origin,
          required: template.required ?? false
        };
      }
      return {
        ...planSection,
        title: getSectionTitle(planSection.id, planSection.title),
        origin: template.origin,
        required: template.required ?? false
      };
    });
    
    // Always include REFERENCES and APPENDICES sections last
    const referencesSection = {
      id: REFERENCES_SECTION_ID,
      title: getSectionTitle(REFERENCES_SECTION_ID, (t('editor.section.references' as any) as string) || 'References'),
      progress: undefined,
      questions: [],
      origin: undefined as any,
      required: false
    };
    
    const appendicesSection = {
      id: APPENDICES_SECTION_ID,
      title: getSectionTitle(APPENDICES_SECTION_ID, (t('editor.section.appendices' as any) as string) || 'Appendices'),
      progress: undefined,
      questions: [],
      origin: undefined as any,
      required: false
    };
    
    return [metadataSection, ancillarySection, ...mappedSections, referencesSection, appendicesSection];
  }, [showAsCards, allSections, sections, plan.sections, getSectionTitle, collapsed, filteredSections, t]);

  const handleClick = (sectionId: string) => {
    onSelectSection(sectionId);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col gap-2" style={{ paddingBottom: '20px' }}>
        {sections.map((section) => {
          const totalQuestions = section.questions?.length ?? 0;
          const answeredQuestions = section.questions?.filter((question: any) => question.status === 'complete').length ?? 0;
          const completion =
            (section as any).progress ?? (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
          const isActive = section.id === activeSectionId;
          const isDisabled = disabledSections.has(section.id);
          
          return (
            <button
              key={section.id}
              onClick={() => !isDisabled && handleClick(section.id)}
              disabled={isDisabled}
              className={`w-full p-2 rounded-lg transition-all ${
                isDisabled
                  ? 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
                  : isActive
                  ? 'bg-blue-500/30 border border-blue-400'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
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
    const displaySections = sectionsForCards.length > 0 ? sectionsForCards : sections;
    return (
      <div className="grid grid-cols-1 gap-2 pr-1 auto-rows-min" style={{ maxWidth: '100%', width: '100%', paddingBottom: '20px' }}>
        {displaySections.map((section) => {
          const totalQuestions = section.questions.length;
          const answeredQuestions = section.questions.filter((question) => question.status === 'complete').length;
          const completion =
            section.progress ?? (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
          const isActive = section.id === activeSectionId;

          const isDisabled = disabledSections.has(section.id);
          const sectionTemplate = filteredSections?.find(s => s.id === section.id) || allSections?.find(s => s.id === section.id);
          const sectionOrigin = sectionTemplate?.origin || section.origin;
          const isRequired = sectionTemplate?.required ?? section.required ?? false;
          const isCustom = sectionOrigin === 'custom';

          return (
            <div
              key={section.id}
              onClick={(e) => {
                if (isDisabled) return; // Don't allow clicking disabled sections
                const target = e.target as HTMLElement;
                if (
                  target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox'
                ) {
                  return;
                }
                if (
                  target.closest('button') || 
                  target.closest('input[type="checkbox"]') ||
                  target.closest('[data-badge="true"]') || 
                  target.closest('[class*="Badge"]') || 
                  target.getAttribute('data-badge') === 'true'
                ) {
                  return;
                }
                handleClick(section.id);
              }}
              className={`relative border rounded-lg p-2.5 transition-all overflow-hidden ${
                isDisabled
                  ? 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'
                  : isActive
                  ? 'border-blue-400/60 bg-blue-500/30 ring-2 ring-blue-400/40 cursor-pointer'
                  : isRequired
                  ? 'border-amber-500/30 bg-amber-500/5 cursor-pointer hover:border-white/40'
                  : 'border-white/20 bg-white/10 cursor-pointer hover:border-white/40'
              } group`}
              style={{ maxWidth: '100%', width: '100%' }}
            >
              <div className="absolute top-1 right-1 z-10 flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  {onEditSection && (sectionTemplate || allSections?.find(s => s.id === section.id)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const template = sectionTemplate || allSections?.find(s => s.id === section.id);
                        if (template) {
                          onEditSection(template, e);
                        }
                      }}
                      className="text-white/60 hover:text-white text-xs transition-opacity"
                    >
                      ✏️
                    </button>
                  )}
                  {onToggleSection && (
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSection(section.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                        isDisabled
                          ? 'border-white/30 bg-white/10'
                          : isRequired
                          ? 'border-amber-500 bg-amber-600/30 opacity-90'
                          : 'border-blue-500 bg-blue-600/30'
                      } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                    />
                  )}
                </div>
                {/* Origin indicator */}
                {sectionOrigin && (() => {
                  const getSourceInfo = () => {
                    if (sectionOrigin === 'program') {
                      const recommendedByText = t('editor.desktop.sections.source.recommendedBy' as any) || 'Recommended by {name}';
                      return {
                        tooltip: programSummary 
                          ? recommendedByText.replace('{name}', programSummary.name)
                          : (t('editor.desktop.sections.source.recommendedByProgram' as any) || 'Recommended by Program')
                      };
                    }
                    if (sectionOrigin === 'custom') {
                      return {
                        tooltip: t('editor.desktop.sections.source.fromTemplate' as any) || 'Section from Template'
                      };
                    }
                    const productName = selectedProductMeta?.label || 'Core Product';
                    const fromProductText = t('editor.desktop.sections.source.fromProduct' as any) || 'Section from {product}';
                    return {
                      tooltip: fromProductText.replace('{product}', productName)
                    };
                  };
                  
                  const sourceInfo = getSourceInfo();
                  return (
                    <div className="relative group -translate-x-0.5">
                      <div 
                        className="w-2 h-2 rounded-full bg-yellow-400/70 cursor-help"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 px-2 py-1.5 bg-blue-900/95 border border-blue-700/30 rounded-lg text-[9px] text-white/90 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-normal shadow-lg">
                        {sourceInfo.tooltip}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex flex-col items-center gap-1 pt-4 min-h-[50px] w-full">
                <span className="text-2xl leading-none flex-shrink-0">📋</span>
                <div className="w-full text-center min-h-[28px] flex items-center justify-center gap-1">
                  <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                    {section.title}
                  </h4>
                  {getOriginBadge && sectionOrigin && (
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="inline-block select-none"
                      data-badge="true"
                    >
                      {getOriginBadge(sectionOrigin, false)}
                    </span>
                  )}
                </div>
                {isCustom && onRemoveCustomSection && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveCustomSection(section.id);
                    }}
                    className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
                  >
                    ×
                  </button>
                )}
                {isActive && (
                  <div className="w-full mt-1">
                    <Progress value={completion} intent={completion === 100 ? 'success' : completion > 0 ? 'warning' : 'neutral'} size="xs" />
                    <span className="text-[9px] text-white/70 mt-0.5 block text-center">{completion}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback to list view when collapsed or no template management
  return (
    <div className="flex flex-col gap-1" style={{ paddingBottom: '20px' }}>
      {sections.map((section, sectionIndex) => {
        const totalQuestions = section.questions?.length ?? 0;
        const answeredQuestions = section.questions?.filter((question: any) => question.status === 'complete').length ?? 0;
        const completion =
          (section as any).progress ?? (totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100));
        const isSpecialSection = section.id === METADATA_SECTION_ID || section.id === ANCILLARY_SECTION_ID || section.id === REFERENCES_SECTION_ID || section.id === APPENDICES_SECTION_ID;
        const isActive = section.id === activeSectionId;
        const progressIntent: 'success' | 'warning' | 'neutral' =
          completion === 100 ? 'success' : completion > 0 ? 'warning' : 'neutral';

        const isDisabled = disabledSections.has(section.id);
        const sectionTemplate = filteredSections?.find(s => s.id === section.id);
        const sectionOrigin = sectionTemplate?.origin || section.origin;
        const isRequired = sectionTemplate?.required ?? section.required ?? false;
        const isCustom = sectionOrigin === 'custom';

        return (
          <div
            key={section.id}
            className={`w-full rounded-lg border-2 px-3 py-2 transition-all ${
              isDisabled
                ? 'border-white/20 bg-white/5 opacity-40 cursor-not-allowed'
                : isActive
                ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg'
                : isRequired
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-white/50 bg-white/10 text-white hover:border-blue-300/70 hover:bg-white/20'
            }`}
          >
            <button
              onClick={() => !isDisabled && handleClick(section.id)}
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
                    {!collapsed && getOriginBadge && sectionOrigin && (
                      <span onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        {getOriginBadge(sectionOrigin, false)}
                      </span>
                    )}
                  </div>
                  <Progress value={completion} intent={progressIntent} size="xs" />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!collapsed && onToggleSection && (
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSection(section.id);
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
                  {!collapsed && onEditSection && sectionTemplate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditSection(sectionTemplate, e);
                      }}
                      className="text-white/60 hover:text-white text-xs transition-opacity"
                    >
                      ✏️
                    </button>
                  )}
                  {!collapsed && isCustom && onRemoveCustomSection && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveCustomSection(section.id);
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


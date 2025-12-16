import React from 'react';

import { METADATA_SECTION_ID, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/lib/helpers';
import { BusinessPlan } from '@/features/editor/lib/types';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';
import { SectionDocumentEditForm } from '@/features/editor/components/layout/Workspace/shared/SectionDocumentEditForm';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import {
  buildSectionsForSidebar,
  getSectionTitle,
  isSpecialSectionId,
} from '@/features/editor/lib/helpers';

// ============================================================================
// TYPES
// ============================================================================

type SidebarProps = {
  plan: BusinessPlan | null;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  filteredSectionIds?: string[] | null;
  collapsed?: boolean;
  // Template management props
  filteredSections?: SectionTemplate[];
  allSections?: SectionTemplate[];
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
  onRemoveCustomSection?: (id: string) => void;
  getOriginBadge?: (origin?: string, isSelected?: boolean) => React.ReactNode;
  selectedProductMeta?: { value: string; label: string; description: string; icon?: string } | null;
  programSummary?: { name: string; amountRange?: string | null } | null;
  selectedProduct?: string | null;
  isNewUser?: boolean;
};

type SectionNavigationTreeProps = {
  plan: BusinessPlan | null;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  filteredSectionIds?: string[] | null;
  collapsed: boolean;
  filteredSections?: SectionTemplate[];
  allSections?: SectionTemplate[];
  disabledSections?: Set<string>;
  onToggleSection?: (id: string) => void;
  onEditSection?: (section: SectionTemplate, e: React.MouseEvent) => void;
  onRemoveCustomSection?: (id: string) => void;
  getOriginBadge?: (origin?: string, isSelected?: boolean) => React.ReactNode;
  selectedProductMeta?: { value: string; label: string; description: string; icon?: string } | null;
  programSummary?: { name: string; amountRange?: string | null } | null;
  selectedProduct?: string | null;
  isNewUser?: boolean;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates completion percentage for a section
 */
function calculateCompletion(section: { questions?: any[]; progress?: number }): number {
  const totalQuestions = section.questions?.length ?? 0;
  if (totalQuestions === 0) return 0;
  
  const answeredQuestions = section.questions?.filter((q: any) => q.status === 'complete').length ?? 0;
  return section.progress ?? Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Gets progress intent based on completion percentage
 */
function getProgressIntent(completion: number): 'success' | 'warning' | 'neutral' {
  if (completion === 100) return 'success';
  if (completion > 0) return 'warning';
  return 'neutral';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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
  programSummary,
  selectedProduct,
  isNewUser = false
}: SectionNavigationTreeProps) {
  const { t } = useI18n();

  // Use centralized section building logic
  const sectionsWithTemplate = React.useMemo(() => {
    const getTitle = (sectionId: string, originalTitle: string) =>
      getSectionTitle(sectionId, originalTitle, t);

    return buildSectionsForSidebar({
      planSections: plan?.sections,
      allSections: allSections || filteredSections || [],
      disabledSectionIds: Array.from(disabledSections),
      filteredSectionIds,
      selectedProduct,
      isNewUser,
      getTitle,
    });
  }, [plan, allSections, filteredSections, disabledSections, filteredSectionIds, selectedProduct, isNewUser, t]);

  // Determine display mode
  const hasTemplateManagement = allSections !== undefined || onToggleSection !== undefined || onEditSection !== undefined;
  const showAsCards = !collapsed && (hasTemplateManagement || (filteredSections !== undefined && filteredSections.length > 0));

  // Sections for card view (uses allSections templates)
  // For card view, we want to show all available sections from templates, not just plan sections
  const sectionsForCards = React.useMemo(() => {
    if (isNewUser) return [];
    if (!showAsCards || !allSections) return sectionsWithTemplate;
    
    // For card view, use the same logic but with allSections as the source
    // This ensures we show all template sections, even if they're not in the plan yet
    const getTitle = (sectionId: string, originalTitle: string) =>
      getSectionTitle(sectionId, originalTitle, t);

    // Build sections using allSections as the template source
    // This will include all available sections from templates
    return buildSectionsForSidebar({
      planSections: plan?.sections,
      allSections,
      disabledSectionIds: Array.from(disabledSections),
      filteredSectionIds,
      selectedProduct,
      isNewUser,
      getTitle,
    });
  }, [showAsCards, allSections, sectionsWithTemplate, plan, disabledSections, filteredSectionIds, selectedProduct, isNewUser, t]);

  const handleClick = (sectionId: string) => {
    onSelectSection(sectionId);
  };

  const sections = sectionsWithTemplate;
  const displaySections = isNewUser ? [] : (showAsCards && sectionsForCards.length > 0 ? sectionsForCards : sections);

  // ============================================================================
  // RENDER: Collapsed View
  // ============================================================================
  if (collapsed) {
    return (
      <div className="flex flex-col gap-2" style={{ paddingBottom: '20px' }}>
        {displaySections.map((section) => {
          const completion = calculateCompletion(section);
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

  // ============================================================================
  // RENDER: Card View
  // ============================================================================
  if (showAsCards) {
    return (
      <div className="grid grid-cols-1 gap-2 pr-1 auto-rows-min" style={{ maxWidth: '100%', width: '100%', paddingBottom: '20px' }}>
        {displaySections.map((section) => {
          const completion = calculateCompletion(section);
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
                if (isDisabled) return;
                const target = e.target as HTMLElement;
                if (
                  target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox' ||
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
              {/* Action buttons */}
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
              
              {/* Section content */}
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
                    <Progress value={completion} intent={getProgressIntent(completion)} size="xs" />
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

  // ============================================================================
  // RENDER: List View (Fallback)
  // ============================================================================
  return (
    <div className="flex flex-col gap-1" style={{ paddingBottom: '20px' }}>
      {sections.map((section, sectionIndex) => {
        const completion = calculateCompletion(section);
        const isSpecialSection = section.id === METADATA_SECTION_ID || 
          section.id === ANCILLARY_SECTION_ID || 
          section.id === REFERENCES_SECTION_ID || 
          section.id === APPENDICES_SECTION_ID;
        const isActive = section.id === activeSectionId;
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
                    {getOriginBadge && sectionOrigin && (
                      <span onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        {getOriginBadge(sectionOrigin, false)}
                      </span>
                    )}
                  </div>
                  <Progress value={completion} intent={getProgressIntent(completion)} size="xs" />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {onToggleSection && (
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
                  {onEditSection && sectionTemplate && (
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
                  {isCustom && onRemoveCustomSection && (
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Sidebar({ 
  plan, 
  activeSectionId, 
  onSelectSection, 
  filteredSectionIds,
  collapsed = false,
  filteredSections,
  allSections,
  disabledSections = new Set(),
  expandedSectionId,
  editingSection,
  showAddSection = false,
  onToggleSection,
  onEditSection,
  onSaveSection,
  onCancelEdit,
  onToggleAddSection,
  onAddCustomSection,
  onRemoveCustomSection,
  getOriginBadge,
  selectedProductMeta,
  programSummary,
  selectedProduct,
  isNewUser = false
}: SidebarProps) {
  const { t } = useI18n();
  const isCollapsed = collapsed;
  const allSectionsCount = allSections?.length ?? plan?.sections.length ?? 0;
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
        {/* Header */}
        {!isCollapsed && (
          <h2 className="text-lg font-bold uppercase tracking-wide text-white mb-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)' }}>
            {(t('editor.desktop.sections.title' as any) as string) || 'Deine Abschnitte'} ({allSectionsCount})
          </h2>
        )}

        {/* Header info and Add Section Button */}
        {!isCollapsed && !isNewUser && (
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

        {/* New User Message - TODO: Replace with shared EmptyState component */}
        {!isCollapsed && isNewUser && (
          <div className="mb-2 flex-shrink-0 border border-dashed border-white/20 rounded-lg p-2.5 text-white/60 text-xs text-center">
            [Empty State - To be recreated as shared component]
          </div>
        )}

        {/* Add Section Form - TODO: Replace with shared AddItemForm component */}
        {!isCollapsed && showAddSection && !isEditing && onAddCustomSection && (
          <div className="mb-2 flex-shrink-0 border border-dashed border-white/20 rounded-lg p-3 text-white/60 text-xs">
            [Add Section Form - To be recreated as shared component]
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
              activeSectionId={activeSectionId ?? plan?.sections[0]?.id ?? null}
              onSelectSection={onSelectSection}
              filteredSectionIds={filteredSectionIds}
              collapsed={isCollapsed}
              filteredSections={filteredSections}
              allSections={allSections}
              disabledSections={disabledSections}
              onToggleSection={onToggleSection}
              onEditSection={onEditSection}
              onRemoveCustomSection={onRemoveCustomSection}
              getOriginBadge={getOriginBadge}
              selectedProductMeta={selectedProductMeta}
              programSummary={programSummary}
              selectedProduct={selectedProduct}
              isNewUser={isNewUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

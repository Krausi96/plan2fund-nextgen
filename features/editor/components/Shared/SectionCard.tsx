// Reusable section card component extracted from Sidebar

import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  type SectionTemplate,
  type SectionWithMetadata,
  useSelectedProductMeta,
  useEditorStore,
  SECTION_STYLES,
  INLINE_STYLES,
  shouldIgnoreClick,
} from '@/features/editor/lib';

export interface SectionCardProps {
  section: SectionWithMetadata;
  isActive: boolean;
  isDisabled: boolean;
  onSelect: (sectionId: string) => void;
  onToggle?: (id: string) => void;
  onEdit?: (section: SectionTemplate, e: React.MouseEvent) => void;
  onRemoveCustom?: (id: string) => void;
  getOriginBadge?: (origin?: string, isSelected?: boolean) => React.ReactNode;
}

/**
 * Section origin tooltip component
 */
function SectionOriginTooltip({
  sectionOrigin,
}: {
  sectionOrigin: string;
}) {
  const { t } = useI18n();
  const selectedProductMeta = useSelectedProductMeta();
  const programSummary = useEditorStore((state) => state.programSummary);

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
    <div className={SECTION_STYLES.originTooltip.container}>
      <div 
        className={SECTION_STYLES.originTooltip.indicator}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      <div className={SECTION_STYLES.originTooltip.tooltip}>
        {sourceInfo.tooltip}
      </div>
    </div>
  );
}

/**
 * Section card component for card view
 */
export function SectionCard({
  section,
  isActive,
  isDisabled,
  onSelect,
  onToggle,
  onEdit,
  onRemoveCustom,
  getOriginBadge,
}: SectionCardProps) {
  const sectionOrigin = (section.origin as 'template' | 'custom' | undefined);
  const isRequired = section.required ?? false;
  const isCustom = sectionOrigin === 'custom';
  
  const cardClass = isDisabled
    ? SECTION_STYLES.card.item.disabled
    : isActive
    ? SECTION_STYLES.card.item.active
    : isRequired
    ? SECTION_STYLES.card.item.required
    : SECTION_STYLES.card.item.default;

  const checkboxClass = isDisabled
    ? SECTION_STYLES.card.checkbox.disabled
    : isRequired
    ? SECTION_STYLES.card.checkbox.required
    : SECTION_STYLES.card.checkbox.default;

  return (
    <div
      onClick={(e) => {
        if (isDisabled || shouldIgnoreClick(e.target as HTMLElement)) return;
        onSelect(section.id);
      }}
      className={`${SECTION_STYLES.card.base} ${cardClass}`}
    >
      {/* Action buttons */}
      <div className={SECTION_STYLES.card.actions}>
        <div className={SECTION_STYLES.card.actionsRow}>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const sectionTemplate: SectionTemplate = {
                  id: section.id,
                  title: section.title,
                  origin: section.origin as 'template' | 'custom' | undefined,
                  required: section.required
                };
                onEdit(sectionTemplate, e);
              }}
              className={SECTION_STYLES.card.editButton}
            >
              ✏️
            </button>
          )}
          {onToggle && (
            <input
              type="checkbox"
              checked={!isDisabled}
              onChange={(e) => {
                e.stopPropagation();
                onToggle(section.id);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={`${SECTION_STYLES.card.checkbox.base} ${checkboxClass}`}
            />
          )}
        </div>
        {/* Origin indicator */}
        {sectionOrigin && (
            <SectionOriginTooltip
              sectionOrigin={sectionOrigin}
            />
        )}
      </div>
      
      {/* Section content */}
      <div className={SECTION_STYLES.card.content}>
        <span className={SECTION_STYLES.card.icon}>📋</span>
        <div className={SECTION_STYLES.card.titleContainer}>
          <h4 className={isDisabled ? SECTION_STYLES.card.titleDisabled : SECTION_STYLES.card.title}>
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
              className={SECTION_STYLES.card.originBadge}
              data-badge="true"
            >
              {getOriginBadge(sectionOrigin, false)}
            </span>
          )}
        </div>
        {isCustom && onRemoveCustom && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveCustom(section.id);
            }}
            className={SECTION_STYLES.card.removeButton}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

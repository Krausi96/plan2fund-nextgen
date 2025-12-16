// Reusable section card component extracted from Sidebar

import React from 'react';
import { Progress } from '@/shared/components/ui/progress';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  type SectionTemplate,
  type SectionWithMetadata,
  useSelectedProductMeta,
  useEditorStore,
  SECTION_STYLES,
  INLINE_STYLES,
  shouldIgnoreClick,
  calculateCompletion,
  getProgressIntent,
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
  const completion = calculateCompletion(section);
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

  return (
    <div
      onClick={(e) => {
        if (isDisabled || shouldIgnoreClick(e.target as HTMLElement)) return;
        onSelect(section.id);
      }}
      className={`relative border rounded-lg p-2.5 transition-all overflow-hidden ${cardClass} group`}
      style={INLINE_STYLES.fullWidth}
    >
      {/* Action buttons */}
      <div className="absolute top-1 right-1 z-10 flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1">
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
              className="text-white/60 hover:text-white text-xs transition-opacity"
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
        {sectionOrigin && (
            <SectionOriginTooltip
              sectionOrigin={sectionOrigin}
            />
        )}
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
        {isCustom && onRemoveCustom && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveCustom(section.id);
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
}

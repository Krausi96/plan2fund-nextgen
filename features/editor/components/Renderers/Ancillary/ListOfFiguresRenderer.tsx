// List of Figures renderer - extracted from AncillaryRenderer
import React from 'react';
import { 
  type PlanSection, 
  ANCILLARY_SECTION_ID,
  PAGE_STYLE,
  getTranslation,
  calculatePageNumber,
  useDisabledSectionsSet,
} from '@/features/editor/lib';
import { type RendererCommonProps } from '../DocumentRenderer';

interface ListOfFiguresRendererProps extends Omit<RendererCommonProps, 'disabledSections'> {
  sectionsToRender: PlanSection[];
}

export function ListOfFiguresRenderer({
  plan,
  sectionsToRender,
  onSectionClick,
}: ListOfFiguresRendererProps) {
  // Access store directly - no prop drilling needed
  const disabledSections = useDisabledSectionsSet();
  const isGerman = plan.language === 'de';
  const t = getTranslation(isGerman);

  const allFigures: Array<{
    id?: string;
    name: string;
    caption?: string;
    description?: string;
    source?: string;
    tags?: string[];
    sectionTitle: string;
    sectionNumber: number | null;
  }> = [];
  
  sectionsToRender.forEach((section) => {
    const sectionNumber = section.fields?.sectionNumber ?? null;
    if (section.figures && section.figures.length > 0) {
      section.figures.forEach((figure: any) => {
        allFigures.push({
          id: figure.id,
          name: figure.title || t.figure,
          caption: figure.caption,
          description: figure.description,
          source: figure.source,
          tags: figure.tags,
          sectionTitle: section.title,
          sectionNumber
        });
      });
    }
  });

  const listOfFiguresPageNumber = calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false, 1);
  const manualFigures = plan.ancillary?.listOfIllustrations || [];
  const allFigureEntries = [
    ...allFigures,
    ...manualFigures.map((f: any) => ({ 
      id: f.id, 
      name: f.label, 
      caption: undefined, 
      description: undefined, 
      source: undefined, 
      tags: undefined,
      sectionTitle: '',
      sectionNumber: null
    }))
  ];

  if (allFigureEntries.length === 0) return null;
  if (disabledSections.has(ANCILLARY_SECTION_ID)) return null;

  return (
    <div 
      className="export-preview-page export-preview-section cursor-pointer hover:bg-blue-50/30 transition-colors"
      data-section-id={ANCILLARY_SECTION_ID}
      onClick={() => onSectionClick?.(ANCILLARY_SECTION_ID)}
      style={PAGE_STYLE}
    >
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 
              className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSectionClick?.(ANCILLARY_SECTION_ID);
              }}
            >
              {t.listOfFigures}
            </h2>
          </div>
          <div className="space-y-3">
            {allFigureEntries.map((figure: any) => (
              <div key={figure.id || figure.name} className="text-sm text-gray-700 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{figure.name}</span>
                  {figure.sectionTitle && (
                    <span className="text-gray-500 ml-2">
                      — {figure.sectionNumber !== null ? `${figure.sectionNumber}. ` : ''}{figure.sectionTitle}
                    </span>
                  )}
                </div>
                {figure.description && <p className="text-xs text-gray-500">{figure.description}</p>}
                {figure.caption && <p className="text-xs text-gray-500 italic">{figure.caption}</p>}
                {figure.source && <p className="text-xs text-gray-500">Source: {figure.source}</p>}
                {figure.tags && figure.tags.length > 0 && (
                  <p className="text-[11px] text-gray-400 uppercase">Tags: {figure.tags.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        {plan.settings.includePageNumbers && (
          <div className="export-preview-page-footer">
            <span>{t.page} {listOfFiguresPageNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

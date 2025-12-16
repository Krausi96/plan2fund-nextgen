// References renderer - extracted from AncillaryRenderer
import React from 'react';
import { 
  REFERENCES_SECTION_ID,
  PAGE_STYLE,
  getTranslation,
  calculatePageNumber,
  useDisabledSectionsSet,
} from '@/features/editor/lib';
import { type RendererCommonProps } from '../DocumentRenderer';

interface ReferencesRendererProps extends Omit<RendererCommonProps, 'disabledSections'> {
  sectionsToRender?: any[];
}

export function ReferencesRenderer({
  plan,
  sectionsToRender,
  onSectionClick,
}: ReferencesRendererProps) {
  // Access store directly - no prop drilling needed
  const disabledSections = useDisabledSectionsSet();
  const isGerman = plan.language === 'de';
  const t = getTranslation(isGerman);

  const pageNumber = calculatePageNumber(sectionsToRender?.length ?? 0, plan.settings.includeTitlePage ?? false, 2);

  if (disabledSections.has(REFERENCES_SECTION_ID)) return null;

  return (
    <div 
      className="export-preview-page export-preview-section cursor-pointer hover:bg-blue-50/30 transition-colors"
      data-section-id={REFERENCES_SECTION_ID}
      onClick={() => onSectionClick?.(REFERENCES_SECTION_ID)}
      style={PAGE_STYLE}
    >
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 
              className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSectionClick?.(REFERENCES_SECTION_ID);
              }}
            >
              {t.references}
            </h2>
          </div>
          {plan.references && plan.references.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
              {plan.references.map((ref: any) => (
                <li key={ref.id}>
                  <div className="space-y-2">
                    <div>{ref.citation || <span className="text-gray-400 italic">No citation</span>}</div>
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                        [{ref.url}]
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              {t.noReferencesYet}
            </div>
          )}
        </div>
        {plan.settings.includePageNumbers && (
          <div className="export-preview-page-footer">
            <span>{t.page} {pageNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

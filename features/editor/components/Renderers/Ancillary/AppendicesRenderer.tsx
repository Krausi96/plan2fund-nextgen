// Appendices renderer - extracted from AncillaryRenderer
import React from 'react';
import { 
  APPENDICES_SECTION_ID,
  PAGE_STYLE,
  getTranslation,
  calculatePageNumber,
  useDisabledSectionsSet,
} from '@/features/editor/lib';
import { type RendererCommonProps } from '../DocumentRenderer';

interface AppendicesRendererProps extends Omit<RendererCommonProps, 'disabledSections'> {
  sectionsToRender: any[];
}

export function AppendicesRenderer({
  plan,
  sectionsToRender,
  onSectionClick,
}: AppendicesRendererProps) {
  // Access store directly - no prop drilling needed
  const disabledSections = useDisabledSectionsSet();
  const isGerman = plan.language === 'de';
  const t = getTranslation(isGerman);

  const pageNumber = calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false, 3);

  if (disabledSections.has(APPENDICES_SECTION_ID)) return null;

  return (
    <div 
      className="export-preview-page export-preview-section cursor-pointer hover:bg-blue-50/30 transition-colors"
      data-section-id={APPENDICES_SECTION_ID}
      onClick={() => onSectionClick?.(APPENDICES_SECTION_ID)}
      style={PAGE_STYLE}
    >
      <div className="export-preview-page-scaler">
        <div className="section-block space-y-4">
          <div className="section-heading border-b border-gray-200/80 pb-3">
            <h2 
              className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSectionClick?.(APPENDICES_SECTION_ID);
              }}
            >
              {t.appendices}
            </h2>
          </div>
          {plan.appendices && plan.appendices.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
              {plan.appendices.map((appendix) => (
                <li key={appendix.id} className="space-y-2">
                  <strong>{appendix.title || <span className="text-gray-400 italic">No title</span>}</strong>
                  <div>{appendix.description || <span className="text-gray-400 italic">No description</span>}</div>
                  {appendix.fileUrl && (
                    <a href={appendix.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                      [Link]
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              {t.noAppendicesYet}
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

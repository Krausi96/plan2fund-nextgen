// List of Tables renderer - extracted from AncillaryRenderer
import React from 'react';
import { 
  type PlanSection, 
  ANCILLARY_SECTION_ID, 
  formatTableLabel,
  PAGE_STYLE,
  getTranslation,
  calculatePageNumber,
  useDisabledSectionsSet,
} from '@/features/editor/lib';
import { type RendererCommonProps } from '../DocumentRenderer';

interface ListOfTablesRendererProps extends Omit<RendererCommonProps, 'disabledSections'> {
  sectionsToRender: PlanSection[];
}

export function ListOfTablesRenderer({
  plan,
  sectionsToRender,
  onSectionClick,
}: ListOfTablesRendererProps) {
  // Access store directly - no prop drilling needed
  const disabledSections = useDisabledSectionsSet();
  const isGerman = plan.language === 'de';
  const t = getTranslation(isGerman);

  const allTables: Array<{
    id: string;
    name: string;
    description?: string;
    source?: string;
    tags?: string[];
    sectionTitle: string;
    sectionNumber: number | null;
  }> = [];
  
  sectionsToRender.forEach((section) => {
    const sectionNumber = section.fields?.sectionNumber ?? null;
    if (section.tables && Object.keys(section.tables).length > 0) {
      Object.keys(section.tables).forEach((tableKey) => {
        const metadata = section.fields?.tableMetadata?.[tableKey] ?? null;
        allTables.push({
          id: metadata?.id || tableKey,
          name: metadata?.name || formatTableLabel(tableKey),
          description: metadata?.description,
          source: metadata?.source,
          tags: metadata?.tags,
          sectionTitle: section.title,
          sectionNumber
        });
      });
    }
  });

  const listOfTablesPageNumber = calculatePageNumber(sectionsToRender.length, plan.settings.includeTitlePage ?? false);
  const manualTables = plan.ancillary?.listOfTables || [];
  const allTableEntries = [
    ...allTables,
    ...manualTables.map(t => ({ 
      id: t.id, 
      name: t.label, 
      description: undefined, 
      source: undefined, 
      tags: undefined,
      sectionTitle: '',
      sectionNumber: null
    }))
  ];

  if (allTableEntries.length === 0) return null;
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
              {t.listOfTables}
            </h2>
          </div>
          <div className="space-y-3">
            {allTableEntries.map((table: any) => (
              <div key={table.id} className="text-sm text-gray-700 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{table.name}</span>
                  {table.sectionTitle && (
                    <span className="text-gray-500 ml-2">
                      — {table.sectionNumber !== null ? `${table.sectionNumber}. ` : ''}{table.sectionTitle}
                    </span>
                  )}
                </div>
                {table.description && <p className="text-xs text-gray-500">{table.description}</p>}
                {table.source && <p className="text-xs text-gray-500">Source: {table.source}</p>}
                {table.tags && table.tags.length > 0 && (
                  <p className="text-[11px] text-gray-400 uppercase">Tags: {table.tags.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        {plan.settings.includePageNumbers && (
          <div className="export-preview-page-footer">
            <span>{t.page} {listOfTablesPageNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

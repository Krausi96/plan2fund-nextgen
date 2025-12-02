import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';

type CurrentSelectionProps = {
  productLabel: string;
  productIcon?: string;
  programLabel: string | null;
  enabledSectionsCount: number;
  totalSectionsCount: number;
  enabledDocumentsCount: number;
  totalDocumentsCount: number;
  sectionTitles: string[];
  documentTitles: string[];
};

export default function CurrentSelection({
  productLabel,
  productIcon,
  programLabel,
  enabledSectionsCount,
  totalSectionsCount,
  enabledDocumentsCount,
  totalDocumentsCount,
  sectionTitles,
  documentTitles
}: CurrentSelectionProps) {
  const { t } = useI18n();
  const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'AKTUELLE AUSWAHL';
  const programLabelCopy = t('editor.desktop.selection.programLabel' as any) || 'PROGRAMM/VORLAGE';
  const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'Kein Programm';
  const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'ABSCHNITTE';
  const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'DOKUMENTE';
  const sectionsPopoverTitle = t('editor.desktop.selection.sectionsPopoverTitle' as any) || 'Selected sections';
  const documentsPopoverTitle = t('editor.desktop.selection.documentsPopoverTitle' as any) || 'Selected documents';
  const selectionEmpty = t('editor.desktop.selection.empty' as any) || 'No selection';

  return (
    <div className="h-full flex flex-col border-r border-white/10 pr-4 overflow-visible">
      <div className="flex-shrink-0 mb-1 border-b border-white/50">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">
          {selectionCurrentLabel}
        </h2>
      </div>
      
      <div className="flex-1 rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-4 py-4 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur overflow-visible min-h-0 flex items-center">
        <div className="w-full flex flex-col gap-3 text-[11px]">
          {/* Product */}
          <div className="flex items-center gap-2 min-w-0">
            {productIcon && (
              <span className="text-base leading-none flex-shrink-0">{productIcon}</span>
            )}
            <span className="truncate text-white font-medium" title={productLabel}>
              {productLabel}
            </span>
          </div>
          
          {/* Program */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white/70 text-[10px] font-bold uppercase tracking flex-shrink-0">{programLabelCopy}:</span>
            <span className="truncate text-white/90 font-medium" title={programLabel || noProgramCopy}>
              {programLabel || noProgramCopy}
            </span>
          </div>
          
          {/* Sections */}
          <div className="flex items-center gap-2 min-w-0 relative group overflow-visible">
            <span className="text-white/70 text-[10px] font-bold uppercase tracking flex-shrink-0">{sectionsLabel}:</span>
            <span className="font-bold text-white">{enabledSectionsCount}/{totalSectionsCount}</span>
            <div className="absolute left-0 top-full mt-2 w-[300px] rounded-lg border border-white/40 bg-slate-950 px-3 py-2.5 text-[10px] font-normal text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[9999] shadow-2xl backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/70 mb-2 font-semibold">{sectionsPopoverTitle}</p>
              <ul className="space-y-1.5 list-disc list-inside text-white/95">
                {sectionTitles.length ? (
                  sectionTitles.map((title, idx) => <li key={idx} className="break-words">{title}</li>)
                ) : (
                  <li className="text-white/60">{selectionEmpty}</li>
                )}
              </ul>
            </div>
          </div>
          
          {/* Documents */}
          <div className="flex items-center gap-2 min-w-0 relative group overflow-visible">
            <span className="text-white/70 text-[10px] font-bold uppercase tracking flex-shrink-0">{documentsLabel}:</span>
            <span className="font-bold text-white">{enabledDocumentsCount}/{totalDocumentsCount}</span>
            <div className="absolute left-0 top-full mt-2 w-[300px] rounded-lg border border-white/40 bg-slate-950 px-3 py-2.5 text-[10px] font-normal text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[9999] shadow-2xl backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/70 mb-2 font-semibold">{documentsPopoverTitle}</p>
              <ul className="space-y-1.5 list-disc list-inside text-white/95">
                {documentTitles.length ? (
                  documentTitles.map((title, idx) => <li key={idx} className="break-words">{title}</li>)
                ) : (
                  <li className="text-white/60">{selectionEmpty}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

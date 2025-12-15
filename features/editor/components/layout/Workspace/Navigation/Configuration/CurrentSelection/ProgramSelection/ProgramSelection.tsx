import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';
import { normalizeProgramInput } from '@/features/editor/lib/hooks/useEditorStore';
import { extractTemplateFromFile } from '@/features/editor/lib/templates';
import type { ProgramSummary, ConnectCopy } from '@/features/editor/lib/types';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { InfoTooltip } from '../RequirementsDisplay/RequirementsDisplay';

type ProgramSelectionProps = {
  programSummary?: ProgramSummary | null;
  programError?: string | null;
  programLoading?: boolean;
  connectCopy?: ConnectCopy;
  onConnectProgram?: (value: string | null) => void;
  onOpenProgramFinder?: () => void;
  onShowTemplatePreview?: (show: boolean) => void;
  onSetExtractedTemplates?: (templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[]; errors?: string[] } | null) => void;
};

/**
 * ProgramSelection component
 * Handles Step 2 of the configurator: Program connection with finder, manual input, and template upload
 */
export default function ProgramSelection({
  programSummary,
  programError,
  programLoading,
  connectCopy,
  onConnectProgram,
  onOpenProgramFinder,
  onShowTemplatePreview,
  onSetExtractedTemplates
}: ProgramSelectionProps) {
  const { t } = useI18n();
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputPosition, setManualInputPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy?.error || 'Invalid input');
      return;
    }
    onConnectProgram?.(normalized);
    setShowManualInput(false);
    // Don't auto-advance - let user manually navigate between steps
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const result = await extractTemplateFromFile(file);
      onSetExtractedTemplates?.(result);
      onShowTemplatePreview?.(true);
    } catch (error) {
      onSetExtractedTemplates?.({
        errors: [error instanceof Error ? error.message : (t('editor.desktop.config.extractError' as any) || 'Failed to extract template')]
      });
      onShowTemplatePreview?.(true);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manual input positioning
  useEffect(() => {
    if (!showManualInput) {
      setManualInputPosition(null);
      return;
    }
    const updatePosition = () => {
      if (manualTriggerRef.current) {
        const rect = manualTriggerRef.current.getBoundingClientRect();
        setManualInputPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: Math.min(rect.width, 420)
        });
      }
    };
    updatePosition();
    
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        manualInputRef.current &&
        !manualInputRef.current.contains(target) &&
        manualTriggerRef.current &&
        !manualTriggerRef.current.contains(target)
      ) {
        setShowManualInput(false);
      }
    };
    const handleResize = () => {
      updatePosition();
    };
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showManualInput]);

  return (
    <div className="mb-4 pb-2">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-white/90 uppercase">
          {t('editor.desktop.config.connectProgram.title' as any) || 'Programm verbinden'}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-600/30 text-yellow-300 rounded uppercase font-semibold">
          {t('editor.desktop.config.step2.optional' as any) || 'Optional'}
        </span>
        <InfoTooltip
          title={t('editor.desktop.config.connectProgram.title' as any) || 'Programm verbinden'}
          content={t('editor.desktop.config.connectProgram.info' as any) || 'Durch das Verbinden eines Förderprogramms werden automatisch die spezifischen Anforderungen, Abschnitte und Dokumente für dieses Programm geladen. Der ProgramFinder hilft Ihnen, passende Programme basierend auf Ihren Antworten zu finden. Alternativ können Sie einen direkten Programm-Link (z.B. von AWS, FFG oder EU-Ausschreibungen) einfügen oder eine vorhandene Vorlage hochladen, um Abschnitte und Dokumente zu extrahieren.'}
        />
      </div>
      
      {/* Optional Step Message */}
      {!programSummary && (
        <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-2.5 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-300 text-sm flex-shrink-0">ℹ️</span>
            <p className="text-xs text-white/90 leading-relaxed">
              {t('editor.desktop.config.step2.optionalInfo' as any) || 'Program connection is optional. You can proceed to Step 3 to edit sections/documents now, or connect a program to add program-specific content.'}
            </p>
          </div>
        </div>
      )}
      {programSummary ? (
        <div className="w-full rounded-lg border border-blue-300 bg-blue-100/60 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-blue-900 leading-tight">{programSummary.name}</p>
              {programSummary.amountRange && (
                <p className="text-sm text-blue-800 mt-1">{programSummary.amountRange}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-800 hover:text-blue-900 text-xs h-6 px-1.5 flex-shrink-0"
              onClick={() => {
                onConnectProgram?.(null);
              }}
            >
              ×
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-row gap-2 relative flex-wrap">
          <button
            onClick={onOpenProgramFinder}
            className="inline-flex items-center justify-center px-4 py-2.5 h-auto bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex-1 min-w-0"
          >
            {connectCopy?.openFinder}
          </button>
          <button
            ref={manualTriggerRef}
            aria-expanded={showManualInput}
            aria-controls="manual-program-connect"
            onClick={() => setShowManualInput((prev) => !prev)}
            className="inline-flex items-center justify-center px-4 py-2.5 h-auto border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-sm flex-1 min-w-0"
          >
            {connectCopy?.pasteLink}
          </button>
          <div className="w-full flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center px-4 py-2.5 h-auto border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-sm flex-1 min-w-0"
            >
              {isExtracting
                ? (t('editor.desktop.config.uploading' as any) || 'Verarbeitung...')
                : (t('editor.desktop.config.uploadTemplate' as any) || 'Template hochladen')}
            </button>
            <InfoTooltip
              title={t('editor.desktop.config.templateUpload.title' as any) || 'Template hochladen'}
              content={t('editor.desktop.config.templateUpload.info' as any) || 'Sie können eine Text-, Markdown- oder PDF-Datei hochladen. Das System analysiert die Datei automatisch und extrahiert Abschnitte und Dokumente basierend auf Überschriften, Struktur und Formatierung. Die extrahierten Elemente werden in einer Vorschau angezeigt, bevor sie zu Ihrem Plan hinzugefügt werden. Sie können die Vorschau überprüfen und nur die gewünschten Elemente auswählen.'}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf"
            onChange={handleTemplateUpload}
            className="hidden"
          />

          {showManualInput && typeof window !== 'undefined' && manualInputPosition && createPortal(
            <div
              id="manual-program-connect"
              ref={manualInputRef}
              className={`fixed rounded-2xl border border-blue-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200 z-[10002] pointer-events-auto opacity-100 translate-y-0`}
              style={{
                top: `${manualInputPosition.top}px`,
                left: `${manualInputPosition.left}px`,
                width: `${manualInputPosition.width}px`
              }}
            >
              <div className="space-y-1 text-white">
                <label className="text-[10px] font-semibold text-white/70 block">
                  {connectCopy?.inputLabel}
                </label>
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <input
                    value={manualValue}
                    onChange={(event) => setManualValue(event.target.value)}
                    placeholder={connectCopy?.placeholder}
                    className="flex-1 rounded border border-white/30 bg-white/10 px-3 py-2 h-10 text-sm text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="sm:w-auto text-xs h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={handleManualConnect}
                    disabled={programLoading}
                  >
                    {programLoading ? '...' : connectCopy?.submit}
                  </Button>
                </div>
                <p className="text-[10px] text-white/60">{connectCopy?.example}</p>
                {(manualError || programError) && (
                  <p className="text-[10px] text-red-400">{manualError || programError}</p>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}


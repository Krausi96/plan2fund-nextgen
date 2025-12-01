import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { normalizeProgramInput } from '@/features/editor/hooks/useEditorStore';
import { extractTemplateFromFile } from '@/features/editor/templates/api';
import type { ConnectCopy } from './Desktop';
import type { ProductType, ProgramSummary } from '@/features/editor/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { useI18n } from '@/shared/contexts/I18nContext';

type DesktopConfiguratorProps = {
  productType: ProductType;
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  selectedProductMeta: { value: ProductType; label: string; description: string; icon?: string } | null;
  connectCopy: ConnectCopy;
  programSummary: ProgramSummary | null;
  programError: string | null;
  programLoading: boolean;
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  onTemplatesExtracted: (templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[] }) => void;
  configView: 'plan' | 'program';
  onConfigViewChange: (view: 'plan' | 'program') => void;
};

export function DesktopConfigurator({
  productType,
  productOptions,
  selectedProductMeta,
  connectCopy,
  programSummary,
  programError,
  programLoading,
  onChangeProduct,
  onConnectProgram,
  onOpenProgramFinder,
  onTemplatesExtracted,
  configView,
  onConfigViewChange
}: DesktopConfiguratorProps) {
  const { t } = useI18n();
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [productMenuPosition, setProductMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [extractedTemplates, setExtractedTemplates] = useState<{ sections?: SectionTemplate[]; documents?: DocumentTemplate[]; errors?: string[] } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);
  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const productTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleSelectProduct = (product: ProductType) => {
    onChangeProduct(product);
    setShowProductMenu(false);
    setProductMenuPosition(null);
  };

  const handleToggleProductMenu = () => {
    if (!showProductMenu && productTriggerRef.current) {
      const rect = productTriggerRef.current.getBoundingClientRect();
      setProductMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setShowProductMenu((prev) => !prev);
  };

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy.error);
      return;
    }
    onConnectProgram(normalized);
    setShowManualInput(false);
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const result = await extractTemplateFromFile(file);
      setExtractedTemplates(result);
      setShowTemplatePreview(true);
    } catch (error) {
      setExtractedTemplates({
        errors: [error instanceof Error ? error.message : (t('editor.desktop.config.extractError' as any) || 'Failed to extract template')]
      });
      setShowTemplatePreview(true);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const applyExtractedTemplates = () => {
    if (!extractedTemplates) return;
    onTemplatesExtracted({
      sections: extractedTemplates.sections,
      documents: extractedTemplates.documents
    });
    setShowTemplatePreview(false);
    setExtractedTemplates(null);
  };

  useEffect(() => {
    if (!showProductMenu) {
      setProductMenuPosition(null);
      return;
    }
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(target) &&
        productTriggerRef.current &&
        !productTriggerRef.current.contains(target)
      ) {
        setShowProductMenu(false);
        setProductMenuPosition(null);
      }
    };
    const handleResize = () => {
      if (productTriggerRef.current) {
        const rect = productTriggerRef.current.getBoundingClientRect();
        setProductMenuPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showProductMenu]);

  useEffect(() => {
    if (!showManualInput) return;
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
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showManualInput]);

  const selectedMeta = selectedProductMeta ?? productOptions.find((option) => option.value === productType) ?? productOptions[0] ?? null;

  return (
      <div className="flex flex-col gap-4 w-full max-w-full overflow-y-auto min-h-0">
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/50">
          <h2 className="text-xl font-bold uppercase tracking-wide text-white">
            {t('editor.desktop.config.title' as any) || 'Deine Konfiguration'}
          </h2>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-2">
        <div className="flex items-center gap-2 mb-4 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => onConfigViewChange('plan')}
            className={`flex-1 px-4 py-2 rounded text-sm font-semibold transition-colors ${
              configView === 'plan'
                ? 'bg-blue-600 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {t('editor.desktop.config.planTab' as any) || 'Plan auswählen'}
          </button>
          <button
            onClick={() => onConfigViewChange('program')}
            className={`flex-1 px-4 py-2 rounded text-sm font-semibold transition-colors ${
              configView === 'program'
                ? 'bg-blue-600 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {t('editor.desktop.config.programTab' as any) || 'Programm verbinden'}
          </button>
        </div>

        {configView === 'plan' && (
          <div className="relative">
            <button
              ref={productTriggerRef}
              type="button"
              onClick={handleToggleProductMenu}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/25 bg-gradient-to-br from-white/15 via-white/5 to-transparent px-6 py-4 text-left transition-all hover:border-white/60 focus-visible:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/60 shadow-xl min-h-[120px]"
            >
              <span className="flex min-w-0 flex-col gap-2 flex-1">
                <span className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl leading-none text-white shadow-inner shadow-blue-900/40 flex-shrink-0">
                    {selectedMeta?.icon ?? '📄'}
                  </span>
                  <span className="text-lg font-semibold leading-tight text-white">{selectedMeta?.label}</span>
                  <span className="flex items-center text-xl font-bold flex-shrink-0 text-white/70">▾</span>
                </span>
                {selectedMeta?.description && (
                  <span className="text-sm font-normal text-white/70 leading-relaxed">
                    {selectedMeta.description}
                  </span>
                )}
              </span>
            </button>
            {showProductMenu && productMenuPosition && typeof window !== 'undefined' && createPortal(
              <div
                ref={productMenuRef}
                className="fixed z-[9999] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
                style={{
                  top: `${productMenuPosition.top}px`,
                  left: `${productMenuPosition.left}px`,
                  width: `${productMenuPosition.width}px`
                }}
              >
                <ul className="flex flex-col gap-1">
                  {productOptions.map((option) => {
                    const isActive = option.value === productType;
                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(option.value)}
                          className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-blue-600/40 text-white'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="text-2xl leading-none">{option.icon ?? '📄'}</span>
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold">{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-white/70 leading-snug">
                                {option.description}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>,
              document.body
            )}
          </div>
        )}

        {configView === 'program' && (
          <div>
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
                    onClick={() => onConnectProgram(null)}
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
                  {connectCopy.openFinder}
                </button>
                <button
                  ref={manualTriggerRef}
                  aria-expanded={showManualInput}
                  aria-controls="manual-program-connect"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="inline-flex items-center justify-center px-4 py-2.5 h-auto border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-sm flex-1 min-w-0"
                >
                  {connectCopy.pasteLink}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center px-4 py-2.5 h-auto border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-sm flex-1 min-w-0"
                >
                  {isExtracting
                    ? (t('editor.desktop.config.uploading' as any) || 'Verarbeitung...')
                    : (t('editor.desktop.config.uploadTemplate' as any) || 'Template hochladen')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf"
                  onChange={handleTemplateUpload}
                  className="hidden"
                />

                <div
                  id="manual-program-connect"
                  ref={manualInputRef}
                  className={`absolute left-0 top-[calc(100%+0.75rem)] w-full max-w-[420px] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200 z-50 ${
                    showManualInput
                      ? 'pointer-events-auto opacity-100 translate-y-0'
                      : 'pointer-events-none opacity-0 -translate-y-2'
                  }`}
                >
                  <div className="space-y-1 text-white">
                    <label className="text-[10px] font-semibold text-white/70 block">
                      {connectCopy.inputLabel}
                    </label>
                    <div className="flex flex-col gap-1.5 sm:flex-row">
                      <input
                        value={manualValue}
                        onChange={(event) => setManualValue(event.target.value)}
                        placeholder={connectCopy.placeholder}
                        className="flex-1 rounded border border-white/30 bg-white/10 px-3 py-2 h-10 text-sm text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="sm:w-auto text-xs h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white"
                        onClick={handleManualConnect}
                        disabled={programLoading}
                      >
                        {programLoading ? '...' : connectCopy.submit}
                      </Button>
                    </div>
                    <p className="text-[10px] text-white/60">{connectCopy.example}</p>
                    {(manualError || programError) && (
                      <p className="text-[10px] text-red-400">{manualError || programError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Description - Below selector card */}
      <div className="mt-3 p-3 rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-blue-900/20 to-transparent backdrop-blur-sm flex-shrink-0">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-base leading-none flex-shrink-0 mt-0.5">ℹ️</span>
          <div className="flex-1 text-[10px] text-white/80 leading-relaxed">
            {(() => {
              // Get translation with fallback
              let descriptionText: string;
              try {
                descriptionText = t('editor.desktop.config.description' as any);
                // If translation returns the key itself (meaning it wasn't found), use fallback
                if (!descriptionText || descriptionText === 'editor.desktop.config.description') {
                  descriptionText = 'Plan-Typ: Wähle Strategy, Review oder Submission → System lädt Basis-Abschnitte (z.B. Executive Summary, Financial Plan, Project Description)\n\nProgramm: Verbinde Förderprogramm (AWS, FFG, EU) → System fügt programmspezifische Abschnitte & Dokumente hinzu\n\nTemplate: Lade PDF/TXT/MD hoch → System extrahiert Abschnitte/Dokumente als benutzerdefinierte Vorlage\n\nSo funktioniert\'s:\n• Option 1: Nur Plan-Typ → Sie erhalten die Basis-Struktur\n• Option 2: Plan-Typ + Programm → Basis-Struktur wird mit programmspezifischen Anforderungen ergänzt\n• Optional: Zusätzlich eigene Vorlage hochladen';
                }
              } catch (error) {
                console.warn('Translation error:', error);
                descriptionText = 'Plan-Typ: Wähle Strategy, Review oder Submission → System lädt Basis-Abschnitte (z.B. Executive Summary, Financial Plan, Project Description)\n\nProgramm: Verbinde Förderprogramm (AWS, FFG, EU) → System fügt programmspezifische Abschnitte & Dokumente hinzu\n\nTemplate: Lade PDF/TXT/MD hoch → System extrahiert Abschnitte/Dokumente als benutzerdefinierte Vorlage\n\nSo funktioniert\'s:\n• Option 1: Nur Plan-Typ → Sie erhalten die Basis-Struktur\n• Option 2: Plan-Typ + Programm → Basis-Struktur wird mit programmspezifischen Anforderungen ergänzt\n• Optional: Zusätzlich eigene Vorlage hochladen';
              }
              const description = typeof descriptionText === 'string' ? descriptionText : String(descriptionText || '');
              return description.split('\n').map((line: string, idx: number) => {
                const trimmed = line.trim();
                
                // Empty lines - add spacing
                if (!trimmed) {
                  return <div key={idx} className="h-1.5" />;
                }
                
                // Format bullet points
                if (trimmed.startsWith('•')) {
                  return (
                    <div key={idx} className="pl-3 mt-0.5 text-white/90">
                      {trimmed}
                    </div>
                  );
                }
                
                // Format "So funktioniert's:" / "How it works:" header
                if (trimmed.includes('funktioniert') || trimmed.includes('How it works')) {
                  return (
                    <div key={idx} className="font-semibold mt-2 mb-0.5 text-white">
                      {trimmed}
                    </div>
                  );
                }
                
                // Format section headers (lines with →)
                if (trimmed.includes('→')) {
                  return (
                    <div key={idx} className="font-semibold mt-1 first:mt-0 text-white/95">
                      {trimmed}
                    </div>
                  );
                }
                
                // Regular lines
                return (
                  <div key={idx} className="mt-0.5">
                    {trimmed}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editor.desktop.config.previewTitle' as any) || 'Template-Vorschau'}</DialogTitle>
            <DialogDescription>
              {t('editor.desktop.config.previewDescription' as any) || 'Überprüfen Sie die extrahierten Abschnitte und Dokumente vor dem Hinzufügen.'}
            </DialogDescription>
          </DialogHeader>

          {extractedTemplates?.errors && extractedTemplates.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                {t('editor.desktop.config.preview.errors' as any) || 'Fehler:'}
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {extractedTemplates.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {extractedTemplates?.sections && extractedTemplates.sections.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">
                {(t('editor.desktop.config.preview.sectionsLabel' as any) || 'Abschnitte')} ({extractedTemplates.sections.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {extractedTemplates.sections.map((section) => (
                  <div key={section.id} className="border rounded-lg p-2 bg-gray-50">
                    <p className="text-sm font-medium">{section.title}</p>
                    {section.description && (
                      <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-xs text-gray-500">
                      {section.required && (
                        <span className="bg-amber-100 text-amber-800 px-1 rounded">
                          {t('editor.desktop.config.preview.required' as any) || 'Erforderlich'}
                        </span>
                      )}
                      {section.wordCountMin > 0 && (
                        <span>
                          {section.wordCountMin}-{section.wordCountMax || '∞'} {t('editor.desktop.config.preview.words' as any) || 'Wörter'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractedTemplates?.documents && extractedTemplates.documents.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">
                {(t('editor.desktop.config.preview.documentsLabel' as any) || 'Dokumente')} ({extractedTemplates.documents.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {extractedTemplates.documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-2 bg-gray-50">
                    <p className="text-sm font-medium">{doc.name}</p>
                    {doc.description && (
                      <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-xs text-gray-500">
                      {doc.required && (
                        <span className="bg-amber-100 text-amber-800 px-1 rounded">
                          {t('editor.desktop.config.preview.required' as any) || 'Erforderlich'}
                        </span>
                      )}
                      <span>{doc.format.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
              {t('editor.desktop.config.preview.cancel' as any) || 'Abbrechen'}
            </Button>
            {extractedTemplates && (extractedTemplates.sections?.length || extractedTemplates.documents?.length) && (
              <Button onClick={applyExtractedTemplates}>
                {t('editor.desktop.config.preview.add' as any) || 'Hinzufügen'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

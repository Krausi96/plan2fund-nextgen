import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import SectionsDocumentsManagement from './SectionsDocumentsManagement/SectionsDocumentsManagement';
import { useConfiguratorState, useEditorActions, useEditorStore, useSectionsAndDocumentsCounts } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type CurrentSelectionProps = {
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * CurrentSelection component
 * Main configurator component that orchestrates ProductSelection, ProgramSelection, and SectionsDocumentsManagement
 * Shows as collapsed summary by default, expands to overlay when clicked
 */
function CurrentSelection({ overlayContainerRef }: CurrentSelectionProps) {
  const { t } = useI18n();
  const { selectedProductMeta, programSummary } = useConfiguratorState();
  const { enabledSectionsCount, totalSectionsCount, enabledDocumentsCount, totalDocumentsCount } = useSectionsAndDocumentsCounts();
  const isConfiguratorOpen = useEditorStore((state) => state.isConfiguratorOpen);
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayPosition, setOverlayPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Initialize active step when configurator opens
  useEffect(() => {
    if (isConfiguratorOpen) {
      // Intelligently determine which step to show based on current state:
      // - No product → Step 1 (Product Selection)
      // - Product but no program → Step 2 (Program Selection)
      // - Product and program → Step 3 (Sections & Documents)
      let initialStep: 1 | 2 | 3 = 1;
      if (selectedProductMeta) {
        if (programSummary) {
          initialStep = 3; // Product and program selected → show sections/documents
        } else {
          initialStep = 2; // Product selected but no program → show program selection
        }
      }
      setActiveStep(initialStep);
    }
  }, [isConfiguratorOpen, selectedProductMeta, programSummary]);

  // Calculate overlay position - rectangle covering CurrentSelection, DocumentsBar, and top of Sidebar
  useEffect(() => {
    if (!isConfiguratorOpen || !containerRef.current || !overlayContainerRef?.current) {
      setOverlayPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current || !overlayContainerRef?.current) return;
      
      const gridRect = overlayContainerRef.current.getBoundingClientRect();
      
      // Overlay covers:
      // - All of CurrentSelection (Row 1, Col 1) - 320px wide
      // - All of DocumentsBar (Row 1, Col 2) - remaining width
      // - Top portion of Sidebar (Row 2, Col 1) - same width as CurrentSelection, extends down
      
      // Start from top-left of grid (where CurrentSelection starts)
      const top = gridRect.top;
      const left = gridRect.left;
      
      // Width: covers CurrentSelection (320px) + DocumentsBar (remaining width) = full grid width
      const width = gridRect.width;
      
      // Height: Use a fixed height range for the overlay
      const minOverlayHeight = 600;
      const maxOverlayHeight = 800;
      const preferredHeight = gridRect.height * 0.8;
      const height = Math.max(minOverlayHeight, Math.min(maxOverlayHeight, preferredHeight));
      
      setOverlayPosition({
        top,
        left,
        width,
        height
      });
    };

    const timeoutId = setTimeout(updatePosition, 10);
    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isConfiguratorOpen, overlayContainerRef]);

  // Summary view (collapsed)
  const SummaryView = () => {
    const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'AKTUELLE AUSWAHL';
    const planLabelCopy = 'PLAN';
    const programLabelCopy = t('editor.desktop.selection.programLabel' as any) || 'PROGRAMM/VORLAGE';
    const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'Kein Programm';
    const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'Nicht ausgewählt';
    const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'ABSCHNITTE';
    const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'DOKUMENTE';
    const startButtonLabel = t('editor.desktop.selection.start' as any) || 'Starten';
    const editButtonLabel = t('editor.desktop.selection.edit' as any) || 'Bearbeiten';
    
    const hasMadeSelections = !!selectedProductMeta;
    
    return (
      <div className="rounded-lg border border-white/20 bg-white/5">
        {/* Header with title and action button */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h3 className="text-xs font-bold text-white uppercase">
            {selectionCurrentLabel}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
          >
            {hasMadeSelections ? (
              <>
                <span>{editButtonLabel}</span>
              </>
            ) : (
              <>
                <span className="text-white">→</span>
                <span>{startButtonLabel}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Summary card */}
        <div 
          onClick={handleToggle}
          className="cursor-pointer p-3"
        >
          <div className="mb-2">
            <div className="text-[10px] font-normal text-white/60 uppercase mb-1">
              {planLabelCopy}
            </div>
            <div className="text-sm text-white font-normal">
              {selectedProductMeta?.label || noSelectionCopy}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[10px] font-normal text-white/60 uppercase mb-1">
              {programLabelCopy}
            </div>
            <div className="text-sm text-white font-normal">
              {programSummary?.name || noProgramCopy}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-normal text-white/60 uppercase">
                {sectionsLabel}
              </div>
              <div className="text-base font-bold text-white">
                {enabledSectionsCount}/{totalSectionsCount}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-normal text-white/60 uppercase">
                {documentsLabel}
              </div>
              <div className="text-base font-bold text-white">
                {enabledDocumentsCount}/{totalDocumentsCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Full overlay view (expanded)
  const OverlayView = () => {
    const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'AKTUELLE AUSWAHL';
    const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'Kein Programm';
    const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'Nicht ausgewählt';
    
    return (
      typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-in-out"
            style={{
              opacity: overlayPosition ? 1 : 0,
              pointerEvents: overlayPosition ? 'auto' : 'none'
            }}
            onClick={handleToggle}
          />
          
          {/* Overlay Rectangle - positioned over grid */}
          <div 
            className="fixed rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 shadow-[0_20px_50px_rgba(6,10,24,0.8)] z-[10001] overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              top: overlayPosition ? `${overlayPosition.top}px` : '0px',
              left: overlayPosition ? `${overlayPosition.left}px` : '0px',
              width: overlayPosition ? `${overlayPosition.width}px` : '0px',
              height: overlayPosition ? `${overlayPosition.height}px` : '0px',
              pointerEvents: overlayPosition ? 'auto' : 'none',
              transform: overlayPosition ? 'scale(1)' : 'scale(0.95)',
              opacity: overlayPosition ? 1 : 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col bg-slate-950/95">
              {/* Sticky Header with "Deine Konfiguration" and "Aktuelle Auswahl" */}
              <div className="sticky top-0 z-[10002] flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/30 bg-slate-950/95 backdrop-blur-sm">
                <h3 className="text-lg font-bold uppercase tracking-wide text-white flex-shrink-0">
                  {t('editor.desktop.config.title' as any) || 'DEINE KONFIGURATION'}
                </h3>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end mr-3">
                  <span className="text-xs text-white/70 uppercase whitespace-nowrap">
                    {selectionCurrentLabel}:
                  </span>
                  <span className="text-xs text-white/90">
                    {selectedProductMeta?.label || noSelectionCopy}
                  </span>
                  <span className="text-xs text-white/60">|</span>
                  <span className="text-xs text-white/90">
                    {programSummary?.name || noProgramCopy}
                  </span>
                  <span className="text-xs text-white/60">|</span>
                  <span className="text-xs text-white/90">
                    {enabledSectionsCount}/{totalSectionsCount}
                  </span>
                  <span className="text-xs text-white/60">|</span>
                  <span className="text-xs text-white/90">
                    {enabledDocumentsCount}/{totalDocumentsCount}
                  </span>
                </div>
                <button
                  onClick={handleToggle}
                  className="text-white/60 hover:text-white text-2xl leading-none flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
                {/* 3-Step Guide Section - Clickable Navigation */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white/90 uppercase mb-4">
                    {t('editor.desktop.config.howItWorks.title' as any) || 'SO FUNKTIONIERT DIE KONFIGURATION'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Step 1 - Clickable */}
                    <button
                      onClick={() => setActiveStep(1)}
                      className={`relative p-4 rounded-lg border transition-colors text-left ${
                        activeStep === 1 
                          ? 'border-blue-400/50 bg-blue-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${
                          activeStep === 1 ? 'text-blue-300' : selectedProductMeta ? 'text-green-400' : 'text-white/60'
                        }`}>1</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 1 ? 'text-white/90' : 'text-white/70'
                        }`}>
                          {t('editor.desktop.config.step1.title' as any) || 'PRODUKT AUSWÄHLEN'}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                          {t('editor.desktop.config.step1.badge' as any) || 'ERFORDERLICH'}
                        </span>
                        {activeStep === 1 && (
                          <span className="ml-auto text-xs text-blue-300">●</span>
                        )}
                        {selectedProductMeta && activeStep !== 1 && (
                          <span className="ml-auto text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        activeStep === 1 ? 'text-white/70' : 'text-white/60'
                      }`}>
                        {t('editor.desktop.config.step1.description' as any) || 'Wählen Sie den Typ Ihres Business Plans (Submission, Review oder Strategy). Jeder Typ hat spezifische Vorlagen und optimierte Abschnitte.'}
                      </p>
                    </button>
                    
                    {/* Step 2 - Clickable */}
                    <button
                      onClick={() => setActiveStep(2)}
                      className={`relative p-4 rounded-lg border transition-colors text-left ${
                        activeStep === 2 
                          ? 'border-blue-400/50 bg-blue-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${
                          activeStep === 2 ? 'text-blue-300' : programSummary ? 'text-green-400' : 'text-white/60'
                        }`}>2</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 2 ? 'text-white/90' : 'text-white/70'
                        }`}>
                          {t('editor.desktop.config.step2.title' as any) || 'PROGRAMM AUSWÄHLEN'}
                        </span>
                        <span className="px-2 py-0.5 bg-yellow-600 text-white text-[10px] font-bold rounded">
                          {t('editor.desktop.config.step2.badge' as any) || 'OPTIONAL'}
                        </span>
                        {activeStep === 2 && (
                          <span className="ml-auto text-xs text-blue-300">●</span>
                        )}
                        {programSummary && activeStep !== 2 && (
                          <span className="ml-auto text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        activeStep === 2 ? 'text-white/70' : 'text-white/60'
                      }`}>
                        {t('editor.desktop.config.step2.description' as any) || 'Verbinden Sie ein Förderprogramm, um automatisch Anforderungen, Abschnitte und Dokumente zu laden. Optional, aber empfohlen.'}
                      </p>
                    </button>
                    
                    {/* Step 3 - Clickable */}
                    <button
                      onClick={() => setActiveStep(3)}
                      className={`relative p-4 rounded-lg border transition-colors text-left ${
                        activeStep === 3 
                          ? 'border-blue-400/50 bg-blue-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${
                          activeStep === 3 ? 'text-blue-300' : selectedProductMeta ? 'text-green-400' : 'text-white/60'
                        }`}>3</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 3 ? 'text-white/90' : 'text-white/70'
                        }`}>
                          {t('editor.desktop.config.step3.title' as any) || 'ABSCHNITTE & DOKUMENTE'}
                        </span>
                        {activeStep === 3 && (
                          <span className="ml-auto text-xs text-blue-300">●</span>
                        )}
                        {selectedProductMeta && activeStep !== 3 && (
                          <span className="ml-auto text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        activeStep === 3 ? 'text-white/70' : 'text-white/60'
                      }`}>
                        {t('editor.desktop.config.step3.description' as any) || 'Abschnitte und Dokumente werden automatisch basierend auf Ihrem Plan-Typ und verbundenem Programm generiert. Sie können sie anpassen.'}
                      </p>
                    </button>
                  </div>
                </div>
                
                {/* Configurator Content - Show based on active step */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-visible">
                  {/* Step 1: Product Selection */}
                  {activeStep === 1 && (
                    <ProductSelection />
                  )}

                  {/* Step 2: Program Selection */}
                  {activeStep === 2 && (
                    <ProgramSelection
                      onOpenProgramFinder={() => {
                        // Program finder logic would go here
                        console.log('Open program finder');
                      }}
                    />
                  )}

                  {/* Step 3: Sections & Documents Management */}
                  {activeStep === 3 && (
                    <SectionsDocumentsManagement />
                  )}
                </div>
              </div>
              
              {/* Sticky Footer with Action Buttons */}
              <div className="flex-shrink-0 border-t border-white/10 p-4 bg-slate-800/50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleToggle}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                  >
                    {t('editor.desktop.config.cancel' as any) || 'Abbrechen'}
                  </button>
                  <button
                    onClick={() => {
                      // Close overlay and proceed
                      handleToggle();
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    {t('editor.desktop.config.confirmSelection' as any) || 'Auswahl bestätigen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )
    );
  };

  return (
    <div ref={containerRef}>
      <SummaryView />
      {isConfiguratorOpen && <OverlayView />}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);

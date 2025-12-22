import React, { useEffect, useState } from 'react';
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

  const [overlayPosition, setOverlayPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Shared translations - fetched once instead of in each view
  const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'Current selection';
  const planLabelCopy = t('editor.desktop.selection.productLabel' as any) || 'Plan';
  const programLabelCopy = t('editor.desktop.selection.programLabel' as any) || 'Program / Template';
  const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'No program';
  const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'No selection';
  const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'Sections';
  const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'Documents';
  const startButtonLabel = t('editor.desktop.selection.start' as any) || 'Start';
  const editButtonLabel = t('editor.desktop.selection.edit' as any) || 'Edit';

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

  // Prevent body scrolling when overlay is open
  useEffect(() => {
    if (isConfiguratorOpen) {
      // Store original overflow value to restore later
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original overflow when overlay closes
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isConfiguratorOpen]);

  // Calculate overlay position - rectangle covering CurrentSelection, DocumentsBar, and top of Sidebar
  useEffect(() => {
    if (!isConfiguratorOpen || !overlayContainerRef?.current) {
      setOverlayPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!overlayContainerRef?.current) return;
      
      const gridRect = overlayContainerRef.current.getBoundingClientRect();
      
      // Calculate overlay dimensions with viewport constraints
      const SPACING = 20;
      const MIN_HEIGHT = 400;
      const MAX_HEIGHT = Math.min(window.innerHeight * 0.9, 900);
      
      // Position with minimum spacing from viewport edges
      const top = Math.max(gridRect.top, SPACING);
      const left = Math.max(gridRect.left, SPACING);
      
      // Width and height constrained to viewport
      const width = Math.min(gridRect.width, window.innerWidth - SPACING * 2);
      const preferredHeight = Math.min(gridRect.height * 1.2, MAX_HEIGHT);
      const height = Math.max(
        MIN_HEIGHT,
        Math.min(preferredHeight, window.innerHeight - top - SPACING)
      );
      
      // Final position ensuring overlay stays within viewport
      const finalTop = Math.max(SPACING, Math.min(top, window.innerHeight - height - SPACING));
      const finalLeft = Math.max(SPACING, Math.min(left, window.innerWidth - width - SPACING));
      
      setOverlayPosition({
        top: finalTop,
        left: finalLeft,
        width,
        height
      });
    };

    const timeoutId = setTimeout(updatePosition, 10);
    updatePosition();
    
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isConfiguratorOpen, overlayContainerRef]);

  // Summary view (collapsed)
  const SummaryView = () => {
    const hasMadeSelections = !!selectedProductMeta;
    
    return (
      <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-4 py-4 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur w-full" style={{ minHeight: 'fit-content', maxHeight: '190px' }}>
        {/* Header with title and action button */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
          <h3 className="text-base font-bold uppercase tracking-wide text-white flex-1">
            {selectionCurrentLabel}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
              hasMadeSelections
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {hasMadeSelections ? (
              <>
                <span className="text-sm">⚙️</span>
                <span>{editButtonLabel}</span>
              </>
            ) : (
              <>
                <span className="text-sm">✏️</span>
                <span>{startButtonLabel}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Summary card - 2 columns layout */}
        <div 
          onClick={handleToggle}
          className="cursor-pointer"
        >
          <div className="grid grid-cols-2 gap-3 text-xs mb-2">
            {/* Left Column: Product */}
            <div className="flex items-center gap-1.5 min-w-0">
              {selectedProductMeta?.icon && (
                <span className="text-sm leading-none flex-shrink-0">{selectedProductMeta.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-0.5">
                  {planLabelCopy}
                </div>
                <div className="text-white font-semibold text-[10px] block leading-snug truncate" title={selectedProductMeta?.label || noSelectionCopy}>
                  {selectedProductMeta ? t(selectedProductMeta.label as any) || selectedProductMeta.label || noSelectionCopy : noSelectionCopy}
                </div>
              </div>
            </div>

            {/* Right Column: Program */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-0.5">
                  {programLabelCopy}
                </div>
                <div className="text-white/90 font-medium text-[10px] block leading-snug truncate" title={programSummary?.name || noProgramCopy}>
                  {programSummary?.name || noProgramCopy}
                </div>
              </div>
            </div>
          </div>

          {/* Sections & Documents - Below both columns */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/50">
            <div className="flex flex-col">
              <div className="text-white/60 text-[9px] font-semibold uppercase tracking-wide leading-tight mb-0.5">
                {sectionsLabel}
              </div>
              <div className="font-bold text-white text-xs">
                {enabledSectionsCount}/{totalSectionsCount}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-white/60 text-[9px] font-semibold uppercase tracking-wide leading-tight mb-0.5">
                {documentsLabel}
              </div>
              <div className="font-bold text-white text-xs">
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
            className="fixed rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 shadow-[0_20px_50px_rgba(6,10,24,0.8)] z-[10001] transition-all duration-300 ease-in-out"
            style={{
              top: overlayPosition ? `${overlayPosition.top}px` : '0px',
              left: overlayPosition ? `${overlayPosition.left}px` : '0px',
              width: overlayPosition ? `${overlayPosition.width}px` : '0px',
              height: overlayPosition ? `${overlayPosition.height}px` : '0px',
              pointerEvents: overlayPosition ? 'auto' : 'none',
              transform: overlayPosition ? 'scale(1)' : 'scale(0.95)',
              opacity: overlayPosition ? 1 : 0,
              maxHeight: 'calc(100vh + 140px)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col bg-slate-950/95" style={{ boxSizing: 'border-box' }}>
              {/* Fixed Header with "Deine Konfiguration" and "Aktuelle Auswahl" */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/30 bg-slate-950/95 backdrop-blur-sm">
                <h3 className="text-lg font-bold uppercase tracking-wide text-white flex-shrink-0">
                  {t('editor.desktop.config.title' as any) || 'DEINE KONFIGURATION'}
                </h3>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end mr-3">
                  <span className="text-xs text-white/70 uppercase whitespace-nowrap">
                    {selectionCurrentLabel}:
                  </span>
                  <span className="text-xs text-white/90 truncate max-w-[160px]" title={selectedProductMeta?.label || noSelectionCopy}>
                    {selectedProductMeta ? t(selectedProductMeta.label as any) || selectedProductMeta.label || noSelectionCopy : noSelectionCopy}
                  </span>
                  <span className="text-xs text-white/60">|</span>
                  <span className="text-xs text-white/90 truncate max-w-[160px]" title={programSummary?.name || noProgramCopy}>
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
                  aria-label={t('editor.desktop.config.close' as any) || 'Close'}
                >
                  ×
                </button>
              </div>
              
              {/* Content - Scrollable container */}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 bg-slate-950/95" style={{ minHeight: 0 }}>
                {/* 3-Step Guide Section - Clickable Navigation */}
                <div className="mb-4 pb-4 border-b border-white/10">
                  <h3 className="text-xs font-bold text-white/90 uppercase mb-3">
                    {t('editor.desktop.config.howItWorks.title' as any) || 'HOW CONFIGURATION WORKS'}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Step 1 - Clickable */}
                    <button
                      onClick={() => setActiveStep(1)}
                      className={`relative p-3 rounded-lg border transition-colors text-left ${
                        activeStep === 1 
                          ? 'border-blue-400/50 bg-blue-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${
                          activeStep === 1 ? 'text-blue-300' : selectedProductMeta ? 'text-green-400' : 'text-white/60'
                        }`}>1</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 1 ? 'text-white/90' : 'text-white/70'
                        }`}>
                          {t('editor.desktop.config.step1.title' as any) || 'SELECT PRODUCT'}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                          {t('editor.desktop.config.step1.badge' as any) || 'REQUIRED'}
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
                        {t('editor.desktop.config.step1.description' as any) || 'Select your business plan type (Submission, Review, or Strategy). Each type has specific templates and optimized sections.'}
                      </p>
                    </button>
                                  
                    {/* Step 2 - Clickable */}
                    <button
                      onClick={() => setActiveStep(2)}
                      className={`relative p-3 rounded-lg border transition-colors text-left ${
                        activeStep === 2 
                          ? 'border-blue-400/50 bg-blue-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${
                          activeStep === 2 ? 'text-blue-300' : programSummary ? 'text-green-400' : 'text-white/60'
                        }`}>2</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 2 ? 'text-white/90' : 'text-white/70'
                        }`}>
                          {t('editor.desktop.config.step2.title' as any) || 'SELECT PROGRAM'}
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
                        {t('editor.desktop.config.step2.description' as any) || 'Connect a funding program to automatically load requirements, sections, and documents. Optional but recommended.'}
                      </p>
                    </button>
                                  
                    {/* Step 3 - Clickable */}
                    <button
                      onClick={() => setActiveStep(3)}
                      className={`relative p-3 rounded-lg border transition-colors text-left ${
                        activeStep === 3 
                          ? 'border-blue-400/50 bg-blue-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${
                          activeStep === 3 ? 'text-blue-300' : selectedProductMeta ? 'text-green-400' : 'text-white/60'
                        }`}>3</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 3 ? 'text-white/90' : 'text-white/70'
                        }`}>
                          {t('editor.desktop.config.step3.title' as any) || 'SECTIONS & DOCUMENTS'}
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
                        {t('editor.desktop.config.step3.description' as any) || 'Sections and documents are automatically generated based on your plan type and connected program. You can customize them.'}
                      </p>
                    </button>
                  </div>
                </div>
                              
                {/* Configurator Content - Show based on active step */}
                <div className="bg-white/10 border border-white/20 p-4 mb-4">
                  {/* Step 1: Product Selection */}
                  {activeStep === 1 && (
                    <ProductSelection />
                  )}
            
                  {/* Step 2: Program Selection */}
                  {activeStep === 2 && (
                    <ProgramSelection/>
                  )}
            
                  {/* Step 3: Sections & Documents Management */}
                  {activeStep === 3 && (
                    <SectionsDocumentsManagement />
                  )}
                </div>
              </div>
              
              {/* Fixed Footer with Action Buttons */}
              <div className="flex-shrink-0 border-t border-white/10 p-4 bg-slate-800/50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleToggle}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                  >
                    {t('editor.desktop.config.cancel' as any) || 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      // Close overlay and proceed
                      handleToggle();
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    {t('editor.desktop.config.confirmSelection' as any) || 'Confirm selection'}
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
    <div>
      <SummaryView />
      {isConfiguratorOpen && <OverlayView />}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);

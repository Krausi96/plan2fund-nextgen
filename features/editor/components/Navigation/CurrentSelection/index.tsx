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
      const top = Math.max(gridRect.top, 20); // Ensure minimum top spacing
      const left = Math.max(gridRect.left, 20); // Ensure minimum left spacing
      
      // Width: covers CurrentSelection (320px) + DocumentsBar (remaining width) = full grid width
      const width = Math.min(gridRect.width, window.innerWidth - 40); // Ensure it doesn't exceed viewport
      
      // Height: Use a more flexible height that adapts to content
      const minOverlayHeight = 700;
      const maxOverlayHeight = Math.min(window.innerHeight * 0.9, 900);
      // Cap the grid height to prevent overly tall overlays
      const cappedGridHeight = Math.min(gridRect.height, window.innerHeight * 0.8);
      const preferredHeight = Math.min(cappedGridHeight * 1.2, maxOverlayHeight);
      const height = Math.max(minOverlayHeight, preferredHeight);
      
      // Ensure the overlay doesn't extend beyond the viewport
      const clampedHeight = Math.min(height, window.innerHeight - top - 20);
      
      // Ensure the overlay stays within viewport bounds
      const finalTop = Math.max(20, Math.min(top, window.innerHeight - clampedHeight - 20));
      const finalLeft = Math.max(20, Math.min(left, window.innerWidth - width - 20));
      
      // Add extra padding when near viewport edges for better UX
      const paddedTop = finalTop >= 30 ? finalTop : 30;
      const paddedLeft = finalLeft >= 30 ? finalLeft : 30;
      
      // Handle case where grid container itself extends beyond viewport
      const boundedWidth = Math.min(width, window.innerWidth - finalLeft - 20);
      const boundedHeight = Math.min(clampedHeight, window.innerHeight - finalTop - 20);
      
      // Final check to ensure overlay is never taller than viewport
      const finalHeight = Math.min(boundedHeight, window.innerHeight - 40);
      
      // Ensure minimum height for usability but respect viewport constraints
      const usableHeight = Math.min(Math.max(finalHeight, 400), window.innerHeight - 40);
      
      setOverlayPosition({
        top: paddedTop,
        left: paddedLeft,
        width: boundedWidth,
        height: usableHeight
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
    const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'Current selection';
    const planLabelCopy = t('editor.desktop.selection.productLabel' as any) || 'Plan';
    const programLabelCopy = t('editor.desktop.selection.programLabel' as any) || 'Program / Template';
    const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'No program';
    const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'No selection';
    const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'Sections';
    const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'Documents';
    const startButtonLabel = t('editor.desktop.selection.start' as any) || 'Start';
    const editButtonLabel = t('editor.desktop.selection.edit' as any) || 'Edit';
    
    const hasMadeSelections = !!selectedProductMeta;
    
    return (
      <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-3 py-3 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur w-full" style={{ minHeight: 'fit-content' }}>
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
            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
              hasMadeSelections
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {hasMadeSelections ? (
              <>
                <span>⚙️</span>
                <span>{editButtonLabel}</span>
              </>
            ) : (
              <>
                <span>✏️</span>
                <span>{startButtonLabel}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Summary card */}
        <div 
          onClick={handleToggle}
          className="cursor-pointer"
        >
          <div className="flex flex-col gap-2 text-[10px] mb-3">
            {/* Product & Program - Allow wrapping for full names */}
            <div className="flex items-center gap-1.5 min-w-0">
              {selectedProductMeta?.icon && (
                <span className="text-sm leading-none flex-shrink-0">{selectedProductMeta.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-1">
                  {planLabelCopy}
                </div>
                <div className="text-white font-semibold text-xs block leading-snug break-words line-clamp-2" title={selectedProductMeta?.label || noSelectionCopy}>
                  {selectedProductMeta ? t(selectedProductMeta.label as any) || selectedProductMeta.label || noSelectionCopy : noSelectionCopy}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-1">
                  {programLabelCopy}
                </div>
                <div className="text-white/90 font-medium text-xs block leading-snug break-words line-clamp-2" title={programSummary?.name || noProgramCopy}>
                  {programSummary?.name || noProgramCopy}
                </div>
              </div>
            </div>

            {/* Sections & Documents - Compact Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/50">
              <div className="flex flex-col">
                <div className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight mb-0.5">
                  {sectionsLabel}
                </div>
                <div className="font-bold text-white text-xs">
                  {enabledSectionsCount}/{totalSectionsCount}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight mb-0.5">
                  {documentsLabel}
                </div>
                <div className="font-bold text-white text-xs">
                  {enabledDocumentsCount}/{totalDocumentsCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Full overlay view (expanded)
  const OverlayView = () => {
    const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'Current selection';
    const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'No program';
    const noSelectionCopy = t('editor.desktop.selection.empty' as any) || 'No selection';
    
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
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col bg-slate-950/95" style={{ boxSizing: 'border-box' }}>
              {/* Sticky Header with "Deine Konfiguration" and "Aktuelle Auswahl" */}
              <div className="sticky top-0 z-[10002] flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/30 bg-slate-950/95 backdrop-blur-sm">
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
              
              {/* Content */}
              <div className="flex-1 px-4 py-4 bg-slate-950/95 flex flex-col" style={{ paddingBottom: '80px', height: '100%' }}>
                {/* 3-Step Guide Section - Clickable Navigation */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white/90 uppercase mb-4">
                    {t('editor.desktop.config.howItWorks.title' as any) || 'HOW CONFIGURATION WORKS'}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
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
                <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex-grow flex flex-col" style={{ boxSizing: 'border-box' }}>
                  <div className="pr-2 flex-grow" style={{ paddingRight: '1rem', boxSizing: 'border-box', overflowY: 'auto', height: '400px' }}>
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
              </div>
              
              {/* Sticky Footer with Action Buttons */}
              <div className="flex-shrink-0 border-t border-white/10 p-4 bg-slate-800/50 sticky bottom-0">
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
    <div ref={containerRef}>
      <SummaryView />
      {isConfiguratorOpen && <OverlayView />}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);

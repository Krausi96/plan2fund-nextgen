import React, { useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';
import { useConfiguratorOverlayPosition, useConfiguratorChangeTracking, useConfiguratorStepNavigation } from '@/features/editor/lib/hooks';
import ProductSelection from './CurrentSelection/ProductSelection/ProductSelection';
import ProgramSelection from './CurrentSelection/ProgramSelection/ProgramSelection';
import SectionsDocumentsManagement from './CurrentSelection/SectionsDocumentsManagement/SectionsDocumentsManagement';

type CurrentSelectionProps = {
  templateState: TemplateState | null;
  selectedProduct: ProductType | null;
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  connectCopy: ConnectCopy;
  programSummary: ProgramSummary | null;
  programError: string | null;
  programLoading: boolean;
  progressSummary: ProgressSummary[];
  handleProductChange: (product: ProductType | null) => void;
  handleConnectProgram: (value: string | null) => void;
  runRequirementsCheck: () => void;
  workspaceGridRef: React.RefObject<HTMLDivElement | null>;
  isConfiguratorOpen: boolean;
  setIsConfiguratorOpen: (open: boolean) => void;
  setCustomSections: React.Dispatch<React.SetStateAction<SectionTemplate[]>>;
  setCustomDocuments: React.Dispatch<React.SetStateAction<DocumentTemplate[]>>;
};

export default function CurrentSelection(props: CurrentSelectionProps) {
  const { t } = useI18n();
  const router = useRouter();
  
  // All hooks must be called before any early returns
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [extractedTemplates, setExtractedTemplates] = useState<{ sections?: SectionTemplate[]; documents?: DocumentTemplate[]; errors?: string[] } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Prepare props from templateState using useConfig logic
  const configProps = useMemo(() => {
    if (!props.templateState) return null;
    
    // Inline context helper
    const selectedProductMeta = getSelectedProductMeta(props.productOptions, props.selectedProduct);
    
    return {
      productLabel: props.templateState.selectionSummary.productLabel,
      productIcon: props.templateState.selectionSummary.productIcon,
      programLabel: props.templateState.selectionSummary.programLabel,
      selectedDocumentName: props.templateState.selectionSummary.selectedDocumentName,
      enabledSectionsCount: props.templateState.selectionSummary.enabledSectionsCount,
      totalSectionsCount: props.templateState.selectionSummary.totalSectionsCount,
      enabledDocumentsCount: props.templateState.selectionSummary.enabledDocumentsCount,
      totalDocumentsCount: props.templateState.selectionSummary.totalDocumentsCount,
      sectionTitles: props.templateState.selectionSummary.sectionTitles,
      documentTitles: props.templateState.selectionSummary.documentTitles,
      productType: props.selectedProduct,
      productOptions: props.productOptions,
      selectedProductMeta,
      connectCopy: props.connectCopy,
      programSummary: props.programSummary,
      programError: props.programError,
      programLoading: props.programLoading,
      onChangeProduct: props.handleProductChange,
      onConnectProgram: props.handleConnectProgram,
      onOpenProgramFinder: () => router.push('/app/user/reco'),
      onTemplatesExtracted: (templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[] }) => {
        if (templates.sections?.length) {
          props.setCustomSections(prev => [...prev, ...templates.sections!]);
        }
        if (templates.documents?.length) {
          props.setCustomDocuments(prev => [...prev, ...templates.documents!]);
        }
      },
      progressSummary: props.progressSummary,
      onRunRequirementsCheck: props.runRequirementsCheck,
      overlayContainerRef: props.workspaceGridRef,
      isOpen: props.isConfiguratorOpen,
      onOverlayOpenChange: props.setIsConfiguratorOpen,
      allSections: props.templateState.allSections,
      allDocuments: props.templateState.allDocuments,
      disabledSections: props.templateState.disabledSections as Set<string>,
      disabledDocuments: props.templateState.disabledDocuments as Set<string>,
      onToggleSection: props.templateState.handlers.onToggleSection,
      onToggleDocument: props.templateState.handlers.onToggleDocument,
      showAddDocument: props.templateState.showAddDocument,
      showAddSection: props.templateState.showAddSection,
      newDocumentName: props.templateState.newDocumentName,
      newDocumentDescription: props.templateState.newDocumentDescription,
      newSectionTitle: props.templateState.newSectionTitle,
      newSectionDescription: props.templateState.newSectionDescription,
      onToggleAddDocument: props.templateState.handlers.onToggleAddDocument,
      onToggleAddSection: props.templateState.handlers.onToggleAddSection,
      onAddCustomDocument: props.templateState.handlers.onAddCustomDocument,
      onAddCustomSection: props.templateState.handlers.onAddCustomSection,
      onSetNewDocumentName: props.templateState.handlers.onSetNewDocumentName,
      onSetNewDocumentDescription: props.templateState.handlers.onSetNewDocumentDescription,
      onSetNewSectionTitle: props.templateState.handlers.onSetNewSectionTitle,
      onSetNewSectionDescription: props.templateState.handlers.onSetNewSectionDescription
    };
  }, [props, router]);

  // Derive values for hooks (use defaults if configProps is null)
  const externalIsOpen = configProps?.isOpen;
  const isExpanded = externalIsOpen !== undefined ? externalIsOpen : internalIsExpanded;
  
  // Stabilize setIsExpanded to prevent infinite loops
  // When externalIsOpen is defined, we use the store setter directly
  // When it's undefined, we use internal state
  const setIsExpanded = useCallback((value: boolean) => {
    if (externalIsOpen !== undefined && configProps?.onOverlayOpenChange) {
      // Only call if value is actually different to prevent loops
      if (value !== externalIsOpen) {
        configProps.onOverlayOpenChange(value);
      }
    } else {
      setInternalIsExpanded(value);
    }
  }, [externalIsOpen, configProps]);
  const productType = configProps?.productType ?? null;
  const programSummary = configProps?.programSummary ?? null;
  const progressSummary = configProps?.progressSummary ?? [];
  const overlayContainerRef = configProps?.overlayContainerRef ?? null;
  
  const overlayPosition = useConfiguratorOverlayPosition(isExpanded, containerRef, overlayContainerRef ?? undefined);
  
  const {
    pendingProduct,
    pendingProgram,
    originalProduct,
    originalProgram,
    canConfirm,
    setPendingProduct,
    setPendingProgram
  } = useConfiguratorChangeTracking(productType, programSummary, isExpanded);
  
  const { activeStep, setActiveStep } = useConfiguratorStepNavigation(productType, programSummary, isExpanded);

  // Removed useEffect that was causing infinite loop - isExpanded is already synced via setIsExpanded
  // When externalIsOpen is defined, isExpanded is derived from it (props.isConfiguratorOpen)
  // When it's internal, setIsExpanded handles updates directly
  // No need to sync back to store - that causes infinite updates

  const requirementsStats = calculateRequirementsStats(progressSummary);

  // Early return after all hooks
  if (!configProps) return null;

  const {
    productLabel,
    productIcon,
    programLabel,
    selectedDocumentName,
    enabledSectionsCount,
    totalSectionsCount,
    enabledDocumentsCount,
    totalDocumentsCount,
    sectionTitles,
    documentTitles,
    productOptions,
    selectedProductMeta,
    connectCopy,
    programError,
    programLoading,
    onChangeProduct,
    onConnectProgram,
    onOpenProgramFinder,
    onTemplatesExtracted,
    onRunRequirementsCheck,
    allSections = [],
    allDocuments = [],
    disabledSections = new Set(),
    disabledDocuments = new Set(),
    onToggleSection,
    onToggleDocument,
    showAddDocument = false,
    showAddSection = false,
    newDocumentName = '',
    newDocumentDescription = '',
    newSectionTitle = '',
    newSectionDescription = '',
    onToggleAddDocument,
    onToggleAddSection,
    onAddCustomDocument,
    onAddCustomSection,
    onSetNewDocumentName,
    onSetNewDocumentDescription,
    onSetNewSectionTitle,
    onSetNewSectionDescription
  } = configProps;
  const hasConfigurator = !!(productOptions && onChangeProduct);
  const hasMadeSelections = !!productType;
  const hasOverlay = !!overlayContainerRef;
  const shouldShowCollapsed = !isExpanded || hasOverlay;
  
  const handleCancel = () => {
    if (pendingProduct !== originalProduct && originalProduct) onChangeProduct?.(originalProduct);
    if (pendingProgram !== originalProgram) onConnectProgram?.(originalProgram);
    setPendingProduct(originalProduct);
    setPendingProgram(originalProgram);
    setIsExpanded(false);
  };
  
  return (
    <>
      <div ref={containerRef} className="flex flex-col border-r border-white/10 pr-4 h-full min-h-0" style={{ position: 'relative', zIndex: isExpanded ? 10 : 0, overflow: isExpanded ? 'hidden' : 'visible' }}>
        <div className="flex-shrink-0 mb-2 border-b border-white/50 flex items-center justify-between pb-2 gap-2">
          <h2 className="text-lg font-bold uppercase tracking-wide text-white flex-1">
            {(t('editor.desktop.selection.current' as any) as string) || 'AKTUELLE AUSWAHL'}
          </h2>
          {shouldShowCollapsed && hasConfigurator && (
            <Button onClick={() => setIsExpanded(true)} size="sm" className={`h-7 px-3 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 ${hasMadeSelections ? 'bg-white/10 hover:bg-white/20' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'}`}>
              {hasMadeSelections ? <>⚙️ {t('editor.desktop.selection.edit' as any) || 'Edit'}</> : <>📝 {t('editor.desktop.selection.start' as any) || 'Start'}</>}
            </Button>
          )}
          {!shouldShowCollapsed && hasConfigurator && (
            <Button onClick={() => setIsExpanded(false)} size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0">✕</Button>
          )}
        </div>
        
        {shouldShowCollapsed ? (
          <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-3 py-3 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur w-full" style={{ minHeight: 'fit-content' }}>
            <div className="flex flex-col gap-2.5 w-full">
              <div className="flex items-start gap-3 min-w-0">
                {productIcon && <span className="text-base leading-none flex-shrink-0 mt-0.5">{productIcon}</span>}
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-1">Plan</span>
                  <span className="text-white font-semibold text-xs block leading-snug break-words line-clamp-2" title={productLabel}>{productLabel}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-1">{(t('editor.desktop.selection.programLabel' as any) as string) || 'PROGRAMM/VORLAGE'}</span>
                  <span className="text-white/90 font-medium text-xs block leading-snug break-words line-clamp-2" title={programLabel || ((t('editor.desktop.selection.noProgram' as any) as string) || 'Kein Programm')}>
                    {programLabel || ((t('editor.desktop.selection.noProgram' as any) as string) || 'Kein Programm')}
                  </span>
                </div>
              </div>
              {selectedDocumentName && (
                <div className="flex items-center gap-2 pt-1.5 border-t border-white/30">
                  <span className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight">Document</span>
                  <span className="text-white/90 font-medium text-xs break-words line-clamp-1" title={selectedDocumentName}>📄 {selectedDocumentName}</span>
                </div>
              )}
              <div className="flex items-center gap-4 pt-2 border-t border-white/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight">{(t('editor.desktop.selection.sectionsLabel' as any) as string) || 'ABSCHNITTE'}</span>
                  <span className="font-bold text-white text-xs">{enabledSectionsCount}/{totalSectionsCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight">{(t('editor.desktop.selection.documentsLabel' as any) as string) || 'DOKUMENTE'}</span>
                  <span className="font-bold text-white text-xs">{enabledDocumentsCount}/{totalDocumentsCount}</span>
                </div>
              </div>
              {requirementsStats.total > 0 && <RequirementsDisplay requirementsStats={requirementsStats} variant="collapsed" />}
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-4 py-4 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur min-h-0 overflow-y-auto overflow-x-visible">
            <div className="w-full flex flex-col gap-3 text-[11px] min-h-0">
              <div className="flex items-center gap-2 min-w-0">
                {productIcon && <span className="text-base leading-none flex-shrink-0">{productIcon}</span>}
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{(t('editor.desktop.selection.productLabel' as any) as string) || 'PRODUCT'}</span>
                  <span className="truncate text-white font-semibold text-xs block" title={productLabel}>{productLabel}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{(t('editor.desktop.selection.programLabel' as any) as string) || 'PROGRAMM/VORLAGE'}</span>
                  <span className="truncate text-white/90 font-medium text-xs block" title={programLabel || ((t('editor.desktop.selection.noProgram' as any) as string) || 'Kein Programm')}>
                    {programLabel || ((t('editor.desktop.selection.noProgram' as any) as string) || 'Kein Programm')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0 relative group overflow-visible">
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{(t('editor.desktop.selection.sectionsLabel' as any) as string) || 'ABSCHNITTE'}</span>
                  <span className="font-bold text-white text-xs">{enabledSectionsCount}/{totalSectionsCount}</span>
                </div>
                <div className="absolute left-0 top-full mt-2 w-[300px] rounded-lg border border-white/40 bg-slate-950 px-3 py-2.5 text-[10px] font-normal text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[9999] shadow-2xl backdrop-blur-md">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/70 mb-2 font-semibold">{(t('editor.desktop.selection.sectionsPopoverTitle' as any) as string) || 'Selected sections'}</p>
                  <ul className="space-y-1.5 list-disc list-inside text-white/95">
                    {sectionTitles.length ? sectionTitles.map((title, idx) => <li key={idx} className="break-words">{title}</li>) : <li className="text-white/60">{(t('editor.desktop.selection.empty' as any) as string) || 'No selection'}</li>}
                  </ul>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0 relative group overflow-visible">
                <div className="flex-1 min-w-0">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{(t('editor.desktop.selection.documentsLabel' as any) as string) || 'DOKUMENTE'}</span>
                  <span className="font-bold text-white text-xs">{enabledDocumentsCount}/{totalDocumentsCount}</span>
                </div>
                <div className="absolute left-0 top-full mt-2 w-[300px] rounded-lg border border-white/40 bg-slate-950 px-3 py-2.5 text-[10px] font-normal text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[9999] shadow-2xl backdrop-blur-md">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/70 mb-2 font-semibold">{(t('editor.desktop.selection.documentsPopoverTitle' as any) as string) || 'Selected documents'}</p>
                  <ul className="space-y-1.5 list-disc list-inside text-white/95">
                    {documentTitles.length ? documentTitles.map((title, idx) => <li key={idx} className="break-words">{title}</li>) : <li className="text-white/60">{(t('editor.desktop.selection.empty' as any) as string) || 'No selection'}</li>}
                  </ul>
                </div>
              </div>
              <RequirementsDisplay requirementsStats={requirementsStats} variant="expanded-base" />
            </div>
          </div>
        )}
      </div>

      {/* Configurator Overlay - Merged from ConfiguratorOverlay.tsx */}
      {isExpanded && hasConfigurator && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-in-out"
            style={{
              opacity: overlayPosition ? 1 : 0,
              pointerEvents: overlayPosition ? 'auto' : 'none'
            }}
            onClick={handleCancel}
          />
          
          {/* Overlay Rectangle */}
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
          >
            <div className="h-full flex flex-col bg-slate-950/95">
              <div className="sticky top-0 z-[10002] flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/30 bg-slate-950/95 backdrop-blur-sm">
                <h3 className="text-lg font-bold uppercase tracking-wide text-white flex-shrink-0">{t('editor.desktop.config.title' as any) || 'Deine Konfiguration'}</h3>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end mr-3 text-xs text-white/90">
                  <span className="font-semibold uppercase">{(t('editor.desktop.selection.current' as any) as string) || 'AKTUELLE AUSWAHL'}</span>
                  <span className="text-white/60">:</span>
                  {productIcon && <span className="text-sm">{productIcon}</span>}
                  <span className="truncate" title={productLabel}>{productLabel}</span>
                  <span className="text-white/40">|</span>
                  <span className="truncate" title={programLabel || ((t('editor.desktop.selection.noProgram' as any) as string) || 'Kein Programm')}>{programLabel || ((t('editor.desktop.selection.noProgram' as any) as string) || 'Kein Programm')}</span>
                  <span className="text-white/40">|</span>
                  <span>{enabledSectionsCount}/{totalSectionsCount}</span>
                  <span className="text-white/40">|</span>
                  <span>{enabledDocumentsCount}/{totalDocumentsCount}</span>
                </div>
                <Button onClick={handleCancel} size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0">✕</Button>
              </div>
              
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 bg-slate-950/95" style={{ paddingBottom: '80px' }}>
                <div className="flex flex-col gap-4 w-full max-w-full">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-white mb-3">{t('editor.desktop.config.howItWorks' as any) || 'So funktioniert die Konfiguration'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((step) => {
                        const isActive = activeStep === step;
                        const isComplete = (step === 1 && pendingProduct) || (step === 2 && pendingProgram) || (step === 3 && pendingProduct);
                        return (
                          <button key={step} onClick={() => setActiveStep(step as 1 | 2 | 3)} className={`flex flex-col gap-2 p-2 rounded-lg transition-colors text-left ${isActive ? 'bg-blue-600/20 border border-blue-400/50' : 'hover:bg-white/5'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${isActive ? 'text-blue-300' : isComplete ? 'text-green-400' : 'text-blue-400'}`}>{step}.</span>
                              <span className={`text-xs font-semibold uppercase ${isActive ? 'text-white' : 'text-white/90'}`}>
                                {t(`editor.desktop.config.step${step}.title` as any) || (step === 1 ? 'PRODUKT AUSWÄHLEN' : step === 2 ? 'PROGRAMM AUSWÄHLEN' : 'ABSCHNITTE & DOKUMENTE')}
                              </span>
                              {step === 1 && <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-blue-600/30 text-blue-300 rounded uppercase font-semibold">{t('editor.desktop.config.step1.required' as any) || 'Required'}</span>}
                              {step === 2 && <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-yellow-600/30 text-yellow-300 rounded uppercase font-semibold">{t('editor.desktop.config.step2.optional' as any) || 'Optional'}</span>}
                              {isActive && <span className="ml-auto text-xs text-blue-300">●</span>}
                              {isComplete && !isActive && <span className="ml-auto text-xs text-green-400">✓</span>}
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed">{t(`editor.desktop.config.step${step}.description` as any) || ''}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Requirements Checker Stats */}
                  <RequirementsDisplay
                    requirementsStats={requirementsStats}
                    onRunRequirementsCheck={onRunRequirementsCheck}
                    variant="expanded-overlay"
                  />

                  {/* Configurator Content */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    {activeStep === 1 && (
                      <ProductSelection
                        productType={productType ?? undefined}
                        productOptions={productOptions}
                        selectedProductMeta={selectedProductMeta}
                        pendingProduct={pendingProduct}
                        totalSectionsCount={totalSectionsCount}
                        totalDocumentsCount={totalDocumentsCount}
                        onChangeProduct={(product: ProductType | null) => {
                          setPendingProduct(product ?? undefined);
                          onChangeProduct?.(product);
                        }}
                      />
                    )}
                    {activeStep === 2 && (
                      <ProgramSelection
                        programSummary={programSummary}
                        programError={programError}
                        programLoading={programLoading}
                        pendingProgram={pendingProgram}
                        connectCopy={connectCopy}
                        onConnectProgram={(value: string | null) => {
                          setPendingProgram(value);
                          onConnectProgram?.(value);
                        }}
                        onOpenProgramFinder={onOpenProgramFinder}
                        onTemplatesExtracted={onTemplatesExtracted}
                        onShowTemplatePreview={setShowTemplatePreview}
                        onSetExtractedTemplates={setExtractedTemplates}
                      />
                    )}
                    {activeStep === 3 && (
                      <SectionsDocumentsManagement
                        allSections={allSections}
                        allDocuments={allDocuments}
                        disabledSections={disabledSections}
                        disabledDocuments={disabledDocuments}
                        enabledSectionsCount={enabledSectionsCount}
                        totalSectionsCount={totalSectionsCount}
                        enabledDocumentsCount={enabledDocumentsCount}
                        totalDocumentsCount={totalDocumentsCount}
                        onToggleSection={onToggleSection}
                        onToggleDocument={onToggleDocument}
                        showAddDocument={showAddDocument}
                        showAddSection={showAddSection}
                        newDocumentName={newDocumentName}
                        newDocumentDescription={newDocumentDescription}
                        newSectionTitle={newSectionTitle}
                        newSectionDescription={newSectionDescription}
                        onToggleAddDocument={onToggleAddDocument}
                        onToggleAddSection={onToggleAddSection}
                        onAddCustomDocument={onAddCustomDocument}
                        onAddCustomSection={onAddCustomSection}
                        onSetNewDocumentName={onSetNewDocumentName}
                        onSetNewDocumentDescription={onSetNewDocumentDescription}
                        onSetNewSectionTitle={onSetNewSectionTitle}
                        onSetNewSectionDescription={onSetNewSectionDescription}
                        productType={productType ?? undefined}
                        selectedProductMeta={selectedProductMeta}
                        programSummary={programSummary}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="sticky bottom-0 z-[10002] flex-shrink-0 flex items-center justify-end gap-3 px-4 py-3 border-t border-white/30 bg-slate-950/95 backdrop-blur-sm">
                <Button onClick={handleCancel} size="sm" variant="ghost" className="h-9 px-4 text-sm text-white/70 hover:text-white hover:bg-white/10">
                  {t('editor.desktop.config.cancel' as any) || 'Cancel'}
                </Button>
                <Button onClick={() => setIsExpanded(false)} size="sm" disabled={!canConfirm} className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {t('editor.desktop.config.confirmSelection' as any) || 'Confirm Selection'}
                </Button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editor.desktop.config.previewTitle' as any) || 'Template-Vorschau'}</DialogTitle>
            <DialogDescription>{t('editor.desktop.config.previewDescription' as any) || 'Überprüfen Sie die extrahierten Abschnitte und Dokumente vor dem Hinzufügen.'}</DialogDescription>
          </DialogHeader>
          {extractedTemplates?.errors && extractedTemplates.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-red-800 mb-2">{t('editor.desktop.config.preview.errors' as any) || 'Fehler:'}</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">{extractedTemplates.errors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
            </div>
          )}
          {extractedTemplates?.sections && extractedTemplates.sections.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">{(t('editor.desktop.config.preview.sectionsLabel' as any) || 'Abschnitte')} ({extractedTemplates.sections.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {extractedTemplates.sections.map((section) => (
                  <div key={section.id} className="border rounded-lg p-2 bg-gray-50">
                    <p className="text-sm font-medium">{section.title}</p>
                    {section.description && <p className="text-xs text-gray-600 mt-1">{section.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {extractedTemplates?.documents && extractedTemplates.documents.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">{(t('editor.desktop.config.preview.documentsLabel' as any) || 'Dokumente')} ({extractedTemplates.documents.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {extractedTemplates.documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-2 bg-gray-50">
                    <p className="text-sm font-medium">{doc.name}</p>
                    {doc.description && <p className="text-xs text-gray-600 mt-1">{doc.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowTemplatePreview(false); setExtractedTemplates(null); }}>
              {t('editor.desktop.config.preview.cancel' as any) || 'Abbrechen'}
            </Button>
            {extractedTemplates && (extractedTemplates.sections?.length || extractedTemplates.documents?.length) && (
              <Button onClick={() => { onTemplatesExtracted?.({ sections: extractedTemplates.sections, documents: extractedTemplates.documents }); setShowTemplatePreview(false); setExtractedTemplates(null); }}>
                {t('editor.desktop.config.preview.add' as any) || 'Hinzufügen'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { normalizeProgramInput, type ProgressSummary, METADATA_SECTION_ID, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/hooks/useEditorStore';
import { extractTemplateFromFile } from '@/features/editor/templates/api';
import type { ProductType, ProgramSummary } from '@/features/editor/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { ConnectCopy } from '@/features/editor/types/configurator';

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
  // Configurator props (optional - only if configurator should be shown)
  productType?: ProductType;
  productOptions?: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  selectedProductMeta?: { value: ProductType; label: string; description: string; icon?: string } | null;
  connectCopy?: ConnectCopy;
  programSummary?: ProgramSummary | null;
  programError?: string | null;
  programLoading?: boolean;
  onChangeProduct?: (product: ProductType) => void;
  onConnectProgram?: (value: string | null) => void;
  onOpenProgramFinder?: () => void;
  onTemplatesExtracted?: (templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[] }) => void;
  // Requirements checker props
  progressSummary?: ProgressSummary[];
  onRunRequirementsCheck?: () => void;
  // Overlay positioning
  overlayContainerRef?: React.RefObject<HTMLDivElement>;
  // Overlay state callback
  onOverlayOpenChange?: (isOpen: boolean) => void;
  // Sections & Documents management (for Step 3)
  allSections?: SectionTemplate[];
  allDocuments?: DocumentTemplate[];
  disabledSections?: Set<string>;
  disabledDocuments?: Set<string>;
  onToggleSection?: (sectionId: string) => void;
  onToggleDocument?: (documentId: string) => void;
  // Add custom items
  showAddDocument?: boolean;
  showAddSection?: boolean;
  newDocumentName?: string;
  newDocumentDescription?: string;
  newSectionTitle?: string;
  newSectionDescription?: string;
  onToggleAddDocument?: () => void;
  onToggleAddSection?: () => void;
  onAddCustomDocument?: () => void;
  onAddCustomSection?: () => void;
  onSetNewDocumentName?: (name: string) => void;
  onSetNewDocumentDescription?: (desc: string) => void;
  onSetNewSectionTitle?: (title: string) => void;
  onSetNewSectionDescription?: (desc: string) => void;
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
  documentTitles,
  // Configurator props
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
  // Requirements checker props
  progressSummary = [],
  onRunRequirementsCheck,
  // Overlay positioning
  overlayContainerRef,
  // Overlay state callback
  onOverlayOpenChange,
  // Sections & Documents management
  allSections = [],
  allDocuments = [],
  disabledSections = new Set(),
  disabledDocuments = new Set(),
  onToggleSection,
  onToggleDocument,
  // Add custom items
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
}: CurrentSelectionProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayPosition, setOverlayPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  // Track if component is mounted to prevent hydration mismatches
  const isMountedRef = useRef(false);
  
  // Change tracking for confirm/cancel functionality
  // Initialize with undefined/null to avoid hydration mismatches, sync with props after mount
  const [pendingProduct, setPendingProduct] = useState<ProductType | undefined>(undefined);
  const [pendingProgram, setPendingProgram] = useState<string | null>(null);
  const [originalProduct, setOriginalProduct] = useState<ProductType | undefined>(undefined);
  const [originalProgram, setOriginalProgram] = useState<string | null>(null);
  
  // Sync state with props after mount to prevent hydration issues
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      // Set initial values from props only after mount
      setPendingProduct(productType);
      setPendingProgram(programSummary?.id || null);
      setOriginalProduct(productType);
      setOriginalProgram(programSummary?.id || null);
    }
  }, []); // Only run once on mount
  
  // Sync state with props when they change (but only after mount and when configurator is closed)
  useEffect(() => {
    if (isMountedRef.current && !isExpanded) {
      // Only sync when configurator is closed to avoid disrupting user changes
      setPendingProduct(productType);
      setPendingProgram(programSummary?.id || null);
      setOriginalProduct(productType);
      setOriginalProgram(programSummary?.id || null);
    }
  }, [productType, programSummary?.id, isExpanded]);
  
  const hasChanges = useMemo(() => {
    return pendingProduct !== originalProduct || pendingProgram !== originalProgram;
  }, [pendingProduct, originalProduct, pendingProgram, originalProgram]);

  // Determine if Confirm button should be enabled (safest: require product + have changes)
  const canConfirm = useMemo(() => {
    return !!pendingProduct && hasChanges;
  }, [pendingProduct, hasChanges]);

  // DesktopConfigurator state (merged)
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [productMenuPosition, setProductMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [extractedTemplates, setExtractedTemplates] = useState<{ sections?: SectionTemplate[]; documents?: DocumentTemplate[]; errors?: string[] } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [manualInputPosition, setManualInputPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);
  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const productTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Notify parent when overlay state changes
  useEffect(() => {
    onOverlayOpenChange?.(isExpanded);
  }, [isExpanded, onOverlayOpenChange]);

  // Calculate requirements stats from progressSummary
  const requirementsStats = useMemo(() => {
    if (!progressSummary || progressSummary.length === 0) {
      return {
        overallPercentage: 0,
        complete: 0,
        needsWork: 0,
        missing: 0,
        total: 0
      };
    }

    const complete = progressSummary.filter(s => s.progress >= 100).length;
    const needsWork = progressSummary.filter(s => s.progress >= 50 && s.progress < 100).length;
    const missing = progressSummary.filter(s => s.progress < 50).length;
    const total = progressSummary.length;
    const overallPercentage = total > 0 
      ? Math.round(progressSummary.reduce((sum, s) => sum + s.progress, 0) / total)
      : 0;

    return {
      overallPercentage,
      complete,
      needsWork,
      missing,
      total
    };
  }, [progressSummary]);

  // Calculate overlay position - rectangle covering CurrentSelection, DocumentsBar, and top of Sidebar
  useEffect(() => {
    if (!isExpanded || !containerRef.current || !overlayContainerRef?.current) {
      setOverlayPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current || !overlayContainerRef?.current) return;
      
      const gridRect = overlayContainerRef.current.getBoundingClientRect();
      const currentSelectionRect = containerRef.current.getBoundingClientRect();
      
      // Overlay covers:
      // - All of CurrentSelection (Row 1, Col 1) - 320px wide
      // - All of DocumentsBar (Row 1, Col 2) - remaining width
      // - Top portion of Sidebar (Row 2, Col 1) - same width as CurrentSelection, extends down
      
      // Start from top-left of grid (where CurrentSelection starts)
      const left = gridRect.left;
      const top = gridRect.top;
      
      // Width: covers CurrentSelection (320px) + DocumentsBar (remaining width) = full grid width
      const width = gridRect.width;
      
      // Height: CurrentSelection height + portion of Sidebar (extend down to cover more of sidebar)
      // Use CurrentSelection height + additional height for sidebar portion
      const currentSelectionHeight = currentSelectionRect.height;
      const sidebarPortionHeight = Math.min(400, gridRect.height - currentSelectionHeight); // Cover up to 400px of sidebar or remaining height
      const height = currentSelectionHeight + sidebarPortionHeight;
      
      setOverlayPosition({
        top,
        left,
        width,
        height
      });
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updatePosition, 10);
    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isExpanded, overlayContainerRef]);
  
  // Track if configurator was just opened (to avoid hydration issues)
  const wasExpandedRef = useRef(false);
  
  // Initialize pending state when configurator opens
  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      // First time opening - initialize state
      setOriginalProduct(productType);
      setOriginalProgram(programSummary?.id || null);
      setPendingProduct(productType);
      setPendingProgram(programSummary?.id || null);
      // Set initial step to Step 1 - let users manually navigate between steps
      // No automatic navigation - users should explicitly choose which step to view
      setActiveStep(1);
      wasExpandedRef.current = true;
    } else if (!isExpanded) {
      // Configurator closed - reset the ref
      wasExpandedRef.current = false;
    } else if (isExpanded && wasExpandedRef.current) {
      // Configurator is open and was already open - only update pending state if props changed
      // Don't reset activeStep to avoid disrupting user navigation
      setPendingProduct(productType);
      setPendingProgram(programSummary?.id || null);
    }
  }, [isExpanded, productType, programSummary?.id]);
  
  // Handle confirm - apply changes (most changes already applied, just close)
  const handleConfirm = () => {
    // Product changes are applied immediately via onChangeProduct
    // Program changes are applied immediately via onConnectProgram
    // Just close the configurator
    setIsExpanded(false);
  };
  
  // Handle cancel - revert changes
  const handleCancel = () => {
    // Revert product if changed
    if (pendingProduct !== originalProduct && originalProduct) {
      onChangeProduct?.(originalProduct);
    }
    // Revert program if changed
    if (pendingProgram !== originalProgram) {
      onConnectProgram?.(originalProgram);
    }
    // Reset pending state
    setPendingProduct(originalProduct);
    setPendingProgram(originalProgram);
    setIsExpanded(false);
  };
  
  // Determine which step to show based on user interaction
  // User can click on steps to navigate, or we auto-advance based on completion

  const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'AKTUELLE AUSWAHL';
  const programLabelCopy = t('editor.desktop.selection.programLabel' as any) || 'PROGRAMM/VORLAGE';
  const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'Kein Programm';
  const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'ABSCHNITTE';
  const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'DOKUMENTE';
  const sectionsPopoverTitle = t('editor.desktop.selection.sectionsPopoverTitle' as any) || 'Selected sections';
  const documentsPopoverTitle = t('editor.desktop.selection.documentsPopoverTitle' as any) || 'Selected documents';
  const selectionEmpty = t('editor.desktop.selection.empty' as any) || 'No selection';

  const hasConfigurator = productType && productOptions && onChangeProduct;
  const selectedMeta = selectedProductMeta ?? productOptions?.find((option) => option.value === productType) ?? productOptions?.[0] ?? null;
  
  // Determine if user has made selections (has product selected and/or program connected)
  const hasMadeSelections = productType && (programSummary?.id || enabledSectionsCount > 0 || enabledDocumentsCount > 0);

  // DesktopConfigurator handlers (merged)
  const handleSelectProduct = (product: ProductType) => {
    setPendingProduct(product);
    // Apply immediately for better UX (user sees changes right away)
    onChangeProduct?.(product);
    setShowProductMenu(false);
    setProductMenuPosition(null);
    // Don't auto-advance - let user manually navigate between steps
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
      setManualError(connectCopy?.error || 'Invalid input');
      return;
    }
    setPendingProgram(normalized);
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
    onTemplatesExtracted?.({
      sections: extractedTemplates.sections,
      documents: extractedTemplates.documents
    });
    setShowTemplatePreview(false);
    setExtractedTemplates(null);
  };

  // Product menu positioning
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

  // Info tooltip component (merged from DesktopConfigurator)
  const InfoTooltip = ({ content, title }: { content: string; title?: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (!showTooltip) return;
      const handleClickAway = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          tooltipRef.current &&
          !tooltipRef.current.contains(target) &&
          iconRef.current &&
          !iconRef.current.contains(target)
        ) {
          setShowTooltip(false);
        }
      };
      document.addEventListener('mousedown', handleClickAway);
      return () => document.removeEventListener('mousedown', handleClickAway);
    }, [showTooltip]);

    return (
      <div className="relative inline-flex items-center">
        <button
          ref={iconRef}
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-white/60 hover:text-white/90 cursor-help transition-colors flex-shrink-0"
          aria-label={t('editor.desktop.config.infoIcon' as any) || 'Information'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
        {showTooltip && typeof window !== 'undefined' && createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[10002] rounded-lg border border-white/40 bg-slate-950 px-3 py-2.5 text-[11px] font-normal text-white shadow-2xl backdrop-blur-md max-w-[280px] pointer-events-auto"
            style={{
              top: iconRef.current ? `${iconRef.current.getBoundingClientRect().bottom + 8}px` : '0',
              left: iconRef.current ? `${iconRef.current.getBoundingClientRect().left}px` : '0'
            }}
          >
            {title && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1.5 font-semibold">{title}</p>
            )}
            <p className="text-white/95 leading-relaxed">{content}</p>
          </div>,
          document.body
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col border-r border-white/10 pr-4 h-full min-h-0" style={{ position: 'relative', zIndex: isExpanded ? 10 : 0, overflow: 'hidden' }}>
      <div className="flex-shrink-0 mb-2 border-b border-white/50 flex items-center justify-between pb-2 gap-2">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white flex-1">
          {selectionCurrentLabel}
        </h2>
        {!isExpanded && hasConfigurator && (
          <Button
            onClick={() => setIsExpanded(true)}
            size="sm"
            className={`h-7 px-3 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 ${
              hasMadeSelections
                ? 'bg-white/10 hover:bg-white/20' // Edit button style when selections exist
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400' // Configure button style when no selections
            }`}
          >
            {hasMadeSelections ? (
              <>
                <span className="mr-1">⚙️</span>
                {t('editor.desktop.selection.edit' as any) || 'Edit'}
              </>
            ) : (
              <>
                <span className="mr-1">🚀</span>
                {t('editor.desktop.selection.configure' as any) || 'Configure'}
              </>
            )}
          </Button>
        )}
        {isExpanded && hasConfigurator && (
          <Button
            onClick={() => setIsExpanded(false)}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
          >
            ✕
          </Button>
        )}
      </div>
      
      {!isExpanded ? (
        /* Collapsed State - Compact with Journey Start Button */
        <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-3 py-3 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur" style={{ minHeight: 'fit-content' }}>
          {/* Current Selection Summary - Compact */}
          <div className="flex flex-col gap-2 text-[10px] mb-3">
            {/* Product */}
            <div className="flex items-center gap-1.5 min-w-0">
              {productIcon && (
                <span className="text-sm leading-none flex-shrink-0">{productIcon}</span>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking block leading-tight">Product</span>
                <span className="truncate text-white font-semibold text-[11px] block leading-tight" title={productLabel}>
                  {productLabel}
                </span>
              </div>
            </div>
            
            {/* Program */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex-1 min-w-0">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking block leading-tight">{programLabelCopy}</span>
                <span className="truncate text-white/90 font-medium text-[11px] block leading-tight" title={programLabel || noProgramCopy}>
                  {programLabel || noProgramCopy}
                </span>
              </div>
            </div>
            
            {/* Sections & Documents - Compact Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/20">
              <div className="flex flex-col">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking mb-0.5 leading-tight">{sectionsLabel}</span>
                <span className="font-bold text-white text-xs">{enabledSectionsCount}/{totalSectionsCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking mb-0.5 leading-tight">{documentsLabel}</span>
                <span className="font-bold text-white text-xs">{enabledDocumentsCount}/{totalDocumentsCount}</span>
              </div>
            </div>

            {/* Requirements Checker Stats - Compact */}
            {requirementsStats.total > 0 && (
              <div className="pt-1.5 border-t border-white/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/60 text-[8px] font-semibold uppercase tracking leading-tight">
                    {t('editor.desktop.selection.requirements.title' as any) || 'PROGRAMM-READINESS'}
                  </span>
                  <span className="text-white font-bold text-[10px]">{requirementsStats.overallPercentage}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${requirementsStats.overallPercentage}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[8px]">
                  <span className="text-green-400 font-semibold">✅ {requirementsStats.complete}</span>
                  <span className="text-yellow-400 font-semibold">⚠️ {requirementsStats.needsWork}</span>
                  <span className="text-red-400 font-semibold">❌ {requirementsStats.missing}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Expanded State - Current Selection Summary (shown in overlay) */
        <div className="flex-1 rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-4 py-4 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur min-h-0 overflow-y-auto overflow-x-visible">
          <div className="w-full flex flex-col gap-3 text-[11px] min-h-0">
            {/* Product */}
            <div className="flex items-center gap-2 min-w-0">
              {productIcon && (
                <span className="text-base leading-none flex-shrink-0">{productIcon}</span>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">Product</span>
                <span className="truncate text-white font-semibold text-xs block" title={productLabel}>
                  {productLabel}
                </span>
              </div>
            </div>
            
            {/* Program */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{programLabelCopy}</span>
                <span className="truncate text-white/90 font-medium text-xs block" title={programLabel || noProgramCopy}>
                  {programLabel || noProgramCopy}
                </span>
              </div>
            </div>
            
            {/* Sections */}
            <div className="flex items-center gap-2 min-w-0 relative group overflow-visible">
              <div className="flex-1 min-w-0">
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{sectionsLabel}</span>
                <span className="font-bold text-white text-xs">{enabledSectionsCount}/{totalSectionsCount}</span>
              </div>
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
              <div className="flex-1 min-w-0">
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking block mb-0.5">{documentsLabel}</span>
                <span className="font-bold text-white text-xs">{enabledDocumentsCount}/{totalDocumentsCount}</span>
              </div>
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

            {/* Requirements Checker Stats - Expanded View (in base panel) */}
            {requirementsStats.total > 0 && (
              <div className="mt-3 pt-3 border-t border-white/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-[9px] font-semibold uppercase tracking">
                    {t('editor.desktop.selection.requirements.title' as any) || 'PROGRAMM-READINESS'}
                  </span>
                  <span className="text-white font-bold text-xs">{requirementsStats.overallPercentage}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${requirementsStats.overallPercentage}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="text-green-400 font-semibold">✅ {requirementsStats.complete}</span>
                  <span className="text-yellow-400 font-semibold">⚠️ {requirementsStats.needsWork}</span>
                  <span className="text-red-400 font-semibold">❌ {requirementsStats.missing}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop overlay when expanded */}
      {isExpanded && hasConfigurator && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-in-out"
          style={{
            opacity: overlayPosition ? 1 : 0,
            pointerEvents: overlayPosition ? 'auto' : 'none'
          }}
          onClick={handleCancel}
        />,
        document.body
      )}

      {/* Overlay Rectangle - covers CurrentSelection, DocumentsBar, and top of Sidebar */}
      {isExpanded && hasConfigurator && typeof window !== 'undefined' && createPortal(
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
            {/* Sticky Header with "Deine Konfiguration" and "Aktuelle Auswahl" */}
            <div className="sticky top-0 z-[10002] flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/30 bg-slate-950/95 backdrop-blur-sm">
              <h3 className="text-lg font-bold uppercase tracking-wide text-white flex-shrink-0">
                {t('editor.desktop.config.title' as any) || 'Deine Konfiguration'}
              </h3>
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end mr-3">
                <span className="text-xs font-semibold uppercase text-white/90 flex-shrink-0">
                  {selectionCurrentLabel}
                </span>
                <span className="text-white/60 flex-shrink-0">:</span>
                {/* Product with icon */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {productIcon && (
                    <span className="text-sm leading-none flex-shrink-0">{productIcon}</span>
                  )}
                  <span className="text-xs text-white/90 truncate" title={productLabel}>
                    {productLabel}
                  </span>
                </div>
                <span className="text-white/40 flex-shrink-0">|</span>
                {/* Program */}
                <span className="text-xs text-white/90 truncate" title={programLabel || noProgramCopy}>
                  {programLabel || noProgramCopy}
                </span>
                <span className="text-white/40 flex-shrink-0">|</span>
                {/* Sections */}
                <span className="text-xs text-white/90 flex-shrink-0">
                  {enabledSectionsCount}/{totalSectionsCount}
                </span>
                <span className="text-white/40 flex-shrink-0">|</span>
                {/* Documents */}
                <span className="text-xs text-white/90 flex-shrink-0">
                  {enabledDocumentsCount}/{totalDocumentsCount}
                </span>
              </div>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
              >
                ✕
              </Button>
            </div>
            
            {/* Scrollable content - solid background for visibility */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 bg-slate-950/95" style={{ paddingBottom: '80px' }}>
              <div className="flex flex-col gap-4 w-full max-w-full">
                {/* 3-Column Explanation Section with Step Indicators - Clickable Steps */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-white mb-3">
                    {t('editor.desktop.config.howItWorks' as any) || 'So funktioniert die Konfiguration'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column 1: Product Selection - Clickable */}
                    <button
                      onClick={() => setActiveStep(1)}
                      className={`flex flex-col gap-2 p-2 rounded-lg transition-colors text-left ${
                        activeStep === 1 ? 'bg-blue-600/20 border border-blue-400/50' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          activeStep === 1 ? 'text-blue-300' : pendingProduct ? 'text-green-400' : 'text-blue-400'
                        }`}>1.</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 1 ? 'text-white' : 'text-white/90'
                        }`}>
                          {t('editor.desktop.config.step1.title' as any) || 'PRODUKT AUSWÄHLEN'}
                        </span>
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-blue-600/30 text-blue-300 rounded uppercase font-semibold">
                          {t('editor.desktop.config.step1.required' as any) || 'Required'}
                        </span>
                        {activeStep === 1 && (
                          <span className="ml-auto text-xs text-blue-300">●</span>
                        )}
                        {pendingProduct && activeStep !== 1 && (
                          <span className="ml-auto text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        {t('editor.desktop.config.step1.description' as any) || 'Wählen Sie den Typ Ihres Business Plans (Submission, Review oder Strategy). Jeder Typ hat spezifische Vorlagen und optimierte Abschnitte.'}
                      </p>
                    </button>
                    {/* Column 2: Program Selection - Clickable */}
                    <button
                      onClick={() => setActiveStep(2)}
                      className={`flex flex-col gap-2 p-2 rounded-lg transition-colors text-left ${
                        activeStep === 2 ? 'bg-blue-600/20 border border-blue-400/50' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          activeStep === 2 ? 'text-blue-300' : pendingProgram ? 'text-green-400' : 'text-blue-400'
                        }`}>2.</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 2 ? 'text-white' : 'text-white/90'
                        }`}>
                          {t('editor.desktop.config.step2.title' as any) || 'PROGRAMM AUSWÄHLEN'}
                        </span>
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-yellow-600/30 text-yellow-300 rounded uppercase font-semibold">
                          {t('editor.desktop.config.step2.optional' as any) || 'Optional'}
                        </span>
                        {activeStep === 2 && (
                          <span className="ml-auto text-xs text-blue-300">●</span>
                        )}
                        {pendingProgram && activeStep !== 2 && (
                          <span className="ml-auto text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        {t('editor.desktop.config.step2.description' as any) || 'Verbinden Sie ein Förderprogramm, um automatisch Anforderungen, Abschnitte und Dokumente zu laden. Optional, aber empfohlen.'}
                      </p>
                    </button>
                    {/* Column 3: Sections & Documents - Clickable */}
                    <button
                      onClick={() => setActiveStep(3)}
                      className={`flex flex-col gap-2 p-2 rounded-lg transition-colors text-left ${
                        activeStep === 3 ? 'bg-blue-600/20 border border-blue-400/50' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          activeStep === 3 ? 'text-blue-300' : pendingProduct ? 'text-green-400' : 'text-blue-400'
                        }`}>3.</span>
                        <span className={`text-xs font-semibold uppercase ${
                          activeStep === 3 ? 'text-white' : 'text-white/90'
                        }`}>
                          {t('editor.desktop.config.step3.title' as any) || 'ABSCHNITTE & DOKUMENTE'}
                        </span>
                        {activeStep === 3 && (
                          <span className="ml-auto text-xs text-blue-300">●</span>
                        )}
                        {pendingProduct && activeStep !== 3 && (
                          <span className="ml-auto text-xs text-green-400">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        {t('editor.desktop.config.step3.description' as any) || 'Abschnitte und Dokumente werden automatisch basierend auf Ihrem Plan-Typ und verbundenem Programm generiert. Sie können sie anpassen.'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Requirements Checker Stats - Expanded View (ALWAYS SHOW IF AVAILABLE) */}
                {requirementsStats.total > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-white/90">
                        {t('editor.desktop.selection.requirements.title' as any) || 'PROGRAMM-READINESS'}
                      </span>
                      <InfoTooltip
                        title={t('editor.desktop.selection.requirements.title' as any) || 'Programm-Readiness'}
                        content={t('editor.desktop.selection.requirements.info' as any) || 'Die Programm-Readiness zeigt an, wie vollständig Ihr Plan die Anforderungen des verbundenen Förderprogramms erfüllt. ✅ Komplett bedeutet 100% erfüllt, ⚠️ Braucht Arbeit bedeutet 50-99% erfüllt, und ❌ Fehlt bedeutet weniger als 50% erfüllt. Klicken Sie auf "Aktualisieren", um die neuesten Werte zu berechnen.'}
                      />
                    </div>
                    {/* Overall percentage with progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white font-bold text-sm">
                          {t('editor.desktop.selection.requirements.overall' as any) || 'Gesamt'}:
                        </span>
                        <span className="text-white font-bold text-sm">{requirementsStats.overallPercentage}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${requirementsStats.overallPercentage}%` }}
                        />
                      </div>
                    </div>
                    {/* Detailed stats */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-lg">✅ {requirementsStats.complete}</div>
                        <div className="text-white/70 text-[10px] uppercase tracking-wide">
                          {t('editor.desktop.selection.requirements.complete' as any) || 'Komplett'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold text-lg">⚠️ {requirementsStats.needsWork}</div>
                        <div className="text-white/70 text-[10px] uppercase tracking-wide">
                          {t('editor.desktop.selection.requirements.needsWork' as any) || 'Braucht Arbeit'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-bold text-lg">❌ {requirementsStats.missing}</div>
                        <div className="text-white/70 text-[10px] uppercase tracking-wide">
                          {t('editor.desktop.selection.requirements.missing' as any) || 'Fehlt'}
                        </div>
                      </div>
                    </div>
                    {onRunRequirementsCheck && (
                      <Button
                        onClick={onRunRequirementsCheck}
                        size="sm"
                        className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        🔄 {t('editor.desktop.selection.requirements.refresh' as any) || 'Aktualisieren'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Configurator Content - Show based on active step */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  {/* Step 1: Product Selection */}
                  {activeStep === 1 && (
                    <div className="relative">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-sm font-bold text-white/90 uppercase">
                          {t('editor.desktop.config.productSelection.title' as any) || 'Produktauswahl'}
                        </span>
                        <InfoTooltip
                          title={t('editor.desktop.config.productSelection.title' as any) || 'Produktauswahl'}
                          content={t('editor.desktop.config.productSelection.info' as any) || 'Die Produktauswahl bestimmt, welche Abschnitte und Dokumente für Ihren Plan verfügbar sind. Submission-Pläne sind für Förderanträge optimiert und enthalten alle erforderlichen Abschnitte für formelle Anträge. Review-Pläne fokussieren sich auf Überarbeitungen bestehender Dokumente. Strategy-Pläne sind für strategische Planung und Geschäftsentwicklung konzipiert.'}
                        />
                      </div>
                      <button
                        ref={productTriggerRef}
                        type="button"
                        onClick={handleToggleProductMenu}
                        className="flex w-full items-center gap-2 rounded-xl border border-white/25 bg-gradient-to-br from-white/15 via-white/5 to-transparent px-3 py-2 text-left transition-all hover:border-white/60 focus-visible:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/60 shadow-xl"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg leading-none text-white shadow-inner shadow-blue-900/40 flex-shrink-0">
                          {selectedMeta?.icon ?? '📄'}
                        </span>
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="text-xl font-semibold leading-tight text-white flex-shrink-0">{selectedMeta?.label}</span>
                          {selectedMeta?.description && (
                            <>
                              <span className="text-white/40 flex-shrink-0">|</span>
                              <span className="text-xs font-normal text-white/60 leading-tight flex-1 min-w-0 truncate" title={selectedMeta.description}>
                                {selectedMeta.description}
                              </span>
                            </>
                          )}
                          <span className="flex items-center text-2xl font-bold flex-shrink-0 text-white/70 ml-auto leading-none">▾</span>
                        </span>
                      </button>
                      {showProductMenu && productMenuPosition && typeof window !== 'undefined' && createPortal(
                        <div
                          ref={productMenuRef}
                          className="fixed z-[10002] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
                          style={{
                            top: `${productMenuPosition.top}px`,
                            left: `${productMenuPosition.left}px`,
                            width: `${productMenuPosition.width}px`
                          }}
                        >
                          <ul className="flex flex-col gap-1">
                            {productOptions?.map((option) => {
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
                      
                      {/* Preview: Sections & Documents (shown after product selection) */}
                      {pendingProduct && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white/90 uppercase">
                              {t('editor.desktop.config.step1.preview' as any) || 'Preview: Available Sections & Documents'}
                            </span>
                            <InfoTooltip
                              title={t('editor.desktop.config.step1.preview' as any) || 'Preview'}
                              content={t('editor.desktop.config.step1.previewInfo' as any) || 'These sections and documents are based on your product selection. Connecting a program (Step 2) will add program-specific sections.'}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {/* Sections Preview */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-white/70 font-semibold uppercase">
                                  {t('editor.desktop.selection.sectionsLabel' as any) || 'ABSCHNITTE'}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white/90">
                                {totalSectionsCount} {t('editor.desktop.config.step1.available' as any) || 'available'}
                              </div>
                            </div>
                            
                            {/* Documents Preview */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-white/70 font-semibold uppercase">
                                  {t('editor.desktop.selection.documentsLabel' as any) || 'DOKUMENTE'}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white/90">
                                {totalDocumentsCount} {t('editor.desktop.config.step1.available' as any) || 'available'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Success Message */}
                          <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-2.5">
                            <div className="flex items-start gap-2">
                              <span className="text-green-300 text-sm flex-shrink-0">✓</span>
                              <p className="text-xs text-white/90 leading-relaxed">
                                {t('editor.desktop.config.step1.complete' as any) || 'Product selected'} - {t('editor.desktop.config.step2.skipMessage' as any) || 'You can proceed to Step 3 to edit sections/documents now, or connect a program to add program-specific content.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Program Selection */}
                  {activeStep === 2 && (
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
                                setPendingProgram(null);
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
                  )}

                  {/* Step 3: Sections & Documents Management */}
                  {activeStep === 3 && (
                    <div className="mb-4 pb-2">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-sm font-bold text-white/90 uppercase">
                          {t('editor.desktop.config.step3.title' as any) || 'ABSCHNITTE & DOKUMENTE'}
                        </span>
                        <InfoTooltip
                          title={t('editor.desktop.config.step3.title' as any) || 'Abschnitte & Dokumente'}
                          content={t('editor.desktop.config.step3.description' as any) || 'Abschnitte und Dokumente werden automatisch basierend auf Ihrem Plan-Typ und verbundenem Programm generiert. Sie können sie anpassen.'}
                        />
                      </div>
                      
                      {/* Status Message based on program connection */}
                      {programSummary ? (
                        <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-2.5 mb-4">
                          <div className="flex items-start gap-2">
                            <span className="text-green-300 text-sm flex-shrink-0">✅</span>
                            <p className="text-xs text-white/90 leading-relaxed">
                              {t('editor.desktop.config.step3.editingWithProgram' as any) || 'Editing sections/documents with program-specific content.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-2.5 mb-4">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-300 text-sm flex-shrink-0">ℹ️</span>
                            <p className="text-xs text-white/90 leading-relaxed">
                              {t('editor.desktop.config.step3.editingWithoutProgram' as any) || 'Editing sections/documents. Connect a program in Step 2 to add program-specific content.'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <p className="text-sm text-white/80">
                          {t('editor.desktop.config.step3.description' as any) || 'Abschnitte und Dokumente werden automatisch basierend auf Ihrem Plan-Typ und verbundenem Programm generiert. Sie können sie anpassen.'}
                        </p>
                        
                        {/* Documents List - Moved above Sections */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-white/90 uppercase">
                              {t('editor.desktop.selection.documentsLabel' as any) || 'DOKUMENTE'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {enabledDocumentsCount}/{totalDocumentsCount}
                              </span>
                              {onToggleAddDocument && (
                                <button
                                  onClick={onToggleAddDocument}
                                  className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                  title={t('editor.desktop.documents.addButton' as any) || 'Add Document'}
                                >
                                  + {t('editor.desktop.documents.addButton' as any) || 'Add'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Add Document Form */}
                          {showAddDocument && onSetNewDocumentName && onSetNewDocumentDescription && onAddCustomDocument && (
                            <div className="mb-3 p-3 border border-blue-400/30 bg-blue-600/10 rounded-lg space-y-2">
                              <p className="text-xs text-white/90 font-semibold mb-2">
                                {t('editor.desktop.documents.custom.title' as any) || 'Ein benutzerdefiniertes Dokument zu Ihrem Plan hinzufügen'}
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[10px] text-white/70 block mb-1">
                                    {t('editor.desktop.documents.custom.name' as any) || 'Name *'}
                                  </label>
                                  <input
                                    type="text"
                                    value={newDocumentName}
                                    onChange={(e) => onSetNewDocumentName(e.target.value)}
                                    placeholder={t('editor.desktop.documents.custom.namePlaceholder' as any) || 'z.B. Finanzplan'}
                                    className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/70 block mb-1">
                                    {t('editor.desktop.documents.custom.description' as any) || 'Beschreibung'}
                                  </label>
                                  <textarea
                                    value={newDocumentDescription}
                                    onChange={(e) => onSetNewDocumentDescription(e.target.value)}
                                    placeholder={t('editor.desktop.documents.custom.descriptionPlaceholder' as any) || 'Optionale Beschreibung des Dokuments'}
                                    rows={2}
                                    className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={onAddCustomDocument}
                                  disabled={!newDocumentName.trim()}
                                  className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {t('editor.desktop.documents.custom.add' as any) || 'Hinzufügen'}
                                </button>
                                <button
                                  onClick={onToggleAddDocument}
                                  className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                  {t('editor.desktop.documents.custom.cancel' as any) || 'Abbrechen'}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {/* Core Product Document - Always shown first */}
                            {productType && selectedProductMeta && (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-600/10 border border-blue-400/20">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-base">{selectedProductMeta.icon || '📄'}</span>
                                  <span className="text-sm font-semibold text-white truncate">
                                    {selectedProductMeta.label}
                                  </span>
                                  <span className="text-xs text-white/60">(Core Product)</span>
                                </div>
                                <span className="text-xs text-green-400 font-semibold">✓ Always Active</span>
                              </div>
                            )}
                            
                            {/* Additional Documents */}
                            {allDocuments.length > 0 ? (
                              allDocuments.map((document) => {
                                const isDisabled = disabledDocuments.has(document.id);
                                const isCustom = document.origin === 'custom';
                                return (
                                  <div
                                    key={document.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="text-xs">
                                        {isDisabled ? '❌' : '✅'}
                                        {isCustom && ' ➕'}
                                      </span>
                                      <span className={`text-sm truncate ${isDisabled ? 'text-white/50' : 'text-white'}`}>
                                        {document.name}
                                      </span>
                                    </div>
                                    {onToggleDocument && (
                                      <button
                                        onClick={() => onToggleDocument(document.id)}
                                        className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                                          isDisabled
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                      >
                                        {isDisabled 
                                          ? (t('editor.desktop.sections.activate' as any) || 'Activate')
                                          : (t('editor.desktop.sections.deactivate' as any) || 'Deactivate')
                                        }
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            ) : !productType ? (
                              <p className="text-sm text-white/60 text-center py-4">
                                {t('editor.desktop.documents.emptyHint' as any) || 'Keine Dokumente verfügbar'}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Sections List */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-white/90 uppercase">
                              {t('editor.desktop.selection.sectionsLabel' as any) || 'ABSCHNITTE'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {enabledSectionsCount}/{totalSectionsCount}
                              </span>
                              {onToggleAddSection && (
                                <button
                                  onClick={onToggleAddSection}
                                  className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                  title={t('editor.desktop.sections.addButton' as any) || 'Add Section'}
                                >
                                  + {t('editor.desktop.sections.addButton' as any) || 'Add'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Add Section Form */}
                          {showAddSection && onSetNewSectionTitle && onSetNewSectionDescription && onAddCustomSection && (
                            <div className="mb-3 p-3 border border-blue-400/30 bg-blue-600/10 rounded-lg space-y-2">
                              <p className="text-xs text-white/90 font-semibold mb-2">
                                {t('editor.desktop.sections.custom.title' as any) || 'Ein benutzerdefinierter Abschnitt zu Ihrem Plan hinzufügen'}
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[10px] text-white/70 block mb-1">
                                    {t('editor.desktop.sections.custom.name' as any) || 'Titel *'}
                                  </label>
                                  <input
                                    type="text"
                                    value={newSectionTitle}
                                    onChange={(e) => onSetNewSectionTitle(e.target.value)}
                                    placeholder={t('editor.desktop.sections.custom.namePlaceholder' as any) || 'z.B. Zusammenfassung'}
                                    className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/70 block mb-1">
                                    {t('editor.desktop.sections.custom.description' as any) || 'Beschreibung'}
                                  </label>
                                  <textarea
                                    value={newSectionDescription}
                                    onChange={(e) => onSetNewSectionDescription(e.target.value)}
                                    placeholder={t('editor.desktop.sections.custom.descriptionPlaceholder' as any) || 'Optionale Beschreibung des Abschnitts'}
                                    rows={2}
                                    className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={onAddCustomSection}
                                  disabled={!newSectionTitle.trim()}
                                  className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {t('editor.desktop.sections.custom.add' as any) || 'Hinzufügen'}
                                </button>
                                <button
                                  onClick={onToggleAddSection}
                                  className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                  {t('editor.desktop.sections.custom.cancel' as any) || 'Abbrechen'}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(() => {
                              // Create special sections: METADATA, ANCILLARY (TOC), REFERENCES, APPENDICES
                              const metadataSection: SectionTemplate = {
                                id: METADATA_SECTION_ID,
                                title: t('editor.section.metadata' as any) || 'Title Page',
                                description: '',
                                required: true,
                                wordCountMin: 0,
                                wordCountMax: 0,
                                order: 0,
                                category: 'metadata',
                                prompts: [],
                                questions: [],
                                validationRules: { requiredFields: [], formatRequirements: [] },
                                origin: 'master'
                              };
                              
                              const ancillarySection: SectionTemplate = {
                                id: ANCILLARY_SECTION_ID,
                                title: t('editor.section.ancillary' as any) || 'Table of Contents',
                                description: 'Includes List of Tables and List of Figures',
                                required: false,
                                wordCountMin: 0,
                                wordCountMax: 0,
                                order: 1,
                                category: 'ancillary',
                                prompts: [],
                                questions: [],
                                validationRules: { requiredFields: [], formatRequirements: [] },
                                origin: 'master'
                              };
                              
                              const referencesSection: SectionTemplate = {
                                id: REFERENCES_SECTION_ID,
                                title: t('editor.section.references' as any) || 'References',
                                description: '',
                                required: false,
                                wordCountMin: 0,
                                wordCountMax: 0,
                                order: 9998,
                                category: 'references',
                                prompts: [],
                                questions: [],
                                validationRules: { requiredFields: [], formatRequirements: [] },
                                origin: 'master'
                              };
                              
                              const appendicesSection: SectionTemplate = {
                                id: APPENDICES_SECTION_ID,
                                title: t('editor.section.appendices' as any) || 'Appendices',
                                description: '',
                                required: false,
                                wordCountMin: 0,
                                wordCountMax: 0,
                                order: 9999,
                                category: 'appendices',
                                prompts: [],
                                questions: [],
                                validationRules: { requiredFields: [], formatRequirements: [] },
                                origin: 'master'
                              };
                              
                              // Combine: METADATA, ANCILLARY first, then regular sections, then REFERENCES, APPENDICES last
                              const sectionsToShow = [metadataSection, ancillarySection, ...allSections, referencesSection, appendicesSection];
                              
                              return sectionsToShow.length > 0 ? (
                                sectionsToShow.map((section) => {
                                  const isDisabled = disabledSections.has(section.id);
                                  const isCustom = section.origin === 'custom';
                                  const isSpecialSection = section.id === METADATA_SECTION_ID || section.id === ANCILLARY_SECTION_ID || section.id === REFERENCES_SECTION_ID || section.id === APPENDICES_SECTION_ID;
                                  
                                  return (
                                    <div
                                      key={section.id}
                                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors ${
                                        isSpecialSection ? 'bg-blue-600/10 border border-blue-400/20' : ''
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-xs">
                                          {isDisabled ? '❌' : '✅'}
                                          {isCustom && ' ➕'}
                                          {isSpecialSection && ' 📋'}
                                        </span>
                                        <span className={`text-sm truncate ${isDisabled ? 'text-white/50' : 'text-white'}`}>
                                          {section.title}
                                        </span>
                                      </div>
                                      {onToggleSection && (
                                        <button
                                          onClick={() => onToggleSection(section.id)}
                                          className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                                            isDisabled
                                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                              : 'bg-white/10 hover:bg-white/20 text-white'
                                          }`}
                                        >
                                          {isDisabled 
                                            ? (t('editor.desktop.sections.activate' as any) || 'Activate')
                                            : (t('editor.desktop.sections.deactivate' as any) || 'Deactivate')
                                          }
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-white/60 text-center py-4">
                                  {t('editor.desktop.sections.emptyHint' as any) || 'Keine Abschnitte verfügbar'}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
            
            {/* Sticky Footer with Confirm/Cancel Buttons */}
            <div className="sticky bottom-0 z-[10002] flex-shrink-0 flex items-center justify-end gap-3 px-4 py-3 border-t border-white/30 bg-slate-950/95 backdrop-blur-sm">
              <Button
                onClick={handleCancel}
                size="sm"
                variant="ghost"
                className="h-9 px-4 text-sm text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('editor.desktop.config.cancel' as any) || 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirm}
                size="sm"
                disabled={!canConfirm}
                className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('editor.desktop.config.confirmSelection' as any) || 'Confirm Selection'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Template Preview Dialog - Outside portal */}
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

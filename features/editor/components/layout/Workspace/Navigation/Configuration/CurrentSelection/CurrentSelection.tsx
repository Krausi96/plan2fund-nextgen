import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { type ProgressSummary } from '@/features/editor/lib/hooks/useEditorStore';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { ConnectCopy } from '@/features/editor/lib/types/editor/configurator';
import RequirementsDisplay from './RequirementsDisplay/RequirementsDisplay';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import SectionsDocumentsManagement from './SectionsDocumentsManagement/SectionsDocumentsManagement';

/**
 * CurrentSelection Component Props
 * 
 * This component orchestrates the 3-step configuration flow:
 * 1. Product Selection (submission/review/strategy)
 * 2. Program Selection (connect funding program)
 * 3. Sections & Documents Management
 * 
 * Props are organized into logical groups below for clarity.
 */
type CurrentSelectionProps = {
  // ========================================
  // Display Props (Collapsed View)
  // ========================================
  /** Product label to display in collapsed view */
  productLabel: string;
  /** Product icon/emoji to display */
  productIcon?: string;
  /** Program label to display in collapsed view */
  programLabel: string | null;
  /** Selected document name (if additional document is selected) */
  selectedDocumentName?: string | null;
  /** Count of enabled sections */
  enabledSectionsCount: number;
  /** Total count of sections */
  totalSectionsCount: number;
  /** Count of enabled documents */
  enabledDocumentsCount: number;
  /** Total count of documents */
  totalDocumentsCount: number;
  /** List of section titles for tooltip display */
  sectionTitles: string[];
  /** List of document titles for tooltip display */
  documentTitles: string[];

  // ========================================
  // Product Configuration (Step 1)
  // ========================================
  /** Currently selected product type */
  productType?: ProductType | null;
  /** Available product options for dropdown */
  productOptions?: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  /** Selected product metadata (label, description, icon) */
  selectedProductMeta?: { value: ProductType; label: string; description: string; icon?: string } | null;
  /** Callback when product selection changes */
  onChangeProduct?: (product: ProductType | null) => void;

  // ========================================
  // Program Configuration (Step 2)
  // ========================================
  /** Currently connected program summary */
  programSummary?: ProgramSummary | null;
  /** Error message if program connection failed */
  programError?: string | null;
  /** Loading state for program connection */
  programLoading?: boolean;
  /** Copy/text for program connection UI */
  connectCopy?: ConnectCopy;
  /** Callback when program connection changes */
  onConnectProgram?: (value: string | null) => void;
  /** Callback to open program finder */
  onOpenProgramFinder?: () => void;
  /** Callback when templates are extracted from uploaded file */
  onTemplatesExtracted?: (templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[] }) => void;

  // ========================================
  // Requirements Checker
  // ========================================
  /** Progress summary for requirements checker */
  progressSummary?: ProgressSummary[];
  /** Callback to run requirements check */
  onRunRequirementsCheck?: () => void;

  // ========================================
  // Overlay Configuration
  // ========================================
  /** Ref to overlay container for positioning */
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** External control of overlay open state */
  isOpen?: boolean;
  /** Callback when overlay open state changes */
  onOverlayOpenChange?: (isOpen: boolean) => void;

  // ========================================
  // Sections Management (Step 3)
  // ========================================
  /** All available sections */
  allSections?: SectionTemplate[];
  /** Set of disabled section IDs */
  disabledSections?: Set<string>;
  /** Callback to toggle section enabled/disabled */
  onToggleSection?: (sectionId: string) => void;

  // ========================================
  // Documents Management (Step 3)
  // ========================================
  /** All available documents */
  allDocuments?: DocumentTemplate[];
  /** Set of disabled document IDs */
  disabledDocuments?: Set<string>;
  /** Callback to toggle document enabled/disabled */
  onToggleDocument?: (documentId: string) => void;

  // ========================================
  // Add Custom Items (Step 3)
  // ========================================
  /** Whether add document form is visible */
  showAddDocument?: boolean;
  /** Whether add section form is visible */
  showAddSection?: boolean;
  /** New document name input value */
  newDocumentName?: string;
  /** New document description input value */
  newDocumentDescription?: string;
  /** New section title input value */
  newSectionTitle?: string;
  /** New section description input value */
  newSectionDescription?: string;
  /** Callback to toggle add document form */
  onToggleAddDocument?: () => void;
  /** Callback to toggle add section form */
  onToggleAddSection?: () => void;
  /** Callback to add custom document */
  onAddCustomDocument?: () => void;
  /** Callback to add custom section */
  onAddCustomSection?: () => void;
  /** Callback to set new document name */
  onSetNewDocumentName?: (name: string) => void;
  /** Callback to set new document description */
  onSetNewDocumentDescription?: (desc: string) => void;
  /** Callback to set new section title */
  onSetNewSectionTitle?: (title: string) => void;
  /** Callback to set new section description */
  onSetNewSectionDescription?: (desc: string) => void;
};

/**
 * CurrentSelection Component (Orchestrator)
 * 
 * Main orchestrator component for the 3-step configuration flow.
 * Manages state, change tracking, overlay positioning, and coordinates step components.
 * 
 * Key Responsibilities:
 * - Change tracking (pending/original state for confirm/cancel)
 * - Overlay positioning (covers CurrentSelection, DocumentsBar, and Sidebar)
 * - Step navigation (activeStep state)
 * - Template preview dialog
 * - Coordinating step components (ProductSelection, ProgramSelection, SectionsDocumentsManagement)
 * 
 * @component
 */
export default function CurrentSelection({
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
  // Overlay state control
  isOpen: externalIsOpen,
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
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  
  // Use external control if provided, otherwise use internal state
  const isExpanded = externalIsOpen !== undefined ? externalIsOpen : internalIsExpanded;
  const setIsExpanded = externalIsOpen !== undefined 
    ? (value: boolean) => {
        // When externally controlled, just notify parent
        onOverlayOpenChange?.(value);
      }
    : setInternalIsExpanded;
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayPosition, setOverlayPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  // ========================================
  // State Management
  // ========================================
  
  /** Track if component is mounted to prevent hydration mismatches */
  const isMountedRef = useRef(false);
  
  /**
   * Change tracking for confirm/cancel functionality
   * - pendingProduct/pendingProgram: Unconfirmed changes (user made but not confirmed)
   * - originalProduct/originalProgram: Original values for cancel (revert to these)
   * Initialize with undefined/null to avoid hydration mismatches, sync with props after mount
   */
  const [pendingProduct, setPendingProduct] = useState<ProductType | undefined>(undefined);
  const [pendingProgram, setPendingProgram] = useState<string | null>(null);
  const [originalProduct, setOriginalProduct] = useState<ProductType | undefined>(undefined);
  const [originalProgram, setOriginalProgram] = useState<string | null>(null);
  
  // Sync state with props after mount to prevent hydration issues
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      // Set initial values from props only after mount
      setPendingProduct(productType ?? undefined);
      setPendingProgram(programSummary?.id || null);
      setOriginalProduct(productType ?? undefined);
      setOriginalProgram(programSummary?.id || null);
    }
  }, []); // Only run once on mount
  
  // Sync state with props when they change (but only after mount and when configurator is closed)
  useEffect(() => {
    if (isMountedRef.current && !isExpanded) {
      // Only sync when configurator is closed to avoid disrupting user changes
      setPendingProduct(productType ?? undefined);
      setPendingProgram(programSummary?.id || null);
      setOriginalProduct(productType ?? undefined);
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
  // Manual input state moved to ProgramSelection component
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [extractedTemplates, setExtractedTemplates] = useState<{ sections?: SectionTemplate[]; documents?: DocumentTemplate[]; errors?: string[] } | null>(null);

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

  /**
   * Calculate overlay position - rectangle covering CurrentSelection, DocumentsBar, and top of Sidebar
   * 
   * Overlay covers:
   * - All of CurrentSelection (Row 1, Col 1) - 320px wide
   * - All of DocumentsBar (Row 1, Col 2) - remaining width
   * - Top portion of Sidebar (Row 2, Col 1) - same width as CurrentSelection, extends down
   * 
   * This positioning logic stays in orchestrator because it needs access to multiple refs
   * and is orchestrator-level concern.
   */
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
      
      // Height: Use a fixed height range for the overlay (not dependent on container height)
      // The overlay should be large enough to show configurator content regardless of container state
      // Use grid height as base, but ensure reasonable bounds for good UX
      const minOverlayHeight = 600; // Minimum height for overlay content
      const maxOverlayHeight = 800; // Maximum height for overlay
      const preferredHeight = gridRect.height * 0.8; // 80% of grid height
      // Use preferred height, but clamp between min and max
      const height = Math.max(minOverlayHeight, Math.min(maxOverlayHeight, preferredHeight));
      
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
      setOriginalProduct(productType ?? undefined);
      setOriginalProgram(programSummary?.id || null);
      setPendingProduct(productType ?? undefined);
      setPendingProgram(programSummary?.id || null);
      // Intelligently determine which step to show based on current state:
      // - No product → Step 1 (Product Selection)
      // - Product but no program → Step 2 (Program Selection)
      // - Product and program → Step 3 (Sections & Documents)
      // This provides better UX when editing existing configuration
      let initialStep: 1 | 2 | 3 = 1;
      if (productType) {
        if (programSummary?.id) {
          initialStep = 3; // Product and program selected → show sections/documents
        } else {
          initialStep = 2; // Product selected but no program → show program selection
        }
      }
      setActiveStep(initialStep);
      wasExpandedRef.current = true;
    } else if (!isExpanded) {
      // Configurator closed - reset the ref
      wasExpandedRef.current = false;
    } else if (isExpanded && wasExpandedRef.current) {
      // Configurator is open and was already open - only update pending state if props changed
      // Don't reset activeStep to avoid disrupting user navigation
      setPendingProduct(productType ?? undefined);
      setPendingProgram(programSummary?.id || null);
    }
  }, [isExpanded, productType, programSummary?.id]);
  
  /**
   * Handle confirm - apply changes
   * Note: Most changes are already applied immediately for better UX.
   * This just closes the configurator.
   */
  const handleConfirm = () => {
    // Product changes are applied immediately via onChangeProduct
    // Program changes are applied immediately via onConnectProgram
    // Just close the configurator
    setIsExpanded(false);
  };
  
  /**
   * Handle cancel - revert changes
   * Reverts pending changes back to original values and closes configurator.
   */
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

  // Configurator is available if we have productOptions and onChangeProduct (even if productType is null)
  const hasConfigurator = productOptions && onChangeProduct;
  
  // Determine if user has made selections
  // Show "Start" for new users (no product selected)
  // Show "Edit" when user has selected a product (even if no program/sections yet)
  // This allows preview to start immediately after product selection
  const hasMadeSelections = !!productType;

  // DesktopConfigurator handlers (merged)
  // handleSelectProduct moved to ProductSelection component
  const handleProductChange = (product: ProductType | null) => {
    setPendingProduct(product ?? undefined);
    // Apply immediately for better UX (user sees changes right away)
    onChangeProduct?.(product);
    // Don't auto-advance - let user manually navigate between steps
  };

  // handleManualConnect and handleTemplateUpload moved to ProgramSelection component
  const handleProgramConnect = (value: string | null) => {
    setPendingProgram(value);
    onConnectProgram?.(value);
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

  // Product menu positioning moved to ProductSelection component
  // Manual input positioning moved to ProgramSelection component

  // InfoTooltip is now imported from RequirementsDisplay component

  // When overlay is shown, always keep container in collapsed state
  // The expanded content is shown in the overlay portal, not in the container
  const hasOverlay = !!overlayContainerRef;
  const shouldShowCollapsed = !isExpanded || hasOverlay;
  
  return (
    <div ref={containerRef} className="flex flex-col border-r border-white/10 pr-4 h-full min-h-0" style={{ position: 'relative', zIndex: isExpanded ? 10 : 0, overflow: isExpanded ? 'hidden' : 'visible' }}>
      <div className="flex-shrink-0 mb-2 border-b border-white/50 flex items-center justify-between pb-2 gap-2">
        <h2 className="text-lg font-bold uppercase tracking-wide text-white flex-1">
          {selectionCurrentLabel}
        </h2>
        {shouldShowCollapsed && hasConfigurator && (
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
                <span className="mr-1">📝</span>
                {t('editor.desktop.selection.start' as any) || 'Start'}
              </>
            )}
          </Button>
        )}
        {!shouldShowCollapsed && hasConfigurator && (
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
      
      {shouldShowCollapsed ? (
        /* Collapsed State - Compact but Readable, Matches DocumentsBar Height */
        <div className="flex flex-col rounded-lg border border-white/30 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975 px-3 py-3 text-white shadow-[0_10px_25px_rgba(6,10,24,0.6)] backdrop-blur w-full" style={{ minHeight: 'fit-content' }}>
          {/* Current Selection Summary - Compact but Readable */}
          <div className="flex flex-col gap-2.5 w-full">
            {/* Product & Program - Allow wrapping for full names */}
            <div className="flex items-start gap-3 min-w-0">
              {productIcon && (
                <span className="text-base leading-none flex-shrink-0 mt-0.5">{productIcon}</span>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-1">Plan</span>
                <span className="text-white font-semibold text-xs block leading-snug break-words line-clamp-2" title={productLabel}>
                  {productLabel}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white/70 text-[9px] font-semibold uppercase tracking-wide block leading-tight mb-1">{programLabelCopy}</span>
                <span className="text-white/90 font-medium text-xs block leading-snug break-words line-clamp-2" title={programLabel || noProgramCopy}>
                  {programLabel || noProgramCopy}
                </span>
              </div>
            </div>
            
            {/* Selected Document Indicator - Show when additional document is selected */}
            {selectedDocumentName && (
              <div className="flex items-center gap-2 pt-1.5 border-t border-white/30">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight">Document</span>
                <span className="text-white/90 font-medium text-xs break-words line-clamp-1" title={selectedDocumentName}>
                  📄 {selectedDocumentName}
                </span>
              </div>
            )}
            
            {/* Sections & Documents - Single Row with matching separation line */}
            <div className="flex items-center gap-4 pt-2 border-t border-white/50">
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight">{sectionsLabel}</span>
                <span className="font-bold text-white text-xs">{enabledSectionsCount}/{totalSectionsCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-[8px] font-semibold uppercase tracking-wide leading-tight">{documentsLabel}</span>
                <span className="font-bold text-white text-xs">{enabledDocumentsCount}/{totalDocumentsCount}</span>
              </div>
            </div>

            {/* Requirements Checker Stats - Ultra Compact Single Line */}
            {requirementsStats.total > 0 && (
              <RequirementsDisplay
                requirementsStats={requirementsStats}
                variant="collapsed"
              />
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
            <RequirementsDisplay
              requirementsStats={requirementsStats}
              variant="expanded-base"
            />
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
                <RequirementsDisplay
                  requirementsStats={requirementsStats}
                  onRunRequirementsCheck={onRunRequirementsCheck}
                  variant="expanded-overlay"
                />

                {/* Configurator Content - Show based on active step */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  {/* Step 1: Product Selection */}
                  {activeStep === 1 && (
                    <ProductSelection
                      productType={productType ?? undefined}
                      productOptions={productOptions}
                      selectedProductMeta={selectedProductMeta}
                      pendingProduct={pendingProduct}
                      totalSectionsCount={totalSectionsCount}
                      totalDocumentsCount={totalDocumentsCount}
                      onChangeProduct={handleProductChange}
                    />
                  )}

                  {/* Step 2: Program Selection */}
                  {activeStep === 2 && (
                    <ProgramSelection
                      programSummary={programSummary}
                      programError={programError}
                      programLoading={programLoading}
                      pendingProgram={pendingProgram}
                      connectCopy={connectCopy}
                      onConnectProgram={handleProgramConnect}
                      onOpenProgramFinder={onOpenProgramFinder}
                      onTemplatesExtracted={onTemplatesExtracted}
                      onShowTemplatePreview={setShowTemplatePreview}
                      onSetExtractedTemplates={setExtractedTemplates}
                    />
                  )}

                  {/* Step 3: Sections & Documents Management */}
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

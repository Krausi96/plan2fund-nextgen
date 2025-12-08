import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorActions, useEditorStore } from './useEditorStore';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';

export function useProductSelection(
  initialProduct: ProductType | null,
  programSummary: ProgramSummary | null,
  isConfiguratorOpen: boolean
) {
  const { hydrate, setProductType } = useEditorActions((actions) => ({
    hydrate: actions.hydrate,
    setProductType: actions.setProductType
  }));

  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(initialProduct);
  const [pendingProductChange, setPendingProductChange] = useState<ProductType | null>(null);
  const hydrationInProgress = useRef(false);

  useEffect(() => {
    setSelectedProduct(initialProduct);
  }, [initialProduct]);

  const applyHydration = useCallback(
    async (summary: ProgramSummary | null, options?: {
      disabledSectionIds: string[];
      disabledDocumentIds: string[];
      customSections?: any[];
      customDocuments?: any[];
    }) => {
      // The hydrate function now automatically preserves documentSections and documentTitlePages
      // from the existing plan, so we don't need to pass them explicitly
      const fundingType = summary?.fundingType ?? 'grants';
      await hydrate(selectedProduct, {
        fundingType,
        programId: summary?.id,
        programName: summary?.name,
        summary: summary ?? undefined,
        disabledSectionIds: options?.disabledSectionIds,
        disabledDocumentIds: options?.disabledDocumentIds,
        customSections: options?.customSections,
        customDocuments: options?.customDocuments
      });
    },
    [hydrate, selectedProduct]
  );

  // Hydrate plan when product/program is selected (but allow overview to show)
  // IMPORTANT: Don't hydrate if configurator overlay is open - wait until it closes
  useEffect(() => {
    if (selectedProduct && typeof window !== 'undefined' && !hydrationInProgress.current && !isConfiguratorOpen) {
      const currentPlan = useEditorStore.getState().plan;
      // Only hydrate if plan doesn't exist or product type changed
      const needsHydration = !currentPlan || currentPlan.productType !== selectedProduct;
      
      if (needsHydration) {
        hydrationInProgress.current = true;
        console.log('[useProductSelection] Triggering hydration', { selectedProduct, hasProgram: !!programSummary, isConfiguratorOpen, hasPlan: !!currentPlan });
        // Call with empty options initially - will be updated when template state changes
        applyHydration(programSummary, {
          disabledSectionIds: [],
          disabledDocumentIds: []
        }).then(() => {
          console.log('[useProductSelection] Hydration completed successfully');
          hydrationInProgress.current = false;
        }).catch((err) => {
          console.error('[useProductSelection] Hydration error:', err);
          hydrationInProgress.current = false;
        });
      } else {
        console.log('[useProductSelection] Skipping hydration - plan already exists with correct product type');
      }
    } else {
      console.log('[useProductSelection] Skipping hydration', { 
        selectedProduct, 
        hasWindow: typeof window !== 'undefined',
        hydrationInProgress: hydrationInProgress.current,
        isConfiguratorOpen 
      });
    }
  }, [applyHydration, programSummary, selectedProduct, isConfiguratorOpen]);

  // Apply pending changes when configurator closes
  useEffect(() => {
    if (!isConfiguratorOpen && pendingProductChange) {
      const productToApply = pendingProductChange;
      console.log('[useProductSelection] Applying pending product change', { productToApply });
      setSelectedProduct(productToApply);
      setProductType(productToApply);
      setPendingProductChange(null);
      // Reset hydration flag to allow immediate hydration
      // The main hydration effect will trigger when selectedProduct changes and configurator is closed
      hydrationInProgress.current = false;
    }
  }, [isConfiguratorOpen, pendingProductChange, setProductType]);

  const handleProductChange = useCallback(
    (next: ProductType | null) => {
      // If configurator is open, store as pending change (don't hydrate yet)
      if (isConfiguratorOpen) {
        setPendingProductChange(next);
        // Still update the UI state for immediate feedback
        setSelectedProduct(next);
        if (next) {
          setProductType(next);
        }
      } else {
        // If configurator is closed, apply immediately
        setSelectedProduct(next);
        if (next) {
          setProductType(next);
        }
      }
    },
    [setProductType, isConfiguratorOpen]
  );

  const handleTemplateUpdate = useCallback((options: {
    disabledSectionIds: string[];
    disabledDocumentIds: string[];
    customSections?: any[];
    customDocuments?: any[];
  }) => {
    const isLoading = useEditorStore.getState().isLoading;
    // Only update if we have a plan or are not currently loading
    // This prevents infinite loops
    if (isLoading || hydrationInProgress.current) {
      console.log('[useProductSelection] Skipping template update - still loading');
      return;
    }
    
    hydrationInProgress.current = true;
    
    // Update hydration with new disabled sections/documents and custom templates
    applyHydration(programSummary, {
      disabledSectionIds: options.disabledSectionIds,
      disabledDocumentIds: options.disabledDocumentIds,
      customSections: options.customSections,
      customDocuments: options.customDocuments
    }).catch((err) => {
      console.error('[useProductSelection] Template update error:', err);
      hydrationInProgress.current = false;
    }).then(() => {
      // Reset after a delay to allow for updates
      setTimeout(() => {
        hydrationInProgress.current = false;
      }, 500);
    });
  }, [applyHydration, programSummary]);

  return {
    selectedProduct,
    handleProductChange,
    handleTemplateUpdate,
    applyHydration,
    hydrationInProgress
  };
}


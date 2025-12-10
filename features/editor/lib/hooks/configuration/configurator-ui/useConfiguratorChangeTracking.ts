import { useState, useEffect, useRef, useMemo } from 'react';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';

/**
 * Hook for tracking pending changes in configurator (for confirm/cancel functionality)
 */
export function useConfiguratorChangeTracking(
  productType: ProductType | undefined | null,
  programSummary: ProgramSummary | null,
  isExpanded: boolean
) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  // Initialize pending state when configurator opens
  const wasExpandedRef = useRef(false);
  
  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      // First time opening - initialize state
      setOriginalProduct(productType ?? undefined);
      setOriginalProgram(programSummary?.id || null);
      setPendingProduct(productType ?? undefined);
      setPendingProgram(programSummary?.id || null);
      wasExpandedRef.current = true;
    } else if (!isExpanded) {
      // Configurator closed - reset the ref
      wasExpandedRef.current = false;
    } else if (isExpanded && wasExpandedRef.current) {
      // Configurator is open and was already open - only update pending state if props changed
      setPendingProduct(productType ?? undefined);
      setPendingProgram(programSummary?.id || null);
    }
  }, [isExpanded, productType, programSummary?.id]);
  
  return {
    pendingProduct,
    pendingProgram,
    originalProduct,
    originalProgram,
    hasChanges,
    canConfirm,
    setPendingProduct,
    setPendingProgram
  };
}


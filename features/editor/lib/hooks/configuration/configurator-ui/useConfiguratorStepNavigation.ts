import { useState, useEffect, useRef } from 'react';
import type { ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';

/**
 * Hook for managing step navigation in configurator
 * Intelligently determines which step to show based on current state
 */
export function useConfiguratorStepNavigation(
  productType: ProductType | undefined | null,
  programSummary: ProgramSummary | null,
  isExpanded: boolean
) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const wasExpandedRef = useRef(false);
  
  // Initialize step when configurator opens
  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
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
    }
    // Don't reset activeStep when configurator is already open to avoid disrupting user navigation
  }, [isExpanded, productType, programSummary?.id]);
  
  return {
    activeStep,
    setActiveStep
  };
}


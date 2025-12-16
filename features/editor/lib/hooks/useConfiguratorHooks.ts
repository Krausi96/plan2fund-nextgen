/**
 * ============================================================================
 * CONFIGURATOR UI HOOKS
 * ============================================================================
 * 
 * These hooks handle configurator overlay positioning, change tracking, and step navigation.
 * The configurator is the overlay UI for selecting products and programs.
 * 
 * WHAT IT DOES:
 *   - Calculates overlay position for configurator UI
 *   - Tracks pending changes before applying them
 *   - Manages step navigation in multi-step configurator flows
 * 
 * USED BY:
 *   - CurrentSelection.tsx - Main configurator component
 *   - ProductSelection.tsx - Product selection step
 *   - ProgramSelection.tsx - Program selection step
 *   - SectionsDocumentsManagement.tsx - Sections/documents management step
 * 
 * HOOKS:
 *   1. useConfiguratorOverlayPosition - Calculates overlay position based on trigger element
 *   2. useConfiguratorChangeTracking - Tracks pending product/program changes
 *   3. useConfiguratorStepNavigation - Manages step navigation (1, 2, 3)
 * ============================================================================
 */

import { useState, useEffect } from 'react';

/**
 * Hook to calculate overlay position for configurator
 */
export function useConfiguratorOverlayPosition(
  isExpanded: boolean,
  containerRef: React.RefObject<HTMLDivElement>,
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>
) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isExpanded || !containerRef.current) {
      setPosition(null);
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    setPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [isExpanded, containerRef, overlayContainerRef]);

  return position;
}

/**
 * Hook to track pending changes in configurator
 */
export function useConfiguratorChangeTracking(
  productType: string | null,
  programSummary: any | null,
  isExpanded: boolean
) {
  const [pendingProduct, setPendingProduct] = useState<string | undefined>(undefined);
  const [pendingProgram, setPendingProgram] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (isExpanded) {
      setPendingProduct(productType || undefined);
      setPendingProgram(programSummary || undefined);
    } else {
      setPendingProduct(undefined);
      setPendingProgram(undefined);
    }
  }, [isExpanded, productType, programSummary]);

  return { pendingProduct, pendingProgram };
}

/**
 * Hook for configurator step navigation
 */
export function useConfiguratorStepNavigation() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
  };
}

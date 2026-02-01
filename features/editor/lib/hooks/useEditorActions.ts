/**
 * ============================================================================
 * EDITOR STORE ACTION HOOKS
 * ============================================================================
 * 
 * HOOKS:
 *   1. useEditorActions<T>(selector) - Get store actions via selector
 *      Example: useEditorActions(a => ({ setPlan: a.setPlan, setError: a.setError }))
 *   2. useEscapeKeyHandler(isActive, handler) - Handle Escape key press
 * 
 * ACTIONS AVAILABLE:
 *   - Plan: setPlan, setIsLoading, setError
 *   - Navigation: setActiveSectionId
 *   - Product/Program: setSelectedProduct, setProgramSummary, etc.
 *   - UI: setIsConfiguratorOpen
 *   - Templates: setDisabledSectionIds, setAllSections, etc.
 *   - Forms: setShowAddSection, setNewSectionTitle, etc.
 *   - Expansion: setExpandedSectionId, setExpandedDocumentId
 *   - Editing: setEditingSection, setEditingDocument
 *   - Helpers: resetFormState, syncTemplateStateFromPlan
 * ============================================================================
 */

import { useEditorStore } from '../store/editorStore';
import { useEffect } from 'react';

/**
 * Hook to access editor actions
 * Returns all store actions
 */
export function useEditorActions<T>(selector: (actions: any) => T): T {
  return useEditorStore((state) => {
    // Extract all action methods from the store
    const actions: any = {
      // Store actions
      setPlan: state.setPlan,
      setIsLoading: state.setIsLoading,
      setError: state.setError,
      updateSection: state.updateSection,
      addCustomSection: state.addCustomSection,
      removeCustomSection: state.removeCustomSection,
      setActiveSectionId: state.setActiveSectionId,
      setSelectedProduct: state.setSelectedProduct,
      setProgramSummary: state.setProgramSummary,
      setProgramLoading: state.setProgramLoading,
      setProgramError: state.setProgramError,
      setIsConfiguratorOpen: state.setIsConfiguratorOpen,
      setDisabledSectionIds: state.setDisabledSectionIds,
      setDisabledDocumentIds: state.setDisabledDocumentIds,
      setCustomSections: state.setCustomSections,
      setCustomDocuments: state.setCustomDocuments,
      setAllSections: state.setAllSections,
      setAllDocuments: state.setAllDocuments,
      setShowAddSection: state.setShowAddSection,
      setShowAddDocument: state.setShowAddDocument,
      setNewSectionTitle: state.setNewSectionTitle,
      setNewDocumentName: state.setNewDocumentName,
      setExpandedSectionId: state.setExpandedSectionId,
      setExpandedDocumentId: state.setExpandedDocumentId,
      setEditingSection: state.setEditingSection,
      setEditingDocument: state.setEditingDocument,
      setClickedDocumentId: state.setClickedDocumentId,
      // Setup Wizard Actions
      setSetupWizardStep: state.setSetupWizardStep,
      setProjectProfile: state.setProjectProfile,
      setProgramProfile: state.setProgramProfile,
      setDocumentTemplateId: state.setDocumentTemplateId,
      setDocumentStructure: state.setDocumentStructure,
      setSetupStatus: state.setSetupStatus,
      setSetupDiagnostics: state.setSetupDiagnostics,
      setInferredProductType: state.setInferredProductType,
      completeSetupWizard: state.completeSetupWizard,
      resetSetupWizard: state.resetSetupWizard,
      resetFormState: state.resetFormState,
      syncTemplateStateFromPlan: state.syncTemplateStateFromPlan,
    };
    return selector(actions);
  });
}

/**
 * Hook to handle Escape key press
 */
export function useEscapeKeyHandler(isActive: boolean, handler: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isActive, handler]);
}

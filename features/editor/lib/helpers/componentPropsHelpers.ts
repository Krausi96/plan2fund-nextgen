// ========= COMPONENT PROPS HELPERS =========
// Helper functions for preparing component props
// These replace "fake hooks" that were just useMemo wrappers
//
// NOTE: These helpers extract props from Editor's templateState and context.
// All values come from the parent Editor component - these are just prop mappers.

import type { BusinessPlan, ProductType } from '@/features/editor/lib/types/plan';
import type { TemplateState } from '@/features/editor/lib/hooks/configuration/template-configuration/useTemplateConfigurationState';
import { METADATA_SECTION_ID, isMetadataSection } from '@/features/editor/lib/hooks/useEditorStore';
import { createEditorContext, createDocumentContext } from './editorContextHelpers';
import { extractTemplateHandlers, extractSectionTemplateState, extractDocumentTemplateState } from './templateHandlersHelpers';

/**
 * Prepare props for PreviewWorkspace component
 * Replaces usePreview hook (was just a useMemo wrapper)
 */
export function preparePreviewProps(
  plan: BusinessPlan | null,
  documentPlan: BusinessPlan | null,
  activeSectionId: string | null,
  editingSectionId: string | null,
  disabledSections: Set<string>,
  clickedDocumentId: string | null,
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>,
  selectedProduct: ProductType | null,
  updateTitlePage: (titlePage: any) => void,
  updateAncillary: (updates: Partial<any>) => void,
  addReference: (reference: any) => void,
  updateReference: (reference: any) => void,
  deleteReference: (referenceId: string) => void,
  addAppendix: (item: any) => void,
  updateAppendix: (item: any) => void,
  deleteAppendix: (appendixId: string) => void,
  handleSectionSelect: (sectionId: string, source: 'user' | 'scroll' | 'preview') => void,
  setEditingSectionId: (id: string | null) => void,
  setActiveQuestion: (id: string) => void,
  setIsConfiguratorOpen: (open: boolean) => void
) {
  const currentPlan = documentPlan || plan;
  // Use shared context helpers to avoid duplicate calls
  const editorContext = createEditorContext(productOptions, selectedProduct);
  const documentContext = createDocumentContext(plan, clickedDocumentId);

  return {
    plan: currentPlan,
    focusSectionId: activeSectionId,
    editingSectionId,
    disabledSections,
    onSectionClick: (sectionId: string) => {
      if (!currentPlan) return; // Early return for new users
      
      const isMetadataSectionCheck = isMetadataSection(sectionId);
      
      if (isMetadataSectionCheck) {
        handleSectionSelect(sectionId, 'preview');
        setEditingSectionId(sectionId);
        setTimeout(() => {
          const scrollContainer = document.getElementById('preview-scroll-container');
          const element = scrollContainer?.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        const sectionToEdit = currentPlan.sections.find(s => s.id === sectionId);
        if (sectionToEdit) {
          handleSectionSelect(sectionId, 'preview');
          setEditingSectionId(sectionId);
          if (sectionToEdit.questions[0]?.id) {
            setActiveQuestion(sectionToEdit.questions[0].id);
          }
        }
      }
    },
    onTitlePageChange: updateTitlePage,
    onAncillaryChange: updateAncillary,
    onReferenceAdd: addReference,
    onReferenceUpdate: updateReference,
    onReferenceDelete: deleteReference,
    onAppendixAdd: addAppendix,
    onAppendixUpdate: updateAppendix,
    onAppendixDelete: deleteAppendix,
    selectedProductMeta: editorContext.selectedProductMeta,
    selectedDocumentName: documentContext.selectedDocumentName,
    isNewUser: !plan,
    onOpenConfigurator: () => setIsConfiguratorOpen(true)
  };
}

/**
 * Prepare props for Sidebar component
 * Replaces useSidebar hook (was just a useMemo wrapper)
 */
export function prepareSidebarProps(
  plan: BusinessPlan | null,
  activeSectionId: string | null,
  handleSectionSelect: (sectionId: string, source: 'user' | 'scroll' | 'preview') => void,
  clickedDocumentId: string | null,
  filteredSectionIds: string[] | null,
  templateState: TemplateState | null,
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>,
  selectedProduct: ProductType | null,
  programSummary: { name: string; amountRange?: string | null } | null
) {
  // Use shared context helpers to avoid duplicate calls
  const editorContext = createEditorContext(productOptions, selectedProduct);
  
  // Calculate filtered section IDs for document-specific views
  const computedFilteredSectionIds = plan && clickedDocumentId
    ? (() => {
        const documentContext = createDocumentContext(plan, clickedDocumentId);
        return [METADATA_SECTION_ID, ...documentContext.documentSections.map(s => s.id)];
      })()
    : filteredSectionIds;

  // Extract template state and handlers using shared helpers
  const sectionState = extractSectionTemplateState(templateState);
  const handlers = extractTemplateHandlers(templateState);

  return {
    plan,
    activeSectionId: activeSectionId ?? null,
    onSelectSection: (sectionId: string) => handleSectionSelect(sectionId, 'user'),
    filteredSectionIds: computedFilteredSectionIds,
    // Section template state (from parent Editor via templateState)
    filteredSections: clickedDocumentId ? [] : sectionState.filteredSections,
    allSections: clickedDocumentId ? [] : sectionState.allSections,
    disabledSections: sectionState.disabledSections,
    expandedSectionId: sectionState.expandedSectionId,
    editingSection: sectionState.editingSection,
    showAddSection: sectionState.showAddSection,
    newSectionTitle: sectionState.newSectionTitle,
    newSectionDescription: sectionState.newSectionDescription,
    // Section handlers (from parent Editor via templateState)
    onToggleSection: handlers.onToggleSection,
    onEditSection: handlers.onEditSection,
    onSaveSection: handlers.onSaveSection,
    onCancelEdit: handlers.onCancelEdit,
    onToggleAddSection: handlers.onToggleAddSection,
    onAddCustomSection: handlers.onAddCustomSection,
    onSetNewSectionTitle: handlers.onSetNewSectionTitle,
    onSetNewSectionDescription: handlers.onSetNewSectionDescription,
    onRemoveCustomSection: handlers.onRemoveCustomSection,
    getOriginBadge: handlers.getOriginBadge,
    // Editor context (from parent Editor)
    selectedProductMeta: editorContext.selectedProductMeta,
    programSummary,
    selectedProduct: editorContext.selectedProduct,
    isNewUser: !plan
  };
}

/**
 * Prepare props for DocumentsBar component
 * Replaces useDocuments hook (was just a useMemo wrapper)
 */
export function prepareDocumentsProps(
  templateState: TemplateState | null,
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>,
  selectedProduct: ProductType | null,
  plan: any
) {
  if (!templateState) return null;

  // Use shared context helpers to avoid duplicate calls
  const editorContext = createEditorContext(productOptions, selectedProduct);
  const documentState = extractDocumentTemplateState(templateState);
  const handlers = extractTemplateHandlers(templateState);

  return {
    // Document template state (from parent Editor via templateState)
    filteredDocuments: documentState.filteredDocuments,
    disabledDocuments: documentState.disabledDocuments,
    enabledDocumentsCount: documentState.enabledDocumentsCount,
    expandedDocumentId: documentState.expandedDocumentId,
    editingDocument: documentState.editingDocument,
    clickedDocumentId: documentState.clickedDocumentId,
    showAddDocument: documentState.showAddDocument,
    newDocumentName: documentState.newDocumentName,
    newDocumentDescription: documentState.newDocumentDescription,
    // Document handlers (from parent Editor via templateState)
    onToggleDocument: handlers.onToggleDocument,
    onSelectDocument: handlers.onSelectDocument,
    onEditDocument: handlers.onEditDocument,
    onSaveDocument: handlers.onSaveDocument,
    onCancelEdit: handlers.onCancelEdit,
    onToggleAddDocument: handlers.onToggleAddDocument,
    onAddCustomDocument: handlers.onAddCustomDocument,
    onSetNewDocumentName: handlers.onSetNewDocumentName,
    onSetNewDocumentDescription: handlers.onSetNewDocumentDescription,
    onRemoveCustomDocument: handlers.onRemoveCustomDocument,
    getOriginBadge: handlers.getOriginBadge,
    // Editor context (from parent Editor)
    selectedProductMeta: editorContext.selectedProductMeta,
    isNewUser: !plan
  };
}


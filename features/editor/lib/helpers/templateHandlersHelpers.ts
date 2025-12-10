// ========= TEMPLATE HANDLERS HELPERS =========
// Helper functions for extracting template state handlers
// These eliminate duplicate handler extraction patterns across components

import type { TemplateState } from '@/features/editor/lib/hooks/configuration/template-configuration/useTemplateConfigurationState';
import React from 'react';

/**
 * Extract all template handlers from TemplateState
 * Used by Sidebar, DocumentsBar, and Config components
 * This eliminates duplicate handler extraction code
 * Returns no-op handlers when templateState is null
 */
export function extractTemplateHandlers(templateState: TemplateState | null): TemplateState['handlers'] {
  // No-op handlers for when templateState is null
  const noop = () => {};
  const noopWithId = (_id: string) => {};
  const noopWithDocId = (_docId: string | null) => {};
  const noopEditSection = (_section: any, _e: React.MouseEvent) => {};
  const noopEditDocument = (_doc: any, _e: React.MouseEvent) => {};
  const noopSave = (_item: any) => {};
  const noopSetString = (_str: string) => {};
  const noopBadge = () => null;

  if (!templateState) {
    return {
      // Section handlers
      onToggleSection: noopWithId,
      onEditSection: noopEditSection,
      onSaveSection: noopSave,
      onCancelEdit: noop,
      onToggleAddSection: noop,
      onAddCustomSection: noop,
      onSetNewSectionTitle: noopSetString,
      onSetNewSectionDescription: noopSetString,
      onRemoveCustomSection: noopWithId,
      // Document handlers
      onToggleDocument: noopWithId,
      onSelectDocument: noopWithDocId,
      onEditDocument: noopEditDocument,
      onSaveDocument: noopSave,
      onToggleAddDocument: noop,
      onAddCustomDocument: noop,
      onSetNewDocumentName: noopSetString,
      onSetNewDocumentDescription: noopSetString,
      onRemoveCustomDocument: noopWithId,
      // Shared
      getOriginBadge: noopBadge
    };
  }

  return {
    // Section handlers
    onToggleSection: templateState.handlers.onToggleSection,
    onEditSection: templateState.handlers.onEditSection,
    onSaveSection: templateState.handlers.onSaveSection,
    onCancelEdit: templateState.handlers.onCancelEdit,
    onToggleAddSection: templateState.handlers.onToggleAddSection,
    onAddCustomSection: templateState.handlers.onAddCustomSection,
    onSetNewSectionTitle: templateState.handlers.onSetNewSectionTitle,
    onSetNewSectionDescription: templateState.handlers.onSetNewSectionDescription,
    onRemoveCustomSection: templateState.handlers.onRemoveCustomSection,
    // Document handlers
    onToggleDocument: templateState.handlers.onToggleDocument,
    onSelectDocument: templateState.handlers.onSelectDocument,
    onEditDocument: templateState.handlers.onEditDocument,
    onSaveDocument: templateState.handlers.onSaveDocument,
    onToggleAddDocument: templateState.handlers.onToggleAddDocument,
    onAddCustomDocument: templateState.handlers.onAddCustomDocument,
    onSetNewDocumentName: templateState.handlers.onSetNewDocumentName,
    onSetNewDocumentDescription: templateState.handlers.onSetNewDocumentDescription,
    onRemoveCustomDocument: templateState.handlers.onRemoveCustomDocument,
    // Shared
    getOriginBadge: templateState.handlers.getOriginBadge
  };
}

/**
 * Extract section-specific template state values
 * Used by Sidebar component
 */
export function extractSectionTemplateState(templateState: TemplateState | null) {
  if (!templateState) {
    return {
      filteredSections: undefined,
      allSections: undefined,
      disabledSections: undefined,
      expandedSectionId: undefined,
      editingSection: undefined,
      showAddSection: undefined,
      newSectionTitle: undefined,
      newSectionDescription: undefined
    };
  }

  return {
    filteredSections: templateState.filteredSections,
    allSections: templateState.allSections,
    disabledSections: templateState.disabledSections as Set<string> | undefined,
    expandedSectionId: templateState.expandedSectionId,
    editingSection: templateState.editingSection,
    showAddSection: templateState.showAddSection,
    newSectionTitle: templateState.newSectionTitle,
    newSectionDescription: templateState.newSectionDescription
  };
}

/**
 * Extract document-specific template state values
 * Used by DocumentsBar component
 * Returns default values when templateState is null
 */
export function extractDocumentTemplateState(templateState: TemplateState | null) {
  if (!templateState) {
    return {
      filteredDocuments: [] as any[],
      disabledDocuments: new Set<string>(),
      enabledDocumentsCount: 0,
      expandedDocumentId: null as string | null,
      editingDocument: null as any,
      clickedDocumentId: null as string | null,
      showAddDocument: false,
      newDocumentName: '',
      newDocumentDescription: ''
    };
  }

  return {
    filteredDocuments: templateState.filteredDocuments,
    disabledDocuments: templateState.disabledDocuments as Set<string>,
    enabledDocumentsCount: templateState.enabledDocumentsCount,
    expandedDocumentId: templateState.expandedDocumentId,
    editingDocument: templateState.editingDocument,
    clickedDocumentId: templateState.clickedDocumentId,
    showAddDocument: templateState.showAddDocument,
    newDocumentName: templateState.newDocumentName,
    newDocumentDescription: templateState.newDocumentDescription
  };
}


import type { SectionTemplate, DocumentTemplate } from '../../types/types';

export interface UIState {
  showAddSection: boolean;
  showAddDocument: boolean;
  newSectionTitle: string;
  newDocumentName: string;
  expandedSectionId: string | null;
  expandedDocumentId: string | null;
  editingSection: SectionTemplate | null;
  editingDocument: DocumentTemplate | null;
  clickedDocumentId: string | null;
}

export interface UIActions {
  setShowAddSection: (show: boolean) => void;
  setShowAddDocument: (show: boolean) => void;
  setNewSectionTitle: (title: string) => void;
  setNewDocumentName: (name: string) => void;
  setExpandedSectionId: (id: string | null) => void;
  setExpandedDocumentId: (id: string | null) => void;
  setEditingSection: (section: SectionTemplate | null) => void;
  setEditingDocument: (document: DocumentTemplate | null) => void;
  setClickedDocumentId: (id: string | null) => void;
  resetFormState: () => void;
}

export const createUIDomain = (set: any): UIActions => ({
  setShowAddSection: (show: boolean) => set({ showAddSection: show }),
  setShowAddDocument: (show: boolean) => set({ showAddDocument: show }),
  setNewSectionTitle: (title: string) => set({ newSectionTitle: title }),
  setNewDocumentName: (name: string) => set({ newDocumentName: name }),
  setExpandedSectionId: (id: string | null) => set({ expandedSectionId: id }),
  setExpandedDocumentId: (id: string | null) => set({ expandedDocumentId: id }),
  setEditingSection: (section: SectionTemplate | null) => set({ editingSection: section }),
  setEditingDocument: (document: DocumentTemplate | null) => set({ editingDocument: document }),
  setClickedDocumentId: (id: string | null) => set({ clickedDocumentId: id }),
  resetFormState: () => set({
    showAddSection: false,
    showAddDocument: false,
    newSectionTitle: '',
    newDocumentName: '',
  }),
});
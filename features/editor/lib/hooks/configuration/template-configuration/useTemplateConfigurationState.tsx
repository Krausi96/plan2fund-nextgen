import React, { useMemo } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/contexts/I18nContext';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { BusinessPlan, ProductType, ProgramSummary } from '@/features/editor/lib/types/plan';
import { getSelectedDocumentName, isAdditionalDocument, getDocumentSections } from '@/features/editor/lib/helpers/editorHelpers';

export interface TemplateState {
  filteredDocuments: DocumentTemplate[];
  allDocuments: DocumentTemplate[];
  disabledDocuments: Set<string>;
  enabledDocumentsCount: number;
  expandedDocumentId: string | null;
  editingDocument: DocumentTemplate | null;
  clickedDocumentId: string | null;
  showAddDocument: boolean;
  newDocumentName: string;
  newDocumentDescription: string;
  filteredSections: SectionTemplate[];
  allSections: SectionTemplate[];
  disabledSections: Set<string>;
  expandedSectionId: string | null;
  editingSection: SectionTemplate | null;
  showAddSection: boolean;
  newSectionTitle: string;
  newSectionDescription: string;
  selectionSummary: {
    productLabel: string;
    productIcon?: string;
    programLabel: string | null;
    selectedDocumentName: string | null;
    enabledSectionsCount: number;
    totalSectionsCount: number;
    enabledDocumentsCount: number;
    totalDocumentsCount: number;
    sectionTitles: string[];
    documentTitles: string[];
  };
  handlers: {
    onToggleDocument: (documentId: string) => void;
    onSelectDocument: (docId: string | null) => void;
    onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => void;
    onSaveDocument: (item: SectionTemplate | DocumentTemplate) => void;
    onCancelEdit: () => void;
    onToggleAddDocument: () => void;
    onAddCustomDocument: () => void;
    onSetNewDocumentName: (name: string) => void;
    onSetNewDocumentDescription: (desc: string) => void;
    onRemoveCustomDocument: (documentId: string) => void;
    onToggleSection: (sectionId: string) => void;
    onEditSection: (section: SectionTemplate, e: React.MouseEvent) => void;
    onSaveSection: (item: SectionTemplate | DocumentTemplate) => void;
    onToggleAddSection: () => void;
    onAddCustomSection: () => void;
    onSetNewSectionTitle: (title: string) => void;
    onSetNewSectionDescription: (desc: string) => void;
    onRemoveCustomSection: (sectionId: string) => void;
    getOriginBadge: (origin?: string, isSelected?: boolean) => React.ReactNode | null;
  };
}

/**
 * Hook to compute template configuration state for DocumentsBar and Sidebar
 * Always returns a valid object, even when no product is selected (for new users)
 */
export function useTemplateConfigurationState(
  templateLoading: boolean,
  selectedProduct: ProductType | null,
  selectedProductMeta: { label: string; icon?: string } | null,
  programSummary: ProgramSummary | null,
  plan: BusinessPlan | null,
  filteredDocuments: DocumentTemplate[],
  allDocuments: DocumentTemplate[],
  disabledDocuments: Set<string>,
  enabledDocumentsCount: number,
  expandedDocumentId: string | null,
  editingDocument: DocumentTemplate | null,
  clickedDocumentId: string | null,
  showAddDocument: boolean,
  newDocumentName: string,
  newDocumentDescription: string,
  filteredSections: SectionTemplate[],
  allSections: SectionTemplate[],
  disabledSections: Set<string>,
  expandedSectionId: string | null,
  editingSection: SectionTemplate | null,
  showAddSection: boolean,
  newSectionTitle: string,
  newSectionDescription: string,
  visibleSections: SectionTemplate[],
  visibleDocuments: DocumentTemplate[],
  totalDocumentsCount: number,
  toggleDocument: (documentId: string) => void,
  handleSelectDocument: (docId: string | null) => void,
  handleSaveItem: (item: SectionTemplate | DocumentTemplate, type: 'section' | 'document') => void,
  toggleAddBadge: (type: 'section' | 'document') => void,
  addCustomDocument: () => void,
  setNewDocumentName: (name: string) => void,
  setNewDocumentDescription: (desc: string) => void,
  removeCustomDocument: (documentId: string) => void,
  toggleSection: (sectionId: string) => void,
  addCustomSection: () => void,
  setNewSectionTitle: (title: string) => void,
  setNewSectionDescription: (desc: string) => void,
  removeCustomSection: (sectionId: string) => void,
  setExpandedDocumentId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingDocument: React.Dispatch<React.SetStateAction<DocumentTemplate | null>>,
  setExpandedSectionId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingSection: React.Dispatch<React.SetStateAction<SectionTemplate | null>>
): TemplateState {
  const { t } = useI18n();

  return useMemo(() => {
    // Always return a valid object, even when no product is selected (for new users)
    // This ensures CurrentSelection and DocumentsBar always render
    if (templateLoading) {
      return {
        filteredDocuments: [],
        allDocuments: [],
        disabledDocuments: new Set<string>(),
        enabledDocumentsCount: 0,
        expandedDocumentId: null,
        editingDocument: null,
        clickedDocumentId: null,
        showAddDocument: false,
        newDocumentName: '',
        newDocumentDescription: '',
        filteredSections: [],
        allSections: [],
        disabledSections: new Set<string>(),
        expandedSectionId: null,
        editingSection: null,
        showAddSection: false,
        newSectionTitle: '',
        newSectionDescription: '',
        selectionSummary: {
          productLabel: (t('editor.desktop.product.unselected' as any) as string) || 'Not selected',
          productIcon: undefined,
          programLabel: null,
          selectedDocumentName: null,
          enabledSectionsCount: 0,
          totalSectionsCount: 0,
          enabledDocumentsCount: 0,
          totalDocumentsCount: 0,
          sectionTitles: [],
          documentTitles: []
        },
        handlers: {
          onToggleDocument: () => {},
          onSelectDocument: () => {},
          onEditDocument: () => {},
          onSaveDocument: () => {},
          onCancelEdit: () => {},
          onToggleAddDocument: () => {},
          onAddCustomDocument: () => {},
          onSetNewDocumentName: () => {},
          onSetNewDocumentDescription: () => {},
          onRemoveCustomDocument: () => {},
          onToggleSection: () => {},
          onEditSection: () => {},
          onSaveSection: () => {},
          onToggleAddSection: () => {},
          onAddCustomSection: () => {},
          onSetNewSectionTitle: () => {},
          onSetNewSectionDescription: () => {},
          onRemoveCustomSection: () => {},
          getOriginBadge: () => null
        }
      };
    }
    
    if (!selectedProduct) {
      return {
        filteredDocuments: [],
        allDocuments: [],
        disabledDocuments: new Set<string>(),
        enabledDocumentsCount: 0,
        expandedDocumentId: null,
        editingDocument: null,
        clickedDocumentId: null,
        showAddDocument: false,
        newDocumentName: '',
        newDocumentDescription: '',
        filteredSections: [],
        allSections: [],
        disabledSections: new Set<string>(),
        expandedSectionId: null,
        editingSection: null,
        showAddSection: false,
        newSectionTitle: '',
        newSectionDescription: '',
        selectionSummary: {
          productLabel: (t('editor.desktop.product.unselected' as any) as string) || 'Not selected',
          productIcon: undefined,
          programLabel: null,
          selectedDocumentName: null,
          enabledSectionsCount: 0,
          totalSectionsCount: 0,
          enabledDocumentsCount: 0,
          totalDocumentsCount: 0,
          sectionTitles: [],
          documentTitles: []
        },
        handlers: {
          onToggleDocument: toggleDocument,
          onSelectDocument: (docId: string | null) => {
            handleSelectDocument(docId);
            if (docId && expandedDocumentId === docId) {
              setExpandedDocumentId(null);
              setEditingDocument(null);
            }
          },
          onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setEditingDocument({ ...doc });
            setExpandedDocumentId(doc.id);
          },
          onSaveDocument: (item: SectionTemplate | DocumentTemplate) => handleSaveItem(item, 'document'),
          onCancelEdit: () => {
            setExpandedSectionId(null);
            setExpandedDocumentId(null);
            setEditingSection(null);
            setEditingDocument(null);
          },
          onToggleAddDocument: () => toggleAddBadge('document'),
          onAddCustomDocument: addCustomDocument,
          onSetNewDocumentName: setNewDocumentName,
          onSetNewDocumentDescription: setNewDocumentDescription,
          onRemoveCustomDocument: removeCustomDocument,
          onToggleSection: toggleSection,
          onEditSection: (section: SectionTemplate, e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setEditingSection({ ...section });
            setExpandedSectionId(section.id);
          },
          onSaveSection: (item: SectionTemplate | DocumentTemplate) => handleSaveItem(item, 'section'),
          onToggleAddSection: () => toggleAddBadge('section'),
          onAddCustomSection: addCustomSection,
          onSetNewSectionTitle: setNewSectionTitle,
          onSetNewSectionDescription: setNewSectionDescription,
          onRemoveCustomSection: removeCustomSection,
          getOriginBadge: (origin?: string, isSelected: boolean = false) => {
            if (origin !== 'program') {
              return null;
            }
            const baseClasses = "border-0 text-[7px] px-0.5 py-0";
            const selectedClasses = isSelected ? "ring-1 ring-blue-400/60" : "";
            return (
              <Badge 
                className={`bg-blue-600/30 text-blue-200 ${baseClasses} ${selectedClasses} ${
                  isSelected ? 'bg-blue-500/50 text-blue-100' : ''
                }`}
              >
                P
              </Badge>
            );
          }
        }
      };
    }
    
    // When an additional document is selected, use document-specific sections for counts
    let sectionsForCount = visibleSections;
    let totalSectionsForCount = allSections.length;
    let sectionTitlesForCount = visibleSections.map((section) => section.title);
    
    if (clickedDocumentId && plan && isAdditionalDocument(plan, clickedDocumentId)) {
      const documentSections = getDocumentSections(plan, clickedDocumentId);
      sectionTitlesForCount = documentSections.map((section) => section.title);
      totalSectionsForCount = documentSections.length;
      sectionsForCount = documentSections as any;
    }
    
    const sectionTitles = sectionTitlesForCount;
    const documentTitles = visibleDocuments.map((doc) => doc.name);
    const productLabel = selectedProductMeta?.label ?? (t('editor.desktop.product.unselected' as any) || 'Not selected');
    const programLabel = programSummary?.name ?? null;
    
    const selectedDocumentName = getSelectedDocumentName(plan, clickedDocumentId);
    
    let sectionsForCurrentSelection = allSections;
    if (clickedDocumentId && plan && isAdditionalDocument(plan, clickedDocumentId)) {
      const documentSections = getDocumentSections(plan, clickedDocumentId);
      const documentSectionIds = new Set(documentSections.map(s => s.id));
      sectionsForCurrentSelection = allSections.filter(section => documentSectionIds.has(section.id));
    }
    
    return {
      filteredDocuments,
      allDocuments,
      disabledDocuments,
      enabledDocumentsCount,
      expandedDocumentId,
      editingDocument,
      clickedDocumentId,
      showAddDocument,
      newDocumentName,
      newDocumentDescription,
      filteredSections,
      allSections: sectionsForCurrentSelection,
      disabledSections,
      expandedSectionId,
      editingSection,
      showAddSection,
      newSectionTitle,
      newSectionDescription,
      selectionSummary: {
        productLabel,
        productIcon: selectedProductMeta?.icon,
        programLabel,
        selectedDocumentName,
        enabledSectionsCount: sectionsForCount.length,
        totalSectionsCount: totalSectionsForCount,
        enabledDocumentsCount,
        totalDocumentsCount,
        sectionTitles,
        documentTitles
      },
      handlers: {
        onToggleDocument: toggleDocument,
        onSelectDocument: (docId: string | null) => {
          handleSelectDocument(docId);
          if (docId && expandedDocumentId === docId) {
            setExpandedDocumentId(null);
            setEditingDocument(null);
          }
        },
        onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setEditingDocument({ ...doc });
          setExpandedDocumentId(doc.id);
        },
        onSaveDocument: (item: SectionTemplate | DocumentTemplate) => handleSaveItem(item, 'document'),
        onCancelEdit: () => {
          setExpandedSectionId(null);
          setExpandedDocumentId(null);
          setEditingSection(null);
          setEditingDocument(null);
        },
        onToggleAddDocument: () => toggleAddBadge('document'),
        onAddCustomDocument: addCustomDocument,
        onSetNewDocumentName: setNewDocumentName,
        onSetNewDocumentDescription: setNewDocumentDescription,
        onRemoveCustomDocument: removeCustomDocument,
        onToggleSection: toggleSection,
        onEditSection: (section: SectionTemplate, e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setEditingSection({ ...section });
          setExpandedSectionId(section.id);
        },
        onSaveSection: (item: SectionTemplate | DocumentTemplate) => handleSaveItem(item, 'section'),
        onToggleAddSection: () => toggleAddBadge('section'),
        onAddCustomSection: addCustomSection,
        onSetNewSectionTitle: setNewSectionTitle,
        onSetNewSectionDescription: setNewSectionDescription,
        onRemoveCustomSection: removeCustomSection,
        getOriginBadge: (origin?: string, isSelected: boolean = false) => {
          if (origin !== 'program') {
            return null;
          }
          const baseClasses = "border-0 text-[7px] px-0.5 py-0";
          const selectedClasses = isSelected ? "ring-1 ring-blue-400/60" : "";
          return (
            <Badge 
              variant="info" 
              className={`bg-blue-600/30 text-blue-200 ${baseClasses} ${selectedClasses} ${
                isSelected ? 'bg-blue-500/50 text-blue-100' : ''
              }`}
            >
              P
            </Badge>
          );
        }
      }
    };
  }, [
    templateLoading,
    selectedProduct,
    selectedProductMeta,
    programSummary,
    plan,
    filteredDocuments,
    allDocuments,
    disabledDocuments,
    enabledDocumentsCount,
    expandedDocumentId,
    editingDocument,
    clickedDocumentId,
    showAddDocument,
    newDocumentName,
    newDocumentDescription,
    filteredSections,
    allSections,
    disabledSections,
    expandedSectionId,
    editingSection,
    showAddSection,
    newSectionTitle,
    newSectionDescription,
    visibleSections,
    visibleDocuments,
    totalDocumentsCount,
    t,
    toggleDocument,
    handleSelectDocument,
    handleSaveItem,
    toggleAddBadge,
    addCustomDocument,
    setNewDocumentName,
    setNewDocumentDescription,
    removeCustomDocument,
    toggleSection,
    addCustomSection,
    setNewSectionTitle,
    setNewSectionDescription,
    removeCustomSection,
    setExpandedDocumentId,
    setEditingDocument,
    setExpandedSectionId,
    setEditingSection
  ]);
}


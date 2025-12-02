import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { getSections, getDocuments } from '@templates';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { ProductType, ProgramSummary } from '@/features/editor/types/plan';
import { useI18n } from '@/shared/contexts/I18nContext';
import { DesktopConfigurator } from './DesktopConfigurator';

const DOCUMENT_SELECTION_STORAGE_KEY = 'plan2fund-desktop-doc-selection';
const createDefaultSelectionState = (): Record<ProductType, string | null> => ({
  submission: null,
  review: null,
  strategy: null
});

export type ConnectCopy = {
  badge: string;
  heading: string;
  description: string;
  openFinder: string;
  pasteLink: string;
  inputLabel: string;
  placeholder: string;
  example: string;
  submit: string;
  error: string;
};

export interface TemplateOverviewPanelProps {
  productType: ProductType;
  programSummary: ProgramSummary | null;
  fundingType: string;
  planMetadata?: {
    disabledSectionIds?: string[];
    disabledDocumentIds?: string[];
    customSections?: any[];
    customDocuments?: any[];
  };
  onUpdate: (options: {
    disabledSectionIds: string[];
    disabledDocumentIds: string[];
    customSections?: SectionTemplate[];
    customDocuments?: DocumentTemplate[];
  }) => void;
  // PlanConfigurator props
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  programLoading: boolean;
  programError: string | null;
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  connectCopy: ConnectCopy;
  // Callback when document selection changes - provides filtered section IDs for sidebar navigation
  onDocumentSelectionChange?: (filteredSectionIds: string[]) => void;
  // Callback to expose template management state for DocumentsBar and Sidebar
  onTemplateStateExposed?: (state: {
    filteredDocuments: DocumentTemplate[];
    disabledDocuments: Set<string>;
    enabledDocumentsCount: number;
    expandedDocumentId: string | null;
    editingDocument: DocumentTemplate | null;
    clickedDocumentId: string | null;
    showAddDocument: boolean;
    newDocumentName: string;
    newDocumentDescription: string;
    filteredSections: SectionTemplate[];
    allSections: SectionTemplate[]; // All sections for counting
    disabledSections: Set<string>;
    expandedSectionId: string | null;
    editingSection: SectionTemplate | null;
    showAddSection: boolean;
    newSectionTitle: string;
    newSectionDescription: string;
    selectionSummary?: {
      productLabel: string;
      productIcon?: string;
      programLabel: string | null;
      enabledSectionsCount: number;
      totalSectionsCount: number;
      enabledDocumentsCount: number;
      totalDocumentsCount: number;
      sectionTitles: string[];
      documentTitles: string[];
    };
    handlers: {
      onToggleDocument: (id: string) => void;
      onSelectDocument: (id: string | null) => void;
      onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => void;
      onSaveDocument: (item: SectionTemplate | DocumentTemplate) => void;
      onCancelEdit: () => void;
      onToggleAddDocument: () => void;
      onAddCustomDocument: () => void;
      onSetNewDocumentName: (name: string) => void;
      onSetNewDocumentDescription: (desc: string) => void;
      onRemoveCustomDocument: (id: string) => void;
      onToggleSection: (id: string) => void;
      onEditSection: (section: SectionTemplate, e: React.MouseEvent) => void;
      onSaveSection: (item: SectionTemplate | DocumentTemplate) => void;
      onToggleAddSection: () => void;
      onAddCustomSection: () => void;
      onSetNewSectionTitle: (title: string) => void;
      onSetNewSectionDescription: (desc: string) => void;
      onRemoveCustomSection: (id: string) => void;
      getOriginBadge: (origin?: string, isSelected?: boolean) => React.ReactNode;
    };
  }) => void;
}

export function TemplateOverviewPanel({
  productType,
  programSummary,
  fundingType,
  planMetadata,
  onUpdate,
  onChangeProduct,
  onConnectProgram,
  onOpenProgramFinder,
  programLoading,
  programError,
  productOptions,
  connectCopy,
  onDocumentSelectionChange,
  onTemplateStateExposed
}: TemplateOverviewPanelProps) {
  const { t } = useI18n();
  const loadingCopy = t('editor.desktop.loading' as any) || 'Loading...';
  const loadErrorCopy = t('editor.desktop.loadError' as any) || 'Failed to load templates';
  const selectionCurrentLabel = t('editor.desktop.selection.current' as any) || 'Current selection';
  // const programLabelCopy = t('editor.desktop.selection.programLabel' as any) || 'Program / Template';
  // const noProgramCopy = t('editor.desktop.selection.noProgram' as any) || 'No program';
  const sectionsLabel = t('editor.desktop.selection.sectionsLabel' as any) || 'Sections';
  const documentsLabel = t('editor.desktop.selection.documentsLabel' as any) || 'Documents';
  // const sectionsPopoverTitle = t('editor.desktop.selection.sectionsPopoverTitle' as any) || 'Selected sections';
  // const documentsPopoverTitle = t('editor.desktop.selection.documentsPopoverTitle' as any) || 'Selected documents';
  // const selectionEmpty = t('editor.desktop.selection.empty' as any) || 'No selection';
  // const confirmSelectionLabel = t('editor.desktop.selection.confirmSelection' as any) || 'Auswahl bestätigen';
  const [sections, setSections] = useState<SectionTemplate[]>([]);
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [customSections, setCustomSections] = useState<SectionTemplate[]>([]);
  const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize disabled state as empty Set to prevent hydration mismatches
  // State will be restored from planMetadata on client-side only
  const [disabledSections, setDisabledSections] = useState<Set<string>>(() => new Set());
  const [disabledDocuments, setDisabledDocuments] = useState<Set<string>>(() => new Set());
  
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');
  // Filter state kept for potential future use, but UI removed per requirements
  const [sectionFilter] = useState<'all' | 'master' | 'program' | 'custom'>('all');
  const [documentFilter] = useState<'all' | 'master' | 'program' | 'custom'>('all');
  
  // Configurator state (configView is shared with DesktopConfigurator)
  const [configView, setConfigView] = useState<'plan' | 'program'>('plan');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<SectionTemplate | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentTemplate | null>(null);
  const [productDocumentSelections, setProductDocumentSelections] = useState<Record<ProductType, string | null>>(() => {
    if (typeof window === 'undefined') {
      return createDefaultSelectionState();
    }
    try {
      const stored = window.sessionStorage.getItem(DOCUMENT_SELECTION_STORAGE_KEY);
      if (!stored) {
        return createDefaultSelectionState();
      }
      const parsed = JSON.parse(stored) as Partial<Record<ProductType, string | null>>;
      return {
        ...createDefaultSelectionState(),
        ...parsed
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Desktop] Failed to parse document selection cache:', err);
      }
      return createDefaultSelectionState();
    }
  });
  const clickedDocumentId = productDocumentSelections[productType] ?? null;

  const selectedProductMeta = productOptions.find((option) => option.value === productType) ?? productOptions[0] ?? null;

  useEffect(() => {
    // Only load templates client-side
    if (typeof window === 'undefined') return;
    
    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = undefined;
        
        const [loadedSections, loadedDocuments] = await Promise.all([
          getSections(fundingType, productType, programSummary?.id, baseUrl),
          getDocuments(fundingType, productType, programSummary?.id, baseUrl)
        ]);
        
        setSections(loadedSections);
        setDocuments(loadedDocuments);
      } catch (err) {
        setError(err instanceof Error ? err.message : loadErrorCopy);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [productType, programSummary?.id, fundingType, loadErrorCopy]);

  // Restore disabled state and custom templates from plan metadata
  const restoringFromMetadata = useRef(false);
  const lastMetadataRef = useRef<string>('');
  
  useEffect(() => {
    if (!planMetadata) return;
    
    const metadataKey = JSON.stringify({
      disabled: planMetadata.disabledSectionIds || [],
      docs: planMetadata.disabledDocumentIds || [],
      customSections: planMetadata.customSections?.length || 0,
      customDocuments: planMetadata.customDocuments?.length || 0
    });
    
    if (lastMetadataRef.current === metadataKey) {
      return;
    }
    
    if (restoringFromMetadata.current) {
      return;
    }
    
    restoringFromMetadata.current = true;
    lastMetadataRef.current = metadataKey;
    
    if (planMetadata.disabledSectionIds) {
      setDisabledSections(new Set(planMetadata.disabledSectionIds));
    }
    if (planMetadata.disabledDocumentIds) {
      setDisabledDocuments(new Set(planMetadata.disabledDocumentIds));
    }
    if (planMetadata.customSections && planMetadata.customSections.length > 0) {
      setCustomSections(planMetadata.customSections as SectionTemplate[]);
    }
    if (planMetadata.customDocuments && planMetadata.customDocuments.length > 0) {
      setCustomDocuments(planMetadata.customDocuments as DocumentTemplate[]);
    }
    
    setTimeout(() => {
      restoringFromMetadata.current = false;
    }, 100);
  }, [planMetadata]);

  // Notify parent of changes - use memoized arrays to prevent unnecessary effect triggers
  const isInitialMount = useRef(true);
  const lastUpdateRef = useRef<string>('');
  
  // Track previous values to detect actual changes
  const prevDisabledSectionsRef = useRef<string>('');
  const prevDisabledDocumentsRef = useRef<string>('');
  const prevCustomSectionsLengthRef = useRef<number>(0);
  const prevCustomDocumentsLengthRef = useRef<number>(0);
  const prevCustomSectionsKeyRef = useRef<string>('');
  const prevCustomDocumentsKeyRef = useRef<string>('');
  
  // Create stable string keys for dependencies
  const disabledSectionsKey = useMemo(() => {
    return Array.from(disabledSections).sort().join(',');
  }, [disabledSections]);
  
  const disabledDocumentsKey = useMemo(() => {
    return Array.from(disabledDocuments).sort().join(',');
  }, [disabledDocuments]);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Initialize refs
      const customSectionsKey = customSections.map(s => s.id).sort().join(',');
      const customDocumentsKey = customDocuments.map(d => d.id).sort().join(',');
      prevDisabledSectionsRef.current = disabledSectionsKey;
      prevDisabledDocumentsRef.current = disabledDocumentsKey;
      prevCustomSectionsLengthRef.current = customSections.length;
      prevCustomDocumentsLengthRef.current = customDocuments.length;
      prevCustomSectionsKeyRef.current = customSectionsKey;
      prevCustomDocumentsKeyRef.current = customDocumentsKey;
      return;
    }
    
    if (restoringFromMetadata.current) {
      return;
    }
    
    // Create a stable key that includes custom section IDs to detect actual changes
    const customSectionsKey = customSections.map(s => s.id).sort().join(',');
    const customDocumentsKey = customDocuments.map(d => d.id).sort().join(',');
    
    // Check if anything actually changed
    const hasChanged = 
      prevDisabledSectionsRef.current !== disabledSectionsKey ||
      prevDisabledDocumentsRef.current !== disabledDocumentsKey ||
      prevCustomSectionsLengthRef.current !== customSections.length ||
      prevCustomDocumentsLengthRef.current !== customDocuments.length ||
      prevCustomSectionsKeyRef.current !== customSectionsKey ||
      prevCustomDocumentsKeyRef.current !== customDocumentsKey;
    
    if (!hasChanged) {
      return;
    }
    
    // Update refs
    prevDisabledSectionsRef.current = disabledSectionsKey;
    prevDisabledDocumentsRef.current = disabledDocumentsKey;
    prevCustomSectionsLengthRef.current = customSections.length;
    prevCustomDocumentsLengthRef.current = customDocuments.length;
    prevCustomSectionsKeyRef.current = customSectionsKey;
    prevCustomDocumentsKeyRef.current = customDocumentsKey;
    
    const updateKey = JSON.stringify({
      disabled: disabledSectionsKey,
      docs: disabledDocumentsKey,
      customSections: customSectionsKey,
      customDocuments: customDocumentsKey
    });
    
    if (lastUpdateRef.current === updateKey) {
      return;
    }
    
    lastUpdateRef.current = updateKey;
    
    onUpdate({
      disabledSectionIds: Array.from(disabledSections).sort(),
      disabledDocumentIds: Array.from(disabledDocuments).sort(),
      customSections: customSections.length > 0 ? customSections : undefined,
      customDocuments: customDocuments.length > 0 ? customDocuments : undefined
    });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledSectionsKey, disabledDocumentsKey, customSections, customDocuments]);


  // Close edit forms when items are disabled
  useEffect(() => {
    if (expandedSectionId && disabledSections.has(expandedSectionId)) {
      setExpandedSectionId(null);
      setEditingSection(null);
    }
  }, [expandedSectionId, disabledSections]);

  useEffect(() => {
    if (expandedDocumentId && disabledDocuments.has(expandedDocumentId)) {
      setExpandedDocumentId(null);
      setEditingDocument(null);
    }
  }, [expandedDocumentId, disabledDocuments]);

  const toggleSection = useCallback((sectionId: string) => {
    setDisabledSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const toggleDocument = useCallback((documentId: string) => {
    setDisabledDocuments(prev => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }, []);

  const addCustomSection = () => {
    if (!newSectionTitle.trim()) {
      return; // Don't add if title is empty
    }
    const newSection: SectionTemplate = {
      id: `custom_section_${Date.now()}`,
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || 'Benutzerdefinierter Abschnitt',
      required: false,
      wordCountMin: 0,
      wordCountMax: 0,
      order: 1000 + customSections.length,
      category: 'custom',
      prompts: ['Beschreibe hier den Inhalt deines Abschnitts'],
      questions: [],
      validationRules: {
        requiredFields: [],
        formatRequirements: []
      },
      origin: 'custom',
      visibility: 'advanced'
    };
    // New custom sections are automatically enabled (not in disabledSections)
    // The useEffect will detect the change and trigger onUpdate
    setCustomSections(prev => [...prev, newSection]);
    setNewSectionTitle('');
    setNewSectionDescription('');
    setShowAddSection(false);
    // Force update by clearing the lastUpdateRef to ensure the effect triggers
    lastUpdateRef.current = '';
  };

  const addCustomDocument = () => {
    if (!newDocumentName.trim()) {
      return; // Don't add if name is empty
    }
    const newDocument: DocumentTemplate = {
      id: `custom_doc_${Date.now()}`,
      name: newDocumentName.trim(),
      description: newDocumentDescription.trim() || 'Benutzerdefiniertes Dokument',
      required: false,
      format: 'pdf',
      maxSize: '10MB',
      template: '',
      instructions: [],
      examples: [],
      commonMistakes: [],
      category: 'custom',
      fundingTypes: [fundingType],
      origin: 'custom'
    };
    setCustomDocuments(prev => [...prev, newDocument]);
    setNewDocumentName('');
    setNewDocumentDescription('');
    setShowAddDocument(false);
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
  };

  const removeCustomDocument = (id: string) => {
    setCustomDocuments(prev => prev.filter(d => d.id !== id));
  };

  const toggleAddSectionBadge = () => {
    setShowAddSection(prev => {
      if (prev) {
        setNewSectionTitle('');
        setNewSectionDescription('');
      }
      return !prev;
    });
  };

  const toggleAddDocumentBadge = () => {
    setShowAddDocument(prev => {
      if (prev) {
        setNewDocumentName('');
        setNewDocumentDescription('');
      }
      return !prev;
    });
  };

  const handleEditSection = (section: SectionTemplate, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSection({ ...section });
    setExpandedSectionId(section.id);
  };

  const updateProductSelection = useCallback((product: ProductType, selection: string | null) => {
    setProductDocumentSelections(prev => {
      if (prev[product] === selection) {
        return prev;
      }
      return {
        ...prev,
        [product]: selection
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.sessionStorage.setItem(
        DOCUMENT_SELECTION_STORAGE_KEY,
        JSON.stringify(productDocumentSelections)
      );
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Desktop] Failed to persist document selection cache:', err);
      }
    }
  }, [productDocumentSelections]);

  const handleSelectDocument = useCallback((docId: string | null) => {
    // Select document to filter sections (without opening edit form)
    // null means core product is selected (show all sections)
    updateProductSelection(productType, docId);
    // Clear any expanded edit form
    if (docId && expandedDocumentId === docId) {
      setExpandedDocumentId(null);
      setEditingDocument(null);
    }
  }, [expandedDocumentId, productType, updateProductSelection]);

  const handleEditDocument = (doc: DocumentTemplate, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDocument({ ...doc });
    setExpandedDocumentId(doc.id);
    // Don't change clickedDocumentId - keep current selection for sections filtering
    // Only open the edit form
  };

  const handleSaveSection = (item: SectionTemplate | DocumentTemplate) => {
    const section = item as SectionTemplate;
    if (section.origin === 'custom') {
      // Update existing custom section
      setCustomSections(prev => prev.map(s => s.id === section.id ? section : s));
    } else {
      // For master/program sections, create a custom copy with edited values
      const updatedSection = { 
        ...section, 
        id: `custom_${section.id}_${Date.now()}`,
        origin: 'custom' as const 
      };
      setCustomSections(prev => [...prev, updatedSection]);
      // Disable the original section
      setDisabledSections(prev => new Set([...prev, section.id]));
    }
    
    setExpandedSectionId(null);
    setEditingSection(null);
  };

  const handleSaveDocument = (item: SectionTemplate | DocumentTemplate) => {
    const document = item as DocumentTemplate;
    if (document.origin === 'custom') {
      // Update existing custom document
      setCustomDocuments(prev => prev.map(d => d.id === document.id ? document : d));
    } else {
      // For master/program documents, create a custom copy with edited values
      const updatedDocument = { 
        ...document, 
        id: `custom_${document.id}_${Date.now()}`,
        origin: 'custom' as const 
      };
      setCustomDocuments(prev => [...prev, updatedDocument]);
      // Disable the original document
      setDisabledDocuments(prev => new Set([...prev, document.id]));
    }
    
    setExpandedDocumentId(null);
    setEditingDocument(null);
  };

  const handleCancelEdit = () => {
    setExpandedSectionId(null);
    setExpandedDocumentId(null);
    setEditingSection(null);
    setEditingDocument(null);
  };


  const handleTemplatesExtracted = (templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[] }) => {
    if (templates.sections && templates.sections.length > 0) {
      setCustomSections(prev => [...prev, ...templates.sections!]);
    }
    if (templates.documents && templates.documents.length > 0) {
      setCustomDocuments(prev => [...prev, ...templates.documents!]);
    }
  };

  const allSections = useMemo(() => [...sections, ...customSections], [sections, customSections]);
  const allDocuments = useMemo(() => [...documents, ...customDocuments], [documents, customDocuments]);
  const allDocumentsKey = useMemo(() => allDocuments.map(doc => doc.id).sort().join(','), [allDocuments]);

  const restoreSelectionForProduct = useCallback(
    (product: ProductType, docs: DocumentTemplate[]) => {
      const savedSelection = productDocumentSelections[product];
      if (!savedSelection) {
        return null;
      }
      const exists = docs.some(doc => doc.id === savedSelection);
      return exists ? savedSelection : null;
    },
    [productDocumentSelections]
  );

  useEffect(() => {
    if (loading) return;
    const restoredSelection = restoreSelectionForProduct(productType, allDocuments);
    if (!restoredSelection && clickedDocumentId) {
      updateProductSelection(productType, null);
      return;
    }
    if (restoredSelection && restoredSelection !== clickedDocumentId) {
      updateProductSelection(productType, restoredSelection);
    }
  }, [
    allDocuments,
    allDocumentsKey,
    clickedDocumentId,
    loading,
    productType,
    restoreSelectionForProduct,
    updateProductSelection
  ]);
  
  // Filter sections based on clicked document - match by category or name keywords
  // Product-specific filtering to ensure distinct behavior per product type
  const getRelatedSections = useCallback((documentId: string | null) => {
    if (!documentId) return allSections;
    
    const doc = allDocuments.find(d => d.id === documentId);
    if (!doc) return allSections;
    
    // Match sections by category or name keywords
    const docNameLower = doc.name.toLowerCase();
    const docCategoryLower = doc.category?.toLowerCase() || '';
    
    // Product-specific keywords - distinct by product type
    const keywordsByProduct: Record<string, Record<string, string[]>> = {
      submission: {
        'work plan': ['work', 'plan', 'timeline', 'milestone', 'project', 'implementation'],
        'gantt': ['work', 'plan', 'timeline', 'schedule', 'project', 'milestone', 'implementation'],
        'budget': ['budget', 'financial', 'cost', 'finance', 'funding', 'resources'],
        'financial': ['budget', 'financial', 'cost', 'finance', 'funding', 'resources'],
        'team': ['team', 'personnel', 'staff', 'organization', 'management'],
        'cv': ['team', 'personnel', 'staff', 'biography', 'management'],
        'pitch': ['executive', 'summary', 'overview', 'introduction'],
        'deck': ['executive', 'summary', 'overview', 'introduction']
      },
      strategy: {
        'work plan': ['strategy', 'planning', 'timeline', 'roadmap', 'vision'],
        'gantt': ['strategy', 'planning', 'timeline', 'roadmap'],
        'budget': ['budget', 'financial', 'investment', 'resources'],
        'team': ['team', 'organization', 'structure', 'leadership']
      },
      review: {
        'work plan': ['review', 'analysis', 'assessment', 'evaluation'],
        'budget': ['budget', 'financial', 'review', 'analysis'],
        'team': ['team', 'review', 'assessment']
      }
    };
    
    // Get product-specific keywords
    const productKeywords = keywordsByProduct[productType] || keywordsByProduct.submission;
    
    // Find matching keywords
    const matchingKeywords: string[] = [];
    for (const [key, values] of Object.entries(productKeywords)) {
      if (docNameLower.includes(key) || docCategoryLower.includes(key)) {
        matchingKeywords.push(...values);
      }
    }
    
    // Filter sections that match - product-aware
    const related = allSections.filter(section => {
      const sectionTitleLower = section.title.toLowerCase();
      const sectionCategoryLower = section.category?.toLowerCase() || '';
      
      // Check if section matches document category
      if (docCategoryLower && sectionCategoryLower && docCategoryLower === sectionCategoryLower) {
        return true;
      }
      
      // Check if section title contains any matching keywords
      if (matchingKeywords.length > 0) {
        return matchingKeywords.some(keyword => 
          sectionTitleLower.includes(keyword) || sectionCategoryLower.includes(keyword)
        );
      }
      
      // No match found
      return false;
    });
    
    // Return related sections (empty array if none found)
    return related;
  }, [allSections, allDocuments, productType]);
  
  const filteredSections = clickedDocumentId 
    ? getRelatedSections(clickedDocumentId)
    : (sectionFilter === 'all' 
      ? allSections 
      : allSections.filter(s => s.origin === sectionFilter));
  
  const filteredDocuments = documentFilter === 'all'
    ? allDocuments
    : allDocuments.filter(d => d.origin === documentFilter);

  const visibleSections = allSections.filter(s => !disabledSections.has(s.id));
  const visibleDocuments = allDocuments.filter(d => !disabledDocuments.has(d.id));
  
  // Compute visible filtered sections (filtered sections that are not disabled)
  const visibleFilteredSections = useMemo(() => {
    return filteredSections.filter(s => !disabledSections.has(s.id));
  }, [filteredSections, disabledSections]);

  // Calculate enabled counts - must be before useEffect that uses them
  const enabledSectionsCount = visibleSections.length;
  const enabledDocumentsCount = visibleDocuments.length + 1; // +1 for core product
  const totalDocumentsCount = allDocuments.length + 1; // +1 for core product

  // getOriginBadge function - must be before useEffect that uses it
  const getOriginBadge = (origin?: string, isSelected: boolean = false) => {
    // Don't show badges for custom items or master items - only show for program items
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
  };

  // Expose template state to parent (Editor) for DocumentsBar and Sidebar
  // Run immediately and on every state change
  useEffect(() => {
    if (onTemplateStateExposed && !loading) {
      // Calculate selection summary data
      const totalDocumentsCount = allDocuments.length + 1; // +1 for core product
      const sectionTitles = visibleSections.map((section) => section.title);
      const documentTitles = visibleDocuments.map((doc) => doc.name);
      const productLabel = selectedProductMeta?.label ?? (t('editor.desktop.product.unselected' as any) || 'Not selected');
      const programLabel = programSummary?.name ?? null;
      
      onTemplateStateExposed({
        filteredDocuments,
        disabledDocuments,
        enabledDocumentsCount,
        expandedDocumentId,
        editingDocument,
        clickedDocumentId,
        showAddDocument,
        newDocumentName,
        newDocumentDescription,
        filteredSections,
        allSections, // Include all sections for counting (always show total count)
        disabledSections,
        expandedSectionId,
        editingSection,
        showAddSection,
        newSectionTitle,
        newSectionDescription,
        // Selection summary data for CurrentSelection component
        selectionSummary: {
          productLabel,
          productIcon: selectedProductMeta?.icon,
          programLabel,
          enabledSectionsCount: visibleSections.length,
          totalSectionsCount: allSections.length,
          enabledDocumentsCount,
          totalDocumentsCount,
          sectionTitles,
          documentTitles
        },
        handlers: {
          onToggleDocument: toggleDocument,
          onSelectDocument: handleSelectDocument,
          onEditDocument: handleEditDocument,
          onSaveDocument: handleSaveDocument,
          onCancelEdit: handleCancelEdit,
          onToggleAddDocument: toggleAddDocumentBadge,
          onAddCustomDocument: addCustomDocument,
          onSetNewDocumentName: setNewDocumentName,
          onSetNewDocumentDescription: setNewDocumentDescription,
          onRemoveCustomDocument: removeCustomDocument,
          onToggleSection: toggleSection,
          onEditSection: handleEditSection,
          onSaveSection: handleSaveSection,
          onToggleAddSection: toggleAddSectionBadge,
          onAddCustomSection: addCustomSection,
          onSetNewSectionTitle: setNewSectionTitle,
          onSetNewSectionDescription: setNewSectionDescription,
          onRemoveCustomSection: removeCustomSection,
          getOriginBadge: (origin?: string, isSelected?: boolean) => getOriginBadge(origin, isSelected)
        }
      });
    }
  }, [
    onTemplateStateExposed,
    loading,
    filteredDocuments,
    disabledDocuments,
    enabledDocumentsCount,
    expandedDocumentId,
    editingDocument,
    clickedDocumentId,
    showAddDocument,
    newDocumentName,
    newDocumentDescription,
    filteredSections,
    disabledSections,
    expandedSectionId,
    editingSection,
    showAddSection,
    newSectionTitle,
    newSectionDescription,
    toggleDocument,
    handleSelectDocument,
    handleEditDocument,
    handleSaveDocument,
    handleCancelEdit,
    toggleAddDocumentBadge,
    addCustomDocument,
    setNewDocumentName,
    setNewDocumentDescription,
    removeCustomDocument,
    toggleSection,
    handleEditSection,
    handleSaveSection,
    toggleAddSectionBadge,
    addCustomSection,
    setNewSectionTitle,
    setNewSectionDescription,
    removeCustomSection,
    getOriginBadge
  ]);
  
  // Track last notified document to prevent infinite loops
  const lastNotifiedDocumentRef = useRef<string | null>(null);
  const callbackRef = useRef(onDocumentSelectionChange);
  
  // Keep callback ref up to date without triggering re-renders
  useEffect(() => {
    callbackRef.current = onDocumentSelectionChange;
  }, [onDocumentSelectionChange]);
  
  // Notify parent when document selection changes and filtered sections are available
  useEffect(() => {
    if (!callbackRef.current || loading) return;
    
    // Only notify if document selection actually changed
    if (lastNotifiedDocumentRef.current === clickedDocumentId) {
      return;
    }
    
    lastNotifiedDocumentRef.current = clickedDocumentId;
    
    // Get the filtered section IDs based on current document selection
    const filteredSectionIds = visibleFilteredSections.map(s => s.id);
    callbackRef.current(filteredSectionIds);
  }, [clickedDocumentId, visibleFilteredSections, loading]);


const headerCardClasses = 'relative rounded-lg border border-dashed border-white/60 px-2.5 pt-1.5 pb-0 backdrop-blur-xl overflow-visible transition-all duration-300';
const selectionSummary = `${enabledSectionsCount}/${allSections.length} ${sectionsLabel} • ${enabledDocumentsCount}/${totalDocumentsCount} ${documentsLabel}`;
const productLabel = selectedProductMeta?.label ?? (t('editor.desktop.product.unselected' as any) || 'Not selected');
// const sectionTitles = visibleSections.map((section) => section.title);
// const documentTitles = visibleDocuments.map((doc) => doc.name);
// const programLabel = programSummary?.name ?? null;
const cardElevationClasses = isExpanded
  ? 'z-30 shadow-[0_25px_60px_rgba(8,15,40,0.85)] ring-1 ring-white/15 translate-y-[-4px]'
  : 'z-10 shadow-xl';

  if (loading) {
    return (
      <div className="py-4">
        <div className={`${headerCardClasses} flex flex-col ${cardElevationClasses}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">{loadingCopy}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <div className={`${headerCardClasses} flex flex-col ${cardElevationClasses}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-800 rounded-lg" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-sm font-semibold text-red-200">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-0">
      <div className={`${headerCardClasses} flex flex-col ${cardElevationClasses} bg-transparent shadow-none p-0`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
            <div className="relative z-10 flex flex-col gap-2">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xl font-bold uppercase tracking-wide text-white">
                  🖥️ {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {!isExpanded && (
                    <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                      <span className="text-[10px] uppercase tracking-wide text-white/60 font-semibold">
                        {selectionCurrentLabel}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-white font-medium">
                        {selectedProductMeta?.icon && (
                          <span className="text-base leading-none">{selectedProductMeta.icon}</span>
                        )}
                        <span>{productLabel}</span>
                        {programSummary && configView === 'program' && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="text-white/80">{programSummary.name}</span>
                          </>
                        )}
                        <span className="text-white/30">•</span>
                        <span>{selectionSummary}</span>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`px-4 py-1.5 text-sm font-semibold ${
                      isExpanded
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {isExpanded ? (t('editor.desktop.toggle.close' as any) || 'Schreibtisch zuklappen') : (t('editor.desktop.toggle.open' as any) || 'Start editing')}
                  </Button>
                </div>
              </div>
              <div className="border-b border-white/30 w-full"></div>
            {/* Expanded Configuration Only - Documents and Sections moved to Workspace */}
              {isExpanded && (
                <>
               {/* Configuration Column - Compact, reduced height, increased when in program view */}
               <div className={`w-full max-w-full overflow-y-auto pb-2 ${
                 configView === 'program' ? 'max-h-[480px]' : 'max-h-[320px]'
               }`}>
                  <DesktopConfigurator
                  productType={productType}
                  productOptions={productOptions}
                  selectedProductMeta={selectedProductMeta}
                  connectCopy={connectCopy}
                  programSummary={programSummary}
                  programError={programError}
                  programLoading={programLoading}
                  onChangeProduct={onChangeProduct}
                  onConnectProgram={onConnectProgram}
                  onOpenProgramFinder={onOpenProgramFinder}
                  onTemplatesExtracted={handleTemplatesExtracted}
                  configView={configView}
                  onConfigViewChange={setConfigView}
                />
              </div>
              </>
            )}
            </div>
          </div>
    </div>
  );
}

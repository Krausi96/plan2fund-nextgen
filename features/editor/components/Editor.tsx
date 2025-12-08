import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/router';

import type { ConnectCopy } from '@/features/editor/lib/types/editor/configurator';
import Sidebar from './layout/Workspace/Navigation/Sidebar/Sidebar';
import PreviewWorkspace from './layout/Workspace/Preview/PreviewWorkspace';
import InlineSectionEditor from './layout/Workspace/SectionEditor/SectionEditor';
import DocumentsBar from './layout/Workspace/Navigation/Documents/DocumentsBar';
import CurrentSelection from './layout/Workspace/Navigation/Configuration/CurrentSelection/CurrentSelection';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { Badge } from '@/shared/components/ui/badge';
import {
  ANCILLARY_SECTION_ID,
  METADATA_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  useEditorActions,
  useEditorStore,
  defaultTitlePage,
  defaultAncillary
} from '@/features/editor/lib/hooks/useEditorStore';
import {
  ProductType,
  ProgramSummary,
  Question,
  Section
} from '@/features/editor/lib/types/plan';
import { useI18n } from '@/shared/contexts/I18nContext';
import DevClearCacheButton from './DevTools/DevClearCacheButton';
import { useProgramConnection } from '@/features/editor/lib/hooks/useProgramConnection';
import { useDocumentManagement } from '@/features/editor/lib/hooks/useDocumentManagement';
import { useTemplateManagement } from '@/features/editor/lib/hooks/useTemplateManagement';
import { useProductSelection } from '@/features/editor/lib/hooks/useProductSelection';


type EditorProps = {
  product?: ProductType | null;
};

type ProductConfig = {
  value: ProductType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
};

const PRODUCT_TYPE_CONFIG: ProductConfig[] = [
  {
    value: 'strategy' as ProductType,
    labelKey: 'planTypes.strategy.title',
    descriptionKey: 'planTypes.strategy.subtitle',
    icon: '💡'
  },
  {
    value: 'review' as ProductType,
    labelKey: 'planTypes.review.title',
    descriptionKey: 'planTypes.review.subtitle',
    icon: '✏️'
  },
  {
    value: 'submission' as ProductType,
    labelKey: 'planTypes.custom.title',
    descriptionKey: 'planTypes.custom.subtitle',
    icon: '📋'
  }
] as const;

export default function Editor({ product = null }: EditorProps) {
  const router = useRouter();
  const { t } = useI18n();

  const {
    plan,
    isLoading,
    error,
    activeSectionId,
    activeQuestionId,
    progressSummary
  } = useEditorStore((state) => ({
    plan: state.plan,
    isLoading: state.isLoading,
    error: state.error,
    activeSectionId: state.activeSectionId,
    activeQuestionId: state.activeQuestionId,
    progressSummary: state.progressSummary
  }));

  const {
    hydrate,
    setActiveQuestion,
    setActiveSection,
    updateAnswer,
    markQuestionComplete,
    addDataset,
    addKpi,
    addMedia,
    attachDatasetToQuestion,
    attachKpiToQuestion,
    attachMediaToQuestion,
    updateTitlePage,
    updateAncillary,
    addReference,
    updateReference,
    deleteReference,
    addAppendix,
    updateAppendix,
    deleteAppendix,
    runRequirementsCheck,
    toggleQuestionUnknown,
  } = useEditorActions((actions) => actions);

  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const workspaceGridRef = useRef<HTMLDivElement>(null);

  // Use custom hooks for program connection
  const {
    programSummary,
    programLoading,
    programError,
    handleConnectProgram,
    setProgramSummary
  } = useProgramConnection();

  // Use custom hook for product selection and hydration
  const {
    selectedProduct,
    handleProductChange,
    handleTemplateUpdate
  } = useProductSelection(product, programSummary, isConfiguratorOpen);

  // Track previous product to detect when product is newly selected (not just manually opening configurator)
  const previousSelectedProductRef = useRef<ProductType | null>(selectedProduct);
  
  // Auto-close configurator when product is NEWLY selected and plan exists (so preview can start)
  // This should NOT trigger when user manually opens configurator to edit existing selection
  useEffect(() => {
    const productJustChanged = previousSelectedProductRef.current !== selectedProduct;
    previousSelectedProductRef.current = selectedProduct;
    
    // Only auto-close if:
    // 1. Product was just selected (changed from previous value)
    // 2. Product exists
    // 3. Plan exists
    // 4. Configurator is open
    // This prevents auto-close when user manually clicks "Edit" to open configurator
    if (productJustChanged && selectedProduct && plan && isConfiguratorOpen) {
      // Close configurator after a short delay to allow hydration to complete
      const timer = setTimeout(() => {
        setIsConfiguratorOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedProduct, plan, isConfiguratorOpen]);

  // Use custom hook for template management
  const templateManagement = useTemplateManagement(selectedProduct, programSummary, isConfiguratorOpen);
  const {
    customSections,
    customDocuments,
    templateLoading,
    disabledSections,
    disabledDocuments,
    allSections: allSectionsFromHook,
    allDocuments: allDocumentsFromHook,
    setCustomSections,
    setCustomDocuments,
    setDisabledSections,
    setDisabledDocuments,
    toggleSection: toggleSectionBase,
    toggleDocument,
    removeCustomSection,
    removeCustomDocument
  } = templateManagement;

  // Use custom hook for document management
  const documentManagement = useDocumentManagement(
    selectedProduct || 'submission', // Default to submission if null
    programSummary,
    allSectionsFromHook,
    allDocumentsFromHook,
    disabledSections,
    setActiveSection
  );
  const {
    clickedDocumentId,
    productDocumentSelections,
    updateProductSelection,
    handleSelectDocument,
    addCustomDocument: addCustomDocumentBase,
    documentPlan
  } = documentManagement;

  const connectCopy = useMemo<ConnectCopy>(
    () => ({
      badge: (t('editor.connect.badge' as any) as string) || 'Program options',
      heading: (t('editor.connect.heading' as any) as string) || 'Pick a program or paste a link',
      description:
        (t('editor.connect.description' as any) as string) ||
        'ProgramFinder can suggest matches from your answers. Already have an official funding URL (AWS, FFG, EU call)? Paste it and we’ll pull the requirements automatically.',
      openFinder: (t('editor.connect.openFinder' as any) as string) || 'Open ProgramFinder',
      pasteLink: (t('editor.connect.pasteLink' as any) as string) || 'Paste program link',
      inputLabel: (t('editor.connect.inputLabel' as any) as string) || 'Official program URL',
      placeholder: (t('editor.connect.placeholder' as any) as string) || 'e.g. https://www.aws.at/funding/...',
      example:
        (t('editor.connect.example' as any) as string) ||
        'Example: https://www.aws.at/funding/aws-preseed/page_123 or https://www.ffg.at/calls/page_456',
      submit: (t('editor.connect.submit' as any) as string) || 'Load program',
      error: (t('editor.connect.error' as any) as string) || 'Please enter a valid program URL.'
    }),
    [t]
  );

  const productOptions = useMemo(
    () =>
      PRODUCT_TYPE_CONFIG.map((option) => ({
        value: option.value,
        label: (t(option.labelKey as any) as string) || option.value,
        description: (t(option.descriptionKey as any) as string) || '',
        icon: option.icon
      })),
    [t]
  );

  // Apply pending program changes when configurator closes
  const [pendingProgramChange, setPendingProgramChange] = useState<ProgramSummary | null | undefined>(undefined);
  
  useEffect(() => {
    if (!isConfiguratorOpen && pendingProgramChange !== undefined) {
      setProgramSummary(pendingProgramChange);
      setPendingProgramChange(undefined);
    }
  }, [isConfiguratorOpen, pendingProgramChange, setProgramSummary]);

  // Track filtered section IDs for sidebar filtering
  const [filteredSectionIds, setFilteredSectionIds] = useState<string[] | null>(null);
  // Track editing section for inline editor - MUST BE DECLARED BEFORE useMemo
  // Auto-open editor when section is selected from sidebar
  // Always show editor - default to active section if no explicit editingSectionId
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  // Always show editor - simple logic: use editingSectionId, then activeSectionId, then default to first section or METADATA
  const effectiveEditingSectionId = useMemo(() => {
    if (!plan) return null;
    
    // Priority 1: Explicitly set editing section
    if (editingSectionId) return editingSectionId;
    
    // Priority 2: Active section
    if (activeSectionId) return activeSectionId;
    
    // Priority 3: First regular section
    if (plan.sections && plan.sections.length > 0) {
      return plan.sections[0].id;
    }
    
    // Priority 4: METADATA (always available)
    return METADATA_SECTION_ID;
  }, [editingSectionId, activeSectionId, plan]);
  
  // UI state for template management
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');
  const [sectionFilter] = useState<'all' | 'master' | 'program' | 'custom'>('all');
  const [documentFilter] = useState<'all' | 'master' | 'program' | 'custom'>('all');
  
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<SectionTemplate | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentTemplate | null>(null);

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
    
    // Don't trigger hydration if configurator is open or we're suppressing navigation
    // This prevents jumps when toggling sections/documents
    if (isConfiguratorOpen || suppressNavigationRef.current) {
      // Still update refs to track the change, but don't hydrate yet
      prevDisabledSectionsRef.current = disabledSectionsKey;
      prevDisabledDocumentsRef.current = disabledDocumentsKey;
      prevCustomSectionsLengthRef.current = customSections.length;
      prevCustomDocumentsLengthRef.current = customDocuments.length;
      prevCustomSectionsKeyRef.current = customSectionsKey;
      prevCustomDocumentsKeyRef.current = customDocumentsKey;
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
    
    handleTemplateUpdate({
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

  // Template management handlers - wrap hook functions with navigation suppression
  const toggleSection = useCallback((sectionId: string) => {
    // Mark that this is a toggle action to prevent auto-navigation
    sectionChangeSourceRef.current = 'scroll'; // Use 'scroll' to prevent navigation in useEffect
    suppressNavigationRef.current = true; // Suppress navigation during toggle
    toggleSectionBase(sectionId, activeSectionId);
    // Clear suppression after toggle completes
    setTimeout(() => {
      suppressNavigationRef.current = false;
    }, 150);
  }, [activeSectionId, isConfiguratorOpen, toggleSectionBase]);

  const addCustomSection = useCallback(() => {
    if (!newSectionTitle.trim()) {
      return;
    }
    
    // Check if an additional document is selected
    const currentPlan = useEditorStore.getState().plan;
    const isAdditionalDocument = clickedDocumentId && currentPlan?.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId);
    
    if (isAdditionalDocument && clickedDocumentId && currentPlan) {
      // Add section to document-specific sections (Section[], not SectionTemplate[])
      const sectionId = `custom_section_${Date.now()}`;
      const newSection: Section = {
        id: sectionId,
        title: newSectionTitle.trim(),
        description: newSectionDescription.trim() || 'Benutzerdefinierter Abschnitt',
        questions: [],
        datasets: [],
        kpis: [],
        media: [],
        collapsed: false,
        category: 'custom',
        progress: 0
      };
      
      const documentSections = currentPlan.metadata?.documentSections || {};
      const currentDocumentSections = documentSections[clickedDocumentId] || [];
      
      useEditorStore.setState({
        plan: {
          ...currentPlan,
          id: currentPlan.id || `plan_${Date.now()}`,
          metadata: {
            ...currentPlan.metadata,
            documentSections: {
              ...documentSections,
              [clickedDocumentId]: [...currentDocumentSections, newSection]
            }
          }
        }
      });
      
      // Also add as SectionTemplate for consistency (needed for template management)
      const newSectionTemplate: SectionTemplate = {
        id: sectionId,
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
      setCustomSections(prev => [...prev, newSectionTemplate]);
    } else {
      // Add to core product custom sections (original behavior)
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
      setCustomSections(prev => [...prev, newSection]);
    }
    
    setNewSectionTitle('');
    setNewSectionDescription('');
    setShowAddSection(false);
    lastUpdateRef.current = '';
  }, [newSectionTitle, newSectionDescription, customSections.length, clickedDocumentId, programSummary?.fundingType]);

  // Wrapper for addCustomDocument that updates local state
  const addCustomDocument = useCallback(() => {
    const newDocument = addCustomDocumentBase(newDocumentName, newDocumentDescription, () => {
      setEditingSectionId(null); // Clear any editing section
    });
    if (newDocument) {
      setCustomDocuments(prev => [...prev, newDocument]);
      setNewDocumentName('');
      setNewDocumentDescription('');
      setShowAddDocument(false);
    }
  }, [newDocumentName, newDocumentDescription, addCustomDocumentBase, setCustomDocuments]);


  const toggleAddSectionBadge = useCallback(() => {
    setShowAddSection(prev => {
      if (prev) {
        setNewSectionTitle('');
        setNewSectionDescription('');
      }
      return !prev;
    });
  }, []);

  const toggleAddDocumentBadge = useCallback(() => {
    setShowAddDocument(prev => {
      if (prev) {
        setNewDocumentName('');
        setNewDocumentDescription('');
      }
      return !prev;
    });
  }, []);

  const handleEditSection = useCallback((section: SectionTemplate, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSection({ ...section });
    setExpandedSectionId(section.id);
  }, []);

  // Wrapper for handleSelectDocument that also handles expandedDocumentId
  const handleSelectDocumentWrapper = useCallback((docId: string | null) => {
    handleSelectDocument(docId);
    
    if (docId && expandedDocumentId === docId) {
      setExpandedDocumentId(null);
      setEditingDocument(null);
    }
  }, [expandedDocumentId, handleSelectDocument]);

  const handleEditDocument = useCallback((doc: DocumentTemplate, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDocument({ ...doc });
    setExpandedDocumentId(doc.id);
  }, []);

  const handleSaveSection = useCallback((item: SectionTemplate | DocumentTemplate) => {
    const section = item as SectionTemplate;
    if (section.origin === 'custom') {
      setCustomSections(prev => prev.map(s => s.id === section.id ? section : s));
    } else {
      const updatedSection = { 
        ...section, 
        id: `custom_${section.id}_${Date.now()}`,
        origin: 'custom' as const 
      };
      setCustomSections(prev => [...prev, updatedSection]);
      setDisabledSections(prev => new Set([...prev, section.id]));
    }
    
    setExpandedSectionId(null);
    setEditingSection(null);
  }, []);

  const handleSaveDocument = useCallback((item: SectionTemplate | DocumentTemplate) => {
    const document = item as DocumentTemplate;
    if (document.origin === 'custom') {
      setCustomDocuments(prev => prev.map(d => d.id === document.id ? document : d));
    } else {
      const updatedDocument = { 
        ...document, 
        id: `custom_${document.id}_${Date.now()}`,
        origin: 'custom' as const 
      };
      setCustomDocuments(prev => [...prev, updatedDocument]);
      setDisabledDocuments(prev => new Set([...prev, document.id]));
    }
    
    setExpandedDocumentId(null);
    setEditingDocument(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setExpandedSectionId(null);
    setExpandedDocumentId(null);
    setEditingSection(null);
    setEditingDocument(null);
  }, []);

  const handleTemplatesExtracted = useCallback((templates: { sections?: SectionTemplate[]; documents?: DocumentTemplate[] }) => {
    if (templates.sections && templates.sections.length > 0) {
      setCustomSections(prev => [...prev, ...templates.sections!]);
    }
    if (templates.documents && templates.documents.length > 0) {
      setCustomDocuments(prev => [...prev, ...templates.documents!]);
    }
  }, []);

  // Use values from hooks
  const allSections = allSectionsFromHook;
  const allDocuments = allDocumentsFromHook;
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
    if (templateLoading || !selectedProduct) return;
    const restoredSelection = restoreSelectionForProduct(selectedProduct, allDocuments);
    if (!restoredSelection && clickedDocumentId) {
      updateProductSelection(selectedProduct, null);
      return;
    }
    if (restoredSelection && restoredSelection !== clickedDocumentId) {
      updateProductSelection(selectedProduct, restoredSelection);
    }
  }, [
    allDocuments,
    allDocumentsKey,
    clickedDocumentId,
    templateLoading,
    selectedProduct,
    restoreSelectionForProduct,
    updateProductSelection
  ]);
  
  // Filter sections based on clicked document - match by category or name keywords
  const getRelatedSections = useCallback((documentId: string | null) => {
    if (!documentId) return allSections;
    
    const doc = allDocuments.find(d => d.id === documentId);
    if (!doc) return allSections;
    
    const docNameLower = doc.name.toLowerCase();
    const docCategoryLower = doc.category?.toLowerCase() || '';
    
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
    
    const productKeywords = selectedProduct ? (keywordsByProduct[selectedProduct] || keywordsByProduct.submission) : keywordsByProduct.submission;
    
    const matchingKeywords: string[] = [];
    for (const [key, values] of Object.entries(productKeywords)) {
      if (docNameLower.includes(key) || docCategoryLower.includes(key)) {
        const valuesArray = Array.isArray(values) ? values : [];
        matchingKeywords.push(...valuesArray);
      }
    }
    
    const related = allSections.filter(section => {
      const sectionTitleLower = section.title.toLowerCase();
      const sectionCategoryLower = section.category?.toLowerCase() || '';
      
      if (docCategoryLower && sectionCategoryLower && docCategoryLower === sectionCategoryLower) {
        return true;
      }
      
      if (matchingKeywords.length > 0) {
        return matchingKeywords.some(keyword => 
          sectionTitleLower.includes(keyword) || sectionCategoryLower.includes(keyword)
        );
      }
      
      return false;
    });
    
    return related;
  }, [allSections, allDocuments, selectedProduct]);
  
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
  
  const visibleFilteredSections = useMemo(() => {
    return filteredSections.filter(s => !disabledSections.has(s.id));
  }, [filteredSections, disabledSections]);

  // const _enabledSectionsCount = visibleSections.length; // Unused for now
  const enabledDocumentsCount = visibleDocuments.length + 1; // +1 for core product
  const totalDocumentsCount = allDocuments.length + 1; // +1 for core product

  // getOriginBadge function
  const getOriginBadge = useCallback((origin?: string, isSelected: boolean = false) => {
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
  }, []);

  // Handle document selection changes - navigate to first filtered section
  const handleDocumentSelectionChange = useCallback((sectionIds: string[]) => {
    if (!plan) return;
    
    // Store filtered section IDs for sidebar filtering
    setFilteredSectionIds(sectionIds.length > 0 ? sectionIds : null);
    
    // Check if current active section is already in the filtered list - if so, don't navigate
    if (activeSectionId && sectionIds.length > 0 && sectionIds.includes(activeSectionId)) {
      return; // Already on a filtered section, no need to navigate
    }
    
    if (sectionIds.length === 0) {
      // If no filtered sections (core product selected), navigate to first available section or metadata
      const firstSection = plan.sections[0];
      if (firstSection && firstSection.id !== activeSectionId) {
        setActiveSection(firstSection.id);
      } else if (!activeSectionId || activeSectionId !== METADATA_SECTION_ID) {
        setActiveSection(METADATA_SECTION_ID);
      }
      return;
    }
    
    // Find the first filtered section that exists in the plan
    const firstFilteredSection = plan.sections.find(section => 
      sectionIds.includes(section.id)
    );
    
    if (firstFilteredSection && firstFilteredSection.id !== activeSectionId) {
      // Navigate to the first filtered section (only if different from current)
      setActiveSection(firstFilteredSection.id);
    } else if (!firstFilteredSection) {
      // If filtered sections don't exist in plan yet, navigate to first available
      const firstSection = plan.sections[0];
      if (firstSection && firstSection.id !== activeSectionId) {
        setActiveSection(firstSection.id);
      } else if (!activeSectionId || activeSectionId !== METADATA_SECTION_ID) {
        setActiveSection(METADATA_SECTION_ID);
      }
    }
  }, [plan, setActiveSection, activeSectionId]);

  // Notify parent when document selection changes and filtered sections are available
  const lastNotifiedDocumentRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (templateLoading) return;
    
    if (lastNotifiedDocumentRef.current === clickedDocumentId) {
      return;
    }
    
    lastNotifiedDocumentRef.current = clickedDocumentId;
    
    const filteredSectionIds = visibleFilteredSections.map(s => s.id);
    handleDocumentSelectionChange(filteredSectionIds);
  }, [clickedDocumentId, visibleFilteredSections, templateLoading, handleDocumentSelectionChange]);

  // Compute template state for DocumentsBar and Sidebar
  const selectedProductMeta = selectedProduct ? productOptions.find((option) => option.value === selectedProduct) ?? null : null;
  const templateState = useMemo(() => {
    // If no product is selected, return a default state with empty counts
    if (!selectedProduct) {
      return {
        filteredDocuments: [],
        allDocuments: [],
        disabledDocuments: new Set(),
        enabledDocumentsCount: 0,
        expandedDocumentId: null,
        editingDocument: null,
        clickedDocumentId: null,
        showAddDocument: false,
        newDocumentName: '',
        newDocumentDescription: '',
        filteredSections: [],
        allSections: [],
        disabledSections: new Set(),
        expandedSectionId: null,
        editingSection: null,
        showAddSection: false,
        newSectionTitle: '',
        newSectionDescription: '',
        selectionSummary: {
          productLabel: t('editor.desktop.product.unselected' as any) || 'Not selected',
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
          onToggleSection: () => {},
          onEditSection: () => {},
          onSaveSection: () => {},
          onCancelEditSection: () => {},
          onToggleAddSection: () => {},
          onAddCustomSection: () => {},
          onSetNewSectionTitle: () => {},
          onSetNewSectionDescription: () => {},
          onRemoveCustomSection: () => {},
          getOriginBadge: () => null
        }
      };
    }
    
    // If templates are loading, return a loading state (but still return an object)
    if (templateLoading) {
      return {
        filteredDocuments: [],
        allDocuments: [],
        disabledDocuments: new Set(),
        enabledDocumentsCount: 0,
        expandedDocumentId: null,
        editingDocument: null,
        clickedDocumentId: null,
        showAddDocument: false,
        newDocumentName: '',
        newDocumentDescription: '',
        filteredSections: [],
        allSections: [],
        disabledSections: new Set(),
        expandedSectionId: null,
        editingSection: null,
        showAddSection: false,
        newSectionTitle: '',
        newSectionDescription: '',
        selectionSummary: {
          productLabel: selectedProductMeta?.label ?? (t('editor.desktop.product.unselected' as any) || 'Not selected'),
          productIcon: selectedProductMeta?.icon,
          programLabel: programSummary?.name ?? null,
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
          onToggleSection: () => {},
          onEditSection: () => {},
          onSaveSection: () => {},
          onCancelEditSection: () => {},
          onToggleAddSection: () => {},
          onAddCustomSection: () => {},
          onSetNewSectionTitle: () => {},
          onSetNewSectionDescription: () => {},
          onRemoveCustomSection: () => {},
          getOriginBadge: () => null
        }
      };
    }
    
    // When an additional document is selected, use document-specific sections for counts
    let sectionsForCount = visibleSections;
    let totalSectionsForCount = allSections.length;
    let sectionTitlesForCount = visibleSections.map((section) => section.title);
    
    if (clickedDocumentId && plan) {
      const isAdditionalDocument = plan.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId);
      if (isAdditionalDocument) {
        // Use document-specific sections (these are Section[], not SectionTemplate[])
        const documentSections = plan.metadata?.documentSections?.[clickedDocumentId] || [];
        // Convert to section titles for display
        sectionTitlesForCount = documentSections.map((section) => section.title);
        totalSectionsForCount = documentSections.length;
        // For additional documents, enabledSectionsCount should be documentSections.length (not visibleSections)
        sectionsForCount = documentSections as any; // Use document sections for count
      }
    }
    
    const sectionTitles = sectionTitlesForCount;
    const documentTitles = visibleDocuments.map((doc) => doc.name);
    const productLabel = selectedProductMeta?.label ?? (t('editor.desktop.product.unselected' as any) || 'Not selected');
    const programLabel = programSummary?.name ?? null;
    
    // Get selected document name if additional document is selected
    const selectedDocumentName = clickedDocumentId && plan
      ? (() => {
          const isAdditionalDocument = plan.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId);
          if (isAdditionalDocument) {
            const doc = plan.metadata?.customDocuments?.find(doc => doc.id === clickedDocumentId);
            return doc?.name || null;
          }
          return null;
        })()
      : null;
    
    // When an additional document is selected, filter allSections to show only document-specific sections
    let sectionsForCurrentSelection = allSections;
    if (clickedDocumentId && plan) {
      const isAdditionalDocument = plan.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId);
      if (isAdditionalDocument) {
        // For additional documents, only show sections that exist in documentPlan
        const documentSections = plan.metadata?.documentSections?.[clickedDocumentId] || [];
        const documentSectionIds = new Set(documentSections.map(s => s.id));
        // Filter allSections to only include sections that are in the document
        // For additional documents, show sections that exist in documentSections
        // This will be empty initially, but sections will appear as they're added
        sectionsForCurrentSelection = allSections.filter(section => documentSectionIds.has(section.id));
      }
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
      allSections: sectionsForCurrentSelection, // Filtered for additional documents
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
        onSelectDocument: handleSelectDocumentWrapper,
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
    };
  }, [
    templateLoading,
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
    customSections, // Include customSections so templateState updates when sections are added
    disabledSections,
    plan, // Include plan so templateState updates when documentSections change
    expandedSectionId,
    editingSection,
    showAddSection,
    newSectionTitle,
    newSectionDescription,
    visibleSections,
    visibleDocuments,
    totalDocumentsCount,
    selectedProductMeta,
    programSummary,
    t,
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


  // Track if activeSectionId change was from user interaction (sidebar click) vs scroll detection
  const sectionChangeSourceRef = useRef<'user' | 'scroll' | 'preview'>('scroll');
  // Track if we should suppress navigation (e.g., from toggle or configurator closing)
  const suppressNavigationRef = useRef(false);
  const previousConfiguratorOpenRef = useRef(isConfiguratorOpen);
  // Track the last section that was explicitly selected by the user (not from toggle/configurator)
  const lastUserSelectedSectionRef = useRef<string | null>(null);

  // Wrapper for setActiveSection that tracks the source
  const handleSectionSelect = useCallback((sectionId: string, source: 'user' | 'scroll' | 'preview' = 'user') => {
    sectionChangeSourceRef.current = source;
    suppressNavigationRef.current = false; // User interaction should allow navigation
    setActiveSection(sectionId);
  }, [setActiveSection]);

  // Track configurator state changes to suppress navigation when closing
  // This MUST run BEFORE the auto-activate effect to prevent jumps
  useEffect(() => {
    // If configurator just closed, suppress navigation temporarily
    if (previousConfiguratorOpenRef.current && !isConfiguratorOpen) {
      // Set suppression IMMEDIATELY and synchronously before any other effects run
      suppressNavigationRef.current = true;
      sectionChangeSourceRef.current = 'scroll'; // Mark as non-user action to prevent navigation
      // Clear suppression after a longer delay to allow state to settle completely
      setTimeout(() => {
        suppressNavigationRef.current = false;
      }, 500); // Increased delay to ensure all state updates complete
    }
    previousConfiguratorOpenRef.current = isConfiguratorOpen;
  }, [isConfiguratorOpen]);

  // Auto-activate editor when plan loads or activeSectionId changes
  useEffect(() => {
    if (!plan) return;
    
    // Don't auto-navigate when configurator is open (user is configuring)
    if (isConfiguratorOpen) return;
    
    // Don't auto-navigate if we're suppressing navigation (from toggle or configurator closing)
    if (suppressNavigationRef.current) return;
    
    // For new users (activeSectionId is null), don't auto-navigate - let them configure first
    // Unified logic: if activeSectionId is null, user hasn't started configuring yet
    // This works for both new users and when they're on the configurator
    if (!activeSectionId) {
      // New user or configurator open - don't auto-navigate, keep them on configurator
      return;
    }
    
    // Auto-open editor for active section
    const isMetadataSection = activeSectionId === METADATA_SECTION_ID || 
                              activeSectionId === ANCILLARY_SECTION_ID || 
                              activeSectionId === REFERENCES_SECTION_ID || 
                              activeSectionId === APPENDICES_SECTION_ID;
    
    // Check if active section is disabled - if so and configurator is closed, find first enabled section
    // But only do this if the change was from user interaction (sidebar click), not from toggle or scroll
    // When toggling, sectionChangeSourceRef is set to 'scroll' to prevent this navigation
    if (disabledSections.has(activeSectionId) && !isConfiguratorOpen && sectionChangeSourceRef.current === 'user') {
      const firstEnabledSection = plan.sections.find(s => !disabledSections.has(s.id));
      if (firstEnabledSection) {
        sectionChangeSourceRef.current = 'user';
        setActiveSection(firstEnabledSection.id);
      } else {
        sectionChangeSourceRef.current = 'user';
        setActiveSection(METADATA_SECTION_ID);
      }
      return;
    }
    
    // Only set editingSectionId if activeSectionId actually changed from user interaction
    // Don't change it if it was from a toggle (scroll) or configurator closing
    // CRITICAL: Only update if:
    // 1. Configurator is closed
    // 2. Not suppressing navigation
    // 3. Section is not disabled
    // 4. Source is from user interaction (not scroll/toggle)
    // 5. Active section matches the last user-selected section (prevents updates from toggles)
    if (!isConfiguratorOpen && 
        !suppressNavigationRef.current &&
        (!disabledSections.has(activeSectionId)) && 
        sectionChangeSourceRef.current !== 'scroll' &&
        (sectionChangeSourceRef.current === 'user' || sectionChangeSourceRef.current === 'preview') &&
        activeSectionId === lastUserSelectedSectionRef.current &&
        (!editingSectionId || editingSectionId !== activeSectionId)) {
      setEditingSectionId(activeSectionId);
    }
    
    // For regular sections, set first question as active if not already set
    // But don't do this when configurator is open to prevent jumps
    if (!isConfiguratorOpen && !isMetadataSection) {
      const section = plan.sections.find(s => s.id === activeSectionId);
      if (section && !activeQuestionId) {
        setActiveQuestion(section.questions[0]?.id ?? null);
      }
    }

    // If change was from user interaction (sidebar click) or preview click, scroll to section
    // But don't scroll when configurator is open
    if (!isConfiguratorOpen && (sectionChangeSourceRef.current === 'user' || sectionChangeSourceRef.current === 'preview')) {
      const scrollToSection = () => {
        const scrollContainer = document.getElementById('preview-scroll-container');
        if (!scrollContainer) {
          console.log('[Scroll] Scroll container not found');
          return false;
        }

        // Find the section element - try multiple strategies
        let sectionElement: HTMLElement | null = null;
        
        // Strategy 1: Query within scroll container (most reliable)
        sectionElement = scrollContainer.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        
        // Strategy 2: Query within export-preview class (where sections are rendered)
        if (!sectionElement) {
          const exportPreview = scrollContainer.querySelector('.export-preview');
          if (exportPreview) {
            sectionElement = exportPreview.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
          }
        }

        // Strategy 3: Query entire document (fallback)
        if (!sectionElement) {
          sectionElement = document.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        }

        if (sectionElement) {
          // Use scrollIntoView for reliable scrolling
          // This handles all edge cases including transforms and scaling
          // For metadata sections, scroll to top of page
          const isMetadataSectionScroll = activeSectionId === METADATA_SECTION_ID || 
                                        activeSectionId === ANCILLARY_SECTION_ID || 
                                        activeSectionId === REFERENCES_SECTION_ID || 
                                        activeSectionId === APPENDICES_SECTION_ID;
          
          sectionElement.scrollIntoView({
            behavior: 'smooth',
            block: isMetadataSectionScroll ? 'start' : 'center',
            inline: 'nearest'
          });
          
          console.log('[Scroll] Scrolled to section:', activeSectionId);
          return true;
        } else {
          console.log('[Scroll] Section element not found:', activeSectionId);
        }
        
        return false;
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Try immediately
        if (!scrollToSection()) {
          // Element not found yet, retry with increasing delays
          const retries = [100, 300, 500, 1000, 2000];
          let retryIndex = 0;
          
          const retryScroll = () => {
            if (retryIndex < retries.length) {
              setTimeout(() => {
                if (scrollToSection()) {
                  // Success, stop retrying
                  return;
                }
                retryIndex++;
                retryScroll();
              }, retries[retryIndex]);
            } else {
              console.warn('[Scroll] Section element not found after all retries:', activeSectionId);
            }
          };
          
          retryScroll();
        }
      });
    }
    
    // Reset source after handling (but don't reset if we're suppressing navigation)
    // Also don't reset if source is already 'scroll' (from toggle/configurator close)
    if (!suppressNavigationRef.current && sectionChangeSourceRef.current !== 'scroll') {
      sectionChangeSourceRef.current = 'scroll';
    }
  }, [activeSectionId, plan, activeQuestionId, editingSectionId, setActiveSection, setActiveQuestion, setEditingSectionId, isConfiguratorOpen]);

  // Scroll detection to update active section when scrolling through preview
  // Uses IntersectionObserver for more reliable detection
  useEffect(() => {
    if (!plan || plan.sections.length === 0) return;

    const scrollContainer = document.getElementById('preview-scroll-container');
    if (!scrollContainer) return;

    // Use IntersectionObserver for better reliability
    const observerOptions = {
      root: scrollContainer,
      rootMargin: '-20% 0px -20% 0px', // Only trigger when section is in center 60% of viewport
      threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0] // Multiple thresholds for better detection
    };

    interface SectionVisibility {
      id: string;
      ratio: number;
      isIntersecting: boolean;
    }

    const sectionVisibility = new Map<string, SectionVisibility>();

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const sectionId = (entry.target as HTMLElement).getAttribute('data-section-id');
        if (!sectionId) return;

        sectionVisibility.set(sectionId, {
          id: sectionId,
          ratio: entry.intersectionRatio,
          isIntersecting: entry.isIntersecting
        });
      });

      // Find the section with highest visibility ratio that's intersecting
      const intersectingSections = Array.from(sectionVisibility.values()).filter(v => v.isIntersecting);
      const bestSection = intersectingSections.length > 0 
        ? intersectingSections.reduce((best, current) => 
            current.ratio > best.ratio ? current : best
          )
        : null;

      // Update active section if we found a better match
      if (bestSection && bestSection.ratio > 0.1 && bestSection.id !== activeSectionId) {
        const bestSectionId: string = bestSection.id;
        
        // Check if this is a metadata section
        const isMetadataSection = bestSectionId === METADATA_SECTION_ID || 
                                  bestSectionId === ANCILLARY_SECTION_ID || 
                                  bestSectionId === REFERENCES_SECTION_ID || 
                                  bestSectionId === APPENDICES_SECTION_ID;
        
        if (isMetadataSection) {
          // For metadata sections, clear editingSectionId (no inline editor)
          handleSectionSelect(bestSectionId, 'scroll');
          setEditingSectionId(null); // Clear any existing editor
        } else {
          // For regular sections, find the section and update editor
          const sectionToEdit = plan.sections.find(s => s.id === bestSectionId);
          if (sectionToEdit) {
            // Mark as scroll-triggered change and update
            handleSectionSelect(bestSectionId, 'scroll');
            // Only update question if we don't have one selected or if it's a different section
            if (!activeQuestionId || activeSectionId !== bestSectionId) {
              setActiveQuestion(sectionToEdit.questions[0]?.id ?? null);
            }
            // Update editor to follow the new active section
            setEditingSectionId(bestSectionId);
          }
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section elements
    const observeSections = () => {
      // Try scroll container first
      const sectionElements = scrollContainer.querySelectorAll('[data-section-id]');
      
      if (sectionElements.length === 0) {
        // Fallback to global query
        const globalSections = document.querySelectorAll('[data-section-id]');
        globalSections.forEach((el) => {
          observer.observe(el as HTMLElement);
        });
      } else {
        sectionElements.forEach((el) => {
          observer.observe(el as HTMLElement);
        });
      }
    };

    // Initial observation - wait a bit for DOM to be ready
    const observeTimeout = setTimeout(observeSections, 200);

    // Also observe on scroll (in case new sections are added)
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        // Re-observe in case new sections appeared
        observeSections();
      }, 500);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(observeTimeout);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [plan, activeSectionId, activeQuestionId, editingSectionId, setActiveSection, setActiveQuestion, setEditingSectionId]);

  const isAncillaryView = activeSectionId === ANCILLARY_SECTION_ID;
  const isMetadataView = activeSectionId === METADATA_SECTION_ID;
  const isSpecialWorkspace = isAncillaryView || isMetadataView;
  // Get active section - use effectiveEditingSectionId to find section being edited
  // Use documentPlan to get correct sections (document-specific or core product)
  const activeSection: Section | null = useMemo(() => {
    if (!plan || !documentPlan) return null;
    const currentPlan = documentPlan; // Use document-specific plan if additional document is selected
    // Use effectiveEditingSectionId (which defaults to activeSectionId if not explicitly set)
    if (effectiveEditingSectionId) {
      // For special sections, they're not in plan.sections, so return null
      if (effectiveEditingSectionId === METADATA_SECTION_ID || 
          effectiveEditingSectionId === ANCILLARY_SECTION_ID || 
          effectiveEditingSectionId === REFERENCES_SECTION_ID || 
          effectiveEditingSectionId === APPENDICES_SECTION_ID) {
        return null;
      }
      return currentPlan.sections.find((section) => section.id === effectiveEditingSectionId) ?? null;
    }
    // Otherwise use activeSectionId
    if (isSpecialWorkspace) return null;
    return currentPlan.sections.find((section) => section.id === activeSectionId) ?? currentPlan.sections[0] ?? null;
  }, [plan, documentPlan, activeSectionId, isSpecialWorkspace, effectiveEditingSectionId]);
  const activeQuestion: Question | null = useMemo(() => {
    if (!activeSection) return null;
    return (
      activeSection.questions.find((question) => question.id === activeQuestionId) ??
      activeSection.questions[0] ??
      null
    );
  }, [activeSection, activeQuestionId]);

  // Debug logging for InlineSectionEditor rendering
  useEffect(() => {
    if (plan) {
      console.log('[Editor] InlineSectionEditor render state:', {
        hasPlan: !!plan,
        effectiveEditingSectionId,
        activeSectionId,
        editingSectionId,
        hasActiveSection: !!activeSection,
        activeQuestionId,
        planSectionsCount: plan.sections?.length || 0
      });
    }
  }, [plan, effectiveEditingSectionId, activeSectionId, editingSectionId, activeSection, activeQuestionId]);

  // Show loading/error states
  // Note: We don't show a special state for null product - we show the full UI with empty states

  // Show loading only if we have a product selected and are actually loading
  // If no product is selected, show the full UI (user needs to select product first)
  // Also check if plan is being created (isLoading) or if we're waiting for plan after hydration
  // IMPORTANT: Only show loading if we're actively loading AND have a product selected
  // Don't show loading if product is selected but plan doesn't exist yet (hydration might be in progress)
  // Give hydration a reasonable timeout - if it takes more than 10 seconds, something is wrong
  const isWaitingForPlan = selectedProduct && isLoading;
  // Remove hasNoPlanAfterProduct check - if hydration completes, plan will exist
  // If plan doesn't exist after loading completes, it's an error state, not a loading state
  
  if (isWaitingForPlan) {
    return (
      <>
        <DevClearCacheButton />
        <div className="h-screen flex flex-col items-center justify-center text-gray-500 space-y-2">
          <div>{(t('editor.ui.loadingEditor' as any) as string) || 'Loading editor...'}</div>
          <div className="text-xs text-gray-400">{(t('editor.ui.initializingPlan' as any) as string) || 'Initializing plan...'}</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DevClearCacheButton />
        <div className="h-screen flex flex-col items-center justify-center space-y-4">
          <p className="text-red-500 font-semibold">{error}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => hydrate(product)}
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="bg-neutral-200 text-textPrimary">
      {/* Dev Tools - Clear Cache Button */}
      <DevClearCacheButton />
      
      {/* Workspace - always show (will show empty states when no product/plan) */}
      {(
        <>
          <div className="container pb-6">
            <div className="relative rounded-[32px] border border-dashed border-white shadow-[0_30px_80px_rgba(6,12,32,0.65)]">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900 rounded-[32px]" />
              <div className="relative z-10 flex flex-col gap-2 p-4 lg:p-6 min-h-0" style={{ overflowX: 'hidden', overflowY: 'visible', height: 'calc(100vh + 90px)', maxHeight: 'calc(100vh + 90px)' }}>
                {/* Template management is now handled directly in Editor.tsx */}
                
                {/* Dein Schreibtisch Header */}
                <div className="flex-shrink-0 mb-2">
                  <h1 className="text-xl font-bold uppercase tracking-wide text-white">
                    🖥️ {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
                  </h1>
                </div>

                {/* Workspace Container - Document-Centric Layout */}
                <div className="relative rounded-2xl border border-dashed border-white/60 bg-slate-900/40 p-4 lg:p-6 shadow-lg backdrop-blur-sm w-full flex-1 min-h-0" style={{ overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
                  {/* Grid Layout: 2 rows, 2 columns */}
                  <div ref={workspaceGridRef} className="grid grid-cols-[320px_1fr] grid-rows-[auto_1fr] gap-4 flex-1 min-h-0" style={{ overflow: 'visible', position: 'relative', contain: 'layout style' }}>
                    {/* Row 1, Col 1: Current Selection - Matches DocumentsBar height */}
                    <div className="flex-shrink-0 relative min-h-0 flex flex-col" style={{ zIndex: 0, overflow: 'visible', contain: 'none', height: 'fit-content', maxHeight: 'fit-content' }}>
                      {templateState && templateState.selectionSummary ? (
                        <CurrentSelection
                          productLabel={templateState.selectionSummary.productLabel}
                          productIcon={templateState.selectionSummary.productIcon}
                          programLabel={templateState.selectionSummary.programLabel}
                          selectedDocumentName={templateState?.selectionSummary?.selectedDocumentName}
                          enabledSectionsCount={templateState.selectionSummary.enabledSectionsCount}
                          totalSectionsCount={templateState.selectionSummary.totalSectionsCount}
                          enabledDocumentsCount={templateState.selectionSummary.enabledDocumentsCount}
                          totalDocumentsCount={templateState.selectionSummary.totalDocumentsCount}
                          sectionTitles={templateState.selectionSummary.sectionTitles}
                          documentTitles={templateState.selectionSummary.documentTitles}
                          // Configurator props
                          productType={selectedProduct}
                          productOptions={productOptions}
                          selectedProductMeta={productOptions.find((option) => option.value === selectedProduct) ?? null}
                          connectCopy={connectCopy}
                          programSummary={programSummary}
                          programError={programError}
                          programLoading={programLoading}
                          onChangeProduct={handleProductChange}
                          onConnectProgram={handleConnectProgram}
                          onOpenProgramFinder={() => router.push('/reco')}
                          onTemplatesExtracted={handleTemplatesExtracted}
                          progressSummary={progressSummary}
                          onRunRequirementsCheck={runRequirementsCheck}
                          overlayContainerRef={workspaceGridRef}
                          isOpen={isConfiguratorOpen}
                          onOverlayOpenChange={setIsConfiguratorOpen}
                          // Sections & Documents management
                          allSections={templateState.allSections}
                          allDocuments={templateState.allDocuments}
                          disabledSections={templateState.disabledSections as Set<string>}
                          disabledDocuments={templateState.disabledDocuments as Set<string>}
                          onToggleSection={templateState.handlers.onToggleSection}
                          onToggleDocument={templateState.handlers.onToggleDocument}
                          // Add custom items
                          showAddDocument={templateState.showAddDocument}
                          showAddSection={templateState.showAddSection}
                          newDocumentName={templateState.newDocumentName}
                          newDocumentDescription={templateState.newDocumentDescription}
                          newSectionTitle={templateState.newSectionTitle}
                          newSectionDescription={templateState.newSectionDescription}
                          onToggleAddDocument={templateState.handlers.onToggleAddDocument}
                          onToggleAddSection={templateState.handlers.onToggleAddSection}
                          onAddCustomDocument={templateState.handlers.onAddCustomDocument}
                          onAddCustomSection={templateState.handlers.onAddCustomSection}
                          onSetNewDocumentName={templateState.handlers.onSetNewDocumentName}
                          onSetNewDocumentDescription={templateState.handlers.onSetNewDocumentDescription}
                          onSetNewSectionTitle={templateState.handlers.onSetNewSectionTitle}
                          onSetNewSectionDescription={templateState.handlers.onSetNewSectionDescription}
                        />
                      ) : (
                        <div className="h-full border-r border-white/10 pr-4">
                          <div className="text-white/60 text-sm">Loading selection...</div>
                        </div>
                      )}
                    </div>

                    {/* Row 1, Col 2: Documents Bar - Matches CurrentSelection height */}
                    <div 
                      className="flex-shrink-0 relative min-h-0 flex flex-col" 
                      style={{ 
                        zIndex: templateState?.showAddDocument ? 50 : 0, 
                        overflowY: templateState?.showAddDocument ? 'visible' : 'visible', 
                        overflowX: 'visible', 
                        contain: templateState?.showAddDocument ? 'none' : 'layout', 
                        height: 'fit-content',
                        maxHeight: 'fit-content'
                      }}
                    >
                      {templateState ? (
                        <DocumentsBar
                          filteredDocuments={templateState.filteredDocuments}
                          disabledDocuments={templateState.disabledDocuments as Set<string>}
                          enabledDocumentsCount={templateState.enabledDocumentsCount}
                          expandedDocumentId={templateState.expandedDocumentId}
                          editingDocument={templateState.editingDocument}
                          selectedProductMeta={productOptions.find((option) => option.value === selectedProduct) ?? null}
                          clickedDocumentId={templateState.clickedDocumentId}
                          showAddDocument={templateState.showAddDocument}
                          newDocumentName={templateState.newDocumentName}
                          newDocumentDescription={templateState.newDocumentDescription}
                          onToggleDocument={templateState.handlers.onToggleDocument}
                          onSelectDocument={templateState.handlers.onSelectDocument}
                          onEditDocument={templateState.handlers.onEditDocument}
                          onSaveDocument={templateState.handlers.onSaveDocument}
                          onCancelEdit={templateState.handlers.onCancelEdit}
                          onToggleAddDocument={templateState.handlers.onToggleAddDocument}
                          onAddCustomDocument={templateState.handlers.onAddCustomDocument}
                          onSetNewDocumentName={templateState.handlers.onSetNewDocumentName}
                          onSetNewDocumentDescription={templateState.handlers.onSetNewDocumentDescription}
                          onRemoveCustomDocument={templateState.handlers.onRemoveCustomDocument || (() => {})}
                          getOriginBadge={templateState.handlers.getOriginBadge}
                          isNewUser={(() => {
                            // New user if: no plan exists OR (plan exists but no active section and no clicked document)
                            const isNew = !plan || (!activeSectionId && plan && !clickedDocumentId);
                            return isNew;
                          })()}
                        />
                      ) : (
                        <div className="w-full border-b border-white/10 pb-3 mb-3">
                          <div className="text-white/60 text-sm">Loading documents...</div>
                        </div>
                      )}
                    </div>

                    {/* Row 2, Col 1: Sidebar - Next to Preview */}
                    <div className="border-r border-white/10 pr-4 min-h-0 flex flex-col relative" style={{ maxWidth: '320px', width: '320px', minWidth: '320px', boxSizing: 'border-box', zIndex: 1, overflow: 'hidden' }}>
                      {plan || !selectedProduct ? (
                        <Sidebar
                          plan={documentPlan || plan || {
                            id: 'empty',
                            productType: 'submission' as ProductType,
                            titlePage: defaultTitlePage(),
                            sections: [],
                            references: [],
                            appendices: [],
                            ancillary: defaultAncillary()
                          }}
                          activeSectionId={activeSectionId ?? null}
                        onSelectSection={(sectionId) => handleSectionSelect(sectionId, 'user')}
                        filteredSectionIds={clickedDocumentId ? (() => {
                          // For additional documents, include METADATA_SECTION_ID plus all document sections
                          const documentSections = plan?.metadata?.documentSections?.[clickedDocumentId] || [];
                          return [METADATA_SECTION_ID, ...documentSections.map(s => s.id)];
                        })() : filteredSectionIds}
                        filteredSections={clickedDocumentId ? [] : templateState?.filteredSections}
                        allSections={clickedDocumentId ? [] : templateState?.allSections}
                        disabledSections={templateState?.disabledSections as Set<string> | undefined}
                        expandedSectionId={templateState?.expandedSectionId}
                        editingSection={templateState?.editingSection}
                        showAddSection={templateState?.showAddSection}
                        newSectionTitle={templateState?.newSectionTitle}
                        newSectionDescription={templateState?.newSectionDescription}
                        onToggleSection={templateState?.handlers?.onToggleSection}
                        onEditSection={templateState?.handlers?.onEditSection}
                        onSaveSection={templateState?.handlers?.onSaveSection}
                        onCancelEdit={templateState?.handlers?.onCancelEdit}
                        onToggleAddSection={templateState?.handlers?.onToggleAddSection}
                        onAddCustomSection={templateState?.handlers?.onAddCustomSection}
                        onSetNewSectionTitle={templateState?.handlers?.onSetNewSectionTitle}
                        onSetNewSectionDescription={templateState?.handlers?.onSetNewSectionDescription}
                        onRemoveCustomSection={templateState?.handlers?.onRemoveCustomSection}
                        getOriginBadge={templateState?.handlers?.getOriginBadge}
                        selectedProductMeta={productOptions.find((option) => option.value === selectedProduct) ?? null}
                        programSummary={programSummary ? { name: programSummary.name, amountRange: programSummary.amountRange ?? undefined } : null}
                        selectedProduct={selectedProduct}
                        isNewUser={(() => {
                          // New user only if: no plan exists (no product selected yet)
                          // Once a product is selected and plan exists, show preview even if no section is active
                          const isNew = !plan;
                          if (process.env.NODE_ENV === 'development') {
                            console.log('[Editor] Passing isNewUser to Sidebar', { 
                              activeSectionId, 
                              hasPlan: !!plan, 
                              clickedDocumentId, 
                              isNew 
                            });
                          }
                          return isNew;
                        })()}
                      />
                      ) : (
                        <div className="text-white/60 text-sm p-4">Select a product to see sections</div>
                      )}
                    </div>
                    
                    {/* Row 2, Col 2: Preview - Full Width */}
                    <div className="min-w-0 min-h-0 relative flex flex-col" id="preview-container" style={{ zIndex: 1, overflow: 'hidden' }}>
                      {/* Preview Header - Matches Sidebar header height exactly */}
                      <h2 className="text-lg font-bold uppercase tracking-wide text-white mb-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)' }}>
                        {t('editor.desktop.preview.title' as any) || 'Preview'}
                      </h2>
                      {/* Preview - Always visible */}
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative" id="preview-scroll-container">
                        {plan || !selectedProduct ? (
                          <PreviewWorkspace 
                            plan={documentPlan || plan || {
                              id: 'empty',
                              productType: 'submission' as ProductType,
                              titlePage: defaultTitlePage(),
                              sections: [],
                              references: [],
                              appendices: [],
                              ancillary: defaultAncillary()
                            }} 
                          focusSectionId={activeSectionId}
                          editingSectionId={editingSectionId}
                          {...({ disabledSections } as any)}
                          onSectionClick={(sectionId: string) => {
                            // Click section in preview → Select it (triggers editor via useEffect)
                            const isMetadataSection = sectionId === METADATA_SECTION_ID || 
                                                     sectionId === ANCILLARY_SECTION_ID || 
                                                     sectionId === REFERENCES_SECTION_ID || 
                                                     sectionId === APPENDICES_SECTION_ID;
                            
                            if (isMetadataSection) {
                              // For metadata sections, enable editing mode (editing happens inline in preview)
                              handleSectionSelect(sectionId, 'preview');
                              setEditingSectionId(sectionId); // Enable edit mode for metadata sections
                              // Scroll to the specific page
                              setTimeout(() => {
                                const scrollContainer = document.getElementById('preview-scroll-container');
                                const element = scrollContainer?.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            } else {
                              // For regular sections, enable inline editor
                              // Use documentPlan to get the correct sections (document-specific or core product)
                              const currentPlan = documentPlan || plan;
                              const sectionToEdit = currentPlan?.sections.find(s => s.id === sectionId);
                              if (sectionToEdit) {
                                handleSectionSelect(sectionId, 'preview');
                                setEditingSectionId(sectionId); // Enable edit mode
                                setActiveQuestion(sectionToEdit.questions[0]?.id ?? null);
                              }
                            }
                          }}
                          onTitlePageChange={updateTitlePage}
                          onAncillaryChange={updateAncillary}
                          onReferenceAdd={addReference}
                          onReferenceUpdate={updateReference}
                          onReferenceDelete={deleteReference}
                          onAppendixAdd={addAppendix}
                          onAppendixUpdate={updateAppendix}
                          onAppendixDelete={deleteAppendix}
                          selectedProductMeta={productOptions.find((option) => option.value === selectedProduct) ?? null}
                          selectedDocumentName={clickedDocumentId && plan
                            ? (() => {
                                const isAdditionalDocument = plan.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId);
                                if (isAdditionalDocument) {
                                  const doc = plan.metadata?.customDocuments?.find(doc => doc.id === clickedDocumentId);
                                  return doc?.name || null;
                                }
                                return null;
                              })()
                            : null}
                          isNewUser={(() => {
                            // New user only if: no plan exists (no product selected yet)
                            // Once a product is selected and plan exists, show preview even if no section is active
                            const isNew = !plan;
                            if (process.env.NODE_ENV === 'development') {
                              console.log('[Editor] isNewUser calculation', {
                                activeSectionId,
                                hasPlan: !!plan,
                                clickedDocumentId,
                                isNew
                              });
                            }
                            return isNew;
                          })()}
                          onOpenConfigurator={() => setIsConfiguratorOpen(true)}
                        />
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-white/60">
                            <div className="text-center">
                              <p className="text-lg mb-2">Select a product to start</p>
                              <p className="text-sm">Click "Start" to configure your plan</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Inline Editor - RENDERED OUTSIDE SCROLL CONTAINER TO AVOID OVERFLOW CLIPPING */}
                      {/* ALWAYS VISIBLE when plan exists - show welcome state if no section selected */}
                      {plan && (
                        <InlineSectionEditor
                          sectionId={effectiveEditingSectionId}
                          section={activeSection}
                          activeQuestionId={activeQuestionId}
                          plan={documentPlan || plan}
                          onClose={() => setEditingSectionId(null)}
                          onSelectQuestion={setActiveQuestion}
                          onAnswerChange={(questionId, content) => {
                            updateAnswer(questionId, content);
                          }}
                          onToggleUnknown={(questionId, note) => {
                            toggleQuestionUnknown(questionId, note);
                          }}
                          onMarkComplete={(questionId) => {
                            markQuestionComplete(questionId);
                          }}
                          onTitlePageChange={updateTitlePage}
                          onAncillaryChange={updateAncillary}
                          onReferenceAdd={addReference}
                          onReferenceUpdate={updateReference}
                          onReferenceDelete={deleteReference}
                          onAppendixAdd={addAppendix}
                          onAppendixUpdate={updateAppendix}
                          onAppendixDelete={deleteAppendix}
                          onRunRequirements={runRequirementsCheck}
                          progressSummary={progressSummary}
                          onDatasetCreate={(dataset) => activeSection && addDataset(activeSection.id, dataset)}
                          onKpiCreate={(kpi) => activeSection && addKpi(activeSection.id, kpi)}
                          onMediaCreate={(asset) => activeSection && addMedia(activeSection.id, asset)}
                          onAttachDataset={(dataset) =>
                            activeSection && activeQuestion && attachDatasetToQuestion(activeSection.id, activeQuestion.id, dataset)
                          }
                          onAttachKpi={(kpi) =>
                            activeSection && activeQuestion && attachKpiToQuestion(activeSection.id, activeQuestion.id, kpi)
                          }
                          onAttachMedia={(asset) =>
                            activeSection && activeQuestion && attachMediaToQuestion(activeSection.id, activeQuestion.id, asset)
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { getSections, getDocuments } from '@templates';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { ProductType, ProgramSummary, BusinessPlan, Section, Question, RightPanelView, Dataset, KPI, MediaAsset } from '@/features/editor/types/plan';
import { useI18n } from '@/shared/contexts/I18nContext';
import { ProgressSummary, AISuggestionOptions } from '@/features/editor/hooks/useEditorStore';
import type { AncillaryContent, AppendixItem, Reference, TitlePage } from '@/features/editor/types/plan';
import { DesktopConfigurator } from './DesktopConfigurator';
import { DesktopEditForm } from './DesktopEditForm';
import { WorkspaceShell } from './WorkspaceShell';

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
  // Sidebar props
  plan?: BusinessPlan;
  activeSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  // Workspace props
  isAncillaryView?: boolean;
  isMetadataView?: boolean;
  activeSection?: Section | null;
  activeQuestionId?: string | null;
  onSelectQuestion?: (questionId: string) => void;
  onAnswerChange?: (questionId: string, content: string) => void;
  onToggleUnknown?: (questionId: string, note?: string) => void;
  onMarkComplete?: (questionId: string) => void;
  onTitlePageChange?: (titlePage: TitlePage) => void;
  onAncillaryChange?: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd?: (reference: Reference) => void;
  onReferenceUpdate?: (reference: Reference) => void;
  onReferenceDelete?: (id: string) => void;
  onAppendixAdd?: (item: AppendixItem) => void;
  onAppendixUpdate?: (item: AppendixItem) => void;
  onAppendixDelete?: (id: string) => void;
  onRunRequirements?: () => void;
  progressSummary?: ProgressSummary[];
  // RightPanel props
  rightPanelView?: RightPanelView;
  setRightPanelView?: (view: RightPanelView) => void;
  activeQuestion?: Question | null;
  onDatasetCreate?: (dataset: Dataset) => void;
  onKpiCreate?: (kpi: KPI) => void;
  onMediaCreate?: (asset: MediaAsset) => void;
  onAttachDataset?: (dataset: Dataset) => void;
  onAttachKpi?: (kpi: KPI) => void;
  onAttachMedia?: (asset: MediaAsset) => void;
  onAskAI?: (questionId?: string, options?: AISuggestionOptions) => void;
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
  plan,
  activeSectionId,
  onSelectSection,
  isAncillaryView,
  isMetadataView,
  activeSection,
  activeQuestionId,
  onSelectQuestion,
  onAnswerChange,
  onToggleUnknown,
  onMarkComplete,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirements,
  progressSummary,
  rightPanelView,
  setRightPanelView,
  activeQuestion,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  onAskAI
}: TemplateOverviewPanelProps) {
  const { t } = useI18n();
  const [sections, setSections] = useState<SectionTemplate[]>([]);
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [customSections, setCustomSections] = useState<SectionTemplate[]>([]);
  const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disabledSections, setDisabledSections] = useState<Set<string>>(new Set());
  const [disabledDocuments, setDisabledDocuments] = useState<Set<string>>(new Set());
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
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [productType, programSummary?.id, fundingType]);

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

  // Notify parent of changes
  const isInitialMount = useRef(true);
  const lastUpdateRef = useRef<string>('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (restoringFromMetadata.current) {
      return;
    }
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      const updateKey = JSON.stringify({
        disabled: Array.from(disabledSections).sort(),
        docs: Array.from(disabledDocuments).sort(),
        customSections: customSections.length,
        customDocuments: customDocuments.length
      });
      
      if (lastUpdateRef.current === updateKey) {
        return;
      }
      
      lastUpdateRef.current = updateKey;
      
      onUpdate({
        disabledSectionIds: Array.from(disabledSections),
        disabledDocumentIds: Array.from(disabledDocuments),
        customSections: customSections.length > 0 ? customSections : undefined,
        customDocuments: customDocuments.length > 0 ? customDocuments : undefined
      });
    }, 100);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledSections, disabledDocuments, customSections, customDocuments]);


  const toggleSection = (sectionId: string) => {
    setDisabledSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleDocument = (documentId: string) => {
    setDisabledDocuments(prev => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  };

  const addCustomSection = () => {
    if (!newSectionTitle.trim()) {
      return; // Don't add if title is empty
    }
    const newSection: SectionTemplate = {
      id: `custom_section_${Date.now()}`,
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || 'User-defined section',
      required: false,
      wordCountMin: 0,
      wordCountMax: 0,
      order: 1000 + customSections.length,
      category: 'custom',
      prompts: ['Describe your custom section content here'],
      questions: [],
      validationRules: {
        requiredFields: [],
        formatRequirements: []
      },
      origin: 'custom',
      visibility: 'advanced'
    };
    setCustomSections(prev => [...prev, newSection]);
    setNewSectionTitle('');
    setNewSectionDescription('');
    setShowAddSection(false);
  };

  const addCustomDocument = () => {
    if (!newDocumentName.trim()) {
      return; // Don't add if name is empty
    }
    const newDocument: DocumentTemplate = {
      id: `custom_doc_${Date.now()}`,
      name: newDocumentName.trim(),
      description: newDocumentDescription.trim() || 'User-defined document',
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

  const handleEditDocument = (doc: DocumentTemplate, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingDocument({ ...doc });
    setExpandedDocumentId(doc.id);
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

  const allSections = [...sections, ...customSections];
  const allDocuments = [...documents, ...customDocuments];
  
  const filteredSections = sectionFilter === 'all' 
    ? allSections 
    : allSections.filter(s => s.origin === sectionFilter);
  
  const filteredDocuments = documentFilter === 'all'
    ? allDocuments
    : allDocuments.filter(d => d.origin === documentFilter);

  const visibleSections = allSections.filter(s => !disabledSections.has(s.id));
  const visibleDocuments = allDocuments.filter(d => !disabledDocuments.has(d.id));
  const enabledSectionsCount = visibleSections.length;
  const enabledDocumentsCount = visibleDocuments.length;

  const getOriginBadge = (origin?: string) => {
    switch (origin) {
      case 'program':
        return <Badge variant="info" className="bg-blue-600/30 text-blue-200 border-0 text-[7px] px-0.5 py-0">P</Badge>;
      case 'custom':
        return <Badge variant="secondary" className="bg-purple-600/30 text-purple-200 border-0 text-[7px] px-0.5 py-0">C</Badge>;
      default:
        return <Badge variant="neutral" className="bg-white/10 text-white/70 border-0 text-[7px] px-0.5 py-0">M</Badge>;
    }
  };


const headerCardClasses = 'relative rounded-lg border border-blue-600/50 px-2.5 pt-1.5 pb-0 backdrop-blur-xl overflow-visible transition-all duration-300';
const selectionSummary = `${enabledSectionsCount}/${allSections.length} Abschnitte • ${enabledDocumentsCount}/${allDocuments.length} Dokumente`;
const productLabel = selectedProductMeta?.label ?? 'Nicht ausgewählt';
const sectionTitles = visibleSections.map((section) => section.title);
const documentTitles = visibleDocuments.map((doc) => doc.name);
const programLabel = programSummary?.name ?? null;
const cardElevationClasses = isExpanded
  ? 'z-30 shadow-[0_25px_60px_rgba(8,15,40,0.85)] ring-1 ring-white/15 translate-y-[-4px]'
  : 'z-10 shadow-xl';

  if (loading) {
    return (
      <div className="py-4">
        <Card className={`${headerCardClasses} flex flex-col ${cardElevationClasses}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <Card className={`${headerCardClasses} flex flex-col ${cardElevationClasses}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-800 rounded-lg" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-sm font-semibold text-red-200">{error}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-0">
      <Card className={`${headerCardClasses} flex flex-col ${cardElevationClasses}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
            <div className="relative z-10 flex flex-col gap-3">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-2xl font-bold uppercase tracking-wide text-white">
                  {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {!isExpanded && (
                    <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                      <span className="text-[10px] uppercase tracking-wide text-white/60 font-semibold">
                        Aktuelle Auswahl
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
                    {isExpanded ? 'Bearbeitung abschließen' : 'Bearbeitung starten'}
                  </Button>
                </div>
              </div>
              <div className="border-b border-white/30 w-full"></div>
            {/* Expanded Three-Column Layout */}
            {isExpanded && (
              <>
              <div className="grid grid-cols-[400px_1fr_1fr] gap-4 h-[340px] overflow-hidden">
                {/* Column 1: Deine Konfiguration */}
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

                {/* Column 2: Documents */}
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4 h-full overflow-hidden">
                  <div className="flex-shrink-0" data-column="documents">
                    <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
                      Deine Dokumente ({filteredDocuments.length})
                    </h2>
                  </div>
                  <p className="text-[10px] text-white/50 mb-2 flex-shrink-0">
                    Entscheide welche zusätzlichen Dokumente zu deinem Plan hinzufügt werden.
                  </p>
                  
                  {expandedDocumentId && editingDocument ? (
                    <DesktopEditForm
                      type="document"
                      item={editingDocument}
                      onSave={handleSaveDocument}
                      onCancel={handleCancelEdit}
                      getOriginBadge={getOriginBadge}
                    />
                  ) : (
                  // Normal Grid View
                  <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto min-h-0 pr-1 auto-rows-min pb-2">
                    {/* Main Document Card - Shows selected product */}
                    {selectedProductMeta && !expandedDocumentId && (
                      <div className="relative border rounded-lg p-2.5 border-blue-500/50 bg-blue-500/10 group">
                        {/* Blue checkmark in top-right corner */}
                        <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded border-2 border-blue-500 bg-blue-600/30 flex items-center justify-center">
                            <svg className="w-2 h-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Product icon and label */}
                        <div className="flex flex-col items-center gap-1 pt-4 min-h-[50px]">
                          <span className="text-2xl leading-none flex-shrink-0">
                            {selectedProductMeta.icon ?? '📄'}
                          </span>
                          <div className="w-full text-center min-h-[28px] flex items-center justify-center">
                            <h4 className="text-[11px] font-semibold leading-snug text-white break-words line-clamp-2">
                              {selectedProductMeta.label}
                            </h4>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Dokument hinzufügen - placed next to main document */}
                    {!expandedDocumentId && (
                      <button
                        type="button"
                        onClick={() => toggleAddDocumentBadge()}
                        className={`relative w-full border rounded-lg p-2.5 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold tracking-tight transition-all ${
                          showAddDocument
                            ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                            : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl leading-none">＋</span>
                        <span>Dokument hinzufügen</span>
                      </button>
                    )}
                    {showAddDocument && !expandedDocumentId && (
                      <div className="col-span-3 border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-white/80 font-semibold mb-2">Ein benutzerdefiniertes Dokument zu Ihrem Plan hinzufügen</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-white/70 block mb-1">Name *</label>
                            <input
                              type="text"
                              value={newDocumentName}
                              onChange={(e) => setNewDocumentName(e.target.value)}
                              placeholder="z.B. Finanzplan"
                              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/70 block mb-1">Beschreibung</label>
                            <textarea
                              value={newDocumentDescription}
                              onChange={(e) => setNewDocumentDescription(e.target.value)}
                              placeholder="Optionale Beschreibung des Dokuments"
                              rows={2}
                              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            onClick={addCustomDocument}
                            disabled={!newDocumentName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Hinzufügen
                          </Button>
                          <Button
                            onClick={() => {
                              setShowAddDocument(false);
                              setNewDocumentName('');
                              setNewDocumentDescription('');
                            }}
                            variant="ghost"
                            className="text-white/60 hover:text-white text-xs px-3 py-1"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                    {filteredDocuments.map((doc) => {
                      const isDisabled = disabledDocuments.has(doc.id);
                      const isRequired = doc.required;
                      
                      return (
                        <div
                          key={doc.id}
                          className={`relative border rounded-lg p-2.5 ${
                            isDisabled 
                              ? 'border-white/10 bg-white/5 opacity-60' 
                              : isRequired
                              ? 'border-amber-500/30 bg-amber-500/5'
                              : 'border-white/20 bg-white/10'
                          } transition-all hover:border-white/40 group`}
                        >
                          {/* Checkbox and pencil in top-right corner of card */}
                          <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditDocument(doc, e);
                              }}
                              className="text-white/60 hover:text-white text-xs transition-opacity"
                            >
                              ✏️
                            </button>
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDocument(doc.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`w-3.5 h-3.5 rounded border-2 ${
                                isDisabled
                                  ? 'border-white/30 bg-white/10'
                                  : isRequired
                                  ? 'border-amber-500 bg-amber-600/30 cursor-pointer'
                                  : 'border-blue-500 bg-blue-600/30 cursor-pointer'
                              } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                            />
                          </div>
                          
                          {/* Large icon as main visual element */}
                          <button
                            type="button"
                            onClick={() => toggleDocument(doc.id)}
                            className="flex flex-col items-center gap-1 pt-4 min-h-[50px] w-full"
                          >
                            <span className="text-2xl leading-none flex-shrink-0">📄</span>
                            <div className="w-full text-center min-h-[28px] flex items-center justify-center">
                              <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                                {doc.name}
                              </h4>
                            </div>
                            {doc.origin === 'custom' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeCustomDocument(doc.id);
                                }}
                                className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                ×
                              </button>
                            )}
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>

                {/* Column 3: Sections */}
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4 h-full overflow-hidden">
                  <div className="flex-shrink-0" data-column="sections">
                    <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
                      Deine Abschnitte ({filteredSections.length})
                    </h2>
                  </div>
                  <p className="text-[10px] text-white/50 mb-2 flex-shrink-0 -mt-2">
                    Entscheide welche Abschnitte du in dein Dokument miteinbeziehst.
                  </p>
                  
                  {expandedSectionId && editingSection ? (
                    <DesktopEditForm
                      type="section"
                      item={editingSection}
                      onSave={handleSaveSection}
                      onCancel={handleCancelEdit}
                      getOriginBadge={getOriginBadge}
                    />
                  ) : (
                  // Normal Grid View
                  <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto min-h-0 pr-1 auto-rows-min pb-2">
                    {!expandedSectionId && (
                      <button
                        type="button"
                        onClick={toggleAddSectionBadge}
                        className={`relative w-full border rounded-lg p-2.5 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold tracking-tight transition-all ${
                          showAddSection
                            ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                            : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl leading-none">＋</span>
                        <span>Abschnitt hinzufügen</span>
                      </button>
                    )}
                    {showAddSection && !expandedSectionId && (
                      <div className="col-span-3 border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-white/80 font-semibold mb-2">Einen benutzerdefinierten Abschnitt zu Ihrem Plan hinzufügen</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-white/70 block mb-1">Titel *</label>
                            <input
                              type="text"
                              value={newSectionTitle}
                              onChange={(e) => setNewSectionTitle(e.target.value)}
                              placeholder="z.B. Executive Summary"
                              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/70 block mb-1">Beschreibung</label>
                            <textarea
                              value={newSectionDescription}
                              onChange={(e) => setNewSectionDescription(e.target.value)}
                              placeholder="Optionale Beschreibung des Abschnitts"
                              rows={2}
                              className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            onClick={addCustomSection}
                            disabled={!newSectionTitle.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Hinzufügen
                          </Button>
                          <Button
                            onClick={() => {
                              setShowAddSection(false);
                              setNewSectionTitle('');
                              setNewSectionDescription('');
                            }}
                            variant="ghost"
                            className="text-white/60 hover:text-white text-xs px-3 py-1"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                    {filteredSections.map((section) => {
                      const isDisabled = disabledSections.has(section.id);
                      const isRequired = section.required;
                      
                      return (
                        <div
                          key={section.id}
                          className={`relative border rounded-lg p-2.5 ${
                            isDisabled 
                              ? 'border-white/10 bg-white/5 opacity-60' 
                              : isRequired
                              ? 'border-amber-500/30 bg-amber-500/5'
                              : 'border-white/20 bg-white/10'
                          } transition-all hover:border-white/40 group`}
                        >
                          {/* Checkbox and pencil in top-right corner of card */}
                          <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditSection(section, e);
                              }}
                              className="text-white/60 hover:text-white text-xs transition-opacity"
                            >
                              ✏️
                            </button>
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSection(section.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`w-3.5 h-3.5 rounded border-2 ${
                                isDisabled
                                  ? 'border-white/30 bg-white/10'
                                  : isRequired
                                  ? 'border-amber-500 bg-amber-600/30 cursor-pointer'
                                  : 'border-blue-500 bg-blue-600/30 cursor-pointer'
                              } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                            />
                          </div>
                          
                          {/* Large icon as main visual element */}
                          <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className="flex flex-col items-center gap-1 pt-4 min-h-[50px] w-full"
                          >
                            <span className="text-2xl leading-none flex-shrink-0">📋</span>
                            <div className="w-full text-center min-h-[28px] flex items-center justify-center">
                              <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                                {section.title}
                              </h4>
                            </div>
                            {section.origin === 'custom' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeCustomSection(section.id);
                                }}
                                className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                ×
                              </button>
                            )}
                          </button>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 sticky bottom-3 left-0 z-30">
                <div className="mx-auto w-full max-w-4xl rounded-xl border border-[#2b375b] bg-[#0f1c3d]/95 px-5 py-3 text-white shadow-[0_15px_35px_rgba(6,10,24,0.6)] backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/85 mb-1">
                    Aktuelle Auswahl
                  </p>
                  <div className="flex w-full items-center justify-between gap-4 text-[12px] font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedProductMeta?.icon && (
                        <span className="text-base leading-none flex-shrink-0">{selectedProductMeta.icon}</span>
                      )}
                      <span className="truncate max-w-[220px]" title={productLabel}>
                        {productLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-white/80 uppercase text-[10px] tracking-[0.2em]">Programm/Vorlage</span>
                      {programLabel ? (
                        <span className="truncate max-w-[240px]" title={programLabel}>
                          {programLabel}
                        </span>
                      ) : (
                        <span className="text-white/60">Kein Programm</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 min-w-0 relative group">
                      <span className="text-white/60 uppercase text-[10px] tracking-[0.2em]">Abschnitte</span>
                      <span>{enabledSectionsCount}/{allSections.length}</span>
                      <span className="text-white/60 text-[11px]">See all</span>
                      <div className="absolute left-0 top-full mt-2 w-[320px] max-h-[220px] overflow-y-auto rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 text-[11px] font-normal text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Ausgewählte Abschnitte</p>
                        <ul className="space-y-1 list-disc list-inside text-white/80">
                          {sectionTitles.length ? (
                            sectionTitles.map((title) => <li key={title}>{title}</li>)
                          ) : (
                            <li className="text-white/50">Keine Auswahl</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 relative group">
                      <span className="text-white/60 uppercase text-[10px] tracking-[0.2em]">Dokumente</span>
                      <span>{enabledDocumentsCount}/{allDocuments.length}</span>
                      <span className="text-white/60 text-[11px]">See all</span>
                      <div className="absolute left-0 top-full mt-2 w-[320px] max-h-[220px] overflow-y-auto rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 text-[11px] font-normal text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Ausgewählte Dokumente</p>
                        <ul className="space-y-1 list-disc list-inside text-white/80">
                          {documentTitles.length ? (
                            documentTitles.map((title) => <li key={title}>{title}</li>)
                          ) : (
                            <li className="text-white/50">Keine Auswahl</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}
            
            {/* Workspace Shell - Sidebar, Workspace, and Right Panel */}
            {plan && onSelectSection && (
              <WorkspaceShell
                plan={plan}
                activeSectionId={activeSectionId ?? plan.sections[0]?.id ?? null}
                onSelectSection={onSelectSection}
                isAncillaryView={isAncillaryView}
                isMetadataView={isMetadataView}
                activeSection={activeSection}
                activeQuestionId={activeQuestionId}
                onSelectQuestion={onSelectQuestion}
                onAnswerChange={onAnswerChange}
                onToggleUnknown={onToggleUnknown}
                onMarkComplete={onMarkComplete}
                onTitlePageChange={onTitlePageChange}
                onAncillaryChange={onAncillaryChange}
                onReferenceAdd={onReferenceAdd}
                onReferenceUpdate={onReferenceUpdate}
                onReferenceDelete={onReferenceDelete}
                onAppendixAdd={onAppendixAdd}
                onAppendixUpdate={onAppendixUpdate}
                onAppendixDelete={onAppendixDelete}
                onRunRequirements={onRunRequirements}
                progressSummary={progressSummary}
                rightPanelView={rightPanelView}
                setRightPanelView={setRightPanelView}
                activeQuestion={activeQuestion}
                onDatasetCreate={onDatasetCreate}
                onKpiCreate={onKpiCreate}
                onMediaCreate={onMediaCreate}
                onAttachDataset={onAttachDataset}
                onAttachKpi={onAttachKpi}
                onAttachMedia={onAttachMedia}
                onAskAI={onAskAI}
              />
            )}
            </div>
          </Card>
    </div>
  );
}

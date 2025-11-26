import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { getSections, getDocuments } from '@templates';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { ProductType, ProgramSummary } from '@/features/editor/types/plan';
import { useI18n } from '@/shared/contexts/I18nContext';
import { normalizeProgramInput } from '@/features/editor/hooks/useEditorStore';

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
  connectCopy
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
  
  // PlanConfigurator state
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [configView, setConfigView] = useState<'plan' | 'program'>('plan');
  const [productMenuPosition, setProductMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);
  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const productTriggerRef = useRef<HTMLButtonElement | null>(null);

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
    }, 300);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledSections, disabledDocuments, customSections, customDocuments]);

  // PlanConfigurator handlers
  const handleSelectProduct = (product: ProductType) => {
    onChangeProduct(product);
    setShowProductMenu(false);
    setProductMenuPosition(null);
  };

  const handleToggleProductMenu = () => {
    if (!showProductMenu && productTriggerRef.current) {
      const rect = productTriggerRef.current.getBoundingClientRect();
      setProductMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setShowProductMenu((prev) => !prev);
  };

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy.error);
      return;
    }
    onConnectProgram(normalized);
  };

  useEffect(() => {
    if (!showProductMenu) {
      setProductMenuPosition(null);
      return;
    }
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(target) &&
        productTriggerRef.current &&
        !productTriggerRef.current.contains(target)
      ) {
        setShowProductMenu(false);
        setProductMenuPosition(null);
      }
    };
    const handleResize = () => {
      if (productTriggerRef.current) {
        const rect = productTriggerRef.current.getBoundingClientRect();
        setProductMenuPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showProductMenu]);

  useEffect(() => {
    if (!showManualInput) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        manualInputRef.current &&
        !manualInputRef.current.contains(target) &&
        manualTriggerRef.current &&
        !manualTriggerRef.current.contains(target)
      ) {
        setShowManualInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showManualInput]);

  useEffect(() => {
    if (programSummary) {
      setShowManualInput(false);
    }
  }, [programSummary]);

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

  const allSections = [...sections, ...customSections];
  const allDocuments = [...documents, ...customDocuments];
  
  const filteredSections = sectionFilter === 'all' 
    ? allSections 
    : allSections.filter(s => s.origin === sectionFilter);
  
  const filteredDocuments = documentFilter === 'all'
    ? allDocuments
    : allDocuments.filter(d => d.origin === documentFilter);

  const visibleSections = allSections.filter(s => !disabledSections.has(s.id));
  const enabledSectionsCount = visibleSections.length;
  const enabledDocumentsCount = allDocuments.filter(d => !disabledDocuments.has(d.id)).length;

  const getOriginBadge = (origin?: string) => {
    switch (origin) {
      case 'program':
        return <Badge variant="info" className="bg-blue-600/30 text-blue-200 border-0 text-[8px] px-1 py-0">P</Badge>;
      case 'custom':
        return <Badge variant="secondary" className="bg-purple-600/30 text-purple-200 border-0 text-[8px] px-1 py-0">C</Badge>;
      default:
        return <Badge variant="neutral" className="bg-white/10 text-white/70 border-0 text-[8px] px-1 py-0">M</Badge>;
    }
  };


  const headerCardClasses = 'relative rounded-lg border border-blue-600/50 px-2.5 py-1.5 shadow-xl backdrop-blur-xl overflow-visible';

  if (loading) {
    return (
      <div className="py-4">
        <Card className={`${headerCardClasses} flex flex-col`}>
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
        <Card className={`${headerCardClasses} flex flex-col`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-800 rounded-lg" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-sm font-semibold text-red-200">{error}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-2">
      <Card className={`${headerCardClasses} flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
            <div className="relative z-10 flex flex-col gap-3">
              {/* Header */}
              <div className="grid grid-cols-3 items-center">
                <span className="text-2xl font-bold uppercase tracking-wide text-white">
                  {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
                </span>
                <div className="flex items-center justify-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    {selectedProductMeta?.icon} <span>{selectedProductMeta?.label}</span>
                  </span>
                  {programSummary && configView === 'program' && (
                    <>
                      <span className="text-white/20">•</span>
                      <span className="flex items-center gap-1.5">
                        <span>{programSummary.name}</span>
                      </span>
                    </>
                  )}
                  <span className="text-white/20">•</span>
                  <span>{enabledSectionsCount}/{allSections.length} sections</span>
                  <span className="text-white/20">•</span>
                  <span>{enabledDocumentsCount}/{allDocuments.length} documents</span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-white/70 hover:text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
                  >
                    {isExpanded ? '▴ Collapse' : '▾ Expand'}
                  </button>
                </div>
              </div>
              <div className="border-b border-white/30 w-full"></div>

            {/* Expanded Three-Column Layout */}
            {isExpanded && (
              <div className="grid grid-cols-[400px_1fr_1fr] gap-4 h-[380px] overflow-hidden">
                {/* Column 1: Deine Konfiguration */}
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4 overflow-hidden">
                  <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
                    Deine Konfiguration
                  </h2>
                  <p className="text-[10px] text-white/50 mb-2 -mt-2">
                    Wählen Sie Ihren Plan-Typ und verbinden Sie optional ein Förderprogramm, um automatisch die relevanten Anforderungen zu laden.
                  </p>
                  {/* Combined Configuration Card with Switcher */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    {/* Switcher */}
                    <div className="flex items-center gap-1 mb-3 p-1 bg-white/5 rounded-lg">
                      <button
                        onClick={() => setConfigView('plan')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                          configView === 'plan'
                            ? 'bg-blue-600 text-white'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        Plan auswählen
                      </button>
                      <button
                        onClick={() => setConfigView('program')}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                          configView === 'program'
                            ? 'bg-blue-600 text-white'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        Programm verbinden
                      </button>
                    </div>

                    {/* Plan Selection View */}
                    {configView === 'plan' && (
                      <div className="relative">
                        <button
                          ref={productTriggerRef}
                          type="button"
                          onClick={handleToggleProductMenu}
                          className="flex w-full items-start gap-2.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-left transition-colors hover:border-white/40 focus-visible:border-blue-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-200/50"
                        >
                          <span className="text-xl leading-none flex-shrink-0 mt-0.5">
                            {selectedProductMeta?.icon ?? '📄'}
                          </span>
                          <span className="flex min-w-0 flex-col gap-1 flex-1">
                            <span className="text-sm font-semibold leading-tight text-white">{selectedProductMeta?.label}</span>
                            {selectedProductMeta?.description && (
                              <span className="text-[10px] font-normal text-white/70 leading-relaxed">
                                {selectedProductMeta.description}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center text-xs font-bold flex-shrink-0 mt-0.5">▾</span>
                        </button>
                        {showProductMenu && productMenuPosition && typeof window !== 'undefined' && createPortal(
                          <div
                            ref={productMenuRef}
                            className="fixed z-[9999] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
                            style={{
                              top: `${productMenuPosition.top}px`,
                              left: `${productMenuPosition.left}px`,
                              width: `${productMenuPosition.width}px`
                            }}
                          >
                            <ul className="flex flex-col gap-1">
                              {productOptions.map((option) => {
                                const isActive = option.value === productType;
                                return (
                                  <li key={option.value}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectProduct(option.value)}
                                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                                        isActive
                                          ? 'bg-blue-600/40 text-white'
                                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                                      }`}
                                    >
                                      <span className="text-2xl leading-none">{option.icon ?? '📄'}</span>
                                      <span className="flex flex-col">
                                        <span className="text-sm font-semibold">{option.label}</span>
                                        {option.description && (
                                          <span className="text-xs text-white/70 leading-snug">
                                            {option.description}
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}

                    {/* Program Connection View */}
                    {configView === 'program' && (
                      <div>
                        {programSummary ? (
                          <div className="w-full rounded-lg border border-blue-300 bg-blue-100/60 px-3 py-2.5">
                            <div className="flex items-start justify-between gap-2 w-full">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-blue-900 leading-tight">{programSummary.name}</p>
                                {programSummary.amountRange && (
                                  <p className="text-xs text-blue-800 mt-1">{programSummary.amountRange}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-800 hover:text-blue-900 text-xs h-6 px-1.5 flex-shrink-0"
                                onClick={() => onConnectProgram(null)}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex flex-row gap-2 relative flex-wrap">
                            <button
                              onClick={onOpenProgramFinder}
                              className="inline-flex items-center justify-center px-3 py-2 h-auto bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-[11px] flex-1 min-w-0"
                            >
                              {connectCopy.openFinder}
                            </button>
                            <button
                              ref={manualTriggerRef}
                              aria-expanded={showManualInput}
                              aria-controls="manual-program-connect"
                              onClick={() => setShowManualInput((prev) => !prev)}
                              className="inline-flex items-center justify-center px-3 py-2 h-auto border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-[11px] flex-1 min-w-0"
                            >
                              {connectCopy.pasteLink}
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement template upload functionality
                                console.log('Template hochladen clicked');
                              }}
                              className="inline-flex items-center justify-center px-3 py-2 h-auto border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-[11px] flex-1 min-w-0"
                            >
                              Template hochladen
                            </button>

                            <div
                              id="manual-program-connect"
                              ref={manualInputRef}
                              className={`absolute left-0 top-[calc(100%+0.75rem)] w-full max-w-[420px] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200 z-50 ${
                                showManualInput
                                  ? 'pointer-events-auto opacity-100 translate-y-0'
                                  : 'pointer-events-none opacity-0 -translate-y-2'
                              }`}
                            >
                              <div className="space-y-1 text-white">
                                <label className="text-[10px] font-semibold text-white/70 block">
                                  {connectCopy.inputLabel}
                                </label>
                                <div className="flex flex-col gap-1.5 sm:flex-row">
                                  <input
                                    value={manualValue}
                                    onChange={(event) => setManualValue(event.target.value)}
                                    placeholder={connectCopy.placeholder}
                                    className="flex-1 rounded border border-white/30 bg-white/10 px-2 py-1.5 h-9 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="sm:w-auto text-xs h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white"
                                    onClick={handleManualConnect}
                                    disabled={programLoading}
                                  >
                                    {programLoading ? '...' : connectCopy.submit}
                                  </Button>
                                </div>
                                <p className="text-[10px] text-white/60">{connectCopy.example}</p>
                                {(manualError || programError) && (
                                  <p className="text-[10px] text-red-400">{manualError || programError}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Column 1 ends here - no more cards below */}
                </div>

                {/* Column 2: Sections */}
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4 h-full overflow-hidden">
                  <div className="flex-shrink-0">
                    <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
                      Ausgewählte Abschnitte ({filteredSections.length})
                    </h2>
                  </div>
                  <p className="text-[10px] text-white/50 mb-2 flex-shrink-0 -mt-2">
                    ✓ Aktivieren/deaktivieren, um Abschnitte in Ihren Plan einzubeziehen oder auszuschließen
                  </p>
                  <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto min-h-0 pr-1 auto-rows-min">
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
                          } transition-all hover:border-white/40 cursor-pointer group`}
                          onClick={() => toggleSection(section.id)}
                          title={section.description}
                        >
                          {/* Checkbox in top-right corner */}
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSection(section.id);
                              }}
                              className={`w-3.5 h-3.5 rounded border-2 ${
                                isDisabled
                                  ? 'border-white/30 bg-white/10'
                                  : isRequired
                                  ? 'border-amber-500 bg-amber-600/30 cursor-pointer'
                                  : 'border-blue-500 bg-blue-600/30 cursor-pointer'
                              } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                              title={isDisabled ? 'Click to enable this section' : 'Click to disable this section'}
                            />
                          </div>
                          
                          {/* Large icon as main visual element */}
                          <div className="flex flex-col items-center gap-1.5 pt-1 min-h-[60px]">
                            <span className="text-2xl leading-none flex-shrink-0">📋</span>
                            <div className="w-full text-center min-h-[32px] flex items-center justify-center">
                              <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                                {section.title}
                              </h4>
                            </div>
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {isRequired && (
                                <Badge variant="warning" className="bg-amber-600/30 text-amber-200 border-0 text-[9px] px-1.5 py-0.5">
                                  Erf.
                                </Badge>
                              )}
                              {getOriginBadge(section.origin)}
                              {section.wordCountMin > 0 && (
                                <span className="text-[9px] text-white/50">
                                  {section.wordCountMin}-{section.wordCountMax || '∞'}w
                                </span>
                              )}
                            </div>
                            {section.origin === 'custom' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomSection(section.id);
                                }}
                                className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Benutzerdefinierten Abschnitt entfernen"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          
                          {/* Hover tooltip with full description */}
                          {section.description && (
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900/95 text-white text-[10px] rounded-lg shadow-xl border border-slate-700">
                                <p className="leading-relaxed">{section.description}</p>
                                {section.wordCountMin > 0 && (
                                  <p className="mt-1.5 text-white/60 border-t border-white/20 pt-1.5">
                                    Word count: {section.wordCountMin}-{section.wordCountMax || '∞'} words
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setShowAddSection(true)}
                      className="col-span-3 border border-dashed border-white/20 rounded-md p-2 text-white/50 hover:text-white hover:border-white/40 transition-colors text-[10px] font-medium"
                    >
                      + Abschnitt hinzufügen
                    </button>
                    {showAddSection && (
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
                  </div>
                </div>

                {/* Column 3: Additional Documents */}
                <div className="flex flex-col gap-2 border-r border-white/10 pr-4 h-full overflow-hidden">
                  <div className="flex-shrink-0">
                    <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
                      Zusätzliche Dokumente ({filteredDocuments.length})
                    </h2>
                  </div>
                  <p className="text-[10px] text-white/50 mb-2 flex-shrink-0 -mt-2">
                    ✓ Aktivieren/deaktivieren, um Dokumente in Ihren Plan einzubeziehen oder auszuschließen
                  </p>
                  <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto min-h-0 pr-1 auto-rows-min">
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
                          } transition-all hover:border-white/40 cursor-pointer group`}
                          onClick={() => toggleDocument(doc.id)}
                          title={`${doc.description} • ${doc.format.toUpperCase()} • Max ${doc.maxSize}`}
                        >
                          {/* Checkbox in top-right corner */}
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleDocument(doc.id);
                              }}
                              className={`w-3.5 h-3.5 rounded border-2 ${
                                isDisabled
                                  ? 'border-white/30 bg-white/10'
                                  : isRequired
                                  ? 'border-amber-500 bg-amber-600/30 cursor-pointer'
                                  : 'border-blue-500 bg-blue-600/30 cursor-pointer'
                              } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                              title={isDisabled ? 'Klicken, um dieses Dokument zu aktivieren' : 'Klicken, um dieses Dokument zu deaktivieren'}
                            />
                          </div>
                          
                          {/* Large icon as main visual element */}
                          <div className="flex flex-col items-center gap-1.5 pt-1 min-h-[60px]">
                            <span className="text-2xl leading-none flex-shrink-0">📄</span>
                            <div className="w-full text-center min-h-[32px] flex items-center justify-center">
                              <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                                {doc.name}
                              </h4>
                            </div>
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {isRequired && (
                                <Badge variant="warning" className="bg-amber-600/30 text-amber-200 border-0 text-[9px] px-1.5 py-0.5">
                                  Erf.
                                </Badge>
                              )}
                              {getOriginBadge(doc.origin)}
                              <span className="text-[9px] text-white/50">
                                {doc.format.toUpperCase()}
                              </span>
                            </div>
                            {doc.origin === 'custom' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomDocument(doc.id);
                                }}
                                className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Benutzerdefiniertes Dokument entfernen"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          
                          {/* Hover tooltip with full description */}
                          {doc.description && (
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900/95 text-white text-[10px] rounded-lg shadow-xl border border-slate-700">
                                <p className="leading-relaxed">{doc.description}</p>
                                <p className="mt-1.5 text-white/60 border-t border-white/20 pt-1.5">
                                  Format: {doc.format.toUpperCase()} • Max size: {doc.maxSize}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setShowAddDocument(true)}
                      className="col-span-3 border border-dashed border-white/20 rounded-md p-2 text-white/50 hover:text-white hover:border-white/40 transition-colors text-[10px] font-medium"
                    >
                      + Dokument hinzufügen
                    </button>
                    {showAddDocument && (
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
                  </div>
                </div>
              </div>
            )}
            </div>
          </Card>
    </div>
  );
}

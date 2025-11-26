import React, { useEffect, useState, useRef } from 'react';
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

const FUNDING_TYPE_LABELS: Record<string, string> = {
  grants: 'Grants',
  bankLoans: 'Bank Loans',
  equity: 'Equity',
  visa: 'Visa'
};

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
  const [sectionFilter, setSectionFilter] = useState<'all' | 'master' | 'program' | 'custom'>('all');
  const [documentFilter, setDocumentFilter] = useState<'all' | 'master' | 'program' | 'custom'>('all');
  
  // PlanConfigurator state
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProgramTooltip, setShowProgramTooltip] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
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
    if (!showProductMenu) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(target) &&
        productTriggerRef.current &&
        !productTriggerRef.current.contains(target)
      ) {
        setShowProductMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
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
    const newSection: SectionTemplate = {
      id: `custom_section_${Date.now()}`,
      title: 'Custom Section',
      description: 'User-defined section',
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
    setShowAddSection(false);
  };

  const addCustomDocument = () => {
    const newDocument: DocumentTemplate = {
      id: `custom_doc_${Date.now()}`,
      name: 'Custom Document',
      description: 'User-defined document',
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
        return <Badge variant="info" className="bg-blue-600/30 text-blue-200 border border-blue-500/50 text-[10px] px-1.5 py-0.5">Program</Badge>;
      case 'custom':
        return <Badge variant="secondary" className="bg-purple-600/30 text-purple-200 border border-purple-500/50 text-[10px] px-1.5 py-0.5">Custom</Badge>;
      default:
        return <Badge variant="neutral" className="bg-white/10 text-white/70 border border-white/20 text-[10px] px-1.5 py-0.5">Master</Badge>;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (severity === 'hard') {
      return <Badge variant="danger" className="bg-red-600/30 text-red-200 border border-red-500/50 text-[10px] px-1.5 py-0.5">Required</Badge>;
    }
    return null;
  };

  const getVisibilityBadge = (visibility?: string) => {
    switch (visibility) {
      case 'programOnly':
        return <Badge variant="warning" className="bg-amber-600/30 text-amber-200 border border-amber-500/50 text-[10px] px-1.5 py-0.5">Program Only</Badge>;
      case 'advanced':
        return <Badge variant="neutral" className="bg-white/10 text-white/60 border border-white/20 text-[10px] px-1.5 py-0.5">Advanced</Badge>;
      default:
        return null;
    }
  };

  const headerCardClasses = 'relative rounded-lg border border-blue-600/50 px-2.5 py-1.5 shadow-xl backdrop-blur-xl overflow-visible';

  if (loading) {
    return (
      <div className="sticky top-0 z-50 bg-slate-900/98 backdrop-blur-xl border-b border-blue-600/50">
        <div className="container py-2">
          <Card className={`${headerCardClasses} flex flex-col`}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Loading...</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sticky top-0 z-50 bg-slate-900/98 backdrop-blur-xl border-b border-blue-600/50">
        <div className="container py-2">
          <Card className={`${headerCardClasses} flex flex-col`}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-800 rounded-lg" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-sm font-semibold text-red-200">{error}</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 bg-slate-900/98 backdrop-blur-xl border-b border-blue-600/50 shadow-lg">
      <div className="container py-2">
        <Card className={`${headerCardClasses} flex flex-col`}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
          <div className="relative z-10 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold uppercase tracking-wider text-white">
                  {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
                </span>
                <span className="text-xs text-white/70">
                  {selectedProductMeta?.icon} {selectedProductMeta?.label}
                  {programSummary && ` | 🏢 ${programSummary.name}`}
                  {` | 📊 ${enabledSectionsCount}/${allSections.length} sections`}
                  {` | 📄 ${enabledDocumentsCount}/${allDocuments.length} documents`}
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white/80 hover:text-white text-sm font-semibold px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                {isExpanded ? '▴ Collapse' : '▾ Expand'}
              </button>
            </div>

            {/* Expanded Three-Column Layout */}
            {isExpanded && (
              <div className="grid grid-cols-[280px_1fr_1fr] gap-6 max-h-[calc(80vh-100px)] overflow-y-auto pr-2">
                {/* Column 1: Product Information */}
                <div className="flex flex-col gap-3 border-r border-white/10 pr-6">
                  {/* Product Type Card - Interactive */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                      {t('editor.header.productType' as any) || 'Product Type'}
                    </h3>
                    <div className="relative">
                      <button
                        ref={productTriggerRef}
                        type="button"
                        onClick={() => setShowProductMenu((prev) => !prev)}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-3 py-1.5 text-left text-sm font-semibold text-white transition-colors hover:border-white/60 focus-visible:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/50"
                      >
                        <span className="text-lg leading-none flex-shrink-0">
                          {selectedProductMeta?.icon ?? '📄'}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5 flex-1">
                          <span className="text-sm font-semibold leading-tight truncate">{selectedProductMeta?.label}</span>
                          {selectedProductMeta?.description && (
                            <span className="text-[10px] font-normal text-white/70 leading-tight truncate">
                              {selectedProductMeta.description}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center text-xs font-bold flex-shrink-0">▾</span>
                      </button>
                      {showProductMenu && (
                        <div
                          ref={productMenuRef}
                          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
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
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Program Card - Interactive */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                        {connectCopy.badge}
                      </h3>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setShowProgramTooltip(true)}
                          onMouseLeave={() => setShowProgramTooltip(false)}
                          className="text-white hover:text-blue-100 text-xs font-bold w-4 h-4 rounded-full border border-white/50 bg-white/20 flex items-center justify-center"
                        >
                          ?
                        </button>
                        {showProgramTooltip && (
                          <div className="absolute z-50 left-0 top-5 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg border border-slate-700">
                            {connectCopy.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {programSummary ? (
                      <div className="w-full rounded-lg border border-blue-300 bg-blue-100/60 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-blue-900 truncate">{programSummary.name}</p>
                            {programSummary.amountRange && (
                              <p className="text-xs text-blue-800 mt-0.5">{programSummary.amountRange}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-800 hover:text-blue-900 text-sm h-7 px-2 flex-shrink-0"
                            onClick={() => onConnectProgram(null)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-2 relative">
                        <button
                          onClick={onOpenProgramFinder}
                          className="inline-flex items-center justify-center px-4 py-2 h-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-xs"
                        >
                          {connectCopy.openFinder}
                        </button>
                        <button
                          ref={manualTriggerRef}
                          aria-expanded={showManualInput}
                          aria-controls="manual-program-connect"
                          onClick={() => setShowManualInput((prev) => !prev)}
                          className="inline-flex items-center justify-center px-4 py-2 h-auto border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-colors duration-200 backdrop-blur-sm hover:bg-white/10 text-xs"
                        >
                          {connectCopy.pasteLink}
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

                  {/* Funding Type Card */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">Funding Type</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <p className="text-sm font-semibold text-white">{FUNDING_TYPE_LABELS[fundingType] || fundingType}</p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Sections */}
                <div className="flex flex-col gap-3 border-r border-white/10 pr-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Sections ({filteredSections.length})
                    </h3>
                    <div className="flex gap-1">
                      {(['all', 'master', 'program', 'custom'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSectionFilter(filter)}
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            sectionFilter === filter
                              ? 'bg-blue-600/40 text-white border border-blue-500/50'
                              : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[calc(80vh-200px)] overflow-y-auto">
                    {filteredSections.map((section) => {
                      const isDisabled = disabledSections.has(section.id);
                      const isOptional = !section.required;
                      
                      return (
                        <div
                          key={section.id}
                          className={`border rounded-lg p-2.5 ${
                            isDisabled 
                              ? 'border-white/10 bg-white/5 opacity-60' 
                              : 'border-white/20 bg-white/10'
                          } transition-all hover:border-white/30`}
                        >
                          <div className="flex items-start gap-2">
                            {isOptional ? (
                              <input
                                type="checkbox"
                                checked={!isDisabled}
                                onChange={() => toggleSection(section.id)}
                                className="mt-0.5 w-3.5 h-3.5 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="mt-0.5 text-white/40 text-xs">🔒</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`text-sm font-semibold ${isDisabled ? 'text-white/50' : 'text-white'}`}>
                                  {section.title}
                                </h4>
                                {section.origin === 'custom' && (
                                  <button
                                    onClick={() => removeCustomSection(section.id)}
                                    className="text-red-300 hover:text-red-200 text-xs"
                                    title="Remove custom section"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <p className={`text-xs ${isDisabled ? 'text-white/40' : 'text-white/60'} mb-1.5 line-clamp-1`}>
                                {section.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {getOriginBadge(section.origin)}
                                {getSeverityBadge(section.severity)}
                                {getVisibilityBadge(section.visibility)}
                                {section.wordCountMin > 0 && (
                                  <span className="text-[10px] text-white/50">
                                    {section.wordCountMin}-{section.wordCountMax || '∞'} words
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setShowAddSection(true)}
                      className="w-full border border-dashed border-white/30 rounded-lg p-2.5 text-white/60 hover:text-white hover:border-white/50 transition-colors text-xs font-medium"
                    >
                      + Add Custom Section
                    </button>
                    {showAddSection && (
                      <div className="border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-white/80">Add a custom section to your plan</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={addCustomSection}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                          >
                            Add
                          </Button>
                          <Button
                            onClick={() => setShowAddSection(false)}
                            variant="ghost"
                            className="text-white/60 hover:text-white text-xs px-3 py-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Additional Documents */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Additional Documents ({filteredDocuments.length})
                    </h3>
                    <div className="flex gap-1">
                      {(['all', 'master', 'program', 'custom'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setDocumentFilter(filter)}
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            documentFilter === filter
                              ? 'bg-blue-600/40 text-white border border-blue-500/50'
                              : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[calc(80vh-200px)] overflow-y-auto">
                    {filteredDocuments.map((doc) => {
                      const isDisabled = disabledDocuments.has(doc.id);
                      const isOptional = !doc.required;
                      
                      return (
                        <div
                          key={doc.id}
                          className={`border rounded-lg p-2.5 ${
                            isDisabled 
                              ? 'border-white/10 bg-white/5 opacity-60' 
                              : 'border-white/20 bg-white/10'
                          } transition-all hover:border-white/30`}
                        >
                          <div className="flex items-start gap-2">
                            {isOptional ? (
                              <input
                                type="checkbox"
                                checked={!isDisabled}
                                onChange={() => toggleDocument(doc.id)}
                                className="mt-0.5 w-3.5 h-3.5 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="mt-0.5 text-white/40 text-xs">🔒</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <h4 className={`text-sm font-semibold ${isDisabled ? 'text-white/50' : 'text-white'}`}>
                                  {doc.name}
                                </h4>
                                {getOriginBadge(doc.origin)}
                                {doc.origin === 'custom' && (
                                  <button
                                    onClick={() => removeCustomDocument(doc.id)}
                                    className="text-red-300 hover:text-red-200 text-xs ml-auto"
                                    title="Remove custom document"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <p className={`text-xs ${isDisabled ? 'text-white/40' : 'text-white/60'} mb-1 line-clamp-1`}>
                                {doc.description}
                              </p>
                              <span className="text-[10px] text-white/50">
                                {doc.format.toUpperCase()} • Max {doc.maxSize}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setShowAddDocument(true)}
                      className="w-full border border-dashed border-white/30 rounded-lg p-2.5 text-white/60 hover:text-white hover:border-white/50 transition-colors text-xs font-medium"
                    >
                      + Add Custom Document
                    </button>
                    {showAddDocument && (
                      <div className="border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
                        <p className="text-xs text-white/80">Add a custom document to your plan</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={addCustomDocument}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                          >
                            Add
                          </Button>
                          <Button
                            onClick={() => setShowAddDocument(false)}
                            variant="ghost"
                            className="text-white/60 hover:text-white text-xs px-3 py-1"
                          >
                            Cancel
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
    </div>
  );
}

export default TemplateOverviewPanel;

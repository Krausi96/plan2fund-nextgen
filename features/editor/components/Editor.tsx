import React, { useRef, useState, useEffect, useMemo } from 'react';

import Sidebar from './layout/Workspace/Navigation/Sidebar/Sidebar';
import PreviewWorkspace from './layout/Workspace/Preview/PreviewWorkspace';
import InlineSectionEditor from './layout/Workspace/SectionEditor/SectionEditor';
import DocumentsBar from './layout/Workspace/Navigation/Documents/DocumentsBar';
import CurrentSelection from './layout/Workspace/Navigation/Configuration/CurrentSelection';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import {
  useEditorActions,
  useEditorStore,
  METADATA_SECTION_ID
} from '@/features/editor/lib/hooks/useEditorStore';
import { getSelectedProductMeta } from '@/features/editor/lib/helpers';
import {
  ProductType
} from '@/features/editor/lib/types';
import { useI18n } from '@/shared/contexts/I18nContext';
import DevClearCacheButton from './DevTools/DevClearCacheButton';
import { useEditor, useTemplateConfigurationState, useTemplateConfigurationHandlers, useEditorAutoActivation } from '@/features/editor/lib/hooks';
import { prepareSidebarProps, prepareDocumentsProps, preparePreviewProps } from '@/features/editor/lib/helpers';

type EditorProps = {
  product?: ProductType | null;
};

export default function Editor({ product = null }: EditorProps) {
  const { t } = useI18n();
  const workspaceGridRef = useRef<HTMLDivElement | null>(null);

  // Unified editor hook - consolidates all main hooks
  const editor = useEditor(product);
  const {
    // UI State
    isConfiguratorOpen,
    setIsConfiguratorOpen,
    editingSectionId,
    setEditingSectionId,
    connectCopy,
    productOptions,
    // Program Connection
    programSummary,
    programLoading,
    programError,
    handleConnectProgram,
    // Product Selection
    selectedProduct,
    handleProductChange,
    handleTemplateUpdate,
    // Template Management
    customSections,
    customDocuments,
    templateLoading,
    disabledSections,
    disabledDocuments,
    allSections,
    allDocuments,
    setCustomSections,
    setCustomDocuments,
    setDisabledSections,
    setDisabledDocuments,
    toggleSection: toggleSectionBase,
    toggleDocument,
    removeCustomSection,
    removeCustomDocument,
    // Document Management
    clickedDocumentId,
    handleSelectDocument,
    addCustomDocument: addCustomDocumentBase,
    documentPlan,
    filteredSections,
    filteredDocuments
  } = editor;

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
    updateTitlePage,
    updateAncillary,
    addReference,
    updateReference,
    deleteReference,
    addAppendix,
    updateAppendix,
    deleteAppendix,
    runRequirementsCheck,
  } = useEditorActions((actions) => actions);

  // Use editor activation hook to get refs and handle section selection
  const {
    sectionChangeSourceRef,
    suppressNavigationRef,
    handleSectionSelect
  } = useEditorAutoActivation(
    plan,
    activeSectionId,
    activeQuestionId,
    editingSectionId,
    isConfiguratorOpen,
    disabledSections,
    setActiveSection,
    setActiveQuestion,
    setEditingSectionId,
    (sectionId: string) => {
      setActiveSection(sectionId);
    }
  );

  // Track filtered section IDs for sidebar filtering
  const [filteredSectionIds] = useState<string[] | null>(null);
  
  // UI state for template management
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');
  
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<SectionTemplate | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentTemplate | null>(null);

  // Notify parent of changes when templates change
  const lastUpdateKeyRef = useRef<string>('');
  
  useEffect(() => {
    // Don't trigger hydration if configurator is open or we're suppressing navigation
    if (isConfiguratorOpen || suppressNavigationRef.current) {
      return;
    }
    
    const updateKey = JSON.stringify({
      disabled: Array.from(disabledSections).sort(),
      docs: Array.from(disabledDocuments).sort(),
      customSections: customSections.map(s => s.id).sort(),
      customDocuments: customDocuments.map(d => d.id).sort()
    });
    
    if (lastUpdateKeyRef.current === updateKey) {
      return;
    }
    
    lastUpdateKeyRef.current = updateKey;
    
    handleTemplateUpdate({
      disabledSectionIds: Array.from(disabledSections).sort(),
      disabledDocumentIds: Array.from(disabledDocuments).sort(),
      customSections: customSections.length > 0 ? customSections : undefined,
      customDocuments: customDocuments.length > 0 ? customDocuments : undefined
    });
  }, [disabledSections, disabledDocuments, customSections, customDocuments, isConfiguratorOpen, suppressNavigationRef, handleTemplateUpdate]);

  // Template management handlers using hook
  const {
    toggleSection,
    addCustomSection: addCustomSectionHandler,
    addCustomDocument: addCustomDocumentHandler,
    toggleAddBadge,
    handleSaveItem
  } = useTemplateConfigurationHandlers(
    toggleSectionBase,
    addCustomDocumentBase,
    setCustomSections,
    setCustomDocuments,
    setDisabledSections,
    setDisabledDocuments,
    setExpandedSectionId,
    setExpandedDocumentId,
    setEditingSection,
    setEditingDocument,
    setEditingSectionId,
    setShowAddSection,
    setShowAddDocument,
    setNewSectionTitle,
    setNewSectionDescription,
    setNewDocumentName,
    setNewDocumentDescription,
    customSections,
    clickedDocumentId,
    sectionChangeSourceRef,
    suppressNavigationRef,
    lastUpdateKeyRef
  );

  const addCustomSection = () => {
    addCustomSectionHandler(newSectionTitle, newSectionDescription);
  };

  const addCustomDocument = () => {
    addCustomDocumentHandler(newDocumentName, newDocumentDescription);
  };



  // Filtered sections and documents are now provided by useEditor hook

  // Inline computed values
  const effectiveEditingSectionId = useMemo(() => {
    if (!plan) return null;
    if (editingSectionId) return editingSectionId;
    if (activeSectionId) return activeSectionId;
    if (plan.sections && plan.sections.length > 0) {
      return plan.sections[0].id;
    }
    return METADATA_SECTION_ID;
  }, [editingSectionId, activeSectionId, plan]);
  
  const visibleSections = useMemo(() => 
    allSections.filter(s => !disabledSections.has(s.id)),
    [allSections, disabledSections]
  );
  
  const visibleDocuments = useMemo(() => 
    allDocuments.filter(d => !disabledDocuments.has(d.id)),
    [allDocuments, disabledDocuments]
  );

  const enabledDocumentsCount = visibleDocuments.length + 1; // +1 for core product
  const totalDocumentsCount = allDocuments.length + 1; // +1 for core product

  // Get selected product meta
  const selectedProductMeta = getSelectedProductMeta(productOptions, selectedProduct);

  // Use templateState hook
  const templateState = useTemplateConfigurationState(
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
  );

  // Component props preparation (replaced hooks with helper functions)
  const sidebarProps = prepareSidebarProps(
    plan,
    activeSectionId,
    handleSectionSelect,
    clickedDocumentId,
    filteredSectionIds,
    templateState,
    productOptions,
    selectedProduct,
    programSummary ? { name: programSummary.name, amountRange: programSummary.amountRange ?? undefined } : null
  );

  const documentsProps = prepareDocumentsProps(
    templateState,
    productOptions,
    selectedProduct,
    plan
  );

  const previewProps = preparePreviewProps(
    plan,
    documentPlan,
    activeSectionId,
    editingSectionId,
    disabledSections,
    clickedDocumentId,
    productOptions,
    selectedProduct,
    updateTitlePage,
    updateAncillary,
    addReference,
    updateReference,
    deleteReference,
    addAppendix,
    updateAppendix,
    deleteAppendix,
    handleSectionSelect,
    setEditingSectionId,
    (id: string | null) => {
      if (id) {
        setActiveQuestion(id);
      }
    },
    setIsConfiguratorOpen
  );

  // Config component will use useConfig hook internally

  // Show loading/error states
  // Note: We don't show a special state for null product - we show the full UI with empty states

  const isWaitingForPlan = selectedProduct && isLoading;
  
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
                    {/* Row 1, Col 1: Config - Matches DocumentsBar height */}
                    <div className="flex-shrink-0 relative min-h-0 flex flex-col" style={{ zIndex: 0, overflow: 'visible', contain: 'none', height: 'fit-content', maxHeight: 'fit-content' }}>
                      <CurrentSelection
                        templateState={templateState}
                        selectedProduct={selectedProduct}
                        productOptions={productOptions}
                        connectCopy={connectCopy}
                        programSummary={programSummary}
                        programError={programError}
                        programLoading={programLoading}
                        progressSummary={progressSummary}
                        handleProductChange={handleProductChange}
                        handleConnectProgram={handleConnectProgram}
                        runRequirementsCheck={runRequirementsCheck}
                        workspaceGridRef={workspaceGridRef}
                        isConfiguratorOpen={isConfiguratorOpen}
                        setIsConfiguratorOpen={setIsConfiguratorOpen}
                        setCustomSections={setCustomSectionsWrapper}
                        setCustomDocuments={setCustomDocumentsWrapper}
                      />
                    </div>

                    {/* Row 1, Col 2: Documents Bar - Matches Config height */}
                    <div 
                      className="flex-shrink-0 relative flex flex-col" 
                      style={{ 
                        zIndex: templateState?.showAddDocument ? 100 : 10, 
                        overflowY: 'visible', 
                        overflowX: 'visible', 
                        contain: templateState?.showAddDocument ? 'none' : 'layout',
                        position: 'relative'
                      }}
                    >
                      {documentsProps ? (
                        <DocumentsBar {...documentsProps} />
                      ) : null}
                    </div>

                    {/* Row 2, Col 1: Sidebar - Next to Preview */}
                    <div className="border-r border-white/10 pr-4 min-h-0 flex flex-col relative" style={{ maxWidth: '320px', width: '320px', minWidth: '320px', boxSizing: 'border-box', zIndex: 1, overflow: 'hidden' }}>
                      {sidebarProps ? (
                        <Sidebar {...sidebarProps} />
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
                        {previewProps ? (
                          <PreviewWorkspace {...previewProps} />
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
                          onClose={() => setEditingSectionId(null)}
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


import React, { useState, useCallback } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore, inferProductTypeFromBlueprint, instantiateFromBlueprint } from '@/features/editor/lib';
import { ControlsPanel } from './components/ControlsPanel';
import { ProgramSummaryPanel } from '../../ProgramSelection/components/panels/ProgramSummaryPanel';

interface BlueprintInstantiationStepProps {
  onComplete?: () => void;
  onBack?: () => void;
}

// @ts-ignore - Props are used via parent component callbacks
export default function BlueprintInstantiationStep({
  onComplete: _onComplete,
  onBack: _onBack
}: BlueprintInstantiationStepProps) {
  const { t } = useI18n();
  
  // Use direct i18n keys with type casting - include ALL needed translations
  const typedT = t as any;
  const translations = {
    // Header translations
    header: typedT('editor.desktop.blueprint.header'),
    subtitle: typedT('editor.desktop.blueprint.subtitle'),
    
    // Summary panel translations
    summaryTitle: typedT('editor.desktop.blueprint.summary.title'),
    
    // Preview panel translations
    previewTitle: typedT('editor.desktop.blueprint.preview.title'),
    
    // Controls panel translations
    controlsTitle: typedT('editor.desktop.blueprint.controls.title'),
    addDocument: typedT('editor.desktop.blueprint.controls.addDocument'),
    addSection: typedT('editor.desktop.blueprint.controls.addSection'),
    versionToggle: typedT('editor.desktop.blueprint.controls.versionToggle'),
    shortVersion: typedT('editor.desktop.blueprint.controls.shortVersion'),
    longVersion: typedT('editor.desktop.blueprint.controls.longVersion'),
    addButton: typedT('editor.desktop.blueprint.controls.add'),
    renameButton: typedT('editor.desktop.blueprint.controls.rename'),
    requiredLabel: typedT('editor.desktop.blueprint.controls.required'),
    optionalLabel: typedT('editor.desktop.blueprint.controls.optional'),
    
    // Summary panel content translations
    sourceLabel: typedT('editor.desktop.blueprint.source'),
    documentsLabel: typedT('editor.desktop.blueprint.documents'),
    sectionsLabel: typedT('editor.desktop.blueprint.sections'),
    
    // Placeholder translations
    documentPlaceholder: typedT('editor.desktop.blueprint.placeholder.documentName'),
    sectionPlaceholder: typedT('editor.desktop.blueprint.placeholder.sectionName')
  };
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = setupWizard.documentStructure;
  const programSummary = useEditorStore((state) => state.programSummary);
  

  
  // Store actions for instantiation
  const setSelectedProduct = useEditorStore((state) => state.setSelectedProduct);
  const setPlan = useEditorStore((state) => state.setPlan);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const completeSetupWizard = useEditorStore((state) => state.completeSetupWizard);
  const setIsConfiguratorOpen = useEditorStore((state) => state.setIsConfiguratorOpen);
  
  // UI state for editing
  const [expandedDocuments, setExpandedDocuments] = useState<Record<string, boolean>>({});
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
  // Use existing ProgramSummaryPanel for document structure visualization
  
  // Get blueprint source information
  const getBlueprintSource = useCallback(() => {
    if (programSummary && documentStructure?.source === 'program') {
      return {
        type: 'program',
        label: 'Program',
        name: programSummary.name,
        description: `Connected to ${programSummary.organization || programSummary.name}`
      };
    } else if (documentStructure?.source === 'template') {
      return {
        type: 'template',
        label: 'Template Upload',
        name: 'Uploaded Template',
        description: 'Structure derived from uploaded document'
      };
    } else {
      return {
        type: 'standard',
        label: 'Standard Structure',
        name: 'Standard Template',
        description: 'Using default business plan structure'
      };
    }
  }, [programSummary, documentStructure]);


  
  const blueprintSource = getBlueprintSource();



  // Add new document
  const handleAddDocument = () => {
    if (!newDocumentName.trim()) return;
    
    // TODO: Implement document addition logic
    setNewDocumentName('');
  };

  // Add new section
  const handleAddSection = (_documentId: string) => {
    if (!newSectionTitle.trim()) return;
    
    // TODO: Implement section addition logic
    setNewSectionTitle('');
  };



  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with translation support */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 text-left">
          {translations.header || 'Create Plan Documents'}
        </h2>
        <div className="border-b border-white/20 mb-2"></div>
        <p className="text-white/60 text-sm whitespace-nowrap">
          {translations.subtitle || 'Instantiate the Blueprint into actual editable documents'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Documents & Sections List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Blueprint Summary Panel - Collapsed by default */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded-lg p-2 -ml-2"
              onClick={() => setExpandedDocuments(prev => ({ ...prev, '__summary__': !prev['__summary__'] }))}
            >
              <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400 text-blue-300 text-sm">
                📊
              </div>
              <span className="text-white font-medium flex-1">{translations.summaryTitle || 'Blueprint Summary'}</span>
              <span className="text-white/70 transform transition-transform duration-200" style={{ transform: expandedDocuments['__summary__'] ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                ▼
              </span>
            </div>
            
            {expandedDocuments['__summary__'] && (
              <div className="mt-3 pt-3 border-t border-white/10 ml-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-white/60 uppercase mb-1">{translations.sourceLabel || 'Source'}</div>
                    <div className="text-white font-medium">{blueprintSource.label}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-white/60 uppercase mb-1">{translations.documentsLabel || 'Documents'}</div>
                    <div className="text-white font-medium">{documentStructure?.documents?.length || 0}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-white/60 uppercase mb-1">{translations.sectionsLabel || 'Sections'}</div>
                    <div className="text-white font-medium">{documentStructure?.sections?.length || 0}</div>
                  </div>
                </div>
                
                {blueprintSource.description && (
                  <div className="text-white/80 text-sm italic">
                    {blueprintSource.description}
                  </div>
                )}
              </div>
            )}
          </div>
            
          <div className="space-y-3">
            <ProgramSummaryPanel documentStructure={documentStructure} onClear={() => {}} />
          </div>
        </div>

        {/* Right Column - Controls Panel */}
        <div className="space-y-4">
          <ControlsPanel 
            onAddDocument={handleAddDocument}
            onAddSection={(_name) => handleAddSection('main_document')}
          />
        </div>
      </div>
      
      {/* Create Documents Button - Fixed at bottom */}
      {documentStructure && (
        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              if (!documentStructure) return;
              
              // Step 1: Infer product type from blueprint
              const productType = setupWizard.inferredProductType || inferProductTypeFromBlueprint(documentStructure);
              
              // Step 2: Prepare title page data from Step 1 (if exists)
              const existingTitlePage = setupWizard.projectProfile ? {
                title: documentStructure?.source === 'upgrade' ? 'Upgrade Document' : setupWizard.projectProfile.projectName || '',
                companyName: setupWizard.projectProfile.author || '',
                date: new Date().toISOString().split('T')[0],
                confidentialityStatement: setupWizard.projectProfile.confidentialityStatement || '',
              } : undefined;
              
              // Step 3: Instantiate plan from blueprint
              const plan = instantiateFromBlueprint(documentStructure, productType, existingTitlePage);
              
              // If document structure source is 'upgrade', update the plan title to reflect this
              if (documentStructure?.source === 'upgrade') {
                if (plan.documents && plan.documents.length > 0) {
                  plan.documents[0].name = t('editor.desktop.selection.upgradeDocument' as any) || 'Upgrade Document'
                }
              }
              
              // Step 4: Update store to trigger TreeNavigator & PreviewWorkspace sync
              setSelectedProduct(productType);
              setPlan(plan);
              setSetupStatus('confirmed');
              completeSetupWizard();
              
              // Step 5: Close configurator and navigate to editor
              setIsConfiguratorOpen(false);
              
              console.log('✅ Documents created successfully:', {
                productType,
                sectionsCount: plan.sections.length,
                source: documentStructure.source
              });
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
          >
            <span>✓</span>
            <span>Create Documents</span>
          </button>
        </div>
      )}
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore, inferProductTypeFromBlueprint, instantiateFromBlueprint } from '@/features/editor/lib';
import { getSectionIcon } from '@/features/editor/lib/utils/sectionUtils';

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

  // Toggle document expansion
  const toggleDocument = (documentId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  };

  // Group sections by document
  const getSectionsByDocument = useCallback(() => {
    console.log('🏗️ BlueprintInstantiation documentStructure sections:', documentStructure?.sections?.length, documentStructure?.sections?.map(s => s.id));
    if (!documentStructure?.sections) return {};
    
    const grouped: Record<string, any[]> = {};
    documentStructure.sections.forEach(section => {
      const docId = section.documentId || 'main_document';
      if (!grouped[docId]) {
        grouped[docId] = [];
      }
      grouped[docId].push(section);
    });
    return grouped;
  }, [documentStructure]);

  const sectionsByDoc = getSectionsByDocument();
  const blueprintSource = getBlueprintSource();

  // Get required sections for a document
  const getRequiredSections = (documentId: string) => {
    // If no sections are grouped by documentId, show all sections under the single document
    if (Object.keys(sectionsByDoc).length === 0 && documentStructure?.sections?.length) {
      return documentStructure.sections.filter(section => section.required !== false);
    }
    return sectionsByDoc[documentId]?.filter(section => section.required !== false) || [];
  };

  // Get optional sections for a document
  const getOptionalSections = (documentId: string) => {
    // If no sections are grouped by documentId, show all sections under the single document
    if (Object.keys(sectionsByDoc).length === 0 && documentStructure?.sections?.length) {
      return documentStructure.sections.filter(section => section.required === false);
    }
    return sectionsByDoc[documentId]?.filter(section => section.required === false) || [];
  };

  // Add new document
  const handleAddDocument = () => {
    if (!newDocumentName.trim()) return;
    
    // TODO: Implement document addition logic
    console.log('Adding document:', newDocumentName);
    setNewDocumentName('');
  };

  // Add new section
  const handleAddSection = (documentId: string) => {
    if (!newSectionTitle.trim()) return;
    
    // TODO: Implement section addition logic
    console.log('Adding section to document', documentId, ':', newSectionTitle);
    setNewSectionTitle('');
  };

  // Toggle section enabled/disabled
  const handleToggleSection = (sectionId: string) => {
    // TODO: Implement section enable/disable logic
    console.log('Toggling section:', sectionId);
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
            {documentStructure?.documents?.map((doc) => {
              // Auto-expand the document if there's only one document
              const isExpanded = (documentStructure?.documents?.length === 1) || (expandedDocuments[doc.id] ?? true);
              const requiredSections = getRequiredSections(doc.id);
              const optionalSections = getOptionalSections(doc.id);
              
              return (
                <div key={doc.id} className="border border-white/10 rounded-lg bg-slate-700/20">
                  {/* Document Header */}
                  <div 
                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-white/5 rounded-t-lg"
                    onClick={() => toggleDocument(doc.id)}
                  >
                    <span className="text-blue-400">📄</span>
                    <span className="text-white font-semibold flex-1 truncate" title={doc.name}>{doc.name}</span>
                    <span className="text-white/70 transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                      ▼
                    </span>
                  </div>
                  
                  {/* Sections List */}
                  {isExpanded && (
                    <div className="p-3 pt-0 border-t border-white/10">
                      <div className="space-y-2 ml-4">
                        {/* Required Sections */}
                        {requiredSections.map((section) => (
                          <div key={section.id} className="flex items-center gap-2 text-white/90 text-sm">
                            <span className="text-red-400">
                              {getSectionIcon(section.id)}
                            </span>
                            <span className="flex-1 truncate" title={section.title}>{section.title}</span>
                            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">{translations.requiredLabel || 'Required'}</span>
                          </div>
                        ))}
                        
                        {/* Optional Sections */}
                        {optionalSections.map((section) => (
                          <div key={section.id} className="flex items-center gap-2 text-white/90 text-sm">
                            <input
                              type="checkbox"
                              checked={true} // Assuming optional sections are enabled by default
                              onChange={() => handleToggleSection(section.id)}
                              className="w-4 h-4 rounded text-blue-500 bg-slate-600 border-slate-500 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <span>
                              {getSectionIcon(section.id)}
                            </span>
                            <span className="flex-1 truncate" title={section.title}>{section.title}</span>
                            <button className="text-xs text-blue-400 hover:text-blue-300 underline">{translations.renameButton || 'Rename'}</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Controls Panel */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-orange-400 text-lg">⚙️</span>
              <h3 className="text-white font-bold text-lg">{translations.controlsTitle || 'Controls'}</h3>
            </div>
            
            <div className="space-y-4">
              {/* Add Document Button */}
              <div>
                <label className="block text-white/80 text-sm mb-2">{translations.addDocument || 'Add New Document'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder={translations.documentPlaceholder || "Document name..."}
                    className="flex-1 text-sm bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDocument()}
                  />
                  <button
                    onClick={handleAddDocument}
                    disabled={!newDocumentName.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    {translations.addButton || 'Add'}
                  </button>
                </div>
              </div>
              
              {/* Add Section Button */}
              <div>
                <label className="block text-white/80 text-sm mb-2">{translations.addSection || 'Add Custom Section'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder={translations.sectionPlaceholder || "Section name..."}
                    className="flex-1 text-sm bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSection('main_document')}
                  />
                  <button
                    onClick={() => handleAddSection('main_document')}
                    disabled={!newSectionTitle.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    {translations.addButton || 'Add'}
                  </button>
                </div>
              </div>
              
              {/* Version Toggle */}
              <div className="pt-3 border-t border-white/10">
                <label className="block text-white/80 text-sm mb-2">{translations.versionToggle || 'Document Version'}</label>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm font-medium border border-slate-500/30">
                    {translations.shortVersion || 'Short'}
                  </button>
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    {translations.longVersion || 'Long'}
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                title: setupWizard.projectProfile.projectName || '',
                companyName: setupWizard.projectProfile.author || '',
                date: new Date().toISOString().split('T')[0],
                confidentialityStatement: setupWizard.projectProfile.confidentialityStatement || '',
              } : undefined;
              
              // Step 3: Instantiate plan from blueprint
              const plan = instantiateFromBlueprint(documentStructure, productType, existingTitlePage);
              
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
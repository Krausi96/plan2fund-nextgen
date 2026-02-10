import React, { useState } from 'react';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { useI18n } from '@/shared/contexts/I18nContext';
import { MASTER_SECTIONS } from '@/features/editor/lib/templates';
import { enhanceWithSpecialSections } from '@/platform/analysis/internal/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
import { DocumentUploadPanel } from './DocumentUploadOption';

interface FreeOptionProps {
  onStructureSelected?: (structure: string) => void;
  onProductSelected?: (product: string) => void;
  onNavigateToBlueprint?: () => void;
}

export function FreeOption({ onStructureSelected, onNavigateToBlueprint }: FreeOptionProps) {
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);


  const { t } = useI18n();
  
  // Access platform store for document setup management
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setInferredProductType = useProject((state) => state.setInferredProductType);
  
  
  const handleStructureSelect = (structure: string) => {
    setSelectedStructure(structure);
    
    // Don't call onStructureSelected for 'upgrade' as it renders the DocumentUploadPanel component
    // The DocumentUploadPanel component will handle its own document structure and call onStructureSelected when ready
    if (structure !== 'upgrade') {
      onStructureSelected?.(structure);
    }
    
    // Create standard blueprint when structure is selected
    const createStandardBlueprint = () => {
      // Map structure types to document templates - CONNECTED TO MASTER TEMPLATES
      const structureMap = {
        'business-plan': {
          productType: 'submission' as const,
        },
        'strategy': {
          productType: 'strategy' as const
        },
        'upgrade': {
          productType: 'upgrade' as const
        }
      };

      const structureConfig = structureMap[structure as keyof typeof structureMap] || structureMap['business-plan'];
      
      // Create document structure using actual template data
      const baseStructure: any = {
        structureId: `standard-${structure}-${Date.now()}`,
        version: '1.0',
        source: 'standard' as const,
        // Populate with actual template documents and sections
        documents: [
          {
            id: 'main_document',
            name: structureConfig.productType === 'submission' 
              ? t('editor.desktop.program.document.businessPlan')
              : structureConfig.productType === 'upgrade'
                ? t('editor.desktop.program.document.upgradePlan')
                : t('editor.desktop.program.document.strategyDocument'),
            purpose: 'Main document for the business plan',
            required: true,
            templateId: 'default_template'
          }
        ],
        // Populate with actual template sections - CONVERT to document structure format
        sections: MASTER_SECTIONS[structureConfig.productType]?.map((templateSection: any) => ({
          id: templateSection.id,
          documentId: 'main_document',
          title: templateSection.title || templateSection.name || '',
          type: (templateSection.required ? 'required' : 'optional') as 'required' | 'optional' | 'conditional',
          required: templateSection.required !== false,
          programCritical: false,
          aiPrompt: templateSection.aiPrompt || `Write detailed content for ${templateSection.title || templateSection.name}`,
          checklist: templateSection.checklist || [`Address ${templateSection.title || templateSection.name} requirements`],
          // Include template-specific properties
          rawSubsections: templateSection.rawSubsections
        })) || [],
        requirements: [],
        validationRules: [],
        aiGuidance: [],
        renderingRules: {},
        conflicts: [],
        warnings: ['Standard template - no program requirements applied'],
        confidenceScore: 70,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'standard-template'
      };
      
      // ENHANCE with special sections (Title Page, TOC, References, Appendices)
      const documentStructure = enhanceWithSpecialSections(baseStructure, t);
      
      // Update store with standard structure
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      
      // Infer and store product type for Step 3 instantiation - SYNCED WITH MASTER_TEMPLATES
      const inferredType = structureConfig.productType;
      setInferredProductType(inferredType);
      
    };

    // Only create standard blueprint for non-upgrade structures
    if (structure !== 'upgrade') {
      createStandardBlueprint();
    }
    
    // Don't navigate immediately for upgrade - let DocumentUploadPanel handle navigation when ready
  };


  const structureOptions = [
    {
      id: 'business-plan',
      title: t('editor.desktop.program.document.businessPlan'),
      icon: '📋',
    },
    {
      id: 'strategy',
      title: t('editor.desktop.program.document.strategyDocument'), 
      icon: '💡',
    },
    {
      id: 'upgrade',
      title: t('editor.desktop.program.document.upgradePlan'), 
      icon: '♻️',
    }
  ];

  return (
    <div className="space-y-6">
      {selectedStructure === 'upgrade' ? (
        // Show DocumentUploadPanel when 'upgrade' is selected
        <div>
          <div className="mb-4">
            <button 
              onClick={() => {
                setSelectedStructure(null);
                // Reset document structure when going back
                setDocumentStructure(null);
                setInferredProductType(null);
              }}
              className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm"
            >
              <span>←</span>
              <span>{t('editor.desktop.program.backToPlanOptions')}</span>
            </button>
          </div>
          <DocumentUploadPanel onNavigateToBlueprint={onNavigateToBlueprint} />
        </div>
      ) : (
        <>
          {/* Base Structure Selection - MOVING FROM PRODUCT SELECTION */}
          <div className="bg-slate-800/50 rounded-xl border border-white/10 p-5">
            <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
              <span>🏗️</span>
              {t('editor.desktop.program.chooseBaseStructure')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {structureOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleStructureSelect(option.id)}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 min-h-[160px] ${
                    selectedStructure === option.id
                      ? 'border-green-400 bg-green-900/20 shadow-lg scale-[1.02] opacity-100'
                      : 'border-white/20 hover:border-green-400/50 hover:bg-white/5 opacity-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4 mt-3">{option.icon}</div>
                    <h4 className="text-white font-bold text-base mb-3">{option.title}</h4>
                    <p className="text-white/80 text-xs leading-relaxed">
                    </p>
                  </div>
                  
                  {selectedStructure === option.id && (
                    <div className="mt-4 flex items-center justify-center">
                      <div className="text-green-400 text-xs font-medium flex items-center gap-1">
                        <span>{option.icon}</span>
                        <span>{t('editor.desktop.program.selected')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { useI18n } from '@/shared/contexts/I18nContext';
import { MASTER_SECTIONS } from '@/features/editor/lib/templates';
import { buildFromTemplate } from '@/platform/generation/structure/structureBuilder';


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
    
    onStructureSelected?.(structure);
    
    // Create standard blueprint when structure is selected
    const createStandardBlueprint = () => {
      // Map structure types to document templates - CONNECTED TO MASTER TEMPLATES
      const structureMap = {
        'business-plan': {
          productType: 'submission' as const,
          documentName: t('editor.desktop.program.document.businessPlan'),
        },
        'strategy': {
          productType: 'strategy' as const,
          documentName: t('editor.desktop.program.document.strategyDocument'),
        }
      };

      const structureConfig = structureMap[structure as keyof typeof structureMap] || structureMap['business-plan'];
      
      // Build document structure through builder - ensures canonical ordering
      const templateSections = MASTER_SECTIONS[structureConfig.productType] || [];
      const documentStructure = buildFromTemplate(
        templateSections,
        structureConfig.productType,
        structureConfig.documentName
      );

      // Update store with standard structure
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      
      // Store product type for Step 3 instantiation
      setInferredProductType(structureConfig.productType);
    };

    createStandardBlueprint();
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
    }
  ];

  return (
    <div className="space-y-6">
      {(
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
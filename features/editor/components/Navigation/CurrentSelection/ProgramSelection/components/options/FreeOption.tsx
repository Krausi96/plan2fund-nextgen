import React, { useState } from 'react';
import { useEditorStore } from '@/features/editor/lib/store/editorStore';
import { useI18n } from '@/shared/contexts/I18nContext';
import { MASTER_SECTIONS } from '@/features/editor/lib/templates';
import { enhanceWithSpecialSections } from '@/features/editor/lib/utils/sectionUtils';

interface FreeOptionProps {
  onStructureSelected?: (structure: string) => void;
  onProductSelected?: (product: string) => void;
}

export function FreeOption({ onStructureSelected }: FreeOptionProps) {
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  
  const { t } = useI18n();
  
  // Access editor store for document setup management
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  const setInferredProductType = useEditorStore((state) => state.setInferredProductType);
  
  // Removed unused selector: useSectionsAndDocumentsCounts()

  const handleStructureSelect = (structure: string) => {
    setSelectedStructure(structure);
    onStructureSelected?.(structure);
    
    // Create standard blueprint when structure is selected
    const createStandardBlueprint = () => {
      // Map structure types to document templates - CONNECTED TO MASTER TEMPLATES
      const structureMap = {
        'business-plan': {
          productType: 'submission' as const,
          // No hardcoded documents - will use template system
          // No hardcoded sections - will use MASTER_SECTIONS[productType]
        },
        'strategy': {
          productType: 'strategy' as const
          // No hardcoded documents - will use template system  
          // No hardcoded sections - will use MASTER_SECTIONS[productType]
        }
      };

      const structureConfig = structureMap[structure as keyof typeof structureMap] || structureMap['business-plan'];
      
      // Create document structure using actual template data
      const baseStructure = {
        structureId: `standard-${structure}-${Date.now()}`,
        version: '1.0',
        source: 'standard' as const,
        // Populate with actual template documents and sections
        documents: [
          {
            id: 'main_document',
            name: structureConfig.productType === 'submission' 
              ? t('editor.desktop.program.document.businessPlan')
              : t('editor.desktop.program.document.strategyDocument'),
            purpose: 'Main document for the business plan',
            required: true,
            templateId: 'default_template'
          }
        ],
        // Populate with actual template sections - CONVERT to document structure format
        sections: MASTER_SECTIONS[structureConfig.productType]?.map(templateSection => ({
          id: templateSection.id,
          documentId: 'main_document',
          title: templateSection.title || templateSection.name || '',
          type: (templateSection.required ? 'required' : 'optional') as 'required' | 'optional' | 'conditional',
          required: templateSection.required !== false,
          programCritical: false,
          aiPrompt: templateSection.aiPrompt || `Write detailed content for ${templateSection.title || templateSection.name}`,
          checklist: templateSection.checklist || [`Address ${templateSection.title || templateSection.name} requirements`]
        })) || [],
        requirements: [],
        validationRules: [],
        aiGuidance: [],
        renderingRules: {},
        conflicts: [],
        warnings: selectedIndustry ? [`Industry focus: ${selectedIndustry}`] : ['Standard template - no program requirements applied'],
        confidenceScore: selectedIndustry ? 85 : 70,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'standard-template'
      };
      
      // DEBUG: Log the base structure sections
      console.log('🏗️ Base structure sections from MASTER_SECTIONS:', baseStructure.sections?.map(s => ({id: s.id, title: s.title})));
      
      // ENHANCE with special sections (Title Page, TOC, References, Appendices)
      const documentStructure = enhanceWithSpecialSections(baseStructure, t);
      
      // DEBUG: Log the enhanced structure
      console.log('📝 Enhanced document structure sections:', documentStructure?.sections?.map(s => ({id: s.id, title: s.title})));
      
      // Update store with standard structure
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: selectedIndustry ? [`Industry focus: ${selectedIndustry}`] : ['Standard template - no program requirements applied'],
        missingFields: [],
        confidence: selectedIndustry ? 85 : 70
      });
      
      // Infer and store product type for Step 3 instantiation - SYNCED WITH MASTER_TEMPLATES
      const inferredType = structureConfig.productType;
      setInferredProductType(inferredType);
      
      // REMOVED auto-navigation - user should confirm choices first
      // Navigation will happen when user clicks "Continue" or similar confirmation
      // BlueprintInstantiation will use inferredProductType to get actual template sections
    };

    createStandardBlueprint();
  };


  const structureOptions = [
    {
      id: 'business-plan',
      title: t('editor.desktop.program.document.businessPlan'),
      subtitle: '(Submission)',
      description: 'Full comprehensive business plan with financial projections and detailed analysis',
      icon: '📋',
      features: ['Financial Statements', 'Market Analysis', 'Implementation Timeline', 'Risk Assessment']
    },
    {
      id: 'strategy',
      title: t('editor.desktop.program.document.strategyDocument'), 
      subtitle: '(Strategic Focus)',
      description: 'High-level strategic overview focusing on market positioning and growth initiatives',
      icon: '🎯',
      features: ['SWOT Analysis', 'Competitive Positioning', 'Strategic Roadmap', 'Resource Planning']
    }
    // REMOVED pitch-deck option - not a valid product type
  ];

  return (
    <div className="space-y-6">

      {/* Base Structure Selection - MOVING FROM PRODUCT SELECTION */}
      <div className="bg-slate-800/50 rounded-xl border border-white/10 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>🏗️</span>
          Choose Base Structure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {structureOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleStructureSelect(option.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                selectedStructure === option.id
                  ? 'border-green-400 bg-green-900/20 shadow-lg scale-[1.02]'
                  : 'border-white/20 hover:border-green-400/50 hover:bg-white/5'
              }`}
            >
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">{option.icon}</div>
                <h4 className="text-white font-bold text-base mb-1">{option.title}</h4>
                <p className="text-green-300 text-xs font-medium mb-2">{option.subtitle}</p>
                <p className="text-white/70 text-xs leading-relaxed">{option.description}</p>
              </div>
              
              {/* Features List */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-white/60 text-xs font-medium mb-2">Includes:</div>
                <ul className="space-y-1">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1 text-white/80 text-xs">
                      <span className="text-green-400 text-xs">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {selectedStructure === option.id && (
                <div className="mt-3 pt-3 border-t border-green-700/30">
                  <div className="text-green-300 text-xs font-medium flex items-center gap-1 justify-center">
                    <span>✓</span>
                    <span>Selected</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>



      {/* Industry Preset (Optional) */}
      {selectedStructure && (
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-5">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span>🏭</span>
            Industry Focus (Optional)
          </h3>
          
          <div className="max-w-md">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-white focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/60"
            >
              <option value="">Select industry...</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="green-energy">Green Energy</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
            
            <p className="text-white/60 text-xs mt-2">
              Industry selection helps tailor section suggestions and examples
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
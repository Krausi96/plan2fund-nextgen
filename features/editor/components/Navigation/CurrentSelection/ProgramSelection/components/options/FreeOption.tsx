import React, { useState } from 'react';
import { useEditorStore } from '@/features/editor/lib/store/editorStore';

interface FreeOptionProps {
  onStructureSelected?: (structure: string) => void;
  onProductSelected?: (product: string) => void;
}

export function FreeOption({ onStructureSelected }: FreeOptionProps) {
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  
  // Access editor store for document setup management
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  
  // Removed unused selector: useSectionsAndDocumentsCounts()

  const handleStructureSelect = (structure: string) => {
    setSelectedStructure(structure);
    onStructureSelected?.(structure);
    
    // Create standard blueprint when structure is selected
    const createStandardBlueprint = () => {
      // Map structure types to document templates
      const structureMap = {
        'business-plan': {
          documents: [
            { id: 'main_document', name: 'Business Plan', purpose: 'Primary business plan document', required: true },
            { id: 'financial_appendices', name: 'Financial Appendices', purpose: 'Detailed financial statements', required: false }
          ],
          baseSections: [
            'Executive Summary',
            'Company Description', 
            'Market Analysis',
            'Business Model',
            'Financial Plan',
            'Implementation Plan',
            'Risk Analysis'
          ]
        },
        'strategy': {
          documents: [
            { id: 'strategy_doc', name: 'Strategy Document', purpose: 'Strategic planning document', required: true }
          ],
          baseSections: [
            'Executive Summary',
            'Strategic Overview',
            'Market Opportunity',
            'Competitive Analysis',
            'Strategic Initiatives',
            'Resource Requirements',
            'Timeline & Milestones'
          ]
        },
        'pitch-deck': {
          documents: [
            { id: 'pitch_deck', name: 'Pitch Deck', purpose: 'Investor presentation deck', required: true }
          ],
          baseSections: [
            'Problem & Solution',
            'Market Opportunity', 
            'Business Model',
            'Traction',
            'Team',
            'Financial Projections',
            'Funding Ask'
          ]
        }
      };

      const structureConfig = structureMap[structure as keyof typeof structureMap] || structureMap['business-plan'];
      
      const documentStructure = {
        structureId: `standard-${structure}-${Date.now()}`,
        version: '1.0',
        source: 'standard' as const,
        documents: structureConfig.documents,
        sections: structureConfig.baseSections.map((title, index) => ({
          id: `section_${index}_${title.replace(/\s+/g, '_').toLowerCase()}`,
          documentId: structureConfig.documents[0].id,
          title: title,
          type: index < 4 ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
          required: index < 4,
          programCritical: false
        })),
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

      // Update store with standard structure
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: selectedIndustry ? [`Industry focus: ${selectedIndustry}`] : ['Standard template - no program requirements applied'],
        missingFields: [],
        confidence: selectedIndustry ? 85 : 70
      });
    };

    createStandardBlueprint();
  };


  const structureOptions = [
    {
      id: 'business-plan',
      title: 'Business Plan',
      subtitle: '(Standard)',
      description: 'Full comprehensive business plan with financial projections and detailed analysis',
      icon: '📋',
      features: ['Financial Statements', 'Market Analysis', 'Implementation Timeline', 'Risk Assessment']
    },
    {
      id: 'strategy',
      title: 'Strategy Document', 
      subtitle: '(Strategic Focus)',
      description: 'High-level strategic overview focusing on market positioning and growth initiatives',
      icon: '🎯',
      features: ['SWOT Analysis', 'Competitive Positioning', 'Strategic Roadmap', 'Resource Planning']
    },
    {
      id: 'pitch-deck',
      title: 'Pitch Deck Outline',
      subtitle: '(Presentation)',
      description: 'Structured presentation format optimized for investor pitches and funding discussions',
      icon: '📊',
      features: ['Problem/Solution', 'Market Traction', 'Business Model', 'Financial Projections']
    }
  ];

  return (
    <div className="space-y-6">

      {/* Base Structure Selection - MOVING FROM PRODUCT SELECTION */}
      <div className="bg-slate-800/50 rounded-xl border border-white/10 p-5">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <span>🏗️</span>
          Choose Base Structure
        </h3>
        <p className="text-white/70 text-sm mb-4">
          Select the foundation document type for your plan
        </p>
        
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

      {/* Next Steps */}
      {selectedStructure && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-300 text-lg mt-0.5">ℹ️</span>
            <div>
              <h4 className="text-white font-medium mb-2">Next Steps</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">→</span>
                  <span>Your {selectedStructure.replace('-', ' ')} structure is ready</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">→</span>
                  <span>You can customize sections in the next step</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">→</span>
                  <span>Add program requirements anytime using the overlay toggle</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
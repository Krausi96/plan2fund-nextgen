import React, { useState, useEffect } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { StandardStructurePanel } from './components/panels/StandardStructurePanel';
import { ProgramSummaryPanel } from './components/panels/ProgramSummaryPanel';
import { ProgramFinder, EditorProgramFinder } from './components/finder';
import { DocumentUploadPanel } from './components/options/DocumentUploadOption';
import { FreeOption } from './components/options/FreeOption';
import { normalizeFundingProgram, generateProgramBlueprint, generateDocumentStructureFromProfile } from '@/features/editor/lib';
import { enhanceWithSpecialSections } from '@/features/editor/lib/utils/1-document-flows/document-flows/sections/enhancement/sectionEnhancement';
import { TemplateStructurePanel } from './components/panels/TemplateStructurePanel';


interface OptionSelectorProps {
  selectedOption: 'program' | 'template' | 'free' | null;
  onSelect: (option: 'program' | 'template' | 'free') => void;
}

function OptionSelector({ selectedOption, onSelect }: OptionSelectorProps) {
  const { t } = useI18n();

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 mb-4 border border-white/10">        
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option A: Select Program */}
        <div 
          className={`group relative flex flex-col items-start p-4 bg-slate-800/50 rounded-lg transition-all duration-300 ease-out cursor-pointer ${
            selectedOption === 'program' 
              ? 'border-blue-500 bg-blue-500/30 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-800/50' 
              : 'border border-white/20 opacity-60 hover:opacity-100 backdrop-blur-md'
          }`}
          onClick={() => onSelect('program')}
        >
          <div className="flex flex-row items-center">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 mr-4 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-200 text-lg">
              📄
            </div>
            <h3 className="text-white font-black text-xl text-left">
              {t('editor.desktop.program.optionA.title' as any) || 'Select Program'}
            </h3>
          </div>
          <p className="text-slate-300/70 text-xs text-left leading-relaxed mt-2 max-w-full line-clamp-3">
            {t('editor.desktop.program.optionA.description' as any) || 'Choose a funding, bank or investor program. The program determines which documents and structure are needed. 📋 Sets up document requirements.'}
          </p>
        </div>
        
        {/* Option B: Use Own Template */}
        <div 
          className={`group relative flex flex-col items-start p-4 bg-slate-800/50 rounded-lg transition-all duration-300 ease-out cursor-pointer ${
            selectedOption === 'template' 
              ? 'border-purple-500 bg-purple-500/30 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-800/50' 
              : 'border border-white/20 opacity-60 hover:opacity-100 backdrop-blur-md'
          }`}
          onClick={() => onSelect('template')}
        >
          <div className="flex flex-row items-center">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 mr-4 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-200 text-lg">
              🧩
            </div>
            <h3 className="text-white font-black text-xl text-left">
              {t('editor.desktop.program.optionB.title' as any) || 'Use Own Template'}
            </h3>
          </div>
          <p className="text-slate-300/70 text-xs text-left leading-relaxed mt-2 max-w-full line-clamp-3">
            {t('editor.desktop.program.optionB.description' as any) || 'Upload your own template (e.g. DOCX/PDF). The structure of the template will be adopted.'}
          </p>
        </div>
        
        {/* Option C: Start Free (Custom) */}
        <div 
          className={`group relative flex flex-col items-start p-4 bg-slate-800/50 rounded-lg transition-all duration-300 ease-out cursor-pointer ${
            selectedOption === 'free' 
              ? 'border-green-500 bg-green-500/30 ring-2 ring-green-500/50 ring-offset-2 ring-offset-slate-800/50' 
              : 'border border-white/20 opacity-60 hover:opacity-100 backdrop-blur-md'
          }`}
          onClick={() => onSelect('free')}
        >
          <div className="flex flex-row items-center">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 mr-4 rounded-md bg-green-500/20 border border-green-400/30 text-green-200 text-lg">
              📋
            </div>
            <h3 className="text-white font-black text-xl text-left">
              {t('editor.desktop.program.optionC.title' as any) || 'Start Free (Custom)'}
            </h3>
          </div>
          <p className="text-slate-300/70 text-xs text-left leading-relaxed mt-2 max-w-full line-clamp-3">
            {t('editor.desktop.program.optionC.description' as any) || 'Start with a neutral standard structure. Build freely without predefined requirements.'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ProgramSelectionProps {
  onConnectProgram?: (value: any) => void;
  onNavigateToBlueprint?: () => void;
}

export default function ProgramSelection({
  onConnectProgram,
  onNavigateToBlueprint
}: ProgramSelectionProps) {
  // Access state from unified useProject store
  const selectProgram = useProject((state) => state.selectProgram);
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setSetupDiagnostics = useProject((state) => state.setSetupDiagnostics);
  const setInferredProductType = useProject((state) => state.setInferredProductType);

  const { t } = useI18n();
  const [selectedOption, setSelectedOption] = useState<'program' | 'template' | 'free' | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'wizard'>('search');
  const [programSummary, setProgramSummary] = useState<any>(null);

  const handleConnectProgram = onConnectProgram ?? setProgramSummary;



  // Handle program initialization from Reco/myProject flow
  useEffect(() => {
    // Check for program selected in Reco/myProject flow
    const savedProgram = localStorage.getItem('selectedProgram');
    if (savedProgram && !programSummary) {
      try {
        const programData = JSON.parse(savedProgram);
        console.log('🔄 Initializing from saved program:', programData);
        
        // Create temporary program summary for initialization
        const tempSummary = {
          id: programData.id,
          name: programData.name,
          type: programData.type || 'grant',
          organization: programData.organization || 'Unknown',
          setupStatus: 'draft' as const,
          // Include application requirements if available
          application_requirements: programData.application_requirements
        };
        
        handleConnectProgram(tempSummary);
        localStorage.removeItem('selectedProgram'); // Clean up
      } catch (error) {
        console.error('❌ Failed to initialize from saved program:', error);
      }
    }
  }, [programSummary, handleConnectProgram]);

  const handleCloseProgramFinder = () => {
    setActiveTab('search');
  };

  const handleProgramSelect = (program: any) => {
    // Automatically select the program option when a program is chosen
    setSelectedOption('program');
    
    try {
      // Generate document structure using new pipeline
      // Step 1: Normalize program data to FundingProgram
      const fundingProgram = normalizeFundingProgram(program);
      
      // Step 2: Generate DocumentStructure from parsed application requirements
      const documentStructure = generateDocumentStructureFromProfile(fundingProgram);
      
      // Step 3: Enhance document structure with special sections (Title Page, TOC, References, etc.)
      const enhancedDocumentStructure = enhanceWithSpecialSections(documentStructure, t);
      
      // Update wizard state with document setup data
      selectProgram(fundingProgram);
      setDocumentStructure(enhancedDocumentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: program.confidenceScore < 80 ? ['Limited program information available'] : [],
        missingFields: [],
        confidence: program.confidenceScore || 90
      });
      
      // Step 4: Create legacy-compatible ProgramSummary for backward compatibility
      const programSummary = generateProgramBlueprint(program);
      handleConnectProgram(programSummary);
      
    } catch (error) {
      console.error('❌ Failed to process program:', error);
      alert('Failed to process the selected program. Please try again or contact support.');
      // Still provide basic connection as fallback
      const fallbackSummary = {
        id: program.id,
        name: program.name,
        type: program.type || 'grant',
        organization: program.organization,
        setupStatus: 'none' as const
      };
      handleConnectProgram(fallbackSummary);
    }
    
    handleCloseProgramFinder();
  };

  return (
    <div className="relative mb-6 pb-6">

      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-white">
            {t('editor.desktop.program.header' as any) || 'Document Setup'}
          </h2>
        </div>
        <div className="border-b border-white/20 mb-2"></div>
        <p className="text-white/70 text-sm">
          {t('editor.desktop.program.subtitle' as any) || 'Choose how your document structure and requirements are defined.'}
        </p>
      </div>
      
      {/* Option Selector */}
      <OptionSelector 
        selectedOption={selectedOption} 
        onSelect={(option) => {
          // If switching to different option, clear all state first
          if (selectedOption && selectedOption !== option) {
            // Clear all related state
            selectProgram(null);
            setDocumentStructure(null);
            setSetupStatus('none');
            setSetupDiagnostics(null);
            setInferredProductType(null);
          }
          
          // Set new selection
          setSelectedOption(option);
        }} 
      />
      
      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Main Content Column (70%) */}
        <div className="lg:w-7/12">
          {/* Selected Option Content */}
          {selectedOption === 'free' ? (
            // Free option without the outer container
            <FreeOption 
              onStructureSelected={(structure) => {
                console.log('Free structure selected:', structure);
              }}
              onProductSelected={(product) => {
                console.log('Product selected in free option:', product);
              }}
              onNavigateToBlueprint={onNavigateToBlueprint}
            />
          ) : selectedOption && (
            // Apply the container for 'program' and 'template' options
            <div className="bg-slate-800/30 rounded-xl border border-white/10 p-6">
              
              {/* Horizontal Program Tabs (for Program option) */}
              {selectedOption === 'program' && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 font-medium rounded-lg transition-colors text-sm ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🔍</span>
                      {t('editor.desktop.program.searchPrograms' as any) || 'Search Programs'}
                    </button>

                    <button
                      onClick={() => setActiveTab('wizard')}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 font-medium rounded-lg transition-colors text-sm ${activeTab === 'wizard' ? 'bg-purple-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🧠</span>
                      {t('editor.desktop.program.recoWizard' as any) || 'Reco Wizard'}
                    </button>
                  </div>
                  
                  {/* Dynamic Content Below Tabs - SAME CONTAINER */}
                  <div className="mt-4 border-t border-white/10 pt-2">
                    {activeTab === 'search' && (
                      <div>
                        <h4 className="text-white text-lg font-bold mb-4">
                          {t('editor.desktop.program.finder.title' as any) || 'Find Funding Programs'}
                        </h4>
                        <ProgramFinder 
                          onProgramSelect={handleProgramSelect}
                          onClose={handleCloseProgramFinder}
                        />
                      </div>
                    )}
                    

                    
                    {activeTab === 'wizard' && (
                      <div>
                        <h4 className="text-white font-medium mb-4">
                          {t('editor.desktop.program.recoWizard' as any) || 'Recommendation Wizard'}
                        </h4>
                        <div className="w-full">
                          <EditorProgramFinder 
                            onProgramSelect={() => {
                              // The mock example handles its own store updates
                              // Just close the wizard view
                              setActiveTab('search');
                            }}
                            onClose={() => {
                              setActiveTab('search');
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Template Content */}
              {selectedOption === 'template' && (
                <DocumentUploadPanel 
                  onNavigateToBlueprint={onNavigateToBlueprint}
                />
              )}
            </div>
          )}      
        </div>
        
        {/* Dynamic Panel Column (30%) */}
        <div className="lg:w-5/12">
          {selectedOption === 'program' && (
            <ProgramSummaryPanel 
              onClear={() => {
                // Clear ALL program-related data
                selectProgram(null);
                
                // Also clear any document structure that might be related
                setDocumentStructure(null);
                setSetupStatus('none');
                setSetupDiagnostics(null);
                
                // CRITICAL: Clear localStorage persistence to prevent auto-reinitialization
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('selectedProgram');
                }
              }}
              showHeader={true}
            />
          )}
          {selectedOption === 'template' && (
            <TemplateStructurePanel 
              selectedOption={selectedOption}
              onClearTemplate={() => {
                // Clear the document structure
                setDocumentStructure(null);
                setSetupStatus('none');
                setSetupDiagnostics(null);
              }}
              showHeader={true}
            />
          )}
          {selectedOption === 'free' && (
            <StandardStructurePanel 
              selectedOption={selectedOption}
              onClearStructure={() => {
                // Clear the document structure
                setDocumentStructure(null);
                setSetupStatus('none');
                setSetupDiagnostics(null);
                setInferredProductType(null);
              }}
              showHeader={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
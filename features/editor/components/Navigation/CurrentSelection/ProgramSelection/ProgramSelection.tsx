import React, { useState, useEffect } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useConfiguratorState, useEditorStore } from '@/features/editor/lib';
import { TemplateStructurePanel } from './components/panels/TemplateStructurePanel';
import { StandardStructurePanel } from './components/panels/StandardStructurePanel';
import { ProgramSummaryPanel } from './components/panels/ProgramSummaryPanel';
import { ProgramFinder } from './components/finder/ProgramFinder';
import EditorProgramFinder from '@/features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/finder/ProgramFinder/EditorProgramFinder';
import { TemplateOption } from './components/options/TemplateOption';
import { FreeOption } from './components/options/FreeOption';
import { normalizeFundingProgram, generateProgramBlueprint, migrateLegacySetup, generateDocumentStructureFromProfile, parseProgramFromUrl } from '@/features/editor/lib';

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
          className={`group relative flex flex-col items-center p-3 bg-slate-800/50 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
            selectedOption === 'program' 
              ? 'border-blue-400 bg-slate-700/70' 
              : 'border-slate-600 hover:border-blue-400 hover:bg-slate-700/60'
          }`}
          onClick={() => onSelect('program')}
        >
          <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-blue-500/30 border-2 border-blue-400 text-blue-300 text-xl group-hover:scale-110 transition-transform duration-200">
            📄
          </div>
          <h3 className="text-white font-bold text-base mb-2 text-center group-hover:text-blue-200 transition-colors duration-200">
            {t('editor.desktop.program.optionA.title' as any) || 'Select Program'}
          </h3>
          <p className="text-slate-300 text-xs text-center leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
            {t('editor.desktop.program.optionA.description' as any) || 'Choose a funding, bank or investor program. The program determines which documents and structure are needed. 📋 Sets up document requirements.'}
          </p>
        </div>
        
        {/* Option B: Use Own Template */}
        <div 
          className={`group relative flex flex-col items-center p-3 bg-slate-800/50 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
            selectedOption === 'template' 
              ? 'border-purple-400 bg-slate-700/70' 
              : 'border-slate-600 hover:border-purple-400 hover:bg-slate-700/60'
          }`}
          onClick={() => onSelect('template')}
        >
          <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-purple-500/30 border-2 border-purple-400 text-purple-300 text-xl group-hover:scale-110 transition-transform duration-200">
            🧩
          </div>
          <h3 className="text-white font-bold text-base mb-2 text-center group-hover:text-purple-200 transition-colors duration-200">
            {t('editor.desktop.program.optionB.title' as any) || 'Use Own Template'}
          </h3>
          <p className="text-slate-300 text-xs text-center leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
            {t('editor.desktop.program.optionB.description' as any) || 'Upload your own template (e.g. DOCX/PDF). The structure of the template will be adopted.'}
          </p>
        </div>
        
        {/* Option C: Start Free (Custom) */}
        <div 
          className={`group relative flex flex-col items-center p-3 bg-slate-800/50 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
            selectedOption === 'free' 
              ? 'border-green-400 bg-slate-700/70' 
              : 'border-slate-600 hover:border-green-400 hover:bg-slate-700/60'
          }`}
          onClick={() => onSelect('free')}
        >
          <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 mb-3 rounded-lg bg-green-500/30 border-2 border-green-400 text-green-300 text-xl group-hover:scale-110 transition-transform duration-200">
            📋
          </div>
          <h3 className="text-white font-bold text-base mb-2 text-center group-hover:text-green-200 transition-colors duration-200">
            {t('editor.desktop.program.optionC.title' as any) || 'Start Free (Custom)'}
          </h3>
          <p className="text-slate-300 text-xs text-center leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
            {t('editor.desktop.program.optionC.description' as any) || 'Start with a neutral standard structure. You can add programs or templates later.'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ProgramSelectionProps {
  onConnectProgram?: (value: any) => void;
}

export default function ProgramSelection({
  onConnectProgram
}: ProgramSelectionProps) {
  const configuratorState = useConfiguratorState();
  const handleConnectProgram = onConnectProgram ?? configuratorState.actions.setProgramSummary;
  const programSummary = configuratorState.programSummary;
  
  // Access editor store for document setup management
  const setProgramProfile = useEditorStore((state) => state.setProgramProfile);
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  
  const { t } = useI18n();
  const [selectedOption, setSelectedOption] = useState<'program' | 'template' | 'free' | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'paste' | 'wizard'>('search');

  // Handle legacy program migration and automatic initialization
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
    
    // Handle legacy program migration
    if (programSummary && !programSummary.documentStructure) {
      console.log('🔄 Migrating legacy program to document setup system...');
      try {
        const migrationResult = migrateLegacySetup(programSummary);
        
        if (migrationResult.fundingProgram) {
          setProgramProfile(migrationResult.fundingProgram);
        }
        
        if (migrationResult.structure) {
          setDocumentStructure(migrationResult.structure);
          setSetupStatus(migrationResult.status);
          setSetupDiagnostics(migrationResult.diagnostics);
        }
        
        console.log('✅ Legacy program migration completed:', {
          programId: programSummary.id,
          confidence: migrationResult.diagnostics.confidence,
          warnings: migrationResult.diagnostics.warnings.length
        });
        
      } catch (error) {
        console.error('❌ Failed to migrate legacy program:', error);
      }
    }
  }, [programSummary, setProgramProfile, setDocumentStructure, setSetupStatus, setSetupDiagnostics, handleConnectProgram]);

  const handleCloseProgramFinder = () => {
    setActiveTab('search');
  };

  const handleUrlParse = async () => {
    const urlInput = document.querySelector('input[type="url"]') as HTMLInputElement;
    const url = urlInput?.value.trim();
    
    if (!url) {
      alert('Please enter a valid URL');
      return;
    }
    
    try {
      console.log('🌐 Parsing URL:', url);
      
      // Parse program information using external utility
      const parsedProgram = await parseProgramFromUrl(url);
      
      if (parsedProgram) {
        console.log('✅ URL parsing successful:', parsedProgram);
        handleProgramSelect(parsedProgram);
      } else {
        alert('Could not extract program information from this URL. Please try a different funding program URL.');
      }
      
    } catch (error) {
      console.error('❌ URL parsing failed:', error);
      alert('Failed to parse URL. Please check the URL format and try again.');
    }
  };

  const handleProgramSelect = (program: any) => {
    console.log('🎯 Program selected:', program);
    console.log('📋 Has application requirements:', !!program.application_requirements);
    console.log('📊 Current selectedOption:', selectedOption);
    try {
      // Generate document structure using new pipeline
      // Step 1: Normalize program data to FundingProgram
      const fundingProgram = normalizeFundingProgram(program);
      
      // Step 2: Generate DocumentStructure from parsed application requirements
      const documentStructure = generateDocumentStructureFromProfile(fundingProgram);
      
      // Step 3: Update wizard state with document setup data
      setProgramProfile(fundingProgram);
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: program.confidenceScore < 80 ? ['Limited program information available'] : [],
        missingFields: [],
        confidence: program.confidenceScore || 90
      });
      
      // Step 4: Create legacy-compatible ProgramSummary for backward compatibility
      const programSummary = generateProgramBlueprint(program);
      handleConnectProgram(programSummary);
      
      console.log('✅ Program selected and document structure generated:', {
        programId: program.id,
        programName: program.name,
        structureId: documentStructure.structureId,
        confidence: program.confidenceScore || 90
      });
      
    } catch (error) {
      console.error('❌ Failed to generate document structure from program:', error);
      // Fallback to basic program connection
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
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-white">
            {t('editor.desktop.program.header' as any) || 'Document Setup'}
          </h2>
        </div>
        <p className="text-white/70 text-sm">
          {t('editor.desktop.program.subtitle' as any) || 'Choose how your document structure and requirements are defined.'}
        </p>
      </div>
      
      {/* Option Selector */}
      <OptionSelector 
        selectedOption={selectedOption} 
        onSelect={setSelectedOption} 
      />
      
      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Main Content Column (70%) */}
        <div className="lg:w-7/12">
          {/* Selected Option Content */}
          {selectedOption && (
            <div className="bg-slate-800/30 rounded-xl border border-white/10 p-6">
              <h3 className="text-white font-bold text-lg mb-4">
                {selectedOption === 'program' && (t('editor.desktop.program.selectProgramTitle' as any) || 'Select Program')}
                {selectedOption === 'template' && (
                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">
                      {t('editor.desktop.program.useOwnTemplateTitle' as any) || 'Use Own Template'}
                    </h4>
                    <TemplateOption 
                      onDocumentAnalyzed={(analysis) => {
                        console.log('Template analysis complete:', analysis);
                      }}
                    />
                  </div>
                )}
                {selectedOption === 'free' && (
                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">
                      {t('editor.desktop.program.startFreeTitle' as any) || 'Start Free (Custom)'}
                    </h4>
                    <FreeOption 
                      onStructureSelected={(structure) => {
                        console.log('Free structure selected:', structure);
                      }}
                      onProductSelected={(product) => {
                        console.log('Product selected in free option:', product);
                      }}
                    />
                  </div>
                )}
              </h3>
              
              {/* Horizontal Program Tabs (for Program option) */}
              {selectedOption === 'program' && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors text-sm ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🔍</span>
                      {t('editor.desktop.program.searchPrograms' as any) || 'Search Programs'}
                    </button>
                    <button
                      onClick={() => setActiveTab('paste')}
                      className={`inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors text-sm ${activeTab === 'paste' ? 'bg-blue-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🔗</span>
                      {t('editor.desktop.program.pasteUrl' as any) || 'Paste URL'}
                    </button>
                    <button
                      onClick={() => setActiveTab('wizard')}
                      className={`inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors text-sm ${activeTab === 'wizard' ? 'bg-purple-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🧠</span>
                      {t('editor.desktop.program.recoWizard' as any) || 'Reco Wizard'}
                    </button>
                  </div>
                  
                  {/* Dynamic Content Below Tabs - SAME CONTAINER */}
                  <div className="mt-6 border-t border-white/10 pt-6">
                    {activeTab === 'search' && (
                      <div>
                        <h4 className="text-white font-medium mb-4">
                          {t('editor.desktop.program.finder.title' as any) || 'Find Funding Programs'}
                        </h4>
                        <ProgramFinder 
                          onProgramSelect={handleProgramSelect}
                          onClose={handleCloseProgramFinder}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'paste' && (
                      <div>
                        <h4 className="text-white font-medium mb-4">
                          {t('editor.desktop.program.pasteUrl' as any) || 'Paste Program URL'}
                        </h4>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                          <p className="text-white/70 text-sm mb-3">
                            {t('editor.desktop.program.pasteUrlDescription' as any) || 'Enter the official program URL to automatically load requirements'}
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://www.aws.at/funding/..."
                              className="flex-1 rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                            />
                            <button 
                              onClick={handleUrlParse}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                            >
                              {t('editor.desktop.program.loadProgram' as any) || 'Load Program'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'wizard' && (
                      <div>
                        <h4 className="text-white font-medium mb-4">
                          {t('editor.desktop.program.recoWizard' as any) || 'Recommendation Wizard'}
                        </h4>
                        <div className="w-full">
                          <EditorProgramFinder 
                            onProgramSelect={(programId: string, route: string) => {
                              // For mock example, we need to handle the program data properly
                              console.log('Program selected in editor:', { programId, route });
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
              

            </div>
          )}
          
          
        </div>
        
        {/* Dynamic Panel Column (30%) */}
        <div className="lg:w-5/12">
          {selectedOption === 'program' && programSummary && (
            <ProgramSummaryPanel 
              onGenerate={() => console.log('Refresh program summary')}
              onEdit={() => console.log('Edit program summary')}
              onClear={() => console.log('Clear program summary')}
            />
          )}
          {selectedOption === 'template' && (
            <TemplateStructurePanel 
              selectedOption={selectedOption}
              onGenerate={() => console.log('Reanalyze template')} 
              onEdit={() => console.log('Edit template structure')} 
              onClear={() => console.log('Clear template analysis')} 
            />
          )}
          {selectedOption === 'free' && (
            <StandardStructurePanel 
              selectedOption={selectedOption}
              onGenerate={() => console.log('Regenerate standard structure')} 
              onEdit={() => console.log('Edit standard structure')} 
              onClear={() => console.log('Clear standard structure')} 
            />
          )}
        </div>
      </div>
      

    </div>
  );
}
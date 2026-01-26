import React, { useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useConfiguratorState } from '@/features/editor/lib';
import { ProgramOption } from './ProgramOption';
import { TemplateOption } from './TemplateOption';
import { FreeOption } from './FreeOption';
import { BlueprintPanel } from './BlueprintPanel';
import { ProgramFinder } from './ProgramFinder';

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
            {(() => {
              const key = 'editor.desktop.preview.emptyState.optionA';
              const translated = t(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? 'Select Program' : translated;
            })()}
          </h3>
          <p className="text-slate-300 text-xs text-center leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
            {(() => {
              const key = 'editor.desktop.preview.emptyState.optionADescription';
              const translated = t(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? 'Choose a funding, bank or investor program. The program determines which documents and structure are needed. 📋 Generates document blueprint.' : translated;
            })()}
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
            {(() => {
              const key = 'editor.desktop.preview.emptyState.optionB';
              const translated = t(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? 'Use Own Template' : translated;
            })()}
          </h3>
          <p className="text-slate-300 text-xs text-center leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
            {(() => {
              const key = 'editor.desktop.preview.emptyState.optionBDescription';
              const translated = t(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? 'Upload your own template (e.g. DOCX/PDF). The structure of the template will be adopted.' : translated;
            })()}
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
            {(() => {
              const key = 'editor.desktop.preview.emptyState.optionC';
              const translated = t(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? 'Start Free (Custom)' : translated;
            })()}
          </h3>
          <p className="text-slate-300 text-xs text-center leading-relaxed group-hover:text-slate-200 transition-colors duration-200">
            {(() => {
              const key = 'editor.desktop.preview.emptyState.optionCDescription';
              const translated = t(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? 'Start with a neutral standard structure. You can add programs or templates later.' : translated;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ProgramSelectionProps {
  connectCopy?: any;
  onConnectProgram?: (value: any) => void;
  onOpenProgramFinder?: () => void;
}

export default function ProgramSelection({
  connectCopy,
  onConnectProgram,
  onOpenProgramFinder
}: ProgramSelectionProps) {
  const configuratorState = useConfiguratorState();
  const handleConnectProgram = onConnectProgram ?? configuratorState.actions.setProgramSummary;
  const programSummary = configuratorState.programSummary;
  const programError = configuratorState.programError;
  const programLoading = configuratorState.programLoading;
  
  const { t } = useI18n();
  const [selectedOption, setSelectedOption] = useState<'program' | 'template' | 'free' | null>(null);
  const [showProgramFinder, setShowProgramFinder] = useState(false);

  const handleOpenProgramFinder = () => {
    setShowProgramFinder(true);
  };

  const handleCloseProgramFinder = () => {
    setShowProgramFinder(false);
  };

  const handleProgramSelect = (program: any) => {
    // Create blueprint from selected program
    const blueprint = {
      source: 'program',
      programId: program.id,
      programName: program.name,
      requiredDocuments: program.deliverables || ['business-plan'],
      requiredSections: program.requirements || [
        'executive-summary',
        'company-description',
        'market-analysis',
        'financial-plan'
      ],
      complianceStrictness: 'medium',
      programFocus: program.focusAreas || [],
      status: 'draft'
    };
    
    // Store in setup wizard state
    // TODO: Implement proper state update
    console.log('Selected program:', program);
    console.log('Generated blueprint:', blueprint);
    
    handleCloseProgramFinder();
  };

  // Render selected option content
  const renderOptionContent = () => {
    switch (selectedOption) {
      case 'program':
        return (
          <ProgramOption
            connectCopy={connectCopy}
            programLoading={programLoading}
            programError={programError}
            onConnectProgram={handleConnectProgram}
            onOpenProgramFinder={handleOpenProgramFinder}
          />
        );
      case 'template':
        return <TemplateOption />;
      case 'free':
        return <FreeOption />;
      default:
        return null;
    }
  };

  return (
    <div className="relative mb-6 pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-white">
            {t('editor.desktop.program.header' as any) || 'Document Setup'}
          </h2>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
            📋 Blueprint Enhanced
          </span>
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
                {selectedOption === 'program' && 'Select Program'}
                {selectedOption === 'template' && 'Use Own Template'}
                {selectedOption === 'free' && 'Start Free (Custom)'}
              </h3>
              
              {/* Horizontal Program Input (for Program option) */}
              {selectedOption === 'program' && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <button
                      onClick={onOpenProgramFinder}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      <span>🔍</span>
                      {t('editor.desktop.program.searchPrograms' as any) || 'Search Programs'}
                    </button>
                    <button
                      onClick={() => {}} // Will implement paste URL functionality
                      className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 hover:border-white/50 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-sm"
                    >
                      <span>🔗</span>
                      {t('editor.desktop.program.pasteUrl' as any) || 'Paste URL'}
                    </button>
                    <button
                      onClick={() => {}} // Will implement reco wizard
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      <span>🧠</span>
                      {t('editor.desktop.program.recoWizard' as any) || 'Reco Wizard'}
                    </button>
                  </div>
                  <p className="text-white/70 text-sm">
                    {t('editor.desktop.program.horizontalInputHint' as any) || 'Choose how to specify your funding program'}
                  </p>
                </div>
              )}
              
              {renderOptionContent()}
            </div>
          )}
          
          {/* Program Summary Display */}
          {programSummary && (
            <div className="space-y-4 mt-6">
              {/* Connected Program Display */}
              <div className="w-full rounded-lg border border-blue-300 bg-blue-100/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-blue-900 leading-tight">{programSummary.name}</p>
                    {programSummary.amountRange && (
                      <p className="text-xs text-blue-800 mt-1">{programSummary.amountRange}</p>
                    )}
                    {/* Blueprint Information */}
                    {programSummary.source && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">📋</span>
                          </div>
                          <h4 className="text-blue-800 font-bold text-sm">Document Blueprint</h4>
                          <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium capitalize">
                            {programSummary.source}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-2 rounded border border-blue-100">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">📄</span>
                              <div>
                                <div className="text-xs text-blue-600 font-medium">Required Documents</div>
                                <div className="text-sm font-bold text-blue-800">{programSummary.requiredDocuments?.length || 0}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-2 rounded border border-blue-100">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">📑</span>
                              <div>
                                <div className="text-xs text-blue-600 font-medium">Required Sections</div>
                                <div className="text-sm font-bold text-blue-800">{programSummary.requiredSections?.length || 0}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-2 rounded border border-blue-100">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">⚖️</span>
                              <div>
                                <div className="text-xs text-blue-600 font-medium">Compliance Level</div>
                                <div className="text-sm font-bold text-blue-800 capitalize">{programSummary.complianceStrictness || 'medium'}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-2 rounded border border-blue-100">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">⚙️</span>
                              <div>
                                <div className="text-xs text-blue-600 font-medium">Validation Rules</div>
                                <div className="text-sm font-bold text-blue-800">{programSummary.validationRules?.length || 0}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Program Focus Areas */}
                        {programSummary.programFocus && programSummary.programFocus.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-blue-100">
                            <div className="text-xs text-blue-600 font-medium mb-1">Focus Areas:</div>
                            <div className="flex flex-wrap gap-1">
                              {programSummary.programFocus.map((focus: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  {focus}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    className="text-blue-800 hover:text-blue-900 text-lg h-6 px-1 flex-shrink-0"
                    onClick={() => handleConnectProgram(null)}
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Confirmation Banner */}
              <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-300 text-sm flex-shrink-0">✓</span>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {t('editor.desktop.config.step2.complete' as any) || 'Program connected successfully'}
                  </p>
                </div>
              </div>
              
              {/* Next Step Message */}
              <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-blue-300 text-xs flex-shrink-0">→</span>
                  <p className="text-[10px] text-white/90 leading-relaxed">
                    {t('editor.desktop.config.step3.hint' as any) || 'Proceed to Step 3 to manage sections and documents for your plan.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Blueprint Panel Column (30%) */}
        <div className="lg:w-5/12">
          <BlueprintPanel 
            onGenerate={() => console.log('Generate blueprint')} 
            onEdit={() => console.log('Edit blueprint')} 
            onClear={() => console.log('Clear blueprint')} 
          />
        </div>
      </div>
      
      {/* Program Finder Modal */}
      {showProgramFinder && (
        <ProgramFinder 
          onProgramSelect={handleProgramSelect}
          onClose={handleCloseProgramFinder}
        />
      )}
    </div>
  );
}
/**
 * EditorProgramFinder - Direct copy of question card from Reco
 * Preserves exact layout and prefill logic
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Wand2 } from 'lucide-react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { EnhancedProgramResult } from '@/features/reco/types';
import QuestionRenderer from '@/features/reco/components/QuestionRenderer';
import { useEditorStore } from '@/features/editor/lib/store/editorStore';
import { 
  useQuestionFiltering, 
  useQuestionTranslation, 
  useAnswerHandling, 
  useProgramGeneration, 
  useResultsFiltering 
} from '@/features/reco/hooks/useQuestionLogic';

interface EditorProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
  onClose?: () => void;
}

export default function EditorProgramFinder({ 
  onProgramSelect,
  onClose
}: EditorProgramFinderProps) {
  const router = useRouter();
  const { t } = useI18n();
  
  // Get project profile from editor store for prefilling
  const projectProfile = useEditorStore(state => state.setupWizard.projectProfile);
  
  // Use shared hooks for business logic (hide first question in editor)
  const { getFilteredQuestions } = useQuestionFiltering(true);
  const { translatedQuestions } = useQuestionTranslation();
  const { handleAnswer } = useAnswerHandling();
  const { generatePrograms } = useProgramGeneration();
  
  // Component state
  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const setEmptyResults = () => setResults([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  
  // Use shared results filtering
  const { visibleResults } = useResultsFiltering(results);
  const hasVisibleResults = visibleResults.length > 0;
  
  const filteredQuestions = useMemo(() => 
    getFilteredQuestions(translatedQuestions, answers), 
    [translatedQuestions, answers, getFilteredQuestions]
  );
  
  const visibleQuestions = useMemo(() => filteredQuestions, [filteredQuestions]);
  
  // Navigation logic
  const nextStep = () => {
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const answeredCount = Object.keys(answers).filter(key => 
    answers[key] !== undefined && answers[key] !== ''
  ).length;

  const hasEnoughAnswers = answeredCount >= 5;
  
  // Prefill answers from MyProject data - exact copy with enhanced logic
  useEffect(() => {
    if (projectProfile && Object.keys(answers).length === 0) {
      const prefilledAnswers: Record<string, any> = {};
      
      if (projectProfile.stage) {
        prefilledAnswers.company_stage = projectProfile.stage;
      }
      
      if (projectProfile.country) {
        const countryMap: Record<string, string> = {
          'Austria': 'austria',
          'Germany': 'germany',
          'France': 'eu',
          'Italy': 'eu',
          'Spain': 'eu',
          'Netherlands': 'eu',
          'Belgium': 'eu',
          'Switzerland': 'international',
          'United Kingdom': 'international',
          'USA': 'international',
          'Canada': 'international'
        };
        prefilledAnswers.location = countryMap[projectProfile.country] || 'international';
      }
      
      if (projectProfile.industryTags && projectProfile.industryTags.length > 0) {
        prefilledAnswers.industry_focus = projectProfile.industryTags;
      }
      
      if (projectProfile.financialBaseline?.fundingNeeded) {
        prefilledAnswers.funding_amount = projectProfile.financialBaseline.fundingNeeded;
      }
      
      const savedRegion = localStorage.getItem('myProject_region');
      if (savedRegion) {
        prefilledAnswers.location_region = savedRegion;
      }
      
      // Enhanced prefill logic based on project stage
      if (projectProfile.stage === 'idea') {
        prefilledAnswers.organisation_type = 'startup';
        prefilledAnswers.revenue_status = 0; // Pre-revenue for idea stage
      } else if (projectProfile.stage === 'MVP') {
        prefilledAnswers.organisation_type = 'startup';
      } else if (projectProfile.stage === 'revenue') {
        prefilledAnswers.organisation_type = 'established_sme';
      } else if (projectProfile.stage === 'growth') {
        prefilledAnswers.organisation_type = 'established_sme';
      }
      
      setAnswers(prefilledAnswers);
    }
  }, [projectProfile]);
  
  // Wrap handleAnswer to match QuestionRenderer's expected signature
  const handleAnswerWrapper = useCallback((questionId: string, value: any) => {
    handleAnswer(questionId, value, answers, setAnswers);
  }, [handleAnswer, answers]);
  
  // Wrap generatePrograms to match button's expected signature
  const generateProgramsWrapper = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    generatePrograms(answers, setResults, setEmptyResults, setIsLoading, setHasAttemptedGeneration, t as any);
  }, [generatePrograms, answers, setResults, setEmptyResults, setIsLoading, setHasAttemptedGeneration, t]);
  
  // Reused program persistence logic from Reco
  const persistSelectedProgram = useCallback((program: EnhancedProgramResult) => {
    if (typeof window === 'undefined') return;
    const programId = program.id || `program_${Date.now()}`;
    try {
      localStorage.setItem('selectedProgram', JSON.stringify({
        id: programId,
        name: program.name,
        categorized_requirements: program.categorized_requirements || {},
        type: program.type || (program.funding_types?.[0]) || 'grant',
        url: (program as any).url || (program as any).source_url || null,
        description: program.description || (program as any).metadata?.description || '',
      }));
    } catch (error) {
      console.warn('Could not save program to localStorage:', error);
    }
  }, []);

  return (
    <div className="w-full relative">
      <style>{`
        /* Dark theme for question renderer */
        .question-container .bg-white { background-color: transparent !important; }
        .question-container .border-2.border-blue-200 { border-width: 0 !important; box-shadow: none !important; }
        .question-container .p-6 { padding: 0 !important; }
        .question-container .text-gray-900 { color: white !important; }
        .question-container .text-xl.font-semibold { color: white !important; }
        .question-container .bg-white.border-gray-300 { 
          background-color: rgb(51 65 85 / 0.5) !important; 
          border-color: rgb(71 85 105) !important; 
          color: rgb(241 245 249) !important; 
        }
        .question-container .bg-blue-600 { 
          background-color: rgb(147 51 234) !important; 
          border-color: rgb(147 51 234) !important; 
        }
        .question-container .text-gray-700 { color: rgb(203 213 225) !important; }
        .question-container .text-gray-800 { color: rgb(226 232 240) !important; }
        .question-container .text-gray-600 { color: rgb(190 204 217) !important; }
        .question-container .text-sm { color: rgb(203 213 225) !important; }
        .question-container button span { color: inherit !important; }
        .question-container div > span:not(.font-bold) { color: rgb(203 213 225) !important; }
        .question-container input.border-gray-300 { 
          background-color: rgb(51 65 85) !important; 
          border-color: rgb(71 85 105) !important; 
          color: white !important; 
        }
        .question-container input.border-gray-300::placeholder { color: rgb(148 163 184) !important; }
        .question-container .bg-gray-50 { background-color: rgb(51 65 85) !important; }
        .question-container .hover\:bg-gray-100:hover { background-color: rgb(71 85 105) !important; }
        .question-container { width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; }
      `}</style>
      <div className="w-full px-2 py-2">
        <div className="flex flex-col gap-2 w-full">
          <div className="p-3 w-full bg-slate-800/70 border border-slate-700 shadow-xl min-h-[650px] flex flex-col relative rounded-xl backdrop-blur-sm">
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                <div className="bg-slate-800 border-2 border-purple-500 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h3 className="text-xl font-bold text-slate-100">Generating Programs...</h3>
                    <p className="text-slate-300 text-sm text-center">This may take a moment.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results overlay */}
            {((hasVisibleResults && !isLoading) || (!isLoading && hasAttemptedGeneration && !hasVisibleResults)) && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl p-4">
                <div className="bg-slate-800 border-2 border-purple-500 rounded-xl w-full max-w-3xl max-h-[400px] overflow-y-auto shadow-2xl">
                  <div className="p-5">
                    <div className="mb-5">
                      <h2 className="text-xl font-bold text-slate-100 mb-2">
                        Found Funding Programs <span className="ml-2 text-base font-semibold text-slate-300">({visibleResults.length})</span>
                      </h2>
                      <p className="text-slate-300">Here are the most suitable funding programs for you.</p>
                    </div>
                    
                    <div className="space-y-4">
                      {visibleResults.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
                            </svg>
                          </div>
                          <p className="text-slate-100 font-semibold mb-2">No matching programs yet</p>
                          <p className="text-slate-400 text-sm mb-5">
                            We couldn't find specific programs for these answers. Adjust answers or connect a program you already know.
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEmptyResults();
                                setHasAttemptedGeneration(false);
                              }}
                              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 transition-colors"
                            >
                              Try again
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push('/editor?product=submission&connect=manual')}
                              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              Add program in editor
                            </button>
                          </div>
                        </div>
                      ) : (
                        visibleResults.map((program, index) => (
                          <div key={program.id || index} className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-purple-400 transition-all">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-slate-100 mb-2">
                                  {program.name || `Program ${index + 1}`}
                                </h3>
                                {program.description && (
                                  <p className="text-sm text-slate-300 leading-relaxed">
                                    {program.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <button
                                  onClick={() => {
                                    if (onProgramSelect) {
                                      onProgramSelect(program.id, program.type || 'grant');
                                    } else {
                                      persistSelectedProgram(program);
                                    }
                                    if (onClose) onClose();
                                  }}
                                  className="w-full md:w-auto px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                                >
                                  Select
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6 h-full flex flex-col">
              {/* Progress indicator */}
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <div className="flex-1 max-w-4xl h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${((currentStep + 1) / visibleQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Step {currentStep + 1} of {visibleQuestions.length} — {answeredCount} answered
                  {!answers[visibleQuestions[currentStep].id] && visibleQuestions[currentStep].required && (
                    <span className="ml-2 text-amber-400 font-medium">• Answer required to continue</span>
                  )}
                </p>
              </div>
              
              {/* Single Question Display */}
              <div className="flex-col justify-start overflow-auto flex-1 pb-3 w-full px-2">
                {visibleQuestions[currentStep] && (
                  <div className="question-container w-full">
                    <QuestionRenderer
                      key={visibleQuestions[currentStep].id}
                      question={visibleQuestions[currentStep]}
                      questionIndex={currentStep}
                      value={answers[visibleQuestions[currentStep].id]}
                      answers={answers}
                      onAnswer={handleAnswerWrapper}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700 mt-auto flex-shrink-0">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-sm font-medium text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  {currentStep < visibleQuestions.length - 1 ? (
                    <button
                      onClick={nextStep}
                      disabled={!answers[visibleQuestions[currentStep].id]}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600 transition-colors font-semibold shadow-sm"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={generateProgramsWrapper}
                      disabled={isLoading || !hasEnoughAnswers}
                      className="px-8 py-3 rounded-lg font-semibold text-base transition-all flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:hover:bg-slate-600"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : !hasEnoughAnswers ? (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Answers Missing
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Generate Programs
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
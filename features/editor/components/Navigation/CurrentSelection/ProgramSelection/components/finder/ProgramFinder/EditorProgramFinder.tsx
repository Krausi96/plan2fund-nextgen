/**
 * EditorProgramFinder - Direct copy of question card from Reco
 * Preserves exact layout and prefill logic
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Wand2 } from 'lucide-react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { EnhancedProgramResult } from '@/platform/reco/types';
import QuestionRenderer from '@/platform/reco/components/QuestionRenderer';
import { saveSelectedProgram } from '@/platform/analysis';
import { MIN_ANSWERED_QUESTIONS } from '@/platform/reco/lib/config';
import styles from './EditorProgramFinder.module.css';
import { useProject } from '@/platform/core/context/hooks/useProject';
import {
  useQuestionFiltering, 
  useQuestionTranslation, 
  useAnswerHandling, 
  useProgramGeneration, 
  useResultsFiltering 
} from '@/platform/reco/hooks/useQuestionLogic';

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
  
  const { projectProfile } = useProject(state => ({
    projectProfile: state.projectProfile,
  }));
  
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
  const [currentStep, setCurrentStep] = useState(-1); // Start at -1 to show welcome message
  
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

  const hasEnoughAnswers = answeredCount >= MIN_ANSWERED_QUESTIONS;
  
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
      
      if (projectProfile.industry && projectProfile.industry.length > 0) {
        prefilledAnswers.industry_focus = projectProfile.industry;
      }
      
      if (projectProfile.objective) {
        prefilledAnswers.funding_amount = 50000; // Default fallback
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
  
  // Mock example handler - demonstrates CustomLLM output structure

  // Use shared program persistence helper
  const persistSelectedProgram = useCallback((program: EnhancedProgramResult) => {
    const programId = program.id || `program_${Date.now()}`;
    
    const saved = saveSelectedProgram({
      id: programId,
      name: program.name,
      type: program.type || (program.funding_types?.[0]) || 'grant',
      organization: (program as any).organization || (program as any).provider || null,
      // Include application requirements for document setup
      application_requirements: (program as any).application_requirements || {
        documents: [],
        sections: [],
        financial_requirements: {
          financial_statements_required: [],
          years_required: [],
          co_financing_proof_required: false,
          own_funds_proof_required: false
        }
      }
    });
    
    if (saved) {
      // Auto-redirect to editor after program selection
      router.push('/editor?product=submission');
    }
  }, [router]);

  return (
    <div className="w-full relative">
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
                              {t('editor.programFinder.tryAgain')}
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
            
            {/* Welcome message when user first arrives at wizard */}
            {results.length === 0 && !hasAttemptedGeneration && visibleQuestions.length > 0 && currentStep === -1 && (
              <div className="h-full flex items-center justify-center p-4">
                <div className="bg-slate-700/50 rounded-lg p-6 text-center w-full max-w-md">
                  <div className="text-white/60 text-2xl mb-2">🧠</div>
                  <p className="text-white/80 text-sm">
                    {t('editor.programFinder.startMessage')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Start the questionnaire by moving to the first question
                      setCurrentStep(0);
                    }}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    {t('editor.programFinder.startQuestionnaire')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Only show the questionnaire when user has started (currentStep >= 0) */}
            {currentStep >= 0 && (
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
                <div className="flex-col justify-start overflow-auto flex-1 pb-3 w-full px-1">
                  {visibleQuestions[currentStep] && (
                    <div className={styles.questionContainer}>
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
                            {t('editor.programFinder.generating')}
                          </>
                        ) : !hasEnoughAnswers ? (
                          <>
                            <Wand2 className="w-5 h-5" />
                            {t('editor.programFinder.answersMissing')}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            {t('editor.programFinder.generatePrograms')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
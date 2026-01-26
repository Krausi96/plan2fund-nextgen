/**
 * EditorProgramFinder - Simplified wizard for editor mode with dark theme
 * Uses questions 3, 5, 7, 8, 9, 10 from reco (renumbered as 1-6)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Wand2 } from 'lucide-react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { EnhancedProgramResult, QuestionDefinition } from '@/features/reco/types';
import { ALL_QUESTIONS } from '@/features/reco/data/questions';
import QuestionRenderer from '@/features/reco/components/QuestionRenderer';

// Inline deriveCompanyInfo function
function deriveCompanyInfo(organisationStage: string | undefined): { company_type: string | null; company_stage: string | null } {
  if (!organisationStage) return { company_type: null, company_stage: null };
  
  const stageMap: Record<string, { company_type: string; company_stage: string }> = {
    'exploring_idea': { company_type: 'founder_idea', company_stage: 'pre_company' },
    'early_stage_startup': { company_type: 'startup', company_stage: 'inc_lt_6m' },
    'growing_startup': { company_type: 'startup', company_stage: 'inc_6_36m' },
    'established_sme': { company_type: 'sme', company_stage: 'inc_gt_36m' },
    'research_institution': { company_type: 'research', company_stage: 'research_org' },
    'public_body': { company_type: 'public', company_stage: 'public_org' }
  };
  
  return stageMap[organisationStage] || { company_type: null, company_stage: null };
}

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
  
  // Inject dark theme CSS overrides
  const darkThemeStyles = `
    .question-container .bg-white {
      background-color: transparent !important;
    }
    .question-container .border-2.border-blue-200 {
      border-width: 0 !important;
      box-shadow: none !important;
    }
    .question-container .p-6 {
      padding: 0 !important;
    }
    .question-container .text-gray-900 {
      color: white !important;
    }
    .question-container .text-xl.font-semibold {
      color: white !important;
    }
    .question-container .bg-white.border-gray-300 {
      background-color: rgb(51 65 85 / 0.5) !important;
      border-color: rgb(71 85 105) !important;
      color: rgb(241 245 249) !important;
    }
    .question-container .bg-blue-600 {
      background-color: rgb(147 51 234) !important;
      border-color: rgb(147 51 234) !important;
    }
    .question-container .text-gray-700 {
      color: rgb(203 213 225) !important;
    }
  `;
  
  // Questions 3, 5, 7, 8, 9, 10 from reco (renumbered as 1-6 for editor)
  const EDITOR_QUESTION_IDS = [
    'revenue_status',      // 1
    'location',           // 2  
    'co_financing',       // 3
    'use_of_funds',       // 4
    'deadline_urgency',   // 5
    'impact_focus'        // 6
  ];
  
  // Get translated questions for editor mode
  const translatedQuestions = useMemo<QuestionDefinition[]>(() => {
    return ALL_QUESTIONS
      .filter(q => EDITOR_QUESTION_IDS.includes(q.id))
      .map((q, index) => {
        // Renumber priorities for editor mode (1-6)
        const editorQuestion = {
          ...q,
          priority: index + 1
        };
        
        const translatedLabel = (t(`reco.questions.${q.id}` as any) as string) || q.label;
        if (q.type === 'single-select' || q.type === 'multi-select') {
          const translatedOptions = q.options.map((opt) => ({
            ...opt,
            label: (t(`reco.options.${q.id}.${opt.value}` as any) as string) || opt.label,
          }));

          if (q.type === 'multi-select' && q.subCategories) {
            const translatedSubCategories = Object.fromEntries(
              Object.entries(q.subCategories).map(([key, items]) => [
                key,
                items.map((subItem) => ({
                  ...subItem,
                  label:
                    (t(`reco.options.${q.id}.${subItem.value}` as any) as string) ||
                    subItem.label,
                })),
              ])
            );

            return {
              ...editorQuestion,
              label: translatedLabel,
              options: translatedOptions,
              subCategories: translatedSubCategories,
            };
          }

          return {
            ...editorQuestion,
            label: translatedLabel,
            options: translatedOptions,
          };
        }

        return {
          ...editorQuestion,
          label: translatedLabel,
        };
      });
  }, [t]);

  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const setEmptyResults = () => setResults([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  
  const answersForApi = useMemo(() => {
    const sanitizedAnswers = { ...answers };
    delete sanitizedAnswers.funding_intent;
    return sanitizedAnswers;
  }, [answers]);
  
  const visibleQuestions = useMemo(
    () => translatedQuestions,
    [translatedQuestions]
  );

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

  const generatePrograms = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setHasAttemptedGeneration(true);
    
    try {
      const companyInfo = deriveCompanyInfo(answers.organisationStage);
      
      const requestBody = {
        answers: answersForApi,
        company_type: companyInfo.company_type,
        company_stage: companyInfo.company_stage,
        locale: 'en',
      };

      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error 
          ? ((t('reco.errors.completeFields' as any) as string)?.replace('{fields}', errorData.missing_fields?.join(', ') || '') || `Please complete: ${errorData.missing_fields?.join(', ')}`)
          : ((t('reco.errors.generationFailed' as any) as string) || 'Could not generate programs. Please try again.');
        alert(message);
        setEmptyResults();
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      const programs = data.programs || [];
      
      if (programs.length === 0) {
        alert((t('reco.errors.noProgramsFound' as any) as string) || 'No programs found. Please try again.');
        setEmptyResults();
        setIsLoading(false);
        return;
      }
      
      const results: EnhancedProgramResult[] = programs.map((p: any, index: number) => ({
        id: p.id || `program_${index}`,
        name: p.name,
        description: p.metadata?.description || p.description || '',
        url: p.url || p.source_url || null,
        region: p.metadata?.region || p.region || null,
        funding_types: p.funding_types || [],
        funding_amount_min: p.metadata?.funding_amount_min ?? p.funding_amount_min ?? null,
        funding_amount_max: p.metadata?.funding_amount_max ?? p.funding_amount_max ?? null,
        currency: p.metadata?.currency || p.currency || 'EUR',
        program_focus: p.metadata?.program_focus || p.program_focus || [],
        company_type: p.company_type || null,
        company_stage: p.company_stage || null,
        categorized_requirements: p.categorized_requirements || {},
      }));
      
      if (results.length > 0) {
        setResults(results);
      } else {
        setEmptyResults();
        alert((t('reco.errors.noProgramsFound' as any) as string) || 'No programs found.');
      }
    } catch (error: any) {
      console.error('Error generating programs:', error);
      alert((t('reco.errors.generationError' as any) as string) || `Error: ${error.message || 'Unknown error'}`);
      setEmptyResults();
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out generic program names
  const visibleResults = useMemo(() => {
    return results.filter((program: any) => {
      const name = (program?.name || '').toLowerCase();
      return !name.startsWith('general ') && 
             !name.includes('general grant option') && 
             !name.includes('general loan option');
    });
  }, [results]);
  const hasVisibleResults = visibleResults.length > 0;

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

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

  const hasEnoughAnswers = answeredCount >= 3;

  return (
    <div className="bg-transparent relative">
      <style>{darkThemeStyles}</style>
      <div className="max-w-2xl mx-auto px-4 py-2">
        {/* Questions Section - True Wizard mode (no scrolling) */}
        <div className="flex flex-col gap-2">
          <div className="p-4 max-w-2xl mx-auto w-full bg-slate-800/70 border border-slate-700 shadow-xl h-[600px] flex flex-col relative rounded-xl backdrop-blur-sm">
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
              <div className="flex-col justify-start overflow-auto">
                {visibleQuestions[currentStep] && (
                  <div className="question-container">
                    <QuestionRenderer
                      key={visibleQuestions[currentStep].id}
                      question={visibleQuestions[currentStep]}
                      questionIndex={currentStep}
                      value={answers[visibleQuestions[currentStep].id]}
                      answers={answers}
                      onAnswer={handleAnswer}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Buttons - Fixed at bottom of card */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700 mt-auto">
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
                    /* Generate Button fixed at bottom */
                    <button
                      onClick={generatePrograms}
                      disabled={isLoading || !hasEnoughAnswers}
                      className={`px-8 py-3 rounded-lg font-semibold text-base transition-all flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:hover:bg-slate-600`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {(t('reco.ui.generatingPrograms' as any) as string) || 'Generating...'}
                        </>
                      ) : !hasEnoughAnswers ? (
                        <>
                          <Wand2 className="w-5 h-5" />
                          {(t('reco.ui.requiredAnswersMissing' as any) as string) || 'Answers Missing'}
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          {(t('reco.ui.generateFundingPrograms' as any) as string) || 'Generate Programs'}
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

      {/* Loading Indicator - Contained within card */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="bg-slate-800 border-2 border-purple-500 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="text-xl font-bold text-slate-100">
                {(t('reco.ui.generatingPrograms' as any) as string) || 'Generating Programs...'}
              </h3>
              <p className="text-slate-300 text-sm text-center">
                {(t('reco.ui.generatingProgramsDescription' as any) as string) || 'This may take a moment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display - Contained within card */}
      {((hasVisibleResults && !isLoading) || (!isLoading && hasAttemptedGeneration && !hasVisibleResults)) && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl p-4">
          <div className="bg-slate-800 border-2 border-purple-500 rounded-xl w-full max-w-4xl max-h-[500px] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                  {(t('reco.results.title' as any) as string) || 'Found Funding Programs'}
                  <span className="ml-2 text-lg font-semibold text-slate-300">({visibleResults.length})</span>
                </h2>
                <p className="text-slate-300">
                  {(t('reco.results.description' as any) as string) || 'Here are the most suitable funding programs for you.'}
                </p>
              </div>
              
              <div className="space-y-4">
                {visibleResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
                      </svg>
                    </div>
                    <p className="text-slate-100 text-lg font-semibold mb-2">
                      {(t('reco.results.empty.title' as any) as string) || 'No matching programs yet'}
                    </p>
                    <p className="text-slate-400 text-sm mb-6">
                      {(t('reco.results.empty.body' as any) as string) ||
                        'We couldn\'t find specific programs for these answers. Adjust answers or connect a program you already know.'}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEmptyResults();
                          setHasAttemptedGeneration(false);
                        }}
                        className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-700 transition-colors"
                      >
                        {(t('reco.results.empty.retry' as any) as string) || 'Try again'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/editor?product=submission&connect=manual')}
                        className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        {(t('reco.results.empty.manual' as any) as string) || 'Add program in editor'}
                      </button>
                    </div>
                  </div>
                ) : (
                  visibleResults.map((program, index) => {
                    const fundingTypes = (program as any).funding_types || (program.type ? [program.type] : ['grant']);
                    
                    return (
                      <div key={program.id || index} className="p-5 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-purple-400 transition-all">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-100 mb-3">
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
                                  onProgramSelect(program.id, program.type || fundingTypes[0] || 'grant');
                                } else {
                                  persistSelectedProgram(program);
                                }
                                if (onClose) onClose();
                              }}
                              className="w-full md:w-auto px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                              {(t('reco.ui.select' as any) as string) || 'Select'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
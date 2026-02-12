/**
 * ProgramFinder - Simplified unified interface for funding program discovery
 */

import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { Wand2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';
import { EnhancedProgramResult } from '@/platform/core/types/program';
import { ProgramFinderProps } from '@/platform/core/types';
import QuestionRenderer from './QuestionRenderer';
import { 
  useQuestionFiltering, 
  useQuestionTranslation, 
  useAnswerHandling, 
  useProgramGeneration, 
  useResultsFiltering 
} from '../hooks/useQuestionLogic';

export default function ProgramFinder({ 
  onProgramSelect
}: Omit<ProgramFinderProps, 'editorMode'>) {
  const router = useRouter();
  const { t } = useI18n();
  
  // Use shared hooks for business logic
  const { translatedQuestions } = useQuestionTranslation();
  const { getFilteredQuestions } = useQuestionFiltering();
  const { handleAnswer: sharedHandleAnswer } = useAnswerHandling();
  const { generatePrograms } = useProgramGeneration();
  
  // Component state
  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const setEmptyResults = () => setResults([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Use shared results filtering
  const { visibleResults } = useResultsFiltering(results);
  const hasVisibleResults = visibleResults.length > 0;
  
  // Get filtered questions using shared hook
  const filteredQuestions = useMemo(() => 
    getFilteredQuestions(translatedQuestions, answers), 
    [translatedQuestions, answers, getFilteredQuestions]
  );
  
  // UI-specific: Wrap handleAnswer to include routing logic
  const handleAnswer = useCallback((questionId: string, value: any) => {
    sharedHandleAnswer(questionId, value, answers, setAnswers);
    
    // UI-specific: Handle planning_only redirect
    if (questionId === 'funding_intent' && value === 'planning_only') {
      router.push('/editor');
    }
  }, [sharedHandleAnswer, answers, router]);
  
  // Navigation logic
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, filteredQuestions.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  
  const answersForApi = useMemo(() => {
    const sanitizedAnswers = { ...answers };
    delete sanitizedAnswers.funding_intent;
    
    // Keep revenue_status as number, do not replace with category
    // revenue_status_category is optional and used for UI context only
    
    return sanitizedAnswers;
  }, [answers]);
  
  const visibleQuestions = useMemo(
    () => filteredQuestions,
    [filteredQuestions]
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
        funding_amount_min: (program as any).funding_amount_min ?? program.metadata?.funding_amount_min ?? null,
        funding_amount_max: (program as any).funding_amount_max ?? program.metadata?.funding_amount_max ?? null,
        currency: (program as any).currency || program.metadata?.currency || 'EUR',
        region: (program as any).region || program.metadata?.region || program.region || null,
        deadline: (program as any).deadline || program.metadata?.deadline || null,
        open_deadline: (program as any).open_deadline ?? program.metadata?.open_deadline ?? false,
        use_of_funds: (program as any).use_of_funds || null,
        impact_focus: (program as any).impact_focus || null,
        program_focus: (program as any).program_focus || program.metadata?.program_focus || [],
        funding_types: program.funding_types || [],
      }));
    } catch (error) {
      console.warn('Failed to persist selected program:', error);
    }
    const params = new URLSearchParams({
      product: 'submission',
      programId: programId,
    });
    router.push(`/editor?${params.toString()}`);
  }, [router]);
  
  
  // Count answered questions
  const mainQuestionIds = visibleQuestions.map(q => q.id);
  const answeredCount = mainQuestionIds.filter(questionId => {
    const value = answers[questionId];
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (value === 'not_applicable' || value === 'no_partnerships') return false;
    if (Array.isArray(value) && value.every(v => v === 'not_applicable' || v === 'no_partnerships')) return false;
    return true;
  }).length;
  // Advanced questions tracking removed - all questions shown together
  
// Minimum questions for results (core questions before showing programs)
// Note: Only includes TRULY required questions (required: true in questions.ts)
// Optional questions (co_financing, use_of_funds) are excluded from required check
// Note: legal_form is excluded from this list as it is auto-populated when not visible
const MIN_QUESTIONS_FOR_RESULTS = 4;
const REQUIRED_QUESTION_IDS = ['organisation_type', 'company_stage', 'revenue_status', 'location', 'industry_focus', 'funding_amount'] as const;
  const missingRequiredAnswers = REQUIRED_QUESTION_IDS.filter((questionId) => {
    const value = answers[questionId];
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  });
  const missingRequiredLabels = missingRequiredAnswers.map((questionId) => {
    const question = translatedQuestions.find((q) => q.id === questionId);
    return question?.label || questionId;
  });
  const hasRequiredAnswers = missingRequiredAnswers.length === 0;
  const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS && hasRequiredAnswers;
  const remainingQuestions = Math.max(0, MIN_QUESTIONS_FOR_RESULTS - answeredCount);
  
  // UI-specific: Wrap generatePrograms from hook
  const handleGeneratePrograms = async () => {
    if (!hasEnoughAnswers) {
      if (!hasRequiredAnswers) {
        const requiredList = missingRequiredLabels.join(', ');
        alert((t('reco.errors.missingRequiredQuestions' as any) as string)?.replace('{list}', requiredList) || `Please complete the required questions first: ${requiredList}.`);
        return;
      }
      alert((t('reco.errors.minQuestionsRequired' as any) as string)?.replace('{count}', String(MIN_QUESTIONS_FOR_RESULTS)) || `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions to generate funding programs.`);
      return;
    }
    
    // Use shared hook for program generation - limit to 3 results max
    await generatePrograms(answersForApi, setResults, setEmptyResults, setIsLoading, setHasAttemptedGeneration, t as any, 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 ${answeredCount > 0 ? 'pb-24' : ''}`}>
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Wand2 className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {t('reco.pageTitle')}
            </h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg mb-8">
            {t('reco.pageSubtitle')}
          </p>
          
          {hasVisibleResults && (
            <div className="mt-2 text-sm text-gray-600">
              {visibleResults.length} program{visibleResults.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
        
        {/* Questions Section - Step by step wizard */}
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-300 shadow-lg">
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {(t('reco.ui.questionOf') as string)
                    .replace('{current}', String(currentStep + 1))
                    .replace('{total}', String(filteredQuestions.length))}
                </span>
                <span className="text-sm text-gray-500">
                  {(t('reco.ui.complete') as string)
                    .replace('{percent}', String(Math.round(((currentStep + 1) / filteredQuestions.length) * 100)))}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentStep + 1) / filteredQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Current question */}
            <div className="mb-8">
              <QuestionRenderer
                question={filteredQuestions[currentStep]}
                questionIndex={currentStep}
                value={answers[filteredQuestions[currentStep].id]}
                answers={answers}
                onAnswer={handleAnswer}
              />
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(t('reco.ui.previous') as string) || 'Previous'}
              </button>
              
              <div className="text-sm text-gray-600">
                {(t('reco.ui.questionOf') as string)
                  .replace('{current}', String(currentStep + 1))
                  .replace('{total}', String(filteredQuestions.length))}
              </div>
              
              {currentStep < filteredQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={filteredQuestions[currentStep].required && !answers[filteredQuestions[currentStep].id]}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {(t('reco.ui.next') as string) || 'Next'} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGeneratePrograms}
                  disabled={!hasEnoughAnswers || isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  {(t('editor.programFinder.generatePrograms') as string) || 'Generate Programs'}
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Results Modal - Rendered via Portal to document.body */}
      {((hasVisibleResults && !isLoading) || (!isLoading && hasAttemptedGeneration && !hasVisibleResults)) && 
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg flex flex-col w-full max-w-2xl overflow-hidden" style={{height: '90vh', maxHeight: '90vh', minHeight: '0', alignSelf: 'center', position: 'relative'}}>
            
            {/* Header - shrink-0 to keep it fixed */}
            <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-br from-blue-50 to-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {(t('reco.results.title' as any) as string) || 'Found Funding Programs'}
                    <span className="ml-2 text-lg font-semibold text-blue-600">({visibleResults.length})</span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    {(t('reco.results.description' as any) as string) || 'Most suitable funding programs for you.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEmptyResults();
                    setHasAttemptedGeneration(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content - ONLY this scrolls */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 pb-32">
              {visibleResults.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
                  </svg>
                </div>
                <p className="text-gray-900 text-lg font-semibold mb-2">
                  {(t('reco.results.empty.title' as any) as string) || 'No matching programs yet'}
                </p>
                <p className="text-gray-600 text-sm mb-6">
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
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                  >
                    {(t('reco.results.empty.retry' as any) as string) || 'Try again'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/editor?product=submission&connect=manual')}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {(t('reco.results.empty.manual' as any) as string) || 'Add program in editor'}
                  </button>
                </div>
              </div>
            ) : (
              visibleResults.map((program, index) => {
                const fundingTypes = (program as any).funding_types || (program.type ? [program.type] : ['grant']);
                
                return (
                  <div key={program.id || index} className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col w-full">
                    <div className="flex-1 min-h-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                        {program.name || `Program ${index + 1}`}
                      </h3>
                      {program.description && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {program.description}
                        </p>
                      )}
                      {(program as any).reasoning && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2.5 mb-3">
                          <p className="text-xs text-blue-900 font-semibold mb-1">💡 {(t('results.whyMatches' as any) as string) || 'Why this matches'}:</p>
                          <p className="text-xs text-blue-800 leading-relaxed">
                            {(program as any).reasoning}
                          </p>
                        </div>
                      )}
                      {(program as any).cautions && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2.5 mb-3">
                          <p className="text-xs text-amber-900 font-semibold mb-1">⚠️ {(t('results.note' as any) as string) || 'Note'}:</p>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            {(program as any).cautions}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (onProgramSelect) {
                          onProgramSelect(program.id, program.type || fundingTypes[0] || 'grant');
                        } else {
                          persistSelectedProgram(program);
                        }
                      }}
                      className="w-full mt-3 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {(t('reco.ui.select' as any) as string) || 'Select'}
                    </button>
                  </div>
                );
              })
            )}
            </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}

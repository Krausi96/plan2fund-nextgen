/**
 * ProgramFinder - Simplified unified interface for funding program discovery
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Wand2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { useI18n } from '@/shared/contexts/I18nContext';
import { EnhancedProgramResult, QuestionDefinition, ProgramFinderProps } from '../types';
import { ALL_QUESTIONS } from '../data/questions';
import QuestionRenderer from './QuestionRenderer';

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

export default function ProgramFinder({ 
  onProgramSelect
}: Omit<ProgramFinderProps, 'editorMode'>) {
  const router = useRouter();
  const { t } = useI18n();
  
  // Get translated questions
  const translatedQuestions = useMemo<QuestionDefinition[]>(() => {
    return ALL_QUESTIONS.map((q) => {
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
            ...q,
            label: translatedLabel,
            options: translatedOptions,
            subCategories: translatedSubCategories,
          };
        }

        return {
          ...q,
          label: translatedLabel,
          options: translatedOptions,
        };
      }

      return {
        ...q,
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
  
  // Get filtered questions based on conditional logic
  const getFilteredQuestions = useCallback((allQuestions: QuestionDefinition[], currentAnswers: Record<string, any>) => {
    return allQuestions.filter(question => {
      // Always show organisation_stage
      if (question.id === 'organisation_stage') return true;
      
      // Show has_registered_company only if exploring_idea
      if (question.id === 'has_registered_company') {
        return currentAnswers.organisation_stage === 'exploring_idea';
      }
      
      // Show legal_form based on conditions
      if (question.id === 'legal_form') {
        // If exploring_idea, show only if has_registered_company = yes
        if (currentAnswers.organisation_stage === 'exploring_idea') {
          return currentAnswers.has_registered_company === 'yes';
        }
        // For other stages, show legal_form
        return currentAnswers.organisation_stage && currentAnswers.organisation_stage !== 'exploring_idea';
      }
      
      // For all other questions, show by default
      return true;
    });
  }, []);
  
  const filteredQuestions = useMemo(() => 
    getFilteredQuestions(translatedQuestions, answers), 
    [translatedQuestions, answers, getFilteredQuestions]
  );
  
  const answersForApi = useMemo(() => {
    const sanitizedAnswers = { ...answers };
    delete sanitizedAnswers.funding_intent;
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
const MIN_QUESTIONS_FOR_RESULTS = 5;
const REQUIRED_QUESTION_IDS = ['organisation_stage', 'revenue_status', 'location', 'industry_focus', 'funding_amount', 'co_financing'] as const;
  const missingRequiredAnswers = REQUIRED_QUESTION_IDS.filter((questionId) => {
    const value = answers[questionId];
    return !value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
  });
  const missingRequiredLabels = missingRequiredAnswers.map((questionId) => {
    const question = translatedQuestions.find((q) => q.id === questionId);
    return question?.label || questionId;
  });
  const hasRequiredAnswers = missingRequiredAnswers.length === 0;
  const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS && hasRequiredAnswers;
  const remainingQuestions = Math.max(0, MIN_QUESTIONS_FOR_RESULTS - answeredCount);
  
  const handleAnswer = useCallback((questionId: string, value: any) => {
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };

      if (value === undefined || value === null || value === '') {
        delete newAnswers[questionId];
      } else {
        newAnswers[questionId] = value;
      }

      // Handle organisation_stage - derive company_type and company_stage
      if (questionId === 'organisation_stage' || questionId === 'organisation_stage_other') {
        const orgStage = newAnswers.organisation_stage as string | undefined;
        const { company_type, company_stage } = deriveCompanyInfo(orgStage);
        if (company_type) {
          newAnswers.company_type = company_type;
        }
        if (company_stage) {
          newAnswers.company_stage = company_stage;
        } else {
          delete newAnswers.company_stage;
        }
        
        // Reset dependent answers when organisation_stage changes
        delete newAnswers.has_registered_company;
        delete newAnswers.legal_form;
      }
      
      // Handle has_registered_company - auto-set legal_form
      if (questionId === 'has_registered_company') {
        if (value === 'no') {
          newAnswers.legal_form = 'not_registered_yet';
        } else {
          delete newAnswers.legal_form;
        }
      }
      
      // Handle planning_only - redirect immediately
      if (questionId === 'funding_intent' && value === 'planning_only') {
        router.push('/editor');
        return prevAnswers; // Don't update state if redirecting
      }
      
      // LEGACY: Handle old company_type for backward compatibility
      if (questionId === 'company_type' || questionId === 'company_type_other') {
        delete newAnswers.company_stage;
      }

      return newAnswers;
    });

    // Navigation is now explicit via Next button only
  }, [router, visibleQuestions]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, filteredQuestions.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const generatePrograms = async () => {
    if (!hasEnoughAnswers) {
      if (!hasRequiredAnswers) {
        const requiredList = missingRequiredLabels.join(', ');
        alert((t('reco.errors.missingRequiredQuestions' as any) as string)?.replace('{list}', requiredList) || `Please complete the required questions first: ${requiredList}.`);
        return;
      }
      alert((t('reco.errors.minQuestionsRequired' as any) as string)?.replace('{count}', String(MIN_QUESTIONS_FOR_RESULTS)) || `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions to generate funding programs.`);
      return;
    }
    
    setIsLoading(true);
    setHasAttemptedGeneration(true);
    
    try {
      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersForApi,
          max_results: 20,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const missingFields: string[] = Array.isArray(errorData?.missing) ? errorData.missing : [];
        const missingFieldLabels = missingFields
          .map((fieldId) => {
            const question = translatedQuestions.find((q) => q.id === fieldId);
            return question?.label || fieldId;
          })
          .join(', ');

        const message = missingFieldLabels
          ? ((t('reco.errors.completeFields' as any) as string)?.replace('{fields}', missingFieldLabels) || `Please complete: ${missingFieldLabels}`)
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
                  Question {currentStep + 1} of {filteredQuestions.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentStep + 1) / filteredQuestions.length) * 100)}% complete
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
                ← Previous
              </button>
              
              <div className="text-sm text-gray-600">
                {currentStep + 1} / {filteredQuestions.length}
              </div>
              
              {currentStep < filteredQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!answers[filteredQuestions[currentStep].id]}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={generatePrograms}
                  disabled={!hasEnoughAnswers || isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Programs
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Results Modal/Popup */}
      <Dialog open={(hasVisibleResults && !isLoading) || (!isLoading && hasAttemptedGeneration && !hasVisibleResults)} onOpenChange={(open) => {
        if (!open) {
          setEmptyResults();
          setHasAttemptedGeneration(false);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {(t('reco.results.title' as any) as string) || 'Found Funding Programs'}
              <span className="ml-2 text-lg md:text-xl font-semibold text-gray-600">({visibleResults.length})</span>
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {(t('reco.results.description' as any) as string) || 'Here are the most suitable funding programs for you.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 md:space-y-6 mt-2">
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
                  <Card key={program.id || index} className="p-5 md:p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all bg-white">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                          {program.name || `Program ${index + 1}`}
                        </h3>
                        {program.description && (
                          <p className="text-sm text-gray-700 leading-relaxed">
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
                          }}
                          className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                          {(t('reco.ui.select' as any) as string) || 'Select'}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Bottom Bar - Generate Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50 p-4">
        <div className="max-w-5xl mx-auto flex justify-center">
          <button
            onClick={generatePrograms}
            disabled={isLoading || !hasEnoughAnswers}
            className="px-8 py-3 rounded-lg font-semibold text-base transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 min-w-[280px]"
            title={!hasEnoughAnswers ? (hasRequiredAnswers
                  ? ((t('reco.ui.minQuestionsTooltip' as any) as string)?.replace('{count}', String(MIN_QUESTIONS_FOR_RESULTS)) || `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions`)
                  : ((t('reco.ui.requiredQuestionsTooltip' as any) as string) || 'Please complete all required questions')) : undefined}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {(t('reco.ui.generatingPrograms' as any) as string) || 'Generating Programs...'}
              </>
            ) : !hasEnoughAnswers ? (
              <>
                <Wand2 className="w-5 h-5" />
                {hasRequiredAnswers
                  ? ((t('reco.ui.remainingQuestions' as any) as string)?.replace('{count}', String(remainingQuestions)) || `${remainingQuestions} more questions`)
                  : ((t('reco.ui.requiredAnswersMissing' as any) as string) || 'Required answers missing')}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {(t('reco.ui.generateFundingPrograms' as any) as string) || 'Generate Funding Programs'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

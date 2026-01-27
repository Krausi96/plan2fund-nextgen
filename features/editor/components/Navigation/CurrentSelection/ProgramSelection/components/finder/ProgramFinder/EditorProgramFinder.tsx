/**
 * EditorProgramFinder - Simplified wizard for editor mode with dark theme
 * Uses questions 3, 5, 7, 8, 9, 10 from reco (renumbered as 1-6)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Wand2 } from 'lucide-react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { EnhancedProgramResult, QuestionDefinition } from '@/features/reco/types';
import { ALL_QUESTIONS } from '@/features/reco/data/questions';
import QuestionRenderer from '@/features/reco/components/QuestionRenderer';
import { useEditorStore } from '@/features/editor/lib/store/editorStore';

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
  
  // Get project profile from editor store for prefilling
  const projectProfile = useEditorStore(state => state.setupWizard.projectProfile);
  
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
    /* Fix for "Other" sub-options and legal form text */
    .question-container .bg-white.border-gray-300:not(.bg-blue-600) {
      background-color: rgb(51 65 85 / 0.7) !important;
      border-color: rgb(71 85 105) !important;
      color: white !important;
    }
    .question-container .text-gray-600 {
      color: rgb(203 213 225) !important;
    }
    .question-container input.border-gray-300 {
      background-color: rgb(51 65 85) !important;
      border-color: rgb(71 85 105) !important;
      color: white !important;
    }
    .question-container input.border-gray-300::placeholder {
      color: rgb(148 163 184) !important;
    }
    /* Fix for legal form group headers and options */
    .question-container .bg-white.border-2.border-gray-300:not(.bg-blue-600) {
      background-color: rgb(51 65 85) !important;
      border-color: rgb(71 85 105) !important;
    }
    .question-container .font-medium.text-gray-800 {
      color: white !important;
    }
    .question-container .text-gray-600.transition-transform {
      color: rgb(203 213 225) !important;
    }
    .question-container .ml-4.space-y-2.border-l-2.border-gray-300 {
      border-left-color: rgb(71 85 105) !important;
    }
    /* Fix for Public bodies text in Other options */
    .question-container .text-sm:not(.text-white) {
      color: white !important;
    }
    /* Fix for Public bodies button background */
    .question-container .bg-gray-50.hover\:bg-gray-100 {
      background-color: rgb(51 65 85) !important;
    }
    .question-container .hover\:bg-gray-100:hover {
      background-color: rgb(71 85 105) !important;
    }
    .question-container .text-gray-700 {
      color: white !important;
    }
    /* More specific targeting for the expandable button */
    .question-container button.w-full.text-left.px-3.py-2.bg-gray-50.hover\:bg-gray-100 {
      background-color: rgb(51 65 85) !important;
      border-color: rgb(71 85 105) !important;
    }
    .question-container button.w-full.text-left.px-3.py-2.bg-gray-50.hover\:bg-gray-100:hover {
      background-color: rgb(71 85 105) !important;
    }
    /* Even more aggressive targeting */
    .question-container .bg-gray-50 {
      background-color: rgb(51 65 85) !important;
    }
    .question-container .hover\:bg-gray-100:hover {
      background-color: rgb(71 85 105) !important;
    }
    /* Target the specific button by its text content */
    .question-container button span:text-sm.font-medium.text-gray-700 {
      color: white !important;
    }
    /* Target by parent div structure */
    .question-container div.mt-3.pt-2.border-t.border-gray-200 button {
      background-color: rgb(51 65 85) !important;
      border-color: rgb(71 85 105) !important;
    }
    .question-container div.mt-3.pt-2.border-t.border-gray-200 button:hover {
      background-color: rgb(71 85 105) !important;
    }
    .question-container div.mt-3.pt-2.border-t.border-gray-200 button span.text-sm.font-medium.text-gray-700 {
      color: white !important;
    }
  `;
  
  // Get all questions from reco in the specified order
  const EDITOR_QUESTION_IDS = [
    'organisation_type',    // 1
    'company_stage',        // 2
    'legal_form',          // 3
    'revenue_status',      // 4
    'location',            // 5
    'funding_amount',      // 6
    'industry_focus',      // 7
    'co_financing',        // 8
    'use_of_funds',        // 9
    'deadline_urgency',    // 10
    'impact_focus'         // 11
  ];
  
  // Get translated questions for editor mode
  const translatedQuestions = useMemo<QuestionDefinition[]>(() => {
    return ALL_QUESTIONS
      .filter(q => EDITOR_QUESTION_IDS.includes(q.id))
      .sort((a, b) => EDITOR_QUESTION_IDS.indexOf(a.id) - EDITOR_QUESTION_IDS.indexOf(b.id))
      .map((q, index) => {
        // Renumber priorities for editor mode (1-11)
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
  
  // Get filtered questions based on conditional logic (same as Reco)
  const getFilteredQuestions = useCallback((allQuestions: QuestionDefinition[], currentAnswers: Record<string, any>) => {
    const isNotRegisteredYet = currentAnswers.organisation_type === 'individual' && 
                              currentAnswers.organisation_type_sub === 'no_company';
    const isIdeaStage = currentAnswers.company_stage === 'idea';
    
    // Check if organization type is one that should skip revenue
    const skipRevenueOrgTypes = ['association', 'foundation', 'cooperative', 'public_body', 'research_institution'];
    const shouldSkipRevenue = skipRevenueOrgTypes.includes(currentAnswers.organisation_type_other);
    
    return allQuestions.filter(question => {
      // Always show organisation_type and company_stage
      if (question.id === 'organisation_type' || question.id === 'company_stage') return true;
      
      // Hide organisation_type_sub - it's shown as sub-options in QuestionRenderer
      if (question.id === 'organisation_type_sub') return false;
      
      // Logic 1: If not registered yet, hide legal_form and revenue_status
      if (isNotRegisteredYet) {
        if (question.id === 'legal_form' || question.id === 'revenue_status') return false;
      }
      
      // Logic 2: If idea stage, hide revenue_status
      if (isIdeaStage && question.id === 'revenue_status') return false;
      
      // Logic 3: If organization type should skip revenue, hide revenue_status
      if (shouldSkipRevenue && question.id === 'revenue_status') return false;
      
      // Logic 4: New revenue status logic based on project stage (slider version)
      if (question.id === 'revenue_status') {
        const companyStage = currentAnswers.company_stage as string | undefined;
        
        // Idea stage: Auto-set to 0 (Pre-Revenue) and hide slider
        if (companyStage === 'idea') {
          return false; // Hide the slider entirely
        }
        
        // Not registered yet: Auto-set to 0 (Pre-Revenue) and hide slider
        if (isNotRegisteredYet) {
          return false; // Hide the slider entirely
        }
        
        // Organization types that skip revenue: Auto-set to 0 and hide slider
        if (shouldSkipRevenue) {
          return false; // Hide the slider entirely
        }
        
        // For all other stages: Show slider with full range
        return true;
      }
      
      // Show legal_form based on conditions (when not hidden by above logic)
      if (question.id === 'legal_form') {
        // If organisation_type = individual, show only if sub-option = has_company
        if (currentAnswers.organisation_type === 'individual') {
          return currentAnswers.organisation_type_sub === 'has_company';
        }
        
        // If organisation_type_other is a revenue-skipping type, hide legal_form
        const skipRevenueOrgTypes = ['association', 'foundation', 'cooperative', 'public_body', 'research_institution'];
        if (currentAnswers.organisation_type === 'other' && 
            currentAnswers.organisation_type_other && 
            skipRevenueOrgTypes.includes(currentAnswers.organisation_type_other)) {
          return false;
        }
        
        // For other organisation types, show legal_form
        return currentAnswers.organisation_type && currentAnswers.organisation_type !== 'individual';
      }
      
      // For all other questions, show by default
      return true;
    });
  }, []);
  
  const filteredQuestions = useMemo(() => 
    getFilteredQuestions(translatedQuestions, answers), 
    [translatedQuestions, answers, getFilteredQuestions]
  );
  
  // Prefill answers from MyProject data
  useEffect(() => {
    if (projectProfile && Object.keys(answers).length === 0) {
      const prefilledAnswers: Record<string, any> = {};
      
      // Map MyProject fields to Reco questions
      if (projectProfile.stage) {
        prefilledAnswers.company_stage = projectProfile.stage;
      }
      
      if (projectProfile.country) {
        // Map country to location options
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
      
      // Get region from localStorage (since it's not in ProjectProfile type)
      const savedRegion = localStorage.getItem('myProject_region');
      if (savedRegion) {
        prefilledAnswers.location_region = savedRegion;
      }
      
      // Try to infer organisation_type from stage
      if (projectProfile.stage === 'idea' || projectProfile.stage === 'MVP') {
        prefilledAnswers.organisation_type = 'startup';
      } else if (projectProfile.stage === 'revenue') {
        prefilledAnswers.organisation_type = 'established_sme';
      }
      
      setAnswers(prefilledAnswers);
    }
  }, [projectProfile]);
  
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
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers };

      if (value === undefined || value === null || value === '') {
        delete newAnswers[questionId];
      } else {
        newAnswers[questionId] = value;
      }

      // Handle organisation_type and company_stage - derive company_type and company_stage
      if (questionId === 'organisation_type' || questionId === 'organisation_type_other' || 
          questionId === 'organisation_type_sub' || questionId === 'company_stage') {
        const orgType = newAnswers.organisation_type as string | undefined;
        const orgOther = newAnswers.organisation_type_other as string | undefined;
        const orgSub = newAnswers.organisation_type_sub as string | undefined;
        const compStage = newAnswers.company_stage as string | undefined;
        
        // Logic 1: Auto-set values when not registered yet
        const isNotRegisteredYet = orgType === 'individual' && orgSub === 'no_company';
        if (isNotRegisteredYet) {
          newAnswers.legal_form = 'not_registered_yet';
          newAnswers.revenue_status = 0; // Pre-Revenue (0 EUR)
        }
        
        // Logic 2: Auto-set revenue_status for idea stage
        if (compStage === 'idea') {
          newAnswers.revenue_status = 0; // Pre-Revenue (0 EUR)
        }
        
        // Logic 3: Auto-set values for organization types that skip revenue
        const skipRevenueOrgTypes = ['association', 'foundation', 'cooperative', 'public_body', 'research_institution'];
        const shouldSkipRevenue = orgOther && skipRevenueOrgTypes.includes(orgOther);
        if (shouldSkipRevenue) {
          newAnswers.revenue_status = 0; // Pre-Revenue (0 EUR)
          newAnswers.legal_form = 'research_institution'; // Set appropriate legal form
        }
        
        // Logic 4: Map numeric revenue value to categorical value for API
        const revenueValue = newAnswers.revenue_status as number | undefined;
        if (revenueValue !== undefined) {
          let revenueCategory = 'pre_revenue';
          if (revenueValue === 0) {
            revenueCategory = 'pre_revenue';
          } else if (revenueValue >= 1 && revenueValue <= 250000) {
            revenueCategory = 'low_revenue';
          } else if (revenueValue >= 250001 && revenueValue <= 1000000) {
            revenueCategory = 'early_revenue';
          } else if (revenueValue >= 1000001 && revenueValue <= 10000000) {
            revenueCategory = 'growth_revenue';
          } else if (revenueValue > 10000000) {
            revenueCategory = 'established_revenue';
          }
          newAnswers.revenue_status_category = revenueCategory;
        }
        
        // Auto-set legal_form based on sub-selection (when registered)
        if (orgType === 'individual' && orgSub === 'has_company') {
          delete newAnswers.legal_form;
        }
        
        // Reset dependent answers when organisation_type or company_stage changes
        if (questionId !== 'organisation_type_sub' && questionId !== 'organisation_type_other') {
          delete newAnswers.legal_form;
          delete newAnswers.revenue_status;
        }
      }
      
      return newAnswers;
    });
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

  const hasEnoughAnswers = answeredCount >= 5;

  return (
    <div className="bg-transparent relative">
      <style>{darkThemeStyles}</style>
      <div className="max-w-2xl mx-auto px-4 py-2">
        {/* Questions Section - True Wizard mode (no scrolling) */}
        <div className="flex flex-col gap-2">
          <div className="p-4 max-w-2xl mx-auto w-full bg-slate-800/70 border border-slate-700 shadow-xl h-[600px] flex flex-col relative rounded-xl backdrop-blur-sm">
            {/* Loading Indicator - Inside card container */}
            {isLoading && (
              <div className="absolute inset-x-0 top-0 inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-t-xl">
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

            {/* Results Display - Inside card container */}
            {((hasVisibleResults && !isLoading) || (!isLoading && hasAttemptedGeneration && !hasVisibleResults)) && (
              <div className="absolute inset-x-0 top-0 inset-0 bg-slate-900/90 backdrop-blur-sm z-40 flex items-center justify-center rounded-t-xl p-4">
                <div className="bg-slate-800 border-2 border-purple-500 rounded-xl w-full max-w-3xl max-h-[400px] overflow-y-auto shadow-2xl">
                  <div className="p-5">
                    <div className="mb-5">
                      <h2 className="text-xl font-bold text-slate-100 mb-2">
                        {(t('reco.results.title' as any) as string) || 'Found Funding Programs'}
                        <span className="ml-2 text-base font-semibold text-slate-300">({visibleResults.length})</span>
                      </h2>
                      <p className="text-slate-300">
                        {(t('reco.results.description' as any) as string) || 'Here are the most suitable funding programs for you.'}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {visibleResults.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
                            </svg>
                          </div>
                          <p className="text-slate-100 font-semibold mb-2">
                            {(t('reco.results.empty.title' as any) as string) || 'No matching programs yet'}
                          </p>
                          <p className="text-slate-400 text-sm mb-5">
                            {(t('reco.results.empty.body' as any) as string) ||
                              'We couldn\'t find specific programs for these answers. Adjust answers or connect a program you already know.'}
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
                              {(t('reco.results.empty.retry' as any) as string) || 'Try again'}
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push('/editor?product=submission&connect=manual')}
                              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              {(t('reco.results.empty.manual' as any) as string) || 'Add program in editor'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        visibleResults.map((program, index) => {
                          const fundingTypes = (program as any).funding_types || (program.type ? [program.type] : ['grant']);
                          
                          return (
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
                                        onProgramSelect(program.id, program.type || fundingTypes[0] || 'grant');
                                      } else {
                                        persistSelectedProgram(program);
                                      }
                                      if (onClose) onClose();
                                    }}
                                    className="w-full md:w-auto px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md whitespace-nowrap"
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
    </div>
  );
}
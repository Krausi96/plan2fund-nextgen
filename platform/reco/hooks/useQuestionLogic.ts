/**
 * Shared question logic hooks for both ProgramFinder and EditorProgramFinder
 * Contains reusable business logic without UI dependencies
 */

import { useCallback, useMemo } from 'react';
import { QuestionDefinition } from '@/platform/core/types/program';
import { ALL_QUESTIONS } from '../data/questions';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useProjectStore } from '@/platform/core/store/useProjectStore';

// Hook for question filtering logic
export function useQuestionFiltering(hideFirstQuestion: boolean = false) {
  const getFilteredQuestions = useCallback((allQuestions: QuestionDefinition[], currentAnswers: Record<string, any>) => {
    const isNotRegisteredYet = currentAnswers.organisation_type === 'individual' && 
                              currentAnswers.organisation_type_sub === 'no_company';
    const isIdeaStage = currentAnswers.company_stage === 'idea';
    const skipRevenueOrgTypes = ['association', 'foundation', 'cooperative', 'public_body', 'research_institution'];
    const shouldSkipRevenue = skipRevenueOrgTypes.includes(currentAnswers.organisation_type_other);
    
    return allQuestions.filter(question => {
      // Hide first question (funding_intent) in editor mode
      if (hideFirstQuestion && question.id === 'funding_intent') return false;
      
      if (question.id === 'organisation_type' || question.id === 'company_stage') return true;
      if (question.id === 'organisation_type_sub') return false;
      if (isNotRegisteredYet && (question.id === 'legal_form' || question.id === 'revenue_status')) return false;
      if (isIdeaStage && question.id === 'revenue_status') return false;
      if (shouldSkipRevenue && question.id === 'revenue_status') return false;
      
      if (question.id === 'revenue_status') {
        const companyStage = currentAnswers.company_stage as string | undefined;
        if (companyStage === 'idea' || isNotRegisteredYet || shouldSkipRevenue) return false;
        return true;
      }
      
      if (question.id === 'legal_form') {
        if (currentAnswers.organisation_type === 'individual') {
          return currentAnswers.organisation_type_sub === 'has_company';
        }
        if (currentAnswers.organisation_type === 'other' && 
            currentAnswers.organisation_type_other && 
            skipRevenueOrgTypes.includes(currentAnswers.organisation_type_other)) {
          return false;
        }
        return currentAnswers.organisation_type && currentAnswers.organisation_type !== 'individual';
      }
      
      return true;
    });
  }, [hideFirstQuestion]);

  return { getFilteredQuestions };
}

// Hook for question translation logic
export function useQuestionTranslation() {
  const { t } = useI18n();
  
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
                label: (t(`reco.options.${q.id}.${subItem.value}` as any) as string) || subItem.label,
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

  return { translatedQuestions };
}

// Hook for answer handling logic
export function useAnswerHandling() {
  const handleAnswer = useCallback((questionId: string, value: any, _currentAnswers: Record<string, any>, setAnswers: (updater: (prev: Record<string, any>) => Record<string, any>) => void) => {
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers };

      if (value === undefined || value === null || value === '') {
        delete newAnswers[questionId];
      } else {
        newAnswers[questionId] = value;
      }

      // Handle organisation-related changes
      if (questionId === 'organisation_type' || questionId === 'organisation_type_other' || 
          questionId === 'organisation_type_sub' || questionId === 'company_stage') {
        // When changing main organisation_type, clear dependent fields first
        if (questionId === 'organisation_type') {
          delete newAnswers.legal_form;
          delete newAnswers.revenue_status;
          delete newAnswers.revenue_status_category;
        }
        const orgType = newAnswers.organisation_type as string | undefined;
        const orgOther = newAnswers.organisation_type_other as string | undefined;
        const orgSub = newAnswers.organisation_type_sub as string | undefined;
        const compStage = newAnswers.company_stage as string | undefined;
        
        const isNotRegisteredYet = orgType === 'individual' && orgSub === 'no_company';
        const skipRevenueOrgTypes = ['association', 'foundation', 'cooperative', 'public_body', 'research_institution'];
        const shouldSkipRevenue = orgOther && skipRevenueOrgTypes.includes(orgOther);
        
        // Auto-set values when not registered yet
        if (isNotRegisteredYet) {
          newAnswers.legal_form = 'not_registered_yet';
          newAnswers.revenue_status = 0;
        } else if (compStage === 'idea') {
          // Auto-set revenue_status for idea stage
          newAnswers.revenue_status = 0;
        } else if (shouldSkipRevenue) {
          // Auto-set values for organization types that skip revenue
          newAnswers.revenue_status = 0;
          newAnswers.legal_form = 'research_institution';
        }
        
        // Always compute revenue_status_category based on current revenue_status
        const revenueValue = newAnswers.revenue_status as number | undefined;
        if (revenueValue !== undefined) {
          let revenueCategory = 'pre_revenue';
          if (revenueValue === 0) revenueCategory = 'pre_revenue';
          else if (revenueValue <= 250000) revenueCategory = 'low_revenue';
          else if (revenueValue <= 1000000) revenueCategory = 'early_revenue';
          else if (revenueValue <= 10000000) revenueCategory = 'growth_revenue';
          else revenueCategory = 'established_revenue';
          newAnswers.revenue_status_category = revenueCategory;
        }
        
        if (orgType === 'individual' && orgSub === 'has_company') {
          delete newAnswers.legal_form;
        }
      }
      
      return newAnswers;
    });
  }, []);

  return { handleAnswer };
}

// Hook for program generation logic
export function useProgramGeneration() {
  const { projectProfile } = useProjectStore();
  const { locale } = useI18n();
  
  const generatePrograms = async (
    answers: Record<string, any>,
    setResults: (programs: any[]) => void,
    setEmptyResults: () => void,
    setIsLoading: (loading: boolean) => void,
    setHasAttemptedGeneration: (attempted: boolean) => void,
    t: (key: string) => string,
    maxResults: number = 20
  ) => {
    if (Object.keys(answers).length === 0) return;
    
    setIsLoading(true);
    setHasAttemptedGeneration(true);
    
    try {
      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answers,
          max_results: maxResults,
          oneliner: answers.oneliner || projectProfile?.oneliner || '',
          language: locale || 'en',
        }),
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
      
      // API returns fully-formed program objects - no mapping needed
      setResults(programs);
    } catch (error: any) {
      console.error('Error generating programs:', error);
      alert((t('reco.errors.generationError' as any) as string) || `Error: ${error.message || 'Unknown error'}`);
      setEmptyResults();
    } finally {
      setIsLoading(false);
    }
  };

  return { generatePrograms };
}

// Hook for results filtering logic
export function useResultsFiltering(results: any[]) {
  const visibleResults = useMemo(() => {
    return results.filter((program: any) => {
      const name = (program?.name || '').toLowerCase();
      return !name.startsWith('general ') && 
             !name.includes('general grant option') && 
             !name.includes('general loan option');
    });
  }, [results]);

  return { visibleResults };
}
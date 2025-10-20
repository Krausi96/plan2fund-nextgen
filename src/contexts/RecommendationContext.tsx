// Recommendation Context - Shared State Management for All Recommendation Components
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/lib/enhancedRecoEngine';
import { DynamicQuestionEngine, DynamicQuestion } from '@/lib/dynamicQuestionEngine';
import { getQuestionsData } from '@/data/questions';
import { useI18n } from './I18nContext';

interface RecommendationState {
  // User Input
  answers: Record<string, any>;
  questions: DynamicQuestion[];
  currentQuestionIndex: number;
  
  // Results
  recommendations: EnhancedProgramResult[];
  isLoading: boolean;
  isMounted: boolean;
  
  // UI State
  showAdvancedSearch: boolean;
  showDynamicWizard: boolean;
  selectedProgram: any | null;
  
  // Error Handling
  error: string | null;
}

interface RecommendationContextType {
  // State
  state: RecommendationState;
  
  // Question Management
  loadQuestions: () => Promise<void>;
  setCurrentQuestionIndex: (index: number) => void;
  handleAnswer: (questionId: string, value: any) => void;
  handlePrevious: () => void;
  handleNext: () => Promise<void>;
  
  // Recommendation Management
  submitSurvey: (mode?: 'strict' | 'explorer') => Promise<EnhancedProgramResult[]>;
  clearResults: () => void;
  
  // Advanced Search
  handleAdvancedSearch: (searchInput: string) => Promise<EnhancedProgramResult[] | undefined>;
  
  // Dynamic Wizard
  handleProgramSelect: (program: any) => void;
  handleDynamicWizardComplete: (dynamicAnswers: Record<string, any>) => Promise<void>;
  handleDynamicWizardCancel: () => void;
  
  // Direct Actions
  setAnswers: (answers: Record<string, any>) => void;
  setRecommendations: (recommendations: EnhancedProgramResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

interface RecommendationProviderProps {
  children: ReactNode;
}

export function RecommendationProvider({ children }: RecommendationProviderProps) {
  const { t } = useI18n();
  
  const [state, setState] = useState<RecommendationState>({
    answers: {},
    questions: [],
    currentQuestionIndex: 0,
    recommendations: [],
    isLoading: false,
    isMounted: false,
    showAdvancedSearch: false,
    showDynamicWizard: false,
    selectedProgram: null,
    error: null
  });

  // Initialize question engine
  const [questionEngine] = useState(() => new DynamicQuestionEngine(t));

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, [questionEngine]);

  // Load questions from dynamic question engine (with timeout + robust fallback)
  const loadQuestions = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000));
      const loadedQuestions = await Promise.race([
        questionEngine.getQuestionOrder(),
        timeout
      ]);
      const safeQuestions = Array.isArray(loadedQuestions) ? loadedQuestions : [];
      setState(prev => ({ 
        ...prev, 
        questions: safeQuestions,
        isLoading: false,
        isMounted: true,
        currentQuestionIndex: 0
      }));
    } catch (error) {
      console.warn('Question engine failed, using robust local fallback');
      // Robust local fallback: use static questions with normalized types
      const q = getQuestionsData(t).universal;
      const fallbackQuestions: DynamicQuestion[] = q.map((base: any, index: number) => ({
        id: base.id,
        label: base.label,
        type: base.type === 'single-select' ? 'single' : base.type === 'multi-select' ? 'multiple' : base.type,
        options: base.options || [],
        required: !!base.required,
        informationValue: 0,
        programsAffected: 0,
        decisiveness: 'UNCERTAIN',
        sourcePrograms: [],
        uxWeight: 1,
        isCoreQuestion: index < 7,
        questionNumber: index + 1
      }));
      setState(prev => ({ 
        ...prev, 
        questions: fallbackQuestions,
        isLoading: false,
        isMounted: true,
        error: null,
        currentQuestionIndex: 0
      }));
    }
  };

  // Question navigation
  const setCurrentQuestionIndex = (index: number) => {
    setState(prev => ({ ...prev, currentQuestionIndex: index }));
  };

  const handleAnswer = (questionId: string, value: any) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };

  const handlePrevious = () => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1)
    }));
  };

  const handleNext = async () => {
    const { currentQuestionIndex, questions } = state;
    
    if (currentQuestionIndex < questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    } else {
      // Last question, submit survey
      await submitSurvey();
    }
  };

  // Submit survey and get recommendations
  const submitSurvey = async (mode: 'strict' | 'explorer' = 'strict') => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Store answers for results page
      localStorage.setItem("userAnswers", JSON.stringify(state.answers));
      
      // Get recommendations using enhanced reco engine
      const recommendations = await scoreProgramsEnhanced(state.answers, mode);
      
      // Store results
      localStorage.setItem("recoResults", JSON.stringify(recommendations));
      
      setState(prev => ({
        ...prev,
        recommendations,
        isLoading: false
      }));
      
      return recommendations;
    } catch (error) {
      console.error('Error submitting survey:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get recommendations'
      }));
      throw error;
    }
  };

  // Clear results
  const clearResults = () => {
    setState(prev => ({
      ...prev,
      answers: {},
      recommendations: [],
      currentQuestionIndex: 0,
      error: null
    }));
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("recoResults");
  };

  // Convert chips to answers for advanced search
  const convertChipsToAnswers = (chips: any[]): Record<string, any> => {
    const answers: Record<string, any> = {};
    
    chips.forEach(chip => {
      switch (chip.id) {
        case 'location':
          if (chip.value.includes('Vienna')) answers.q1_country = 'AT';
          else if (chip.value.includes('Austria')) answers.q1_country = 'AT';
          else if (chip.value.includes('EU')) answers.q1_country = 'EU';
          else answers.q1_country = 'NON_EU';
          break;
        case 'stage':
          if (chip.value === 'Idea') answers.q2_entity_stage = 'PRE_COMPANY';
          else if (chip.value === 'MVP') answers.q2_entity_stage = 'INC_LT_6M';
          else if (chip.value === 'Revenue') answers.q2_entity_stage = 'INC_6_36M';
          else if (chip.value === 'Growth') answers.q2_entity_stage = 'INC_GT_36M';
          else if (chip.value === 'Scaleup') answers.q2_entity_stage = 'INC_GT_36M';
          break;
        case 'team_size':
          const size = parseInt(chip.value);
          if (size <= 9) answers.q3_company_size = 'MICRO_0_9';
          else if (size <= 49) answers.q3_company_size = 'SMALL_10_49';
          else if (size <= 249) answers.q3_company_size = 'MEDIUM_50_249';
          else answers.q3_company_size = 'LARGE_250_PLUS';
          break;
        case 'funding_amount':
          answers.q3_funding_amount = parseInt(chip.value);
          break;
        case 'sector':
          answers.q4_theme = [chip.value];
          break;
        case 'funding_type':
          answers.q8_funding_types = chip.value;
          break;
      }
    });
    
    return answers;
  };

  // Advanced search
  const handleAdvancedSearch = async (searchInput: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use advanced search doctor for intelligent parsing
      const { advancedSearchDoctor } = await import('@/lib/advancedSearchDoctor');
      const result = await advancedSearchDoctor.processFreeTextInput(searchInput);
      
      // Convert chips to answers
      const answers = convertChipsToAnswers(result.chips);
      setState(prev => ({ ...prev, answers }));
      
      // Get recommendations using enhanced scoring
      const recommendations = await scoreProgramsEnhanced(answers, "explorer");
      setState(prev => ({
        ...prev,
        recommendations,
        isLoading: false
      }));
      
      return recommendations;
    } catch (error) {
      console.error('Error in advanced search:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Advanced search failed'
      }));
    }
  };

  // Dynamic wizard
  const handleProgramSelect = (program: any) => {
    setState(prev => ({
      ...prev,
      selectedProgram: program,
      showDynamicWizard: true
    }));
  };

  const handleDynamicWizardComplete = async (dynamicAnswers: Record<string, any>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Combine general answers with program-specific answers
      const combinedAnswers = { ...state.answers, ...dynamicAnswers };
      
      // Re-score programs with enhanced answers
      const recommendations = await scoreProgramsEnhanced(combinedAnswers);
      
      setState(prev => ({
        ...prev,
        recommendations,
        showDynamicWizard: false,
        selectedProgram: null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error in dynamic wizard:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Dynamic wizard failed'
      }));
    }
  };

  const handleDynamicWizardCancel = () => {
    setState(prev => ({
      ...prev,
      showDynamicWizard: false,
      selectedProgram: null
    }));
  };

  // Direct state setters
  const setAnswers = (answers: Record<string, any>) => {
    setState(prev => ({ ...prev, answers }));
  };

  const setRecommendations = (recommendations: EnhancedProgramResult[]) => {
    setState(prev => ({ ...prev, recommendations }));
  };

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const value: RecommendationContextType = {
    state,
    loadQuestions,
    setCurrentQuestionIndex,
    handleAnswer,
    handlePrevious,
    handleNext,
    submitSurvey,
    clearResults,
    handleAdvancedSearch,
    handleProgramSelect,
    handleDynamicWizardComplete,
    handleDynamicWizardCancel,
    setAnswers,
    setRecommendations,
    setLoading,
    setError
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}

export function useRecommendation() {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendation must be used within a RecommendationProvider');
  }
  return context;
}

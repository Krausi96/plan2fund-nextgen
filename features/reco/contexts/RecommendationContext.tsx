// Recommendation Context - Shared State Management for Recommendation Components
// Simplified after SmartWizard → ProgramFinder migration
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';

interface RecommendationState {
  // User Input
  answers: Record<string, any>;
  
  // Results
  recommendations: EnhancedProgramResult[];
  isLoading: boolean;
  
  // UI State
  selectedProgram: EnhancedProgramResult | null;
  
  // Error Handling
  error: string | null;
}

interface RecommendationContextType {
  // State
  state: RecommendationState;
  
  // Direct Actions (used by ProgramFinder and other components)
  setAnswers: (answers: Record<string, any>) => void;
  setRecommendations: (recommendations: EnhancedProgramResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  handleProgramSelect: (program: any) => void;
  clearResults: () => void;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

interface RecommendationProviderProps {
  children: ReactNode;
}

export function RecommendationProvider({ children }: RecommendationProviderProps) {
  
  const [state, setState] = useState<RecommendationState>({
    answers: {},
    recommendations: [],
    isLoading: false,
    selectedProgram: null,
    error: null
  });

  // Clear results
  const clearResults = () => {
    setState(prev => ({
      ...prev,
      answers: {},
      recommendations: [],
      error: null
    }));
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("recoResults");
  };

  // Dynamic wizard
  const handleProgramSelect = (program: any) => {
    setState(prev => ({
      ...prev,
      selectedProgram: program,
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
    setAnswers,
    setRecommendations,
    setLoading,
    setError,
    handleProgramSelect,
    clearResults
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

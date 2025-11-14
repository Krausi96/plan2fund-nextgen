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
  
  // Removed: selectedProgram - not used anywhere
  // Removed: error - not used anywhere
}

interface RecommendationContextType {
  // State
  state: RecommendationState;
  
  // Direct Actions (used by ProgramFinder)
  setAnswers: (answers: Record<string, any>) => void;
  setRecommendations: (recommendations: EnhancedProgramResult[]) => void;
  setLoading: (loading: boolean) => void;
  clearResults: () => void;
  
  // Removed: setError - not used
  // Removed: handleProgramSelect - not used (programs selected via URL routing)
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
  });

  // Clear results
  const clearResults = () => {
    setState(prev => ({
      ...prev,
      answers: {},
      recommendations: [],
    }));
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("recoResults");
  };

  // Removed handleProgramSelect - not used (programs selected via URL routing)


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

  const value: RecommendationContextType = {
    state,
    setAnswers,
    setRecommendations,
    setLoading,
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

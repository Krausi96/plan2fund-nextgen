// Real-time Recommendations Hook - Phase 3 Enhancement
import { useEffect, useCallback } from 'react';
import { useRecommendation } from '@/contexts/RecommendationContext';
import { scoreProgramsEnhanced } from '@/lib/enhancedRecoEngine';

export function useRealTimeRecommendations() {
  const { state, setRecommendations, setLoading } = useRecommendation();
  const { answers } = state;

  // Debounced real-time scoring
  const debouncedScoring = useCallback(
    debounce(async (answers: Record<string, any>) => {
      if (Object.keys(answers).length === 0) return;
      
      try {
        setLoading(true);
        const recommendations = await scoreProgramsEnhanced(answers, "explorer");
        setRecommendations(recommendations);
      } catch (error) {
        console.error('Real-time scoring error:', error);
      } finally {
        setLoading(false);
      }
    }, 1000), // 1 second debounce
    []
  );

  // Trigger real-time updates when answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      debouncedScoring(answers);
    }
  }, [answers, debouncedScoring]);

  return {
    isRealTimeActive: Object.keys(answers).length > 0,
    recommendations: state.recommendations,
    isLoading: state.isLoading
  };
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


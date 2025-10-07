// ========= PLAN2FUND — OPTIMIZED EDITOR DATA HOOK =========
// Performance-optimized data loading for editor components

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { dataSource } from '@/lib/dataSource';

interface UseOptimizedEditorDataProps {
  programId?: string;
  route?: string;
  product?: string;
}

interface AIFields {
  decisionTreeQuestions: any[];
  editorSections: any[];
  readinessCriteria: any[];
  aiGuidance: any;
  targetPersonas: string[];
  tags: string[];
}

interface UseOptimizedEditorDataReturn {
  plan: PlanDocument | null;
  programProfile: ProgramProfile | null;
  aiFields: AIFields | null;
  isLoading: boolean;
  error: string | null;
  savePlan: (plan: PlanDocument) => Promise<void>;
  updatePlan: (updates: Partial<PlanDocument>) => void;
}

export function useOptimizedEditorData({
  programId,
  route,
  product
}: UseOptimizedEditorDataProps): UseOptimizedEditorDataReturn {
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [programProfile, setProgramProfile] = useState<ProgramProfile | null>(null);
  const [aiFields, setAIFields] = useState<AIFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized initial plan structure
  const initialPlanStructure = useMemo(() => ({
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ownerId: 'anonymous',
    product: product as any || 'submission',
    route: route as any || 'grant',
    programId: programId || '',
    language: 'en' as const,
    tone: 'neutral' as const,
    targetLength: 'standard' as const,
    settings: {
      includeTitlePage: true,
      includePageNumbers: true,
      citations: 'simple' as const,
      captions: true,
      graphs: {
        revenueCosts: true,
        cashflow: true,
        useOfFunds: true
      }
    },
    sections: [
      {
        key: 'executive_summary',
        title: 'Executive Summary',
        content: '',
        status: 'missing' as const
      },
      {
        key: 'business_description',
        title: 'Business Description',
        content: '',
        status: 'missing' as const
      },
      {
        key: 'market_analysis',
        title: 'Market Analysis',
        content: '',
        status: 'missing' as const
      },
      {
        key: 'financial_projections',
        title: 'Financial Projections',
        content: '',
        status: 'missing' as const
      }
    ],
    addonPack: false,
    versions: []
  }), [programId, route, product]);

  // Initialize plan data
  const initializePlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create initial plan
      const initialPlan: PlanDocument = { ...initialPlanStructure };
      setPlan(initialPlan);

      // Load program profile if programId provided
      if (programId) {
        try {
          // Try to get program data from current data implementation
          const programs = await dataSource.getGPTEnhancedPrograms();
          const program = programs.find(p => p.id === programId);
          
          if (program) {
            const profile: ProgramProfile = {
              programId: program.id,
              route: program.type as any, // Map type to route
              // Store AI-enhanced fields in a separate state for the editor
            };
            setProgramProfile(profile);
            
            // Store AI-enhanced fields separately for editor use
            setAIFields({
              decisionTreeQuestions: program.decision_tree_questions || [],
              editorSections: program.editor_sections || [],
              readinessCriteria: program.readiness_criteria || [],
              aiGuidance: program.ai_guidance || null,
              targetPersonas: program.target_personas || [],
              tags: program.tags || []
            });
          }
        } catch (programError) {
          console.warn('Could not load program profile:', programError);
          // Continue without program profile
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize plan');
      setIsLoading(false);
    }
  }, [programId, initialPlanStructure]);

  // Initialize on mount
  useEffect(() => {
    initializePlan();
  }, [initializePlan]);

  // Optimized save function
  const savePlan = useCallback(async (planToSave: PlanDocument) => {
    try {
      // Save to localStorage
      const planKey = `plan_${planToSave.id}`;
      localStorage.setItem(planKey, JSON.stringify(planToSave));
      
      // Try to save to API
      try {
        const response = await fetch('/api/plan/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planToSave })
        });
        
        if (!response.ok) {
          console.warn('Failed to save to server, saved locally');
        }
      } catch (apiError) {
        console.warn('API save failed, saved locally:', apiError);
      }
      
      console.log('Plan saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }, []);

  // Optimized update function
  const updatePlan = useCallback((updates: Partial<PlanDocument>) => {
    setPlan(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return {
    plan,
    programProfile,
    aiFields,
    isLoading,
    error,
    savePlan,
    updatePlan
  };
}

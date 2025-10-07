// Smart Recommendation Flow - Phase 3 Integration
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useRecommendation } from '@/contexts/RecommendationContext';
import { useRealTimeRecommendations } from '@/hooks/useRealTimeRecommendations';
import UnifiedRecommendationWizard from './UnifiedRecommendationWizard';
import { DynamicWizard } from '../decision-tree/DynamicWizard';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartRecommendationFlowProps {
  initialMode?: 'wizard' | 'advanced-search' | 'enhanced';
  showRealTimeUpdates?: boolean;
  showSmartSuggestions?: boolean;
}

export default function SmartRecommendationFlow({
  initialMode = 'wizard',
  showRealTimeUpdates = true,
  showSmartSuggestions = true
}: SmartRecommendationFlowProps) {
  const router = useRouter();
  const { state, setAnswers, setRecommendations } = useRecommendation();
  const { isRealTimeActive, recommendations } = useRealTimeRecommendations();
  const [currentMode, setCurrentMode] = useState(initialMode);
  // const [showSmartSuggestionsState, setShowSmartSuggestionsState] = useState(false); // Unused

  // Load existing data from localStorage on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem('userAnswers');
    const savedResults = localStorage.getItem('recoResults');
    
    if (savedAnswers) {
      try {
        const answers = JSON.parse(savedAnswers);
        setAnswers(answers);
      } catch (error) {
        console.error('Error loading saved answers:', error);
      }
    }
    
    if (savedResults) {
      try {
        const results = JSON.parse(savedResults);
        setRecommendations(results);
        if (results.length > 0) {
          setCurrentMode('enhanced');
        }
      } catch (error) {
        console.error('Error loading saved results:', error);
      }
    }
  }, [setAnswers, setRecommendations]);

  // Auto-advance to results when recommendations are ready
  useEffect(() => {
    if (recommendations.length > 0 && currentMode === 'wizard') {
      const timer = setTimeout(() => {
        router.push('/results');
      }, 2000); // 2 second delay to show completion
      
      return () => clearTimeout(timer);
    }
  }, [recommendations, currentMode, router]);

  // Smart suggestions based on user behavior
  useEffect(() => {
    if (showSmartSuggestions && state.answers && Object.keys(state.answers).length >= 3) {
      const timer = setTimeout(() => {
        // setShowSmartSuggestionsState(true); // Removed - unused state
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [state.answers, showSmartSuggestions]);

  const handleModeChange = (newMode: 'wizard' | 'advanced-search' | 'enhanced') => {
    setCurrentMode(newMode);
  };

  const handleSmartSuggestion = (suggestion: string) => {
    // Process smart suggestion
    console.log('Smart suggestion:', suggestion);
    // setShowSmartSuggestionsState(false); // Removed - unused state
  };

  return (
    <div className="relative">
      {/* Real-time Updates Indicator */}
      {showRealTimeUpdates && isRealTimeActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            <span className="text-sm">Updating recommendations...</span>
          </div>
        </motion.div>
      )}

      {/* Smart Suggestions */}
      <AnimatePresence>
        {showSmartSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Suggestion</h3>
                  <p className="text-sm text-gray-600">
                    Based on your answers, try our advanced search for more precise results
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSmartSuggestion('advanced-search')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Try Advanced Search
                  </button>
                  <button
                    onClick={() => {/* setShowSmartSuggestionsState(false); // Removed - unused state */}}
                    className="px-3 py-1 text-gray-500 text-sm hover:text-gray-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentMode === 'wizard' && (
            <UnifiedRecommendationWizard 
              mode="wizard" 
              showAdvancedSearch={true}
              showDynamicWizard={true}
            />
          )}
          
          {currentMode === 'advanced-search' && (
            <UnifiedRecommendationWizard 
              mode="advanced-search" 
              showAdvancedSearch={true}
              showDynamicWizard={true}
            />
          )}
          
          {currentMode === 'enhanced' && recommendations.length > 0 && (
            <EnhancedRecommendationsView 
              recommendations={recommendations}
              onModeChange={handleModeChange}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dynamic Wizard Overlay */}
      {state.showDynamicWizard && state.selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DynamicWizard
              programId={state.selectedProgram.id}
              onComplete={(answers) => {
                // Handle dynamic wizard completion
                console.log('Dynamic wizard completed:', answers);
              }}
              onCancel={() => {
                // Handle dynamic wizard cancellation
                console.log('Dynamic wizard cancelled');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Recommendations View Component
function EnhancedRecommendationsView({ 
  recommendations, 
  onModeChange 
}: { 
  recommendations: any[]; 
  onModeChange: (mode: 'wizard' | 'advanced-search' | 'enhanced') => void; 
}) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Recommendations</h1>
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('wizard')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Back to Wizard
            </button>
            <button
              onClick={() => onModeChange('advanced-search')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Advanced Search
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {recommendations.slice(0, 5).map((rec, index) => (
            <div key={rec.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{rec.name}</h3>
                  <p className="text-sm text-gray-600">{rec.type} • {rec.score}% match</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{rec.score}%</div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


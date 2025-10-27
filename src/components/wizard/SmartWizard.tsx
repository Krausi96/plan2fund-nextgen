import React, { useState, useEffect, useRef } from 'react';
import { QuestionEngine, SymptomQuestion } from '../../lib/questionEngine';
import { IntakeEngine } from '../../lib/intakeEngine';
import { scoreProgramsEnhanced, EnhancedProgramResult } from '../../lib/enhancedRecoEngine';
import { useI18n } from '../../contexts/I18nContext';
import Link from 'next/link';

interface SmartWizardProps {
  onComplete?: (results: EnhancedProgramResult[]) => void;
  onProfileGenerated?: (profile: any) => void;
}

interface WizardState {
  currentQuestion: SymptomQuestion | null;
  answers: Record<string, any>;
  currentPhase: 1 | 2 | 3;
  isProcessing: boolean;
  results: EnhancedProgramResult[];
  profile: any | null;
  showResults: boolean;
  showFinalPreview: boolean;
  progress: number;
  programSpecificQuestions?: SymptomQuestion[];
  // NEW: Enhanced validation and guidance
  validationErrors?: string[];
  validationWarnings?: string[];
  validationRecommendations?: string[];
  estimatedTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  aiGuidance?: string;
  programPreview?: any[]; // Top 3 programs preview
  previewQuality?: { level: string; message: string; color: string }; // NEW: Preview quality analysis
  // NEW: Navigation state
  currentQuestionIndex: number;
  totalQuestions: number;
  canGoBack: boolean;
  canGoForward: boolean;
  questionHistory: string[];
  // NEW: Program filtering feedback
  remainingProgramCount?: number;
}

const SmartWizard: React.FC<SmartWizardProps> = ({ onComplete, onProfileGenerated }) => {
  const { t } = useI18n();
  const [state, setState] = useState<WizardState>({
    currentQuestion: null,
    answers: {},
    currentPhase: 1,
    isProcessing: false,
    results: [],
    profile: null,
    showResults: false,
    showFinalPreview: false,
    progress: 0,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    canGoBack: false,
    canGoForward: true,
    questionHistory: []
  });

  const [questionEngine, setQuestionEngine] = useState<QuestionEngine | null>(null);
  const [intakeEngine, setIntakeEngine] = useState<IntakeEngine | null>(null);
  // Removed scoringEngine - using enhancedRecoEngine directly
  const [animationKey, setAnimationKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);


  // Initialize engines with program data
  useEffect(() => {
    const initEngines = async () => {
      try {
        // Fetch program data from API with timeout
        console.log('🔄 Fetching program data from API...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/programs?enhanced=true', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const programs = data.programs || [];
        
        console.log(`📊 API Response: ${data.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`📊 Programs loaded: ${programs.length}`);
        console.log(`📊 Data source: ${data.source || 'unknown'}`);
        
        if (programs.length === 0) {
          console.warn('⚠️ No programs loaded, using fallback');
          // Fallback to empty array - engines will handle this gracefully
        }
        
        // Initialize engines with program data
        console.log('🔄 Creating IntakeEngine...');
        const intake = new IntakeEngine();
        console.log('✅ IntakeEngine created successfully');
        
        console.log('🔄 Creating QuestionEngine with', programs.length, 'programs...');
        console.log('🔍 Sample program data:', programs[0]);
        const question = new QuestionEngine(programs);
        console.log('✅ QuestionEngine created successfully');
        console.log('📊 QuestionEngine questions count:', question.getCoreQuestions().length);
        console.log('🔍 QuestionEngine questions:', question.getCoreQuestions().map(q => q.id));
        
        // Initialize overlay questions from program data
        console.log('🔄 Initializing overlay questions...');
        await question.initializeOverlayQuestions();
        console.log('✅ Overlay questions initialized');
        
        setIntakeEngine(intake);
        setQuestionEngine(question);
        
        // Start with first question
        const firstQuestion = await question.getFirstQuestion();
        const estimatedTotal = question.getEstimatedTotalQuestions();
        
        console.log('🎯 First question:', firstQuestion?.id || 'null');
        console.log('🎯 Estimated total:', estimatedTotal);
        
        // If no question is generated, create a basic fallback question
        if (!firstQuestion) {
          console.warn('⚠️ No questions generated, creating fallback question');
          const fallbackQuestion = {
            id: 'location',
            symptom: 'wizard.questions.location',
            type: 'single-select' as const,
            options: [
              { label: 'wizard.options.germany', value: 'germany' },
              { label: 'wizard.options.austria', value: 'austria' },
              { label: 'wizard.options.switzerland', value: 'switzerland' },
              { label: 'wizard.options.other', value: 'other' }
            ],
            required: true,
            category: 'location' as const,
            phase: 1 as const,
            questionNumber: 1
          };
          
          setState(prev => ({
            ...prev,
            currentQuestion: fallbackQuestion,
            progress: 0,
            totalQuestions: 1
          }));
        } else {
          setState(prev => ({
            ...prev,
            currentQuestion: firstQuestion,
            progress: 0,
            totalQuestions: estimatedTotal
          }));
        }
      } catch (error) {
        console.error('❌ Failed to initialize engines:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Enhanced fallback initialization with better error handling
        console.log('🔄 Using fallback initialization...');
        const intake = new IntakeEngine();
        const question = new QuestionEngine([]);
        
        // Initialize overlay questions (will be empty for fallback)
        await question.initializeOverlayQuestions();
        
        setIntakeEngine(intake);
        setQuestionEngine(question);
        
        const firstQuestion = await question.getFirstQuestion();
        const estimatedTotal = question.getEstimatedTotalQuestions();
        
        console.log('🎯 Fallback first question:', firstQuestion?.id || 'null');
        console.log('🎯 Fallback estimated total:', estimatedTotal);
        
        // If no question is generated, create a basic fallback question
        if (!firstQuestion) {
          console.warn('⚠️ No fallback questions generated, creating emergency fallback question');
          const fallbackQuestion = {
            id: 'location',
            symptom: 'wizard.questions.location',
            type: 'single-select' as const,
            options: [
              { label: 'wizard.options.germany', value: 'germany' },
              { label: 'wizard.options.austria', value: 'austria' },
              { label: 'wizard.options.switzerland', value: 'switzerland' },
              { label: 'wizard.options.other', value: 'other' }
            ],
            required: true,
            category: 'location' as const,
            phase: 1 as const,
            questionNumber: 1
          };
          
          setState(prev => ({
            ...prev,
            currentQuestion: fallbackQuestion,
            progress: 0,
            totalQuestions: 1
          }));
        } else {
          setState(prev => ({
            ...prev,
            currentQuestion: firstQuestion,
            progress: 0,
            totalQuestions: estimatedTotal
          }));
        }
      }
    };
    
    initEngines();
  }, []);

  // Navigation functions
  const goToPreviousQuestion = () => {
    if (state.canGoBack && state.questionHistory.length > 0) {
      const previousQuestionId = state.questionHistory[state.questionHistory.length - 1];
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        canGoBack: prev.currentQuestionIndex > 1,
        canGoForward: true,
        questionHistory: prev.questionHistory.slice(0, -1)
      }));
      // Load previous question
      if (questionEngine) {
        const question = questionEngine.getQuestionById(previousQuestionId);
        if (question) {
          setState(prev => ({ ...prev, currentQuestion: question }));
        }
      }
    }
  };

  const goToNextQuestion = () => {
    if (state.canGoForward && state.currentQuestion) {
      // This will be handled by the normal question flow
      // The handleAnswer function will move to the next question
    }
  };

  const handleAnswer = async (answer: any) => {
    if (!state.currentQuestion || !questionEngine || !intakeEngine) return;

    const newAnswers = { ...state.answers, [state.currentQuestion.id]: answer };
    
    // Add current question to history
    const updatedHistory = [...state.questionHistory, state.currentQuestion.id];
    
    // NEW: Apply major filters to reduce program pool
    const filteredPrograms = questionEngine.applyMajorFilters(newAnswers);
    console.log(`🔍 Major filters applied: ${filteredPrograms.length} programs remaining`);
    
    // NEW: Store program count for display
    const remainingProgramCount = filteredPrograms.length;
    
    // Use enhanced question logic (prioritizes program-generated questions)
    let nextQuestion = await questionEngine.getNextQuestionEnhanced(newAnswers);
    
    // If no more questions from enhanced logic, fall back to basic logic
    if (!nextQuestion) {
      console.log('⚠️ No more enhanced questions, trying basic logic');
      nextQuestion = await questionEngine.getNextQuestion(newAnswers);
      
      // If still no questions, generate contextual questions based on user context
      if (!nextQuestion) {
        const contextualQuestions = questionEngine.generateContextualQuestions(newAnswers);
        if (contextualQuestions.length > 0) {
          nextQuestion = contextualQuestions[0];
          // Store contextual questions for later use
          setState(prev => ({
            ...prev,
            programSpecificQuestions: contextualQuestions
          }));
        }
      }
    }
    
    // NEW: Validate answers and get feedback
    const validation = questionEngine.validateAnswers(newAnswers);
    
    // NEW: Get program preview after 3+ answers (every 2-3 questions)
    let programPreview = null;
    let previewQuality = null;
    if (Object.keys(newAnswers).length >= 3 && Object.keys(newAnswers).length % 2 === 1) {
      try {
        const { scoreProgramsEnhanced } = await import('@/lib/enhancedRecoEngine');
        const previewResults = await scoreProgramsEnhanced(newAnswers, "strict");
        programPreview = previewResults.slice(0, 3); // Top 3 programs
        
        // NEW: Analyze preview quality for dynamic decision making
        const topScore = previewResults[0]?.score || 0;
        if (topScore >= 85) {
          previewQuality = { level: 'excellent', message: t('wizard.quality.excellent'), color: 'green' };
        } else if (topScore >= 60) {
          previewQuality = { level: 'good', message: t('wizard.quality.good'), color: 'blue' };
        } else {
          previewQuality = { level: 'poor', message: t('wizard.quality.poor'), color: 'orange' };
        }
        
        console.log('📊 Program preview updated:', programPreview.length, 'programs, quality:', previewQuality.level);
      } catch (error) {
        console.warn('Failed to generate program preview:', error);
      }
    }
    
    // NEW: Show program preview instead of ending when we have enough answers but more questions available
    const hasEnoughAnswersForPreview = Object.keys(newAnswers).length >= 5;
    const hasMoreQuestions = nextQuestion !== null;
    
    if (hasEnoughAnswersForPreview && hasMoreQuestions && !programPreview) {
      // Generate preview for current answers even if we have more questions
      try {
        const { scoreProgramsEnhanced } = await import('@/lib/enhancedRecoEngine');
        const previewResults = await scoreProgramsEnhanced(newAnswers, "strict");
        programPreview = previewResults.slice(0, 3);
        console.log('📊 Generated preview for intermediate answers:', programPreview.length, 'programs');
      } catch (error) {
        console.warn('Failed to generate intermediate preview:', error);
      }
    }
    
    // Calculate estimated time and difficulty
    const estimatedTime = 0;
    const difficulty = 'easy' as 'easy' | 'medium' | 'hard';

    setState(prev => ({
      ...prev,
      answers: newAnswers,
      currentQuestion: nextQuestion,
      progress: nextQuestion ? (Object.keys(newAnswers).length / Math.max(state.totalQuestions, 10)) * 100 : 100, // Dynamic progress based on estimated total questions
      currentQuestionIndex: Object.keys(newAnswers).length, // Current question index = number of answers given
      totalQuestions: prev.totalQuestions, // Keep the estimated total from QuestionEngine
      canGoBack: true,
      canGoForward: nextQuestion ? true : false,
      questionHistory: updatedHistory,
      // NEW: Enhanced validation and guidance
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      validationRecommendations: validation.recommendations,
      estimatedTime,
      difficulty,
      aiGuidance: nextQuestion?.aiGuidance,
      programPreview: programPreview || prev.programPreview, // Keep existing preview if no new one
      previewQuality: previewQuality || prev.previewQuality, // Keep existing quality if no new one
      // NEW: Store program count
      remainingProgramCount: remainingProgramCount
    }));

    // If no more questions, show final preview instead of results
    if (!nextQuestion) {
      // Generate final program preview instead of going to results
      try {
        const { scoreProgramsEnhanced } = await import('@/lib/enhancedRecoEngine');
        const finalResults = await scoreProgramsEnhanced(newAnswers, "strict");
        const finalPreview = finalResults.slice(0, 5); // Top 5 programs for final preview
        
        setState(prev => ({
          ...prev,
          programPreview: finalPreview,
          showFinalPreview: true, // New flag to show final preview
          isProcessing: false
        }));
        
        console.log('🎯 Final preview generated:', finalPreview.length, 'programs');
      } catch (error) {
        console.warn('Failed to generate final preview:', error);
        // Fallback to results if preview fails
        await processResults(newAnswers);
      }
    } else {
      setAnimationKey(prev => prev + 1);
    }
  };


  const processResults = async (answers: Record<string, any>) => {
    if (!intakeEngine || !questionEngine) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Parse answers to profile for compatibility
      const profile = await intakeEngine.parseAnswers(answers, `session_${Date.now()}`);
      
      // Use enhancedRecoEngine directly with raw answers for better AI integration
      const results = await scoreProgramsEnhanced(answers, "strict");
      
      setState(prev => ({
        ...prev,
        profile,
        results,
        showResults: true,
        isProcessing: false,
        progress: 100
      }));

      onProfileGenerated?.(profile);
      onComplete?.(results);
    } catch (error) {
      console.error('Error processing results:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const resetWizard = () => {
    setState({
      currentQuestion: null,
      answers: {},
      currentPhase: 1,
      isProcessing: false,
      results: [],
      profile: null,
      showResults: false,
      showFinalPreview: false,
      progress: 0,
      currentQuestionIndex: 0,
      totalQuestions: 0,
      canGoBack: false,
      canGoForward: true,
      questionHistory: []
    });
    setAnimationKey(prev => prev + 1);
    
    // Restart with first question
    if (questionEngine) {
      const coreQuestions = questionEngine.getCoreQuestions();
      if (coreQuestions.length > 0) {
        setState(prev => ({
          ...prev,
          currentQuestion: coreQuestions[0],
          progress: 0
        }));
      }
    }
  };


  if (state.showResults && state.results.length > 0) {
    return <ResultsDisplay results={state.results} profile={state.profile} onReset={resetWizard} />;
  }

  if (state.isProcessing) {
    return <ProcessingDisplay />;
  }

  if (!state.currentQuestion) {
    return <LoadingDisplay />;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 font-sans">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-2xl">✨</div>
            <div>
              <h1 className="text-2xl font-bold text-blue-600 m-0">{t('reco.title')}</h1>
              <p className="text-sm text-gray-500 m-0">{t('reco.subtitle')}</p>
            </div>
          </div>
          
          {/* Advanced Search Link */}
          <div className="flex items-center">
            <Link 
              href="/advanced-search" 
              className="text-white bg-gradient-to-r from-blue-600 to-blue-700 no-underline text-sm font-semibold px-6 py-3 border-0 rounded-lg inline-block shadow-lg uppercase tracking-wide transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5"
            >
              {t('nav.advancedSearch')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-2">
        <div className="flex flex-col gap-6">

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transition-all duration-300 hover:shadow-xl" key={animationKey}>
            {/* Progress Bar */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="text-base text-gray-700 font-semibold text-center">{Math.round(state.progress)}% {t('wizard.complete')}</div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              {/* NEW: Program count display */}
              {state.remainingProgramCount !== undefined && (
                <div className="text-sm text-gray-600 text-center mt-2">
                  📊 <strong>{state.remainingProgramCount}</strong> {state.remainingProgramCount === 1 ? 'program' : 'programs'} {state.remainingProgramCount <= 15 ? 'matched so far' : 'remaining'}
                </div>
              )}
            </div>
            
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                {Object.keys(state.answers).length + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
                  {t(state.currentQuestion.symptom as any) || state.currentQuestion.symptom}
                </h3>
                
                {state.currentQuestion.type === 'single-select' && state.currentQuestion.options && (
                  <div className="space-y-3">
                    {state.currentQuestion.options.map((option, index) => (
                      <button
                        key={option.value}
                        className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group"
                        onClick={() => handleAnswer(option.value)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <span className="text-gray-700 font-medium group-hover:text-blue-700">{t(option.label as any) || option.label}</span>
                        <span className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200">→</span>
                      </button>
                    ))}
                  </div>
                )}

                {state.currentQuestion.type === 'text' && (
                  <div className="space-y-3">
                    <textarea
                      placeholder={t('wizard.tellUsMore')}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition-all duration-200"
                      rows={4}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const value = (e.target as HTMLTextAreaElement).value.trim();
                          if (value) handleAnswer(value);
                        }
                      }}
                    />
                    <div className="text-sm text-gray-500">
                      {t('wizard.textHint')}
                    </div>
                  </div>
                )}

                {state.currentQuestion.type === 'number' && (
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder={t('wizard.amountPlaceholder')}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value) handleAnswer(parseFloat(value));
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={goToPreviousQuestion}
                disabled={!state.canGoBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="text-lg">←</span>
                {t('wizard.previous')}
              </button>
              
              <div className="text-center">
                <span className="text-sm text-gray-600 font-medium">
                  {t('navigation.current')} {state.currentQuestionIndex + 1} {t('navigation.of')} {state.totalQuestions || '?'}
                </span>
              </div>
              
              <button 
                onClick={goToNextQuestion}
                disabled={!state.canGoForward}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {t('wizard.next')}
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* Answer Summary - Always Visible */}
          {Object.keys(state.answers).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-lg font-semibold text-gray-900">{t('wizard.answersSoFar')}</span>
                <span className="text-sm text-gray-500">({Object.keys(state.answers).length})</span>
              </div>
              
              <div className="space-y-4">
                {/* Program Preview - Show only if available */}
                {state.programPreview && state.programPreview.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-4">
                    {/* NEW: Preview Quality Indicator */}
                    {state.previewQuality && (
                      <div className={`flex justify-between items-center p-4 rounded-lg mb-4 font-semibold text-sm ${
                        state.previewQuality.color === 'green' ? 'bg-gradient-to-r from-green-100 to-green-200 border border-green-300 text-green-800' :
                        state.previewQuality.color === 'blue' ? 'bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-800' :
                        'bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300 text-orange-800'
                      }`}>
                        <span className="text-base font-bold">{state.previewQuality.message}</span>
                        <span className="text-sm opacity-80">
                          {state.programPreview[0]?.score ? `${Math.round(state.programPreview[0].score)}% match` : ''}
                        </span>
                      </div>
                    )}
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">🎯 {t('wizard.topMatches')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {state.programPreview.slice(0, 3).map((program, index) => (
                          <div key={program.id || index} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">{index + 1}</div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">{program.name || 'Unknown Program'}</div>
                              <div className="text-xs text-blue-600 font-semibold">{Math.round(program.score || 0)}% match</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* View Full Results Button - Show only when final preview is shown */}
                      {state.showFinalPreview && (
                        <div className="mt-4 text-center">
                          <button 
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
                            onClick={async () => {
                              // Process full results and navigate to results page
                              await processResults(state.answers);
                            }}
                          >
                            📊 View Full Results ({state.programPreview.length} programs)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wizard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .wizard-main {
          max-width: 64rem;
          margin: 0 auto;
          padding: 1rem 1.5rem;
        }

        .wizard-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .wizard-header {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .wizard-header-content {
          max-width: 64rem;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .wizard-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .wizard-logo-icon {
          padding: 0.5rem;
          background: #3B82F6;
          border-radius: 0.75rem;
          font-size: 2rem;
        }

        .wizard-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3B82F6;
          margin: 0;
        }

        .wizard-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .wizard-progress {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .wizard-progress-text {
          font-size: 1rem;
          color: #374151;
          font-weight: 600;
          text-align: center;
        }

        .wizard-progress-bar {
          width: 100%;
          height: 0.75rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .wizard-progress-fill {
          height: 100%;
          background: #3B82F6;
          border-radius: 9999px;
          transition: width 0.5s ease-out;
        }

        .wizard-main {
          max-width: 64rem;
          margin: 0 auto;
          padding: 0.5rem 1.5rem;
        }

        .wizard-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .wizard-advanced-search {
          display: flex;
          align-items: center;
        }

        .wizard-advanced-search-link,
        .wizard-advanced-search a,
        .wizard-advanced-search .wizard-advanced-search-link {
          color: white !important;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%) !important;
          text-decoration: none !important;
          font-size: 1rem !important;
          font-weight: 700 !important;
          padding: 1rem 2rem !important;
          border: none !important;
          border-radius: 0.75rem !important;
          transition: all 0.2s ease !important;
          display: inline-block !important;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          cursor: pointer !important;
        }

        .wizard-advanced-search-link:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%) !important;
          color: white !important;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
        }

        .wizard-navigation {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 231, 235, 0.5);
          border-radius: 1rem;
          padding: 1.5rem;
          margin: 1rem 0;
        }

        .wizard-navigation-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .wizard-nav-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wizard-nav-back {
          background: #f8fafc;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .wizard-nav-back:hover:not(:disabled) {
          background: #f1f5f9;
          color: #374151;
        }

        .wizard-nav-back:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wizard-nav-next {
          background: #3B82F6 !important;
          color: white !important;
        }

        .wizard-nav-next:hover:not(:disabled) {
          background: #2563EB !important;
          color: white !important;
        }

        .wizard-nav-next:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wizard-navigation-info {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wizard-question-counter {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .wizard-nav-icon {
          font-size: 1rem;
          font-weight: bold;
        }

        .wizard-phase-indicator {
          text-align: center;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 2rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
        }

        .wizard-phase-icon {
          padding: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 0.5rem;
          font-size: 1.5rem;
        }

        .wizard-phase-title {
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .wizard-phase-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .wizard-question-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 1.5rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
          margin-bottom: 2rem;
          min-height: 400px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .wizard-question-content {
          padding: 2rem;
          display: flex;
          gap: 1rem;
        }

        .wizard-question-number {
          flex-shrink: 0;
          width: 3rem;
          height: 3rem;
          background: #3B82F6;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .wizard-question-body {
          flex: 1;
        }

        .wizard-question-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }

        .wizard-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .wizard-option {
          width: 100%;
          text-align: left;
          padding: 1rem;
          border-radius: 1rem;
          border: 2px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: fadeInUp 0.4s ease-out both;
        }

        .wizard-option:hover {
          border-color: #a5b4fc;
          background: #f0f9ff;
          transform: translateX(4px);
        }

        .wizard-option:active {
          transform: scale(0.98);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .wizard-option-text {
          font-weight: 500;
          color: #111827;
        }

        .wizard-option-arrow {
          color: #9ca3af;
          font-size: 1.25rem;
          transition: all 0.2s ease;
        }

        .wizard-option:hover .wizard-option-arrow {
          color: #6366f1;
          transform: translateX(4px);
        }

        .wizard-text-input {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wizard-textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 1rem;
          resize: none;
          height: 6rem;
          font-family: inherit;
          font-size: 1rem;
          color: #111827;
          background: white;
          transition: border-color 0.2s ease;
        }

        .wizard-textarea:focus {
          outline: none;
          border-color: #6366f1;
        }

        .wizard-text-hint {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .wizard-number-input {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wizard-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 1rem;
          font-family: inherit;
          font-size: 1rem;
          color: #111827;
          background: white;
          transition: border-color 0.2s ease;
        }

        .wizard-input:focus {
          outline: none;
          border-color: #6366f1;
        }

        .wizard-answer-summary {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          padding: 1.5rem;
        }

        .wizard-summary-title {
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .wizard-summary-icon {
          color: #10b981;
          font-size: 1.25rem;
        }

        .wizard-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .wizard-summary-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .wizard-summary-dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #6366f1;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .wizard-summary-label {
          color: #6b7280;
          text-transform: capitalize;
        }

        .wizard-summary-value {
          font-weight: 500;
          color: #111827;
        }
      `}</style>
    </div>
  );
};

// Results Display Component
const ResultsDisplay: React.FC<{
  results: EnhancedProgramResult[];
  profile: any | null;
  onReset: () => void;
}> = ({ results, onReset }) => {
  const { t } = useI18n();
  const [selectedResult, setSelectedResult] = useState<EnhancedProgramResult | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'linear-gradient(135deg, #ef4444, #ec4899)';
      case 'medium': return 'linear-gradient(135deg, #f59e0b, #f97316)';
      case 'low': return 'linear-gradient(135deg, #10b981, #059669)';
      default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '⭐';
      case 'medium': return '📊';
      case 'low': return '✅';
      default: return '✨';
    }
  };

  return (
    <div className="results-container">
      {/* Header */}
      <div className="results-header">
        <div className="results-header-content">
          <div className="results-logo">
            <div className="results-logo-icon">✓</div>
            <div>
              <h1 className="results-title">Your Perfect Matches</h1>
              <p className="results-subtitle">We found {results.length} funding opportunities for you</p>
            </div>
          </div>
          
          <button onClick={onReset} className="results-reset-btn">
            <span>🔄</span>
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="results-main">
        <div className="results-grid">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="results-card"
              onClick={() => setSelectedResult(result)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Card Header */}
              <div className="results-card-header">
                <div className="results-card-title-section">
                  <h3 className="results-card-title">{result.name}</h3>
                  <div className="results-card-institution">
                    <span>🏢</span>
                    <span>{result.source || 'Unknown'}</span>
                  </div>
                </div>
                
                {/* Score Badge */}
                <div className="results-score-section">
                  <div 
                    className="results-score-badge"
                    style={{ background: getPriorityColor(result.confidence) }}
                  >
                    <span>{getPriorityIcon(result.confidence)}</span>
                    <span>{result.score}%</span>
                  </div>
                  <div className="results-priority-text">
                    {result.confidence} confidence
                  </div>
                </div>
              </div>

              {/* Funding Type */}
              <div className="results-funding-type">
                <span>💰</span>
                <span className="results-funding-text">{result.type} Funding</span>
              </div>

              {/* Card Body */}
              <div className="results-card-body">
                {/* Match Reasons */}
                <div className="results-match-reasons">
                  <h4 className="results-section-title">Why this matches you:</h4>
                  {result.why?.slice(0, 2).map((reason: string, reasonIndex: number) => (
                    <div key={reasonIndex} className="results-reason-item">
                      <div className="results-reason-dot"></div>
                      <span className="results-reason-text">{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="results-stats">
                  <div className="results-stat">
                    <span>📍</span>
                    <span className="results-stat-label">Location</span>
                  </div>
                  <div className="results-stat-value">
                    {result.tags?.join(', ') || 'Various'}
                  </div>
                  
                  <div className="results-stat">
                    <span>⏰</span>
                    <span className="results-stat-label">Deadline</span>
                  </div>
                  <div className="results-stat-value">
                    {'Rolling'}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="results-card-footer">
                <span className="results-click-hint">Click to view details</span>
                <span className="results-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <div className="results-modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="results-modal" onClick={(e) => e.stopPropagation()}>
            <div className="results-modal-content">
              <div className="results-modal-header">
                <div>
                  <h2 className="results-modal-title">{selectedResult.name}</h2>
                  <div className="results-modal-meta">
                    <div className="results-modal-institution">
                      <span>🏢</span>
                      <span>{selectedResult.source || 'Unknown'}</span>
                    </div>
                    <div className="results-modal-funding">
                      <span>💰</span>
                      <span className="capitalize">{selectedResult.type}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedResult(null)}
                  className="results-modal-close"
                >
                  ×
                </button>
              </div>

              {/* Score and Priority */}
              <div className="results-modal-score">
                <div 
                  className="results-modal-score-badge"
                  style={{ background: getPriorityColor(selectedResult.confidence) }}
                >
                  <span>{getPriorityIcon(selectedResult.confidence)}</span>
                  <span>{selectedResult.score}% Match</span>
                </div>
                <div className="results-modal-priority-text">
                  {selectedResult.confidence} {t('results.confidenceRecommendation')}
                </div>
              </div>

              {/* Description */}
              {selectedResult.notes && (
                <div className="results-modal-section">
                  <h3 className="results-modal-section-title">{t('results.description')}</h3>
                  <p className="results-modal-description">{selectedResult.notes}</p>
                </div>
              )}

              {/* Match Reasons */}
              <div className="results-modal-section">
                <h3 className="results-modal-section-title">{t('results.whyMatches')}</h3>
                <div className="results-modal-reasons">
                  {selectedResult.why?.map((reason: string, index: number) => (
                    <div key={index} className="results-modal-reason">
                      <span className="results-modal-check">✓</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps */}
              {selectedResult.gaps && selectedResult.gaps.length > 0 && (
                <div className="results-modal-section">
                  <h3 className="results-modal-section-title">Requirements to consider</h3>
                  <div className="results-modal-gaps">
                    {selectedResult.gaps?.map((gap: any, index: number) => (
                      <div key={index} className="results-modal-gap">
                        <span className="results-modal-warning">⚠️</span>
                        <span>{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="results-modal-section">
                <h3 className="results-modal-section-title">Next Steps</h3>
                <div className="results-modal-steps">
                  {selectedResult.matchedCriteria?.map((step: any, index: number) => (
                    <div key={index} className="results-modal-step">
                      <span className="results-modal-document">📄</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="results-modal-actions">
                <button className="results-modal-apply">
                  Apply Now
                </button>
                <button className="results-modal-save">
                  Save for Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .results-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .results-header {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .results-header-content {
          max-width: 80rem;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .results-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .results-logo-icon {
          padding: 0.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 0.75rem;
          font-size: 2rem;
        }

        .results-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .results-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .results-reset-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .results-reset-btn:hover {
          background: #e5e7eb;
        }

        .results-main {
          max-width: 80rem;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .results-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 1.5rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: slideInUp 0.6s ease-out both;
        }

        .results-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .results-card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .results-card-title-section {
          flex: 1;
        }

        .results-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
          transition: color 0.2s ease;
        }

        .results-card:hover .results-card-title {
          color: #6366f1;
        }

        .results-card-institution {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .results-score-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .results-score-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 9999px;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .results-priority-text {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .results-funding-type {
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6366f1;
        }

        .results-card-body {
          padding: 1.5rem;
        }

        .results-match-reasons {
          margin-bottom: 1.5rem;
        }

        .results-section-title {
          font-weight: 600;
          color: #111827;
          font-size: 0.875rem;
          margin: 0 0 0.75rem 0;
        }

        .results-reason-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .results-reason-dot {
          width: 0.375rem;
          height: 0.375rem;
          background: #6366f1;
          border-radius: 50%;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }

        .results-reason-text {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .results-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          font-size: 0.875rem;
        }

        .results-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
        }

        .results-stat-value {
          color: #111827;
          font-weight: 500;
        }

        .results-card-footer {
          padding: 1rem 1.5rem;
          background: rgba(249, 250, 251, 0.5);
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .results-arrow {
          transition: all 0.2s ease;
        }

        .results-card:hover .results-arrow {
          color: #6366f1;
          transform: translateX(4px);
        }

        .results-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .results-modal {
          background: white;
          border-radius: 1.5rem;
          max-width: 32rem;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .results-modal-content {
          padding: 2rem;
        }

        .results-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .results-modal-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .results-modal-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #6b7280;
        }

        .results-modal-institution,
        .results-modal-funding {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .results-modal-close {
          padding: 0.5rem;
          background: #f3f4f6;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          font-size: 1.5rem;
          color: #6b7280;
          transition: background-color 0.2s ease;
        }

        .results-modal-close:hover {
          background: #e5e7eb;
        }

        .results-modal-score {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .results-modal-score-badge {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .results-modal-priority-text {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .results-modal-section {
          margin-bottom: 1.5rem;
        }

        .results-modal-section-title {
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem 0;
        }

        .results-modal-description {
          color: #6b7280;
          line-height: 1.6;
        }

        .results-modal-reasons,
        .results-modal-gaps,
        .results-modal-steps {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .results-modal-reason,
        .results-modal-gap,
        .results-modal-step {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .results-modal-check {
          color: #10b981;
          font-weight: 700;
        }

        .results-modal-warning {
          color: #f59e0b;
        }

        .results-modal-document {
          color: #6366f1;
        }

        .results-modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .results-modal-apply {
          flex: 1;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .results-modal-apply:hover {
          background: linear-gradient(135deg, #5b21b6, #7c3aed);
        }

        .results-modal-save {
          padding: 0.75rem 1.5rem;
          border: 2px solid #e5e7eb;
          color: #374151;
          background: white;
          border-radius: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .results-modal-save:hover {
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

// Processing Display Component
const ProcessingDisplay: React.FC = () => {
  return (
    <div className="processing-container">
      <div className="processing-content">
        <div className="processing-spinner">✨</div>
        <h2 className="processing-title">Finding Your Perfect Matches</h2>
        <p className="processing-description">
          We're analyzing your profile and matching you with the best funding opportunities...
        </p>
        <div className="processing-dots">
          <div className="processing-dot"></div>
          <div className="processing-dot"></div>
          <div className="processing-dot"></div>
        </div>
      </div>

      <style jsx>{`
        .processing-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .processing-content {
          text-align: center;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .processing-spinner {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1.5rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .processing-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .processing-description {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0 0 2rem 0;
        }

        .processing-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .processing-dot {
          width: 0.75rem;
          height: 0.75rem;
          background: #6366f1;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .processing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .processing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Loading Display Component
const LoadingDisplay: React.FC = () => {
  const { t } = useI18n();
  
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner">✨</div>
        <h2 className="loading-title">{t('wizard.preparingJourney')}</h2>
        <p className="loading-description">
          {t('wizard.preparingJourneyDescription')}
        </p>
      </div>

      <style jsx>{`
        .loading-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .loading-content {
          text-align: center;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .loading-spinner {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1.5rem;
          animation: breathe 2s ease-in-out infinite;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .loading-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .loading-description {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0;
        }

        /* Answer Summary Styles */
        .wizard-answer-summary {
          margin-top: 2rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          overflow: hidden;
        }

        .wizard-summary-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          background: rgba(249, 250, 251, 0.5);
          border-bottom: 1px solid #f3f4f6;
          text-align: left;
        }

        .wizard-summary-icon {
          color: #10b981;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .wizard-summary-title {
          font-weight: 600;
          color: #111827;
          font-size: 1rem;
        }

        .wizard-summary-count {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
        }


        .wizard-program-preview {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-radius: 0.75rem;
          border: 1px solid #bae6fd;
        }

        .wizard-preview-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0c4a6e;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .wizard-preview-list {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
          gap: 1.5rem !important;
          margin-top: 1.5rem !important;
        }

        .wizard-preview-item {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 1.5rem !important;
          border: 1px solid rgba(229, 231, 235, 0.5) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
          overflow: hidden !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          animation: slideInUp 0.6s ease-out both !important;
          padding: 0;
        }

        .wizard-preview-item:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .wizard-preview-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .wizard-preview-title-section {
          flex: 1;
        }

        .wizard-preview-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
          transition: color 0.2s ease;
        }

        .wizard-preview-item:hover .wizard-preview-name {
          color: #6366f1;
        }

        .wizard-preview-institution {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .wizard-preview-score-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .wizard-preview-score-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 9999px;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .wizard-preview-priority-text {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .wizard-preview-body {
          padding: 1.5rem;
        }

        .wizard-preview-description {
          color: #6b7280;
          line-height: 1.6;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .wizard-preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .wizard-preview-tag {
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          color: #374151;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .wizard-preview-footer {
          padding: 1rem 1.5rem;
          background: rgba(249, 250, 251, 0.5);
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .wizard-preview-arrow {
          transition: all 0.2s ease;
        }

        .wizard-preview-item:hover .wizard-preview-arrow {
          color: #6366f1;
          transform: translateX(4px);
        }

        .wizard-final-preview-actions {
          margin-top: 1.5rem;
          text-align: center;
        }

        .wizard-view-results-btn {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          color: white;
          border: none;
          border-radius: 0.75rem;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .wizard-view-results-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .wizard-view-results-btn:active {
          transform: translateY(0);
        }

        .wizard-answers-list {
          margin-top: 1rem;
        }

        .wizard-answers-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.75rem 0;
        }

        .wizard-answers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .wizard-answer-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .wizard-answer-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .wizard-answer-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .wizard-progress {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .wizard-progress-text {
          font-size: 1rem;
          font-weight: 700;
          color: #374151;
          min-width: 3.5rem;
        }

        .wizard-progress-bar {
          flex: 1;
          height: 0.75rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .wizard-progress-fill {
          height: 100%;
          background: #3B82F6;
          border-radius: 9999px;
          transition: width 0.5s ease-out;
        }

        .wizard-summary-content {
          padding: 0 1.5rem 1.5rem 1.5rem;
          border-top: 1px solid rgba(229, 231, 235, 0.5);
        }

        .wizard-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .wizard-summary-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(249, 250, 251, 0.5);
          border-radius: 0.5rem;
          transition: background-color 0.2s ease;
        }

        .wizard-summary-item:hover {
          background: rgba(243, 244, 246, 0.8);
        }

        .wizard-summary-dot {
          width: 0.375rem;
          height: 0.375rem;
          background: #6366f1;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .wizard-summary-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .wizard-summary-value {
          color: #111827;
          font-weight: 600;
          font-size: 0.875rem;
        }

        /* Program Preview Styles */
        .wizard-program-preview {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(229, 231, 235, 0.5);
        }

        /* NEW: Preview Quality Indicator Styles */
        .wizard-quality-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .wizard-quality-green {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border: 1px solid #10b981;
          color: #065f46;
        }

        .wizard-quality-blue {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border: 1px solid #3b82f6;
          color: #1e40af;
        }

        .wizard-quality-orange {
          background: linear-gradient(135deg, #fed7aa, #fdba74);
          border: 1px solid #f59e0b;
          color: #92400e;
        }

        .wizard-quality-message {
          font-size: 1rem;
          font-weight: 700;
        }

        .wizard-quality-score {
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .wizard-preview-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .wizard-preview-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .wizard-preview-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .wizard-preview-item:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .wizard-preview-rank {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          background: #3B82F6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .wizard-preview-content {
          flex: 1;
        }

        .wizard-preview-name {
          font-weight: 600;
          color: #111827;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .wizard-preview-score {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default SmartWizard;
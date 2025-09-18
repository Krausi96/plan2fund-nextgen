// Overlay Micro-Questions Component
import React, { useState, useEffect } from 'react';
import { FundingProfile } from '@/lib/schemas/fundingProfile';
import { intakeParser } from '@/lib/intakeParser';
import analytics from '@/lib/analytics';

interface OverlayQuestionsProps {
  profile: FundingProfile;
  questionTypes: string[];
  onComplete: (updatedProfile: FundingProfile) => void;
  onCancel: () => void;
}

interface QuestionState {
  field: string;
  value: any;
  answered: boolean;
}

export default function OverlayQuestions({ 
  profile, 
  questionTypes, 
  onComplete, 
  onCancel 
}: OverlayQuestionsProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generate overlay questions
    const overlayQuestions = intakeParser.getOverlayQuestions(questionTypes);
    setQuestions(overlayQuestions);
    
    // Initialize question states
    const states: Record<string, QuestionState> = {};
    overlayQuestions.forEach(q => {
      states[q.field] = {
        field: q.field,
        value: profile[q.field as keyof FundingProfile] || null,
        answered: false
      };
    });
    setQuestionStates(states);
  }, [questionTypes, profile]);

  const handleAnswer = (field: string, value: any) => {
    setQuestionStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        answered: true
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Update profile with answers
      const updatedProfile: FundingProfile = { ...profile };
      
      Object.values(questionStates).forEach(state => {
        if (state.answered && state.value !== null) {
          (updatedProfile as any)[state.field] = state.value;
          // Update confidence for answered fields
          updatedProfile.confidence[state.field as keyof typeof updatedProfile.confidence] = 0.9;
        }
      });

      // Track overlay completion
      await analytics.trackEvent({
        event: 'overlay_questions_completed',
        properties: {
          questionsAnswered: Object.values(questionStates).filter(s => s.answered).length,
          totalQuestions: questions.length,
          fields: Object.keys(questionStates)
        }
      });

      onComplete(updatedProfile);
    } catch (error) {
      console.error('Error submitting overlay answers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentState = currentQuestion ? questionStates[currentQuestion.field] : null;
  const isAnswered = currentState?.answered || false;
  const canProceed = isAnswered || !currentQuestion?.required;

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Questions
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            We need a few more details to find the best programs for you
          </p>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          {currentQuestion && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {currentQuestion.question}
              </h3>

              {/* Sector Question */}
              {currentQuestion.field === 'sector' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer('sector', option)}
                      className={`w-full p-3 text-left border rounded-lg transition-all ${
                        currentState?.value === option
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Stage Question */}
              {currentQuestion.field === 'stage' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer('stage', option)}
                      className={`w-full p-3 text-left border rounded-lg transition-all ${
                        currentState?.value === option
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium capitalize">{option}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {option === 'idea' && 'Just an idea or concept'}
                        {option === 'mvp' && 'Prototype or beta version ready'}
                        {option === 'revenue' && 'Generating revenue from customers'}
                        {option === 'growth' && 'Growing and expanding business'}
                        {option === 'scaleup' && 'Established and scaling rapidly'}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Funding Need Question */}
              {currentQuestion.field === 'funding_need_eur' && (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                    <input
                      type="number"
                      value={currentState?.value || ''}
                      onChange={(e) => handleAnswer('funding_need_eur', parseInt(e.target.value) || null)}
                      placeholder="Enter amount in EUR"
                      className="block w-full pl-7 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Examples: 50000, 150000, 500000
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

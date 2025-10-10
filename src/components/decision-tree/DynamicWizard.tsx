// Dynamic Decision Tree Wizard - Phase 3 Step 1
import React, { useState, useEffect } from 'react';
import { DecisionTreeQuestion, DecisionTreeResult } from '../../lib/dynamicDecisionTree';
import { conditionalQuestionEngine, ConditionalQuestion } from '../../lib/conditionalQuestionEngine';

interface DynamicWizardProps {
  programId: string;
  onComplete: (answers: Record<string, any>) => void;
  onCancel: () => void;
}

interface WizardState {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  isGenerating: boolean;
  isSubmitting: boolean;
  error: string | null;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } | null;
  conditionalQuestions: ConditionalQuestion[];
  userProfile: Record<string, any>;
}

export const DynamicWizard: React.FC<DynamicWizardProps> = ({
  programId,
  onComplete,
  onCancel
}) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentQuestionIndex: 0,
    answers: {},
    isGenerating: false,
    isSubmitting: false,
    error: null,
    validation: null,
    conditionalQuestions: [],
    userProfile: {}
  });

  const [decisionTree, setDecisionTree] = useState<DecisionTreeResult | null>(null);

  // Generate decision tree on component mount
  useEffect(() => {
    generateDecisionTree();
  }, [programId]);

  const generateDecisionTree = async () => {
    setWizardState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // First try to get structured requirements from the new API
      const requirementsResponse = await fetch(`/api/programmes/${programId}/requirements`);
      if (requirementsResponse.ok) {
        const requirements = await requirementsResponse.json();
        
        // Use decision tree engine to generate questions from program data
        const { createDecisionTreeEngine } = await import('../../lib/dynamicDecisionTree');
        
        // Get program data for decision tree engine
        const programData = requirements.library?.[0] || {};
        const decisionTreeEngine = createDecisionTreeEngine([programData]);
        
        // Generate decision tree questions using the engine
        const decisionTreeResult = decisionTreeEngine.generateDecisionTree(programId);
        const decisionTreeQuestions = decisionTreeResult.questions;
        
        // Generate conditional questions from categorized requirements
        // let conditionalQuestions: ConditionalQuestion[] = [];
        // if (requirements.data_source === 'categorized_requirements' && requirements.library?.[0]?.categorized_requirements) {
        //   conditionalQuestions = conditionalQuestionEngine.generateFromCategorizedRequirements(
        //     requirements.library[0].categorized_requirements
        //   );
        // }
        
        // Set user profile for conditional logic
        const userProfile = {
          entity_stage: wizardState.answers.q2_entity_stage,
          company_size: wizardState.answers.q3_company_size,
          industry: wizardState.answers.q8_industry,
          funding_type: wizardState.answers.q6_funding_amount,
          location: wizardState.answers.q1_country
        };
        
        conditionalQuestionEngine.setUserContext(wizardState.answers, userProfile);
        const relevantConditionalQuestions = conditionalQuestionEngine.getRelevantQuestions();
        
        // Combine decision tree and conditional questions
        const allQuestions = [
          ...decisionTreeQuestions.map((q: any) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options || [],
            required: q.required,
            program_specific: q.program_specific,
            validation_rules: q.validation_rules || [],
            follow_up_questions: q.follow_up_questions || [],
            ai_guidance: q.ai_guidance || 'eligibility'
          })),
          ...relevantConditionalQuestions.map((q: ConditionalQuestion) => ({
            id: q.id,
            question: q.question_text,
            type: 'single' as const,
            options: q.answer_options.map((opt: string) => ({ value: opt, label: opt })),
            required: q.required,
            program_specific: false,
            validation_rules: q.validation_rules || [],
            follow_up_questions: q.follow_up_questions || [],
            ai_guidance: q.category
          }))
        ];
        
        const result = {
          success: true,
          data: {
            programId,
            questions: allQuestions,
            total_questions: allQuestions.length,
            estimated_time: allQuestions.length * 2, // 2 minutes per question
            difficulty: allQuestions.length > 5 ? 'hard' as const : allQuestions.length > 3 ? 'medium' as const : 'easy' as const
          }
        };
        
        setDecisionTree(result.data);
        setWizardState(prev => ({ ...prev, isGenerating: false }));
        return;
      }
      
      // Fallback to original decision tree generation
      const response = await fetch(`/api/decision-tree?action=generate&programId=${programId}`);
      const result = await response.json();

      if (result.success) {
        setDecisionTree(result.data);
        setWizardState(prev => ({ ...prev, isGenerating: false }));
      } else {
        throw new Error(result.message || 'Failed to generate decision tree');
      }
    } catch (error) {
      console.error('Error generating decision tree:', error);
      setWizardState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate decision tree'
      }));
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setWizardState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };

  const handleNext = () => {
    if (decisionTree && wizardState.currentQuestionIndex < decisionTree.questions.length - 1) {
      setWizardState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };

  const handlePrevious = () => {
    if (wizardState.currentQuestionIndex > 0) {
      setWizardState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };

  const handleSubmit = async () => {
    setWizardState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Validate answers
      const response = await fetch('/api/decision-tree?action=validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programId,
          answers: wizardState.answers
        })
      });

      const result = await response.json();

      if (result.success) {
        setWizardState(prev => ({
          ...prev,
          isSubmitting: false,
          validation: result.data
        }));

        if (result.data.valid) {
          onComplete(wizardState.answers);
        }
      } else {
        throw new Error(result.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating answers:', error);
      setWizardState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }));
    }
  };

  const renderQuestion = (question: DecisionTreeQuestion) => {
    const currentAnswer = wizardState.answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={currentAnswer === option.value}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(currentAnswer) && currentAnswer.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...currentValues, option.value]);
                    } else {
                      handleAnswerChange(question.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            minLength={question.validation_rules?.min_length}
            maxLength={question.validation_rules?.max_length}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
            placeholder="Enter a number..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={question.validation_rules?.min_value}
            max={question.validation_rules?.max_value}
          />
        );

      case 'boolean':
        return (
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={currentAnswer === true}
                onChange={() => handleAnswerChange(question.id, true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={currentAnswer === false}
                onChange={() => handleAnswerChange(question.id, false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">No</span>
            </label>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (wizardState.isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating personalized questions...</p>
        </div>
      </div>
    );
  }

  if (wizardState.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{wizardState.error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={generateDecisionTree}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!decisionTree) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No decision tree available for this program.</p>
      </div>
    );
  }

  const currentQuestion = decisionTree.questions[wizardState.currentQuestionIndex];
  const isLastQuestion = wizardState.currentQuestionIndex === decisionTree.questions.length - 1;
  const progress = ((wizardState.currentQuestionIndex + 1) / decisionTree.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Program Assessment
        </h2>
        <p className="text-gray-600">
          Answer these {decisionTree.total_questions} questions to get personalized guidance
        </p>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Question {wizardState.currentQuestionIndex + 1} of {decisionTree.questions.length}</span>
            <span>~{decisionTree.estimated_time} min</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentQuestion.question}
            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {currentQuestion.ai_guidance && (
            <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
              💡 {currentQuestion.ai_guidance}
            </p>
          )}
        </div>

        {renderQuestion(currentQuestion)}
      </div>

      {/* Validation Messages */}
      {wizardState.validation && (
        <div className="mb-6">
          {wizardState.validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                {wizardState.validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {wizardState.validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {wizardState.validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {wizardState.validation.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside text-sm text-blue-700">
                {wizardState.validation.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancel
        </button>

        <div className="flex space-x-3">
          {wizardState.currentQuestionIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
            >
              Previous
            </button>
          )}

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={wizardState.isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md font-medium"
            >
              {wizardState.isSubmitting ? 'Submitting...' : 'Complete Assessment'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicWizard;

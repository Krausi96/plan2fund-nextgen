/**
 * Inline Setup Bar Component
 * Embedded at the top of the editor for seamless onboarding
 * 5-7 plain questions with instant sidebar updates
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface BusinessQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required: boolean;
  businessFriendly?: boolean;
}

const BUSINESS_QUESTIONS: BusinessQuestion[] = [
  {
    id: 'business_name',
    label: 'Business Name',
    type: 'text',
    placeholder: 'Enter your business name',
    required: true,
    businessFriendly: true
  },
  {
    id: 'business_stage',
    label: 'Business Stage',
    type: 'select',
    options: [
      { value: 'idea', label: 'Just an idea' },
      { value: 'early', label: 'Early stage (0-2 years)' },
      { value: 'growth', label: 'Growth stage (2-5 years)' },
      { value: 'established', label: 'Established (5+ years)' }
    ],
    required: true,
    businessFriendly: true
  },
  {
    id: 'sector',
    label: 'Sector',
    type: 'select',
    options: [
      { value: 'tech', label: 'Technology' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'finance', label: 'Finance' },
      { value: 'education', label: 'Education' },
      { value: 'retail', label: 'Retail' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'other', label: 'Other' }
    ],
    required: true,
    businessFriendly: true
  },
  {
    id: 'funding_amount',
    label: 'Funding Amount',
    type: 'select',
    options: [
      { value: '0-10k', label: '€0 - €10,000' },
      { value: '10k-50k', label: '€10,000 - €50,000' },
      { value: '50k-100k', label: '€50,000 - €100,000' },
      { value: '100k-500k', label: '€100,000 - €500,000' },
      { value: '500k+', label: '€500,000+' }
    ],
    required: true,
    businessFriendly: true
  },
  {
    id: 'timeline',
    label: 'When do you need funding?',
    type: 'select',
    options: [
      { value: 'immediately', label: 'Immediately' },
      { value: '1-3months', label: 'Within 1-3 months' },
      { value: '3-6months', label: 'Within 3-6 months' },
      { value: '6-12months', label: 'Within 6-12 months' },
      { value: '12+months', label: 'More than 12 months' }
    ],
    required: true,
    businessFriendly: true
  },
  {
    id: 'collateral',
    label: 'Can provide collateral?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'partial', label: 'Partial' }
    ],
    required: false,
    businessFriendly: true
  },
  {
    id: 'equity',
    label: 'Open to equity funding?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'maybe', label: 'Maybe' }
    ],
    required: false,
    businessFriendly: true
  }
];

interface InlineSetupBarProps {
  userAnswers?: Record<string, any>;
  onAnswersUpdate: (answers: Record<string, any>) => void;
  onSetupComplete?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function InlineSetupBar({ 
  userAnswers = {}, 
  onAnswersUpdate, 
  onSetupComplete,
  isCollapsed = false,
  onToggleCollapse
}: InlineSetupBarProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(userAnswers);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setAnswers(userAnswers);
    // Check if setup is complete
    const requiredQuestions = BUSINESS_QUESTIONS.filter(q => q.required);
    const answeredRequired = requiredQuestions.every(q => userAnswers[q.id]);
    setIsComplete(answeredRequired);
  }, [userAnswers]);

  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    onAnswersUpdate(newAnswers);
    
    // Auto-advance to next question
    if (currentStep < BUSINESS_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 500);
    } else {
      setIsComplete(true);
      onSetupComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < BUSINESS_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      onSetupComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentStep < BUSINESS_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      onSetupComplete?.();
    }
  };

  const currentQuestion = BUSINESS_QUESTIONS[currentStep];
  const isCurrentQuestionAnswered = answers[currentQuestion.id] && answers[currentQuestion.id] !== '';

  const getCompletionPercentage = () => {
    const answered = BUSINESS_QUESTIONS.filter(q => answers[q.id] && answers[q.id] !== '').length;
    return Math.round((answered / BUSINESS_QUESTIONS.length) * 100);
  };

  const getUnknownFields = () => {
    return BUSINESS_QUESTIONS.filter(q => !answers[q.id] || answers[q.id] === '');
  };

  if (isCollapsed) {
    return (
      <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-blue-900">
              Setup Progress: {getCompletionPercentage()}%
            </div>
            <div className="flex gap-1">
              {BUSINESS_QUESTIONS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-blue-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleCollapse}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            {isComplete ? 'Setup Complete' : 'Continue Setup'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Quick Setup
          </h3>
          <p className="text-sm text-gray-600">
            Answer a few questions to personalize your experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            {getCompletionPercentage()}% Complete
          </Badge>
          {onToggleCollapse && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>

        {/* Current Question */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {currentQuestion.label}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <span className="text-xs text-gray-500">
              {currentStep + 1} of {BUSINESS_QUESTIONS.length}
            </span>
          </div>

          {currentQuestion.type === 'text' && (
            <Input
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="w-full"
            />
          )}

          {currentQuestion.type === 'textarea' && (
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={3}
              className="w-full"
            />
          )}

          {currentQuestion.type === 'select' && (
            <select
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an option...</option>
              {currentQuestion.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSkip}
                disabled={currentQuestion.required}
              >
                Skip
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={currentQuestion.required && !isCurrentQuestionAnswered}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === BUSINESS_QUESTIONS.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Unknown Fields Summary */}
        {getUnknownFields().length > 0 && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            <strong>Missing:</strong> {getUnknownFields().map(q => q.label).join(', ')}
          </div>
        )}
      </div>
    </Card>
  );
}

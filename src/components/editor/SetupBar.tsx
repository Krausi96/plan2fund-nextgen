/**
 * Inline setup bar for editor
 * Converts wizard questions into business-friendly components
 * Removes funding type input, keeps business questions only
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SetupBarProps {
  userAnswers: Record<string, any>;
  onAnswersUpdate: (answers: Record<string, any>) => void;
  onSetupComplete: () => void;
}

interface BusinessQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
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
    id: 'business_description',
    label: 'What does your business do?',
    type: 'textarea',
    placeholder: 'Describe your business in 2-3 sentences',
    required: true,
    businessFriendly: true
  },
  {
    id: 'target_market',
    label: 'Who are your customers?',
    type: 'textarea',
    placeholder: 'Describe your target market and customer segments',
    required: true,
    businessFriendly: true
  },
  {
    id: 'revenue_model',
    label: 'How do you make money?',
    type: 'textarea',
    placeholder: 'Explain your revenue model and pricing strategy',
    required: true,
    businessFriendly: true
  },
  {
    id: 'team_size',
    label: 'Team Size',
    type: 'select',
    options: [
      { value: '1', label: 'Just me (solo founder)' },
      { value: '2-5', label: '2-5 people' },
      { value: '6-10', label: '6-10 people' },
      { value: '11-25', label: '11-25 people' },
      { value: '25+', label: '25+ people' }
    ],
    required: true,
    businessFriendly: true
  },
  {
    id: 'funding_amount',
    label: 'Funding Amount Needed',
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
    id: 'use_of_funds',
    label: 'How will you use the funding?',
    type: 'textarea',
    placeholder: 'Describe how you plan to use the funding (e.g., product development, marketing, hiring)',
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
  }
];

export default function SetupBar({ userAnswers, onAnswersUpdate, onSetupComplete }: SetupBarProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(userAnswers || {});
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setAnswers(userAnswers || {});
  }, [userAnswers]);

  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    onAnswersUpdate(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < BUSINESS_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      onSetupComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < BUSINESS_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      onSetupComplete();
    }
  };

  const currentQuestion = BUSINESS_QUESTIONS[currentStep];
  const isCurrentQuestionAnswered = answers[currentQuestion.id] && answers[currentQuestion.id].trim() !== '';

  const renderQuestionInput = (question: BusinessQuestion) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full min-h-[100px]"
            rows={3}
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full"
          />
        );
      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Setup Complete!</h3>
          <p className="text-green-600">Your business information has been collected. You can now start writing your business plan.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Business Setup</h3>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {BUSINESS_QUESTIONS.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / BUSINESS_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentQuestion.label}
          {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderQuestionInput(currentQuestion)}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {!currentQuestion.required && (
            <Button
              variant="ghost"
              onClick={handleSkip}
            >
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={currentQuestion.required && !isCurrentQuestionAnswered}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === BUSINESS_QUESTIONS.length - 1 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

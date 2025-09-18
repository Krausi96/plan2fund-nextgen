// Segmented Onboarding Component (Canva-style)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserProfile, validateUserProfile } from '@/lib/schemas/userProfile';
import analytics from '@/lib/analytics';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void;
}

interface OnboardingStep {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  required?: boolean;
  placeholder?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'segment',
    question: 'What best describes you?',
    type: 'single',
    required: true,
    options: [
      { 
        value: 'B2C_FOUNDER', 
        label: 'Startup Founder', 
        description: 'I\'m starting or running a new business' 
      },
      { 
        value: 'SME_LOAN', 
        label: 'Business Owner', 
        description: 'I have an existing business and need funding' 
      },
      { 
        value: 'VISA', 
        label: 'Immigrant Entrepreneur', 
        description: 'I need to immigrate to Austria with my business' 
      },
      { 
        value: 'PARTNER', 
        label: 'Service Provider', 
        description: 'I help others with business planning' 
      }
    ]
  },
  {
    id: 'programType',
    question: 'What type of funding are you looking for?',
    type: 'single',
    required: true,
    options: [
      { value: 'GRANT', label: 'Grant (Non-repayable)', description: 'Government or EU funding' },
      { value: 'LOAN', label: 'Loan (Repayable)', description: 'Bank or credit funding' },
      { value: 'EQUITY', label: 'Equity Investment', description: 'Investor funding' },
      { value: 'VISA', label: 'Visa Support', description: 'Immigration assistance' },
      { value: 'MIXED', label: 'I\'m not sure', description: 'Help me find the best options' }
    ]
  },
  {
    id: 'industry',
    question: 'What industry is your business in?',
    type: 'single',
    required: true,
    options: [
      { value: 'TECH', label: 'Technology & Software' },
      { value: 'MANUFACTURING', label: 'Manufacturing & Industry' },
      { value: 'SERVICES', label: 'Professional Services' },
      { value: 'RETAIL', label: 'Retail & E-commerce' },
      { value: 'HEALTHCARE', label: 'Healthcare & Life Sciences' },
      { value: 'SUSTAINABILITY', label: 'Sustainability & Environment' },
      { value: 'CREATIVE', label: 'Creative & Media' },
      { value: 'OTHER', label: 'Other' }
    ]
  },
  {
    id: 'language',
    question: 'What language would you prefer?',
    type: 'single',
    required: true,
    options: [
      { value: 'DE', label: 'Deutsch (German)', description: 'Austrian German interface' },
      { value: 'EN', label: 'English', description: 'English interface' }
    ]
  },
  {
    id: 'experience',
    question: 'How experienced are you with business planning?',
    type: 'single',
    required: true,
    options: [
      { value: 'NEWBIE', label: 'Beginner', description: 'This is my first business plan' },
      { value: 'INTERMEDIATE', label: 'Some experience', description: 'I\'ve written a few plans before' },
      { value: 'EXPERT', label: 'Expert', description: 'I\'m very experienced with business planning' }
    ]
  },
  {
    id: 'payerType',
    question: 'How will you be paying?',
    type: 'single',
    required: true,
    options: [
      { value: 'INDIVIDUAL', label: 'Personal payment', description: 'I\'m paying for myself' },
      { value: 'COMPANY', label: 'Company payment', description: 'My company is paying' },
      { value: 'INSTITUTION', label: 'Institution', description: 'I represent an organization' }
    ]
  }
];

export default function SegmentedOnboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Track onboarding start
    // analytics.trackOnboardingStart('unknown');
  }, []);

  const handleAnswer = (stepId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [stepId]: value }));
    setErrors(prev => ({ ...prev, [stepId]: '' }));
  };

  const handleNext = () => {
    const step = ONBOARDING_STEPS[currentStep];
    
    // Validate required fields
    if (step.required && !answers[step.id]) {
      setErrors(prev => ({ ...prev, [step.id]: 'This field is required' }));
      return;
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // Create user profile
      const profileData: UserProfile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        segment: answers.segment,
        programType: answers.programType,
        industry: answers.industry,
        language: answers.language,
        payerType: answers.payerType,
        experience: answers.experience,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        gdprConsent: true // Implied consent by completing onboarding
      };

      const validatedProfile = validateUserProfile(profileData);
      if (!validatedProfile) {
        throw new Error('Invalid profile data');
      }

      // Save profile to backend
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedProfile)
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Track completion
      await analytics.trackOnboardingComplete(validatedProfile);

      onComplete(validatedProfile);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setErrors({ general: 'Failed to complete onboarding. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to Plan2Fund
            </h1>
            {onSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip
              </Button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentStepData.question}
          </h2>

          {currentStepData.type === 'single' && currentStepData.options && (
            <div className="space-y-3">
              {currentStepData.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentStepData.id, option.value)}
                  className={`w-full p-4 text-left border rounded-lg transition-all ${
                    answers[currentStepData.id] === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {currentStepData.type === 'multiple' && currentStepData.options && (
            <div className="space-y-3">
              {currentStepData.options.map((option) => (
                <label key={option.value} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={(answers[currentStepData.id] || []).includes(option.value)}
                    onChange={(e) => {
                      const currentValues = answers[currentStepData.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: any) => v !== option.value);
                      handleAnswer(currentStepData.id, newValues);
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {currentStepData.type === 'text' && (
            <textarea
              value={answers[currentStepData.id] || ''}
              onChange={(e) => handleAnswer(currentStepData.id, e.target.value)}
              placeholder={currentStepData.placeholder}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          )}

          {/* Error Messages */}
          {errors[currentStepData.id] && (
            <p className="text-red-600 text-sm mt-2">{errors[currentStepData.id]}</p>
          )}
          {errors.general && (
            <p className="text-red-600 text-sm mt-2">{errors.general}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading || (currentStepData.required && !answers[currentStepData.id])}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Saving...' : currentStep === ONBOARDING_STEPS.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

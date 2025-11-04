import { useState } from 'react';
import { useRouter } from 'next/router';
import { useI18n } from '@/shared/contexts/I18nContext';
import { scoreProgramsEnhanced } from '@/features/reco/engine/enhancedRecoEngine';
import { useRecommendation } from '@/features/reco/contexts/RecommendationContext';

/**
 * SIMPLE WIZARD - Just essential questions, no complex logic
 * This replaces the broken dynamic QuestionEngine approach
 */
export default function SimpleWizard() {
  const { t } = useI18n();
  const router = useRouter();
  const { setRecommendations } = useRecommendation();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const questions = [
    {
      id: 'location',
      question: 'Where are you located?',
      options: [
        { value: 'austria', label: 'Austria' },
        { value: 'germany', label: 'Germany' },
        { value: 'switzerland', label: 'Switzerland' },
        { value: 'eu', label: 'EU (other)' },
        { value: 'international', label: 'International' }
      ]
    },
    {
      id: 'company_age',
      question: 'How old is your company?',
      options: [
        { value: 'under_2_years', label: 'Under 2 years' },
        { value: '2_5_years', label: '2-5 years' },
        { value: '5_10_years', label: '5-10 years' },
        { value: 'over_10_years', label: 'Over 10 years' }
      ]
    },
    {
      id: 'current_revenue',
      question: 'What is your current revenue?',
      options: [
        { value: 'under_100k', label: 'Under €100k' },
        { value: '100k_500k', label: '€100k - €500k' },
        { value: '500k_2m', label: '€500k - €2M' },
        { value: 'over_2m', label: 'Over €2M' }
      ]
    },
    {
      id: 'team_size',
      question: 'How many people are in your team?',
      options: [
        { value: '1_2_people', label: '1-2 people' },
        { value: '3_5_people', label: '3-5 people' },
        { value: '6_10_people', label: '6-10 people' },
        { value: 'over_10_people', label: 'Over 10 people' }
      ]
    },
    {
      id: 'funding_type',
      question: 'What type of funding are you seeking?',
      options: [
        { value: 'grant', label: 'Grant' },
        { value: 'loan', label: 'Loan' },
        { value: 'equity', label: 'Equity' },
        { value: 'mixed', label: 'Mixed' }
      ]
    },
    {
      id: 'research_focus',
      question: 'Is this a research project?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      id: 'international_collaboration',
      question: 'Do you have international partners?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    }
  ];

  const currentQuestion = questions[step - 1];
  const progress = (step / questions.length) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      // Last question - get results
      handleComplete(newAnswers);
    }
  };

  const handleComplete = async (finalAnswers: Record<string, any>) => {
    setLoading(true);
    try {
      // Map simple answers to enhancedRecoEngine format
      const mappedAnswers = {
        location: finalAnswers.location,
        q2_entity_stage: finalAnswers.company_age === 'under_2_years' ? 'startup' : 'established',
        q3_funding_amount: finalAnswers.current_revenue,
        q4_team_size: finalAnswers.team_size,
        q5_funding_type: finalAnswers.funding_type,
        research_focus: finalAnswers.research_focus === 'yes',
        international_collaboration: finalAnswers.international_collaboration === 'yes'
      };

      const results = await scoreProgramsEnhanced(mappedAnswers, 'strict');
      
      // Store results
      setRecommendations(results);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRecommendations', JSON.stringify(results));
      }
      
      router.push('/results');
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Error getting recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Finding your best funding matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(progress)}% Complete</span>
            <span>Question {step} of {questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full text-left px-6 py-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
              >
                <span className="font-medium text-gray-900">{option.label}</span>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (step < questions.length) {
                setStep(step + 1);
              } else {
                handleComplete(answers);
              }
            }}
            disabled={!answers[currentQuestion.id]}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            {step === questions.length ? 'Get Results' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}


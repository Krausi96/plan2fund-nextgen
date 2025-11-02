// Success Hub with Next Steps and Testimonials
import React, { useState, useEffect } from 'react';
import { PlanDocument } from '@/shared/lib/schemas/userProfile';
import analytics from '@/shared/lib/analytics';

interface SuccessHubProps {
  plan: PlanDocument;
  userProfile: any;
  onTestimonialSubmit: (rating: number, feedback: string) => void;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  action: string;
  url?: string;
  category: 'IMMEDIATE' | 'NEXT_WEEK' | 'NEXT_MONTH';
  programSpecific?: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  company: string;
  rating: number;
  text: string;
  segment: string;
}

const NEXT_STEPS: Record<string, NextStep[]> = {
  GRANT: [
    {
      id: 'ffg_ecall',
      title: 'Check FFG eCall Calendar',
      description: 'Find upcoming funding calls that match your project',
      action: 'Visit FFG eCall',
      url: 'https://www.ffg.at/en/ecall',
      category: 'IMMEDIATE',
      programSpecific: true
    },
    {
      id: 'prepare_documents',
      title: 'Prepare Required Documents',
      description: 'Gather all necessary documents for your application',
      action: 'View Checklist',
      category: 'IMMEDIATE'
    },
    {
      id: 'expert_consultation',
      title: 'Schedule Expert Consultation',
      description: 'Get professional review of your business plan',
      action: 'Book Consultation',
      category: 'NEXT_WEEK'
    },
    {
      id: 'submit_application',
      title: 'Submit Application',
      description: 'Submit your funding application before the deadline',
      action: 'Submit Now',
      category: 'NEXT_MONTH',
      programSpecific: true
    }
  ],
  LOAN: [
    {
      id: 'bank_appointment',
      title: 'Schedule Bank Meeting',
      description: 'Book an appointment with your preferred bank',
      action: 'Find Banks',
      category: 'IMMEDIATE'
    },
    {
      id: 'prepare_financials',
      title: 'Prepare Financial Documents',
      description: 'Organize your financial statements and projections',
      action: 'View Requirements',
      category: 'IMMEDIATE'
    },
    {
      id: 'credit_check',
      title: 'Check Credit Score',
      description: 'Review your credit history and improve if needed',
      action: 'Check Credit',
      category: 'NEXT_WEEK'
    },
    {
      id: 'submit_loan_application',
      title: 'Submit Loan Application',
      description: 'Submit your loan application with all documents',
      action: 'Apply Now',
      category: 'NEXT_MONTH'
    }
  ],
  VISA: [
    {
      id: 'visa_office_appointment',
      title: 'Book Visa Office Appointment',
      description: 'Schedule an appointment at the Austrian visa office',
      action: 'Book Appointment',
      url: 'https://www.oesterreich.gv.at/en/themen/leben_in_oesterreich/aufenthalt/Seite.080000.html',
      category: 'IMMEDIATE',
      programSpecific: true
    },
    {
      id: 'gather_documents',
      title: 'Gather Visa Documents',
      description: 'Collect all required documents for visa application',
      action: 'View Checklist',
      category: 'IMMEDIATE'
    },
    {
      id: 'translation_service',
      title: 'Get Documents Translated',
      description: 'Translate documents to German if needed',
      action: 'Find Translators',
      category: 'NEXT_WEEK'
    },
    {
      id: 'submit_visa_application',
      title: 'Submit Visa Application',
      description: 'Submit your visa application with business plan',
      action: 'Apply Now',
      category: 'NEXT_MONTH',
      programSpecific: true
    }
  ]
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Maria Schmidt',
    company: 'TechStart GmbH',
    rating: 5,
    text: 'Plan2Fund helped me secure €50,000 in FFG funding. The templates were perfect for my tech startup.',
    segment: 'B2C_FOUNDER'
  },
  {
    id: '2',
    name: 'Hans Weber',
    company: 'Weber Manufacturing',
    rating: 5,
    text: 'Got my business loan approved thanks to the professional business plan. The bank was impressed!',
    segment: 'SME_LOAN'
  },
  {
    id: '3',
    name: 'Anna Petrov',
    company: 'Petrov Consulting',
    rating: 4,
    text: 'The visa business plan template was exactly what I needed for my Austrian visa application.',
    segment: 'VISA'
  }
];

export default function SuccessHub({ plan, userProfile, onTestimonialSubmit }: SuccessHubProps) {
  const [testimonialRating, setTestimonialRating] = useState(0);
  const [testimonialText, setTestimonialText] = useState('');
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  useEffect(() => {
    // Track success hub view
    analytics.trackSuccessHubView(plan.id);
  }, [plan.id]);

  const getNextSteps = (): NextStep[] => {
    const programType = userProfile.programType || 'GRANT';
    return NEXT_STEPS[programType] || NEXT_STEPS.GRANT;
  };

  const getFilteredTestimonials = (): Testimonial[] => {
    return TESTIMONIALS.filter(t => 
      t.segment === userProfile.segment || 
      userProfile.segment === 'PARTNER'
    );
  };

  const handleNextStepClick = (step: NextStep) => {
    analytics.trackNextStepClick(step.id, plan.id);
    
    if (step.url) {
      window.open(step.url, '_blank');
    }
  };

  const handleTestimonialSubmit = async () => {
    if (testimonialRating === 0 || !testimonialText.trim()) {
      return;
    }

    setIsSubmittingTestimonial(true);
    try {
      await onTestimonialSubmit(testimonialRating, testimonialText);
      
      // Track testimonial submission
      await analytics.trackTestimonialSubmit(plan.id, testimonialRating);
      
      setTestimonialRating(0);
      setTestimonialText('');
      setShowTestimonialForm(false);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  const nextSteps = getNextSteps();
  const testimonials = getFilteredTestimonials();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Congratulations! Your Business Plan is Ready
          </h1>
          <p className="text-lg text-gray-600">
            You've completed your {plan.title}. Here's what to do next.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{plan.metadata.wordCount}</div>
              <div className="text-sm text-gray-600">Words Written</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{plan.metadata.completionPercentage}%</div>
              <div className="text-sm text-gray-600">Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{plan.sections.length}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Next Steps</h2>
          
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  {step.programSpecific && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-2">
                      Program-specific
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleNextStepClick(step)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {step.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Center */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Download Center</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">PDF Export</h3>
                  <p className="text-sm text-gray-600">Professional business plan</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">DOCX Export</h3>
                  <p className="text-sm text-gray-600">Editable document</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">What Our Users Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">"{testimonial.text}"</p>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Form */}
          {!showTestimonialForm ? (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowTestimonialForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Share Your Experience
              </button>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Share Your Experience</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you rate your experience?
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setTestimonialRating(rating)}
                        className={`w-8 h-8 rounded-full ${
                          rating <= testimonialRating
                            ? 'bg-yellow-400 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us about your experience
                  </label>
                  <textarea
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
                    placeholder="How did Plan2Fund help you with your business plan?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleTestimonialSubmit}
                    disabled={isSubmittingTestimonial || testimonialRating === 0 || !testimonialText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingTestimonial ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => setShowTestimonialForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Partner Logos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Trusted by</h2>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">FFG</div>
            <div className="text-2xl font-bold text-gray-400">WKO</div>
            <div className="text-2xl font-bold text-gray-400">AWS</div>
            <div className="text-2xl font-bold text-gray-400">i2b</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 0-Match Fallback UX Component
import React, { useState } from 'react';
import { GapTicket } from '@/lib/schemas/userProfile';
import analytics from '@/lib/analytics';
import airtable from '@/lib/airtable';

interface ZeroMatchFallbackProps {
  userAnswers: Record<string, any>;
  suggestedPrograms: any[];
  onRetry: () => void;
  onContactSupport: () => void;
}

export default function ZeroMatchFallback({ 
  userAnswers, 
  suggestedPrograms, 
  onRetry, 
  onContactSupport 
}: ZeroMatchFallbackProps) {
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleCreateGapTicket = async () => {
    setIsCreatingTicket(true);
    try {
      // Create gap ticket
      const gapTicket: GapTicket = {
        id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'anonymous', // Will be set by context
        reason: 'NO_MATCHES',
        context: {
          answers: userAnswers,
          signals: {},
          requestedProgramType: userAnswers.program_type,
          requestedIndustry: userAnswers.industry
        },
        suggestedPrograms: suggestedPrograms.map(p => p.id),
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };

      // Save to backend
      await airtable.createGapTicket(gapTicket);

      // Track gap ticket creation
      await analytics.trackGapTicketCreated('NO_MATCHES', {
        answers: userAnswers,
        suggestedPrograms: suggestedPrograms.length
      });

      setTicketCreated(true);
    } catch (error) {
      console.error('Error creating gap ticket:', error);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;

    try {
      // Track user feedback
      await analytics.trackEvent({
        event: 'zero_match_feedback',
        properties: {
          feedback: feedback.trim(),
          answers: userAnswers,
          suggestedPrograms: suggestedPrograms.length
        }
      });

      // Show success message
      alert('Thank you for your feedback! We\'ll use this to improve our recommendations.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Perfect Matches Found
          </h1>
          <p className="text-gray-600">
            We couldn't find programs that exactly match your criteria, but we have some suggestions.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Suggested Programs */}
          {suggestedPrograms.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Close Matches ({suggestedPrograms.length})
              </h2>
              <div className="space-y-3">
                {suggestedPrograms.slice(0, 3).map((program) => (
                  <div key={program.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{program.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{program.description}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Score: {Math.round(program.score)}%
                          </span>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gap Analysis */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Why No Matches?
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Your program type preference might be too specific</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>Some eligibility criteria might not be met</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>We might need more programs in our database</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">What would you like to do?</h2>
            
            {/* Option 1: Try Different Answers */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Try Different Answers</h3>
              <p className="text-sm text-gray-600 mb-3">
                Go back and adjust your answers to see more options.
              </p>
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry Wizard
              </button>
            </div>

            {/* Option 2: Contact Support */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Get Personal Help</h3>
              <p className="text-sm text-gray-600 mb-3">
                Our experts can help you find the right funding programs.
              </p>
              <button
                onClick={onContactSupport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Contact Support
              </button>
            </div>

            {/* Option 3: Create Gap Ticket */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Report Missing Programs</h3>
              <p className="text-sm text-gray-600 mb-3">
                Help us improve by reporting what programs you were looking for.
              </p>
              <button
                onClick={handleCreateGapTicket}
                disabled={isCreatingTicket || ticketCreated}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isCreatingTicket ? 'Creating...' : ticketCreated ? 'Reported ✓' : 'Report Gap'}
              </button>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Help Us Improve</h3>
            <p className="text-sm text-gray-600 mb-3">
              What specific programs or criteria were you looking for?
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you were looking for..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedback.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              We're constantly adding new programs. Check back soon or contact us for personalized help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

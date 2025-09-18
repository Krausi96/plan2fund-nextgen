// Intake Form with Chips and Helper Text
import React, { useState } from 'react';
import { FundingProfile } from '@/lib/schemas/fundingProfile';
import { intakeParser } from '@/lib/intakeParser';
import OverlayQuestions from './OverlayQuestions';
import analytics from '@/lib/analytics';

interface IntakeFormProps {
  onComplete: (profile: FundingProfile) => void;
  onCancel?: () => void;
}

interface Chip {
  field: string;
  label: string;
  value: any;
  confidence: number;
  editable: boolean;
}

export default function IntakeForm({ onComplete, onCancel }: IntakeFormProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [profile, setProfile] = useState<FundingProfile | null>(null);
  const [chips, setChips] = useState<Chip[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayQuestions, setOverlayQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Please describe your business');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Track intake start
      await analytics.trackEvent({
        event: 'intake_form_submitted',
        properties: {
          inputLength: input.length,
          hasInput: true
        }
      });

      const result = await intakeParser.parseInput(input, 'session_' + Date.now());
      
      setProfile(result.profile);
      setChips(createChips(result.profile));
      
      if (result.needsOverlay) {
        setOverlayQuestions(result.overlayQuestions);
        setShowOverlay(true);
      } else {
        onComplete(result.profile);
      }

    } catch (error) {
      console.error('Error processing intake:', error);
      setError('Failed to process your input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createChips = (profile: FundingProfile): Chip[] => {
    const chips: Chip[] = [];

    if (profile.sector) {
      chips.push({
        field: 'sector',
        label: 'Sector',
        value: profile.sector,
        confidence: profile.confidence.sector,
        editable: true
      });
    }

    if (profile.stage) {
      chips.push({
        field: 'stage',
        label: 'Stage',
        value: profile.stage,
        confidence: profile.confidence.stage,
        editable: true
      });
    }

    if (profile.team_size) {
      chips.push({
        field: 'team_size',
        label: 'Team Size',
        value: profile.team_size,
        confidence: profile.confidence.team_size,
        editable: true
      });
    }

    if (profile.location_city) {
      chips.push({
        field: 'location',
        label: 'Location',
        value: `${profile.location_city}, ${profile.location_country}`,
        confidence: Math.min(profile.confidence.location_city, profile.confidence.location_country),
        editable: true
      });
    }

    if (profile.funding_need_eur) {
      chips.push({
        field: 'funding_need_eur',
        label: 'Funding',
        value: `€${profile.funding_need_eur.toLocaleString()}`,
        confidence: profile.confidence.funding_need_eur,
        editable: true
      });
    }

    if (profile.program_type) {
      chips.push({
        field: 'program_type',
        label: 'Looking for',
        value: profile.program_type,
        confidence: profile.confidence.program_type,
        editable: true
      });
    }

    if (profile.collaboration) {
      chips.push({
        field: 'collaboration',
        label: 'Collaboration',
        value: profile.collaboration,
        confidence: profile.confidence.collaboration,
        editable: true
      });
    }

    if (profile.trl) {
      chips.push({
        field: 'trl',
        label: 'TRL',
        value: profile.trl,
        confidence: profile.confidence.trl,
        editable: true
      });
    }

    return chips;
  };

  const handleChipEdit = (field: string) => {
    // In a real implementation, this would open an edit modal
    console.log('Edit chip:', field);
  };

  const handleOverlayComplete = (updatedProfile: FundingProfile) => {
    setProfile(updatedProfile);
    setChips(createChips(updatedProfile));
    setShowOverlay(false);
    onComplete(updatedProfile);
  };

  const handleOverlayCancel = () => {
    if (profile) {
      onComplete(profile);
    }
    setShowOverlay(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tell us about your business
          </h1>
          <p className="text-gray-600">
            Describe your business in 1-2 sentences. Include: sector, stage, team size, location, funding need.
          </p>
        </div>

        {/* Input Area */}
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="business-description" className="block text-sm font-medium text-gray-700 mb-2">
              Business Description
            </label>
            <textarea
              id="business-description"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: 'Healthtech MVP, 3 founders in Vienna, seeking €150k grant for clinical pilot.' We'll create editable chips and ask if we're unsure."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              disabled={isProcessing}
            />
          </div>

          {/* Example */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Example:</h3>
            <p className="text-sm text-blue-800">
              "Healthtech MVP, 3 founders in Vienna, seeking €150k grant for clinical pilot."
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Analyze My Business'}
          </button>
        </div>

        {/* Chips Display */}
        {chips.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              What we understood:
            </h3>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {chip.label}:
                  </span>
                  <span className="text-sm text-gray-900">
                    {chip.value}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(chip.confidence)}`}>
                    {getConfidenceText(chip.confidence)}
                  </span>
                  {chip.editable && (
                    <button
                      onClick={() => handleChipEdit(chip.field)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Missing Chips */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Missing information:</h4>
              <div className="flex flex-wrap gap-2">
                {!profile?.sector && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                    + Add Sector
                  </button>
                )}
                {!profile?.stage && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                    + Add Stage
                  </button>
                )}
                {!profile?.funding_need_eur && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                    + Add Funding Amount
                  </button>
                )}
                {!profile?.location_city && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 underline">
                    + Add Location
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {onCancel && (
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Overlay Questions */}
      {showOverlay && profile && (
        <OverlayQuestions
          profile={profile}
          questionTypes={overlayQuestions}
          onComplete={handleOverlayComplete}
          onCancel={handleOverlayCancel}
        />
      )}
    </div>
  );
}

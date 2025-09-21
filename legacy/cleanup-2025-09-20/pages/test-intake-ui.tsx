// Test page for intake parser UI
import { useState } from 'react';
import IntakeForm from '@/components/intake/IntakeForm';
import { FundingProfile } from '@/lib/schemas/fundingProfile';

export default function TestIntakeUI() {
  const [result, setResult] = useState<FundingProfile | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handleComplete = (profile: FundingProfile) => {
    setResult(profile);
    setShowForm(false);
  };

  const handleReset = () => {
    setResult(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Intake Parser Test
        </h1>

        {showForm ? (
          <IntakeForm
            onComplete={handleComplete}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Parsing Result
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Again
              </button>
            </div>

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Basic Info</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Sector:</strong> {result.sector || 'Not detected'}</div>
                      <div><strong>Stage:</strong> {result.stage || 'Not detected'}</div>
                      <div><strong>Team Size:</strong> {result.team_size || 'Not detected'}</div>
                      <div><strong>Location:</strong> {result.location_city || 'Not detected'}, {result.location_country || 'Not detected'}</div>
                      <div><strong>Funding Need:</strong> €{result.funding_need_eur?.toLocaleString() || 'Not detected'}</div>
                      <div><strong>Program Type:</strong> {result.program_type || 'Not detected'}</div>
                      <div><strong>Language:</strong> {result.language || 'Not detected'}</div>
                      <div><strong>Intent:</strong> {result.intent || 'Not detected'}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Confidence Scores</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(result.confidence).map(([field, score]) => (
                        <div key={field} className="flex justify-between">
                          <span className="capitalize">{field.replace('_', ' ')}:</span>
                          <span className={`font-medium ${
                            score >= 0.8 ? 'text-green-600' : 
                            score >= 0.6 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Raw Input</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    "{result.raw_input}"
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Metadata</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Session ID:</strong> {result.session_id}</div>
                    <div><strong>Parsed At:</strong> {new Date(result.parsed_at).toLocaleString()}</div>
                    {result.raw_amount_text && (
                      <div><strong>Raw Amount Text:</strong> "{result.raw_amount_text}"</div>
                    )}
                    {result.currency_detected && (
                      <div><strong>Currency Detected:</strong> {result.currency_detected}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

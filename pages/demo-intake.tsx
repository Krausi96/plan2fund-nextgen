// Demo page to show intake layer in action
import React from 'react';
import IntakeForm from '@/components/intake/IntakeForm';
import { FundingProfile } from '@/lib/schemas/fundingProfile';

export default function DemoIntakePage() {
  const handleComplete = (profile: FundingProfile) => {
    console.log('Intake completed:', profile);
    
    // Store the profile for the recommendation engine
    localStorage.setItem('intakeProfile', JSON.stringify(profile));
    
    // Redirect to recommendation wizard with pre-filled data
    window.location.href = '/reco?intake=true';
  };

  const handleCancel = () => {
    console.log('Intake cancelled');
    alert('Intake cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Plan2Fund Intake Layer Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the robust intake parser with confidence tracking and overlay questions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Try these test cases:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">B2C Ideal Case</h3>
              <p className="text-sm text-blue-800">
                "3-person Healthtech startup in Vienna, MVP stage, needs €200k grant for clinical pilot"
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">SME Loan Case</h3>
              <p className="text-sm text-green-800">
                "15-employee carpentry business in Graz, established company, seeking €500k bank loan"
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">German Input</h3>
              <p className="text-sm text-yellow-800">
                "Biotech Team aus Wien, 6 Personen, 250.000 EUR Förderung"
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Off-topic Test</h3>
              <p className="text-sm text-red-800">
                "Write me a poem about startups and grants"
              </p>
            </div>
          </div>
        </div>

        <IntakeForm onComplete={handleComplete} onCancel={handleCancel} />

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Features Demonstrated:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Schema Validation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Controlled vocabularies for sectors, stages</li>
                <li>• Confidence tracking (0.0-1.0)</li>
                <li>• Required field validation</li>
                <li>• Type safety enforcement</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Parser Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• AI assistance with 2s timeout</li>
                <li>• Deterministic fallbacks</li>
                <li>• Language detection (DE/EN)</li>
                <li>• Off-topic classification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ UI Components</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Editable chips with confidence badges</li>
                <li>• Overlay micro-questions (max 3)</li>
                <li>• Helper text and examples</li>
                <li>• Progress tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ GDPR Compliance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pseudonymous session IDs</li>
                <li>• Raw text storage for QA</li>
                <li>• Optional user ID tracking</li>
                <li>• Delete flow structure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

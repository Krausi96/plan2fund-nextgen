import React from 'react';

export default function ResultsCardDemo() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Results Card Demo</h1>
      
      {/* Simple Results Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">aws Preseed – Innovative Solutions</h3>
            <span className="text-sm text-gray-600">Grant</span>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">85%</div>
            <div className="text-xs text-gray-500">Match</div>
          </div>
        </div>

        {/* Why it fits - 3-5 plain-language bullets */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Why it fits:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              Your project is based in Austria and you're in the pre-company stage
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              Your innovation/digital theme matches the program focus
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              You're at TRL 3-4 which is perfect for this program
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              You plan to conduct R&D in Austria as required
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              Up to €100,000 available with 80% funding rate
            </li>
          </ul>
        </div>

        {/* Risks/Next steps - 1-2 bullets */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Risks/Next steps:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              Verify team diversity requirements for gender bonus eligibility
            </li>
            <li className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              Prepare detailed project description and business plan
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Open Details
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Start Plan in Editor
          </button>
        </div>
      </div>
    </div>
  );
}

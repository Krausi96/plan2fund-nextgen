import React from 'react';

interface FooterProps {
  commit?: string;
  flags?: Record<string, boolean>;
}

export default function Footer({ commit, flags }: FooterProps) {
  const currentCommit = commit || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
  const currentFlags = flags || {
    dynamicWizard: true,
    coverageValidation: true,
    aiHelperGuardrails: true,
    sourceRegister: true
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>© 2025 Plan2Fund</span>
            <span>•</span>
            <span>Commit: {currentCommit.substring(0, 7)}</span>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <span className="text-xs text-gray-500">Flags:</span>
            {Object.entries(currentFlags).map(([flag, enabled]) => (
              <span
                key={flag}
                className={`px-2 py-1 rounded text-xs ${
                  enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
                title={enabled ? 'Enabled' : 'Disabled'}
              >
                {flag}: {enabled ? 'ON' : 'OFF'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

import React, { useState, useEffect } from 'react';

interface HealthData {
  git: {
    hash: string;
    shortHash: string;
  };
  features: {
    [key: string]: boolean;
  };
  programs: {
    source: string;
    modules: string[];
    version: string;
    count: number;
  };
}

export default function HealthFooter() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  if (!healthData) {
    return (
      <div className="text-xs text-gray-400 text-center py-2 border-t">
        Loading system info...
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-400 text-center py-2 border-t">
      <div className="flex items-center justify-center gap-4">
        <span>Commit: {healthData.git.shortHash}</span>
        <span>•</span>
        <span>Programs: {healthData.programs.count}</span>
        <span>•</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="hover:text-gray-600 underline"
          aria-label={showDetails ? 'Hide system details' : 'Show system details'}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 rounded text-left max-w-md mx-auto">
          <div className="font-semibold mb-2">System Health</div>
          <div className="space-y-1">
            <div><strong>Commit:</strong> {healthData.git.hash}</div>
            <div><strong>Programs Source:</strong> {healthData.programs.source}</div>
            <div><strong>Programs Version:</strong> {healthData.programs.version}</div>
            <div><strong>Modules:</strong> {healthData.programs.modules.join(', ')}</div>
            <div><strong>Features:</strong></div>
            <ul className="ml-4 space-y-1">
              {Object.entries(healthData.features).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2">
                  <span className={value ? 'text-green-600' : 'text-red-600'}>
                    {value ? '✅' : '❌'}
                  </span>
                  <span>{key}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

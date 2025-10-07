// Structured Requirements Display Component for Results Page
import React, { useState, useEffect } from 'react';
// import { Badge } from '@/components/ui/badge'; // Unused
import { Button } from '@/components/ui/button';

interface LibraryRequirement {
  id: string;
  eligibility_text: string;
  documents: string[];
  funding_amount: string;
  deadlines: string[];
  application_procedures: string[];
  compliance_requirements: string[];
  contact_info: any;
}

interface StructuredRequirementsDisplayProps {
  programId: string;
  compact?: boolean;
}

export default function StructuredRequirementsDisplay({
  programId,
  compact = true
}: StructuredRequirementsDisplayProps) {
  const [requirements, setRequirements] = useState<LibraryRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (showDetails) {
      loadRequirements();
    }
  }, [showDetails, programId]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/programmes/${programId}/requirements`);
      
      if (!response.ok) {
        throw new Error(`Failed to load requirements: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequirements(data.library || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
      setError(error instanceof Error ? error.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs"
        >
          {showDetails ? 'Hide' : 'Show'} Program Details
        </Button>
        
        {showDetails && (
          <div className="mt-3 space-y-3">
            {loading && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 text-xs">Failed to load details</div>
            )}
            
            {requirements.length > 0 && (
              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <div key={req.id || index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                    {/* Funding Amount */}
                    {req.funding_amount && (
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">💰</span>
                        <span className="text-sm font-medium text-green-800">{req.funding_amount}</span>
                      </div>
                    )}
                    
                    {/* Deadlines */}
                    {req.deadlines && req.deadlines.length > 0 && (
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-yellow-600 mr-2">📅</span>
                          <span className="text-xs font-medium text-gray-700">Deadlines:</span>
                        </div>
                        <div className="text-xs text-gray-600 ml-4">
                          {req.deadlines.slice(0, 2).join(', ')}
                          {req.deadlines.length > 2 && ` +${req.deadlines.length - 2} more`}
                        </div>
                      </div>
                    )}
                    
                    {/* Required Documents */}
                    {req.documents && req.documents.length > 0 && (
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-blue-600 mr-2">📄</span>
                          <span className="text-xs font-medium text-gray-700">Documents:</span>
                        </div>
                        <div className="text-xs text-gray-600 ml-4">
                          {req.documents.slice(0, 3).join(', ')}
                          {req.documents.length > 3 && ` +${req.documents.length - 3} more`}
                        </div>
                      </div>
                    )}
                    
                    {/* Eligibility */}
                    {req.eligibility_text && (
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-purple-600 mr-2">✅</span>
                          <span className="text-xs font-medium text-gray-700">Eligibility:</span>
                        </div>
                        <div className="text-xs text-gray-600 ml-4 line-clamp-2">
                          {req.eligibility_text.length > 100 
                            ? `${req.eligibility_text.substring(0, 100)}...` 
                            : req.eligibility_text
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full display mode (for dedicated pages)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Program Requirements</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>
      
      {showDetails && (
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading requirements...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-4">
              <div className="text-red-600 mb-2">⚠️ Error loading requirements</div>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          )}
          
          {requirements.length > 0 && (
            <div className="space-y-4">
              {requirements.map((req, index) => (
                <div key={req.id || index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  {/* Funding Amount */}
                  {req.funding_amount && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-green-600 mr-2">💰</span>
                        <span className="font-medium text-green-800">Funding Amount</span>
                      </div>
                      <p className="text-green-700">{req.funding_amount}</p>
                    </div>
                  )}
                  
                  {/* Deadlines */}
                  {req.deadlines && req.deadlines.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-600 mr-2">📅</span>
                        <span className="font-medium text-yellow-800">Deadlines</span>
                      </div>
                      <ul className="space-y-1">
                        {req.deadlines.map((deadline, idx) => (
                          <li key={idx} className="text-yellow-700 text-sm">• {deadline}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Required Documents */}
                  {req.documents && req.documents.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-blue-600 mr-2">📄</span>
                        <span className="font-medium text-blue-800">Required Documents</span>
                      </div>
                      <ul className="space-y-1">
                        {req.documents.map((document, idx) => (
                          <li key={idx} className="text-blue-700 text-sm">• {document}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Eligibility */}
                  {req.eligibility_text && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-purple-600 mr-2">✅</span>
                        <span className="font-medium text-purple-800">Eligibility Criteria</span>
                      </div>
                      <p className="text-purple-700 text-sm">{req.eligibility_text}</p>
                    </div>
                  )}
                  
                  {/* Application Procedures */}
                  {req.application_procedures && req.application_procedures.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-gray-600 mr-2">📋</span>
                        <span className="font-medium text-gray-800">Application Procedures</span>
                      </div>
                      <ol className="space-y-1">
                        {req.application_procedures.map((procedure, idx) => (
                          <li key={idx} className="text-gray-700 text-sm">{idx + 1}. {procedure}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

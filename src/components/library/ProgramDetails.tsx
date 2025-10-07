// Program Details Component - Displays structured library requirements
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface ProgramDetailsProps {
  programId: string;
  programName: string;
  programType: string;
  onEdit?: () => void;
  onApply?: () => void;
}

export default function ProgramDetails({
  programId,
  programName,
  programType,
  onEdit,
  onApply
}: ProgramDetailsProps) {
  const [requirements, setRequirements] = useState<LibraryRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgramRequirements();
  }, [programId]);

  const loadProgramRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/programmes/${programId}/requirements`);
      
      if (!response.ok) {
        throw new Error(`Failed to load requirements: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequirements(data.library || []);
    } catch (error) {
      console.error('Error loading program requirements:', error);
      setError(error instanceof Error ? error.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">⚠️ Error loading program details</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadProgramRequirements} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600 mb-4">No detailed requirements available</div>
        <p className="text-sm text-gray-500">This program may not have structured requirements yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{programName}</h2>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary">{programType}</Badge>
            <Badge variant="outline">Structured Requirements</Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit Requirements
            </Button>
          )}
          {onApply && (
            <Button onClick={onApply}>
              Apply Now
            </Button>
          )}
        </div>
      </div>

      {/* Requirements Details */}
      {requirements.map((requirement, index) => (
        <Card key={requirement.id || index} className="p-6">
          <div className="space-y-6">
            {/* Eligibility */}
            {requirement.eligibility_text && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700">{requirement.eligibility_text}</p>
                </div>
              </div>
            )}

            {/* Funding Amount */}
            {requirement.funding_amount && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Funding Amount</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-lg font-semibold text-green-800">{requirement.funding_amount}</p>
                </div>
              </div>
            )}

            {/* Deadlines */}
            {requirement.deadlines && requirement.deadlines.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Deadlines</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {requirement.deadlines.map((deadline, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-yellow-600 mr-2">📅</span>
                        <span className="text-gray-700">{deadline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Required Documents */}
            {requirement.documents && requirement.documents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Documents</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {requirement.documents.map((document, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-gray-600 mr-2">📄</span>
                        <span className="text-gray-700">{document}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Application Procedures */}
            {requirement.application_procedures && requirement.application_procedures.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Procedures</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <ol className="space-y-2">
                    {requirement.application_procedures.map((procedure, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-purple-600 mr-2 mt-1">{idx + 1}.</span>
                        <span className="text-gray-700">{procedure}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Compliance Requirements */}
            {requirement.compliance_requirements && requirement.compliance_requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance Requirements</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {requirement.compliance_requirements.map((requirement, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-red-600 mr-2">⚠️</span>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {requirement.contact_info && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(requirement.contact_info, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

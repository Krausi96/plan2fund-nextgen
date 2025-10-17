import React, { useState } from 'react';
import { CheckCircle, FileText, AlertCircle, ArrowRight, HelpCircle } from 'lucide-react';
import { getFundingPack, getDocSpec, type TargetGroup, type FundingType, type Product } from '@/data/basisPack';
import { DocumentModal } from './DocumentModal';
import { Tooltip } from '@/components/common/Tooltip';

interface RequirementsDisplayProps {
  targetGroup: TargetGroup;
  fundingType: FundingType;
  product: Product;
}

export function RequirementsDisplay({ targetGroup, fundingType, product }: RequirementsDisplayProps) {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fundingPack = getFundingPack(targetGroup, fundingType, product);

  if (!fundingPack) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">No funding pack available</h3>
            <p className="text-yellow-700">This combination is not currently supported.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDocumentClick = (docId: string) => {
    const docSpec = getDocSpec(docId);
    if (docSpec) {
      setSelectedDocument({
        id: docId,
        title: docSpec.name,
        purpose: docSpec.purpose,
        sections: docSpec.coreSections,
        inputs: docSpec.inputs.join(', '),
        outputs: docSpec.outputs.join(', '),
        limits: docSpec.limits,
        formatHints: [docSpec.formatLength]
      });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          What we create vs. what you provide
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {fundingPack.description}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* We Create */}
        <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-green-900">
                What we create
              </h4>
              <p className="text-green-700 text-sm">Included in your bundle</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {fundingPack.included.map((docId) => {
              const docSpec = getDocSpec(docId);
              if (!docSpec) return null;
              
              return (
                <button
                  key={docId}
                  onClick={() => handleDocumentClick(docId)}
                  className="w-full bg-white rounded-xl p-4 border-2 border-green-200 hover:border-green-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-gray-900 group-hover:text-green-700">
                            {docSpec.name}
                          </h5>
                          <Tooltip content={docSpec.purpose || 'No description available'} position="top">
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </Tooltip>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {docSpec.purpose}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="text-sm font-medium">Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* You Provide */}
        <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-orange-900">
                What you provide
              </h4>
              <p className="text-orange-700 text-sm">Required documentation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {fundingPack.youProvide.map((requirement, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border-2 border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{requirement}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRequirementExplanation(requirement, fundingType)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Modal */}
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
}

// Helper function to get requirement explanations
function getRequirementExplanation(requirement: string, fundingType: FundingType): string {
  const explanations: Record<string, Record<FundingType, string>> = {
    'Company register extract': {
      grants: 'Official document proving your company\'s legal status (Firmenbuchauszug)',
      bankLoans: 'Required for all business loan applications',
      equity: 'Shows current ownership structure',
      visa: 'Proves business registration in Austria'
    },
    'Financial statements': {
      grants: 'Last 2-3 years of audited financial statements',
      bankLoans: 'Required for credit assessment and DSCR calculation',
      equity: 'Shows financial health and growth trajectory',
      visa: 'Demonstrates financial stability for visa requirements'
    },
    'Founder CVs': {
      grants: 'Professional CVs highlighting relevant experience',
      bankLoans: 'Not typically required for bank loans',
      equity: 'Shows team qualifications and track record',
      visa: 'Required to prove founder qualifications'
    },
    'Meldezettel': {
      grants: 'Not typically required for grants',
      bankLoans: 'Required for Austrian residents',
      equity: 'Not typically required for equity',
      visa: 'Required for visa application'
    },
    'Passport': {
      grants: 'Not typically required for grants',
      bankLoans: 'Not typically required for bank loans',
      equity: 'Not typically required for equity',
      visa: 'Required for visa application'
    },
    'Birth certificate': {
      grants: 'Not typically required for grants',
      bankLoans: 'Not typically required for bank loans',
      equity: 'Not typically required for equity',
      visa: 'Required for visa application'
    }
  };

  return explanations[requirement]?.[fundingType] || 'Required documentation for this funding type';
}

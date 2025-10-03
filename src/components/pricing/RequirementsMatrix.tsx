// ========= PLAN2FUND — REQUIREMENTS MATRIX =========
// Interactive matrix showing "We create" vs "You provide" with filtering

import React, { useState } from 'react';
import { CheckCircle, FileText, Info, AlertCircle } from 'lucide-react';
import { getFundingPack, getDocSpec, getAddonsForFundingType, type TargetGroup, type FundingType, type Product } from '@/data/basisPack';
import { DocumentSpecModal } from './DocumentSpecModal';

interface RequirementsMatrixProps {
  targetGroup: TargetGroup;
  fundingType: FundingType;
  product: Product;
}

export function RequirementsMatrix({ targetGroup, fundingType, product }: RequirementsMatrixProps) {
  const [selectedDocSpec, setSelectedDocSpec] = useState<string | null>(null);
  
  const fundingPack = getFundingPack(targetGroup, fundingType, product);
  const addons = getAddonsForFundingType(fundingType);

  if (!fundingPack) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">No funding pack available for this combination.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          What we create vs. what you provide
        </h3>
        <p className="text-gray-600">
          {fundingPack.description}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* We Create */}
        <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-green-900">
              Included in your bundle
            </h4>
          </div>
          
          <div className="space-y-3">
            {fundingPack.included.map((docId) => {
              const docSpec = getDocSpec(docId);
              if (!docSpec) return null;
              
              return (
                <div
                  key={docId}
                  className="bg-white rounded-lg p-4 border border-green-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedDocSpec(docId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <h5 className="font-medium text-gray-900">{docSpec.name}</h5>
                        <p className="text-sm text-gray-600">{docSpec.purpose}</p>
                      </div>
                    </div>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* You Provide */}
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-orange-900">
              You must also provide
            </h4>
          </div>
          
          <div className="space-y-3">
            {fundingPack.youProvide.map((requirement, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{requirement}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {getRequirementExplanation(requirement, fundingType)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add-ons Section */}
      {addons.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-blue-900">
              Available Add-ons
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((addon) => (
              <div key={addon.id} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{addon.name}</h5>
                  <span className="text-sm font-semibold text-blue-600">{addon.price}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{addon.scope}</p>
                <p className="text-xs text-gray-500">Deliverables: {addon.deliverables}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Spec Modal */}
      {selectedDocSpec && (
        <DocumentSpecModal
          docSpec={getDocSpec(selectedDocSpec)!}
          isOpen={!!selectedDocSpec}
          onClose={() => setSelectedDocSpec(null)}
        />
      )}
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
    'Financial-health form': {
      grants: 'Attested by tax advisor, shows financial stability',
      bankLoans: 'Not typically required for bank loans',
      equity: 'Not typically required for equity',
      visa: 'Not typically required for visa'
    },
    'Photo ID': {
      grants: 'Not typically required for grants',
      bankLoans: 'Required for identity verification',
      equity: 'Not typically required for equity',
      visa: 'Required for visa application'
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

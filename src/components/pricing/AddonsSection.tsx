// ========= PLAN2FUND — ADD-ONS SECTION =========
// Add-ons section with scope-driven descriptions

import React, { useState } from 'react';
import { Clock, Calculator, MessageCircle, Presentation, Zap, FileText, Shield, Globe, HelpCircle } from 'lucide-react';
import { getAddonsForFundingType, getAddonSpec, type FundingType } from '@/data/basisPack';
import { Tooltip } from '@/components/common/Tooltip';

interface AddonsSectionProps {
  fundingType: FundingType;
}

export function AddonsSection({ fundingType }: AddonsSectionProps) {
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  
  const addons = getAddonsForFundingType(fundingType);

  const iconMap = {
    financialHealthAssistance: Calculator,
    collateralDocumentationReview: FileText,
    legalIpDataRoomChecklist: Shield,
    translationLegalisationCoordination: Globe,
    extraRevisionCycle: Clock,
    customFinancialModeling: Calculator,
    oneOnOneConsultation: MessageCircle,
    pitchDeckExport: Presentation,
    rushDelivery: Zap
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Add-ons That Matter
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Enhance your plan with additional services tailored to your funding type
          </p>
        </div>

        {/* Add-ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addons.map((addon) => {
            const IconComponent = iconMap[addon.id as keyof typeof iconMap] || FileText;
            
            return (
              <div
                key={addon.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedAddon(addon.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{addon.name}</h3>
                        <Tooltip content={addon.scope || 'No description available'} position="top">
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <span className="text-lg font-bold text-blue-500">{addon.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{addon.scope}</p>
                    <div className="text-xs text-gray-500">
                      <div className="mb-1">
                        <strong>Deliverables:</strong> {addon.deliverables}
                      </div>
                      <div>
                        <strong>Turnaround:</strong> {addon.turnaround}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add-on Detail Modal */}
        {selectedAddon && (
          <AddonDetailModal
            addon={getAddonSpec(selectedAddon)!}
            isOpen={!!selectedAddon}
            onClose={() => setSelectedAddon(null)}
          />
        )}
      </div>
    </div>
  );
}

// Add-on Detail Modal Component
interface AddonDetailModalProps {
  addon: any; // AddonSpec type
  isOpen: boolean;
  onClose: () => void;
}

function AddonDetailModal({ addon, isOpen, onClose }: AddonDetailModalProps) {
  if (!isOpen || !addon) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{addon.name}</h2>
                <p className="text-sm text-gray-600">Add-on Service Details</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Price */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">{addon.price}</div>
              <p className="text-gray-600">One-time fee</p>
            </div>

            {/* Scope */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's Included</h3>
              <p className="text-gray-700">{addon.scope}</p>
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deliverables</h3>
              <p className="text-gray-700">{addon.deliverables}</p>
            </div>

            {/* Exclusions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Included</h3>
              <p className="text-gray-700">{addon.exclusions}</p>
            </div>

            {/* Turnaround */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Turnaround Time</h3>
              <p className="text-gray-700">{addon.turnaround}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

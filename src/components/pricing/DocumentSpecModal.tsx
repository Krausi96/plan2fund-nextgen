// ========= PLAN2FUND — DOCUMENT SPEC MODAL =========
// Modal component for displaying full document specifications

import React from 'react';
import { X, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { DocSpec } from '@/data/basisPack';

interface DocumentSpecModalProps {
  docSpec: DocSpec;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentSpecModal({ docSpec, isOpen, onClose }: DocumentSpecModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{docSpec.name}</h2>
                  <p className="text-sm text-gray-600">Document Specification</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Purpose */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Purpose</h3>
              <p className="text-gray-700">{docSpec.purpose}</p>
            </div>

            {/* Core Sections */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Core Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {docSpec.coreSections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{section.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Format & Length */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Format & Length</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-700">{docSpec.formatLength}</p>
              </div>
            </div>

            {/* Inputs Required */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Inputs We Need From You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {docSpec.inputs.map((input, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    <span className="capitalize">{input.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customization */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customization</h3>
              <p className="text-gray-700">{docSpec.customization}</p>
            </div>

            {/* Limits */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Limits & Exclusions
              </h3>
              <p className="text-gray-700">{docSpec.limits}</p>
            </div>

            {/* Outputs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-500" />
                Outputs We Deliver
              </h3>
              <div className="space-y-2">
                {docSpec.outputs.map((output, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 rounded-lg p-2">
                    <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <code className="text-xs bg-white px-2 py-1 rounded border">{output.name}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Checklist */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance Checklist</h3>
              <div className="space-y-2">
                {docSpec.complianceChecklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{item.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Types */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Available For</h3>
              <div className="flex flex-wrap gap-2">
                {docSpec.fundingTypes.map((type) => (
                  <span
                    key={type}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      type === 'grants' ? 'bg-green-100 text-green-700' :
                      type === 'bankLoans' ? 'bg-blue-100 text-blue-700' :
                      type === 'equity' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {type === 'grants' ? '🏛️ Grants' :
                     type === 'bankLoans' ? '💰 Bank Loans' :
                     type === 'equity' ? '💼 Equity' :
                     '✈️ Visa'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

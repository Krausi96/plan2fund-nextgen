// ========= PLAN2FUND — FORM HELP MODAL =========
// Modal component for displaying generated form help

import React from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';

interface FormHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanDocument;
  programProfile: ProgramProfile | null;
  formHelp: any;
}

export default function FormHelpModal({ 
  isOpen, 
  onClose, 
  formHelp 
}: FormHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Form Help - {formHelp.programId || 'Program Application'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Program Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Program Information</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Program ID:</strong> {formHelp.programId || 'Unknown'}</p>
              <p><strong>Route:</strong> {formHelp.route || 'Unknown'}</p>
              <p><strong>Form Type:</strong> {formHelp.formType || 'Standard Application'}</p>
            </div>
          </div>

          {/* Form Sections */}
          {formHelp.sections?.map((section: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{section.title}</h3>
              <div className="space-y-3">
                {section.fields?.map((field: any, fieldIndex: number) => (
                  <div key={fieldIndex} className="border-l-4 border-gray-200 pl-3">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-sm">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <span className="text-xs text-gray-500">
                        {field.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                      {field.value || 'To be filled based on your plan content'}
                    </div>
                    {field.hint && (
                      <div className="mt-1 text-xs text-gray-600">
                        💡 {field.hint}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Suggestions */}
          {formHelp.suggestions?.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Improvement Suggestions</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                {formHelp.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={() => {
                // In a real implementation, this would download or export the form
                console.log('Export form help:', formHelp);
                alert('Form help exported! (Check console for details)');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Form Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

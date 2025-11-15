// ========= PLAN2FUND — EDITOR ENTRY MODAL =========
// Simple, foolproof entry point - combines product and optional program selection
// Appears when entering /editor without product parameter

import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface EditorEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditorEntryModal({
  isOpen,
  onClose
}: EditorEntryModalProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState('submission');
  const [selectedProgramId, setSelectedProgramId] = useState('');

  if (!isOpen) return null;

  const handleStart = () => {
    // Build URL with product and optional programId
    const query: any = { product: selectedProduct };
    if (selectedProgramId) {
      query.programId = selectedProgramId;
    }
    
    router.push({
      pathname: '/editor',
      query
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 shadow-xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Business Plan</h2>
        <p className="text-gray-600 text-sm mb-6">Choose your plan type to begin</p>
        
        <div className="space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Type
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              <option value="strategy">Strategy - Quick planning (9 sections)</option>
              <option value="review">Review - Full review (all sections)</option>
              <option value="submission">Submission - Complete plan (all sections)</option>
            </select>
          </div>

          {/* Optional Program Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funding Program <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              placeholder="e.g., ffg_basisprogramm (or leave empty)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can add a program ID here, or skip and add it later via URL parameter
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Editing
          </button>
        </div>
      </div>
    </div>
  );
}


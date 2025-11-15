// ========= PLAN2FUND — PRODUCT SELECTION MODAL =========
// Simple modal that appears when entering /editor without product parameter
// User selects product type (Strategy/Review/Submission) to start editing

import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct?: string;
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  currentProduct = 'submission'
}: ProductSelectionModalProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState(currentProduct);

  if (!isOpen) return null;

  const handleStart = () => {
    // Navigate to editor with selected product
    router.push(`/editor?product=${selectedProduct}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Your Business Plan</h2>
        
        <div className="space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of business plan do you need?
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
            <p className="text-xs text-gray-500 mt-2">
              {selectedProduct === 'strategy' && 'Focused sections for strategic planning and early-stage planning'}
              {selectedProduct === 'review' && 'All sections for comprehensive review and feedback'}
              {selectedProduct === 'submission' && 'Complete business plan ready for funding applications'}
            </p>
          </div>

          {/* Optional Program Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> You can add a specific funding program later via URL (e.g., <code className="text-xs">?programId=ffg_basisprogramm</code>) or through the recommendation flow.
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


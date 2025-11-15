// ========= PLAN2FUND — PRODUCT SELECTION MODAL =========
// Simple modal for selecting product and route when entering editor

import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct?: string;
  currentRoute?: string;
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  currentProduct = 'submission',
  currentRoute = 'grants'
}: ProductSelectionModalProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState(currentProduct);
  const [selectedRoute, setSelectedRoute] = useState(currentRoute);

  if (!isOpen) return null;

  const handleStart = () => {
    // Navigate to editor with selected product and route
    router.push(`/editor?product=${selectedProduct}&route=${selectedRoute}`);
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
              🎯 Product Type
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="strategy">Strategy - Quick planning (9 sections)</option>
              <option value="review">Review - Full review (all sections)</option>
              <option value="submission">Submission - Complete plan (all sections)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedProduct === 'strategy' && 'Focused sections for strategic planning'}
              {selectedProduct === 'review' && 'All sections for comprehensive review'}
              {selectedProduct === 'submission' && 'Complete business plan for submission'}
            </p>
          </div>

          {/* Route Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🛣️ Funding Route
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="grants">Grants - Government & EU funding</option>
              <option value="bankLoans">Bank Loans - Traditional financing</option>
              <option value="equity">Equity - Investor funding</option>
              <option value="visa">Visa - Business visa applications</option>
            </select>
          </div>

          {/* Optional Program Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> You can add a specific program later via URL parameter or through the recommendation flow.
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


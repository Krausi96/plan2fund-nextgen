// ========= PLAN2FUND — PRODUCT ROUTE FILTER =========
// Dynamic filter component for product/route/program selection with validation
// Integrates with EditorValidation and EditorNormalization systems

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Route } from '../../types/plan';
import { editorValidation, ValidationResult } from '../../lib/editor/EditorValidation';
import { ProgramData } from '../../lib/editor/EditorValidation';

interface ProductRouteFilterProps {
  // Current values
  product: Product;
  route: Route;
  programId: string | null;
  
  // Callbacks
  onProductChange: (product: Product) => void;
  onRouteChange: (route: Route) => void;
  onProgramChange: (programId: string | null) => void;
  
  // Optional props
  disabled?: boolean;
  showPrograms?: boolean;
  className?: string;
}

export default function ProductRouteFilter({
  product,
  route,
  programId,
  onProductChange,
  onRouteChange,
  onProgramChange,
  disabled = false,
  showPrograms = true,
  className = ''
}: ProductRouteFilterProps) {
  // State for validation and loading
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, warnings: [], suggestions: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramData[]>([]);

  // Load available programs when route changes
  const loadPrograms = useCallback(async () => {
    if (!showPrograms) return;
    
    setIsLoading(true);
    try {
      const programs = await editorValidation.getValidPrograms(route);
      setAvailablePrograms(programs);
    } catch (error) {
      console.error('Error loading programs:', error);
      setAvailablePrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, [route, showPrograms]);

  // Validate current selection
  const validateSelection = useCallback(async () => {
    try {
      const result = await editorValidation.validateProductRouteProgram(product, route, programId);
      setValidation(result);
    } catch (error) {
      console.error('Error validating selection:', error);
      setValidation({ isValid: true, warnings: [], suggestions: [] });
    }
  }, [product, route, programId]);

  // Load programs on mount and when route changes
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // Validate selection when it changes
  useEffect(() => {
    validateSelection();
  }, [validateSelection]);

  // Handle product change
  const handleProductChange = useCallback(async (newProduct: Product) => {
    onProductChange(newProduct);
    
    // Get valid routes for new product
    const validRoutes = await editorValidation.getValidRoutes(newProduct);
    
    // If current route is not valid, change to first valid route
    if (!validRoutes.includes(route)) {
      onRouteChange(validRoutes[0] || 'grant');
    }
  }, [onProductChange, onRouteChange, route]);

  // Handle route change
  const handleRouteChange = useCallback((newRoute: Route) => {
    onRouteChange(newRoute);
    
    // Clear program selection when route changes
    onProgramChange(null);
  }, [onRouteChange, onProgramChange]);

  // Handle program change
  const handleProgramChange = useCallback((newProgramId: string | null) => {
    onProgramChange(newProgramId);
  }, [onProgramChange]);

  // Get available products
  const availableProducts = useMemo(() => 
    editorValidation.getAvailableProducts(), 
    []
  );

  // Get available routes
  const availableRoutes = useMemo(() => 
    editorValidation.getAvailableRoutes(), 
    []
  );

  return (
    <div className={`bg-white border-b border-gray-200 p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Product Selector */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Product</label>
          <select
            value={product}
            onChange={(e) => handleProductChange(e.target.value as Product)}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {availableProducts.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Route Selector */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Funding Type</label>
          <select
            value={route}
            onChange={(e) => handleRouteChange(e.target.value as Route)}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {availableRoutes.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Program Selector */}
        {showPrograms && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              value={programId || ''}
              onChange={(e) => handleProgramChange(e.target.value || null)}
              disabled={disabled || isLoading}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 min-w-[200px]"
            >
              <option value="">Select Program (Optional)</option>
              {availablePrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="text-xs text-gray-500 mt-1">Loading programs...</div>
            )}
          </div>
        )}

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <div className="flex-1">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    {validation.warnings.map((warning, index) => (
                      <div key={index}>{warning}</div>
                    ))}
                  </div>
                  {validation.suggestions.length > 0 && (
                    <div className="mt-2 text-sm text-yellow-600">
                      <strong>Suggestions:</strong> {validation.suggestions.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

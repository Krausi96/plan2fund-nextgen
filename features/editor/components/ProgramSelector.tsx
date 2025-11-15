// ========= PLAN2FUND — SIMPLIFIED PROGRAM SELECTOR =========
// Simple dropdown selector for header (Product, Program)
// Appears in editor header - allows changing product and selecting optional program

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ProgramSelectorProps {
  product?: string;
  programId?: string;
  onSelectionChange?: (product: string, programId?: string) => void;
}

interface ProgramOption {
  id: string;
  name: string;
}

export default function ProgramSelector({
  product = 'submission',
  programId,
  onSelectionChange
}: ProgramSelectorProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<string>(product);
  const [selectedProgram, setSelectedProgram] = useState<string>(programId || '');
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  // Load programs on mount (for grants by default)
  useEffect(() => {
    loadPrograms('grants'); // Default to grants
  }, []);

  // Sync with router query params
  useEffect(() => {
    const { product: qProduct, programId: qProgramId } = router.query;
    if (qProduct) setSelectedProduct(qProduct as string);
    if (qProgramId) setSelectedProgram(qProgramId as string);
  }, [router.query]);

  const loadPrograms = async (fundingType: string) => {
    setIsLoadingPrograms(true);
    try {
      const response = await fetch(`/api/programs?enhanced=true&type=${fundingType}`);
      if (response.ok) {
        const data = await response.json();
        const programList = (Array.isArray(data.programs) ? data.programs : [])
          .slice(0, 20) // Limit to 20 programs
          .map((p: any) => ({
            id: p.id,
            name: p.name || p.title || 'Program'
          }));
        setPrograms(programList);
      } else {
        // If API fails, allow editor to work with default templates
        console.warn('Programs API not available - editor will use default templates');
        setPrograms([]);
      }
    } catch (error) {
      // Silently fail - editor works fine without program list
      console.warn('Programs not available - using default templates:', error);
      setPrograms([]);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const handleProductChange = (value: string) => {
    setSelectedProduct(value);
    updateSelection(value, selectedProgram);
  };

  const handleProgramChange = (value: string) => {
    setSelectedProgram(value);
    updateSelection(selectedProduct, value);
  };

  const updateSelection = (prod: string, prog: string) => {
    // Update URL - programId can be added via URL parameter
    const query: any = { product: prod };
    if (prog) query.programId = prog;
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });

    // Callback
    if (onSelectionChange) {
      onSelectionChange(prod, prog || undefined);
    }
  };
  
  // Allow program to be added via URL parameter
  useEffect(() => {
    const { programId: urlProgramId } = router.query;
    if (urlProgramId && urlProgramId !== selectedProgram) {
      setSelectedProgram(urlProgramId as string);
    }
  }, [router.query.programId, selectedProgram]);

  return (
    <div className="program-selector-header">
      <div className="program-selector-card">
        <div className="program-selector-field">
          <label htmlFor="product-select">
            <span className="selector-icon">🎯</span>
            <span className="selector-label">Product</span>
          </label>
          <select
            id="product-select"
            value={selectedProduct}
            onChange={(e) => handleProductChange(e.target.value)}
            className="selector-dropdown"
          >
            <option value="strategy">Strategy</option>
            <option value="review">Review</option>
            <option value="submission">Submission</option>
          </select>
        </div>

        <div className="program-selector-field">
          <label htmlFor="program-select">
            <span className="selector-icon">📋</span>
            <span className="selector-label">Program</span>
          </label>
          <select
            id="program-select"
            value={selectedProgram}
            onChange={(e) => handleProgramChange(e.target.value)}
            className="selector-dropdown"
            disabled={isLoadingPrograms}
          >
            <option value="">{isLoadingPrograms ? 'Loading...' : programs.length === 0 ? 'Default Template (No Program)' : 'All Programs'}</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <style jsx>{`
        .program-selector-header {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
        }

        .program-selector-card {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .program-selector-field {
          flex: 1;
          min-width: 150px;
        }

        .program-selector-field label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .selector-icon {
          font-size: 1rem;
        }

        .selector-label {
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
        }

        .selector-dropdown {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          font-size: 0.875rem;
          color: #111827;
          transition: all 0.2s ease;
        }

        .selector-dropdown:hover:not(:disabled) {
          border-color: #9ca3af;
        }

        .selector-dropdown:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .selector-dropdown:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .program-selector-card {
            flex-direction: column;
          }

          .program-selector-field {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

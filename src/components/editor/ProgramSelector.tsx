// ========= PLAN2FUND — PROGRAM SELECTOR =========
// Clean program selection interface using SmartWizard design patterns
// Replaces the old selector page with a modern, wizard-style interface

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Types
interface ProgramData {
  id: string;
  name: string;
  description: string;
  institution: string;
  type: string;
  funding_type: string;
  tags: string[];
  score?: number;
  funding_amount?: number;
  deadline?: string;
  isActive: boolean;
}

interface SelectorState {
  programs: ProgramData[];
  isLoading: boolean;
  selectedProgram: ProgramData | null;
  selectedProduct: 'strategy' | 'review' | 'submission';
  selectedRoute: 'grant' | 'loan' | 'equity' | 'visa';
}

interface ProgramSelectorProps {
  onProgramSelect?: (programId: string, product: string, route: string) => void;
  onQuickStart?: (product: string, route: string) => void;
  onWizardRedirect?: () => void;
}

// Program Card Component
const ProgramCard = ({ program, isSelected, onSelect }: {
  program: ProgramData;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <div 
    className={`program-card ${isSelected ? 'selected' : ''}`}
    onClick={onSelect}
  >
    <div className="program-card-header">
      <div className="program-card-title-section">
        <div className="program-card-name">{program.name}</div>
        <div className="program-card-institution">
          <span>🏢</span>
          <span>{program.institution}</span>
        </div>
      </div>
      <div className="program-card-score-section">
        <div className="program-card-score-badge">
          <span>💰</span>
          <span>{program.type}</span>
        </div>
        <div className="program-card-priority-text">
          {program.funding_type} funding
        </div>
      </div>
    </div>
    
    <div className="program-card-body">
      <div className="program-card-description">
        {program.description}
      </div>
      <div className="program-card-tags">
        {program.tags.map(tag => (
          <span key={tag} className="program-card-tag">{tag}</span>
        ))}
      </div>
    </div>
    
    <div className="program-card-footer">
      <span>Click to start editor</span>
      <span className="program-card-arrow">→</span>
    </div>
  </div>
);

// Quick Start Card Component
const QuickStartCard = ({ title, description, icon, onClick }: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) => (
  <div className="quick-start-card" onClick={onClick}>
    <div className="quick-start-card-icon">{icon}</div>
    <div className="quick-start-card-content">
      <h3 className="quick-start-card-title">{title}</h3>
      <p className="quick-start-card-description">{description}</p>
    </div>
    <div className="quick-start-card-arrow">→</div>
  </div>
);

// Loading State Component
const LoadingState = () => (
  <div className="loading-container">
    <div className="loading-content">
      <div className="loading-spinner">✨</div>
      <h2>Loading Programs...</h2>
      <p>Finding the best programs for you</p>
    </div>
  </div>
);

// Main ProgramSelector Component
export default function ProgramSelector({
  onProgramSelect,
  onQuickStart,
  onWizardRedirect
}: ProgramSelectorProps) {
  const router = useRouter();
  
  const [state, setState] = useState<SelectorState>({
    programs: [],
    isLoading: true,
    selectedProgram: null,
    selectedProduct: 'submission',
    selectedRoute: 'grant'
  });

  // Load popular programs
  useEffect(() => {
    loadPopularPrograms();
  }, []);

  const loadPopularPrograms = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('🔄 Loading programs for ProgramSelector...');
      
      // Load programs from API (get first 6 programs)
      const response = await fetch('/api/programs?enhanced=true');
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      // Take first 6 programs as "popular" and clean the data
      const rawPrograms = data.programs || [];
      const programs = rawPrograms.slice(0, 6).map((program: any) => ({
        id: program.id || 'unknown',
        name: program.name || 'Unknown Program',
        description: program.notes || program.description || 'No description available',
        institution: program.source || 'Unknown Institution',
        type: 'grant', // Fixed type
        funding_type: 'grant', // Fixed funding type
        tags: program.tags || [],
        score: program.quality_score || 0,
        funding_amount: program.maxAmount || 0,
        deadline: program.deadline || null,
        isActive: program.isActive !== false
      }));
      
      console.log('📊 Programs loaded:', programs.length);
      console.log('📊 Sample program:', programs[0]);
      
      setState(prev => ({
        ...prev,
        programs: programs,
        isLoading: false
      }));
    } catch (error) {
      console.error('❌ Failed to load programs:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleProgramSelect = (program: ProgramData) => {
    if (onProgramSelect) {
      onProgramSelect(program.id, state.selectedProduct, program.type);
    } else {
      router.push(`/editor?programId=${program.id}&product=${state.selectedProduct}&route=${program.type}`);
    }
  };

  const handleQuickStart = () => {
    if (onQuickStart) {
      onQuickStart(state.selectedProduct, state.selectedRoute);
    } else {
      router.push(`/editor?product=${state.selectedProduct}&route=${state.selectedRoute}`);
    }
  };

  const handleWizardRedirect = () => {
    if (onWizardRedirect) {
      onWizardRedirect();
    } else {
      router.push('/reco?product=submission');
    }
  };

  if (state.isLoading) {
    return <LoadingState />;
  }

  // If no programs loaded, show error state
  if (state.programs.length === 0) {
    return (
      <div className="program-selector-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Unable to load programs</h2>
          <p>Please try refreshing the page or use the wizard to find programs.</p>
          <button 
            onClick={handleWizardRedirect}
            className="wizard-redirect-btn"
          >
            🧙‍♂️ Use Wizard Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="program-selector-container">
      <div className="program-selector-header">
        <div className="program-selector-title">
          <h1>Create Your Business Plan</h1>
          <p>Choose a program to get started with tailored guidance</p>
        </div>
      </div>

      <div className="program-selector-content">
        {/* Product Selection */}
        <div className="product-selection-section">
          <h2>📋 Choose Document Type</h2>
          <div className="product-options">
            <button 
              className={`product-option ${state.selectedProduct === 'submission' ? 'selected' : ''}`}
              onClick={() => setState(prev => ({ ...prev, selectedProduct: 'submission' }))}
            >
              <div className="product-icon">📋</div>
              <div className="product-title">Business Plan</div>
              <div className="product-description">Complete submission-ready plan</div>
            </button>
            
            <button 
              className={`product-option ${state.selectedProduct === 'strategy' ? 'selected' : ''}`}
              onClick={() => setState(prev => ({ ...prev, selectedProduct: 'strategy' }))}
            >
              <div className="product-icon">🎯</div>
              <div className="product-title">Strategy Plan</div>
              <div className="product-description">High-level strategic overview</div>
            </button>
            
            <button 
              className={`product-option ${state.selectedProduct === 'review' ? 'selected' : ''}`}
              onClick={() => setState(prev => ({ ...prev, selectedProduct: 'review' }))}
            >
              <div className="product-icon">📊</div>
              <div className="product-title">Review Plan</div>
              <div className="product-description">Analysis and review document</div>
            </button>
          </div>
        </div>

        {/* Program Selection */}
        <div className="program-selection-section">
          <h2>📋 Available Programs</h2>
          <div className="program-grid">
            {state.programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                isSelected={state.selectedProgram?.id === program.id}
                onSelect={() => handleProgramSelect(program)}
              />
            ))}
          </div>
        </div>

        {/* Quick Start Options */}
        <div className="quick-start-section">
          <h2>⚡ Quick Start</h2>
          <div className="quick-start-grid">
            <QuickStartCard
              title="Generic Business Plan"
              description="Start with a standard business plan template"
              icon="📋"
              onClick={handleQuickStart}
            />
            <QuickStartCard
              title="Find Perfect Match"
              description="Use our SmartWizard to find the best program"
              icon="🔍"
              onClick={handleWizardRedirect}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .program-selector-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .program-selector-header {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          padding: 2rem 0;
        }

        .program-selector-title {
          max-width: 72rem;
          margin: 0 auto;
          text-align: center;
          padding: 0 1.5rem;
        }

        .program-selector-title h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .program-selector-title p {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0;
        }

        .program-selector-content {
          max-width: 72rem;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .product-selection-section {
          margin-bottom: 3rem;
        }

        .product-selection-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .product-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .product-option {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 2px solid rgba(229, 231, 235, 0.5);
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .product-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .product-option.selected {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.05);
        }

        .product-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .product-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .product-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .program-selection-section {
          margin-bottom: 3rem;
        }

        .program-selection-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .program-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .program-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 1.5rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          animation: slideInUp 0.6s ease-out both;
        }

        .program-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .program-card.selected {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .program-card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .program-card-title-section {
          flex: 1;
        }

        .program-card-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
          transition: color 0.2s ease;
        }

        .program-card:hover .program-card-name {
          color: #6366f1;
        }

        .program-card-institution {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .program-card-score-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .program-card-score-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 9999px;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .program-card-priority-text {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .program-card-body {
          padding: 1.5rem;
        }

        .program-card-description {
          color: #6b7280;
          line-height: 1.6;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .program-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .program-card-tag {
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          color: #374151;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .program-card-footer {
          padding: 1rem 1.5rem;
          background: rgba(249, 250, 251, 0.5);
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .program-card-arrow {
          transition: all 0.2s ease;
        }

        .program-card:hover .program-card-arrow {
          color: #6366f1;
          transform: translateX(4px);
        }

        .quick-start-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1.5rem 0;
        }

        .quick-start-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .quick-start-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .quick-start-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: #3B82F6;
        }

        .quick-start-card-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .quick-start-card-content {
          flex: 1;
        }

        .quick-start-card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .quick-start-card-description {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .quick-start-card-arrow {
          color: #9ca3af;
          font-size: 1.25rem;
          transition: all 0.2s ease;
        }

        .quick-start-card:hover .quick-start-card-arrow {
          color: #6366f1;
          transform: translateX(4px);
        }

        .loading-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .loading-content {
          text-align: center;
          animation: fadeIn 0.6s ease-out;
        }

        .loading-spinner {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1.5rem;
          animation: breathe 2s ease-in-out infinite;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .loading-content h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .loading-content p {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0;
        }

        /* Error State Styles */
        .error-state {
          text-align: center;
          padding: 3rem 2rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 1.5rem;
          border: 1px solid rgba(229, 231, 235, 0.5);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-state h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .error-state p {
          color: #6b7280;
          margin: 0 0 2rem 0;
          font-size: 1rem;
        }

        .wizard-redirect-btn {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          color: white;
          border: none;
          border-radius: 0.75rem;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .wizard-redirect-btn:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}

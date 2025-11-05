// ========= PLAN2FUND — PROGRAM SELECTOR =========
// Clean program selection interface using SmartWizard design patterns
// Replaces the old selector page with a modern, wizard-style interface

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useI18n } from '@/shared/contexts/I18nContext';
import type { Translations } from '@/shared/contexts/I18nContext';

// Types
interface ProgramData {
  id: string;
  name: string;
  description: string;
  institution: string;
  type: 'grant' | 'loan' | 'equity' | 'visa' | 'other';
  funding_type: 'grant' | 'loan' | 'equity' | 'visa' | 'other';
  tags: string[];
  score?: number;
  funding_amount?: number;
  deadline?: string;
  isActive: boolean;
  program_focus?: string[];
  target_personas?: string[];
  funding_amount_max?: number;
  funding_amount_min?: number;
  currency?: string;
}

interface SelectorState {
  programs: ProgramData[];
  isLoading: boolean;
  selectedProgram: ProgramData | null;
  selectedProduct: 'strategy' | 'review' | 'submission' | null;
  selectedRoute: 'grant' | 'loan' | 'equity' | 'visa';
}

interface ProgramSelectorProps {
  onProgramSelect?: (programId: string, product: string, route: string) => void;
  onWizardRedirect?: () => void;
}

// Program Card Component (button for reliable click)
const ProgramCard = ({ program, isSelected, onSelect, t }: {
  program: ProgramData;
  isSelected: boolean;
  onSelect: () => void;
  t: (key: keyof Translations) => string;
}) => (
  <button
    type="button"
    role="button"
    tabIndex={0}
    className={`program-card ${isSelected ? 'selected' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500`}
    onClick={onSelect}
    onKeyDown={(e) => { if ((e as any).key === 'Enter') onSelect(); }}
    aria-label={`Open editor for ${program.name}`}
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
      {!!program.tags?.length && (
        <div className="program-card-tags">
          {program.tags.slice(0,4).map(tag => (
            <span key={tag} className="program-card-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
    <div className="program-card-footer">
      <span>{t('editor.selector.clickToStart')}</span>
      <span className="program-card-arrow">→</span>
    </div>
  </button>
);

// Helper function to extract institution name from URL
const extractInstitutionFromUrl = (url: string): string => {
  if (!url) return 'Institution';
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    // Extract main domain name (e.g., 'aws.gv.at' -> 'AWS', 'ffg.at' -> 'FFG')
    const parts = domain.split('.');
    if (parts.length > 0) {
      const mainPart = parts[0].toUpperCase();
      // Handle common Austrian institutions
      if (mainPart.includes('AWS')) return 'AWS - Austria Wirtschaftsservice';
      if (mainPart.includes('FFG')) return 'FFG - Forschungsförderungsgesellschaft';
      if (mainPart.includes('EU') || mainPart.includes('EUROPE')) return 'European Commission';
      if (mainPart.includes('WKO')) return 'WKO - Wirtschaftskammer Österreich';
      // Return capitalized first part
      return mainPart;
    }
    return 'Institution';
  } catch {
    return 'Institution';
  }
};

// Helper function to create a concise, useful program description
const createProgramDescription = (program: any): string => {
  // Build description from meaningful metadata first
  const parts: string[] = [];
  
  // Add funding amount if available
  if (program.funding_amount_max || program.maxAmount) {
    const amount = program.funding_amount_max || program.maxAmount;
    const currency = program.currency || 'EUR';
    if (amount > 0) {
      parts.push(`Up to ${new Intl.NumberFormat('en-US').format(amount)} ${currency}`);
    }
  }
  
  // Add program focus areas
  if (program.program_focus && Array.isArray(program.program_focus) && program.program_focus.length > 0) {
    const focus = program.program_focus.slice(0, 2).join(', ');
    parts.push(`Focus: ${focus}`);
  }
  
  // Add target personas if available
  if (program.target_personas && Array.isArray(program.target_personas) && program.target_personas.length > 0) {
    const personas = program.target_personas.slice(0, 2).join(', ');
    parts.push(`Target: ${personas}`);
  }
  
  // If we have meaningful parts, use them
  if (parts.length > 0) {
    return parts.join(' • ');
  }
  
  // Fallback: use description but make it concise
  const rawDesc = program.description || program.notes || '';
  if (rawDesc.length > 150) {
    // Try to find a sentence boundary
    const truncated = rawDesc.slice(0, 150);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastBoundary = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastBoundary > 50) {
      return rawDesc.slice(0, lastBoundary + 1);
    }
    return truncated + '...';
  }
  
  return rawDesc || 'Funding program';
};

// Loading State Component
const LoadingState = ({ t }: { t: (key: keyof Translations) => string }) => (
  <div className="loading-container">
    <div className="loading-content">
      <div className="loading-spinner">✨</div>
      <h2>{t('editor.selector.loadingPrograms')}</h2>
      <p>{t('editor.selector.loadingProgramsDesc')}</p>
    </div>
  </div>
);

// Main ProgramSelector Component
export default function ProgramSelector({
  onProgramSelect,
  onWizardRedirect
}: ProgramSelectorProps) {
  const router = useRouter();
  const { t } = useI18n();
  
  const [state, setState] = useState<SelectorState>({
    programs: [],
    isLoading: true,
    selectedProgram: null,
    selectedProduct: null,
    selectedRoute: 'grant'
  });
  const [mustChooseProduct, setMustChooseProduct] = useState(false);

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
      
      // Clean & filter programs: require valid id and name
      const rawPrograms = Array.isArray(data.programs) ? data.programs : [];
      const mapType = (pt: any): ProgramData['type'] => {
        const t = String(pt || '').toLowerCase();
        if (t.includes('loan')) return 'loan';
        if (t.includes('equity')) return 'equity';
        if (t.includes('visa')) return 'visa';
        if (t.includes('grant')) return 'grant';
        return 'other';
      };
      const programs = rawPrograms
        .filter((p: any) => p && p.id && (p.name || p.title))
        .slice(0, 12)
        .map((program: any) => {
          const type = mapType(program.type || program.program_type);
          // Use the helper function to create a concise description
          const description = createProgramDescription(program);
          return {
            id: program.id,
            name: program.name || program.title || 'Program',
            description: description,
            institution: program.provider || program.organization || program.source || extractInstitutionFromUrl(program.url || program.source_url || program.link || ''),
            type,
            funding_type: type,
            tags: Array.isArray(program.tags) ? program.tags : [],
            score: program.quality_score || 0,
            funding_amount: program.maxAmount || program.funding_amount_max || 0,
            deadline: program.deadline || null,
            isActive: program.isActive !== false,
            program_focus: program.program_focus || [],
            target_personas: program.target_personas || [],
            funding_amount_max: program.funding_amount_max || program.maxAmount,
            funding_amount_min: program.funding_amount_min || program.minAmount,
            currency: program.currency || 'EUR'
          } as ProgramData;
        });
      
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
    if (!state.selectedProduct) {
      setMustChooseProduct(true);
      return;
    }
    if (onProgramSelect) {
      onProgramSelect(program.id, state.selectedProduct, program.type);
    } else {
      router.push(`/editor?programId=${program.id}&product=${state.selectedProduct}&route=${program.type}`);
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
    return <LoadingState t={t} />;
  }

  // If no programs loaded, show error state
  if (state.programs.length === 0) {
    return (
      <div className="program-selector-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>{t('editor.selector.unableToLoad')}</h2>
          <p>{t('editor.selector.unableToLoadDesc')}</p>
          <button 
            onClick={handleWizardRedirect}
            className="wizard-redirect-btn"
          >
            🧙‍♂️ {t('editor.selector.useWizard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="program-selector-container">
      <Head>
        <title>{t('editor.selector.title')}</title>
      </Head>
      <div className="program-selector-header">
        <div className="program-selector-title">
          <h1>{t('editor.selector.title')}</h1>
          <p>{t('editor.selector.subtitle')}</p>
        </div>
      </div>

      <div className="program-selector-content">
        {/* Primary action */}
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'0.75rem'}}>
          <button
            type="button"
            disabled={!state.selectedProduct}
            onClick={() => {
              if (!state.selectedProduct) { setMustChooseProduct(true); return; }
              router.push(`/editor?product=${state.selectedProduct}&route=${state.selectedRoute}`)
            }}
            className={`px-4 py-2 rounded-lg ${state.selectedProduct ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            title={t('editor.selector.continue')}
          >
            {t('editor.selector.continue')}
          </button>
        </div>
        {/* Product Selection */}
        <div className="product-selection-section">
          <h2>📋 {t('editor.selector.chooseDocumentType')}</h2>
          {mustChooseProduct && (
            <div className="product-warning" role="alert">{t('editor.selector.chooseProductWarning')}</div>
          )}
          <div className="product-options">
            <button 
              className={`product-option ${state.selectedProduct === 'submission' ? 'selected' : ''}`}
              onClick={() => { setMustChooseProduct(false); setState(prev => ({ ...prev, selectedProduct: 'submission' })); }}
            >
              <div className="product-icon">📋</div>
              <div className="product-title">{t('editor.selector.businessPlan')}</div>
              <div className="product-description">{t('editor.selector.businessPlanDesc')}</div>
            </button>
            
            <button 
              className={`product-option ${state.selectedProduct === 'strategy' ? 'selected' : ''}`}
              onClick={() => { setMustChooseProduct(false); setState(prev => ({ ...prev, selectedProduct: 'strategy' })); }}
            >
              <div className="product-icon">🎯</div>
              <div className="product-title">{t('editor.selector.strategyPlan')}</div>
              <div className="product-description">{t('editor.selector.strategyPlanDesc')}</div>
            </button>
            
            <button 
              className={`product-option ${state.selectedProduct === 'review' ? 'selected' : ''}`}
              onClick={() => { setMustChooseProduct(false); setState(prev => ({ ...prev, selectedProduct: 'review' })); }}
            >
              <div className="product-icon">📊</div>
              <div className="product-title">{t('editor.selector.reviewPlan')}</div>
              <div className="product-description">{t('editor.selector.reviewPlanDesc')}</div>
            </button>
          </div>
        </div>

        {/* Program Selection */}
        <div className="program-selection-section">
          <h2>📋 {t('editor.selector.availablePrograms')}</h2>
          <div className="program-grid">
            {state.programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                isSelected={state.selectedProgram?.id === program.id}
                onSelect={() => handleProgramSelect(program)}
                t={t}
              />
            ))}
          </div>
          {!state.selectedProduct && (
            <div className="grid-overlay" aria-hidden="true">
              <div className="grid-overlay-panel">{t('editor.selector.chooseProductToEnable')}</div>
            </div>
          )}
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

        .product-selection-section { margin-bottom: 3rem; }
        .product-selection-section h2 { font-size: 1.5rem; font-weight: 600; color: #111827; margin: 0 0 1.5rem 0; }

        .product-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }

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
        .product-option:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .product-option.selected { border-color: #3B82F6; background: rgba(59, 130, 246, 0.05); }
        .product-warning { margin-bottom: 0.75rem; font-size: 0.9rem; color: #b45309; background: #fff7ed; border: 1px solid #ffedd5; padding: 0.5rem 0.75rem; border-radius: 0.5rem; }
        .product-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .product-title { font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
        .product-description { font-size: 0.875rem; color: #6b7280; }

        .program-selection-section { margin-bottom: 3rem; }
        .program-selection-section h2 { font-size: 1.5rem; font-weight: 600; color: #111827; margin: 0 0 1.5rem 0; }

        .program-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }

        .program-selection-section { position: relative; }
        .grid-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.6); backdrop-filter: blur(2px); border-radius: 0.75rem; pointer-events: none; }
        .grid-overlay-panel { background: rgba(17,24,39,0.85); color: #fff; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }

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
          text-align: left;
        }
        .program-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .program-card.selected { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .program-card-header { padding: 1.5rem; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: flex-start; }
        .program-card-title-section { flex: 1; }
        .program-card-name { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0; transition: color 0.2s ease; }
        .program-card:hover .program-card-name { color: #6366f1; }
        .program-card-institution { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6b7280; }
        .program-card-score-section { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
        .program-card-score-badge { padding: 0.5rem 0.75rem; border-radius: 9999px; color: white; font-size: 0.875rem; font-weight: 700; display: flex; align-items: center; gap: 0.25rem; background: linear-gradient(135deg, #10b981, #059669); }
        .program-card-priority-text { font-size: 0.75rem; color: #6b7280; text-transform: capitalize; }
        .program-card-body { padding: 1.5rem; }
        .program-card-description { color: #6b7280; line-height: 1.6; font-size: 0.875rem; margin-bottom: 1rem; }
        .program-card-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .program-card-tag { padding: 0.25rem 0.75rem; background: #f3f4f6; color: #374151; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
        .program-card-footer { padding: 1rem 1.5rem; background: rgba(249, 250, 251, 0.5); border-top: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; color: #6b7280; }
        .program-card-arrow { transition: all 0.2s ease; }
        .program-card:hover .program-card-arrow { color: #6366f1; transform: translateX(4px); }

        .loading-container { min-height: 100vh; background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdfa 100%); display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .loading-content { text-align: center; animation: fadeIn 0.6s ease-out; }
        .loading-spinner { width: 4rem; height: 4rem; background: linear-gradient(135deg, #3B82F6, #1D4ED8); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; animation: breathe 2s ease-in-out infinite; box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3); }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .loading-content h2 { font-size: 1.875rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0; }
        .loading-content p { color: #6b7280; font-size: 1.125rem; margin: 0; }

        /* Error State Styles */
        .error-state { text-align: center; padding: 3rem 2rem; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-radius: 1.5rem; border: 1px solid rgba(229, 231, 235, 0.5); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .error-icon { font-size: 3rem; margin-bottom: 1rem; }
        .error-state h2 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0; }
        .error-state p { color: #6b7280; margin: 0 0 2rem 0; font-size: 1rem; }
        .wizard-redirect-btn { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; border: none; border-radius: 0.75rem; padding: 1rem 2rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .wizard-redirect-btn:hover { background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
      `}</style>
    </div>
  );
}

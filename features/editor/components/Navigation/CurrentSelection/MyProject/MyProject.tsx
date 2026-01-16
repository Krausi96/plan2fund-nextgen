import React, { useState } from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useEditorActions } from '../../../../lib/hooks/useEditorActions';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';
import GeneralInfoStep from './subSteps/GeneralInfoStep';
// Import other sub-steps when created
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface MyProjectProps {
  className?: string;
  mode?: 'display' | 'form';
  onSubmit?: (data: any) => void;
  subStep?: 1 | 2 | 3;
  onSubStepChange?: (step: 1 | 2 | 3) => void;
  onSkip?: () => void;
}

const MyProject: React.FC<MyProjectProps> = ({ 
  className = '', 
  mode = 'display', 
  onSubmit,
  subStep = 1,
  onSubStepChange,
  onSkip
}) => {
  const { t } = useI18n();
  const { plan } = useEditorState();
  const actions = useEditorActions((a) => ({
    updateSection: a.updateSection,
  }));
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: plan?.settings?.titlePage?.companyName || '',
    legalForm: plan?.settings?.titlePage?.legalForm || '',
    headquartersLocation: plan?.settings?.titlePage?.headquartersLocation || '',
    confidentiality: 'confidential' as 'public' | 'confidential' | 'private',
    author: plan?.settings?.titlePage?.companyName || '',
    stage: 'idea' as 'idea' | 'MVP' | 'revenue',
    country: '',
    industryTags: [] as string[],
    oneLiner: '',
    financialBaseline: {
      fundingNeeded: 0,
      currency: 'EUR',
      startDate: new Date().toISOString().split('T')[0],
      planningHorizon: 12 as 12 | 24 | 36
    }
  });

  // Navigation handlers
  const handleNext = () => {
    if (subStep < 3 && onSubStepChange) {
      onSubStepChange((subStep + 1) as 1 | 2 | 3);
    }
  };

  const handlePrev = () => {
    if (subStep > 1 && onSubStepChange) {
      onSubStepChange((subStep - 1) as 1 | 2 | 3);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!formData.projectName.trim()) {
      alert(t('editor.desktop.setupWizard.validation.projectName') || 'Project name is required');
      return;
    }
    
    actions.updateSection('metadata', {
      titlePage: { companyName: formData.projectName }
    });
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Display mode - keep original simple behavior
  if (mode === 'display') {
    const summary = formData.projectName || t('editor.desktop.myProject.noProject' as any) || 'Not specified';
    return (
      <div className={`flex-1 min-w-0 ${className}`}>
        <div className="text-white font-semibold text-sm leading-snug truncate" title={summary}>
          {summary}
        </div>
      </div>
    );
  }

  // Form mode - simplified with sub-step navigation
  if (mode === 'form') {
    return (
      <div className={`${className}`}>
        {/* Sub-step Header */}
        <div className="mb-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                {subStep === 1 && <><span className="text-2xl">📋</span> General Information (Title Page)</>}
                {subStep === 2 && <><span className="text-2xl">🏢</span> Project Profile</>}
                {subStep === 3 && <><span className="text-2xl">✨</span> Planning Context</>}
              </h3>
              <p className="text-white/70 text-sm mt-1">
                Substep {subStep}/3
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-white/60 hover:text-white text-sm underline transition-colors"
            >
              Skip
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step <= subStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/20 text-white/50'
                }`}>
                  {step < subStep ? <Check className="w-3 h-3" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-6 h-1 mx-1 ${
                    step < subStep ? 'bg-blue-500' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Render current sub-step */}
          {subStep === 1 && (
            <GeneralInfoStep 
              formData={formData} 
              onChange={handleFieldChange} 
            />
          )}
          
          {/* TODO: Add other sub-steps */}
          {subStep === 2 && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h4 className="text-white font-medium mb-3">🏢 Project Profile</h4>
              <p className="text-white/70 text-sm">Coming soon...</p>
            </div>
          )}
          
          {subStep === 3 && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h4 className="text-white font-medium mb-3">✨ Planning Context</h4>
              <p className="text-white/70 text-sm">Coming soon...</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={subStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                subStep === 1
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            {subStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Save & Continue
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return null;
};

export default MyProject;
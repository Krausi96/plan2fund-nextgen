import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';

interface PlanningContextStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const PlanningContextStep: React.FC<PlanningContextStepProps> = ({ 
  formData, 
  onChange 
}) => {
  const { t } = useI18n();
  
  // Navigation state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Navigation helpers
  const totalSteps = 2;
  
  const getStepEmoji = (step: number) => {
    const emojis = ['📅', '🚩'];
    return emojis[step - 1] || '❓';
  };
  
  const getStepTitle = (step: number) => {
    const titles = [
      t('editor.desktop.myProject.sections.planningTimeline' as any) || 'Planning Timeline',
      t('editor.desktop.myProject.sections.businessObjective' as any) || 'Main Project Objective'
    ];
    return titles[step - 1] || `Step ${step}`;
  };
  
  const getStepDescription = (step: number) => {
    const descriptions = [
      t('editor.desktop.myProject.descriptions.planningTimeline' as any) || 'Define your project timeline and planning horizon',
      t('editor.desktop.myProject.descriptions.businessObjective' as any) || 'Select your primary business goal'
    ];
    return descriptions[step - 1] || '';
  };
  
  const isStepRequired = () => {
    return false; // Only step 1 is required
  };
  
  const isStepCompleted = (step: number) => {
    if (!completedSteps.has(step)) return false;
    
    switch(step) {
      case 1: // Planning Timeline
        return formData.financialBaseline?.planningHorizon !== undefined && formData.financialBaseline?.planningHorizon !== null;
      case 2: // Business Objective
        return true; // Optional step
      default:
        return false;
    }
  };
  
  const goToStep = (step: number) => {
    if (step <= totalSteps) {
      setCurrentStep(step);
    }
  };
  
  const markStepAsCompleted = (step: number) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  };
  
  const handleFieldChange = (field: string, value: any) => {
    onChange(field, value);
    // Auto-mark current step as completed when fields are filled
    setTimeout(() => {
      if (isStepCompleted(currentStep)) {
        markStepAsCompleted(currentStep);
      }
    }, 100);
  };
  
  const businessObjectives = [
    { 
      value: 'launch', 
      label: t('editor.desktop.myProject.objectives.launch' as any) || 'Launch a new product / company' 
    },
    { 
      value: 'grow', 
      label: t('editor.desktop.myProject.objectives.grow' as any) || 'Grow an existing business' 
    },
    { 
      value: 'improve', 
      label: t('editor.desktop.myProject.objectives.improve' as any) || 'Improve or restructure operations' 
    },
    { 
      value: 'explore', 
      label: t('editor.desktop.myProject.objectives.explore' as any) || 'Explore a new market / idea' 
    },
    { 
      value: 'internal', 
      label: t('editor.desktop.myProject.objectives.internal' as any) || 'Internal planning / strategy' 
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-0.5">
        {/* Emoji Navigation Bar */}
        <div className="mb-6 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex justify-between gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const isCompleted = isStepCompleted(step);
              const isCurrent = step === currentStep;
              const isRequired = isStepRequired();
              
              let buttonClass = '';
              if (isCompleted) {
                buttonClass = 'bg-green-600/30 border border-green-500 text-green-300';
              } else if (isCurrent) {
                buttonClass = 'bg-blue-600/30 border border-blue-500 text-blue-300';
              } else {
                buttonClass = 'bg-slate-600/50 hover:bg-slate-600 border border-slate-500 text-white';
              }
              
              return (
                <button
                  key={step}
                  onClick={() => goToStep(step)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 ${buttonClass}`}
                >
                  <div className="relative">
                    <span className="text-2xl">{getStepEmoji(step)}</span>
                    {isCompleted && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-center truncate w-full">
                    {getStepTitle(step)}
                    {isRequired && <span className="text-red-400"> *</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="space-y-6">
          
          {/* Step 1: Planning Timeline Section */}
          {currentStep === 1 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📅</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.myProject.fields.planningHorizon' as any) || 'Planning Horizon'}
                  </h4>
                  <span className="text-red-400 font-bold text-sm">*</span>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
                
                <div className="w-full">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="48"
                      step="6"
                      value={formData.financialBaseline?.planningHorizon ?? 0}
                      onChange={(e) => handleFieldChange('financialBaseline.planningHorizon', parseInt(e.target.value))}
                      className="flex-1 h-1.5 mt-1 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-blue-500 [&::-webkit-slider-runnable-track]:to-slate-600 [&::-moz-range-progress]:bg-blue-500 [&::-moz-range-track]:bg-slate-600"
                    />
                    <span className="text-white text-sm font-bold w-20 text-right">
                      {formData.financialBaseline?.planningHorizon ?? 0} {t(`editor.desktop.myProject.months.${(formData.financialBaseline?.planningHorizon ?? 0) === 1 ? 'singular' : 'plural'}` as any)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Objective Section */}
          {currentStep === 2 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🚩</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.myProject.fields.mainObjective' as any) || 'Main Business Objective'}
                  </h4>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
                
                <div className="space-y-2">
                  {businessObjectives.map((objective) => (
                    <button
                      key={objective.value}
                      type="button"
                      onClick={() => handleFieldChange('mainObjective', objective.value)}
                      className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 flex items-center gap-3 ${
                        formData.mainObjective === objective.value
                          ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                          : 'bg-slate-700 border-slate-600 hover:border-blue-400 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-sm">
                        {formData.mainObjective === objective.value ? '●' : '○'}
                      </span>
                      <span className="font-medium text-sm text-white">{objective.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanningContextStep;
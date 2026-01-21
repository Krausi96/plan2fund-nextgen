/**
 * ProjectProfileStep - Enhanced Project Profile section with reco-inspired UI
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';

interface ProjectProfileStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const ProjectProfileStep: React.FC<ProjectProfileStepProps> = ({ 
  formData, 
  onChange 
}) => {
  const { t } = useI18n();
  
  // Navigation state - emoji-based step tracking
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Navigation helpers
  const totalSteps = 5;
  
  const getStepEmoji = (step: number) => {
    const emojis = ['🌍', '🚀', '🏭', '👥', '📅'];
    return emojis[step - 1] || '❓';
  };
  
  const getStepTitle = (step: number) => {
    const titles = [
      t('editor.desktop.myProject.sections.location') || 'Location & Currency',
      t('editor.desktop.myProject.fields.projectStage') || 'Project Stage',
      t('editor.desktop.myProject.fields.industry') || 'Industry',
      t('editor.desktop.myProject.fields.team') || 'Team Information',
      t('editor.desktop.myProject.sections.timeline') || 'Project Timeline'
    ];
    return titles[step - 1] || `Step ${step}`;
  };
  
  const getStepDescription = (step: number) => {
    const descriptions = [
      'Select your country and currency',
      'Choose your current project stage',
      'Describe your industry and focus areas',
      'Provide team size and information',
      'Set your planning horizon'
    ];
    return descriptions[step - 1] || '';
  };
  
  const isStepRequired = (step: number) => {
    // Steps 1 and 2 are required
    return step <= 2;
  };
  
  const isStepCompleted = (step: number) => {
    if (!completedSteps.has(step)) return false;
    
    switch(step) {
      case 1: // Location - No validation
        return true;
      case 2: // Stage
        return formData.stage;
      case 3: // Industry
        return formData.industryFocus?.length > 0;
      case 4: // Team
        return formData.teamSize > 0;
      case 5: // Timeline
        return formData.financialBaseline?.planningHorizon > 0;
      default:
        return false;
    }
  };
  
  const goToStep = (step: number) => {
    // Allow navigation to any step (validation disabled)
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

  // Country to currency mapping
  const countryCurrencyMap: Record<string, string> = {
    'Austria': 'EUR',
    'Germany': 'EUR',
    'France': 'EUR',
    'Italy': 'EUR',
    'Spain': 'EUR',
    'Netherlands': 'EUR',
    'Belgium': 'EUR',
    'Switzerland': 'CHF',
    'United Kingdom': 'GBP',
    'USA': 'USD',
    'Canada': 'CAD'
  };

  const handleCountryChange = (country: string) => {
    handleFieldChange('country', country);
    const currency = countryCurrencyMap[country] || 'EUR';
    handleFieldChange('financialBaseline.currency', currency);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-lg">🏢</span> 
          {t('editor.desktop.myProject.sections.projectProfile') || 'Project Profile'}
        </h3>
      </CardHeader>
      <CardContent>
        {/* Emoji Navigation Bar - Smaller and more compact */}
        <div className="mb-4 p-2 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex justify-between gap-1">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const isCompleted = isStepCompleted(step);
              const isCurrent = step === currentStep;
              const isRequired = isStepRequired(step);
              const isUnlocked = true; // Always unlocked - validation disabled
              
              let buttonClass = '';
              if (isCompleted) {
                buttonClass = 'bg-green-600/30 border border-green-500 text-green-300';
              } else if (isCurrent) {
                buttonClass = 'bg-blue-600/30 border border-blue-500 text-blue-300';
              } else if (isUnlocked) {
                buttonClass = 'bg-slate-600/50 hover:bg-slate-600 border border-slate-500 text-white';
              } else {
                buttonClass = 'bg-slate-800/50 border border-slate-700 text-slate-500 cursor-not-allowed';
              }
              
              return (
                <button
                  key={step}
                  onClick={() => isUnlocked && goToStep(step)}
                  disabled={false}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 ${buttonClass}`}
                >
                  <div className="relative">
                    <span className="text-lg">{getStepEmoji(step)}</span>
                    {isCompleted && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-center truncate w-full">
                    {getStepTitle(step)}
                    {isRequired && <span className="text-red-400"> *</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="space-y-4">
          
          {/* Step 1: Location Section - Only show if current step */}
          {currentStep === 1 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌍</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.myProject.sections.location') || 'Location & Currency'}
                  </h4>
                  <span className="text-red-400 font-bold text-sm">*</span>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-white text-sm font-medium">
                        {t('editor.desktop.myProject.fields.country') || 'Country'}
                      </label>
                      <span className="text-red-400 text-[8px]">*</span>
                    </div>
                    <select
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      required
                    >
                      <option value="">Select country</option>
                      <option value="Austria">Austria</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Italy">Italy</option>
                      <option value="Spain">Spain</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="USA">USA</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.myProject.fields.currency') || 'Currency'}
                    </label>
                    <input
                      type="text"
                      value={formData.financialBaseline.currency}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-700/50 text-white/70 rounded-lg border border-slate-600 cursor-not-allowed text-sm"
                      placeholder="Auto-detected from country"
                    />
                    <p className="text-white/50 text-xs mt-1">
                      Automatically set based on country selection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Project Stage Section - Only show if current step */}
          {currentStep === 2 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🚀</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.myProject.fields.projectStage') || 'Project Stage'}
                  </h4>
                  <span className="text-red-400 font-bold text-sm">*</span>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
            
                <div className="space-y-3">
                  {[
                    { value: 'idea', label: 'Idea (Concept phase, no product yet)', icon: '💡' },
                    { value: 'MVP', label: 'MVP (Minimum Viable Product built)', icon: '🧪' },
                    { value: 'revenue', label: 'Revenue (Generating income, scaling)', icon: '📈' }
                  ].map((stage) => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => handleFieldChange('stage', stage.value)}
                      className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 flex items-center gap-3 ${
                        formData.stage === stage.value
                          ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                          : 'bg-slate-700 border-slate-600 hover:border-blue-400 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-lg">{stage.icon}</span>
                      <div>
                        <div className="font-medium">{stage.label}</div>
                        {formData.stage === stage.value && (
                          <span className="text-sm opacity-90">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industry Section - Only show if current step */}
          {currentStep === 3 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏭</span>
                    <h4 className="text-white font-medium text-sm">
                      {t('editor.desktop.myProject.fields.industry') || 'Industry'}
                    </h4>
                  </div>
                  <span className="text-white/70 text-xs">(Optional)</span>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
            
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.myProject.fields.industryFocus') || 'Industry Focus Areas'} (Multi-select)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { value: 'digital', label: 'Digital & Software' },
                        { value: 'sustainability', label: 'Climate & Sustainability' },
                        { value: 'health', label: 'Health & Life Sciences' },
                        { value: 'manufacturing', label: 'Manufacturing & Hardware' },
                        { value: 'export', label: 'Internationalisation' },
                        { value: 'other', label: 'Something else' }
                      ].map((focus) => {
                        const isSelected = formData.industryFocus?.includes(focus.value) || false;
                        return (
                          <button
                            key={focus.value}
                            type="button"
                            onClick={() => {
                              const current = formData.industryFocus || [];
                              const newValue = isSelected 
                                ? current.filter((v: string) => v !== focus.value)
                                : [...current, focus.value];
                              handleFieldChange('industryFocus', newValue.length > 0 ? newValue : undefined);
                            }}
                            className={`w-full text-left px-3 py-2 border rounded-lg transition-all duration-150 flex items-center gap-2 text-sm ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white font-medium'
                                : 'bg-slate-700 border-slate-600 hover:border-blue-400 hover:bg-slate-600'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-white border-white' : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                            <span>{focus.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Team Section - Only show if current step */}
          {currentStep === 4 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <h4 className="text-white font-medium text-sm">
                      {t('editor.desktop.myProject.fields.team') || 'Team Information'}
                    </h4>
                  </div>
                  <span className="text-white/70 text-xs">(Optional)</span>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-white text-sm font-medium">
                        {t('editor.desktop.myProject.fields.teamSize') || 'Team Size'}
                      </label>
                      <span className="text-red-400 text-[8px]">*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.teamSize || 1}
                        onChange={(e) => handleFieldChange('teamSize', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-white text-sm w-12 text-center">
                        {formData.teamSize || 1}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs mt-1">
                      Number of people working on this project
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Project Timeline Section - Only show if current step */}
          {currentStep === 5 && (
            <div className="border border-slate-600 rounded-lg bg-slate-800/50">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <h4 className="text-white font-medium text-sm">
                      {t('editor.desktop.myProject.sections.timeline') || 'Project Timeline'}
                    </h4>
                  </div>
                  <span className="text-white/70 text-xs">(Optional)</span>
                </div>
                <p className="text-white/70 text-sm font-bold mb-3">{getStepDescription(currentStep)}</p>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-white text-sm font-medium">
                        {t('editor.desktop.myProject.fields.planningHorizon') || 'Planning Horizon'}
                      </label>
                      <span className="text-red-400 text-[8px]">*</span>
                    </div>
                    <select
                      value={formData.financialBaseline.planningHorizon}
                      onChange={(e) => handleFieldChange('financialBaseline.planningHorizon', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    >
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                      <option value={36}>36 months</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Skip Option for Optional Steps */}
        {!isStepRequired(currentStep) && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={() => {
                markStepAsCompleted(currentStep);
                if (currentStep < totalSteps) {
                  goToStep(currentStep + 1);
                }
              }}
              className="text-white/70 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
              <span>⏭️</span>
              Skip this step
            </button>
          </div>
        )}
        

      </CardContent>
    </Card>
  );
};

export default ProjectProfileStep;
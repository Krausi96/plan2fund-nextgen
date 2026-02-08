import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
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
  const totalSteps = 4;
  
  const getStepEmoji = (step: number) => {
    const emojis = ['🌍', '🏗️', '🏭', '👥'];
    return emojis[step - 1] || '❓';
  };
  
  const getStepTitle = (step: number) => {
    const titles = [
      t('editor.desktop.myProject.sections.location') || 'Project Location',
      t('editor.desktop.myProject.fields.projectStage') || 'Project Stage',
      t('editor.desktop.myProject.fields.industry') || 'Industry',
      t('editor.desktop.myProject.fields.team') || 'Team Information'
    ];
    return titles[step - 1] || `Step ${step}`;
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
      <CardContent>
        {/* Sub Navigation Tabs - Full Width Distribution */}
        <div className="mb-2">
          <div className="flex gap-3" style={{display: "flex", gap: "12px", width: "100%"}}>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const isCompleted = isStepCompleted(step);
              const isCurrent = step === currentStep;
              const isRequired = isStepRequired(step);
              
              let buttonClass = '';
              if (isCurrent) {
                buttonClass = 'bg-indigo-500/20 text-white font-bold';
              } else {
                buttonClass = 'bg-slate-800/50 text-slate-400 font-bold hover:text-slate-200 hover:bg-slate-700/40';
              }
              
              return (
                <button
                  key={step}
                  onClick={() => goToStep(step)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-md transition-all duration-200 ${buttonClass}`}
                  style={{flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "52px"}}
                >
                  <div className="relative">
                    <span className="text-sm">{getStepEmoji(step)}</span>
                    {isCompleted && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[12px]">✓</span>
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center">
                    {getStepTitle(step)}
                    {isRequired && <span className="text-red-400"> *</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="space-y-2 pt-3">
          
          {/* Step 1: Location Section - Only show if current step */}
          {currentStep === 1 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🌍</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.myProject.sections.location') || 'Location'}
                  </h4>
                  <span className="text-red-400 font-bold text-sm">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="block text-white text-xs font-bold">
                        {t('editor.desktop.myProject.fields.country') || 'Country'}
                      </label>
                      <span className="text-red-400 text-[6px]">*</span>
                    </div>
                    <select
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      required
                    >
                      <option value="">{t('editor.desktop.myProject.placeholders.selectCountry')}</option>
                      <option value="Austria">{t('editor.desktop.myProject.countries.austria') || 'Austria'}</option>
                      <option value="Germany">{t('editor.desktop.myProject.countries.germany') || 'Germany'}</option>
                      <option value="France">{t('editor.desktop.myProject.countries.france') || 'France'}</option>
                      <option value="Italy">{t('editor.desktop.myProject.countries.italy') || 'Italy'}</option>
                      <option value="Spain">{t('editor.desktop.myProject.countries.spain') || 'Spain'}</option>
                      <option value="Netherlands">{t('editor.desktop.myProject.countries.netherlands') || 'Netherlands'}</option>
                      <option value="Belgium">{t('editor.desktop.myProject.countries.belgium') || 'Belgium'}</option>
                      <option value="Switzerland">{t('editor.desktop.myProject.countries.switzerland') || 'Switzerland'}</option>
                      <option value="United Kingdom">{t('editor.desktop.myProject.countries.unitedKingdom') || 'United Kingdom'}</option>
                      <option value="USA">{t('editor.desktop.myProject.countries.usa') || 'USA'}</option>
                      <option value="Canada">{t('editor.desktop.myProject.countries.canada') || 'Canada'}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white text-xs font-bold mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={formData.region || ''}
                      onChange={(e) => handleFieldChange('region', e.target.value)}
                      placeholder="e.g., Vienna, Bavaria"
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    />
                    <p className="text-white/50 text-[10px] mt-0.5">
                      Optional
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-white text-xs font-bold mb-1">
                      {t('editor.desktop.myProject.fields.currency') || 'Currency'}
                    </label>
                    <input
                      type="text"
                      value={formData.financialBaseline.currency}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-700/50 text-white/70 rounded-lg border border-slate-600 cursor-not-allowed text-sm"
                      placeholder="Auto-detected"
                    />
                    <p className="text-white/50 text-[10px] mt-0.5">
                      Auto
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Project Stage Section - Only show if current step */}
          {currentStep === 2 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏗️</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.myProject.fields.projectStage') || 'Project Stage'}
                  </h4>
                  <span className="text-red-400 font-bold text-sm">*</span>
                </div>
                <div className="space-y-2">
                  <p className="text-white/70 text-xs">{t('editor.desktop.myProject.descriptions.projectStage') || 'Choose your current project stage'}</p>
                  {[
                    { value: 'idea', label: t('editor.desktop.myProject.stages.idea'), icon: '💡' },
                    { value: 'MVP', label: t('editor.desktop.myProject.stages.mvp'), icon: '🧪' },
                    { value: 'revenue', label: t('editor.desktop.myProject.stages.revenue'), icon: '📈' },
                    { value: 'growth', label: t('editor.desktop.myProject.stages.growth'), icon: '💥' },
                  ].map((stage) => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => handleFieldChange('stage', stage.value)}
                      className={`w-full text-left px-3 py-2 border-2 rounded-lg transition-all duration-150 flex items-center gap-2 ${
                        formData.stage === stage.value
                          ? 'bg-indigo-600 border-indigo-600 text-white font-medium shadow-md'
                          : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-sm">{stage.icon}</span>
                      <div>
                        <div className="font-medium text-sm text-white">{stage.label}</div>
                        {formData.stage === stage.value 
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industry Section - Only show if current step */}
          {currentStep === 3 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏭</span>
                    <h4 className="text-white font-bold text-sm">
                      {t('editor.desktop.myProject.fields.industry') || 'Industry'}
                    </h4>
                  </div>
                  <span className="text-white/70 text-xs font-bold">(Optional)</span>
                </div>
                <div className="space-y-4">
                  <p className="text-white/70 text-xs">{t('editor.desktop.myProject.descriptions.industry') || 'Describe your industry and focus areas'}</p>
                  
                  <div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {[{ value: 'digital', label: t('editor.desktop.myProject.industries.digital') },
                        { value: 'sustainability', label: t('editor.desktop.myProject.industries.sustainability') },
                        { value: 'health', label: t('editor.desktop.myProject.industries.health') },
                        { value: 'manufacturing', label: t('editor.desktop.myProject.industries.manufacturing') },
                        { value: 'export', label: t('editor.desktop.myProject.industries.export') },
                        { value: 'other', label: t('editor.desktop.myProject.industries.other') }
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
                            className={`w-full text-left text-white px-2.5 py-1.5 border rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600 font-medium'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-white border-white' : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                            <span className="font-medium">{focus.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {formData.industryFocus?.includes('digital') && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <h4 className="text-white text-xs font-bold mb-1">Digital & Software Focus:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[{ value: 'ai', label: 'AI & Machine Learning' },
                            { value: 'fintech', label: 'FinTech' },
                            { value: 'healthtech', label: 'HealthTech' },
                            { value: 'edtech', label: 'EdTech' },
                            { value: 'iot', label: 'IoT' },
                            { value: 'blockchain', label: 'Blockchain' },
                            { value: 'cybersecurity', label: 'Cybersecurity' },
                            { value: 'cloud_computing', label: 'Cloud Computing' },
                            { value: 'software_development', label: 'Software Development' }
                          ].map((sub) => {
                            const isSelected = formData.digitalFocus?.includes(sub.value) || false;
                            return (
                              <button
                                key={sub.value}
                                type="button"
                                onClick={() => {
                                  const current = formData.digitalFocus || [];
                                  const newValue = isSelected 
                                    ? current.filter((v: string) => v !== sub.value)
                                    : [...current, sub.value];
                                  handleFieldChange('digitalFocus', newValue.length > 0 ? newValue : undefined);
                                }}
                                className={`w-full text-left text-white px-2.5 py-1.5 border rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                    : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-white border-white' : 'border-gray-400'
                                }`}>
                                {isSelected && (
                                  <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                                <span className="font-medium">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {formData.industryFocus?.includes('sustainability') && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <h4 className="text-white text-xs font-bold mb-1">Climate & Sustainability Focus:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[{ value: 'greentech', label: 'GreenTech' },
                            { value: 'cleantech', label: 'CleanTech' },
                            { value: 'circular_economy', label: 'Circular Economy' },
                            { value: 'renewable_energy', label: 'Renewable Energy' },
                            { value: 'climate_tech', label: 'Climate Tech' },
                            { value: 'waste_management', label: 'Waste Management' },
                            { value: 'sustainable_agriculture', label: 'Sustainable Agriculture' }
                          ].map((sub) => {
                            const isSelected = formData.sustainabilityFocus?.includes(sub.value) || false;
                            return (
                              <button
                                key={sub.value}
                                type="button"
                                onClick={() => {
                                  const current = formData.sustainabilityFocus || [];
                                  const newValue = isSelected 
                                    ? current.filter((v: string) => v !== sub.value)
                                    : [...current, sub.value];
                                  handleFieldChange('sustainabilityFocus', newValue.length > 0 ? newValue : undefined);
                                }}
                                className={`w-full text-left text-white px-2.5 py-1.5 border rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                    : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600 font-medium'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-white border-white' : 'border-gray-400'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                                <span className="font-medium">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {formData.industryFocus?.includes('health') && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <h4 className="text-white text-xs font-bold mb-1">Health & Life Sciences Focus:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[{ value: 'biotech', label: 'Biotech' },
                            { value: 'medtech', label: 'MedTech' },
                            { value: 'pharma', label: 'Pharmaceuticals' },
                            { value: 'digital_health', label: 'Digital Health' },
                            { value: 'medical_devices', label: 'Medical Devices' },
                            { value: 'diagnostics', label: 'Diagnostics' },
                            { value: 'therapeutics', label: 'Therapeutics' }
                          ].map((sub) => {
                            const isSelected = formData.healthFocus?.includes(sub.value) || false;
                            return (
                              <button
                                key={sub.value}
                                type="button"
                                onClick={() => {
                                  const current = formData.healthFocus || [];
                                  const newValue = isSelected 
                                    ? current.filter((v: string) => v !== sub.value)
                                    : [...current, sub.value];
                                  handleFieldChange('healthFocus', newValue.length > 0 ? newValue : undefined);
                                }}
                                className={`w-full text-left text-white px-2.5 py-1.5 border rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                    : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600 font-medium'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-white border-white' : 'border-gray-400'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                                <span className="font-medium">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {formData.industryFocus?.includes('manufacturing') && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <h4 className="text-white text-xs font-bold mb-1">Manufacturing & Hardware Focus:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[{ value: 'industry_4_0', label: 'Industry 4.0' },
                            { value: 'smart_manufacturing', label: 'Smart Manufacturing' },
                            { value: 'robotics', label: 'Robotics' },
                            { value: 'automation', label: 'Automation' },
                            { value: 'additive_manufacturing', label: 'Additive Manufacturing (3D Printing)' },
                            { value: 'advanced_materials', label: 'Advanced Materials' },
                            { value: 'quality_control', label: 'Quality Control & Testing' }
                          ].map((sub) => {
                            const isSelected = formData.manufacturingFocus?.includes(sub.value) || false;
                            return (
                              <button
                                key={sub.value}
                                type="button"
                                onClick={() => {
                                  const current = formData.manufacturingFocus || [];
                                  const newValue = isSelected 
                                    ? current.filter((v: string) => v !== sub.value)
                                    : [...current, sub.value];
                                  handleFieldChange('manufacturingFocus', newValue.length > 0 ? newValue : undefined);
                                }}
                                className={`w-full text-left text-white px-2.5 py-1.5 border rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                    : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-white border-white' : 'border-gray-400'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                                <span>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {formData.industryFocus?.includes('export') && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <h4 className="text-white text-xs font-medium mb-1">Internationalisation Focus:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[{ value: 'export_eu', label: 'EU Export' },
                            { value: 'export_global', label: 'Global Export' },
                            { value: 'export_services', label: 'Export Services' },
                            { value: 'export_products', label: 'Export Products' },
                            { value: 'export_technology', label: 'Export Technology' }
                          ].map((sub) => {
                            const isSelected = formData.exportFocus?.includes(sub.value) || false;
                            return (
                              <button
                                key={sub.value}
                                type="button"
                                onClick={() => {
                                  const current = formData.exportFocus || [];
                                  const newValue = isSelected 
                                    ? current.filter((v: string) => v !== sub.value)
                                    : [...current, sub.value];
                                  handleFieldChange('exportFocus', newValue.length > 0 ? newValue : undefined);
                                }}
                                className={`w-full text-left text-white px-2.5 py-1.5 border rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                    : 'bg-slate-700 border-slate-600 hover:border-indigo-400 hover:bg-slate-600'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-white border-white' : 'border-gray-400'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                                <span>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom industry input when 'other' is selected */}
                    {formData.industryFocus?.includes('other') && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <label className="block text-white text-xs font-bold mb-1">
                          {t('editor.desktop.myProject.fields.customIndustry') || 'Specify your industry'}
                        </label>
                        <input
                          type="text"
                          value={formData.customIndustry || ''}
                          onChange={(e) => handleFieldChange('customIndustry', e.target.value)}
                          placeholder={t('editor.desktop.myProject.placeholders.customIndustry') || 'Enter your industry'}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Team Section - Only show if current step */}
          {currentStep === 4 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-4 flex-wrap mt-6 mb-6"> {/* Fixed to positive margin top */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-2xl mb-1">👥</span>
                    <h4 className="text-white font-bold text-sm">
                      {t('editor.desktop.myProject.fields.teamSize') || 'Team Size'}
                    </h4>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center gap-2 min-w-[300px]">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={formData.teamSize || 1}
                      onChange={(e) => handleFieldChange('teamSize', parseInt(e.target.value))}
                      className="w-2/3 h-2 bg-slate-600 rounded-full appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 
                      [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-none
                      [&::-webkit-slider-thumb]:hover:bg-indigo-400 [&::-webkit-slider-thumb]:active:bg-indigo-300
                      [&::-webkit-slider-thumb]:focus:outline-none [&::-webkit-slider-thumb]:focus:ring-0
                      [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 
                      [&::-moz-range-thumb]:hover:bg-indigo-400 [&::-moz-range-thumb]:active:bg-indigo-300
                      [&::-moz-range-thumb]:focus:outline-none [&::-moz-range-thumb]:focus:ring-0
                      [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-indigo-500 [&::-webkit-slider-runnable-track]:to-slate-600 
                      [&::-webkit-slider-runnable-track]:rounded-full 
                      [&::-webkit-slider-runnable-track]:h-2
                      [&::-webkit-slider-runnable-track]:border-0
                      [&::-moz-range-progress]:bg-indigo-500 [&::-moz-range-track]:bg-slate-600
                      focus:outline-none focus:ring-0 focus:shadow-none"
                    />
                    
                    <div className="w-12 text-center bg-slate-700/50 text-white text-sm font-bold rounded border border-slate-600 px-2 py-1">
                      {formData.teamSize || 1}
                    </div>
                  </div>
                  
                  <span className="text-white/70 text-xs font-bold flex-shrink-0">(Optional)</span>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Skip Option for Optional Steps */}
        {!isStepRequired(currentStep) && (
          <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex justify-end">
            <button
              onClick={() => {
                markStepAsCompleted(currentStep);
                if (currentStep < totalSteps) {
                  goToStep(currentStep + 1);
                }
              }}
              className="text-white/70 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <span>⏭️</span>
              {t('editor.desktop.myProject.buttons.skipStep')}
            </button>
          </div>
        )}
        

      </CardContent>
    </Card>
  );
};

export default ProjectProfileStep;
import React, { useState } from 'react';
import { Card, CardContent } from '../../../../../../../shared/components/ui/card';
import { useI18n } from '../../../../../../../shared/contexts/I18nContext';

interface GeneralInfoStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onInteraction?: () => void; // New prop to notify parent of user interaction
}

const GeneralInfoStep: React.FC<GeneralInfoStepProps> = ({ formData, onChange, onInteraction }) => {
  const { t } = useI18n();
  
  // Navigation state - emoji-based step tracking
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Navigation helpers
  const totalSteps = 3;
  
  const getStepEmoji = (step: number) => {
    const emojis = ['📋', '📑', '📞'];
    return emojis[step - 1] || '❓';
  };
  
  const getStepTitle = (step: number) => {
    const titles = [
      t('editor.desktop.setupWizard.fields.generalInfo') || 'General Information',
      t('editor.desktop.setupWizard.fields.documentInfo') || 'Document Information',
      t('editor.desktop.setupWizard.fields.contactInfo') || 'Contact Information'
    ];
    return titles[step - 1] || `Step ${step}`;
  };
  
  const isStepRequired = (step: number) => {
    // Step 1 is required, others are optional
    return step === 1;
  };
  
  const isStepCompleted = (step: number) => {
    if (!completedSteps.has(step)) return false;
    
    switch(step) {
      case 1: // General Information - Check if title and author are filled
        return formData.title && formData.companyName;
      case 2: // Document Information - Check if any field is filled
        return formData.subtitle || formData.date || formData.logoUrl;
      case 3: // Contact Information - Check if any field is filled
        return formData.contactInfo?.email || formData.contactInfo?.phone || formData.contactInfo?.website || formData.contactInfo?.address;
      default:
        return false;
    }
  };
  
  const goToStep = (step: number) => {
    // Allow navigation to any step
    if (step <= totalSteps) {
      setCurrentStep(step);
    }
  };
  
  const markStepAsCompleted = (step: number) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  };
  
  // Wrapper function to track user interaction
  const handleChange = (field: string, value: any) => {
    // Notify parent that user has interacted (only once)
    if (onInteraction) {
      onInteraction();
    }
    // Call original onChange
    onChange(field, value);
    // Auto-mark current step as completed when fields are filled
    setTimeout(() => {
      if (isStepCompleted(currentStep)) {
        markStepAsCompleted(currentStep);
      }
    }, 100);
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
                buttonClass = 'bg-slate-600/40 text-white font-bold';
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
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></span>
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
          {/* Step 1: General Information Section - Only show if current step */}
          {currentStep === 1 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📋</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.setupWizard.fields.generalInfo') || 'General Information'}
                  </h4>
                  <span className="text-red-400 font-bold text-sm">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.projectName') || 'Document Title'} *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.projectName') || 'Document Title'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.author') || 'Author / Organization'} *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.author') || 'Your name or organization'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.confidentiality')}
                    </label>
                    <select
                      value={formData.confidentiality}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChange('confidentiality', value);
                        // Use translated values that match the current UI language
                        let statement = '';
                        switch(value) {
                          case 'public':
                            statement = t('editor.desktop.setupWizard.options.public');
                            break;
                          case 'confidential':
                            statement = t('editor.desktop.setupWizard.options.confidential');
                            break;
                          case 'private':
                            statement = t('editor.desktop.setupWizard.options.private');
                            break;
                          default:
                            statement = value.charAt(0).toUpperCase() + value.slice(1);
                        }
                        handleChange('confidentialityStatement', statement);
                      }}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    >
                      <option value="public">{t('editor.desktop.setupWizard.options.public')}</option>
                      <option value="confidential">{t('editor.desktop.setupWizard.options.confidential')}</option>
                      <option value="private">{t('editor.desktop.setupWizard.options.private')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Document Information Section - Only show if current step */}
          {currentStep === 2 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📑</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.setupWizard.fields.documentInfo') || 'Document Information'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.subtitle')}
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => handleChange('subtitle', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.subtitle')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.date')}
                    </label>
                    <input
                      type="date"
                      value={formData.date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleChange('date', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.logo')}
                    </label>
                    <label className="flex items-center gap-2 w-full px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
                      <div className="text-yellow-400 text-lg">📁</div>
                      <span className="text-white text-sm font-medium">{t('editor.ui.upload') || 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Convert file to data URL for preview
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              handleChange('logoUrl', event.target?.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Contact Information Section - Only show if current step */}
          {currentStep === 3 && (
            <div className="border border-slate-600/70 rounded-md bg-slate-800/30">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📞</span>
                  <h4 className="text-white font-bold text-sm">
                    {t('editor.desktop.setupWizard.fields.contactInfo') || 'Contact Information'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.email')}
                    </label>
                    <input
                      type="email"
                      value={formData.contactInfo?.email || ''}
                      onChange={(e) => handleChange('contactInfo.email', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.email')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.contactInfo?.phone || ''}
                      onChange={(e) => handleChange('contactInfo.phone', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.phone')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.website')}
                    </label>
                    <input
                      type="url"
                      value={formData.contactInfo?.website || ''}
                      onChange={(e) => handleChange('contactInfo.website', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.website')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-bold mb-2">
                      {t('editor.desktop.setupWizard.fields.address')}
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo?.address || ''}
                      onChange={(e) => handleChange('contactInfo.address', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.address')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralInfoStep;
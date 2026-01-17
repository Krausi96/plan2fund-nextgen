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
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    stage: true,
    industry: false,
    team: false,
    timeline: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    onChange('country', country);
    const currency = countryCurrencyMap[country] || 'EUR';
    onChange('financialBaseline.currency', currency);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-xl">🏢</span> 
          {t('editor.desktop.myProject.sections.projectProfile') || 'Project Profile'}
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Location Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('location')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>🌍</span>
                <span className="text-white font-medium">
                  {t('editor.desktop.myProject.sections.location') || 'Location & Currency'}
                </span>
                <span className="text-white/70 text-sm">
                  ({t('editor.desktop.setupWizard.required') || 'Required'})
                </span>
              </div>
              <span className={`transform transition-transform ${expandedSections.location ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.location && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.myProject.fields.country') || 'Country'} *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      required
                    >
                      <option value="">{t('editor.desktop.myProject.placeholders.selectCountry') || 'Select country'}</option>
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
                      {t('editor.desktop.myProject.hints.currencyAuto') || 'Automatically set based on country selection'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Stage Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('stage')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span className="text-white font-medium">
                  {t('editor.desktop.myProject.fields.projectStage') || 'Project Stage'}
                </span>
                <span className="text-white/70 text-sm">
                  ({t('editor.desktop.setupWizard.required') || 'Required'})
                </span>
              </div>
              <span className={`transform transition-transform ${expandedSections.stage ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.stage && (
              <div className="px-4 pb-4 pt-2">
                <div className="space-y-3">
                  {[
                    { value: 'idea', label: t('editor.desktop.myProject.stages.idea') || 'Idea (Concept phase, no product yet)', icon: '💡' },
                    { value: 'MVP', label: t('editor.desktop.myProject.stages.mvp') || 'MVP (Minimum Viable Product built)', icon: '🧪' },
                    { value: 'revenue', label: t('editor.desktop.myProject.stages.revenue') || 'Revenue (Generating income, scaling)', icon: '📈' }
                  ].map((stage) => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => onChange('stage', stage.value)}
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
                            {t('editor.desktop.myProject.selected') || 'Selected'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Industry Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('industry')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>🏭</span>
                <span className="text-white font-medium">
                  {t('editor.desktop.myProject.fields.industry') || 'Industry'}
                </span>
                <span className="text-white/70 text-sm">
                  ({t('editor.desktop.setupWizard.optional') || 'Optional'})
                </span>
              </div>
              <span className={`transform transition-transform ${expandedSections.industry ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.industry && (
              <div className="px-4 pb-4 pt-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.myProject.fields.industryTags') || 'Industry Tags'}
                    </label>
                    <input
                      type="text"
                      value={formData.industryTags.join(', ')}
                      onChange={(e) => onChange('industryTags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                      placeholder={t('editor.desktop.myProject.placeholders.industryTags') || 'Tech, SaaS, FinTech'}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  
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
                              onChange('industryFocus', newValue.length > 0 ? newValue : undefined);
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
            )}
          </div>

          {/* Project Timeline Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('timeline')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span className="text-white font-medium">
                  {t('editor.desktop.myProject.sections.timeline') || 'Project Timeline'}
                </span>
                <span className="text-white/70 text-sm">
                  ({t('editor.desktop.setupWizard.optional') || 'Optional'})
                </span>
              </div>
              <span className={`transform transition-transform ${expandedSections.timeline ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.timeline && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.myProject.fields.planningHorizon') || 'Planning Horizon'}
                    </label>
                    <select
                      value={formData.financialBaseline.planningHorizon}
                      onChange={(e) => onChange('financialBaseline.planningHorizon', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    >
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                      <option value={36}>36 months</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Team Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('team')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span className="text-white font-medium">
                  {t('editor.desktop.myProject.fields.team') || 'Team Information'}
                </span>
                <span className="text-white/70 text-sm">
                  ({t('editor.desktop.setupWizard.optional') || 'Optional'})
                </span>
              </div>
              <span className={`transform transition-transform ${expandedSections.team ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.team && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.myProject.fields.teamSize') || 'Team Size'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.teamSize || 1}
                        onChange={(e) => onChange('teamSize', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-white text-sm w-12 text-center">
                        {formData.teamSize || 1}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs mt-1">
                      {t('editor.desktop.myProject.hints.teamSize') || 'Number of people working on this project'}
                    </p>
                  </div>
                  

                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectProfileStep;
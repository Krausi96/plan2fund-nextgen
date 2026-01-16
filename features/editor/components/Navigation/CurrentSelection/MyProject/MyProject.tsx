import React, { useState } from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useEditorActions } from '../../../../lib/hooks/useEditorActions';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';
import GeneralInfoStep from './subSteps/GeneralInfoStep';

interface MyProjectProps {
  className?: string;
  mode?: 'display' | 'form';
  onSubmit?: (data: any) => void;
  currentSection?: 1 | 2 | 3;
  onSectionChange?: (section: 1 | 2 | 3) => void;
}

const MyProject: React.FC<MyProjectProps> = ({ 
  className = '', 
  mode = 'display', 
  onSubmit,
  currentSection = 1,
  onSectionChange
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

  // Form mode - section navigation like subtle
  if (mode === 'form') {
    // Navigation handler
    const handleNavClick = (section: 1 | 2 | 3) => {
      if (onSectionChange) {
        onSectionChange(section);
      }
    };

    return (
      <div className={`${className} flex gap-4`}>
        {/* Navigation Sidebar - Slightly Increased Width */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <nav className="space-y-2">
              <button
                onClick={() => handleNavClick(1)}
                className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors ${
                  currentSection === 1 
                    ? 'bg-blue-500/30 text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">📋</span>
                <span className="text-sm">General Info</span>
              </button>
              
              <button
                onClick={() => handleNavClick(2)}
                className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors ${
                  currentSection === 2 
                    ? 'bg-blue-500/30 text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">🏢</span>
                <span className="text-sm">Project Profile</span>
              </button>
              
              <button
                onClick={() => handleNavClick(3)}
                className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors ${
                  currentSection === 3 
                    ? 'bg-blue-500/30 text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-lg">✨</span>
                <span className="text-sm">Planning Context</span>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Content - Single Section at a Time */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show only current section */}
            {currentSection === 1 && (
              <GeneralInfoStep 
                formData={formData} 
                onChange={handleFieldChange} 
              />
            )}
            
            {currentSection === 2 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="text-xl">🏢</span> 
                  {t('editor.desktop.myProject.sections.projectProfile') || 'Project Profile'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('editor.desktop.myProject.fields.industryTags') || 'Industry Tags'}
                    </label>
                    <input
                      type="text"
                      value={formData.industryTags.join(', ')}
                      onChange={(e) => handleFieldChange('industryTags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                      placeholder={t('editor.desktop.myProject.placeholders.industryTags') || 'Tech, SaaS, FinTech'}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('editor.desktop.myProject.fields.planningHorizon') || 'Planning Horizon (months)'}
                    </label>
                    <select
                      value={formData.financialBaseline.planningHorizon}
                      onChange={(e) => handleFieldChange('financialBaseline.planningHorizon', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={12}>12 months</option>
                      <option value={24}>24 months</option>
                      <option value={36}>36 months</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {currentSection === 3 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="text-xl">✨</span> 
                  {t('editor.desktop.myProject.sections.planningContext') || 'Planning Context'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">One-liner Description</label>
                    <textarea
                      value={formData.oneLiner}
                      onChange={(e) => handleFieldChange('oneLiner', e.target.value)}
                      placeholder="Brief description of your project vision"
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">Confidentiality Level</label>
                    <select
                      value={formData.confidentiality}
                      onChange={(e) => handleFieldChange('confidentiality', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="confidential">Confidential</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default MyProject;
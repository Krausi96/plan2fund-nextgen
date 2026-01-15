import React, { useState } from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useEditorActions } from '../../../../lib/hooks/useEditorActions';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';

interface MyProjectProps {
  className?: string;
  mode?: 'display' | 'form';
  onSubmit?: (data: any) => void;
}

const MyProject: React.FC<MyProjectProps> = ({ className = '', mode = 'display', onSubmit }) => {
  const { t } = useI18n();
  const { plan } = useEditorState();
  const actions = useEditorActions((a) => ({
    updateSection: a.updateSection,
  }));
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: plan?.settings?.titlePage?.companyName || '',
    author: plan?.settings?.titlePage?.companyName || '',
    confidentiality: 'confidential' as 'public' | 'confidential' | 'private',
    oneLiner: '',
    stage: 'idea' as 'idea' | 'MVP' | 'revenue',
    country: '',
    industryTags: [] as string[],
    financialBaseline: {
      fundingNeeded: 0,
      currency: 'EUR',
      startDate: new Date().toISOString().split('T')[0],
      planningHorizon: 12 as 12 | 24 | 36
    }
  });

  // Extract key project information from the plan metadata
  const companyName = plan?.settings?.titlePage?.companyName || 'Not specified';
  const legalForm = plan?.settings?.titlePage?.legalForm || 'Not specified';
  const headquartersLocation = plan?.settings?.titlePage?.headquartersLocation || 'Not specified';

  // Get a single line summary for display
  const projectSummary = companyName !== 'Not specified' 
    ? companyName 
    : (legalForm !== 'Not specified' 
      ? legalForm 
      : headquartersLocation !== 'Not specified' 
        ? headquartersLocation 
        : t('editor.desktop.myProject.noProject' as any) || 'No project');

  const handleChange = (field: string, value: any) => {
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
    
    // Validate required fields
    if (!formData.projectName.trim()) {
      alert(t('editor.desktop.setupWizard.validation.projectName'));
      return;
    }
    if (!formData.author.trim()) {
      alert(t('editor.desktop.setupWizard.validation.author'));
      return;
    }
    if (!formData.oneLiner.trim()) {
      alert(t('editor.desktop.setupWizard.validation.oneLiner'));
      return;
    }
    if (!formData.country.trim()) {
      alert(t('editor.desktop.setupWizard.validation.country'));
      return;
    }
    
    // Update the plan with form data
    actions.updateSection('metadata', {
      titlePage: {
        companyName: formData.projectName,
        // Other fields would go here
      }
    });
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Display mode - original behavior
  if (mode === 'display') {
    return (
      <div className={`flex-1 min-w-0 ${className}`}>
        <div className="text-white font-semibold text-sm leading-snug truncate" title={projectSummary}>
          {projectSummary}
        </div>
      </div>
    );
  }

  // Form mode - enhanced with fields
  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {t('editor.desktop.setupWizard.fields.projectName')} *
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => handleChange('projectName', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            placeholder={t('editor.desktop.setupWizard.placeholders.projectName')}
            required
          />
        </div>
        
        {/* Author */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {t('editor.desktop.setupWizard.fields.author')} *
          </label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => handleChange('author', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            placeholder={t('editor.desktop.setupWizard.placeholders.author')}
            required
          />
        </div>
        
        {/* Confidentiality */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {t('editor.desktop.setupWizard.fields.confidentiality')}
          </label>
          <select
            value={formData.confidentiality}
            onChange={(e) => handleChange('confidentiality', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          >
            <option value="public">{t('editor.desktop.setupWizard.options.public')}</option>
            <option value="confidential">{t('editor.desktop.setupWizard.options.confidential')}</option>
            <option value="private">{t('editor.desktop.setupWizard.options.private')}</option>
          </select>
        </div>
        
        {/* Stage */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {t('editor.desktop.setupWizard.fields.stage')}
          </label>
          <select
            value={formData.stage}
            onChange={(e) => handleChange('stage', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          >
            <option value="idea">{t('editor.desktop.setupWizard.options.idea')}</option>
            <option value="MVP">{t('editor.desktop.setupWizard.options.mvp')}</option>
            <option value="revenue">{t('editor.desktop.setupWizard.options.revenue')}</option>
          </select>
        </div>
        
        {/* Country */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {t('editor.desktop.setupWizard.fields.country')} *
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            placeholder={t('editor.desktop.setupWizard.placeholders.country')}
            required
          />
        </div>
        
        {/* Funding Needed */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {t('editor.desktop.setupWizard.fields.fundingNeeded')} ({formData.financialBaseline.currency})
          </label>
          <input
            type="number"
            value={formData.financialBaseline.fundingNeeded}
            onChange={(e) => handleChange('financialBaseline.fundingNeeded', Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            min="0"
            placeholder={t('editor.desktop.setupWizard.placeholders.fundingAmount')}
          />
        </div>
      </div>
      
      {/* One-liner Description */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {t('editor.desktop.setupWizard.fields.oneLiner')} *
        </label>
        <textarea
          value={formData.oneLiner}
          onChange={(e) => handleChange('oneLiner', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          rows={3}
          placeholder={t('editor.desktop.setupWizard.placeholders.oneLiner')}
          required
        />
      </div>
      
      {/* Submit Button - only show when not used in wizard */}
      {!onSubmit && (
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            {t('editor.desktop.setupWizard.buttons.save')}
          </button>
        </div>
      )}
    </form>
  );
};

export default MyProject;
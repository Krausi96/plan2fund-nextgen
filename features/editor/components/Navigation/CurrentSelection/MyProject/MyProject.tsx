import React, { useState, useMemo } from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useEditorActions } from '../../../../lib/hooks/useEditorActions';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';
import GeneralInfoStep from './subSteps/GeneralInfoStep';
import ProjectProfileStep from './subSteps/ProjectProfileStep';
import LivePreviewBox from './LivePreviewBox';

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
    // Title Page fields
    title: plan?.settings?.titlePage?.title || '',
    subtitle: plan?.settings?.titlePage?.subtitle || '',
    companyName: plan?.settings?.titlePage?.companyName || '',
    legalForm: plan?.settings?.titlePage?.legalForm || '',
    date: plan?.settings?.titlePage?.date || new Date().toISOString().split('T')[0],
    // Other form fields
    author: plan?.settings?.titlePage?.companyName || '',
    confidentiality: 'confidential' as 'public' | 'confidential' | 'private',
    stage: 'idea' as 'idea' | 'MVP' | 'revenue',
    country: '',
    industryTags: [] as string[],
    oneLiner: '',
    contactInfo: {
      email: plan?.settings?.titlePage?.contactInfo?.email || '',
      phone: plan?.settings?.titlePage?.contactInfo?.phone || '',
      website: plan?.settings?.titlePage?.contactInfo?.website || '',
      address: plan?.settings?.titlePage?.contactInfo?.address || '',
    },
    financialBaseline: {
      fundingNeeded: 0,
      currency: 'EUR',
      startDate: new Date().toISOString().split('T')[0],
      planningHorizon: 12 as 12 | 24 | 36
    }
  });

  // Debounced store update
  const debouncedUpdate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (updates: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        actions.updateSection('metadata', updates);
      }, 500); // 500ms debounce
    };
  }, [actions]);

  const handleFieldChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const newData = {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value
          }
        };
        
        // Update store with debounced save
        debouncedUpdate({
          titlePage: { 
            title: newData.title,
            subtitle: newData.subtitle,
            companyName: newData.companyName,
            legalForm: newData.legalForm,
            date: newData.date,
            contactInfo: newData.contactInfo
          }
        });
        
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Update store with debounced save
        debouncedUpdate({
          titlePage: { 
            title: newData.title,
            subtitle: newData.subtitle,
            companyName: newData.companyName,
            legalForm: newData.legalForm,
            date: newData.date,
            contactInfo: newData.contactInfo
          }
        });
        
        return newData;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!formData.title.trim()) {
      alert(t('editor.desktop.setupWizard.validation.projectName') || 'Project name is required');
      return;
    }
    
    actions.updateSection('metadata', {
      titlePage: { 
        title: formData.title,
        subtitle: formData.subtitle,
        companyName: formData.companyName,
        legalForm: formData.legalForm,
        date: formData.date,
        contactInfo: formData.contactInfo
      }
    });
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Display mode - keep original simple behavior
  if (mode === 'display') {
    const summary = formData.title || t('editor.desktop.myProject.noProject' as any) || 'Not specified';
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
      <>
        <div className={`${className} flex gap-4 items-start`}>
          {/* Navigation Sidebar - Further increased width to prevent text cutoff */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-slate-800 rounded-lg p-2 border border-slate-700">
              <nav className="space-y-2">
                <button
                  onClick={() => handleNavClick(1)}
                  className={`w-full text-left flex items-center gap-2 p-1.5 rounded transition-colors ${
                    currentSection === 1 
                      ? 'bg-blue-500/30 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">📋</span>
                  <span className="text-sm whitespace-nowrap">{t('editor.desktop.myProject.sections.generalInfo') || 'General Info'}</span>
                </button>
                
                <button
                  onClick={() => handleNavClick(2)}
                  className={`w-full text-left flex items-center gap-2 p-1.5 rounded transition-colors ${
                    currentSection === 2 
                      ? 'bg-blue-500/30 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">🏢</span>
                  <span className="text-sm whitespace-nowrap">{t('editor.desktop.myProject.sections.projectProfile') || 'Project Profile'}</span>
                </button>
                
                <button
                  onClick={() => handleNavClick(3)}
                  className={`w-full text-left flex items-center gap-2 p-1.5 rounded transition-colors ${
                    currentSection === 3 
                      ? 'bg-blue-500/30 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">✨</span>
                  <span className="text-sm whitespace-nowrap">{t('editor.desktop.myProject.sections.planningContext') || 'Planning Context'}</span>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main Content - Flexible width to accommodate sidebar */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Show only current section */}
              {currentSection === 1 && (
                <GeneralInfoStep 
                  formData={formData} 
                  onChange={handleFieldChange} 
                />
              )}
              
              {currentSection === 2 && (
                <ProjectProfileStep 
                  formData={formData} 
                  onChange={handleFieldChange} 
                />
              )}
              
              {currentSection === 3 && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="text-xl">✨</span> 
                    {t('editor.desktop.myProject.sections.planningContext') || 'Planning Context'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        {t('editor.desktop.myProject.fields.oneLiner') || 'One-liner Description'}
                      </label>
                      <textarea
                        value={formData.oneLiner}
                        onChange={(e) => handleFieldChange('oneLiner', e.target.value)}
                        placeholder="Brief description of your project vision"
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">
                        {t('editor.desktop.myProject.fields.confidentiality') || 'Confidentiality Level'}
                      </label>
                      <select
                        value={formData.confidentiality}
                        onChange={(e) => handleFieldChange('confidentiality', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="public">{t('editor.desktop.setupWizard.options.public') || 'Public'}</option>
                        <option value="confidential">{t('editor.desktop.setupWizard.options.confidential') || 'Confidential'}</option>
                        <option value="private">{t('editor.desktop.setupWizard.options.private') || 'Private'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              
            </form>
          </div>
        </div>
        <LivePreviewBox formData={formData} />
      </>
    );
  }

  return null;
};

export default MyProject;
import React, { useState } from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useEditorActions } from '../../../../lib/hooks/useEditorActions';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';
import { METADATA_SECTION_ID } from '@/features/editor/lib/constants';
import GeneralInfoStep from './subSteps/GeneralInfoStep';
import ProjectProfileStep from './subSteps/ProjectProfileStep';
import LivePreviewBox from './LivePreviewBox';

interface MyProjectProps {
  className?: string;
  mode?: 'display' | 'form';
  onSubmit?: (data: any) => void;
  currentSection?: 1 | 2 | 3;
  onSectionChange?: (section: 1 | 2 | 3) => void;
  showPreview?: boolean;
  onInteraction?: () => void;
}

const MyProject: React.FC<MyProjectProps> = ({ 
  className = '', 
  mode = 'display', 
  onSubmit,
  currentSection = 1,
  onSectionChange,
  showPreview = false,
  onInteraction
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
    logoUrl: plan?.settings?.titlePage?.logoUrl || '',
    confidentialityStatement: plan?.settings?.titlePage?.confidentialityStatement || '',
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

  // Debug logging for form data and store updates
  console.log('MyProject form data:', {
    title: formData.title,
    companyName: formData.companyName,
    storeTitle: plan?.settings?.titlePage?.title,
    confidentiality: formData.confidentiality,
    confidentialityStatement: formData.confidentialityStatement
  });
  
  // Store update debugging can be added later if needed

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
        
        // Immediate update for all title page fields to trigger preview
        // Using queueMicrotask to defer the store update to next tick
        queueMicrotask(() => {
          actions.updateSection(METADATA_SECTION_ID, { 
            title: newData.title,
            subtitle: newData.subtitle,
            companyName: newData.companyName,
            legalForm: newData.legalForm,
            date: newData.date,
            logoUrl: newData.logoUrl,
            confidentialityStatement: newData.confidentialityStatement,
            contactInfo: newData.contactInfo
          });
        });
        
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Immediate update for all title page fields to trigger preview
        // Using queueMicrotask to defer the store update to next tick
        queueMicrotask(() => {
          actions.updateSection(METADATA_SECTION_ID, { 
            title: newData.title,
            subtitle: newData.subtitle,
            companyName: newData.companyName,
            legalForm: newData.legalForm,
            date: newData.date,
            logoUrl: newData.logoUrl,
            confidentialityStatement: newData.confidentialityStatement,
            contactInfo: newData.contactInfo
          });
        });
        
        return newData;
      });
    }
  };

    // Enhanced handleSubmit with validation
    const handleNextStep = () => {
      // Validate required fields from both sections
      const missingFields = [];
      
      if (!formData.title?.trim()) missingFields.push('Document Title');
      if (!formData.companyName?.trim()) missingFields.push('Author/Organization');
      if (!formData.oneLiner?.trim()) missingFields.push('One-liner Description');
      if (!formData.confidentiality) missingFields.push('Confidentiality Level');
      
      if (missingFields.length > 0) {
        alert(`Please complete the following required fields before proceeding: ${missingFields.join(', ')}`);
        return;
      }
      
      // Proceed to next step
      if (onSubmit) {
        onSubmit(formData);
      }
    };

  // Display mode - keep original simple behavior
  if (mode === 'display') {
    const summary = formData.title || t('editor.desktop.myProject.noProject' as any) || 'Not specified';
    return (
      <div className={`flex-1 min-w-0 max-w-[140px] ${className}`}>
        <div className="text-white font-semibold text-sm leading-snug truncate overflow-hidden whitespace-nowrap block w-full" title={summary}>
          {summary}
        </div>
      </div>
    );
  }

  // Form mode - section navigation like subtle
  if (mode === 'form') {
    // Enhanced navigation handler with section-level validation
    const handleNavClick = (section: 1 | 2 | 3) => {
      // Prevent moving from Section 1 to Section 2 without required General Info fields
      if (currentSection === 1 && section === 2) {
        if (!formData.title?.trim() || !formData.companyName?.trim()) {
          alert('Please complete the required fields (Document Title and Author/Organization) before proceeding');
          return;
        }
      }
      
      // Prevent moving from Section 2 to Section 3 (Planning Context)
      if (currentSection === 2 && section === 3) {
        // Could add additional validation here if needed
      }
      
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
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {/* Show only current section */}
              {currentSection === 1 && (
                <GeneralInfoStep 
                  formData={formData} 
                  onChange={handleFieldChange}
                  onInteraction={onInteraction}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          handleFieldChange('confidentiality', value);
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
                          handleFieldChange('confidentialityStatement', statement);
                        }}
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
        {/* Only show preview when explicitly requested */}
        {showPreview && <LivePreviewBox show={true} />}
      </>
    );
  }

  return null;
};

export default MyProject;
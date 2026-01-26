import React, { useState, useEffect } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorState } from '@/features/editor/lib/hooks/useEditorState';
import { useEditorActions, useEditorStore } from '@/features/editor/lib';
import { METADATA_SECTION_ID } from '@/features/editor/lib/constants';
import GeneralInfoStep from './subSteps/GeneralInfoStep';
import ProjectProfileStep from './subSteps/ProjectProfileStep';
import PlanningContextStep from './subSteps/PlanningContextStep';
import LivePreviewBox from './LivePreviewBox';

interface MyProjectProps {
  className?: string;
  mode?: 'display' | 'form';
  currentSection?: 1 | 2 | 3;
  onSectionChange?: (section: 1 | 2 | 3) => void;
  showPreview?: boolean;
  onInteraction?: () => void;
}

const MyProject: React.FC<MyProjectProps> = ({ 
  className = '', 
  mode = 'display', 
  currentSection = 1,
  onSectionChange,
  showPreview = false,
  onInteraction
}) => {
  const { t } = useI18n();
  const { plan } = useEditorState();
  const actions = useEditorActions((a) => ({
    updateSection: a.updateSection,
    setProjectProfile: a.setProjectProfile,
  }));
  
  // Get project profile from store
  const projectProfile = useEditorStore(state => state.setupWizard.projectProfile);
  
  // Initialize formData with proper precedence: plan settings > projectProfile > defaults
  const initialFormData = {
    // Title Page fields
    title: plan?.settings?.titlePage?.title || projectProfile?.projectName || '',
    subtitle: plan?.settings?.titlePage?.subtitle || '',
    companyName: plan?.settings?.titlePage?.companyName || projectProfile?.author || '',
    legalForm: plan?.settings?.titlePage?.legalForm || '',
    date: plan?.settings?.titlePage?.date || new Date().toISOString().split('T')[0],
    logoUrl: plan?.settings?.titlePage?.logoUrl || '',
    confidentialityStatement: plan?.settings?.titlePage?.confidentialityStatement || projectProfile?.confidentialityStatement || '',
    // Other form fields
    author: plan?.settings?.titlePage?.companyName || projectProfile?.author || '',
    confidentiality: projectProfile?.confidentiality || 'confidential' as 'public' | 'confidential' | 'private',
    stage: projectProfile?.stage || '' as 'idea' | 'MVP' | 'revenue',
    country: projectProfile?.country || '',
    industryFocus: projectProfile?.industryTags || [] as string[],
    oneLiner: projectProfile?.oneLiner || '',
    mainObjective: projectProfile?.mainObjective || '',
    teamSize: projectProfile?.teamSize || 0,
    customIndustry: projectProfile?.customIndustry || '',
    contactInfo: {
      email: plan?.settings?.titlePage?.contactInfo?.email || '',
      phone: plan?.settings?.titlePage?.contactInfo?.phone || '',
      website: plan?.settings?.titlePage?.contactInfo?.website || '',
      address: plan?.settings?.titlePage?.contactInfo?.address || '',
    },
    financialBaseline: {
      fundingNeeded: projectProfile?.financialBaseline?.fundingNeeded || 0,
      currency: projectProfile?.financialBaseline?.currency || 'EUR',
      startDate: projectProfile?.financialBaseline?.startDate || new Date().toISOString().split('T')[0],
      planningHorizon: projectProfile?.financialBaseline?.planningHorizon || 0 as 0 | 6 | 12 | 18 | 24 | 30 | 36 | 42 | 48
    }
  };

  const [formData, setFormData] = useState(initialFormData);

  // Initialize form data from store on component mount only
  useEffect(() => {
    if (projectProfile) {
      setFormData(prev => ({
        ...initialFormData,
        ...prev,
        title: plan?.settings?.titlePage?.title || projectProfile.projectName || prev.title,
        companyName: plan?.settings?.titlePage?.companyName || projectProfile.author || prev.companyName,
        author: plan?.settings?.titlePage?.companyName || projectProfile.author || prev.author,
        confidentiality: projectProfile.confidentiality || prev.confidentiality,
        confidentialityStatement: plan?.settings?.titlePage?.confidentialityStatement || projectProfile.confidentialityStatement || prev.confidentialityStatement,
        stage: projectProfile.stage || prev.stage,
        country: projectProfile.country || prev.country,
        industryFocus: projectProfile.industryTags || prev.industryFocus,
        oneLiner: projectProfile.oneLiner || prev.oneLiner,
        mainObjective: projectProfile.mainObjective || prev.mainObjective,
        teamSize: projectProfile.teamSize || prev.teamSize,
        customIndustry: projectProfile.customIndustry || prev.customIndustry,
        financialBaseline: {
          ...prev.financialBaseline,
          fundingNeeded: projectProfile.financialBaseline?.fundingNeeded || prev.financialBaseline.fundingNeeded,
          currency: projectProfile.financialBaseline?.currency || prev.financialBaseline.currency,
          startDate: projectProfile.financialBaseline?.startDate || prev.financialBaseline.startDate,
          planningHorizon: projectProfile.financialBaseline?.planningHorizon || prev.financialBaseline.planningHorizon
        }
      }));
    }
  }, []); // Empty dependency array - run only once on mount

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
        
        // Update project profile for Project Profile fields
        if (['country', 'stage', 'industryFocus', 'oneLiner', 'teamSize', 'mainObjective', 'customIndustry', 'financialBaseline', 'confidentiality', 'confidentialityStatement'].includes(field)) {
          const projectProfile = {
            projectName: newData.title,
            author: newData.companyName,
            confidentiality: newData.confidentiality,
            confidentialityStatement: newData.confidentialityStatement,
            oneLiner: newData.oneLiner,
            stage: newData.stage,
            country: newData.country,
            industryTags: (newData as any).industryFocus,
            mainObjective: newData.mainObjective,
            teamSize: newData.teamSize,
            customIndustry: newData.customIndustry,
            financialBaseline: newData.financialBaseline
          };
          actions.setProjectProfile(projectProfile);
        }
        
        // Immediate update for all title page fields to trigger preview
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

  // Display mode - keep original simple behavior
  if (mode === 'display') {
    const summary = formData.title || t('editor.desktop.myProject.noProject' as any) || 'Not specified';
    return (
      <div className={`flex-1 min-w-0 max-w-[140px] ${className}`} style={{ pointerEvents: 'none' }}>
        <div className="text-white font-semibold text-sm leading-snug truncate overflow-hidden whitespace-nowrap block w-full" title={summary}>
          {summary}
        </div>
      </div>
    );
  }

  // Form mode - section navigation like subtle
  if (mode === 'form') {
    // Navigation handler - allow free movement between sections
    const handleNavClick = (section: 1 | 2 | 3) => {
      if (onSectionChange) {
        onSectionChange(section);
      }
    };

    return (
      <>
        <div className={`${className} flex gap-4 items-start`}>
          {/* Navigation Sidebar */}
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
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4">
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
                <PlanningContextStep 
                  formData={formData} 
                  onChange={handleFieldChange}
                />
              )}
            </div>
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
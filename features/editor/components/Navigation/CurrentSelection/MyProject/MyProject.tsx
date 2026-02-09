import React, { useState, useEffect } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorState } from '@/features/editor/lib/hooks/useEditorState';
import { useEditorActions, useEditorStore } from '@/features/editor/lib';
import { METADATA_SECTION_ID } from '@/features/editor/lib/constants';
import GeneralInfoStep from './subSteps/GeneralInfoStep';
import ProjectProfileStep from './subSteps/ProjectProfileStep';
import PlanningContextStep from './subSteps/PlanningContextStep';
// import LivePreviewBox from './LivePreviewBox'; // LEGACY COMPONENT MOVED TO LEGACY FOLDER

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
  
  // Initialize form data with proper precedence: plan settings > projectProfile > defaults
  const initialFormData = {
    // Title Page fields
    title: plan?.settings?.titlePage?.title || projectProfile?.projectName || '',
    subtitle: plan?.settings?.titlePage?.subtitle || '',
    companyName: plan?.settings?.titlePage?.companyName || projectProfile?.author || '',
    author: plan?.settings?.titlePage?.companyName || projectProfile?.author || '',
    date: plan?.settings?.titlePage?.date || new Date().toISOString().split('T')[0],
    logoUrl: plan?.settings?.titlePage?.logoUrl || '',
    confidentiality: projectProfile?.confidentiality || 'confidential' as 'public' | 'confidential' | 'private',
    
    // Contact Information
    contactInfo: {
      email: plan?.settings?.titlePage?.contactInfo?.email || '',
      phone: plan?.settings?.titlePage?.contactInfo?.phone || '',
      website: plan?.settings?.titlePage?.contactInfo?.website || '',
      address: plan?.settings?.titlePage?.contactInfo?.address || '',
    },
    
    // Project Profile fields
    stage: projectProfile?.stage || '' as 'idea' | 'MVP' | 'revenue' | 'growth',
    country: projectProfile?.country || '',
    region: '',
    oneLiner: projectProfile?.oneLiner || '',
    mainObjective: projectProfile?.mainObjective || '',
    teamSize: projectProfile?.teamSize || 0,
    
    // Industry Focus
    industryFocus: projectProfile?.industryTags || [] as string[],
    digitalFocus: [] as string[],
    sustainabilityFocus: [] as string[],
    healthFocus: [] as string[],
    manufacturingFocus: [] as string[],
    exportFocus: [] as string[],
    customIndustry: projectProfile?.customIndustry || '',
    customObjective: projectProfile?.customObjective || '',
    
    // Financial Baseline
    financialBaseline: {
      currency: projectProfile?.financialBaseline?.currency || 'EUR',
      startDate: projectProfile?.financialBaseline?.startDate || new Date().toISOString().split('T')[0],
      planningHorizon: projectProfile?.financialBaseline?.planningHorizon || 0 as 0 | 6 | 12 | 18 | 24 | 30 | 36 | 42 | 48
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  // Initialize form data from store on component mount only
  useEffect(() => {
    if (projectProfile) {
      setFormData(prev => {
        const mergedContactInfo = {
          ...prev.contactInfo,
          email: plan?.settings?.titlePage?.contactInfo?.email || prev.contactInfo.email,
          phone: plan?.settings?.titlePage?.contactInfo?.phone || prev.contactInfo.phone,
          website: plan?.settings?.titlePage?.contactInfo?.website || prev.contactInfo.website,
          address: plan?.settings?.titlePage?.contactInfo?.address || prev.contactInfo.address,
        };
        
        const mergedFinancialBaseline = {
          ...prev.financialBaseline,
          currency: projectProfile.financialBaseline?.currency || prev.financialBaseline.currency,
          startDate: projectProfile.financialBaseline?.startDate || prev.financialBaseline.startDate,
          planningHorizon: projectProfile.financialBaseline?.planningHorizon || prev.financialBaseline.planningHorizon
        };
        
        return {
          ...prev,
          // Title page fields with precedence
          title: plan?.settings?.titlePage?.title || projectProfile.projectName || prev.title,
          companyName: plan?.settings?.titlePage?.companyName || projectProfile.author || prev.companyName,
          author: plan?.settings?.titlePage?.companyName || projectProfile.author || prev.author,
          
          // Profile fields
          confidentiality: projectProfile.confidentiality || prev.confidentiality,
          stage: projectProfile.stage || prev.stage,
          country: projectProfile.country || prev.country,
          oneLiner: projectProfile.oneLiner || prev.oneLiner,
          mainObjective: projectProfile.mainObjective || prev.mainObjective,
          teamSize: projectProfile.teamSize || prev.teamSize,
          
          // Industry focus
          industryFocus: projectProfile.industryTags || prev.industryFocus,
          customIndustry: projectProfile.customIndustry || prev.customIndustry,
          customObjective: projectProfile.customObjective || prev.customObjective,
          
          // Region with localStorage fallback
          region: prev.region || localStorage.getItem('myProject_region') || '',
          
          // Contact and financial info
          contactInfo: mergedContactInfo,
          financialBaseline: mergedFinancialBaseline
        };
      });
    }
    
    // Initialize completion status
    updateCompletionStatus(initialFormData);
  }, []); // Empty dependency array - run only once on mount

  // Function to check if section 1 (General Info) is completed
  const isSection1Complete = (data: typeof initialFormData) => {
    return !!data.title && !!data.companyName;
  };
  
  // Function to check if section 2 (Project Profile) is completed
  const isSection2Complete = (data: typeof initialFormData) => {
    return !!data.country && !!data.stage;
  };
  
  // Function to check if section 3 (Planning Context) is completed
  const isSection3Complete = (data: typeof initialFormData) => {
    return data.financialBaseline.planningHorizon > 0;
  };
  
  // Function to update completion status
  const updateCompletionStatus = (data: typeof initialFormData) => {
    setCompletedSections({
      1: isSection1Complete(data),
      2: isSection2Complete(data),
      3: isSection3Complete(data)
    });
  };
  
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
            date: newData.date,
            logoUrl: newData.logoUrl,
            contactInfo: newData.contactInfo
          });
        });
        
        // Update completion status
        updateCompletionStatus(newData);
        
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Save region to localStorage for EditorProgramFinder access
        if (field === 'region') {
          localStorage.setItem('myProject_region', value);
        }
        
        // Update project profile for Project Profile fields
        if (['country', 'stage', 'industryFocus', 'oneLiner', 'teamSize', 'mainObjective', 'customIndustry', 'financialBaseline', 'confidentiality', 'region', 'digitalFocus', 'sustainabilityFocus', 'healthFocus', 'manufacturingFocus', 'exportFocus'].includes(field)) {
          const projectProfile = {
            projectName: newData.title,
            author: newData.companyName,
            confidentiality: newData.confidentiality,
            oneLiner: newData.oneLiner,
            stage: newData.stage,
            country: newData.country,
            industryTags: (newData as any).industryFocus,
            mainObjective: newData.mainObjective,
            teamSize: newData.teamSize,
            customIndustry: newData.customIndustry,
            customObjective: newData.customObjective,
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
            date: newData.date,
            logoUrl: newData.logoUrl,
            contactInfo: newData.contactInfo
          });
        });
        
        // Update completion status
        updateCompletionStatus(newData);
        
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
        <div className={`${className}`}>
          {/* Navigation Buttons - Matching Program/Template Style */}
          <div className="mb-4">
            <div className="flex gap-3">
              <div 
                className={`group relative flex flex-col items-start p-2.5 rounded-md transition-all duration-300 ease-out cursor-pointer flex-1 ${
                  currentSection === 1 
                    ? 'bg-slate-600/20 ring-1 ring-slate-400/30' 
                    : completedSections[1] 
                      ? 'opacity-90' 
                      : 'border border-white/10  opacity-80 hover:opacity-100'
                }`}
                onClick={() => handleNavClick(1)}>
                {completedSections[1] && currentSection !== 1 && (
                  <span className="w-4 h-4 flex items-center justify-center absolute top-1 right-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {currentSection === 1 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                )}
                <div className="flex flex-row items-center">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 mr-3 rounded-md bg-slate-400/15 border border-slate-400/20 text-slate-300 text-base">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg text-left">
                      {t('editor.desktop.myProject.sections.generalInfo') || 'General Info'}
                    </h3>
                    <p className="text-slate-300/70 text-xs text-left leading-tight mt-0.5 max-w-full">
                      {t('editor.desktop.myProject.sections.generalInfo.subtext') || 'General: General information about Project & Author'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`group relative flex flex-col items-start p-2.5 rounded-md transition-all duration-300 ease-out cursor-pointer flex-1 ${
                  currentSection === 2 
                    ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' 
                    : completedSections[2] 
                      ? 'opacity-90' 
                      : 'border border-white/10 opacity-80 hover:opacity-100'
                }`}
                onClick={() => handleNavClick(2)}>
                {completedSections[2] && currentSection !== 2 && (
                  <span className="w-4 h-4 flex items-center justify-center absolute top-1 right-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {currentSection === 2 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                )}
                <div className="flex flex-row items-center">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 mr-3 rounded-md bg-indigo-400/15 border border-indigo-400/20 text-indigo-300 text-base">
                    🏢
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg text-left">
                      {t('editor.desktop.myProject.sections.projectProfile') || 'Project Profile'}
                    </h3>
                    <p className="text-slate-300/70 text-xs text-left leading-tight mt-0.5 max-w-full">
                      {t('editor.desktop.myProject.sections.projectProfile.subtext') || 'Profile: Project, Phase, and Team'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className={`group relative flex flex-col items-start p-2.5 rounded-md transition-all duration-300 ease-out cursor-pointer flex-1 ${
                  currentSection === 3 
                    ? 'bg-blue-500/10 ring-1 ring-blue-500/30' 
                    : completedSections[3] 
                      ? 'opacity-90' 
                      : 'border border-white/10 opacity-80 hover:opacity-100'
                }`}
                onClick={() => handleNavClick(3)}>
                {completedSections[3] && currentSection !== 3 && (
                  <span className="w-4 h-4 flex items-center justify-center absolute top-1 right-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {currentSection === 3 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                )}
                <div className="flex flex-row items-center">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 mr-3 rounded-md bg-blue-400/15 border border-blue-400/20 text-blue-300 text-base">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg text-left">
                      {t('editor.desktop.myProject.sections.planningContext') || 'Planning Context'}
                    </h3>
                    <p className="text-slate-300/70 text-xs text-left leading-tight mt-0.5 max-w-full">
                      {t('editor.desktop.myProject.sections.planningContext.subtext') || 'Context: Goals, Timeline, and Project Scope'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
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
        {/* <LivePreviewBox show={true} /> */} {/* REMOVED - LEGACY COMPONENT MOVED TO LEGACY FOLDER */}
      </>
    );
  }

  // Display mode - show project title or default text
  if (mode === 'display') {
    const projectTitle = formData.title || projectProfile?.projectName || t('editor.desktop.myProject.noProject' as any) || 'No Project';
    
    return (
      <div className="text-white font-bold truncate flex items-center gap-1 max-w-[140px]">
        <span 
          className="truncate text-sm overflow-hidden whitespace-nowrap block w-full" 
          title={projectTitle}
        >
          {projectTitle}
        </span>
      </div>
    );
  }

  return null;
};

export default MyProject;
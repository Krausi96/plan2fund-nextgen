import React from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';

interface MyProjectProps {
  className?: string;
}

const MyProject: React.FC<MyProjectProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const { plan } = useEditorState();
  
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

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
        {t('editor.desktop.myProject.title' as any) || 'My Project'}
      </div>
      <div className="text-white font-semibold text-sm leading-snug truncate" title={projectSummary}>
        {projectSummary}
      </div>
    </div>
  );
};

export default MyProject;
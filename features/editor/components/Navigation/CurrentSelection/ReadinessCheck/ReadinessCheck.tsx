import React from 'react';
import { useEditorState } from '../../../../lib/hooks/useEditorState';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';

interface ReadinessCheckProps {
  className?: string;
}

const ReadinessCheck: React.FC<ReadinessCheckProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const { plan } = useEditorState();
  
  const sections = plan?.sections || [];
  
  // Calculate readiness checks
  const completenessScore = calculateCompletenessScore(sections);
  const fundingAlignmentScore = calculateFundingAlignmentScore();
  const documentQualityScore = calculateDocumentQualityScore(sections);

  // Calculate overall readiness summary
  const overallScore = Math.round((completenessScore + fundingAlignmentScore + documentQualityScore) / 3);
  const scoreColor = overallScore >= 70 ? 'text-green-400' : overallScore >= 40 ? 'text-yellow-400' : 'text-red-400';
  const scoreIcon = overallScore >= 70 ? '✅' : overallScore >= 40 ? '⚠️' : '❌';
  
  const readinessSummary = `${scoreIcon} ${overallScore}%`;

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wide leading-tight mb-1">
        {t('editor.desktop.readinessCheck.title' as any) || 'Readiness Check'}
      </div>
      <div className={`text-white font-semibold text-sm leading-snug truncate ${scoreColor}`} title={`${t('editor.desktop.readinessCheck.overall' as any) || 'Overall'}: ${overallScore}%`}>
        {readinessSummary}
      </div>
    </div>
  );
};

// Helper functions to calculate readiness scores
const calculateCompletenessScore = (sections: any[]): number => {
  if (sections.length === 0) return 0;
  
  const completedSections = sections.filter(section => 
    section.content && section.content.trim().length > 50 // Assuming 50+ chars is substantial content
  ).length;
  
  return Math.round((completedSections / sections.length) * 100);
};

const calculateFundingAlignmentScore = (): number => {
  // This would be more sophisticated in a real implementation
  // For now, returning a placeholder that can be updated based on actual program requirements
  return 85; // Default high score
};

const calculateDocumentQualityScore = (sections: any[]): number => {
  if (sections.length === 0) return 0;
  
  // Simple quality check: if sections have content and are not just placeholder text
  const qualitySections = sections.filter(section => 
    section.content && 
    section.content.trim().length > 50 && 
    !section.content.toLowerCase().includes('placeholder') &&
    !section.content.toLowerCase().includes('lorem ipsum')
  ).length;
  
  return Math.round((qualitySections / sections.length) * 100);
};

export default ReadinessCheck;
/**
 * UnifiedEditorLayout - Canva-style layout
 * Left sidebar (navigation), center canvas (editor), right drawer (tools)
 * Based on strategic analysis report recommendations
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Settings, Eye, FileText, ListChecks, Type } from 'lucide-react';
import SectionTree from './SectionTree';
import ComplianceAIHelper from './ComplianceAIHelper';
import DocumentCustomizationPanel from './DocumentCustomizationPanel';
import PreviewPanel from './PreviewPanel';
import AdditionalDocumentsEditor from './AdditionalDocumentsEditor';
import GuidedSectionEditor from './GuidedSectionEditor';
import { SectionTemplate } from '@/shared/lib/templates/types';
import { useUser } from '@/shared/contexts/UserContext';
import { isFeatureEnabled, getSubscriptionTier } from '@/shared/lib/featureFlags';
import { trackTemplateUsage, storeAnonymizedPlan, getUserConsent } from '@/shared/lib/dataCollection';
import { calculateQualityMetrics } from '@/shared/lib/qualityScoring';
import { useEffect, useRef } from 'react';

interface UnifiedEditorLayoutProps {
  // Left sidebar props
  sections: SectionTemplate[] | any[];
  activeSection: number;
  onSectionChange: (index: number) => void;
  sectionsProgress: number[];
  
  // Center canvas props
  children: React.ReactNode; // The main editor content (RichTextEditor in free-form mode)
  onContentChange?: (content: string, sectionId: string) => void; // For guided mode content updates
  
  // Right drawer props
  plan: any;
  programProfile?: any;
  programId?: string;
  planContent: Record<string, any>;
  currentSection: string;
  onInsertContent: (content: string, section: string) => void;
  onConfigChange?: (config: any) => void;
  currentConfig?: any;
  
  // Additional props
  onExport?: (format: string) => void;
}

type RightDrawerTab = 'compliance' | 'format' | 'preview' | 'documents';

export default function UnifiedEditorLayout({
  sections,
  activeSection,
  onSectionChange,
  sectionsProgress,
  children,
  onContentChange,
  plan,
  programProfile,
  programId,
  planContent,
  currentSection,
  onInsertContent,
  onConfigChange,
  currentConfig,
  onExport
}: UnifiedEditorLayoutProps) {
  const { userProfile } = useUser();
  const subscriptionTier = getSubscriptionTier(userProfile);
  const guidedEditingEnabled = isFeatureEnabled('guided_editing', subscriptionTier);
  
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [rightDrawerTab, setRightDrawerTab] = useState<RightDrawerTab>('compliance');
  const [guidedMode, setGuidedMode] = useState(false);

  // Convert sections to SectionTree format if needed
  const sectionsForTree = useMemo(() => {
    return sections.map((s: any) => ({
      id: s.id,
      key: s.id || s.key || '',
      title: s.title || s.section_name || '',
      description: s.description,
      required: s.required,
      wordCountMin: s.wordCountMin || s.word_count_min,
      wordCountMax: s.wordCountMax || s.word_count_max,
      order: s.order,
      category: s.category
    }));
  }, [sections]);

  // Get current section template
  const currentSectionTemplate = useMemo(() => {
    return sections[activeSection] as SectionTemplate | undefined;
  }, [sections, activeSection]);

  // Check if current section has questions for guided mode
  const hasGuidedQuestions = useMemo(() => {
    return guidedEditingEnabled && 
           currentSectionTemplate?.questions && 
           currentSectionTemplate.questions.length > 0;
  }, [guidedEditingEnabled, currentSectionTemplate]);

  // Track template usage when sections are edited
  const previousContentRef = useRef<Record<string, string>>({});
  
  useEffect(() => {
    if (!userProfile?.id || !currentSectionTemplate) return;
    
    const currentContent = planContent[currentSectionTemplate.id] || '';
    const previousContent = previousContentRef.current[currentSectionTemplate.id] || '';
    
    // Track if template was edited (content changed from empty or template)
    if (currentContent && currentContent !== previousContent) {
      const wasEdited = previousContent.length > 0; // If there was previous content, it was edited
      
      getUserConsent(userProfile.id).then(consent => {
        if (consent) {
          trackTemplateUsage(
            currentSectionTemplate.id,
            'section',
            wasEdited
          ).catch(err => console.error('Failed to track template usage:', err));
        }
      });
    }
    
    previousContentRef.current[currentSectionTemplate.id] = currentContent;
  }, [planContent, currentSectionTemplate, userProfile]);

  // Track plan completion and quality metrics (when plan is saved/exported)
  useEffect(() => {
    if (!userProfile?.id || !plan || Object.keys(planContent).length === 0) return;
    
    // Only track on significant changes (e.g., when sections are completed)
    const hasSignificantContent = Object.values(planContent).some(
      (content: any) => typeof content === 'string' && content.length > 100
    );
    
    if (hasSignificantContent) {
      getUserConsent(userProfile.id).then(async (consent) => {
        if (consent) {
          // Calculate quality metrics for anonymization
          const sections = Object.entries(planContent).map(([id, content]) => {
            const section = sectionsForTree.find(s => s.key === id);
            const wordCount = typeof content === 'string' 
              ? content.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length 
              : 0;
            const qualityMetrics = typeof content === 'string'
              ? calculateQualityMetrics(content, id, id, wordCount)
              : null;
            
            return {
              id,
              title: section?.title || id,
              wordCount,
              qualityScore: qualityMetrics?.overall
            };
          });
          
          const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);
          const completionPercentage = sections.filter(s => s.wordCount > 50).length / sections.length * 100;
          
          // Get overall quality metrics
          const allContent = Object.values(planContent).join(' ');
          const overallWordCount = allContent.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length;
          const overallQuality = calculateQualityMetrics(allContent, 'plan', 'plan', overallWordCount);
          
          const anonymizedPlan = {
            id: `plan_${Date.now()}`,
            structure: {
              sections,
              totalWordCount,
              completionPercentage: Math.round(completionPercentage)
            },
            qualityMetrics: {
              readability: overallQuality.readability.score,
              completeness: overallQuality.completeness.score,
              persuasiveness: overallQuality.persuasiveness.score,
              overall: overallQuality.overall
            },
            programMatched: programProfile ? {
              programId: programId || '',
              programType: programProfile.route || 'grants',
              matchScore: 0 // Could be calculated from recommendation engine
            } : undefined,
            metadata: {
              fundingType: programProfile?.route || 'grants',
              createdAt: plan.createdAt || new Date().toISOString(),
              anonymizedAt: new Date().toISOString()
            }
          };
          
          storeAnonymizedPlan(anonymizedPlan, consent).catch(err => 
            console.error('Failed to store anonymized plan:', err)
          );
        }
      });
    }
  }, [planContent, plan, userProfile, programProfile, programId, sectionsForTree]);

  // Handle guided mode content change
  const handleGuidedContentChange = (content: string) => {
    if (onContentChange && currentSectionTemplate) {
      onContentChange(content, currentSectionTemplate.id);
    }
    // Also update planContent via onInsertContent for compatibility
    if (currentSectionTemplate) {
      onInsertContent(content, currentSectionTemplate.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <div className={`
        ${leftSidebarCollapsed ? 'w-16' : 'w-64'}
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300
      `}>
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {!leftSidebarCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Sections</h2>
          )}
          <button
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {leftSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Section Tree */}
        <div className="flex-1 overflow-y-auto">
          <SectionTree
            sections={sectionsForTree}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            sectionsProgress={sectionsProgress}
            collapsed={leftSidebarCollapsed}
          />
        </div>
      </div>

      {/* Center Canvas - Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {sections[activeSection]?.title || 'Business Plan Editor'}
            </h1>
            {sections[activeSection] && (
              <span className="text-sm text-gray-500">
                {activeSection + 1} of {sections.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Guided Mode Toggle */}
            {hasGuidedQuestions && (
              <button
                onClick={() => setGuidedMode(!guidedMode)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                  ${guidedMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title={guidedMode ? 'Switch to free-form editing' : 'Switch to guided editing'}
              >
                {guidedMode ? (
                  <>
                    <ListChecks className="h-4 w-4" />
                    <span>Guided</span>
                  </>
                ) : (
                  <>
                    <Type className="h-4 w-4" />
                    <span>Free-form</span>
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={() => {
                setRightDrawerOpen(!rightDrawerOpen);
                if (rightDrawerOpen && rightDrawerTab === 'preview') {
                  setRightDrawerTab('compliance');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {rightDrawerOpen ? 'Hide Tools' : 'Show Tools'}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          {guidedMode && hasGuidedQuestions && currentSectionTemplate ? (
            <GuidedSectionEditor
              section={currentSectionTemplate}
              currentContent={planContent[currentSectionTemplate.id] || ''}
              onContentChange={handleGuidedContentChange}
              onComplete={() => {
                // Optional: show completion message or update UI
                console.log('Section completed via guided mode');
              }}
            />
          ) : (
            children
          )}
        </div>
      </div>

      {/* Right Drawer - Tools */}
      {rightDrawerOpen && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Drawer Header - Tabs */}
          <div className="h-16 border-b border-gray-200 flex items-center">
            <div className="flex-1 flex">
              <button
                onClick={() => setRightDrawerTab('compliance')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${rightDrawerTab === 'compliance'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Compliance & AI</span>
                </div>
              </button>
              
              <button
                onClick={() => setRightDrawerTab('format')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${rightDrawerTab === 'format'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Format</span>
                </div>
              </button>
              
              <button
                onClick={() => setRightDrawerTab('preview')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${rightDrawerTab === 'preview'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </div>
              </button>
              
              <button
                onClick={() => setRightDrawerTab('documents')}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium transition-colors
                  ${rightDrawerTab === 'documents'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </div>
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto">
            {rightDrawerTab === 'compliance' && (
              <ComplianceAIHelper
                plan={plan}
                programProfile={programProfile}
                programId={programId}
                planContent={planContent}
                currentSection={currentSection}
                onInsertContent={onInsertContent}
              />
            )}
            
            {rightDrawerTab === 'format' && (
              <DocumentCustomizationPanel
                currentConfig={currentConfig}
                onConfigChange={onConfigChange || (() => {})}
                onExport={onExport || (() => {})}
              />
            )}
            
            {rightDrawerTab === 'preview' && (
              <PreviewPanel
                plan={plan}
                sections={sections}
                planContent={planContent}
                programId={programId}
                programProfile={programProfile}
              />
            )}
            
            {rightDrawerTab === 'documents' && (
              <AdditionalDocumentsEditor
                programId={programId}
                fundingType={programProfile?.route || 'grants'}
                productType="submission"
                planContent={planContent}
                sections={sectionsForTree.map(s => ({
                  key: s.key,
                  title: s.title,
                  content: planContent[s.key] || ''
                }))}
                onDocumentChange={(documentId, content) => {
                  // Handle document content change
                  console.log('Document changed:', documentId, content);
                }}
                onDocumentSave={(document) => {
                  // Handle document save
                  console.log('Document saved:', document);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


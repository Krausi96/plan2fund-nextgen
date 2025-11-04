// ========= PLAN2FUND — RESTRUCTURED EDITOR =========
// Improved navigation and layout with better component organization

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument } from '@/shared/types/plan';
import { ProgramProfile } from '@/features/reco/types/reco';
import { EditorProduct } from '@/features/editor/types/editor';
import RichTextEditor from './RichTextEditor';
import EnhancedAIChat from './EnhancedAIChat';
import DocumentCustomizationPanel from './DocumentCustomizationPanel';
import { useSectionProgress } from '../hooks/useSectionProgress';

interface RestructuredEditorProps {
  plan: PlanDocument | null;
  sections: any[];
  activeSection: number;
  onSectionChange: (sectionKey: string, content: string) => void;
  onActiveSectionChange: (index: number) => void;
  onSectionStatusChange: (sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => void;
  onPlanChange: (plan: PlanDocument) => void;
  programProfile?: ProgramProfile;
  product?: EditorProduct | null;
  requirementsProgress?: number;
  requirementsStatus?: 'loading' | 'complete' | 'incomplete' | 'error';
  onAIGenerate?: () => void;
  onSave?: () => void;
}

export default function RestructuredEditor({
  plan,
  sections,
  activeSection,
  onSectionChange,
  onActiveSectionChange,
  onSectionStatusChange,
  onPlanChange,
  programProfile,
  product,
  requirementsProgress = 0,
  requirementsStatus = 'loading',
  onAIGenerate,
  onSave
}: RestructuredEditorProps) {
  const router = useRouter();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDocumentCustomization, setShowDocumentCustomization] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showSectionSearch, setShowSectionSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [generatingForPrompt, setGeneratingForPrompt] = useState<number | null>(null);
  const [showRequirementsTooltip, setShowRequirementsTooltip] = useState(false);
  
  // Calculate incomplete sections for notifications
  const incompleteSections = sections.filter(s => !s.content || s.content.trim().length === 0 || s.status !== 'aligned').length;
  
  // Calculate progress for all sections (outside map to avoid hook rule violations)
  const sectionsProgress = sections.map(section => useSectionProgress(section));
  
  // Generate content for a specific prompt
  const handleGenerateForPrompt = useCallback(async (promptText: string, promptIndex: number) => {
    if (!sections[activeSection] || !plan) return;
    
    setGeneratingForPrompt(promptIndex);
    try {
      const { createAIHelper } = await import('@/features/editor/engine/aiHelper');
      const { loadUserAnswers } = await import('@/shared/lib/planStore');
      const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
      
      const programForAI = programProfile ? {
        id: programProfile.programId,
        name: programProfile.programId,
        type: programProfile.route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      } : {
        id: 'unknown',
        name: 'Program',
        type: 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      };
      
      const aiHelper = createAIHelper({
        maxWords: sections[activeSection]?.wordCountMax || 500,
        sectionScope: sections[activeSection]?.title || '',
        programHints: {},
        userAnswers: userAnswers,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });
      
      // Generate content focused on this specific prompt
      const context = `Focus on this specific requirement: ${promptText}\n\nSection: ${sections[activeSection]?.title}\n\nCurrent content: ${sections[activeSection]?.content || 'No content yet'}`;
      const response = await aiHelper.generateSectionContent(
        sections[activeSection].title,
        context,
        programForAI
      );
      
      if (response.content) {
        // Append or insert the generated content
        const currentContent = sections[activeSection]?.content || '';
        const newContent = currentContent 
          ? `${currentContent}\n\n${response.content}`
          : response.content;
        
        onSectionChange(sections[activeSection].key, newContent);
      }
    } catch (error) {
      console.error('Error generating content for prompt:', error);
    } finally {
      setGeneratingForPrompt(null);
    }
  }, [sections, activeSection, plan, programProfile, onSectionChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Ctrl+G: Generate AI content (only when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !isTyping) {
        e.preventDefault();
        if (onAIGenerate) onAIGenerate();
        return;
      }
      
      // Ctrl+N: Next section (only when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !isTyping && !e.shiftKey) {
        e.preventDefault();
        onActiveSectionChange(Math.min(sections.length - 1, activeSection + 1));
        return;
      }
      
      // Ctrl+P: Previous section (only when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !isTyping && !e.shiftKey) {
        e.preventDefault();
        onActiveSectionChange(Math.max(0, activeSection - 1));
        return;
      }
      
      // Ctrl+Arrow Up: Previous section
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp' && !isTyping) {
        e.preventDefault();
        onActiveSectionChange(Math.max(0, activeSection - 1));
        return;
      }
      
      // Ctrl+Arrow Down: Next section
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown' && !isTyping) {
        e.preventDefault();
        onActiveSectionChange(Math.min(sections.length - 1, activeSection + 1));
        return;
      }
      
      // Ctrl+, for document customization
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowDocumentCustomization(!showDocumentCustomization);
        return;
      }
      
      // Escape to close panels
      if (e.key === 'Escape') {
        if (showDocumentCustomization) setShowDocumentCustomization(false);
        if (showAiAssistant) setShowAiAssistant(false);
        if (showSectionSearch) setShowSectionSearch(false);
        return;
      }
      
      // Ctrl+B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !isTyping) {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDocumentCustomization, showAiAssistant, showSectionSearch, sidebarCollapsed, activeSection, sections.length, onAIGenerate, onActiveSectionChange]);

  // Filter sections based on search
  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = useCallback(async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
      } finally {
        setIsSaving(false);
      }
    }
  }, [onSave]);

  // Calculate completion progress
  const completionProgress = sections.length > 0
    ? Math.round((sections.filter(s => s.status === 'aligned').length / sections.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Simplified Top Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo, Title, Progress */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Toggle sidebar (Ctrl+B)"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {product?.name || 'Business Plan Editor'}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {plan?.route || 'grant'} • {sections.length} sections
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="hidden md:flex items-center space-x-2 flex-1 min-w-0 max-w-xs">
                <div className="w-24 bg-gray-200 rounded-full h-2 flex-shrink-0">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionProgress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  {sections.filter(s => s.status === 'aligned').length}/{sections.length}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Focus Mode (Ctrl+F)"
              >
                {focusMode ? '👁️ Exit Focus' : '🎯 Focus'}
              </button>
              {/* Incomplete Sections Notification */}
              {incompleteSections > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-yellow-600 text-xs font-medium">
                    ⚠️ {incompleteSections} section{incompleteSections > 1 ? 's' : ''} need attention
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  const previewUrl = programProfile?.programId
                    ? `/preview?programId=${programProfile.programId}`
                    : '/preview';
                  router.push(previewUrl);
                }}
                className="hidden md:inline-flex px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Preview (Ctrl+Shift+P)"
              >
                👁️ Preview
              </button>
              <button
                onClick={() => setShowDocumentCustomization(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Document Settings (Ctrl+,)"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Save (Ctrl+S)"
              >
                {isSaving ? 'Saving…' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Sections Navigation */}
          {!focusMode && (
            <div
              className={`transition-all duration-300 ${
                sidebarCollapsed
                  ? 'w-12 flex-shrink-0'
                  : 'w-64 flex-shrink-0'
              }`}
            >
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {sidebarCollapsed ? (
                  // Collapsed: Icon-only mode
                  <div className="space-y-2">
                    {sections.map((section, index) => {
                      const sectionNumber = section.order || index + 1;
                      return (
                        <button
                          key={section.key}
                          onClick={() => onActiveSectionChange(index)}
                          className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
                            index === activeSection
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                          title={section.title}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-xs font-mono">
                              {sectionNumber < 10 ? `0${sectionNumber}` : sectionNumber}
                            </span>
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                section.status === 'aligned'
                                  ? 'bg-green-500'
                                  : section.status === 'needs_fix'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-300'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Expanded: Full section list
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                      <button
                        onClick={() => setShowSectionSearch(!showSectionSearch)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors rounded"
                        title="Search sections"
                      >
                        🔍
                      </button>
                    </div>

                    {/* Section Search */}
                    {showSectionSearch && (
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search sections..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      {(searchQuery ? filteredSections : sections).map((section, index) => {
                        const actualIndex = searchQuery
                          ? sections.findIndex(s => s.key === section.key)
                          : index;
                        const sectionNumber = section.order || actualIndex + 1;
                        const isExpanded = expandedSections.has(actualIndex);
                        const progress = sectionsProgress[actualIndex];
                        
                        return (
                          <div
                            key={section.key}
                            className={`rounded-xl transition-all duration-200 ${
                              actualIndex === activeSection
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <button
                              onClick={() => {
                                onActiveSectionChange(actualIndex);
                                setShowSectionSearch(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <span
                                    className={`text-xs font-mono flex-shrink-0 ${
                                      actualIndex === activeSection ? 'text-blue-100' : 'text-gray-400'
                                    }`}
                                  >
                                    {sectionNumber < 10 ? `0${sectionNumber}` : sectionNumber}
                                  </span>
                                  <span
                                    className={`font-medium text-sm truncate ${
                                      actualIndex === activeSection ? 'text-white' : 'text-gray-700'
                                    }`}
                                  >
                                    {section.title}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {/* Progress Ring */}
                                  <div className="relative w-6 h-6">
                                    <svg className="transform -rotate-90 w-6 h-6">
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        className={actualIndex === activeSection ? 'text-blue-200' : 'text-gray-200'}
                                      />
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 10}`}
                                        strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress.completionPercentage / 100)}`}
                                        className={
                                          progress.completionPercentage >= 80
                                            ? actualIndex === activeSection ? 'text-green-200' : 'text-green-500'
                                            : progress.completionPercentage >= 50
                                            ? actualIndex === activeSection ? 'text-yellow-200' : 'text-yellow-500'
                                            : actualIndex === activeSection ? 'text-blue-200' : 'text-blue-500'
                                        }
                                        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className={`text-[8px] font-bold ${
                                        actualIndex === activeSection ? 'text-white' : 'text-gray-700'
                                      }`}>
                                        {progress.completionPercentage}%
                                      </span>
                                    </div>
                                  </div>
                                  {/* Status Dot */}
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      section.status === 'aligned'
                                        ? 'bg-green-500'
                                        : section.status === 'needs_fix'
                                        ? 'bg-yellow-500'
                                        : 'bg-gray-300'
                                    }`}
                                    title={
                                      section.status === 'aligned'
                                        ? 'Complete'
                                        : section.status === 'needs_fix'
                                        ? 'Needs review'
                                        : 'Not started'
                                    }
                                  />
                                </div>
                              </div>
                            </button>
                            {/* Expandable Details */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedSections);
                                if (newExpanded.has(actualIndex)) {
                                  newExpanded.delete(actualIndex);
                                } else {
                                  newExpanded.add(actualIndex);
                                }
                                setExpandedSections(newExpanded);
                              }}
                              className={`w-full px-3 pb-3 pt-0 text-left border-t ${
                                actualIndex === activeSection ? 'border-blue-300' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mt-2">
                                <div className={`text-xs ${
                                  actualIndex === activeSection ? 'text-blue-100' : 'text-gray-600'
                                }`}>
                                  {progress.wordCount}/{progress.wordCountMax} words • {progress.requirementsMet}/{progress.requirementsTotal} reqs
                                </div>
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  } ${actualIndex === activeSection ? 'text-blue-100' : 'text-gray-400'}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                              {isExpanded && (
                                <div className={`mt-2 text-xs space-y-1 ${
                                  actualIndex === activeSection ? 'text-blue-100' : 'text-gray-600'
                                }`}>
                                  <div>Word count: {progress.wordCount} / {progress.wordCountMax}</div>
                                  <div>Requirements: {progress.requirementsMet} / {progress.requirementsTotal} met</div>
                                  {section.description && (
                                    <div className="pt-1 border-t border-gray-300 line-clamp-2">
                                      {section.description.substring(0, 100)}...
                                    </div>
                                  )}
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 min-w-0">
            {sections.length > 0 && activeSection < sections.length ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 lg:p-8">
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-medium text-gray-500 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          Step {sections[activeSection]?.order || activeSection + 1} of {sections.length}
                        </div>
                        {sections[activeSection]?.required && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                        {/* Progress Badge */}
                        {(() => {
                          const progress = sectionsProgress[activeSection];
                          return (
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              progress.completionPercentage >= 80
                                ? 'bg-green-100 text-green-700'
                                : progress.completionPercentage >= 50
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {progress.completionPercentage}% Complete
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                            {sections[activeSection]?.title}
                          </h2>
                          {sections[activeSection]?.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-2">
                              {sections[activeSection].description}
                            </p>
                          )}
                          {/* Progress Metrics */}
                          {(() => {
                            const progress = sectionsProgress[activeSection];
                            return (
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-600">Progress:</span>
                                  <span className="font-medium text-blue-700">
                                    {progress.wordCount}/{progress.wordCountMax} words
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm relative">
                                  <span className="text-gray-600">Requirements:</span>
                                  <button
                                    onClick={() => setShowRequirementsTooltip(!showRequirementsTooltip)}
                                    className={`font-medium hover:underline cursor-pointer ${
                                      progress.requirementsMet === progress.requirementsTotal
                                        ? 'text-green-700'
                                        : 'text-yellow-700'
                                    }`}
                                    title="Click to see requirements details"
                                  >
                                    {progress.requirementsMet}/{progress.requirementsTotal} met
                                  </button>
                                  {/* Requirements Tooltip */}
                                  {showRequirementsTooltip && (
                                    <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-900">Section Requirements</h4>
                                        <button
                                          onClick={() => setShowRequirementsTooltip(false)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <div className="space-y-2 text-xs">
                                        {/* Word Count Requirement */}
                                        <div className={`flex items-center justify-between p-2 rounded ${
                                          progress.wordCount >= progress.wordCountMin && progress.wordCount <= progress.wordCountMax
                                            ? 'bg-green-50'
                                            : 'bg-yellow-50'
                                        }`}>
                                          <span className="text-gray-700">Word count</span>
                                          <span className={progress.wordCount >= progress.wordCountMin && progress.wordCount <= progress.wordCountMax ? 'text-green-700' : 'text-yellow-700'}>
                                            {progress.wordCount >= progress.wordCountMin && progress.wordCount <= progress.wordCountMax ? '✓' : '⚠'} {progress.wordCount}/{progress.wordCountMax}
                                          </span>
                                        </div>
                                        {/* Tables Requirement */}
                                        {sections[activeSection]?.tables && (
                                          <div className={`flex items-center justify-between p-2 rounded ${
                                            Object.keys(sections[activeSection].tables).length > 0
                                              ? 'bg-green-50'
                                              : 'bg-yellow-50'
                                          }`}>
                                            <span className="text-gray-700">Tables</span>
                                            <span className={Object.keys(sections[activeSection].tables).length > 0 ? 'text-green-700' : 'text-yellow-700'}>
                                              {Object.keys(sections[activeSection].tables).length > 0 ? '✓' : '⚠'} Provided
                                            </span>
                                          </div>
                                        )}
                                        {/* Figures Requirement */}
                                        {sections[activeSection]?.figures && (
                                          <div className={`flex items-center justify-between p-2 rounded ${
                                            (sections[activeSection].figures?.length || 0) > 0
                                              ? 'bg-green-50'
                                              : 'bg-yellow-50'
                                          }`}>
                                            <span className="text-gray-700">Figures</span>
                                            <span className={(sections[activeSection].figures?.length || 0) > 0 ? 'text-green-700' : 'text-yellow-700'}>
                                              {(sections[activeSection].figures?.length || 0) > 0 ? '✓' : '⚠'} Provided
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {sections[activeSection]?.wordCountMin && sections[activeSection]?.wordCountMax && (() => {
                          const progress = sectionsProgress[activeSection];
                          return (
                            <div className="text-right bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 min-w-[140px]">
                              <div className="text-xs font-medium text-blue-600 mb-1">Target length</div>
                              <div className="text-lg font-bold text-blue-700">
                                {sections[activeSection].wordCountMin} - {sections[activeSection].wordCountMax}
                              </div>
                              <div className="text-xs text-blue-600 mt-0.5">words</div>
                              {/* Progress Bar */}
                              <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    progress.wordCountProgress >= 80
                                      ? 'bg-green-500'
                                      : progress.wordCountProgress >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(100, progress.wordCountProgress)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onActiveSectionChange(Math.max(0, activeSection - 1))}
                        disabled={activeSection === 0}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => {
                          setShowSectionSearch(true);
                          if (sidebarCollapsed) setSidebarCollapsed(false);
                        }}
                        className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded"
                      >
                        🔍 Jump
                      </button>
                      <button
                        onClick={() => onActiveSectionChange(Math.min(sections.length - 1, activeSection + 1))}
                        disabled={activeSection === sections.length - 1}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          onSectionStatusChange(sections[activeSection].key, 'aligned');
                          // Show completion toast
                          setShowCompletionToast(true);
                          setTimeout(() => setShowCompletionToast(false), 3000);
                        }}
                        className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        ✓ Complete
                      </button>
                      <button
                        onClick={() => onSectionStatusChange(sections[activeSection].key, 'needs_fix')}
                        className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        ⚠ Review
                      </button>
                    </div>
                  </div>
                </div>

                {/* Empty Section Helper Banner */}
                {(!sections[activeSection]?.content || sections[activeSection].content.trim().length === 0) && (
                  <div className="mb-6 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white text-2xl">✨</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-1">Ready to start writing?</h4>
                        <p className="text-sm text-gray-600 mb-3">Let AI help you create a professional {sections[activeSection]?.title?.toLowerCase() || 'section'} or start writing manually</p>
                        <div className="flex items-center gap-2">
                          {onAIGenerate && (
                            <button
                              onClick={onAIGenerate}
                              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                              title="Or press Ctrl+G"
                            >
                              <span>✨</span> Generate with AI
                            </button>
                          )}
                          <span className="text-xs text-gray-500">or start typing below</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Guidance Section - Step-by-step feel */}
                {sections[activeSection]?.prompts && sections[activeSection].prompts.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">💡</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900">Step-by-step guide:</h3>
                          <p className="text-xs text-blue-700">Complete each step below</p>
                        </div>
                      </div>
                      {(!sections[activeSection]?.content || sections[activeSection].content.trim().length === 0) &&
                        onAIGenerate && (
                          <button
                            onClick={onAIGenerate}
                            className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                          >
                            <span>✨</span> Generate with AI
                          </button>
                        )}
                    </div>
                    <div className="space-y-3">
                      {sections[activeSection].prompts.map((prompt: string, idx: number) => {
                        const currentContent = sections[activeSection]?.content || '';
                        const lowerContent = currentContent.toLowerCase();
                        const lowerPrompt = prompt.toLowerCase();
                        const keywords = lowerPrompt.split(/\s+/).filter((w: string) => w.length > 4);
                        const isCompleted = keywords.some((kw: string) => lowerContent.includes(kw)) && currentContent.length > 30;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border transition-all ${
                              isCompleted
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-blue-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {isCompleted ? '✓' : idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm leading-relaxed ${
                                  isCompleted ? 'text-green-900 line-through' : 'text-blue-900'
                                }`}>
                                  {prompt}
                                </p>
                                {isCompleted && (
                                  <p className="text-xs text-green-700 mt-1">✓ Completed</p>
                                )}
                              </div>
                              {/* Generate button for incomplete prompts */}
                              {!isCompleted && (
                                <button
                                  onClick={() => handleGenerateForPrompt(prompt, idx)}
                                  disabled={generatingForPrompt === idx}
                                  className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                  title={`Generate content for: ${prompt.substring(0, 50)}...`}
                                >
                                  {generatingForPrompt === idx ? (
                                    <>
                                      <span className="animate-spin">⏳</span>
                                      <span>Generating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>✨</span>
                                      <span>Generate</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rich Text Editor */}
                <RichTextEditor
                  content={sections[activeSection]?.content || ''}
                  onChange={(content) => onSectionChange(sections[activeSection].key, content)}
                  section={sections[activeSection]}
                  guidance={sections[activeSection]?.description || ''}
                  placeholder={(() => {
                    // Smart placeholder based on section state
                    const currentSection = sections[activeSection];
                    const currentContent = currentSection?.content || '';
                    const textContent = currentContent.replace(/<[^>]*>/g, '').trim();
                    const wordCount = textContent.split(/\s+/).filter((w: string) => w.length > 0).length;
                    const prompts = currentSection?.prompts || [];
                    
                    // If empty, show first prompt
                    if (wordCount === 0 && prompts.length > 0) {
                      return `Start by answering: ${prompts[0]}...`;
                    }
                    
                    // If partial content, find next incomplete prompt
                    if (wordCount > 0 && wordCount < (currentSection?.wordCountMin || 50) && prompts.length > 0) {
                      // Find first incomplete prompt
                      const lowerContent = textContent.toLowerCase();
                      for (const prompt of prompts) {
                        const lowerPrompt = prompt.toLowerCase();
                        const keywords = lowerPrompt.split(/\s+/).filter((w: string) => w.length > 4);
                        const isCompleted = keywords.some((kw: string) => lowerContent.includes(kw));
                        if (!isCompleted) {
                          return `Continue with: ${prompt}...`;
                        }
                      }
                      return `Continue writing... You're at ${wordCount} words, aim for ${currentSection?.wordCountMin || 50}+ words.`;
                    }
                    
                    // If near completion, show review message
                    if (wordCount >= (currentSection?.wordCountMin || 50)) {
                      return `Review and refine your content... You're at ${wordCount} words.`;
                    }
                    
                    // Fallback
                    return currentSection?.description
                      ? `Write about: ${currentSection.description.substring(0, 60)}...`
                      : `Enter content for ${currentSection?.title || 'this section'}...`;
                  })()}
                  minLength={sections[activeSection]?.wordCountMin || 50}
                  maxLength={sections[activeSection]?.wordCountMax || 5000}
                  showWordCount={true}
                  showGuidance={false}
                  showFormatting={true}
                />

                {/* Actionable Requirements Feedback */}
                {programProfile && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-purple-900">📋 Section Requirements</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          requirementsStatus === 'complete'
                            ? 'bg-green-100 text-green-700'
                            : requirementsStatus === 'incomplete'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {requirementsProgress}% Complete
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          requirementsStatus === 'complete'
                            ? 'bg-green-500'
                            : requirementsStatus === 'incomplete'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${requirementsProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-purple-800 space-y-1">
                      {requirementsStatus === 'complete' && (
                        <div className="flex items-center gap-1.5">
                          <span>✅</span>
                          <span>This section meets all program requirements!</span>
                        </div>
                      )}
                      {requirementsStatus === 'incomplete' && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Some requirements are missing. Use the AI assistant to fix compliance issues.</span>
                          </div>
                          <button
                            onClick={() => {
                              if (onAIGenerate) {
                                onAIGenerate();
                              }
                            }}
                            className="mt-2 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Fix with AI →
                          </button>
                        </div>
                      )}
                      {requirementsStatus === 'loading' && (
                        <div className="flex items-center gap-1.5">
                          <span className="animate-spin">⏳</span>
                          <span>Checking requirements...</span>
                        </div>
                      )}
                      {!programProfile && (
                        <div className="text-gray-600">No program selected. Select a program to see requirements.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No sections available</h3>
                <p className="text-gray-600">Please select a program to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Customization Drawer */}
      {showDocumentCustomization && plan && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDocumentCustomization(false)}
          />
          <div className="absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">Document Customization</h2>
              <button
                onClick={() => setShowDocumentCustomization(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DocumentCustomizationPanel
                currentConfig={{
                  tone: (plan?.tone || 'neutral') as any,
                  language: plan?.language || 'en',
                  tableOfContents: true,
                  pageNumbers: !!plan?.settings?.includePageNumbers,
                  fontFamily: 'Arial',
                  fontSize: 12,
                  lineSpacing: 1.5,
                  margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
                  titlePage: {
                    enabled: !!plan?.settings?.includeTitlePage,
                    title: plan?.settings?.titlePage?.title || 'Business Plan',
                    subtitle: plan?.settings?.titlePage?.subtitle || '',
                    author: plan?.settings?.titlePage?.author || '',
                    date: plan?.settings?.titlePage?.date || new Date().toLocaleDateString(),
                  },
                  citations: {
                    enabled: (plan?.settings?.citations || 'simple') === 'simple',
                    style: 'apa',
                  },
                  figures: {
                    enabled: true,
                    tableOfFigures: true,
                    chartDescriptions: true,
                  },
                }}
                onConfigChange={async (config) => {
                  if (!plan) return;
                  const updated = {
                    ...plan,
                    tone: (config.tone as any) || plan.tone,
                    language: (config.language as any) || plan.language,
                    settings: {
                      ...plan.settings,
                      includeTitlePage: !!config.titlePage?.enabled,
                      includePageNumbers: !!config.pageNumbers,
                      citations: config.citations?.enabled ? 'simple' : 'none',
                      captions: true,
                      graphs: plan.settings.graphs || {},
                      titlePage: {
                        title: config.titlePage?.title,
                        subtitle: config.titlePage?.subtitle,
                        author: config.titlePage?.author,
                        date: config.titlePage?.date,
                      },
                      formatting: {
                        fontFamily: config.fontFamily || plan.settings.formatting?.fontFamily || 'Arial',
                        fontSize: config.fontSize || plan.settings.formatting?.fontSize || 12,
                        lineSpacing: config.lineSpacing || plan.settings.formatting?.lineSpacing || 1.6,
                        margins: config.margins || plan.settings.formatting?.margins || {
                          top: 2.5,
                          bottom: 2.5,
                          left: 2.5,
                          right: 2.5,
                        },
                      },
                    },
                  } as PlanDocument;
                  onPlanChange(updated);
                }}
                onExport={(format) => {
                  console.log('Export requested:', format);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant - Floating Panel */}
      {showAiAssistant ? (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-white rounded-lg border border-gray-300 shadow-2xl w-96 h-[500px] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">👔</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
                  <p className="text-xs text-gray-500">Funding Expert</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiAssistant(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {plan && (
                <EnhancedAIChat
                  plan={plan}
                  programProfile={programProfile || null}
                  currentSection={sections[activeSection]?.key || ''}
                  onInsertContent={(content) => {
                    if (sections[activeSection]) {
                      onSectionChange(sections[activeSection].key, content);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAiAssistant(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center text-white text-xl hover:scale-110 z-40"
          title="Open AI Assistant"
        >
          👔
        </button>
      )}

      {/* Completion Toast */}
      {showCompletionToast && (
        <div className="fixed bottom-20 right-4 z-50 animate-slide-up">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-semibold">Section completed!</div>
              <div className="text-sm opacity-90">Great progress on your business plan</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

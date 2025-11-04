# Section Editor Implementation Example

This document provides code examples for implementing the proposed section editor improvements.

## 1. Enhanced Section Navigation Component

### Type Definitions

```typescript
// features/editor/types/sections.ts

export interface EnhancedSectionDisplay {
  key: string;
  title: string;
  status: 'aligned' | 'needs_fix' | 'missing';
  order: number;
  required: boolean;
  
  // Progress metrics
  progress: {
    wordCount: number;
    wordCountMin: number;
    wordCountMax: number;
    completionPercentage: number;
    requirementsMet: number;
    requirementsTotal: number;
  };
  
  // Compliance badges
  complianceBadges: Array<{
    type: 'word_count' | 'required_field' | 'table' | 'figure';
    status: 'complete' | 'warning' | 'missing';
    message: string;
  }>;
  
  // Section metadata
  description?: string;
  prompts?: string[];
  hasTables: boolean;
  hasFigures: boolean;
  hasCustomFields: boolean;
}

export interface SectionPrompt {
  id: string;
  text: string;
  completed: boolean;
  suggestedContent?: string;
  example?: string;
}
```

### Navigation Panel Component

```typescript
// features/editor/components/EnhancedNavigationPanel.tsx

import React, { useState } from 'react';
import { EnhancedSectionDisplay } from '../types/sections';

interface EnhancedNavigationPanelProps {
  sections: EnhancedSectionDisplay[];
  activeSection: number;
  onSectionSelect: (index: number) => void;
  onSectionReorder?: (sections: EnhancedSectionDisplay[]) => void;
  onAddCustomSection?: () => void;
  showProgress?: boolean;
}

export default function EnhancedNavigationPanel({
  sections,
  activeSection,
  onSectionSelect,
  onSectionReorder,
  onAddCustomSection,
  showProgress = true
}: EnhancedNavigationPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aligned': return 'bg-green-500';
      case 'needs_fix': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aligned': return '✓';
      case 'needs_fix': return '⚠';
      default: return '○';
    }
  };

  const getProgressRingValue = (section: EnhancedSectionDisplay) => {
    const { wordCount, wordCountMin, wordCountMax } = section.progress;
    if (wordCount === 0) return 0;
    const target = (wordCountMin + wordCountMax) / 2;
    return Math.min(100, Math.round((wordCount / target) * 100));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 Sections ({sections.length})
        </h3>
        <button
          className="text-sm text-gray-600 hover:text-gray-900"
          title="Search sections"
        >
          🔍
        </button>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {sections.map((section, index) => {
          const isActive = index === activeSection;
          const isExpanded = expandedSections.has(index);
          const progressValue = getProgressRingValue(section);
          const completionPercentage = section.progress.completionPercentage;

          return (
            <div
              key={section.key}
              className={`
                border rounded-xl transition-all duration-200
                ${isActive 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Section Card Header */}
              <button
                onClick={() => onSectionSelect(index)}
                className="w-full text-left p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Section Number */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {section.order < 10 ? `0${section.order}` : section.order}
                    </div>

                    {/* Section Title */}
                    <div className="flex-1 min-w-0">
                      <div className={`
                        font-medium text-sm truncate
                        ${isActive ? 'text-blue-900' : 'text-gray-900'}
                      `}>
                        {section.title}
                      </div>
                      {showProgress && (
                        <div className="flex items-center space-x-2 mt-1">
                          {/* Progress Ring */}
                          <div className="relative w-12 h-12">
                            <svg className="transform -rotate-90 w-12 h-12">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-gray-200"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 20}`}
                                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressValue / 100)}`}
                                className={`
                                  ${progressValue >= 80 ? 'text-green-500' :
                                    progressValue >= 50 ? 'text-yellow-500' :
                                    'text-blue-500'}
                                  transition-all duration-300
                                `}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-700">
                                {progressValue}%
                              </span>
                            </div>
                          </div>

                          {/* Word Count */}
                          <span className="text-xs text-gray-600">
                            {section.progress.wordCount}/
                            {section.progress.wordCountMax} words
                          </span>

                          {/* Requirements Status */}
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${section.progress.requirementsMet === section.progress.requirementsTotal
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'}
                          `}>
                            {section.progress.requirementsMet}/{section.progress.requirementsTotal} reqs
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div
                      className={`
                        w-3 h-3 rounded-full ${getStatusColor(section.status)}
                        flex items-center justify-center text-white text-xs
                      `}
                      title={
                        section.status === 'aligned' ? 'Complete' :
                        section.status === 'needs_fix' ? 'Needs Review' :
                        'Not Started'
                      }
                    >
                      {getStatusIcon(section.status)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(index);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-200 mt-2">
                  <div className="space-y-2 mt-2">
                    {/* Compliance Badges */}
                    {section.complianceBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {section.complianceBadges.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`
                              text-xs px-2 py-1 rounded-full
                              ${badge.status === 'complete' ? 'bg-green-100 text-green-700' :
                                badge.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'}
                            `}
                            title={badge.message}
                          >
                            {badge.type === 'word_count' && '📝'}
                            {badge.type === 'table' && '📊'}
                            {badge.type === 'figure' && '📈'}
                            {badge.type === 'required_field' && '📋'}
                            {badge.message}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Section Metadata */}
                    {section.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {section.description}
                      </p>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionSelect(index);
                        }}
                      >
                        Edit →
                      </button>
                      {section.required && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Section Button */}
      {onAddCustomSection && (
        <button
          onClick={onAddCustomSection}
          className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          + Add Custom Section
        </button>
      )}
    </div>
  );
}
```

## 2. Enhanced Section Header Component

```typescript
// features/editor/components/EnhancedSectionHeader.tsx

import React from 'react';
import { EnhancedSectionDisplay } from '../types/sections';

interface EnhancedSectionHeaderProps {
  section: EnhancedSectionDisplay;
  onGenerateWithAI: () => void;
  onShowExamples: () => void;
  onShowRequirements: () => void;
}

export default function EnhancedSectionHeader({
  section,
  onGenerateWithAI,
  onShowExamples,
  onShowRequirements
}: EnhancedSectionHeaderProps) {
  const progressValue = Math.round(
    (section.progress.wordCount / section.progress.wordCountMax) * 100
  );
  const requirementsProgress = section.progress.requirementsTotal > 0
    ? Math.round((section.progress.requirementsMet / section.progress.requirementsTotal) * 100)
    : 100;

  const getStatusBadge = () => {
    switch (section.status) {
      case 'aligned':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            ✓ Complete
          </span>
        );
      case 'needs_fix':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            ⚠ Needs Review
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            ○ Not Started
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      {/* Section Title and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
              {section.order < 10 ? `0${section.order}` : section.order}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              {section.required && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">
                  Required Section
                </span>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Word Count Progress */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-xs font-medium text-blue-600 mb-1">Word Count</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-blue-700">
              {section.progress.wordCount}
            </span>
            <span className="text-sm text-blue-600">
              / {section.progress.wordCountMax}
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progressValue)}%` }}
            />
          </div>
        </div>

        {/* Requirements Progress */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-xs font-medium text-green-600 mb-1">Requirements</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-green-700">
              {section.progress.requirementsMet}
            </span>
            <span className="text-sm text-green-600">
              / {section.progress.requirementsTotal}
            </span>
          </div>
          <div className="mt-2 w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${requirementsProgress}%` }}
            />
          </div>
        </div>

        {/* Completion Percentage */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="text-xs font-medium text-purple-600 mb-1">Completion</div>
          <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-purple-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - section.progress.completionPercentage / 100)}`}
                  className="text-purple-600 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-700">
                  {section.progress.completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={onGenerateWithAI}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center space-x-2"
        >
          <span>✨</span>
          <span>Generate with AI</span>
        </button>
        <button
          onClick={onShowExamples}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center space-x-2"
        >
          <span>📋</span>
          <span>View Examples</span>
        </button>
        <button
          onClick={onShowRequirements}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center space-x-2"
        >
          <span>✓</span>
          <span>Check Requirements</span>
        </button>
      </div>
    </div>
  );
}
```

## 3. Section Progress Hook

```typescript
// features/editor/hooks/useSectionProgress.ts

import { useMemo } from 'react';
import { PlanSection } from '@/shared/types/plan';
import { EnhancedSectionDisplay } from '../types/sections';

interface UseSectionProgressOptions {
  section: PlanSection;
  programRequirements?: any;
}

export function useSectionProgress({ section, programRequirements }: UseSectionProgressOptions) {
  return useMemo(() => {
    const wordCount = (section.content || '').split(/\s+/).filter(w => w.length > 0).length;
    const wordCountMin = (section as any).wordCountMin || 50;
    const wordCountMax = (section as any).wordCountMax || 5000;
    
    // Calculate completion percentage based on word count
    const targetWords = (wordCountMin + wordCountMax) / 2;
    const wordCountProgress = Math.min(100, Math.round((wordCount / targetWords) * 100));
    
    // Calculate requirements met
    let requirementsMet = 0;
    let requirementsTotal = 0;
    
    // Word count requirement
    requirementsTotal++;
    if (wordCount >= wordCountMin && wordCount <= wordCountMax) {
      requirementsMet++;
    }
    
    // Table requirement
    if ((section as any).tables) {
      requirementsTotal++;
      if (Object.keys((section as any).tables).length > 0) {
        requirementsMet++;
      }
    }
    
    // Figure requirement
    if ((section as any).figures) {
      requirementsTotal++;
      if ((section as any).figures.length > 0) {
        requirementsMet++;
      }
    }
    
    // Calculate overall completion percentage
    const completionPercentage = Math.round(
      (wordCountProgress * 0.6) + // Word count is 60% of completion
      ((requirementsMet / Math.max(1, requirementsTotal)) * 100 * 0.4) // Requirements are 40%
    );
    
    // Generate compliance badges
    const complianceBadges: Array<{
      type: 'word_count' | 'required_field' | 'table' | 'figure';
      status: 'complete' | 'warning' | 'missing';
      message: string;
    }> = [];
    
    if (wordCount < wordCountMin) {
      complianceBadges.push({
        type: 'word_count',
        status: 'missing',
        message: `Need ${wordCountMin - wordCount} more words`
      });
    } else if (wordCount > wordCountMax) {
      complianceBadges.push({
        type: 'word_count',
        status: 'warning',
        message: `${wordCount - wordCountMax} words over limit`
      });
    } else {
      complianceBadges.push({
        type: 'word_count',
        status: 'complete',
        message: 'Word count OK'
      });
    }
    
    return {
      wordCount,
      wordCountMin,
      wordCountMax,
      completionPercentage,
      requirementsMet,
      requirementsTotal,
      complianceBadges
    };
  }, [section, programRequirements]);
}
```

## 4. Integration Example

```typescript
// Example usage in Phase4Integration or RestructuredEditor

import EnhancedNavigationPanel from './EnhancedNavigationPanel';
import EnhancedSectionHeader from './EnhancedSectionHeader';
import { useSectionProgress } from '../hooks/useSectionProgress';
import { EnhancedSectionDisplay } from '../types/sections';

// Convert sections to enhanced format
const enhancedSections: EnhancedSectionDisplay[] = sections.map(section => {
  const progress = useSectionProgress({ section, programRequirements: programProfile });
  
  return {
    key: section.key,
    title: section.title,
    status: section.status || 'missing',
    order: (section as any).order || 999,
    required: (section as any).required !== false,
    progress: {
      wordCount: progress.wordCount,
      wordCountMin: progress.wordCountMin,
      wordCountMax: progress.wordCountMax,
      completionPercentage: progress.completionPercentage,
      requirementsMet: progress.requirementsMet,
      requirementsTotal: progress.requirementsTotal
    },
    complianceBadges: progress.complianceBadges,
    description: (section as any).description,
    prompts: (section as any).prompts || [],
    hasTables: !!section.tables,
    hasFigures: !!section.figures && section.figures.length > 0,
    hasCustomFields: !!section.fields
  };
});

// Use in component
<EnhancedNavigationPanel
  sections={enhancedSections}
  activeSection={activeSection}
  onSectionSelect={setActiveSection}
  onAddCustomSection={() => {
    // Handle custom section addition
  }}
/>

{/* In main editor area */}
{enhancedSections[activeSection] && (
  <>
    <EnhancedSectionHeader
      section={enhancedSections[activeSection]}
      onGenerateWithAI={handleAIGenerate}
      onShowExamples={() => setShowExamples(true)}
      onShowRequirements={() => setShowRequirements(true)}
    />
    {/* Rest of editor */}
  </>
)}
```


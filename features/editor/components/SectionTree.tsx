/**
 * SectionTree - Tree navigation for sections/chapters
 * Shows sections with icons, progress, and completion status
 * Based on strategic analysis report recommendations
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, AlertCircle, ChevronRight, ChevronDown,
  FileText, DollarSign, Users, TrendingUp, Target, Lightbulb
} from 'lucide-react';

interface Section {
  id?: string;
  key: string;
  title: string;
  description?: string;
  required?: boolean;
  status?: 'missing' | 'needs_fix' | 'aligned';
  content?: string;
  wordCount?: number;
  wordCountMin?: number;
  wordCountMax?: number;
  order?: number;
  category?: string;
  children?: Section[];
}

interface SectionTreeProps {
  sections: Section[];
  activeSection: number;
  onSectionChange: (index: number) => void;
  sectionsProgress: number[];
  collapsed?: boolean;
}

// Icon mapping for different section types
const getSectionIcon = (section: Section) => {
  const title = section.title.toLowerCase();
  const key = section.key.toLowerCase();
  
  if (title.includes('executive') || title.includes('summary')) {
    return <FileText className="h-4 w-4" />;
  }
  if (title.includes('financial') || title.includes('finance') || key.includes('financial')) {
    return <DollarSign className="h-4 w-4" />;
  }
  if (title.includes('team') || title.includes('company') || key.includes('team')) {
    return <Users className="h-4 w-4" />;
  }
  if (title.includes('market') || title.includes('competition') || key.includes('market')) {
    return <TrendingUp className="h-4 w-4" />;
  }
  if (title.includes('innovation') || title.includes('technology') || key.includes('innovation')) {
    return <Lightbulb className="h-4 w-4" />;
  }
  if (title.includes('impact') || title.includes('goal') || key.includes('impact')) {
    return <Target className="h-4 w-4" />;
  }
  
  return <FileText className="h-4 w-4" />;
};

// Status icon
const getStatusIcon = (status?: string, progress?: number) => {
  if (status === 'aligned' || progress === 100) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (status === 'needs_fix' || (progress !== undefined && progress > 0 && progress < 100)) {
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
  return <Circle className="h-4 w-4 text-gray-300" />;
};

export default function SectionTree({
  sections,
  activeSection,
  onSectionChange,
  sectionsProgress,
  collapsed = false
}: SectionTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['main']));

  // Group sections by category if available
  const groupedSections = React.useMemo(() => {
    const groups: Record<string, Section[]> = {};
    const ungrouped: Section[] = [];
    
    sections.forEach((section, index) => {
      const category = section.category || 'main';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ ...section, order: section.order || index });
    });
    
    return { groups, ungrouped };
  }, [sections]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const renderSection = (section: Section, index: number, _depth = 0) => {
    const isActive = activeSection === index;
    const progress = sectionsProgress[index] || 0;
    const hasContent = section.content && section.content.trim().length > 0;
    const status = section.status || (hasContent ? 'aligned' : 'missing');
    
    return (
      <div key={section.key || index}>
        <button
          onClick={() => onSectionChange(index)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 text-left transition-colors
            ${isActive 
              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
              : 'hover:bg-gray-50 text-gray-700'
            }
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? section.title : undefined}
        >
          {!collapsed && (
            <>
              {getSectionIcon(section)}
              <span className="flex-1 truncate text-sm font-medium">
                {section.title}
              </span>
              {getStatusIcon(status, progress)}
              {section.required && (
                <span className="text-xs text-red-500">*</span>
              )}
            </>
          )}
          {collapsed && (
            <div className="flex flex-col items-center gap-1">
              {getSectionIcon(section)}
              {getStatusIcon(status, progress)}
            </div>
          )}
        </button>
        
        {/* Progress bar (only when not collapsed) */}
        {!collapsed && progress > 0 && progress < 100 && (
          <div className="px-3 pb-2">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="py-2">
        {sections.map((section, index) => (
          <div key={section.key || index}>
            {renderSection(section, index)}
          </div>
        ))}
      </div>
    );
  }

  // Render grouped sections
  const groupKeys = Object.keys(groupedSections.groups).sort();
  
  return (
    <div className="py-2">
      {groupKeys.map((groupKey) => {
        const groupSections = groupedSections.groups[groupKey];
        const isExpanded = expandedGroups.has(groupKey);
        const groupTitle = groupKey === 'main' ? 'Main Sections' : 
                          groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
        
        return (
          <div key={groupKey} className="mb-2">
            {groupKeys.length > 1 && (
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>{groupTitle}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {groupSections.length}
                </span>
              </button>
            )}
            
            {isExpanded && (
              <div className="ml-4">
                {groupSections
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((section, idx) => {
                    const originalIndex = sections.findIndex(s => s.key === section.key);
                    return renderSection(section, originalIndex >= 0 ? originalIndex : idx);
                  })}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Summary stats */}
      <div className="px-3 py-2 mt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Completed:</span>
            <span className="font-medium">
              {sections.filter((_, i) => sectionsProgress[i] === 100).length} / {sections.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Required:</span>
            <span className="font-medium">
              {sections.filter(s => s.required).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


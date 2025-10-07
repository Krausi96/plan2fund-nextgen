// ========= PLAN2FUND — ENHANCED NAVIGATION =========
// Phase 4: Enhanced navigation with dashboard vs editor views, section navigation, and user preferences

import React, { useState, useEffect } from 'react';
import { PlanSection } from '@/types/plan';
import { Button } from '@/components/ui/button';

interface EnhancedNavigationProps {
  sections: PlanSection[];
  activeSection: number;
  onSectionChange: (index: number) => void;
  onViewModeChange: (mode: 'dashboard' | 'editor' | 'single-page' | 'multi-step') => void;
  currentViewMode: 'dashboard' | 'editor' | 'single-page' | 'multi-step';
  showProgress?: boolean;
  showUniqueness?: boolean;
  onSectionReorder?: (fromIndex: number, toIndex: number) => void;
}

export default function EnhancedNavigation({
  sections,
  activeSection,
  onSectionChange,
  onViewModeChange,
  currentViewMode,
  showProgress = true,
  onSectionReorder
}: EnhancedNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSections, setFilteredSections] = useState(sections);

  // Filter sections based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSections(sections);
    } else {
      const filtered = sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSections(filtered);
    }
  }, [searchTerm, sections]);

  const getSectionStatus = (section: PlanSection) => {
    if (!section.content || section.content.trim().length === 0) return 'missing';
    if (section.content.length < 50) return 'needs_fix';
    return 'aligned';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aligned': return '✓';
      case 'needs_fix': return '⚠';
      case 'missing': return '○';
      default: return '○';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aligned': return 'text-green-600';
      case 'needs_fix': return 'text-yellow-600';
      case 'missing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateProgress = () => {
    const completedSections = sections.filter(s => getSectionStatus(s) === 'aligned').length;
    return Math.round((completedSections / sections.length) * 100);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== targetIndex && onSectionReorder) {
      onSectionReorder(sourceIndex, targetIndex);
    }
  };

  return (
    <div className={`enhanced-navigation bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="mt-4 space-y-3">
            {/* View Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={currentViewMode === 'dashboard' ? 'primary' : 'outline'}
                  onClick={() => onViewModeChange('dashboard')}
                >
                  Dashboard
                </Button>
                <Button
                  size="sm"
                  variant={currentViewMode === 'editor' ? 'primary' : 'outline'}
                  onClick={() => onViewModeChange('editor')}
                >
                  Editor
                </Button>
                <Button
                  size="sm"
                  variant={currentViewMode === 'single-page' ? 'primary' : 'outline'}
                  onClick={() => onViewModeChange('single-page')}
                >
                  Single Page
                </Button>
                <Button
                  size="sm"
                  variant={currentViewMode === 'multi-step' ? 'primary' : 'outline'}
                  onClick={() => onViewModeChange('multi-step')}
                >
                  Multi-Step
                </Button>
              </div>
            </div>

            {/* Progress Overview */}
            {showProgress && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {filteredSections.map((section, index) => {
              const status = getSectionStatus(section);
              const isActive = index === activeSection;
              
              return (
                <div
                  key={section.key}
                  draggable={!!onSectionReorder}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`section-item p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                  onClick={() => onSectionChange(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {section.title}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {showProgress && section.content && (
                        <div className="text-xs text-gray-500">
                          {Math.round((section.content.length / 200) * 100)}%
                        </div>
                      )}
                      {onSectionReorder && (
                        <span className="text-gray-400 text-xs">⋮⋮</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="p-2">
          {sections.map((section, index) => {
            const status = getSectionStatus(section);
            const isActive = index === activeSection;
            
            return (
              <button
                key={section.key}
                onClick={() => onSectionChange(index)}
                className={`w-full p-2 mb-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title={section.title}
              >
                <span className={`text-lg ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

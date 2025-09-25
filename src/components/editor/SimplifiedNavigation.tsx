/**
 * Simplified Navigation Component
 * Clean, intuitive navigation for the editor
 */

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Settings, 
  Download,
  Eye,
  Save,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SimplifiedNavigationProps {
  sections: Array<{ id: string; title: string; content: string }>;
  activeSection: number;
  onSectionChange: (index: number) => void;
  onSave: () => void;
  onExport: () => void;
  onPreview: () => void;
  onSettings: () => void;
  completionPercentage: number;
  isDirty: boolean;
}

export default function SimplifiedNavigation({
  sections,
  activeSection,
  onSectionChange,
  onSave,
  onExport,
  onPreview,
  onSettings,
  completionPercentage,
  isDirty
}: SimplifiedNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const nextSection = () => {
    if (activeSection < sections.length - 1) {
      onSectionChange(activeSection + 1);
    }
  };

  const prevSection = () => {
    if (activeSection > 0) {
      onSectionChange(activeSection - 1);
    }
  };

  const goToSection = (index: number) => {
    onSectionChange(index);
    setShowMobileMenu(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Main Navigation Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Section Navigation */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Section Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSection}
                disabled={activeSection === 0}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => goToSection(index)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      index === activeSection
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextSection}
                disabled={activeSection === sections.length - 1}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Section Info */}
            <div className="lg:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {sections[activeSection]?.title || 'Untitled'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {activeSection + 1} of {sections.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {/* Progress Indicator */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-20">
                <Progress value={completionPercentage} />
              </div>
              <span className="text-xs text-gray-600 min-w-0">
                {completionPercentage}%
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="text-gray-600 hover:text-gray-900"
              >
                <Save className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Save</span>
                {isDirty && <div className="w-2 h-2 bg-orange-500 rounded-full ml-1" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onPreview}
                className="text-gray-600 hover:text-gray-900"
              >
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Preview</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="text-gray-600 hover:text-gray-900"
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Settings</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={onExport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar for Mobile */}
        <div className="md:hidden mt-2">
          <div className="flex items-center gap-2">
            <Progress value={completionPercentage} />
            <span className="text-xs text-gray-600">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sections</h3>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    index === activeSection
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{section.title}</span>
                    {index === activeSection && (
                      <Badge variant="outline" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

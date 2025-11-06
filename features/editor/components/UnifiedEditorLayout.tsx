/**
 * UnifiedEditorLayout - Canva-style layout
 * Left sidebar (navigation), center canvas (editor), right drawer (tools)
 * Based on strategic analysis report recommendations
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings, Eye, FileText } from 'lucide-react';
import SectionTree from './SectionTree';
import ComplianceAIHelper from './ComplianceAIHelper';
import DocumentCustomizationPanel from './DocumentCustomizationPanel';
import PreviewPanel from './PreviewPanel';
import AdditionalDocumentsEditor from './AdditionalDocumentsEditor';

interface UnifiedEditorLayoutProps {
  // Left sidebar props
  sections: any[];
  activeSection: number;
  onSectionChange: (index: number) => void;
  sectionsProgress: number[];
  
  // Center canvas props
  children: React.ReactNode; // The main editor content
  
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
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [rightDrawerTab, setRightDrawerTab] = useState<RightDrawerTab>('compliance');

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
            sections={sections}
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
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
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
              />
            )}
            
            {rightDrawerTab === 'documents' && (
              <AdditionalDocumentsEditor
                programId={programId}
                fundingType={programProfile?.route || 'grants'}
                productType="submission"
                planContent={planContent}
                sections={sections}
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


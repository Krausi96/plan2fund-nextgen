// ========= PLAN2FUND — SECTION EDITOR =========
// Section editor component that manages individual sections

import React, { useState, useEffect } from 'react';
import { PlanSection } from '@/types/plan';
import RichTextEditor from './RichTextEditor';

interface SectionEditorProps {
  section: PlanSection;
  onContentChange: (sectionKey: string, content: string) => void;
  onStatusChange: (sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => void;
  isActive?: boolean;
  showProgress?: boolean;
}

export default function SectionEditor({
  section,
  onContentChange,
  onStatusChange,
  isActive = false,
  showProgress = true
}: SectionEditorProps) {
  const [content, setContent] = useState(section.content || '');
  const [status, setStatus] = useState(section.status || 'missing');

  // Auto-update status based on content
  useEffect(() => {
    const newStatus = getContentStatus(content);
    if (newStatus !== status) {
      setStatus(newStatus);
      onStatusChange(section.key, newStatus);
    }
  }, [content, section.key, status, onStatusChange]);

  const getContentStatus = (content: string): 'missing' | 'needs_fix' | 'aligned' => {
    const charCount = content.trim().length;
    
    if (charCount === 0) return 'missing';
    if (charCount < 50) return 'needs_fix';
    if (charCount >= 50) return 'aligned';
    
    return 'missing';
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(section.key, newContent);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'aligned': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs_fix': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'missing': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'aligned': return '✓';
      case 'needs_fix': return '⚠';
      case 'missing': return '○';
      default: return '○';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'aligned': return 'Complete';
      case 'needs_fix': return 'Needs more content';
      case 'missing': return 'Not started';
      default: return 'Unknown';
    }
  };

  const getSectionGuidance = (section: PlanSection): string => {
    // Provide guidance based on section key
    const guidanceMap: Record<string, string> = {
      'execSummary': 'Write a compelling executive summary that highlights your business opportunity, key metrics, and funding requirements. Keep it concise but comprehensive.',
      'problemSolution': 'Clearly define the problem you\'re solving and how your solution addresses it. Include market validation and customer feedback.',
      'productOverview': 'Describe your product or service in detail. Include features, benefits, and how it works.',
      'companyTeam': 'Introduce your team, their backgrounds, and why they\'re qualified to execute this business plan.',
      'marketCompetition': 'Analyze your target market size, growth potential, and competitive landscape.',
      'gtmStrategy': 'Explain how you\'ll reach customers, pricing strategy, and sales approach.',
      'financials': 'Provide detailed financial projections including revenue, costs, and cash flow.',
      'risksMitigation': 'Identify key risks and how you\'ll mitigate them.',
      'bmcCustomerSegments': 'Define your target customer segments and their characteristics.',
      'bmcValueProposition': 'Explain the unique value you provide to customers.',
      'bmcChannels': 'Describe how you\'ll reach and serve customers.',
      'bmcCustomerRelationships': 'Explain how you\'ll build and maintain customer relationships.',
      'bmcRevenueStreams': 'Detail how you\'ll generate revenue.',
      'bmcKeyResources': 'List the key resources needed to deliver your value proposition.',
      'bmcKeyActivities': 'Describe the most important activities for your business model.',
      'bmcKeyPartnerships': 'Identify key partners and suppliers.',
      'bmcCostStructure': 'Outline your cost structure and key cost drivers.',
      'gtmTargetMarket': 'Define your target market and customer segments.',
      'gtmPricing': 'Explain your pricing strategy and rationale.',
      'gtmPromotion': 'Describe your marketing and promotional activities.',
      'gtmDistributionChannels': 'Explain how you\'ll distribute your product or service.',
      'gtmSalesTactics': 'Detail your sales process and tactics.',
      'unitEconomicsSimple': 'Provide simple unit economics showing price, cost, and margin.',
      'milestones': 'List key milestones and timelines for your business.'
    };
    
    return guidanceMap[section.key] || `Provide detailed content for ${section.title}.`;
  };

  return (
    <div className={`section-editor border rounded-lg transition-all duration-200 ${
      isActive ? 'border-blue-300 shadow-lg' : 'border-gray-200'
    }`}>
      {/* Section Header */}
      <div className={`px-4 py-3 border-b ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-semibold">{getStatusIcon()}</span>
            <h3 className="text-lg font-semibold">{section.title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {showProgress && (
              <div className="text-sm text-gray-500">
                {Math.round((content.length / 200) * 100)}% complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-4">
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          section={section}
          guidance={getSectionGuidance(section)}
          minLength={50}
          maxLength={2000}
          showWordCount={true}
          showGuidance={true}
        />
      </div>

      {/* Section Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {section.tables && Object.keys(section.tables).length > 0 && (
              <span>Tables: {Object.keys(section.tables).join(', ')}</span>
            )}
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

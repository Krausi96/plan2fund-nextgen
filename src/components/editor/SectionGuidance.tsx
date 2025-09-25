/**
 * Section Guidance Component
 * Provides detailed instructions and guidance for each section
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  AlertCircle,
  XCircle, 
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SectionGuidanceProps {
  section: string;
  programType?: string;
  onInsertTemplate?: (template: string) => void;
  onShowExamples?: () => void;
}

interface GuidanceItem {
  title: string;
  description: string;
  tips: string[];
  examples: string[];
  requirements: string[];
  commonMistakes: string[];
  importance: 'critical' | 'important' | 'optional';
}

const SECTION_GUIDANCE: { [key: string]: GuidanceItem } = {
  'executive_summary': {
    title: 'Executive Summary',
    description: 'A compelling overview that captures the essence of your business and funding request in 1-2 pages.',
    tips: [
      'Start with a powerful opening statement about your business',
      'Include key metrics: funding amount, timeline, expected returns',
      'Highlight your unique value proposition and competitive advantage',
      'Mention your target market and business model',
      'End with a clear call to action for the reader'
    ],
    examples: [
      'We are seeking €500,000 to scale our AI-powered customer service platform that has already generated €200,000 in revenue.',
      'Our innovative solution addresses a €2B market opportunity with a proven business model and experienced team.',
      'With 50% month-over-month growth, we are positioned to become the market leader in our sector.'
    ],
    requirements: [
      'Business name and description',
      'Funding amount requested',
      'Use of funds',
      'Target market overview',
      'Key team members',
      'Financial highlights'
    ],
    commonMistakes: [
      'Being too vague or generic',
      'Including too much detail',
      'Not mentioning the funding amount clearly',
      'Failing to highlight what makes you unique',
      'Not addressing the reader\'s needs'
    ],
    importance: 'critical'
  },
  'business_description': {
    title: 'Business Description',
    description: 'Detailed explanation of your business, products/services, and how you create value for customers.',
    tips: [
      'Clearly explain what your business does and how it works',
      'Describe your products or services in detail',
      'Explain your business model and revenue streams',
      'Highlight your unique selling proposition',
      'Include your company history and background'
    ],
    examples: [
      'We develop AI-powered chatbots that reduce customer service costs by 60% while improving response times.',
      'Our SaaS platform helps small businesses manage their inventory with real-time analytics and automated reordering.',
      'We offer a marketplace connecting local farmers directly with consumers, eliminating middlemen and reducing costs.'
    ],
    requirements: [
      'Company overview and mission',
      'Products/services description',
      'Business model explanation',
      'Value proposition',
      'Company background',
      'Legal structure and location'
    ],
    commonMistakes: [
      'Using too much technical jargon',
      'Not explaining how you make money',
      'Being unclear about your target customers',
      'Not differentiating from competitors',
      'Including irrelevant information'
    ],
    importance: 'critical'
  },
  'market_analysis': {
    title: 'Market Analysis',
    description: 'Comprehensive analysis of your target market, competition, and market opportunity.',
    tips: [
      'Define your target market clearly with specific demographics',
      'Provide market size data (TAM, SAM, SOM)',
      'Analyze your competition and positioning',
      'Identify market trends and opportunities',
      'Explain how you will reach your customers'
    ],
    examples: [
      'Our target market consists of 50,000 small businesses in Germany with 10-50 employees, representing a €500M opportunity.',
      'The European AI market is growing at 25% annually, with our specific segment growing at 40%.',
      'We have identified 3 main competitors, but none offer our unique combination of features and pricing.'
    ],
    requirements: [
      'Target market definition',
      'Market size and growth data',
      'Competitive analysis',
      'Market trends and opportunities',
      'Customer acquisition strategy',
      'Market entry strategy'
    ],
    commonMistakes: [
      'Using outdated market data',
      'Not defining the target market specifically enough',
      'Ignoring or underestimating competition',
      'Making unrealistic market size claims',
      'Not explaining how you will reach customers'
    ],
    importance: 'critical'
  },
  'financial_projections': {
    title: 'Financial Projections',
    description: 'Detailed financial forecasts including revenue, expenses, and funding requirements.',
    tips: [
      'Provide 3-5 year financial projections',
      'Include detailed assumptions and methodology',
      'Show multiple scenarios (optimistic, realistic, pessimistic)',
      'Include key financial ratios and metrics',
      'Explain how you will use the funding'
    ],
    examples: [
      'We project €2M revenue in Year 1, growing to €10M by Year 3 with 15% monthly growth.',
      'Our break-even point is Month 18 with a 40% gross margin and €50K monthly burn rate.',
      'The €500K funding will be used for product development (40%), marketing (30%), and operations (30%).'
    ],
    requirements: [
      '3-5 year revenue projections',
      'Expense breakdown and assumptions',
      'Cash flow projections',
      'Break-even analysis',
      'Use of funds breakdown',
      'Key financial metrics'
    ],
    commonMistakes: [
      'Making unrealistic growth assumptions',
      'Not including detailed expense breakdowns',
      'Ignoring seasonality or market cycles',
      'Not explaining assumptions clearly',
      'Including too many decimal places'
    ],
    importance: 'critical'
  },
  'team': {
    title: 'Team & Management',
    description: 'Overview of your team, their qualifications, and organizational structure.',
    tips: [
      'Highlight relevant experience and achievements',
      'Show how team members complement each other',
      'Include advisors and board members',
      'Explain your hiring plan and organizational structure',
      'Address any skill gaps and how you will fill them'
    ],
    examples: [
      'Our CEO has 10 years of experience in fintech and previously led a successful exit at a similar company.',
      'Our CTO holds a PhD in Computer Science and has built scalable systems for Fortune 500 companies.',
      'We have assembled an advisory board with industry experts from Google, McKinsey, and leading VCs.'
    ],
    requirements: [
      'Key team member profiles',
      'Relevant experience and qualifications',
      'Organizational structure',
      'Advisory board members',
      'Hiring plan',
      'Compensation and equity structure'
    ],
    commonMistakes: [
      'Not highlighting relevant experience',
      'Including too much personal information',
      'Not showing how the team works together',
      'Ignoring skill gaps',
      'Not explaining the hiring plan'
    ],
    importance: 'important'
  },
  'implementation_plan': {
    title: 'Implementation Plan',
    description: 'Detailed roadmap showing how you will execute your business plan and achieve your goals.',
    tips: [
      'Create a realistic timeline with clear milestones',
      'Identify key risks and mitigation strategies',
      'Show dependencies between different activities',
      'Include resource requirements for each phase',
      'Define success metrics and KPIs'
    ],
    examples: [
      'Phase 1 (Months 1-6): Product development and initial customer acquisition',
      'Phase 2 (Months 7-12): Market expansion and team scaling',
      'Phase 3 (Months 13-24): International expansion and new product lines'
    ],
    requirements: [
      'Detailed timeline with milestones',
      'Resource requirements',
      'Risk assessment and mitigation',
      'Success metrics and KPIs',
      'Dependencies and critical path',
      'Contingency plans'
    ],
    commonMistakes: [
      'Creating unrealistic timelines',
      'Not identifying key risks',
      'Not showing dependencies',
      'Including too much detail',
      'Not defining success metrics'
    ],
    importance: 'important'
  }
};

export default function SectionGuidance({
  section,
  programType: _programType,
  onInsertTemplate,
  onShowExamples
}: SectionGuidanceProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tips']));

  const guidance = SECTION_GUIDANCE[section.toLowerCase().replace(/\s+/g, '_')];
  
  if (!guidance) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No guidance available for this section</p>
          </div>
        </div>
      </Card>
    );
  }

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'optional':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Card>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {guidance.title} Guidance
            </div>
            <Badge className={getImportanceColor(guidance.importance)}>
              {guidance.importance.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-2">{guidance.description}</p>
        </div>
      </Card>

      {/* Tips */}
      <Card>
        <div>
          <div >
            <div 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('tips')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5" />
                  Writing Tips
                </div>
                {expandedSections.has('tips') ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </div>
            </div>
          </div>
          <div>
            <div className="pt-0">
              <ul className="space-y-2">
                {guidance.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Examples */}
      <Card>
        <div>
          <div >
            <div 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('examples')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Examples
                </div>
                {expandedSections.has('examples') ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </div>
            </div>
          </div>
          <div>
            <div className="pt-0">
              <div className="space-y-3">
                {guidance.examples.map((example, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-gray-700 italic">"{example}"</p>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onShowExamples}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Show More Examples
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Requirements */}
      <Card>
        <div>
          <div >
            <div 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('requirements')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5" />
                  Requirements Checklist
                </div>
                {expandedSections.has('requirements') ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </div>
            </div>
          </div>
          <div>
            <div className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {guidance.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                    <span className="text-sm">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <div>
          <div >
            <div 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('mistakes')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5" />
                  Common Mistakes to Avoid
                </div>
                {expandedSections.has('mistakes') ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronRight className="h-5 w-5" />
                }
              </div>
            </div>
          </div>
          <div>
            <div className="pt-0">
              <ul className="space-y-2">
                {guidance.commonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={() => onInsertTemplate?.(section)}
          className="flex-1"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Insert Template
        </Button>
        <Button 
          onClick={() => onShowExamples?.()}
          variant="outline"
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Show Examples
        </Button>
      </div>
    </div>
  );
}

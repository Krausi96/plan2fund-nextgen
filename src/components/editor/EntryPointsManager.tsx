// ========= PLAN2FUND — ENTRY POINTS MANAGER =========
// Phase 4: Handle different entry points and document types

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';

interface EntryPointsManagerProps {
  currentPlan?: PlanDocument | null;
  programProfile?: ProgramProfile | null;
  onPlanSwitch?: (newPlan: PlanDocument) => void;
  onDocumentTypeChange?: (type: DocumentType) => void;
  showWizardEntry?: boolean;
  showDirectEditor?: boolean;
  showPlanSwitching?: boolean;
}

export type DocumentType = 
  | 'business-plan'
  | 'project-description' 
  | 'pitch-deck'
  | 'financial-plan'
  | 'grant-proposal'
  | 'loan-application'
  | 'investor-pitch'
  | 'visa-application';

interface DocumentTypeConfig {
  id: DocumentType;
  name: string;
  description: string;
  icon: string;
  sections: string[];
  estimatedTime: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'Comprehensive business plan for funding applications',
    icon: '📋',
    sections: ['execSummary', 'problemSolution', 'productOverview', 'companyTeam', 'marketCompetition', 'gtmStrategy', 'financials'],
    estimatedTime: '2-4 hours',
    complexity: 'intermediate'
  },
  {
    id: 'project-description',
    name: 'Project Description',
    description: 'Technical project description for research grants',
    icon: '🔬',
    sections: ['projectOverview', 'methodology', 'timeline', 'budget', 'team', 'deliverables'],
    estimatedTime: '1-2 hours',
    complexity: 'beginner'
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Investor presentation slides',
    icon: '📊',
    sections: ['problem', 'solution', 'market', 'businessModel', 'team', 'financials', 'ask'],
    estimatedTime: '1-3 hours',
    complexity: 'intermediate'
  },
  {
    id: 'financial-plan',
    name: 'Financial Plan',
    description: 'Detailed financial projections and budgets',
    icon: '💰',
    sections: ['revenueProjections', 'costStructure', 'cashFlow', 'fundingRequirements', 'useOfFunds'],
    estimatedTime: '2-3 hours',
    complexity: 'advanced'
  },
  {
    id: 'grant-proposal',
    name: 'Grant Proposal',
    description: 'Formal grant application document',
    icon: '🎯',
    sections: ['execSummary', 'projectDescription', 'objectives', 'methodology', 'budget', 'timeline', 'evaluation'],
    estimatedTime: '3-5 hours',
    complexity: 'advanced'
  },
  {
    id: 'loan-application',
    name: 'Loan Application',
    description: 'Bank loan application with financial details',
    icon: '🏦',
    sections: ['execSummary', 'businessDescription', 'financialHistory', 'projections', 'collateral', 'repayment'],
    estimatedTime: '2-4 hours',
    complexity: 'intermediate'
  },
  {
    id: 'investor-pitch',
    name: 'Investor Pitch',
    description: 'Equity investment pitch document',
    icon: '🚀',
    sections: ['problem', 'solution', 'market', 'traction', 'businessModel', 'team', 'ask', 'useOfFunds'],
    estimatedTime: '2-3 hours',
    complexity: 'intermediate'
  },
  {
    id: 'visa-application',
    name: 'Visa Application',
    description: 'Immigration visa business plan',
    icon: '🛂',
    sections: ['businessConcept', 'marketAnalysis', 'financialPlan', 'jobCreation', 'timeline', 'compliance'],
    estimatedTime: '3-4 hours',
    complexity: 'advanced'
  }
];

export default function EntryPointsManager({
  currentPlan,
  programProfile,
  onPlanSwitch,
  onDocumentTypeChange,
  showWizardEntry = true,
  showDirectEditor = true,
  showPlanSwitching = true
}: EntryPointsManagerProps) {
  const router = useRouter();
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('business-plan');
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [recentPlans, setRecentPlans] = useState<PlanDocument[]>([]);

  // Load recent plans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_plans');
    if (saved) {
      try {
        setRecentPlans(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent plans:', error);
      }
    }
  }, []);

  const handleDocumentTypeSelect = (type: DocumentType) => {
    setSelectedDocumentType(type);
    if (onDocumentTypeChange) {
      onDocumentTypeChange(type);
    }
  };

  const handleWizardEntry = () => {
    // Navigate to recommendation wizard
    router.push('/reco');
  };

  const handleDirectEditor = () => {
    // Navigate to editor with selected document type
    router.push(`/editor?type=${selectedDocumentType}`);
  };

  const handlePlanSwitch = (plan: PlanDocument) => {
    if (onPlanSwitch) {
      onPlanSwitch(plan);
    }
    // Update recent plans
    const updated = [plan, ...recentPlans.filter(p => p.id !== plan.id)].slice(0, 5);
    setRecentPlans(updated);
    localStorage.setItem('recent_plans', JSON.stringify(updated));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="entry-points-manager p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Entry Point</h2>
      
      <div className="space-y-6">
        {/* Wizard Entry */}
        {showWizardEntry && (
          <div className="entry-option p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">🎯 Recommendation Wizard</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get personalized program recommendations and tailored business plan structure
                </p>
                {programProfile && (
                  <p className="text-xs text-blue-600 mt-1">
                    Current program: {programProfile.programId}
                  </p>
                )}
              </div>
              <Button onClick={handleWizardEntry} variant="primary">
                Start Wizard
              </Button>
            </div>
          </div>
        )}

        {/* Direct Editor Entry */}
        {showDirectEditor && (
          <div className="entry-option p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">✏️ Direct Editor</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Start with a specific document type and customize as needed
                </p>
              </div>
              <Button 
                onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                variant="outline"
              >
                {showDocumentSelector ? 'Hide Options' : 'Choose Document Type'}
              </Button>
            </div>

            {showDocumentSelector && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DOCUMENT_TYPES.map((docType) => (
                  <div
                    key={docType.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedDocumentType === docType.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDocumentTypeSelect(docType.id)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{docType.icon}</span>
                      <h4 className="font-medium text-sm">{docType.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{docType.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(docType.complexity)}`}>
                        {docType.complexity}
                      </span>
                      <span className="text-xs text-gray-500">{docType.estimatedTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Button onClick={handleDirectEditor} variant="primary" className="w-full">
                Start with {DOCUMENT_TYPES.find(t => t.id === selectedDocumentType)?.name}
              </Button>
            </div>
          </div>
        )}

        {/* Plan Switching */}
        {showPlanSwitching && recentPlans.length > 0 && (
          <div className="entry-option p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">📁 Recent Plans</h3>
            <div className="space-y-2">
              {recentPlans.slice(0, 3).map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePlanSwitch(plan)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {plan.product} - {plan.route}
                    </p>
                    <p className="text-xs text-gray-500">
                      {plan.sections?.length || 0} sections • {plan.language}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Plan Info */}
        {currentPlan && (
          <div className="entry-option p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">📄 Current Plan</h3>
            <p className="text-sm text-gray-600">
              {currentPlan.product} - {currentPlan.route} • {currentPlan.sections?.length || 0} sections
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

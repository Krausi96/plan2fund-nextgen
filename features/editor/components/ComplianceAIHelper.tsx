/**
 * ComplianceAIHelper - Unified component merging RequirementsChecker and AI Assistant
 * Shows compliance status and AI assistance side by side
 * Based on strategic analysis report recommendations
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Sparkles, Send, 
  Wand2, FileCheck, MessageSquare, Loader2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Card } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  ReadinessCheck, 
  createReadinessValidator, 
  ReadinessValidator, 
  transformCategorizedToProgramRequirements 
} from '@/shared/lib/readiness';
import { createAIHelper, createEnhancedAIHelper } from '@/features/editor/engine/aiHelper';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useUser } from '@/shared/contexts/UserContext';
import { isFeatureEnabled, getSubscriptionTier, FeatureFlag } from '@/shared/lib/featureFlags';
import UpgradeModal from '@/shared/components/UpgradeModal';

interface ComplianceAIHelperProps {
  plan: any;
  programProfile?: any;
  programId?: string;
  planContent: Record<string, any>;
  currentSection: string;
  onInsertContent: (content: string, section: string) => void;
}

type ChatMessage = {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  action?: string;
};

export default function ComplianceAIHelper({
  plan,
  programProfile,
  programId,
  planContent,
  currentSection,
  onInsertContent
}: ComplianceAIHelperProps) {
  const { t } = useI18n();
  const { userProfile } = useUser();
  const [activeTab, setActiveTab] = useState<'compliance' | 'ai'>('compliance');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureFlag | undefined>();
  
  // Compliance state
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [programRequirements, setProgramRequirements] = useState<any>(null);
  
  // AI state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch requirements and perform compliance check
  useEffect(() => {
    if (programId) {
      fetchProgramRequirements(programId);
    } else if (programProfile?.programType) {
      performReadinessCheck();
    }
  }, [programId, programProfile, planContent]);

  const fetchProgramRequirements = async (id: string) => {
    setIsLoadingCompliance(true);
    try {
      const response = await fetch(`/api/programmes/${id}/requirements`);
      if (!response.ok) throw new Error(`Failed to fetch requirements: ${response.statusText}`);
      
      const data = await response.json();
      const categorizedRequirements = data.categorized_requirements || {};
      const transformedRequirements = transformCategorizedToProgramRequirements(
        categorizedRequirements,
        data
      );
      
      if (transformedRequirements) {
        setProgramRequirements(transformedRequirements);
        const validator = new ReadinessValidator(transformedRequirements, planContent);
        const results = await validator.performReadinessCheck();
        setChecks(results);
      }
    } catch (error) {
      console.error('Error fetching program requirements:', error);
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  const performReadinessCheck = async () => {
    setIsLoadingCompliance(true);
    try {
      const validator = await createReadinessValidator(
        programProfile?.programType || 'grant', 
        planContent
      );
      if (validator) {
        const results = await validator.performReadinessCheck();
        setChecks(results);
      }
    } catch (error) {
      console.error('Error performing readiness check:', error);
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  // Update checks when planContent changes
  useEffect(() => {
    if (programRequirements && planContent) {
      const validator = new ReadinessValidator(programRequirements, planContent);
      validator.performReadinessCheck().then(results => {
        setChecks(results);
      }).catch(err => {
        console.error('Error updating checks:', err);
      });
    }
  }, [planContent, programRequirements]);

  // AI Helper functions
  const handleFixCompliance = async () => {
    setIsProcessingAI(true);
    try {
      const readinessIssues = checks
        .filter(c => c.status !== 'complete')
        .map(c => `${c.category}: ${c.message}`)
        .join('\n');
      
      const aiHelper = createAIHelper({
        maxWords: 300,
        sectionScope: currentSection,
        programHints: programProfile?.required || {},
        userAnswers: planContent,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });

      const prompt = `Fix compliance issues in the ${currentSection} section:\n\n${readinessIssues}\n\nCurrent content:\n${planContent[currentSection] || 'No content yet'}`;
      const response = await aiHelper.generateSectionContent(currentSection, prompt, {
        id: programProfile?.programId || 'unknown',
        name: programProfile?.programName || 'Program',
        type: programProfile?.route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      });

      if (response.content) {
        onInsertContent(response.content, currentSection);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `I've updated the ${currentSection} section to address compliance issues.`,
          timestamp: new Date(),
          action: 'fix_compliance'
        }]);
      }
    } catch (error) {
      console.error('Error fixing compliance:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleImproveWriting = async () => {
    // Check premium access
    const subscriptionTier = getSubscriptionTier(userProfile);
    if (!isFeatureEnabled('advanced_ai', subscriptionTier)) {
      setUpgradeFeature('advanced_ai');
      setShowUpgradeModal(true);
      return;
    }
    
    setIsProcessingAI(true);
    try {
      const aiHelper = createAIHelper({
        maxWords: 300,
        sectionScope: currentSection,
        programHints: programProfile?.required || {},
        userAnswers: planContent,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });

      const prompt = `Improve the writing quality and clarity of the ${currentSection} section:\n\n${planContent[currentSection] || 'No content yet'}`;
      const response = await aiHelper.generateSectionContent(currentSection, prompt, {
        id: programProfile?.programId || 'unknown',
        name: programProfile?.programName || 'Program',
        type: programProfile?.route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      });

      if (response.content) {
        onInsertContent(response.content, currentSection);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `I've improved the writing quality of the ${currentSection} section.`,
          timestamp: new Date(),
          action: 'improve_writing'
        }]);
      }
    } catch (error) {
      console.error('Error improving writing:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessingAI) return;

    // Check premium access for advanced AI
    const subscriptionTier = getSubscriptionTier(userProfile);
    if (!isFeatureEnabled('advanced_ai', subscriptionTier)) {
      setUpgradeFeature('advanced_ai');
      setShowUpgradeModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessingAI(true);

    try {
      const aiHelper = createAIHelper({
        maxWords: 300,
        sectionScope: currentSection,
        programHints: programProfile?.required || {},
        userAnswers: planContent,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });

      const response = await aiHelper.generateSectionContent(
        currentSection,
        input,
        {
          id: programProfile?.programId || 'unknown',
          name: programProfile?.programName || 'Program',
          type: programProfile?.route || 'grant',
          amount: '',
          eligibility: [],
          requirements: [],
          score: 100,
          reasons: [],
          risks: []
        }
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content || 'I apologize, but I couldn\'t generate a response.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'incomplete':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const overallProgress = checks.length > 0
    ? (checks.filter(c => c.status === 'complete').length / checks.length) * 100
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'compliance'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span>Compliance</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'ai'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Assistant</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            {/* Overall Progress */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </Card>

            {/* Quick Actions */}
            {checks.filter(c => c.status !== 'complete').length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleFixCompliance}
                  disabled={isProcessingAI}
                  size="sm"
                  className="flex-1"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Fix Issues
                </Button>
                <Button
                  onClick={handleImproveWriting}
                  disabled={isProcessingAI}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Improve Writing
                </Button>
              </div>
            )}

            {/* Compliance Checks */}
            {isLoadingCompliance ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {checks.map((check, index) => (
                  <Card
                    key={index}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has(check.category)) {
                        newExpanded.delete(check.category);
                      } else {
                        newExpanded.add(check.category);
                      }
                      setExpandedSections(newExpanded);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {check.category}
                          </span>
                          <Badge
                            variant={
                              check.status === 'complete' ? 'default' :
                              check.status === 'incomplete' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {check.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{check.message}</p>
                        {expandedSections.has(check.category) && check.suggestions && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Suggestions:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {check.suggestions.map((suggestion, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-blue-500">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Ask me anything about your business plan</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-lg p-3
                      ${message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isProcessingAI && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask for help with your business plan..."
                  className="min-h-[60px] resize-none"
                  disabled={isProcessingAI}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessingAI}
                  size="sm"
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
    </div>
  );
}


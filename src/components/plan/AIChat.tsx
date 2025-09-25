import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import InfoDrawer from "@/components/common/InfoDrawer";
import { aiHelperGuardrails } from "@/lib/aiHelperGuardrails";
import { useI18n } from "@/contexts/I18nContext";

type AIChatProps = {
  onInsertContent: (content: string, section: string) => void;
  currentSection: string;
  persona: "newbie" | "expert";
};

type ChatMessage = {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  chips?: string[];
  command?: string;
};

type ExtractedChip = {
  type: "ICP" | "market" | "pricing" | "team" | "budget";
  value: string;
  confidence: number;
};

const getExpertActions = (t: (key: keyof typeof import('../../../i18n/en.json')) => string) => [
  { key: "draft", label: t("aiChat.draft"), icon: "✍️", description: t("aiChat.draftDesc") },
  { key: "improve", label: t("aiChat.improve"), icon: "⚡", description: t("aiChat.improveDesc") },
  { key: "summarize", label: t("aiChat.summarize"), icon: "📝", description: t("aiChat.summarizeDesc") },
  { key: "translate", label: t("aiChat.translate"), icon: "🌐", description: t("aiChat.translateDesc") },
  { key: "formal", label: t("aiChat.formal"), icon: "👔", description: t("aiChat.formalDesc") },
  { key: "risks", label: t("aiChat.risks"), icon: "⚠️", description: t("aiChat.risksDesc") }
];

const getContextSuggestions = (t: (key: keyof typeof import('../../../i18n/en.json')) => string) => ({
  [t("aiChat.suggestions.executiveSummary")]: [
    t("aiChat.suggestions.createValueProp"),
    t("aiChat.suggestions.addMarketMetrics"),
    t("aiChat.suggestions.includeFundingReqs")
  ],
  [t("aiChat.suggestions.businessDescription")]: [
    t("aiChat.suggestions.defineUSP"),
    t("aiChat.suggestions.addCompetitiveAdvantages"),
    t("aiChat.suggestions.includeBusinessModel")
  ],
  [t("aiChat.suggestions.marketAnalysis")]: [
    t("aiChat.suggestions.addMarketSize"),
    t("aiChat.suggestions.includeTargetSegments"),
    t("aiChat.suggestions.addCompetitiveLandscape")
  ],
  [t("aiChat.suggestions.financialProjections")]: [
    t("aiChat.suggestions.createRevenueForecasts"),
    t("aiChat.suggestions.addExpenseBreakdown"),
    t("aiChat.suggestions.includeFundingTimeline")
  ],
  [t("aiChat.suggestions.team")]: [
    t("aiChat.suggestions.highlightKeyMembers"),
    t("aiChat.suggestions.addRelevantExperience"),
    t("aiChat.suggestions.includeAdvisoryBoard")
  ]
});

export default function AIChat({ onInsertContent, currentSection, persona }: AIChatProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [extractedChips, setExtractedChips] = useState<ExtractedChip[]>([]);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expertActions = getExpertActions(t);

  // Extract chips from user input
  const extractChips = (text: string): ExtractedChip[] => {
    const chips: ExtractedChip[] = [];
    
    // Simple keyword extraction (in real app, this would be more sophisticated)
    const patterns = {
      ICP: /\b(customers?|users?|clients?|target market|B2B|B2C|enterprise|SMB)\b/gi,
      market: /\b(market size|TAM|SAM|SOM|€\d+[km]?|million|billion)\b/gi,
      pricing: /\b(€\d+|\$\d+|price|cost|revenue|subscription|freemium)\b/gi,
      team: /\b(team|employees?|founders?|CEO|CTO|engineers?|developers?)\b/gi,
      budget: /\b(budget|funding|€\d+[km]?|investment|raise|seed|series)\b/gi
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          chips.push({
            type: type as ExtractedChip["type"],
            value: match,
            confidence: 0.8
          });
        });
      }
    });

    return chips;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Show commands when user types "/"
    if (value.startsWith("/")) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }

    // Extract chips
    const chips = extractChips(value);
    setExtractedChips(chips);
  };


  const handleActionClick = async (action: string) => {
    setSelectedAction(action);
    setIsProcessing(true);

    try {
      const aiResponse = generateExpertResponse(action, currentSection);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse.content,
        timestamp: new Date(),
        command: action
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing action:', error);
    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
      chips: extractedChips.map(c => `${c.type}: ${c.value}`)
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Process input with guardrails
      const guardrailResponse = await aiHelperGuardrails.processInput(input, 'plan');
      
      // Handle different response types
      if (guardrailResponse.type === 'redirect') {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: guardrailResponse.content.message,
          timestamp: new Date(),
          command: 'redirect'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (guardrailResponse.type === 'suggestion_ticket') {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: `I've created a suggestion ticket for "${guardrailResponse.content.programName}". This will be reviewed by our team.`,
          timestamp: new Date(),
          command: 'suggestion'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (guardrailResponse.type === 'chips') {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: `I extracted these key information from your input:\n\n${guardrailResponse.content.map((chip: any) => `• ${chip.label}: ${chip.value}`).join('\n')}\n\nWould you like me to help you with your business plan based on this information?`,
          timestamp: new Date(),
          command: 'chips'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (guardrailResponse.type === 'clarification') {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: `To better help you, could you clarify:\n\n${guardrailResponse.content.map((q: string) => `• ${q}`).join('\n')}`,
          timestamp: new Date(),
          command: 'clarification'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (guardrailResponse.type === 'plan_assistance') {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: `${guardrailResponse.content.message}\n\n${guardrailResponse.content.suggestions.map((s: string) => `• ${s}`).join('\n')}`,
          timestamp: new Date(),
          command: 'plan_assistance'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback to original AI response
        const aiResponse = await generateAIResponse(input, currentSection);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: aiResponse.content,
          timestamp: new Date(),
          command: input.startsWith("/") ? input.split(" ")[0] : undefined
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error processing input with guardrails:', error);
      // Fallback to original AI response
      const aiResponse = await generateAIResponse(input, currentSection);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse.content,
        timestamp: new Date(),
        command: input.startsWith("/") ? input.split(" ")[0] : undefined
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsProcessing(false);
    }

    setInput("");
    setExtractedChips([]);
  };

  const generateExpertResponse = (action: string, section: string) => {
    switch (action) {
      case "draft":
        return {
          content: `I'll help you draft content for your ${section}:\n\n**Key Elements to Include:**\n• Clear problem statement\n• Your unique solution\n• Target market definition\n• Competitive advantages\n• Revenue model\n\nWould you like me to create a structured draft based on your business details?`
        };
      case "improve":
        return {
          content: `Let me help you improve your ${section}:\n\n**Enhancement Areas:**\n• Strengthen value proposition\n• Add supporting data and metrics\n• Improve clarity and flow\n• Include specific examples\n• Add compelling language\n\nPlease share your current content and I'll provide specific improvements.`
        };
      case "summarize":
        return {
          content: `I'll create a compelling executive summary for your ${section}:\n\n**Summary Structure:**\n• Problem & Solution (2-3 sentences)\n• Market Opportunity (with data)\n• Business Model (revenue streams)\n• Key Metrics & Traction\n• Funding Requirements\n\nThis will be perfect for investor presentations and grant applications.`
        };
      case "translate":
        return {
          content: `I can translate your ${section} content:\n\n**Available Languages:**\n• German (Deutsch)\n• French (Français)\n• Spanish (Español)\n• Italian (Italiano)\n\n**Translation Features:**\n• Business terminology accuracy\n• Cultural adaptation\n• Professional tone maintenance\n• Industry-specific vocabulary\n\nWhich language would you prefer?`
        };
      case "formal":
        return {
          content: `I'll make your ${section} more formal and professional:\n\n**Professional Enhancements:**\n• Academic writing style\n• Formal business language\n• Structured presentation\n• Professional terminology\n• Investor-ready format\n\nThis will ensure your content meets the highest professional standards for funding applications.`
        };
      case "risks":
        return {
          content: `I'll help you identify and address risks in your ${section}:\n\n**Risk Categories to Consider:**\n• Market risks (competition, demand)\n• Financial risks (funding, cash flow)\n• Operational risks (team, execution)\n• Regulatory risks (compliance, changes)\n• Technology risks (development, security)\n\n**Risk Mitigation Strategies:**\n• Contingency planning\n• Alternative approaches\n• Insurance considerations\n• Partnership strategies\n\nThis shows investors you've thought through potential challenges.`
        };
      default:
        return {
          content: `I'm your expert business consultant. How can I help you with your ${section}?\n\n**Available Services:**\n• Content creation and improvement\n• Strategic planning guidance\n• Risk assessment\n• Professional formatting\n• Multi-language support\n\nWhat would you like to work on?`
        };
    }
  };

  const generateAIResponse = async (input: string, section: string) => {
    try {
      // Use the real AI helper
      const aiHelper = new (await import('@/lib/aiHelper')).AIHelper({
        maxWords: 200,
        sectionScope: section,
        programHints: {},
        userAnswers: {},
        tone: 'neutral',
        language: 'en'
      });

      const response = await aiHelper.generateSectionContent(section, input, { 
        id: 'business_plan',
        name: 'Business Plan',
        type: 'business_plan',
        amount: '0',
        eligibility: [],
        requirements: [],
        score: 0,
        reasons: [],
        risks: []
      });
      return {
        content: response.content,
        suggestions: response.suggestions,
        citations: response.citations
      };
    } catch (error) {
      console.error('AI response generation error:', error);
      return {
        content: `I understand you're working on your ${section}. Based on your input, I can help you:\n\n• Create structured content\n• Generate financial projections\n• Improve clarity and tone\n• Add supporting data\n\nWhat specific aspect would you like help with?`,
        suggestions: [],
        citations: []
      };
    }
  };

  const handleInsertToSection = (content: string) => {
    onInsertContent(content, currentSection);
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg">
      {/* Expert Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            👔
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Expert AI Coach</h3>
            <p className="text-xs text-gray-600">Professional Business Consultant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            {isExpanded ? t("aiChat.compact") : t("aiChat.expand")}
          </button>
          <button
            onClick={() => setShowInfoDrawer(true)}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Context-Aware Suggestions */}
      <div className="p-3 bg-gray-50 border-b">
        <div className="text-xs text-gray-600 mb-2">Suggestions for {currentSection}:</div>
        <div className="flex flex-wrap gap-1">
          {(getContextSuggestions(t)[currentSection as keyof ReturnType<typeof getContextSuggestions>] || []).map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setInput(suggestion)}
              className="px-2 py-1 bg-white text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Expert Action Toolbar */}
      <div className="p-3 border-b">
        <div className="text-xs text-gray-600 mb-2">Quick Actions:</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {expertActions.map((action) => (
            <button
              key={action.key}
              onClick={() => handleActionClick(action.key)}
              disabled={isProcessing}
              className={`flex items-center gap-2 p-2 text-xs rounded border transition-colors ${
                selectedAction === action.key
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-sm flex-shrink-0">{action.icon}</span>
              <div className="text-left min-w-0">
                <div className="font-medium truncate">{action.label}</div>
                <div className="text-gray-500 text-xs hidden sm:block">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages - Only show when expanded */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                {message.chips && message.chips.length > 0 && (
                  <div className="mt-2 text-xs opacity-75">
                    Chips: {message.chips.join(", ")}
                  </div>
                )}
                {message.type === "ai" && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInsertToSection(message.content)}
                      className="text-xs"
                    >
                      Apply to {currentSection}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact Input - Always visible */}
      <div className="p-3 border-t">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask your expert consultant..."
            className="w-full border rounded-lg p-2 resize-none text-sm"
            rows={isExpanded ? 2 : 1}
          />
          {showCommands && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg z-10">
              {expertActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => handleActionClick(action.key)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium">{action.icon} {action.label}</div>
                  <div className="text-gray-500 text-xs">{action.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {persona === "newbie" ? t("aiChat.tutoringMode") : t("aiChat.expertMode")}
          </div>
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isProcessing}
            size="sm"
            className="text-xs"
          >
            {isProcessing ? "..." : t("aiChat.send")}
          </Button>
        </div>
      </div>

      {/* Info Drawer */}
      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title={t("aiChat.expertFeaturesTitle")}
        content={
          <div className="space-y-4">
            <p>
              Your professional business consultant AI coach provides expert guidance 
              for creating compelling business plans and funding applications.
            </p>
            
            <h3 className="font-semibold">Expert Actions:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Draft:</strong> Create initial content with professional structure</li>
              <li><strong>Improve:</strong> Enhance existing text with expert insights</li>
              <li><strong>Summarize:</strong> Create compelling executive summaries</li>
              <li><strong>Translate:</strong> Multi-language support for international applications</li>
              <li><strong>Make Formal:</strong> Professional formatting for investor presentations</li>
              <li><strong>Add Risks:</strong> Comprehensive risk assessment and mitigation</li>
            </ul>

            <h3 className="font-semibold">Context-Aware Suggestions:</h3>
            <p className="text-sm">
              The AI provides specific suggestions based on your current section, 
              helping you focus on the most important elements for each part of your plan.
            </p>

            <h3 className="font-semibold">Professional Standards:</h3>
            <p className="text-sm">
              All content is generated to meet the highest professional standards 
              for business plans, grant applications, and investor presentations.
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Expert Mode:</strong> Your AI coach assumes business knowledge 
              and focuses on creating professional, investor-ready content.
            </div>
          </div>
        }
      />
    </div>
  );
}


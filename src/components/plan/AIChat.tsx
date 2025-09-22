import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import InfoDrawer from "@/components/common/InfoDrawer";
import { aiHelperGuardrails } from "@/lib/aiHelperGuardrails";

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

const COMMANDS = [
  { key: "outline", label: "Create outline", description: "Generate section outline" },
  { key: "bullets", label: "Bullet points", description: "Create bullet list" },
  { key: "financials", label: "Financial data", description: "Generate financial projections" },
  { key: "rewrite", label: "Rewrite", description: "Improve existing text" },
  { key: "critique", label: "Critique", description: "Review and suggest improvements" }
];

const TONE_OPTIONS = [
  { value: "concise", label: "Concise" },
  { value: "neutral", label: "Neutral" },
  { value: "formal", label: "Formal" }
];

export default function AIChat({ onInsertContent, currentSection, persona }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [tone, setTone] = useState("neutral");
  const [extractedChips, setExtractedChips] = useState<ExtractedChip[]>([]);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleCommandSelect = (command: string) => {
    setInput(`/${command} `);
    setShowCommands(false);
    textareaRef.current?.focus();
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
        const aiResponse = generateAIResponse(input, currentSection, tone);
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
      const aiResponse = generateAIResponse(input, currentSection, tone);
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

  const generateAIResponse = (input: string, section: string, tone: string) => {
    const command = input.startsWith("/") ? input.split(" ")[0] : null;
    
    if (command === "/outline") {
      return {
        content: `Here's an outline for your ${section}:\n\n1. Executive Summary\n2. Key Points\n3. Supporting Evidence\n4. Next Steps\n\nWould you like me to expand on any section?`
      };
    } else if (command === "/bullets") {
      return {
        content: `• Clear value proposition\n• Target market identification\n• Competitive advantages\n• Revenue model\n• Growth strategy\n\nThese bullet points can be expanded with specific details.`
      };
    } else if (command === "/financials") {
      return {
        content: `Financial projections for ${section}:\n\n• Revenue: €50K - €200K (Year 1)\n• Costs: €30K - €120K\n• Break-even: Month 8-12\n• Funding needed: €100K\n\nWould you like me to create a detailed financial model?`
      };
    } else if (command === "/rewrite") {
      return {
        content: `Here's a ${tone} rewrite:\n\n"Our innovative solution addresses the critical market need through a scalable business model that delivers measurable value to customers while maintaining sustainable growth."\n\nWould you like me to adjust the tone or focus?`
      };
    } else if (command === "/critique") {
      return {
        content: `Review of your ${section}:\n\nStrengths:\n• Clear problem identification\n• Strong market opportunity\n\nAreas for improvement:\n• Add specific metrics\n• Include competitive analysis\n• Define success criteria\n\nWould you like me to help improve any specific area?`
      };
    } else {
      return {
        content: `I understand you're working on your ${section}. Based on your input, I can help you:\n\n• Create structured content\n• Generate financial projections\n• Improve clarity and tone\n• Add supporting data\n\nWhat specific aspect would you like help with?`
      };
    }
  };

  const handleInsertToSection = (content: string) => {
    onInsertContent(content, currentSection);
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">AI Plan Assistant</h3>
        <div className="flex items-center gap-2">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            {TONE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowInfoDrawer(true)}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Extracted Chips */}
      {extractedChips.length > 0 && (
        <div className="p-2 bg-blue-50 border-b">
          <div className="text-xs text-gray-600 mb-1">Extracted signals:</div>
          <div className="flex flex-wrap gap-1">
            {extractedChips.map((chip, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {chip.type}: {chip.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
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
              <div className="whitespace-pre-wrap">{message.content}</div>
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

      {/* Input */}
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
            placeholder="Ask AI for help with your plan... (try /outline, /bullets, /financials)"
            className="w-full border rounded-lg p-2 resize-none"
            rows={2}
          />
          {showCommands && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg z-10">
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.key}
                  onClick={() => handleCommandSelect(cmd.key)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium">/{cmd.key}</div>
                  <div className="text-gray-500 text-xs">{cmd.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {persona === "newbie" ? "Tutoring mode" : "Expert mode"}
          </div>
          <Button onClick={handleSend} disabled={!input.trim() || isProcessing}>
            Send
          </Button>
        </div>
      </div>

      {/* Info Drawer */}
      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title="How the AI Chat Works"
        content={
          <div className="space-y-4">
            <p>
              The AI chat helps you create and improve your business plan content through 
              intelligent assistance and structured guidance.
            </p>
            
            <h3 className="font-semibold">Commands:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>/outline</strong> - Generate structured section outlines</li>
              <li><strong>/bullets</strong> - Create bullet point lists</li>
              <li><strong>/financials</strong> - Generate financial projections</li>
              <li><strong>/rewrite</strong> - Improve existing text</li>
              <li><strong>/critique</strong> - Review and suggest improvements</li>
            </ul>

            <h3 className="font-semibold">Signal Extraction:</h3>
            <p className="text-sm">
              The AI automatically extracts key signals from your input (ICP, market size, 
              pricing, team, budget) to better understand your business context.
            </p>

            <h3 className="font-semibold">Content Insertion:</h3>
            <p className="text-sm">
              When you click "Apply to [Section]", the AI shows you a preview of what 
              will be inserted. You can review and modify before accepting.
            </p>

            <h3 className="font-semibold">Tone & Persona:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Concise:</strong> Short, direct responses</li>
              <li><strong>Neutral:</strong> Balanced, professional tone</li>
              <li><strong>Formal:</strong> Academic, detailed responses</li>
              <li><strong>Newbie:</strong> Includes tutoring and explanations</li>
              <li><strong>Expert:</strong> Assumes knowledge, focuses on content</li>
            </ul>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Note:</strong> This is a demo AI assistant. In production, it would 
              use advanced language models and have access to your full business context.
            </div>
          </div>
        }
      />
    </div>
  );
}


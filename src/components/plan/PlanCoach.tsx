import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type PlanCoachProps = {
  currentSection: string;
  onInsertContent: (content: string, section: string) => void;
  persona: "newbie" | "expert";
};

export default function PlanCoach({ currentSection, onInsertContent, persona }: PlanCoachProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const quickActions = [
    {
      id: "draft-bullets",
      title: "Draft Bullets",
      description: "Generate bullet points for this section",
      icon: "📝"
    },
    {
      id: "suggest-data",
      title: "Suggest Data",
      description: "Add relevant data and metrics",
      icon: "📊"
    },
    {
      id: "risks-mitigations",
      title: "Risks & Mitigations",
      description: "Identify potential risks and solutions",
      icon: "⚠️"
    }
  ];

  const generateContent = (action: string, section: string) => {
    switch (action) {
      case "draft-bullets":
        return generateBullets(section);
      case "suggest-data":
        return generateData(section);
      case "risks-mitigations":
        return generateRisks(section);
      default:
        return "Content generated for " + section;
    }
  };

  const generateBullets = (section: string) => {
    const bulletTemplates = {
      "Executive Summary": [
        "• Clear value proposition and market opportunity",
        "• Key financial highlights and growth projections", 
        "• Team credentials and competitive advantages",
        "• Funding requirements and use of funds",
        "• Expected outcomes and success metrics"
      ],
      "Problem": [
        "• Quantified market pain point with customer evidence",
        "• Frequency and severity of the problem",
        "• Current inadequate solutions and their limitations",
        "• Market size and willingness to pay",
        "• Why this problem needs solving now"
      ],
      "Solution": [
        "• Unique approach and key differentiators",
        "• Core features and functionality",
        "• Technology stack and intellectual property",
        "• Proof of concept and validation results",
        "• Scalability and competitive moats"
      ],
      "Market": [
        "• Total Addressable Market (TAM) size and growth",
        "• Serviceable Addressable Market (SAM) analysis",
        "• Serviceable Obtainable Market (SOM) projections",
        "• Target customer segments and personas",
        "• Competitive landscape and positioning"
      ],
      "Financials": [
        "• Revenue model and pricing strategy",
        "• Key financial assumptions and drivers",
        "• 3-year financial projections",
        "• Break-even analysis and cash flow",
        "• Funding requirements and use of funds"
      ]
    };

    return bulletTemplates[section as keyof typeof bulletTemplates]?.join("\n") || 
           "• Key point 1\n• Key point 2\n• Key point 3\n• Key point 4\n• Key point 5";
  };

  const generateData = (section: string) => {
    const dataTemplates = {
      "Market": [
        "Market Size: €2.5B (TAM), €500M (SAM)",
        "Growth Rate: 15% CAGR over next 5 years",
        "Customer Acquisition Cost: €150",
        "Lifetime Value: €2,400",
        "Market Share Target: 2% by Year 3"
      ],
      "Financials": [
        "Revenue Year 1: €250K, Year 2: €800K, Year 3: €2.1M",
        "Gross Margin: 75%",
        "Operating Expenses: 60% of revenue",
        "Break-even: Month 18",
        "Runway: 24 months with current funding"
      ],
      "Solution": [
        "Development Time: 8 months to MVP",
        "Technology Stack: React, Node.js, PostgreSQL",
        "Performance Metrics: 99.9% uptime target",
        "Security: SOC 2 compliance planned",
        "Scalability: 10,000 concurrent users"
      ]
    };

    return dataTemplates[section as keyof typeof dataTemplates]?.join("\n") || 
           "• Metric 1: Value\n• Metric 2: Value\n• Metric 3: Value";
  };

  const generateRisks = (section: string) => {
    const riskTemplates = {
      "Market": [
        "Risk: Market saturation\nMitigation: Focus on underserved segments",
        "Risk: Economic downturn\nMitigation: Diversified revenue streams",
        "Risk: Regulatory changes\nMitigation: Compliance monitoring and legal review",
        "Risk: Competitive pressure\nMitigation: Strong differentiation and IP protection"
      ],
      "Technology": [
        "Risk: Technical complexity\nMitigation: Experienced team and phased development",
        "Risk: Security vulnerabilities\nMitigation: Regular audits and best practices",
        "Risk: Scalability issues\nMitigation: Cloud-native architecture and load testing",
        "Risk: Technology obsolescence\nMitigation: Modern stack and continuous updates"
      ],
      "Financial": [
        "Risk: Funding shortfall\nMitigation: Multiple funding sources and cost controls",
        "Risk: Revenue delays\nMitigation: Conservative projections and milestone-based funding",
        "Risk: Cost overruns\nMitigation: Detailed budgeting and regular monitoring",
        "Risk: Currency fluctuations\nMitigation: Hedging strategies for international operations"
      ]
    };

    return riskTemplates[section as keyof typeof riskTemplates]?.join("\n\n") || 
           "Risk: General business risk\nMitigation: Standard risk management practices";
  };

  const handleAction = (actionId: string) => {
    setActiveAction(actionId);
    const content = generateContent(actionId, currentSection);
    onInsertContent(content, currentSection);
    
    // Reset after a delay
    setTimeout(() => setActiveAction(null), 2000);
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Plan Coach</h3>
        <div className="text-xs text-gray-500">
          {persona === "newbie" ? "Guided mode" : "Quick actions"}
        </div>
      </div>

      <div className="space-y-2">
        {quickActions.map((action) => (
          <div key={action.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{action.icon}</span>
                <div>
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-gray-600">{action.description}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(action.id)}
                disabled={activeAction === action.id}
                className="text-xs"
              >
                {activeAction === action.id ? "✓" : "Use"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {persona === "newbie" && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Tip:</strong> Use these quick actions to get started with structured content. 
            You can always edit and customize the generated content to fit your specific business.
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Current section: {currentSection}
      </div>
    </div>
  );
}


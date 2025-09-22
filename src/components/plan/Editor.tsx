import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { chapterTemplates } from "@/lib/templates/chapters";
import { loadPlanSections, savePlanSections, type PlanSection } from "@/lib/planStore";
import InfoDrawer from "@/components/common/InfoDrawer";
import AIChat from "@/components/plan/AIChat";
import analytics from "@/lib/analytics";

// Helper function to generate pre-filled content based on user answers and enhanced payload
function generatePreFilledContent(userAnswers: Record<string, any>, program?: any): string {
  let content = "";
  
  // Try to load enhanced payload
  let enhancedPayload = null;
  try {
    const stored = localStorage.getItem('enhancedPayload');
    if (stored) {
      enhancedPayload = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse enhanced payload:', e);
  }
  
  // Add program information
  if (program) {
    content += `# ${program.name}\n\n`;
    content += `**Program Type:** ${program.type}\n`;
    content += `**Region:** ${program.region || 'Austria'}\n`;
    if (program.maxAmount) {
      content += `**Maximum Amount:** €${program.maxAmount.toLocaleString()}\n`;
    }
    
    // Add derived funding mode if available
    if (enhancedPayload?.fundingMode) {
      content += `**Derived Funding Mode:** ${enhancedPayload.fundingMode}\n`;
    }
    
    content += `\n---\n\n`;
  }
  
  // Add user answers as pre-filled information
  content += `## Your Business Information\n\n`;
  
  if (userAnswers.q1_country) {
    const countryMap: Record<string, string> = {
      'AT': 'Austria only',
      'EU': 'EU (including Austria)',
      'NON_EU': 'Outside EU'
    };
    content += `**Location:** ${countryMap[userAnswers.q1_country] || userAnswers.q1_country}\n`;
  }
  
  if (userAnswers.q2_entity_stage) {
    const stageMap: Record<string, string> = {
      'PRE_COMPANY': 'Just an idea or team forming',
      'INC_LT_6M': 'Recently started (less than 6 months)',
      'INC_6_36M': 'Early stage (6 months to 3 years)',
      'INC_GT_36M': 'Established business (over 3 years)',
      'RESEARCH_ORG': 'University or research institute',
      'NONPROFIT': 'Non-profit organization'
    };
    content += `**Business Stage:** ${stageMap[userAnswers.q2_entity_stage] || userAnswers.q2_entity_stage}\n`;
  }
  
  if (userAnswers.q3_company_size) {
    const sizeMap: Record<string, string> = {
      'MICRO_0_9': 'Just me or small team (1-9 people)',
      'SMALL_10_49': 'Small company (10-49 people)',
      'MEDIUM_50_249': 'Medium company (50-249 people)',
      'LARGE_250_PLUS': 'Large company (250+ people)'
    };
    content += `**Team Size:** ${sizeMap[userAnswers.q3_company_size] || userAnswers.q3_company_size}\n`;
  }
  
  if (userAnswers.q4_theme) {
    const themeMap: Record<string, string> = {
      'INNOVATION_DIGITAL': 'Innovation, Technology, or Digital Solutions',
      'SUSTAINABILITY': 'Sustainability, Climate, or Environmental Solutions',
      'HEALTH_LIFE_SCIENCE': 'Health, Life Sciences, or Medical Technology',
      'SPACE_DOWNSTREAM': 'Space Technology or Earth Observation',
      'INDUSTRY_MANUFACTURING': 'Industry or Manufacturing',
      'OTHER': 'Other'
    };
    const themes = Array.isArray(userAnswers.q4_theme) ? userAnswers.q4_theme : [userAnswers.q4_theme];
    content += `**Business Focus:** ${themes.map(t => themeMap[t] || t).join(', ')}\n`;
  }
  
  if (userAnswers.q5_maturity_trl) {
    const maturityMap: Record<string, string> = {
      'TRL_1_2': 'Just an idea or early research',
      'TRL_3_4': 'Testing the concept',
      'TRL_5_6': 'Building a prototype',
      'TRL_7_8': 'Ready to launch or already launched',
      'TRL_9': 'Scaling and growing'
    };
    content += `**Product Readiness:** ${maturityMap[userAnswers.q5_maturity_trl] || userAnswers.q5_maturity_trl}\n`;
  }
  
  content += `\n---\n\n`;
  
  // Add derived signals information if available
  if (enhancedPayload?.derivedSignals) {
    content += `## Derived Analysis\n\n`;
    const signals = enhancedPayload.derivedSignals;
    
    content += `**Funding Mode:** ${signals.fundingMode}\n`;
    content += `**Company Stage:** ${signals.companyAgeBucket}\n`;
    content += `**Sector Focus:** ${signals.sectorBucket}\n`;
    content += `**Urgency Level:** ${signals.urgencyBucket}\n`;
    content += `**TRL Level:** ${signals.trlBucket}\n`;
    content += `**Revenue Status:** ${signals.revenueBucket}\n`;
    
    if (signals.capexFlag) {
      content += `**CAPEX Flag:** This project involves capital expenditures\n`;
    }
    if (signals.equityOk) {
      content += `**Equity Ready:** Your stage and size make you suitable for equity funding\n`;
    }
    if (signals.collateralOk) {
      content += `**Collateral Capable:** Your company can provide collateral for loans\n`;
    }
    if (signals.ipFlag) {
      content += `**IP Focus:** This project involves intellectual property development\n`;
    }
    if (signals.regulatoryFlag) {
      content += `**Regulatory Focus:** This project requires regulatory approval or compliance\n`;
    }
    if (signals.socialImpactFlag) {
      content += `**Social Impact:** This project has positive social impact potential\n`;
    }
    if (signals.esgFlag) {
      content += `**ESG Focus:** This project aligns with Environmental, Social, and Governance principles\n`;
    }
    
    // Add unknown variables section
    if (signals.unknowns && signals.unknowns.length > 0) {
      content += `\n**⚠️ Missing Information:**\n`;
      signals.unknowns.forEach((unknown: string) => {
        const descriptions: Record<string, string> = {
          'q1_country': 'Country/location information',
          'q2_entity_stage': 'Company stage information',
          'q3_company_size': 'Team size information',
          'q4_theme': 'Project theme information',
          'q5_maturity_trl': 'Technology readiness level',
          'q6_rnd_in_at': 'R&D location information',
          'q7_collaboration': 'Collaboration preferences',
          'q8_funding_types': 'Funding type preferences',
          'q9_team_diversity': 'Team diversity information',
          'q10_env_benefit': 'Environmental benefit information'
        };
        content += `- ⚪ ${descriptions[unknown] || unknown}: Not provided\n`;
      });
    }
    
    // Add counterfactuals section
    if (signals.counterfactuals && signals.counterfactuals.length > 0) {
      content += `\n**💡 Recommendations to Improve Eligibility:**\n`;
      signals.counterfactuals.forEach((counterfactual: string) => {
        content += `- ${counterfactual}\n`;
      });
    }
    
    content += `\n---\n\n`;
  }
  
  content += `## Next Steps\n\n`;
  content += `Based on your answers, here are some key points to include in your funding application:\n\n`;
  
  if (userAnswers.q6_rnd_in_at === 'YES') {
    content += `- Highlight your research and development activities in Austria\n`;
  }
  
  if (userAnswers.q7_collaboration && userAnswers.q7_collaboration !== 'NONE') {
    content += `- Describe your collaboration plans with research institutions or companies\n`;
  }
  
  if (userAnswers.q8_funding_types) {
    const fundingTypes = Array.isArray(userAnswers.q8_funding_types) ? userAnswers.q8_funding_types : [userAnswers.q8_funding_types];
    content += `- Specify why you need ${fundingTypes.join(' and ')} funding\n`;
  }
  
  if (userAnswers.q9_team_diversity === 'YES') {
    content += `- Emphasize your diverse team composition (women own at least 25% of shares)\n`;
  }
  
  if (userAnswers.q10_env_benefit && userAnswers.q10_env_benefit !== 'NONE') {
    content += `- Detail how your project benefits the environment\n`;
  }
  
  // Add trace-based suggestions if available
  if (enhancedPayload?.trace?.counterfactuals && enhancedPayload.trace.counterfactuals.length > 0) {
    content += `\n### Eligibility Improvement Suggestions:\n`;
    enhancedPayload.trace.counterfactuals.forEach((suggestion: string) => {
      content += `- ${suggestion}\n`;
    });
  }
  
  content += `\n---\n\n`;
  content += `## Your Business Plan\n\n`;
  content += `*Start writing your business plan here. The information above has been pre-filled based on your answers to help you get started.*\n\n`;
  
  return content;
}

type EditorProps = {
  program?: {
    id: string;
    name: string;
    type: string;
    region: string;
    maxAmount: number;
    requirements: string[];
    link: string;
  };
  userAnswers?: Record<string, any>;
  showProductSelector?: boolean;
};


export default function Editor({ program, userAnswers }: EditorProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [sections, setSections] = useState<PlanSection[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [persona, setPersona] = useState<"newbie" | "expert">("newbie");
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Load saved draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem("planDraft");
    if (savedDraft) setContent(savedDraft);

    const loaded = loadPlanSections()
    if (loaded.length > 0) setSections(loaded)
    else {
      const seeded = chapterTemplates.map((t) => ({ id: t.id, title: t.title, content: "" }))
      setSections(seeded)
    }

    // Track editor start
    analytics.trackEditorStart("business_plan", program?.id);
  }, []);





  // Pre-fill editor with user answers
  useEffect(() => {
    if (userAnswers && sections.length > 0) {
      const preFilledContent = generatePreFilledContent(userAnswers, program);
      if (preFilledContent) {
        setContent(preFilledContent);
        setSaved(false);
      }
    }
  }, [userAnswers, sections, program]);

  // Autosave simulation with persistence
  useEffect(() => {
    if (!saved) {
      const timer = setTimeout(() => {
        // Save locally
        localStorage.setItem("planDraft", content);
        const next = sections.map((s, i) => (i === activeIdx ? { ...s, content } : s))
        setSections(next)
        savePlanSections(next)

        // Track section edit
        const currentSection = sections[activeIdx];
        if (currentSection) {
          analytics.trackEditorSectionEdit(
            currentSection.id, 
            currentSection.title, 
            content.split(' ').length
          );
        }

        // Save to backend API
        fetch("/api/plan/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId: program?.id || "generic", content }),
        }).catch((err) => console.error("Save failed", err));

        setSaved(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, saved]);


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col space-y-4 p-6 overflow-y-auto">

          {/* Chapter Navigation Breadcrumbs */}
          <div className="bg-gray-50 py-3 px-4 rounded-lg">
            <nav className="flex gap-4 text-sm text-gray-600 overflow-x-auto">
              {sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIdx(i)
                    setContent(sections[i].content || "")
                  }}
                  className={`flex items-center gap-1 whitespace-nowrap px-3 py-1 rounded ${
                    i === activeIdx 
                      ? "bg-blue-100 text-blue-800 font-semibold" 
                      : "hover:bg-gray-200"
                  }`}
                >
                  <span>{i === activeIdx ? "➡" : "○"}</span>
                  {s.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Editor */}
          <main className="flex-1 flex flex-col space-y-4">
            {/* Sticky top progress bar */}
            <div className="sticky top-0 bg-white py-2 z-10 border-b">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Business Plan Editor</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Mode:</span>
                    <button
                      onClick={() => setPersona(persona === "newbie" ? "expert" : "newbie")}
                      className={`px-3 py-1 text-sm rounded ${
                        persona === "newbie" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {persona === "newbie" ? "Newbie" : "Expert"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAISidebar(!showAISidebar)}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded font-medium"
                    >
                      {showAISidebar ? "Hide AI Assistant" : "Show AI Assistant"}
                    </button>

                    <button
                      onClick={() => setShowInfoDrawer(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <span>ℹ️</span> How it works
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {saved ? "✅ Saved" : "Saving..."}
                  </span>
                </div>
              </div>
              <div className="mt-2"><Progress value={content.length > 0 ? 30 : 10} /></div>
            </div>

            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaved(false);
              }}
              placeholder="Start writing your plan..."
              className="w-full h-64 p-4 border rounded-md"
            />


            {/* Navigation */}
            <div className="flex justify-between mt-4">
              <Button variant="outline" asChild>
                <Link href={program ? "/results" : "/reco"}>⬅ Back</Link>
              </Button>
              <Button asChild>
                <Link href="/preview">Continue to Preview ➡</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      {showAISidebar && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600 mt-1">Get help writing your business plan</p>
          </div>
          <div className="flex-1 p-4">
            <AIChat
              onInsertContent={(content) => {
                setContent(prev => prev + "\n\n" + content);
                setSaved(false);
              }}
              currentSection={sections[activeIdx]?.title || "Current Section"}
              persona={persona}
            />
          </div>
        </div>
      )}

      {/* Hints & Helpers - Only for newbie mode */}
      {persona === "newbie" && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Hints</h2>
          <div>
            <p className="text-sm text-gray-700">{chapterTemplates[activeIdx]?.hint}</p>
            {chapterTemplates[activeIdx]?.subchapters && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold mb-2">Subchapters:</h4>
                <div className="space-y-1">
                  {chapterTemplates[activeIdx].subchapters!.map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        checked={sub.completed}
                        onChange={() => {
                          // Toggle completion (stub - would update state)
                          console.log(`Toggle ${sub.id}`);
                        }}
                        className="rounded"
                      />
                      <span className={sub.completed ? "line-through text-gray-500" : ""}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Completion: {chapterTemplates[activeIdx].subchapters!.filter(s => s.completed).length} / {chapterTemplates[activeIdx].subchapters!.length}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Drawer */}
      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title="How the Editor Helps"
        content={
          <div className="space-y-4">
            <p>
              Our business plan editor adapts to your experience level and provides 
              intelligent guidance throughout the writing process.
            </p>
            
            <h3 className="font-semibold">Editor Modes:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Newbie Mode:</strong> Shows hints, examples, and tooltips to guide you through each section</li>
              <li><strong>Expert Mode:</strong> Clean interface with minimal distractions for experienced writers</li>
            </ul>

            <h3 className="font-semibold">Plan Types:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Strategy (4-8 pages):</strong> Concise template for quick planning and pitch decks</li>
              <li><strong>Upgrade & Review:</strong> Upload existing plans for professional enhancement</li>
              <li><strong>Custom (15-35 pages):</strong> Full template with subchapters and detailed guidance</li>
            </ul>

            <h3 className="font-semibold">Features:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Auto-save to prevent data loss</li>
              <li>Professor tips and "what good looks like" guidance</li>
              <li>Built-in calculators (TAM/SAM/SOM, Depreciation)</li>
              <li>Version snapshots for tracking progress</li>
            </ul>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Copy Protection:</strong> Preview mode includes watermarks and copy restrictions. 
              Full access requires purchase. Note: Web-based protection has limitations.
            </div>
          </div>
        }
      />
    </div>
  );
}

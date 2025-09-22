import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { chapterTemplates } from "@/lib/templates/chapters";
import { loadPlanSections, savePlanSections, type PlanSection } from "@/lib/planStore";
import InfoDrawer from "@/components/common/InfoDrawer";
import AIChat from "@/components/plan/AIChat";
import analytics from "@/lib/analytics";
import SetupBar from "@/components/editor/SetupBar";
import SidebarPrograms from "@/components/editor/SidebarPrograms";
import AdvancedSearchPanel from "@/components/editor/AdvancedSearchPanel";
import { scorePrograms } from "@/lib/scoring";
import { loadPrograms } from "@/lib/prefill";

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

interface ProductOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
}

export default function Editor({ program, userAnswers, showProductSelector = false }: EditorProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [sections, setSections] = useState<PlanSection[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [persona, setPersona] = useState<"newbie" | "expert">("newbie");
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  
  // New state for unified flow
  const [showProductSelectorState, setShowProductSelector] = useState(showProductSelector);
  const [showSetupBar, setShowSetupBar] = useState(!userAnswers);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(program);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  // Product selector options
  const productOptions: ProductOption[] = [
    {
      id: 'create_new',
      title: 'Create New',
      description: 'Start with a blank document and inline setup',
      icon: '📝',
      action: 'create'
    },
    {
      id: 'update_existing',
      title: 'Update Existing',
      description: 'Upload Word/PDF and parse into document structure',
      icon: '📄',
      action: 'upload'
    },
    {
      id: 'modeling_doc',
      title: 'Modeling Document',
      description: 'Start with financial blocks, then add text',
      icon: '📊',
      action: 'modeling'
    }
  ];

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

  // Initialize AI Helper and load programs
  useEffect(() => {
    const initializeEditor = async () => {
      try {

        // Load and score programs
        if (userAnswers) {
          const allPrograms = await loadPrograms();
          const scoredPrograms = await scorePrograms({
            programs: allPrograms,
            answers: userAnswers
          });
          setPrograms(scoredPrograms);
        }
      } catch (error) {
        console.error('Failed to initialize editor:', error);
      }
    };

    initializeEditor();
  }, [userAnswers]);

  // Handlers
  const handleProductSelect = (option: ProductOption) => {
    switch (option.action) {
      case 'create':
        setShowProductSelector(false);
        setShowSetupBar(true);
        break;
      case 'upload':
        // TODO: Implement file upload
        console.log('File upload not implemented yet');
        break;
      case 'modeling':
        setShowProductSelector(false);
        setShowSetupBar(true);
        // TODO: Start with financial blocks
        break;
    }
  };

  const handleSetupComplete = () => {
    setShowSetupBar(false);
    setShowSidebar(true);
  };

  const handleAnswersUpdate = (answers: Record<string, any>) => {
    // Answers are passed as props, so we don't need to update state here
    // This is just to satisfy the SetupBar component interface
    console.log('Answers updated:', answers);
  };


  const handleProgramSelect = (program: any) => {
    setSelectedProgram(program);
  };

  const handleAdoptTemplate = (program: any) => {
    setSelectedProgram(program);
    // TODO: Switch document template and re-prefill sections
    console.log('Adopting template for:', program.name);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setCurrentQuery(query);
    // TODO: Implement search with Before/After scoring
    setTimeout(() => {
      setSearchResults([]);
      setIsSearching(false);
    }, 1000);
  };

  const handleResultSelect = (result: any) => {
    // TODO: Handle result selection
    console.log('Selected result:', result);
  };

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

  // Product Selector
  if (showProductSelectorState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Starting Point</h1>
            <p className="text-lg text-gray-600">Select how you'd like to begin your business plan</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productOptions.map((option) => (
              <div
                key={option.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleProductSelect(option)}
              >
                <Card className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{option.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                    <p className="text-gray-600">{option.description}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col space-y-4 p-6 overflow-y-auto">
          {/* Inline Setup Bar */}
          {showSetupBar && (
            <SetupBar
              userAnswers={userAnswers || {}}
              onAnswersUpdate={handleAnswersUpdate}
              onSetupComplete={handleSetupComplete}
            />
          )}

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
                      onClick={() => setShowAIChat(!showAIChat)}
                      className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
                    >
                      {showAIChat ? "Hide AI" : "AI Assistant"}
                    </button>

                    <button
                      onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                      className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded"
                    >
                      {showAdvancedSearch ? "Hide Search" : "Advanced Search"}
                    </button>

                    <button
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded"
                    >
                      {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
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

            {/* Advanced Search Panel */}
            {showAdvancedSearch && (
              <AdvancedSearchPanel
                onSearch={handleSearch}
                onResultSelect={handleResultSelect}
                searchResults={searchResults}
                isLoading={isSearching}
                currentQuery={currentQuery}
              />
            )}

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

      {/* Program-Aware Sidebar */}
      {showSidebar && (
        <SidebarPrograms
          programs={programs}
          selectedProgram={selectedProgram}
          onProgramSelect={handleProgramSelect}
          onAdoptTemplate={handleAdoptTemplate}
        />
      )}

      {/* AI Assistant - Only when enabled */}
      {showAIChat && (
        <div className="mt-6 bg-gray-50 border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">AI Assistant</h3>
          <AIChat
            onInsertContent={(content) => {
              setContent(prev => prev + "\n\n" + content);
              setSaved(false);
            }}
            currentSection={sections[activeIdx]?.title || "Current Section"}
            persona={persona}
          />
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

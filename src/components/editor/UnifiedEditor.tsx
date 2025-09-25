/**
 * Unified Editor Component
 * Integrates BlockEditor with program-aware sidebar and inline setup
 * Provides single workspace experience with all editor features
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BlockEditor, { Block } from './BlockEditor';
import SidebarPrograms from './SidebarPrograms';
import InlineSetupBar from './InlineSetupBar';
import ProductSelector from './ProductSelector';
import AIChat from '@/components/plan/AIChat';
import AdvancedSearchPanel from './AdvancedSearchPanel';
import InfoDrawer from '@/components/common/InfoDrawer';
import RouteExtrasPanel from './RouteExtrasPanel';
import { loadPlanSections, type PlanSection } from '@/lib/planStore';
import { chapterTemplates } from '@/lib/templates/chapters';
import { type Program } from '@/lib/prefill';
import { scoreProgramsEnhanced } from '@/lib/enhancedRecoEngine';
import analytics from '@/lib/analytics';

interface UnifiedEditorProps {
  program?: Program;
  userAnswers?: Record<string, any>;
  showProductSelector?: boolean;
}

export default function UnifiedEditor({ 
  program, 
  userAnswers = {}, 
  showProductSelector = false 
}: UnifiedEditorProps) {
  // Core state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [persona, setPersona] = useState<"newbie" | "expert">("newbie");
  
  // UI state
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showSetupBar, setShowSetupBar] = useState(!userAnswers || Object.keys(userAnswers).length === 0);
  
  // Data state
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, any>>(userAnswers);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(program || null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  

  const router = useRouter();

  // Initialize editor
  useEffect(() => {
    initializeEditor();
  }, []);

  // Load programs when answers change
  useEffect(() => {
    if (currentAnswers && Object.keys(currentAnswers).length > 0) {
      loadPrograms();
    }
  }, [currentAnswers]);

  const initializeEditor = async () => {
    try {
      // Load saved sections or create from templates
      const loadedSections = loadPlanSections();
      if (loadedSections.length > 0) {
        setSections(loadedSections);
      } else {
        const seededSections = chapterTemplates.map((t) => ({ 
          id: t.id, 
          title: t.title, 
          content: "" 
        }));
        setSections(seededSections);
      }


      // Generate initial blocks from user answers if available
      if (userAnswers && Object.keys(userAnswers).length > 0) {
        generateInitialBlocks(userAnswers);
      }

      // Track editor start
      analytics.trackEditorStart("unified_editor", program?.id);
    } catch (error) {
      console.error('Error initializing editor:', error);
    }
  };


  const generateInitialBlocks = (answers: Record<string, any>) => {
    const initialBlocks: Block[] = [];

    // Executive Summary block
    if (answers.business_name || answers.business_description) {
      initialBlocks.push({
        id: `block_${Date.now()}_exec_summary`,
        type: 'text',
        data: {
          content: generateExecutiveSummary(answers),
          title: 'Executive Summary'
        },
        order: 0
      });
    }

    // Business Description block
    if (answers.business_description) {
      initialBlocks.push({
        id: `block_${Date.now()}_business_desc`,
        type: 'text',
        data: {
          content: answers.business_description,
          title: 'Business Description'
        },
        order: 1
      });
    }

    // Market Analysis block
    if (answers.target_market) {
      initialBlocks.push({
        id: `block_${Date.now()}_market`,
        type: 'text',
        data: {
          content: answers.target_market,
          title: 'Market Analysis'
        },
        order: 2
      });
    }

    // Financial Projections block
    if (answers.funding_amount) {
      initialBlocks.push({
        id: `block_${Date.now()}_financials`,
        type: 'text',
        data: {
          content: generateFinancialSection(answers),
          title: 'Financial Projections'
        },
        order: 3
      });
    }

    // Timeline block
    if (answers.timeline) {
      initialBlocks.push({
        id: `block_${Date.now()}_timeline`,
        type: 'text',
        data: {
          content: generateTimelineSection(answers),
          title: 'Implementation Timeline'
        },
        order: 4
      });
    }

    setBlocks(initialBlocks);
  };

  const generateExecutiveSummary = (answers: Record<string, any>): string => {
    return `# Executive Summary

**Company:** ${answers.business_name || '[Business Name]'}
**Funding Request:** ${answers.funding_amount || '[Amount]'}
**Stage:** ${answers.business_stage || '[Stage]'}
**Sector:** ${answers.sector || '[Sector]'}

${answers.business_description || '[Business Description]'}

**Use of Funds:** ${answers.use_of_funds || '[Use of Funds]'}
**Timeline:** ${answers.timeline || '[Timeline]'}`;
  };

  const generateFinancialSection = (answers: Record<string, any>): string => {
    return `# Financial Projections

**Funding Amount:** ${answers.funding_amount || '[Amount]'}
**Use of Funds:** ${answers.use_of_funds || '[Use of Funds]'}

## Revenue Projections
- Year 1: [Projected Revenue]
- Year 2: [Projected Revenue]
- Year 3: [Projected Revenue]

## Funding Requirements
- Total Funding Needed: ${answers.funding_amount || '[Amount]'}
- Timeline: ${answers.timeline || '[Timeline]'}
- Collateral: ${answers.collateral || '[Collateral Status]'}
- Equity: ${answers.equity || '[Equity Status]'}`;
  };

  const generateTimelineSection = (answers: Record<string, any>): string => {
    return `# Implementation Timeline

**Funding Timeline:** ${answers.timeline || '[Timeline]'}

## Key Milestones
- [ ] Complete funding application
- [ ] Secure funding
- [ ] Launch product/service
- [ ] Achieve first revenue
- [ ] Scale operations

## Next Steps
1. Finalize business plan
2. Submit funding application
3. Prepare for due diligence
4. Execute growth strategy`;
  };

  const loadPrograms = async () => {
    try {
      const results = scoreProgramsEnhanced(currentAnswers, "strict");
      setPrograms(results.slice(0, 10)); // Top 10 programs
      
      // Set first program as selected if none selected
      if (!selectedProgram && results.length > 0) {
        setSelectedProgram(results[0]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const handleAnswersUpdate = (newAnswers: Record<string, any>) => {
    setCurrentAnswers(newAnswers);
    setShowSetupBar(false);
    
    // Update blocks with new answers
    generateInitialBlocks(newAnswers);
  };

  const handleSetupComplete = () => {
    setShowSetupBar(false);
    loadPrograms();
  };

  const handleProgramSelect = (program: any) => {
    setSelectedProgram(program);
  };

  const handleAdoptTemplate = (program: any) => {
    // Switch template and re-prefill sections
    const newAnswers = { ...currentAnswers, funding_mode: program.type };
    setCurrentAnswers(newAnswers);
    generateInitialBlocks(newAnswers);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    
    try {
      const results = scoreProgramsEnhanced(currentAnswers, "explorer");
      const transformedResults = results.slice(0, 10).map((result, index) => ({
        id: result.id || `result-${index}`,
        title: result.name || "Unknown Program",
        content: result.reason || "No description available",
        score: result.score || 0,
        beforeScore: Math.max(0, (result.score || 0) - 10),
        afterScore: result.score || 0,
        delta: 10,
        reasons: result.founderFriendlyReasons || [],
        risks: result.founderFriendlyRisks || []
      }));
      
      setSearchResults(transformedResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: any) => {
    console.log("Selected result:", result);
  };

  const handleBlocksChange = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  const handleSave = (blocksToSave: Block[]) => {
    // Save blocks to localStorage and backend
    localStorage.setItem("editorBlocks", JSON.stringify(blocksToSave));
    
    // Save to backend
    fetch("/api/plan/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        programId: selectedProgram?.id || "generic", 
        blocks: blocksToSave,
        answers: currentAnswers
      }),
    }).catch((err) => console.error("Save failed", err));
  };

  const handleExport = (format: 'pdf' | 'docx' | 'json') => {
    // Export functionality
    console.log(`Exporting as ${format}`);
  };

  const getCompletionPercentage = () => {
    if (blocks.length === 0) return 0;
    const completedBlocks = blocks.filter(block => 
      block.data.content && block.data.content.trim().length > 0
    ).length;
    return Math.round((completedBlocks / blocks.length) * 100);
  };

  const handleProductSelect = (type: 'create' | 'update' | 'modeling', data?: any) => {
    // Handle different product types
    if (type === 'create') {
      const newAnswers = {
        ...currentAnswers,
        business_name: data.businessName,
        business_description: data.businessDescription
      };
      setCurrentAnswers(newAnswers);
      generateInitialBlocks(newAnswers);
    } else if (type === 'update') {
      // Handle file upload and parsing
      console.log('Update with file:', data);
      // TODO: Implement file parsing
    } else if (type === 'modeling') {
      // Start with financial blocks first
      const newAnswers = {
        ...currentAnswers,
        business_name: data.businessName,
        business_description: data.businessDescription,
        modeling_mode: true
      };
      setCurrentAnswers(newAnswers);
      generateFinancialFirstBlocks(newAnswers);
    }
  };

  const generateFinancialFirstBlocks = (answers: Record<string, any>) => {
    const financialBlocks: Block[] = [
      {
        id: `block_${Date.now()}_financial_summary`,
        type: 'text',
        data: {
          content: generateFinancialSection(answers),
          title: 'Financial Summary'
        },
        order: 0
      },
      {
        id: `block_${Date.now()}_revenue_model`,
        type: 'table',
        data: {
          title: 'Revenue Projections',
          columns: ['Year', 'Revenue', 'Growth Rate', 'Notes'],
          rows: [
            ['Year 1', '€0', '0%', 'Pre-revenue'],
            ['Year 2', '€0', '0%', 'Early revenue'],
            ['Year 3', '€0', '0%', 'Growth phase']
          ]
        },
        order: 1
      },
      {
        id: `block_${Date.now()}_funding_requirements`,
        type: 'text',
        data: {
          content: generateFundingRequirements(answers),
          title: 'Funding Requirements'
        },
        order: 2
      }
    ];
    setBlocks(financialBlocks);
  };

  const generateFundingRequirements = (answers: Record<string, any>): string => {
    return `# Funding Requirements

**Total Funding Needed:** ${answers.funding_amount || '[Amount]'}
**Use of Funds:** ${answers.use_of_funds || '[Use of Funds]'}
**Timeline:** ${answers.timeline || '[Timeline]'}

## Funding Breakdown
- Product Development: [Amount]
- Marketing & Sales: [Amount]
- Operations: [Amount]
- Working Capital: [Amount]

## Funding Sources
- [ ] Grant Funding
- [ ] Loan Financing
- [ ] Equity Investment
- [ ] Personal Investment`;
  };

  // Show product selector if no program or answers
  if (showProductSelector) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProductSelector
          onSelect={handleProductSelect}
          onCancel={() => router.push('/reco')}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col space-y-4 p-3 md:p-6 overflow-y-auto">
          {/* Inline Setup Bar */}
          {showSetupBar && (
            <InlineSetupBar
              userAnswers={currentAnswers}
              onAnswersUpdate={handleAnswersUpdate}
              onSetupComplete={handleSetupComplete}
              isCollapsed={false}
              onToggleCollapse={() => setShowSetupBar(false)}
            />
          )}

          {/* Section Navigation */}
          <div className="bg-white py-3 px-4 rounded-lg shadow-sm border">
            <nav className="flex gap-2 md:gap-4 text-sm text-gray-600 overflow-x-auto">
              {sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`flex items-center gap-1 whitespace-nowrap px-2 md:px-3 py-1 rounded transition-colors text-xs md:text-sm ${
                    i === activeSection 
                      ? "bg-blue-100 text-blue-800 font-semibold" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="hidden md:inline">{i === activeSection ? "➡" : "○"}</span>
                  <span className="md:hidden">{i === activeSection ? "●" : "○"}</span>
                  <span className="truncate max-w-20 md:max-w-none">{s.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Editor Header */}
          <div className="sticky top-0 bg-white py-4 z-10 border-b shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Business Plan Editor</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProgram ? `Tailored for ${selectedProgram.name}` : 'Create your business plan'}
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Mode:</span>
                  <button
                    onClick={() => setPersona(persona === "newbie" ? "expert" : "newbie")}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
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
                    className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded font-medium transition-colors"
                  >
                    {showAISidebar ? "Hide AI" : "Show AI"}
                  </button>
                  <button
                    onClick={() => setShowInfoDrawer(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 transition-colors"
                  >
                    <span>ℹ️</span> <span className="hidden md:inline">Help</span>
                  </button>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  {getCompletionPercentage()}% Complete
                </Badge>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={getCompletionPercentage()} />
            </div>
          </div>

          {/* Block Editor */}
          <div className="flex-1">
            <BlockEditor
              initialBlocks={blocks}
              onBlocksChange={handleBlocksChange}
              onSave={handleSave}
              onExport={handleExport}
              showFormatting={true}
              showToolbar={true}
            />
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={program ? "/results" : "/reco"}>⬅ Back</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/preview">Continue to Preview ➡</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Program-Aware Sidebar */}
      {showAISidebar && (
        <div className="hidden lg:block w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Expert AI Coach</h3>
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showAdvancedSearch ? 'Hide Search' : 'Show Search'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Professional business consultant</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {showAdvancedSearch ? (
              <AdvancedSearchPanel
                onSearch={handleSearch}
                onResultSelect={handleResultSelect}
                searchResults={searchResults}
                isLoading={isSearching}
                currentQuery={searchQuery}
              />
            ) : (
              <div className="p-4 space-y-4">
                {/* Route Extras Panel */}
                <RouteExtrasPanel
                  planType={currentAnswers.plan_type || 'custom'}
                  selectedRoute={selectedProgram?.type}
                  selectedProgram={selectedProgram}
                />
                
                {/* Programs Sidebar */}
                {programs.length > 0 && (
                  <SidebarPrograms
                    programs={programs}
                    selectedProgram={selectedProgram}
                    onProgramSelect={handleProgramSelect}
                    onAdoptTemplate={handleAdoptTemplate}
                  />
                )}
                
                {/* AI Chat */}
                <AIChat
                  onInsertContent={(content) => {
                    // Insert content into current block
                    console.log("Insert content:", content);
                  }}
                  currentSection={sections[activeSection]?.title || "Current Section"}
                  persona={persona}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {showAISidebar && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowAISidebar(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Expert AI Coach</h3>
                <button
                  onClick={() => setShowAISidebar(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Professional business consultant</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {showAdvancedSearch ? (
                <AdvancedSearchPanel
                  onSearch={handleSearch}
                  onResultSelect={handleResultSelect}
                  searchResults={searchResults}
                  isLoading={isSearching}
                  currentQuery={searchQuery}
                />
              ) : (
                <div className="space-y-4">
                  {/* Route Extras Panel */}
                  <RouteExtrasPanel
                    planType={currentAnswers.plan_type || 'custom'}
                    selectedRoute={selectedProgram?.type}
                    selectedProgram={selectedProgram}
                  />
                  
                  {/* Programs Sidebar */}
                  {programs.length > 0 && (
                    <SidebarPrograms
                      programs={programs}
                      selectedProgram={selectedProgram}
                      onProgramSelect={handleProgramSelect}
                      onAdoptTemplate={handleAdoptTemplate}
                    />
                  )}
                  
                  {/* AI Chat */}
                  <AIChat
                    onInsertContent={(content) => {
                      console.log("Insert content:", content);
                    }}
                    currentSection={sections[activeSection]?.title || "Current Section"}
                    persona={persona}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Drawer */}
      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title="How the Unified Editor Works"
        content={
          <div className="space-y-4">
            <p>
              The unified editor provides a single workspace for creating your business plan with 
              intelligent guidance and program-specific recommendations.
            </p>
            
            <h3 className="font-semibold">Key Features:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Block-based editing:</strong> Create rich documents with text, tables, charts, and more</li>
              <li><strong>Program awareness:</strong> Get tailored recommendations based on your funding needs</li>
              <li><strong>AI assistance:</strong> Get help writing and improving your content</li>
              <li><strong>Real-time guidance:</strong> See eligibility requirements and improvement suggestions</li>
            </ul>

            <h3 className="font-semibold">Getting Started:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Complete the quick setup questions</li>
              <li>Review recommended funding programs</li>
              <li>Start building your plan with blocks</li>
              <li>Use AI assistance for content generation</li>
            </ol>
          </div>
        }
      />
    </div>
  );
}

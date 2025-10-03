/**
 * Unified Editor Component
 * Integrates BlockEditor with program-aware sidebar and inline setup
 * Provides single workspace experience with all editor features
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import BlockEditor, { Block } from './BlockEditor';
import SidebarPrograms from './SidebarPrograms';
import InlineSetupBar from './InlineSetupBar';
import ProductSelector from './ProductSelector';
import AIChat from '@/components/plan/AIChat';
import AdvancedSearchPanel from './AdvancedSearchPanel';
import InfoDrawer from '@/components/common/InfoDrawer';
import RouteExtrasPanel from './RouteExtrasPanel';
import RequirementsChecker from './RequirementsChecker';
import SectionGuidance from './SectionGuidance';
import FinancialDashboard from './FinancialDashboard';
import SimplifiedNavigation from './SimplifiedNavigation';
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
  const [showSectionGuidance, setShowSectionGuidance] = useState(false);
  const [showFinancialDashboard, setShowFinancialDashboard] = useState(false);
  
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
        await generateInitialBlocks(userAnswers);
      }

      // Track editor start
      analytics.trackEditorStart("unified_editor", program?.id);
    } catch (error) {
      console.error('Error initializing editor:', error);
    }
  };


  const generateInitialBlocks = async (answers: Record<string, any>) => {
    const initialBlocks: Block[] = [];

    try {
      // Use AI helper for better content generation
      const { AIHelper } = await import('@/lib/aiHelper');
      const aiHelper = new AIHelper({
        maxWords: 200,
        sectionScope: 'general',
        programHints: selectedProgram ? { [selectedProgram.type]: selectedProgram } : {},
        userAnswers: answers,
        tone: 'neutral',
        language: 'en'
      });

      // Executive Summary block with AI enhancement
      if (answers.business_name || answers.business_description) {
        const execSummaryContent = selectedProgram 
          ? await generateProgramAwareContent('executive_summary', answers, selectedProgram, aiHelper)
          : generateExecutiveSummary(answers);
        
        initialBlocks.push({
          id: `block_${Date.now()}_exec_summary`,
          type: 'text',
          data: {
            content: execSummaryContent,
            title: 'Executive Summary'
          },
          order: 0
        });
      }

      // Business Description block with AI enhancement
      if (answers.business_description) {
        const businessDescContent = selectedProgram 
          ? await generateProgramAwareContent('business_description', answers, selectedProgram, aiHelper)
          : answers.business_description;
        
        initialBlocks.push({
          id: `block_${Date.now()}_business_desc`,
          type: 'text',
          data: {
            content: businessDescContent,
            title: 'Business Description'
          },
          order: 1
        });
      }

      // Market Analysis block with AI enhancement
      if (answers.target_market) {
        const marketContent = selectedProgram 
          ? await generateProgramAwareContent('market_analysis', answers, selectedProgram, aiHelper)
          : answers.target_market;
        
        initialBlocks.push({
          id: `block_${Date.now()}_market`,
          type: 'text',
          data: {
            content: marketContent,
            title: 'Market Analysis'
          },
          order: 2
        });
      }

      // Financial Projections block with AI enhancement
      if (answers.funding_amount) {
        const financialContent = selectedProgram 
          ? await generateProgramAwareContent('financial_projections', answers, selectedProgram, aiHelper)
          : generateFinancialSection(answers);
        
        initialBlocks.push({
          id: `block_${Date.now()}_financials`,
          type: 'text',
          data: {
            content: financialContent,
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

      // Add program-specific blocks if program is selected
      if (selectedProgram) {
        await addProgramSpecificBlocks(initialBlocks, answers, selectedProgram, aiHelper);
      }

      setBlocks(initialBlocks);
    } catch (error) {
      console.error('Error generating initial blocks:', error);
      // Fallback to basic generation
      generateBasicInitialBlocks(answers, initialBlocks);
      setBlocks(initialBlocks);
    }
  };

  const generateProgramAwareContent = async (section: string, answers: Record<string, any>, program: any, aiHelper: any) => {
    try {
      const response = await aiHelper.generateSectionContent(section, answers.business_description || '', program);
      return response.content;
    } catch (error) {
      console.error(`Error generating ${section} content:`, error);
      return generateBasicContent(section, answers);
    }
  };

  const addProgramSpecificBlocks = async (blocks: Block[], answers: Record<string, any>, program: any, _aiHelper: any) => {
    // Add program-specific requirements block
    if (program.requirements && program.requirements.length > 0) {
      const requirementsContent = `## Program Requirements\n\nThis application addresses the following requirements for ${program.name}:\n\n${program.requirements.map((req: string) => `• ${req}`).join('\n')}\n\n### Eligibility Criteria\n\n${program.eligibility ? program.eligibility.map((el: string) => `• ${el}`).join('\n') : 'Please verify eligibility requirements.'}`;
      
      blocks.push({
        id: `block_${Date.now()}_requirements`,
        type: 'text',
        data: {
          content: requirementsContent,
          title: 'Program Requirements & Eligibility'
        },
        order: blocks.length
      });
    }

    // Add program-specific financial details if it's a grant
    if (program.type === 'grant' && answers.funding_amount) {
      const grantFinancials = `## Grant Financial Details\n\n**Requested Amount:** ${answers.funding_amount}\n**Program:** ${program.name}\n**Grant Type:** ${program.type}\n\n### Use of Funds\n\n${answers.use_of_funds || 'Please specify how the grant will be used.'}\n\n### Matching Funds\n\n${answers.matching_funds || 'Please specify any matching funds or co-financing.'}`;
      
      blocks.push({
        id: `block_${Date.now()}_grant_financials`,
        type: 'text',
        data: {
          content: grantFinancials,
          title: 'Grant Financial Details'
        },
        order: blocks.length
      });
    }
  };

  const generateBasicInitialBlocks = (answers: Record<string, any>, blocks: Block[]) => {
    // Executive Summary block
    if (answers.business_name || answers.business_description) {
      blocks.push({
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
      blocks.push({
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
      blocks.push({
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
      blocks.push({
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
      blocks.push({
        id: `block_${Date.now()}_timeline`,
        type: 'text',
        data: {
          content: generateTimelineSection(answers),
          title: 'Implementation Timeline'
        },
        order: 4
      });
    }
  };

  const generateBasicContent = (section: string, answers: Record<string, any>) => {
    switch (section) {
      case 'executive_summary':
        return generateExecutiveSummary(answers);
      case 'business_description':
        return answers.business_description || '';
      case 'market_analysis':
        return answers.target_market || '';
      case 'financial_projections':
        return generateFinancialSection(answers);
      default:
        return '';
    }
  };

  const getPlanContent = () => {
    const content: Record<string, any> = {};
    
    // Extract content from blocks
    blocks.forEach(block => {
      if (block.type === 'text' && block.data?.content) {
        const section = block.data.title?.toLowerCase().replace(/\s+/g, '_') || 'general';
        content[section] = block.data.content;
      }
    });

    // Add section content
    sections.forEach(section => {
      if (section.content) {
        content[section.title.toLowerCase().replace(/\s+/g, '_')] = section.content;
      }
    });

    return content;
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
      const results = await scoreProgramsEnhanced(currentAnswers, "strict");
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
      const results = await scoreProgramsEnhanced(currentAnswers, "explorer");
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

          {/* Simplified Navigation */}
          <SimplifiedNavigation
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onSave={() => handleSave(blocks)}
            onExport={() => handleExport('pdf')}
            onPreview={() => {
              // Open preview in new tab
              window.open('/preview', '_blank');
            }}
            onSettings={() => {
              // Open settings modal or panel
              console.log('Open settings');
            }}
            completionPercentage={getCompletionPercentage()}
            isDirty={false} // TODO: Track dirty state
          />

          {/* Quick Actions Bar */}
          <div className="bg-white py-3 px-4 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Business Plan Editor</h1>
                <p className="text-sm text-gray-600">
                  {selectedProgram ? `Tailored for ${selectedProgram.name}` : 'Create your business plan'}
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowFinancialDashboard(!showFinancialDashboard)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      showFinancialDashboard 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    💰
                  </button>
                  <button
                    onClick={() => setShowSectionGuidance(!showSectionGuidance)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      showSectionGuidance 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    📚
                  </button>
                  <button
                    onClick={() => setShowAISidebar(!showAISidebar)}
                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                  >
                    🤖
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Dashboard Panel */}
          {showFinancialDashboard && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <FinancialDashboard
                businessType={selectedProgram?.type || 'saas'}
                initialAssumptions={{
                  fundingAmount: currentAnswers.funding_amount || 500000,
                  initialRevenue: currentAnswers.initial_revenue || 5000,
                  monthlyGrowthRate: currentAnswers.monthly_growth_rate || 15
                }}
                onAssumptionsChange={(assumptions) => {
                  // Update assumptions in current answers
                  setCurrentAnswers(prev => ({
                    ...prev,
                    funding_amount: assumptions.fundingAmount,
                    initial_revenue: assumptions.initialRevenue,
                    monthly_growth_rate: assumptions.monthlyGrowthRate
                  }));
                }}
                onExport={(data) => {
                  // Export financial data
                  console.log("Export financial data:", data);
                }}
              />
            </div>
          )}

          {/* Section Guidance Panel */}
          {showSectionGuidance && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <SectionGuidance
                section={sections[activeSection]?.title || "Current Section"}
                programType={selectedProgram?.type}
                onInsertTemplate={(template) => {
                  // Insert template into current section
                  console.log("Insert template:", template);
                }}
                onShowExamples={() => {
                  // Show examples modal or navigate to examples
                  console.log("Show examples");
                }}
              />
            </div>
          )}

          {/* Block Editor */}
          <div className="flex-1">
            <BlockEditor
              initialBlocks={blocks}
              onBlocksChange={handleBlocksChange}
              onSave={() => handleSave(blocks)}
              onExport={() => handleExport('pdf')}
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
                {/* Requirements Checker */}
                {selectedProgram && (
                  <RequirementsChecker
                    programType={selectedProgram.type}
                    planContent={getPlanContent()}
                    onRequirementClick={(section, _requirement) => {
                      // Navigate to specific section and highlight requirement
                      const sectionIndex = sections.findIndex(s => s.title.toLowerCase().includes(section));
                      if (sectionIndex !== -1) {
                        setActiveSection(sectionIndex);
                      }
                    }}
                  />
                )}
                
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
                  {/* Requirements Checker */}
                  {selectedProgram && (
                    <RequirementsChecker
                      programType={selectedProgram.type}
                      planContent={getPlanContent()}
                      onRequirementClick={(section, _requirement) => {
                        // Navigate to specific section and highlight requirement
                        const sectionIndex = sections.findIndex(s => s.title.toLowerCase().includes(section));
                        if (sectionIndex !== -1) {
                          setActiveSection(sectionIndex);
                        }
                        setShowAISidebar(false); // Close mobile sidebar
                      }}
                    />
                  )}
                  
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

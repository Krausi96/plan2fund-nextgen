import React, { useState } from 'react';
import { useEditorStore, useConfiguratorState, mergeUploadedContentWithSpecialSections } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type SimulationType = 'programFinder' | 'templateUpload' | 'badTemplateUpload' | 'recoWizard' | 'urlParsing' | 'freeOption' | 'debugCanonicalOrdering' | 'strategyTemplateUpload' | 'businessModelCanvas';

interface SimulationResult {
  type: SimulationType;
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  timestamp: Date;
  details?: any;
}

export function FlowSimulator() {
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationType>('programFinder');
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Access editor store actions for simulation
  const setProgramProfile = useEditorStore((state) => state.setProgramProfile);
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  const setInferredProductType = useEditorStore((state) => state.setInferredProductType);
  
  // Access configurator state for updating program summary
  const configuratorActions = useConfiguratorState().actions;
  
  const { t } = useI18n();
  
  const addResult = (result: Omit<SimulationResult, 'timestamp'>) => {
    setResults(prev => [
      {
        ...result,
        timestamp: new Date()
      },
      ...prev.slice(0, 9) // Keep only last 10 results
    ]);
  };
  
  const simulateProgramFinder = async () => {
    setIsRunning(true);
    addResult({ type: 'programFinder', status: 'running', message: 'Starting program finder simulation with comprehensive test cases...' });
    
    try {
      // Import the required functions to process application requirements
      const { normalizeFundingProgram, generateDocumentStructureFromProfile } = await import('@/features/editor/lib');
      
      // Simulate program selection
      const mockProgram = {
        id: 'test-program-123',
        name: 'Test Funding Program',
        provider: 'Test Provider',
        region: 'Test Region',
        fundingTypes: ['grant', 'loan'],
        amountRange: { min: 10000, max: 100000, currency: 'EUR' },
        useOfFunds: ['Research', 'Development', 'Marketing'],
        coFinancingRequired: true,
        coFinancingPercentage: 25,
        focusAreas: ['Technology', 'Innovation', 'Sustainability'],
        deliverables: ['Report', 'Prototype', 'Demo'],
        requirements: ['Budget Plan', 'Timeline', 'Market Analysis', 'Team Qualifications'],
        formattingRules: { length: { minPages: 10, maxPages: 50 }, language: ['de', 'en'] },
        evidenceRequired: ['Financial Statements', 'Tax Returns', 'Business License'],
        applicationRequirements: {
          documents: [
            { document_name: 'Application Form', required: true, format: 'pdf', authority: 'provider', reuseable: false },
            { document_name: 'Financial Statements', required: true, format: 'pdf', authority: 'authority', reuseable: true },
            { document_name: 'Business Plan', required: true, format: 'docx', authority: 'applicant', reuseable: false }
          ],
          sections: [
            { title: 'Project Description', subsections: [{ title: 'Objectives', required: true }, { title: 'Scope', required: true }] },
            { title: 'Market Analysis', subsections: [{ title: 'Competitors', required: true }, { title: 'Target Customers', required: true }] },
            { title: 'Financial Plan', subsections: [{ title: 'Revenue Model', required: true }, { title: 'Cost Structure', required: true }] },
            { title: 'Team Structure', subsections: [{ title: 'Management Team', required: true }, { title: 'Advisors', required: true }] },
            { title: 'Risk Assessment', subsections: [{ title: 'Market Risks', required: true }, { title: 'Technical Risks', required: true }] },
            { title: 'Marketing', subsections: [{ title: 'Strategy', required: true }, { title: 'Channels', required: true }] },
            { title: 'Finance', subsections: [{ title: 'Budget', required: true }, { title: 'Projections', required: true }] },
            { title: 'Meilensteine', subsections: [{ title: 'Phase 1', required: true }, { title: 'Phase 2', required: true }] }, // German
            { title: 'Gestion', subsections: [{ title: 'Leadership', required: true }, { title: 'Structure', required: true }] }  // French
          ],
          financialRequirements: {
            financial_statements_required: ['Balance Sheet', 'Income Statement', 'Cash Flow Statement']
          }
        }
      };
      
      // Update store with program data
      setProgramProfile(mockProgram);
      
      // Use the same pipeline as the real ProgramFinder to process application requirements
      const fundingProgram = normalizeFundingProgram(mockProgram);
      const documentStructure = generateDocumentStructureFromProfile(fundingProgram);
      
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: [],
        missingFields: [],
        confidence: 90
      });
      setInferredProductType('submission');
      
      // Update configurator state to ensure ProgramSummaryPanel shows the program
      configuratorActions.setProgramSummary({
        id: mockProgram.id,
        name: mockProgram.name,
        type: mockProgram.fundingTypes[0] || 'grant',
        organization: mockProgram.provider,
        setupStatus: 'draft' as const,
        application_requirements: mockProgram.applicationRequirements
      });
      
      addResult({ 
        type: 'programFinder', 
        status: 'success', 
        message: 'Program finder simulation completed successfully',
        details: { program: mockProgram.name, sections: documentStructure.sections.length }
      });
    } catch (error) {
      addResult({ 
        type: 'programFinder', 
        status: 'error', 
        message: `Program finder simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateTemplateUpload = async () => {
    setIsRunning(true);
    addResult({ type: 'templateUpload', status: 'running', message: 'Starting template upload simulation with comprehensive test cases...' });
    
    try {
      // Simulate file upload
      const mockFile = {
        name: 'sample_business_plan.docx',
        size: 2457600, // 2.4 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      // Simulate extracted content from the document with good examples
      const extractedContent = {
        title: 'Sample Business Plan',
        sections: [
          { 
            title: 'Title Page', 
            content: 'Business Plan Title Page with company details...', 
            type: 'metadata' 
          },
          { 
            title: 'Table of Contents', 
            content: 'Table of contents with page numbers...', 
            type: 'ancillary' 
          },
          { 
            title: 'Executive Summary', 
            content: 'This is the executive summary...', 
            type: 'executive_summary',
            rawSubsections: [
              { id: 'exec_sum_intro', title: 'Introduction', content: 'Brief introduction to the summary' },
              { id: 'exec_sum_goals', title: 'Goals and Objectives', content: 'Key goals and objectives' },
              { id: 'exec_sum_financial', title: 'Financial Highlights', content: 'Key financial highlights' },
              { id: 'exec_sum_conclusion', title: 'Conclusion', content: 'Concluding remarks' }
            ]
          },
          { 
            title: 'Company Overview', 
            content: 'About our company...', 
            type: 'company_description',
            rawSubsections: [
              { id: 'comp_overview_history', title: 'Company History', content: 'History of the company' },
              { id: 'comp_overview_mission', title: 'Mission Statement', content: 'Company mission' },
              { id: 'comp_overview_vision', title: 'Vision Statement', content: 'Company vision' }
            ]
          },
          { 
            title: 'Market Analysis', 
            content: 'Market trends and analysis...', 
            type: 'market_analysis',
            rawSubsections: [
              { id: 'market_size', title: 'Market Size', content: 'Total addressable market' },
              { id: 'market_growth', title: 'Growth Trends', content: 'Growth projections' },
              { id: 'market_competition', title: 'Competitive Landscape', content: 'Analysis of competitors' },
              { id: 'market_opportunities', title: 'Opportunities', content: 'Market opportunities' }
            ]
          },
          { 
            title: 'Financial Plan', 
            content: 'Financial projections...', 
            type: 'financial_plan',
            rawSubsections: [
              { id: 'fin_proj_revenue', title: 'Revenue Projections', content: 'Projected revenue streams' },
              { id: 'fin_proj_costs', title: 'Cost Structure', content: 'Projected costs' },
              { id: 'fin_proj_cashflow', title: 'Cash Flow Analysis', content: 'Cash flow projections' },
              { id: 'fin_proj_roi', title: 'ROI Analysis', content: 'Return on investment analysis' }
            ]
          },
          { 
            title: 'Team Structure', 
            content: 'Our team members...', 
            type: 'team_qualifications',
            rawSubsections: [
              { id: 'team_founders', title: 'Founder Profiles', content: 'Profiles of founders' },
              { id: 'team_advisors', title: 'Advisory Board', content: 'Advisor profiles' },
              { id: 'team_structure', title: 'Organizational Structure', content: 'Team organization' }
            ]
          },
          { 
            title: 'Risk Assessment', 
            content: 'Assessment of potential risks...', 
            type: 'risk_assessment',
            rawSubsections: [
              { id: 'risk_market', title: 'Market Risks', content: 'Risks related to market' },
              { id: 'risk_financial', title: 'Financial Risks', content: 'Financial risks' },
              { id: 'risk_operational', title: 'Operational Risks', content: 'Operational risks' }
            ]
          },
          { 
            title: 'Go-to-Market Strategy', 
            content: 'Market entry strategy...', 
            type: 'go_to_market_strategy',
            rawSubsections: [
              { id: 'gtm_channels', title: 'Distribution Channels', content: 'Channel strategy' },
              { id: 'gtm_marketing', title: 'Marketing Strategy', content: 'Marketing approach' },
              { id: 'gtm_sales', title: 'Sales Strategy', content: 'Sales approach' }
            ]
          },
          { 
            title: 'Unit Economics', 
            content: 'Economic model analysis...', 
            type: 'unit_economics',
            rawSubsections: [
              { id: 'unit_rev_model', title: 'Revenue Model', content: 'Revenue model explanation' },
              { id: 'unit_cost_struct', title: 'Cost Structure', content: 'Cost structure details' },
              { id: 'unit_profit', title: 'Profitability Analysis', content: 'Profitability calculations' }
            ]
          },
          { 
            title: 'Milestones', 
            content: 'Project milestones and next steps...', 
            type: 'milestones_next_steps',
            rawSubsections: [
              { id: 'milestone_q1', title: 'Q1 Goals', content: 'First quarter goals' },
              { id: 'milestone_q2', title: 'Q2 Goals', content: 'Second quarter goals' },
              { id: 'milestone_q3', title: 'Q3 Goals', content: 'Third quarter goals' },
              { id: 'milestone_q4', title: 'Q4 Goals', content: 'Fourth quarter goals' }
            ]
          },
          { 
            title: 'Business Model Canvas', 
            content: 'Business model visualization...', 
            type: 'business_model_canvas',
            rawSubsections: [
              { id: 'canvas_cust_seg', title: 'Customer Segments', content: 'Customer segment analysis' },
              { id: 'canvas_val_prop', title: 'Value Propositions', content: 'Value proposition details' },
              { id: 'canvas_key_act', title: 'Key Activities', content: 'Key business activities' }
            ]
          },
          { 
            title: 'Tables and Data', 
            content: 'Detailed financial tables and data...', 
            type: 'tables_data' 
          },
          { 
            title: 'Figures and Images', 
            content: 'Charts and graphs...', 
            type: 'figures_images' 
          },
          { 
            title: 'References', 
            content: 'Sources and references used...', 
            type: 'references' 
          },
          { 
            title: 'Appendices', 
            content: 'Additional supporting materials...', 
            type: 'appendices' 
          }
        ],
        hasTitlePage: true,
        hasTOC: true,
        totalPages: 45,
        wordCount: 12000
      };
      
      // Use the unified function to merge uploaded content with special sections
      const finalStructure = mergeUploadedContentWithSpecialSections(extractedContent, null, t as (key: string) => string);
      
      setDocumentStructure(finalStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: finalStructure.warnings,
        missingFields: [],
        confidence: finalStructure.confidenceScore
      });
      
      // Update configurator state to reflect template upload
      configuratorActions.setProgramSummary({
        id: 'template-upload-' + Date.now(),
        name: 'Template Upload',
        type: 'template',
        organization: 'Local File',
        setupStatus: 'draft' as const
      });
      
      // Count special sections in the final structure
      const specialSectionsAdded = finalStructure.sections.filter((s: any) => ['metadata', 'ancillary', 'references', 'appendices', 'tables_data', 'figures_images'].includes(s.id)).length;
      
      addResult({ 
        type: 'templateUpload', 
        status: 'success', 
        message: 'Template upload simulation completed with unified merge flow',
        details: { 
          fileName: mockFile.name, 
          fileSize: `${(mockFile.size / 1024 / 1024).toFixed(1)} MB`, 
          sections: finalStructure.sections.length,
          specialSectionsAdded: specialSectionsAdded,
          source: finalStructure.source
        }
      });
    } catch (error) {
      addResult({ 
        type: 'templateUpload', 
        status: 'error', 
        message: `Template upload simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateStrategyTemplateUpload = async () => {
    setIsRunning(true);
    addResult({ type: 'strategyTemplateUpload', status: 'running', message: 'Starting strategy document template upload simulation...' });
    
    try {
      // Simulate strategy document file upload
      const mockFile = {
        name: 'strategy_document.docx',
        size: 1843200, // 1.8 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      // Simulate extracted content from a strategy document
      const extractedContent = {
        title: 'Corporate Strategy Document',
        sections: [
          { 
            title: 'Executive Summary', 
            content: 'Strategic overview and key initiatives...', 
            type: 'executive_summary',
            rawSubsections: [
              { id: 'strat_exec_overview', title: 'Strategic Overview', content: 'High-level strategic overview' },
              { id: 'strat_exec_initiatives', title: 'Key Initiatives', content: 'Major strategic initiatives' },
              { id: 'strat_exec_benefits', title: 'Expected Benefits', content: 'Anticipated benefits from strategy' }
            ]
          },
          { 
            title: 'Strategic Vision', 
            content: 'Company vision and mission alignment...', 
            type: 'strategic_vision',
            rawSubsections: [
              { id: 'strat_vision_mission', title: 'Mission Alignment', content: 'Alignment with company mission' },
              { id: 'strat_vision_goals', title: 'Strategic Goals', content: 'Long-term strategic goals' },
              { id: 'strat_vision_objectives', title: 'Strategic Objectives', content: 'Specific strategic objectives' }
            ]
          },
          { 
            title: 'Market Positioning', 
            content: 'Market positioning and competitive advantage...', 
            type: 'market_positioning',
            rawSubsections: [
              { id: 'strat_market_analysis', title: 'Market Analysis', content: 'Analysis of market positioning' },
              { id: 'strat_competitive_adv', title: 'Competitive Advantages', content: 'Key competitive advantages' },
              { id: 'strat_differentiators', title: 'Differentiators', content: 'Market differentiation factors' }
            ]
          },
          { 
            title: 'SWOT Analysis', 
            content: 'Strengths, weaknesses, opportunities, threats...', 
            type: 'swot_analysis',
            rawSubsections: [
              { id: 'strat_swot_strengths', title: 'Strengths', content: 'Internal strengths' },
              { id: 'strat_swot_weaknesses', title: 'Weaknesses', content: 'Internal weaknesses' },
              { id: 'strat_swot_opportunities', title: 'Opportunities', content: 'External opportunities' },
              { id: 'strat_swot_threats', title: 'Threats', content: 'External threats' }
            ]
          },
          { 
            title: 'Implementation Roadmap', 
            content: 'Strategy implementation plan...', 
            type: 'implementation_roadmap',
            rawSubsections: [
              { id: 'strat_impl_phase1', title: 'Phase 1: Foundation', content: 'Foundation building phase' },
              { id: 'strat_impl_phase2', title: 'Phase 2: Growth', content: 'Growth and expansion phase' },
              { id: 'strat_impl_phase3', title: 'Phase 3: Optimization', content: 'Optimization and scaling phase' }
            ]
          },
          { 
            title: 'Resource Allocation', 
            content: 'Resources required for strategy execution...', 
            type: 'resource_allocation',
            rawSubsections: [
              { id: 'strat_res_budget', title: 'Budget Allocation', content: 'Financial resource allocation' },
              { id: 'strat_res_team', title: 'Team Resources', content: 'Human resource allocation' },
              { id: 'strat_res_infrastructure', title: 'Infrastructure', content: 'Infrastructure investments' }
            ]
          },
          { 
            title: 'Risk Management', 
            content: 'Risk mitigation strategies...', 
            type: 'risk_management',
            rawSubsections: [
              { id: 'strat_risk_identification', title: 'Risk Identification', content: 'Identified strategic risks' },
              { id: 'strat_risk_mitigation', title: 'Mitigation Strategies', content: 'Risk mitigation approaches' },
              { id: 'strat_risk_monitoring', title: 'Monitoring Plan', content: 'Risk monitoring procedures' }
            ]
          },
          { 
            title: 'Performance Metrics', 
            content: 'KPIs and success metrics...', 
            type: 'performance_metrics',
            rawSubsections: [
              { id: 'strat_kpi_financial', title: 'Financial KPIs', content: 'Financial performance indicators' },
              { id: 'strat_kpi_operational', title: 'Operational KPIs', content: 'Operational performance indicators' },
              { id: 'strat_kpi_strategic', title: 'Strategic KPIs', content: 'Strategic performance indicators' }
            ]
          },
          { 
            title: 'Stakeholder Engagement', 
            content: 'Engagement strategy for stakeholders...', 
            type: 'stakeholder_engagement',
            rawSubsections: [
              { id: 'strat_stakeholders_internal', title: 'Internal Stakeholders', content: 'Engagement of internal stakeholders' },
              { id: 'strat_stakeholders_external', title: 'External Stakeholders', content: 'Engagement of external stakeholders' },
              { id: 'strat_communication_plan', title: 'Communication Plan', content: 'Stakeholder communication approach' }
            ]
          },
          { 
            title: 'Change Management', 
            content: 'Change management framework...', 
            type: 'change_management',
            rawSubsections: [
              { id: 'strat_change_process', title: 'Change Process', content: 'Process for managing change' },
              { id: 'strat_change_training', title: 'Training Programs', content: 'Training for change implementation' },
              { id: 'strat_change_support', title: 'Support Systems', content: 'Support systems for change' }
            ]
          },
          { 
            title: 'References', 
            content: 'Sources and references used...', 
            type: 'references' 
          },
          { 
            title: 'Appendices', 
            content: 'Additional supporting materials...', 
            type: 'appendices' 
          }
        ],
        hasTitlePage: true,
        hasTOC: true,
        totalPages: 32,
        wordCount: 8500
      };
      
      // Use the unified function to merge uploaded content with special sections
      const finalStructure = mergeUploadedContentWithSpecialSections(extractedContent, null, t as (key: string) => string);
      
      setDocumentStructure(finalStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: finalStructure.warnings,
        missingFields: [],
        confidence: finalStructure.confidenceScore
      });
      
      // Update configurator state to reflect strategy template upload
      configuratorActions.setProgramSummary({
        id: 'strategy-template-upload-' + Date.now(),
        name: 'Strategy Template Upload',
        type: 'template',
        organization: 'Local File',
        setupStatus: 'draft' as const
      });
      
      addResult({ 
        type: 'strategyTemplateUpload', 
        status: 'success', 
        message: 'Strategy document template upload simulation completed',
        details: { 
          fileName: mockFile.name, 
          fileSize: `${(mockFile.size / 1024 / 1024).toFixed(1)} MB`, 
          sections: finalStructure.sections.length,
          source: finalStructure.source
        }
      });
    } catch (error) {
      addResult({ 
        type: 'strategyTemplateUpload', 
        status: 'error', 
        message: `Strategy template upload simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateBusinessModelCanvas = async () => {
    setIsRunning(true);
    addResult({ type: 'businessModelCanvas', status: 'running', message: 'Starting business model canvas template upload simulation...' });
    
    try {
      // Simulate business model canvas file upload
      const mockFile = {
        name: 'business_model_canvas.docx',
        size: 1228800, // 1.2 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      // Simulate extracted content from a business model canvas document
      const extractedContent = {
        title: 'Business Model Canvas',
        sections: [
          { 
            title: 'Value Propositions', 
            content: 'Value propositions for customers...', 
            type: 'value_propositions',
            rawSubsections: [
              { id: 'canvas_vp_product', title: 'Product Value', content: 'Value provided by products' },
              { id: 'canvas_vp_service', title: 'Service Value', content: 'Value provided by services' },
              { id: 'canvas_vp_solution', title: 'Solution Value', content: 'Value of overall solution' }
            ]
          },
          { 
            title: 'Customer Segments', 
            content: 'Target customer segments...', 
            type: 'customer_segments',
            rawSubsections: [
              { id: 'canvas_cs_mass', title: 'Mass Market', content: 'Mass market segment' },
              { id: 'canvas_cs_niche', title: 'Niche Market', content: 'Niche market segment' },
              { id: 'canvas_cs_multi', title: 'Multi-sided Platform', content: 'Multi-sided platform segments' }
            ]
          },
          { 
            title: 'Channels', 
            content: 'Distribution channels...', 
            type: 'channels',
            rawSubsections: [
              { id: 'canvas_ch_direct', title: 'Direct Channels', content: 'Direct sales channels' },
              { id: 'canvas_ch_partner', title: 'Partner Channels', content: 'Partner distribution channels' },
              { id: 'canvas_ch_online', title: 'Online Channels', content: 'Online distribution channels' }
            ]
          },
          { 
            title: 'Customer Relationships', 
            content: 'Customer relationship types...', 
            type: 'customer_relationships',
            rawSubsections: [
              { id: 'canvas_cr_personal', title: 'Personal Assistance', content: 'Personal assistance relationships' },
              { id: 'canvas_cr_self_service', title: 'Self Service', content: 'Self-service relationships' },
              { id: 'canvas_cr_automated', title: 'Automated Services', content: 'Automated service relationships' }
            ]
          },
          { 
            title: 'Revenue Streams', 
            content: 'Revenue stream types...', 
            type: 'revenue_streams',
            rawSubsections: [
              { id: 'canvas_rs_asset_sale', title: 'Asset Sales', content: 'Revenue from asset sales' },
              { id: 'canvas_rs_usage_fee', title: 'Usage Fees', content: 'Revenue from usage fees' },
              { id: 'canvas_rs_subscription', title: 'Subscriptions', content: 'Subscription revenue' }
            ]
          },
          { 
            title: 'Key Resources', 
            content: 'Key resources required...', 
            type: 'key_resources',
            rawSubsections: [
              { id: 'canvas_kr_physical', title: 'Physical Resources', content: 'Physical key resources' },
              { id: 'canvas_kr_intellectual', title: 'Intellectual Property', content: 'Intellectual property resources' },
              { id: 'canvas_kr_human', title: 'Human Resources', content: 'Human key resources' }
            ]
          },
          { 
            title: 'Key Activities', 
            content: 'Key activities to execute...', 
            type: 'key_activities',
            rawSubsections: [
              { id: 'canvas_ka_production', title: 'Production Activities', content: 'Production-related activities' },
              { id: 'canvas_ka_problem_solving', title: 'Problem Solving', content: 'Problem-solving activities' },
              { id: 'canvas_ka_platform', title: 'Platform/Network', content: 'Platform/network activities' }
            ]
          },
          { 
            title: 'Key Partnerships', 
            content: 'Key partnerships and suppliers...', 
            type: 'key_partnerships',
            rawSubsections: [
              { id: 'canvas_kp_suppliers', title: 'Suppliers', content: 'Key suppliers' },
              { id: 'canvas_kp_strategic', title: 'Strategic Partners', content: 'Strategic partnerships' },
              { id: 'canvas_kp_jv', title: 'Joint Ventures', content: 'Joint venture partners' }
            ]
          },
          { 
            title: 'Cost Structure', 
            content: 'Overall cost structure...', 
            type: 'cost_structure',
            rawSubsections: [
              { id: 'canvas_cs_fixed', title: 'Fixed Costs', content: 'Fixed operational costs' },
              { id: 'canvas_cs_variable', title: 'Variable Costs', content: 'Variable operational costs' },
              { id: 'canvas_cs_economies', title: 'Economies of Scale', content: 'Economies of scale effects' }
            ]
          },
          { 
            title: 'Business Model Analysis', 
            content: 'Analysis of the business model...', 
            type: 'business_model_analysis',
            rawSubsections: [
              { id: 'canvas_analysis_feasibility', title: 'Feasibility Analysis', content: 'Analysis of business model feasibility' },
              { id: 'canvas_analysis_risks', title: 'Risk Assessment', content: 'Risk assessment for business model' },
              { id: 'canvas_analysis_opportunities', title: 'Opportunity Evaluation', content: 'Evaluation of opportunities' }
            ]
          },
          { 
            title: 'Implementation Plan', 
            content: 'Plan for implementing the business model...', 
            type: 'implementation_plan',
            rawSubsections: [
              { id: 'canvas_impl_timeline', title: 'Timeline', content: 'Implementation timeline' },
              { id: 'canvas_impl_resources', title: 'Resource Requirements', content: 'Resource requirements for implementation' },
              { id: 'canvas_impl_milestones', title: 'Milestones', content: 'Key implementation milestones' }
            ]
          },
          { 
            title: 'References', 
            content: 'Sources and references used...', 
            type: 'references' 
          },
          { 
            title: 'Appendices', 
            content: 'Additional supporting materials...', 
            type: 'appendices' 
          }
        ],
        hasTitlePage: true,
        hasTOC: true,
        totalPages: 24,
        wordCount: 6200
      };
      
      // Use the unified function to merge uploaded content with special sections
      const finalStructure = mergeUploadedContentWithSpecialSections(extractedContent, null, t as (key: string) => string);
      
      setDocumentStructure(finalStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: finalStructure.warnings,
        missingFields: [],
        confidence: finalStructure.confidenceScore
      });
      
      // Update configurator state to reflect business model canvas upload
      configuratorActions.setProgramSummary({
        id: 'bmc-template-upload-' + Date.now(),
        name: 'Business Model Canvas Upload',
        type: 'template',
        organization: 'Local File',
        setupStatus: 'draft' as const
      });
      
      addResult({ 
        type: 'businessModelCanvas', 
        status: 'success', 
        message: 'Business model canvas template upload simulation completed',
        details: { 
          fileName: mockFile.name, 
          fileSize: `${(mockFile.size / 1024 / 1024).toFixed(1)} MB`, 
          sections: finalStructure.sections.length,
          source: finalStructure.source
        }
      });
    } catch (error) {
      addResult({ 
        type: 'businessModelCanvas', 
        status: 'error', 
        message: `Business model canvas upload simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateBadTemplateUpload = async () => {
    setIsRunning(true);
    addResult({ type: 'badTemplateUpload', status: 'running', message: 'Starting bad template upload simulation with comprehensive bad examples...' });
    
    try {
      // Simulate file upload with problematic data
      const mockFile = {
        name: 'problematic_template.docx',
        size: 102400, // 0.1 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      // Simulate problematic extracted content from the document
      // Including various edge cases
      const extractedContent = {
        title: 'Problematic Business Plan',
        sections: [
          { title: 'Section 1', content: 'Just some random content...', type: 'unknown_type', rawSubsections: [] },
          { title: 'Section 2', content: 'Content with minimal issues', type: 'general', rawSubsections: [] },
          { title: 'Executive Summary', content: 'Executive summary content', type: 'executive_summary', rawSubsections: [] },
          { title: 'Company Overview', content: 'Company overview content', type: 'company_description', rawSubsections: [] },
          { title: 'Market Analysis', content: 'Market analysis content', type: 'market_analysis', rawSubsections: [] },
          { title: 'Financial Plan', content: 'Financial plan content', type: 'financial_plan', rawSubsections: [] },
          // Standard special sections
          { title: 'References', content: 'Some references', type: 'references', rawSubsections: [] },
          { title: 'Appendices', content: 'Some appendices', type: 'appendices', rawSubsections: [] },
          { title: 'Tables and Data', content: 'Table content', type: 'tables_data', rawSubsections: [] },
          { title: 'Figures and Images', content: 'Figure content', type: 'figures_images', rawSubsections: [] }
        ],
        hasTitlePage: true,
        hasTOC: true,
        totalPages: 10,
        wordCount: 2000
      };
      
      // Use the unified function to merge problematic content with special sections
      const finalStructure = mergeUploadedContentWithSpecialSections(extractedContent, null, t as (key: string) => string);
      
      setDocumentStructure(finalStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: finalStructure.warnings,
        missingFields: [],
        confidence: finalStructure.confidenceScore
      });
      
      // Update configurator state to reflect template upload
      configuratorActions.setProgramSummary({
        id: 'template-upload-' + Date.now(),
        name: 'Template Upload',
        type: 'template',
        organization: 'Local File',
        setupStatus: 'draft' as const
      });
      
      // Count special sections in the final structure
      const specialSectionsAdded = finalStructure.sections.filter((s: any) => ['metadata', 'ancillary', 'references', 'appendices', 'tables_data', 'figures_images'].includes(s.id)).length;
      
      addResult({ 
        type: 'badTemplateUpload', 
        status: 'success', 
        message: 'Bad template upload simulation completed - tested comprehensive error handling',
        details: { 
          fileName: mockFile.name, 
          fileSize: `${(mockFile.size / 1024 / 1024).toFixed(1)} MB`, 
          sections: finalStructure.sections.length,
          specialSectionsAdded: specialSectionsAdded,
          source: finalStructure.source,
          confidenceScore: finalStructure.confidenceScore,
          warnings: finalStructure.warnings.length
        }
      });
    } catch (error) {
      addResult({ 
        type: 'badTemplateUpload', 
        status: 'error', 
        message: `Bad template upload simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateRecoWizard = async () => {
    setIsRunning(true);
    addResult({ type: 'recoWizard', status: 'running', message: 'Starting reco wizard simulation with comprehensive test cases...' });
    
    try {
      // Simulate wizard flow
      const mockAnswers = [
        { question: 'What is your project focus?', answer: 'Digital Innovation' },
        { question: 'What funding range are you seeking?', answer: '50k-100k EUR' },
        { question: 'What stage is your project?', answer: 'Early Development' },
        { question: 'What industry?', answer: 'Technology' },
        { question: 'What language?', answer: 'German' },
        { question: 'What type of funding?', answer: 'Grant and Loan' },
        { question: 'What is your primary objective?', answer: 'Market Expansion' },
        { question: 'What markets are you targeting?', answer: 'European and US Markets' },
        { question: 'What is your team size?', answer: '5-10 people' },
        { question: 'What is your timeline?', answer: '12 months' }
      ];
      
      // Generate recommendations
      const mockRecommendations = [
        { id: 'rec1', type: 'document', name: 'Business Plan', priority: 'high' },
        { id: 'rec2', type: 'section', name: 'Market Analysis', priority: 'medium' },
        { id: 'rec3', type: 'requirement', name: 'Financial Projections', priority: 'high' },
        { id: 'rec4', type: 'section', name: 'Executive Summary', priority: 'high' },
        { id: 'rec5', type: 'section', name: 'Company Overview', priority: 'high' },
        { id: 'rec6', type: 'section', name: 'Financial Plan', priority: 'high' },
        { id: 'rec7', type: 'section', name: 'Team Qualifications', priority: 'high' },
        { id: 'rec8', type: 'section', name: 'Risk Assessment', priority: 'medium' },
        { id: 'rec9', type: 'section', name: 'Marketing', priority: 'low' },
        { id: 'rec10', type: 'section', name: 'Finance', priority: 'high' },
        { id: 'rec11', type: 'section', name: 'Meilensteine', priority: 'medium' }, // German
        { id: 'rec12', type: 'section', name: 'Gestion', priority: 'medium' }, // French
        { id: 'rec13', type: 'section', name: 'Risk Management', priority: 'medium' },
        { id: 'rec14', type: 'section', name: 'Marketing Strategy', priority: 'low' },
        { id: 'rec15', type: 'section', name: 'Financial Forecast', priority: 'high' }
      ];
      
      // Create structure from recommendations
      const mockStructure = {
        structureId: 'wizard-structure-789',
        version: '1.0',
        source: 'template' as const,
        documents: [{ id: 'main', name: 'Recommended Structure', purpose: 'Generated from wizard answers', required: true }],
        sections: [
          { id: 'metadata', documentId: 'main', title: 'Title Page', type: 'required' as const, required: true, programCritical: false },
          { id: 'ancillary', documentId: 'main', title: 'Table of Contents', type: 'required' as const, required: true, programCritical: false },
          { id: 'exec', documentId: 'main', title: 'Executive Summary', type: 'required' as const, required: true, programCritical: true },
          { id: 'comp', documentId: 'main', title: 'Company Overview', type: 'required' as const, required: true, programCritical: true },
          { id: 'proj', documentId: 'main', title: 'Project Description', type: 'required' as const, required: true, programCritical: true },
          { id: 'market', documentId: 'main', title: 'Market Analysis', type: 'required' as const, required: true, programCritical: true },
          { id: 'fin', documentId: 'main', title: 'Financial Projections', type: 'required' as const, required: true, programCritical: true },
          { id: 'team', documentId: 'main', title: 'Team Qualifications', type: 'required' as const, required: true, programCritical: true },
          { id: 'risk', documentId: 'main', title: 'Risk Assessment', type: 'required' as const, required: true, programCritical: true },
          { id: 'model', documentId: 'main', title: 'Business Model Canvas', type: 'required' as const, required: true, programCritical: true },
          { id: 'gtm', documentId: 'main', title: 'Go-to-Market Strategy', type: 'required' as const, required: true, programCritical: true },
          { id: 'ue', documentId: 'main', title: 'Unit Economics', type: 'required' as const, required: true, programCritical: true },
          { id: 'steps', documentId: 'main', title: 'Milestones and Next Steps', type: 'required' as const, required: true, programCritical: true },
          { id: 'refs', documentId: 'main', title: 'References', type: 'required' as const, required: false, programCritical: false },
          { id: 'tabs', documentId: 'main', title: 'Tables and Data', type: 'required' as const, required: false, programCritical: false },
          { id: 'figs', documentId: 'main', title: 'Figures and Images', type: 'required' as const, required: false, programCritical: false },
          { id: 'app', documentId: 'main', title: 'Appendices', type: 'required' as const, required: false, programCritical: false },
          { id: 'refs', documentId: 'main', title: 'References', type: 'required' as const, required: false, programCritical: false },
          { id: 'tabs', documentId: 'main', title: 'Tables and Data', type: 'required' as const, required: false, programCritical: false },
          { id: 'figs', documentId: 'main', title: 'Figures and Images', type: 'required' as const, required: false, programCritical: false },
          { id: 'app', documentId: 'main', title: 'Appendices', type: 'required' as const, required: false, programCritical: false }
        ],
        requirements: [
          { id: 'req1', scope: 'section' as const, category: 'financial' as const, severity: 'major' as const, rule: 'Must include detailed financial projections', target: 'Financial Projections', evidenceType: 'financial_document' },
          { id: 'req2', scope: 'document' as const, category: 'formatting' as const, severity: 'blocker' as const, rule: 'Document must be in PDF format', target: 'Recommended Structure', evidenceType: 'document_submission' },
          { id: 'req3', scope: 'section' as const, category: 'market' as const, severity: 'major' as const, rule: 'Must include comprehensive market analysis', target: 'Market Analysis', evidenceType: 'market_research' }
        ],
        validationRules: [
          { id: 'val1', type: 'presence' as const, scope: 'Recommended Structure', errorMessage: 'Recommended Structure is required and must be submitted' },
          { id: 'val2', type: 'presence' as const, scope: 'Financial Projections', errorMessage: 'Financial Projections are required for financial evaluation' }
        ],
        aiGuidance: [
          { sectionId: 'exec', prompt: 'Write professional executive summary focusing on key value propositions', checklist: ['Cover all executive summary aspects', 'Maintain professional tone', 'Highlight key value propositions'], examples: ['Example content for executive summary...'] },
          { sectionId: 'fin', prompt: 'Write detailed financial projections with 3-year forecast', checklist: ['Include 3-year forecast', 'Provide detailed breakdown', 'Include sensitivity analysis'], examples: ['Example financial projections...'] }
        ],
        renderingRules: {},
        conflicts: [],
        warnings: [],
        confidenceScore: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'simulation'
      };
      
      setDocumentStructure(mockStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: [],
        missingFields: [],
        confidence: 85
      });
      setInferredProductType('submission');
      
      // Update configurator state to reflect reco wizard results
      configuratorActions.setProgramSummary({
        id: 'reco-wizard-' + Date.now(),
        name: 'Recommendation Wizard',
        type: 'wizard',
        organization: 'AI Assistant',
        setupStatus: 'draft' as const
      });
      
      addResult({ 
        type: 'recoWizard', 
        status: 'success', 
        message: 'Reco wizard simulation completed successfully',
        details: { 
          answers: mockAnswers.length, 
          recommendations: mockRecommendations.length,
          sections: mockStructure.sections.length
        }
      });
    } catch (error) {
      addResult({ 
        type: 'recoWizard', 
        status: 'error', 
        message: `Reco wizard simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateUrlParsing = async () => {
    setIsRunning(true);
    addResult({ type: 'urlParsing', status: 'running', message: 'Starting URL parsing simulation with comprehensive test cases...' });
    
    try {
      // Simulate URL input
      const testUrl = 'https://www.test-funding-provider.gov/program/12345';
      
      // Simulate external API call and data extraction
      
      // Create structure from parsed data
      const mockStructure = {
        structureId: 'url-parsed-structure-def',
        version: '1.0',
        source: 'program' as const,
        documents: [{ id: 'main', name: 'URL-Parsed Program', purpose: 'Parsed from external URL', required: true }],
        sections: [
          { id: 'metadata', documentId: 'main', title: 'Title Page', type: 'required' as const, required: true, programCritical: false },
          { id: 'ancillary', documentId: 'main', title: 'Table of Contents', type: 'required' as const, required: true, programCritical: false },
          { id: 'app', documentId: 'main', title: 'Application Form', type: 'required' as const, required: true, programCritical: true },
          { id: 'exec', documentId: 'main', title: 'Executive Summary', type: 'required' as const, required: true, programCritical: true },
          { id: 'comp', documentId: 'main', title: 'Company Overview', type: 'required' as const, required: true, programCritical: true },
          { id: 'proj', documentId: 'main', title: 'Project Description', type: 'required' as const, required: true, programCritical: true },
          { id: 'market', documentId: 'main', title: 'Market Analysis', type: 'required' as const, required: true, programCritical: true },
          { id: 'fin', documentId: 'main', title: 'Budget Plan', type: 'required' as const, required: true, programCritical: true },
          { id: 'bud', documentId: 'main', title: 'Financial Plan', type: 'required' as const, required: true, programCritical: true },
          { id: 'team', documentId: 'main', title: 'Team Qualifications', type: 'required' as const, required: true, programCritical: true },
          { id: 'risk', documentId: 'main', title: 'Risk Assessment', type: 'required' as const, required: true, programCritical: true },
          { id: 'model', documentId: 'main', title: 'Business Model Canvas', type: 'required' as const, required: true, programCritical: true },
          { id: 'gtm', documentId: 'main', title: 'Go-to-Market Strategy', type: 'required' as const, required: true, programCritical: true },
          { id: 'ue', documentId: 'main', title: 'Unit Economics', type: 'required' as const, required: true, programCritical: true },
          { id: 'steps', documentId: 'main', title: 'Timeline', type: 'required' as const, required: true, programCritical: true },
          { id: 'time', documentId: 'main', title: 'Milestones and Next Steps', type: 'required' as const, required: true, programCritical: true },
          { id: 'refs', documentId: 'main', title: 'References', type: 'required' as const, required: false, programCritical: false },
          { id: 'tabs', documentId: 'main', title: 'Tables and Data', type: 'required' as const, required: false, programCritical: false },
          { id: 'figs', documentId: 'main', title: 'Figures and Images', type: 'required' as const, required: false, programCritical: false },
          { id: 'app', documentId: 'main', title: 'Appendices', type: 'required' as const, required: false, programCritical: false },
          { id: 'refs', documentId: 'main', title: 'References', type: 'required' as const, required: false, programCritical: false },
          { id: 'tabs', documentId: 'main', title: 'Tables and Data', type: 'required' as const, required: false, programCritical: false },
          { id: 'figs', documentId: 'main', title: 'Figures and Images', type: 'required' as const, required: false, programCritical: false },
          { id: 'app', documentId: 'main', title: 'Appendices', type: 'required' as const, required: false, programCritical: false }
        ],
        requirements: [
          { id: 'req1', scope: 'section' as const, category: 'financial' as const, severity: 'major' as const, rule: 'Must include detailed financial projections', target: 'Financial Plan', evidenceType: 'financial_document' },
          { id: 'req2', scope: 'document' as const, category: 'formatting' as const, severity: 'blocker' as const, rule: 'Document must be in PDF format', target: 'URL-Parsed Program', evidenceType: 'document_submission' },
          { id: 'req3', scope: 'section' as const, category: 'market' as const, severity: 'major' as const, rule: 'Must include comprehensive market analysis', target: 'Market Analysis', evidenceType: 'market_research' }
        ],
        validationRules: [
          { id: 'val1', type: 'presence' as const, scope: 'URL-Parsed Program', errorMessage: 'URL-Parsed Program is required and must be submitted' },
          { id: 'val2', type: 'presence' as const, scope: 'Financial Projections', errorMessage: 'Financial Projections are required for financial evaluation' }
        ],
        aiGuidance: [
          { sectionId: 'exec', prompt: 'Write professional executive summary focusing on key value propositions', checklist: ['Cover all executive summary aspects', 'Maintain professional tone', 'Highlight key value propositions'], examples: ['Example content for executive summary...'] },
          { sectionId: 'fin', prompt: 'Write detailed financial projections with 3-year forecast', checklist: ['Include 3-year forecast', 'Provide detailed breakdown', 'Include sensitivity analysis'], examples: ['Example financial projections...'] }
        ],
        renderingRules: {},
        conflicts: [],
        warnings: [],
        confidenceScore: 80,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'simulation'
      };
      
      setDocumentStructure(mockStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: [],
        missingFields: [],
        confidence: 80
      });
      setInferredProductType('submission');
      
      // Update configurator state to reflect URL parsing results
      configuratorActions.setProgramSummary({
        id: 'url-parsing-' + Date.now(),
        name: 'URL Parsing Result',
        type: 'program',
        organization: 'External Source',
        setupStatus: 'draft' as const
      });
      
      addResult({ 
        type: 'urlParsing', 
        status: 'success', 
        message: 'URL parsing simulation completed successfully',
        details: { url: testUrl, sections: mockStructure.sections.length, programName: 'Parsed Funding Program' }
      });
    } catch (error) {
      addResult({ 
        type: 'urlParsing', 
        status: 'error', 
        message: `URL parsing simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateFreeOption = async () => {
    setIsRunning(true);
    addResult({ type: 'freeOption', status: 'running', message: 'Starting free option simulation with clean upgrade test cases...' });
    
    try {
      // Create extracted content from the clean mock data
      const extractedContent = {
        title: 'Upgrade Business Plan',
        sections: [
          // Core sections
          { title: 'Title Page', content: 'Title page content', type: 'metadata' as const, rawSubsections: [
            { id: 'title_page_header', title: 'Document Title', content: 'Business Plan for Product Launch' },
            { id: 'title_page_subtitle', title: 'Subtitle', content: 'Comprehensive Strategy and Financial Projections' },
            { id: 'title_page_date', title: 'Date', content: 'January 2025' }
          ] },
          { title: 'Table of Contents', content: 'Table of contents content', type: 'ancillary' as const, rawSubsections: [
            { id: 'toc_section_list', title: 'Section List', content: 'Complete list of sections with page numbers' },
            { id: 'toc_appendix_ref', title: 'Appendix Reference', content: 'Cross-references to appendices' }
          ] },
          { title: 'Executive Summary', content: 'Executive summary content', type: 'executive_summary' as const, rawSubsections: [
            { id: 'exec_summary_objectives', title: 'Objectives', content: 'Key business objectives and goals' },
            { id: 'exec_summary_financial_highlights', title: 'Financial Highlights', content: 'Key financial projections and metrics' },
            { id: 'exec_summary_conclusion', title: 'Conclusion', content: 'Summary of key points and recommendations' }
          ] },
          { title: 'Company Overview', content: 'Company overview content', type: 'company_description' as const, rawSubsections: [
            { id: 'company_history', title: 'Company History', content: 'Background and founding story' },
            { id: 'company_mission', title: 'Mission Statement', content: 'Company mission and values' },
            { id: 'company_vision', title: 'Vision Statement', content: 'Future aspirations' }
          ] },
          { title: 'Project Description', content: 'Project description content', type: 'project_description' as const, rawSubsections: [
            { id: 'project_scope', title: 'Scope', content: 'Detailed project scope and deliverables' },
            { id: 'project_goals', title: 'Goals', content: 'Primary and secondary project goals' },
            { id: 'project_timeline', title: 'Timeline', content: 'Project timeline and milestones' }
          ] },
          { title: 'Market Analysis', content: 'Market analysis content', type: 'market_analysis' as const, rawSubsections: [
            { id: 'market_size', title: 'Market Size', content: 'Total addressable market analysis' },
            { id: 'competition_analysis', title: 'Competition Analysis', content: 'Competitive landscape and positioning' },
            { id: 'market_trends', title: 'Market Trends', content: 'Key trends affecting the market' }
          ] },
          { title: 'Financial Plan', content: 'Financial plan content', type: 'financial_plan' as const, rawSubsections: [
            { id: 'revenue_projections', title: 'Revenue Projections', content: '5-year revenue forecast' },
            { id: 'expense_analysis', title: 'Expense Analysis', content: 'Operating expenses and cost structure' },
            { id: 'profitability_analysis', title: 'Profitability Analysis', content: 'Profit margins and break-even analysis' }
          ] },
          { title: 'Team Qualifications', content: 'Team qualifications content', type: 'team_qualifications' as const, rawSubsections: [
            { id: 'team_profiles', title: 'Team Profiles', content: 'Detailed profiles of key team members' },
            { id: 'advisory_board', title: 'Advisory Board', content: 'Information about advisory board members' },
            { id: 'organizational_structure', title: 'Organizational Structure', content: 'Company organizational chart and reporting lines' }
          ] },
          { title: 'Risk Assessment', content: 'Risk assessment content', type: 'risk_assessment' as const, rawSubsections: [
            { id: 'market_risks', title: 'Market Risks', content: 'Risks related to market conditions' },
            { id: 'operational_risks', title: 'Operational Risks', content: 'Risks related to operations' },
            { id: 'financial_risks', title: 'Financial Risks', content: 'Financial and economic risks' }
          ] },
          { title: 'Business Model Canvas', content: 'Business model canvas content', type: 'business_model_canvas' as const, rawSubsections: [
            { id: 'value_proposition', title: 'Value Proposition', content: 'Core value proposition and offerings' },
            { id: 'customer_segments', title: 'Customer Segments', content: 'Target customer segments' },
            { id: 'revenue_streams', title: 'Revenue Streams', content: 'Primary revenue streams' }
          ] },
          { title: 'Go-to-Market Strategy', content: 'Go-to-market strategy content', type: 'marketing_strategy' as const, rawSubsections: [
            { id: 'marketing_channels', title: 'Marketing Channels', content: 'Marketing and distribution channels' },
            { id: 'pricing_strategy', title: 'Pricing Strategy', content: 'Product pricing approach' },
            { id: 'sales_strategy', title: 'Sales Strategy', content: 'Sales approach and tactics' }
          ] },
          { title: 'Unit Economics', content: 'Unit economics content', type: 'unit_economics' as const, rawSubsections: [
            { id: 'customer_acquisition_cost', title: 'Customer Acquisition Cost', content: 'Cost to acquire each customer' },
            { id: 'lifetime_value', title: 'Lifetime Value', content: 'Customer lifetime value calculation' },
            { id: 'unit_margin_analysis', title: 'Unit Margin Analysis', content: 'Margin analysis per unit sold' }
          ] },
          { title: 'Milestones and Next Steps', content: 'Milestones content', type: 'milestones' as const, rawSubsections: [
            { id: 'short_term_milestones', title: 'Short-term Milestones', content: 'Next 6-month milestones' },
            { id: 'long_term_milestones', title: 'Long-term Milestones', content: '1-3 year strategic milestones' },
            { id: 'success_metrics', title: 'Success Metrics', content: 'Key metrics to measure progress' }
          ] },
          // Standard special sections
          { title: 'References', content: 'References content', type: 'references' as const, rawSubsections: [
            { id: 'ref_sources', title: 'Sources', content: 'List of all sources cited' },
            { id: 'ref_bibliography', title: 'Bibliography', content: 'Detailed bibliography' }
          ] },
          { title: 'Tables and Data', content: 'Tables and data content', type: 'tables_data' as const, rawSubsections: [
            { id: 'table_financial_data', title: 'Financial Data Tables', content: 'Detailed financial data tables' },
            { id: 'table_market_data', title: 'Market Data Tables', content: 'Market research data tables' }
          ] },
          { title: 'Figures and Images', content: 'Figures and images content', type: 'figures_images' as const, rawSubsections: [
            { id: 'fig_business_model', title: 'Business Model Diagram', content: 'Visual representation of business model' },
            { id: 'fig_financial_projections', title: 'Financial Charts', content: 'Charts showing financial projections' }
          ] },
          { title: 'Appendices', content: 'Appendices content', type: 'appendices' as const, rawSubsections: [
            { id: 'app_supporting_docs', title: 'Supporting Documents', content: 'Additional supporting documentation' },
            { id: 'app_detailed_calcs', title: 'Detailed Calculations', content: 'Detailed financial calculations' }
          ] }
        ],
        hasTitlePage: true,
        hasTOC: true,
        totalPages: 50,
        wordCount: 15000
      };
      
      // Use the unified function to merge content with special sections
      const baseStructure = mergeUploadedContentWithSpecialSections(extractedContent, null, t as (key: string) => string);
      
      // Add upgrade-specific fields to the structure
      const mockStructure = {
        ...baseStructure,
        structureId: 'upgrade-structure-' + Date.now(),
        version: '1.0',
        source: 'upgrade' as const,
        upgradeMode: true,
        documents: [
          { id: 'main', name: 'Business Plan', purpose: 'Main business plan document', required: true }
        ],
        sections: baseStructure.sections.map((section: any) => {
          // Map section titles to canonical IDs for proper icon display
          const title = section.title || section.name || '';
          let canonicalId = section.id || section.type || title.toLowerCase().replace(/\s+/g, '_');
          
          // Map common section titles to canonical IDs for proper icons
          if (!section.id && !section.type) {
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('executive') && lowerTitle.includes('summary')) canonicalId = 'executive_summary';
            else if (lowerTitle.includes('company') || lowerTitle.includes('about')) canonicalId = 'company_overview';
            else if (lowerTitle.includes('market') && lowerTitle.includes('analysis')) canonicalId = 'market_analysis';
            else if (lowerTitle.includes('financial') || lowerTitle.includes('finance')) canonicalId = 'financial_plan';
            else if (lowerTitle.includes('marketing')) canonicalId = 'marketing_strategy';
            else if (lowerTitle.includes('operations')) canonicalId = 'operations_plan';
            else if (lowerTitle.includes('management') || lowerTitle.includes('organization')) canonicalId = 'management_structure';
            else if (lowerTitle.includes('risk')) canonicalId = 'risk_assessment';
            else if (lowerTitle.includes('swot')) canonicalId = 'swot_analysis';
            else if (lowerTitle.includes('competitor')) canonicalId = 'competitor_analysis';
            else if (lowerTitle.includes('reference')) canonicalId = 'references';
            else if (lowerTitle.includes('appendix') || lowerTitle.includes('appendice')) canonicalId = 'appendices';
            else if (lowerTitle.includes('table')) canonicalId = 'tables_data';
            else if (lowerTitle.includes('figure') || lowerTitle.includes('image')) canonicalId = 'figures_images';
            else if (lowerTitle.includes('metadata')) canonicalId = 'metadata';
            else if (lowerTitle.includes('ancillary')) canonicalId = 'ancillary';
          }
          
          return {
            ...section,
            documentId: 'main', // Link each section to the main document
            id: canonicalId
          };
        }),
        existingStructure: ['Executive Summary', 'Company Overview', 'Market Analysis', 'Financial Plan'],
        suggestedAdditions: [],
        missingBestPracticeSections: [],
        qualityGaps: [],
        modernizationFlags: [],
        requirements: [
          { id: 'req1', scope: 'section' as const, category: 'financial' as const, severity: 'major' as const, rule: 'Must include detailed financial projections', target: 'Financial Plan', evidenceType: 'financial_document' },
          { id: 'req2', scope: 'document' as const, category: 'formatting' as const, severity: 'blocker' as const, rule: 'Document must be in PDF format', target: 'Business Plan', evidenceType: 'document_submission' },
          { id: 'req3', scope: 'section' as const, category: 'market' as const, severity: 'major' as const, rule: 'Must include comprehensive market analysis', target: 'Market Analysis', evidenceType: 'market_research' }
        ],
        validationRules: [
          { id: 'val1', type: 'presence' as const, scope: 'Business Plan', errorMessage: 'Business Plan is required and must be submitted' },
          { id: 'val2', type: 'presence' as const, scope: 'Financial Projections', errorMessage: 'Financial Projections are required for financial evaluation' }
        ],
        aiGuidance: [
          { sectionId: 'exec', prompt: 'Write professional executive summary focusing on key value propositions', checklist: ['Cover all executive summary aspects', 'Maintain professional tone', 'Highlight key value propositions'], examples: ['Example content for executive summary...'] },
          { sectionId: 'fin', prompt: 'Write detailed financial projections with 3-year forecast', checklist: ['Include 3-year forecast', 'Provide detailed breakdown', 'Include sensitivity analysis'], examples: ['Example financial projections...'] }
        ],
        renderingRules: {},
        conflicts: [],
        warnings: [],
        confidenceScore: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'simulation'
      };
      
      setDocumentStructure(mockStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: [],
        missingFields: [],
        confidence: 85
      });
      setInferredProductType('upgrade');
      
      // Update configurator state to reflect free option selection
      configuratorActions.setProgramSummary({
        id: 'free-option-' + Date.now(),
        name: 'Free Option Structure',
        type: 'free',
        organization: 'User Defined',
        setupStatus: 'draft' as const
      });
      
      addResult({ 
        type: 'freeOption', 
        status: 'success', 
        message: 'Free option upgrade simulation completed successfully',
        details: { 
          sections: mockStructure.sections.length, 
          warnings: mockStructure.warnings.length,
          missingSections: 0,
          duplicateSections: 0,
          source: mockStructure.source,
          subsectionsIncluded: mockStructure.sections.some(s => s.rawSubsections && s.rawSubsections.length > 0),
          documentStructureInfo: {
            documentCount: mockStructure.documents.length,
            sectionCount: mockStructure.sections.length,
            hasProperLinks: mockStructure.sections.every(s => s.documentId === 'main'),
            canonicalIdsMapped: mockStructure.sections.every(s => s.id)
          }
        }
      });
    } catch (error) {
      addResult({ 
        type: 'freeOption', 
        status: 'error', 
        message: `Free option simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateDebugCanonicalOrdering = async () => {
    setIsRunning(true);
    addResult({ type: 'debugCanonicalOrdering', status: 'running', message: 'Starting comprehensive canonical ordering debug simulation with all bad examples...' });
    
    try {
      // Simulate content that should demonstrate canonical ordering with all bad examples
      const mockContentWithSpecialSections = {
        title: 'Test Business Plan',
        sections: [
          // Core business plan sections
          { title: 'Executive Summary', content: 'Executive summary...', type: 'executive_summary' },
          { title: 'Company Overview', content: 'About the company...', type: 'company_description' },
          { title: 'Market Analysis', content: 'Market research...', type: 'market_analysis' },
          { title: 'Financial Plan', content: 'Financial details...', type: 'financial_plan' },
          { title: 'Team Qualifications', content: 'Team member details...', type: 'team_qualifications' },
          // Special sections
          { title: 'References', content: 'Sources and citations...', type: 'references' },
          { title: 'Appendices', content: 'Additional supporting materials...', type: 'appendices' },
          { title: 'Tables and Data', content: 'Detailed tables...', type: 'tables_data' },
          { title: 'Figures and Images', content: 'Charts and diagrams...', type: 'figures_images' },
          { title: 'Title Page', content: 'Document title page...', type: 'metadata' },
          { title: 'Table of Contents', content: 'Table of contents...', type: 'ancillary' },
        ],
        hasTitlePage: true,
        hasTOC: true,
        totalPages: 30,
        wordCount: 8000
      };
      
      // Log the original order before processing
      console.log('DEBUG: Original section order:', mockContentWithSpecialSections.sections.map(s => s.title));
      
      // Apply the unified merge function
      const processedStructure = mergeUploadedContentWithSpecialSections(mockContentWithSpecialSections, null, t as (key: string) => string);
      
      // Log the final order after processing
      console.log('DEBUG: Final section order after mergeUploadedContentWithSpecialSections:', processedStructure.sections.map((s: any) => ({ title: s.title, id: s.id })));
      
      // Analyze the canonical ordering
      const sectionOrderAnalysis = processedStructure.sections.map((section: any, index: number) => ({
        index,
        id: section.id,
        title: section.title,
        canonicalPosition: getCanonicalPosition(section.id)
      }));
      
      setDocumentStructure(processedStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: processedStructure.warnings,
        missingFields: [],
        confidence: processedStructure.confidenceScore
      });
      
      // Update configurator state to reflect debug canonical ordering results
      configuratorActions.setProgramSummary({
        id: 'debug-canonical-ordering-' + Date.now(),
        name: 'Debug Canonical Ordering',
        type: 'debug',
        organization: 'Testing Framework',
        setupStatus: 'draft' as const
      });
      
      addResult({ 
        type: 'debugCanonicalOrdering', 
        status: 'success', 
        message: 'Debug canonical ordering simulation completed - see console for details',
        details: { 
          originalSections: mockContentWithSpecialSections.sections.length,
          finalSections: processedStructure.sections.length,
          confidenceScore: processedStructure.confidenceScore,
          warnings: processedStructure.warnings.length,
          sectionOrderAnalysis: sectionOrderAnalysis
        }
      });
    } catch (error) {
      addResult({ 
        type: 'debugCanonicalOrdering', 
        status: 'error', 
        message: `Debug canonical ordering simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Helper function to determine canonical position
  const getCanonicalPosition = (sectionId: string): number => {
    const canonicalOrder = [
      'metadata',      // Title Page
      'ancillary',     // Table of Contents
      'executive_summary',
      'company_description',
      'project_description',
      'market_analysis',
      'financial_plan',
      'team_qualifications',
      'risk_assessment',
      'business_model_canvas',
      'go_to_market_strategy',
      'unit_economics',
      'milestones_next_steps',
      'company_overview',
      'about_company',
      'company_information',
      'references',    // References
      'tables_data',   // Tables/Data
      'figures_images',// Figures/Images
      'appendices'     // Appendices
    ];
    
    const position = canonicalOrder.indexOf(sectionId);
    return position !== -1 ? position : 999; // Regular sections get high position
  };
  
  const runSelectedSimulation = async () => {
    switch (selectedSimulation) {
      case 'programFinder':
        await simulateProgramFinder();
        break;
      case 'templateUpload':
        await simulateTemplateUpload();
        break;
      case 'badTemplateUpload':
        await simulateBadTemplateUpload();
        break;
      case 'recoWizard':
        await simulateRecoWizard();
        break;
      case 'urlParsing':
        await simulateUrlParsing();
        break;
      case 'freeOption':
        await simulateFreeOption();
        break;
      case 'debugCanonicalOrdering':
        await simulateDebugCanonicalOrdering();
        break;
      case 'strategyTemplateUpload':
        await simulateStrategyTemplateUpload();
        break;
      case 'businessModelCanvas':
        await simulateBusinessModelCanvas();
        break;
      default:
        addResult({ 
          type: selectedSimulation, 
          status: 'error', 
          message: 'Unknown simulation type'
        });
    }
  };
  
  const clearResults = () => {
    setResults([]);
  };
  
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600 max-w-4xl">
      <h3 className="text-lg font-bold text-white mb-4">Flow Simulator</h3>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <select 
          value={selectedSimulation}
          onChange={(e) => setSelectedSimulation(e.target.value as SimulationType)}
          className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="programFinder">Program Finder</option>
          <option value="templateUpload">Template Upload</option>
          <option value="badTemplateUpload">Bad Template Upload (Error Test)</option>
          <option value="recoWizard">Reco Wizard</option>
          <option value="urlParsing">URL Parsing</option>
          <option value="freeOption">Free Option</option>
          <option value="debugCanonicalOrdering">Debug Canonical Ordering</option>
          <option value="strategyTemplateUpload">Strategy Document Template</option>
          <option value="businessModelCanvas">Business Model Canvas</option>
        </select>
        
        <button 
          onClick={runSelectedSimulation}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Simulation'}
        </button>
        
        <button 
          onClick={clearResults}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Clear Results
        </button>
      </div>
      
      <div className="mb-4">
        <h4 className="text-md font-semibold text-white mb-2">Results:</h4>
        <div className="max-h-60 overflow-y-auto bg-slate-900/50 rounded p-3 border border-slate-700">
          {results.length === 0 ? (
            <p className="text-slate-400 text-sm">No simulation results yet. Run a simulation to see results here.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li 
                  key={`${result.type}-${result.timestamp.getTime()}-${index}`}
                  className={`p-2 rounded text-sm ${
                    result.status === 'success' ? 'bg-green-900/30 border border-green-700' :
                    result.status === 'error' ? 'bg-red-900/30 border border-red-700' :
                    result.status === 'running' ? 'bg-yellow-900/30 border border-yellow-700' :
                    'bg-slate-700/30 border border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      [{result.type}] {result.message}
                    </span>
                    <span className="text-xs text-slate-400">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {result.details && (
                    <div className="mt-1 text-xs text-slate-300">
                      Details: {JSON.stringify(result.details)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-400">
        <p>This simulator runs complete flows for each option, updating the editor store and showing results.</p>
        <p>Check the store state and other components to see how they respond to each simulation.</p>
      </div>
    </div>
  );
}

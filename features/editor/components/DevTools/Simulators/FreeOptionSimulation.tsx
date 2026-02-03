import { mergeUploadedContentWithSpecialSections } from '@/features/editor/lib';

interface SimulationResult {
  type: 'freeOption';
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export function simulateFreeOption(
  setDocumentStructure: (structure: any) => void,
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => void,
  setSetupDiagnostics: (diagnostics: any) => void,

  configuratorActions: any,
  addResult: (result: SimulationResult) => void,
  t: (key: string) => string
) {
  return new Promise<void>(async (resolve) => {
    try {
      addResult({ type: 'freeOption', status: 'running', message: 'Starting free option simulation with clean upgrade test cases...' });
      
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
      const baseStructure = mergeUploadedContentWithSpecialSections(extractedContent, null, t);
      
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
      resolve();
    }
  });
}
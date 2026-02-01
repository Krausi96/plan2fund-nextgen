import React, { useState } from 'react';
import { useEditorStore, mergeUploadedContentWithSpecialSections } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type SimulationType = 'programFinder' | 'templateUpload' | 'badTemplateUpload' | 'recoWizard' | 'urlParsing' | 'freeOption' | 'debugCanonicalOrdering';

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
    addResult({ type: 'programFinder', status: 'running', message: 'Starting program finder simulation...' });
    
    try {
      // Simulate program selection
      const mockProgram = {
        id: 'test-program-123',
        name: 'Test Funding Program',
        provider: 'Test Provider',
        region: 'Test Region',
        fundingTypes: ['grant'],
        amountRange: { min: 10000, max: 100000, currency: 'EUR' },
        useOfFunds: ['Research', 'Development'],
        coFinancingRequired: true,
        coFinancingPercentage: 25,
        focusAreas: ['Technology', 'Innovation'],
        deliverables: ['Report', 'Prototype'],
        requirements: ['Budget Plan', 'Timeline'],
        formattingRules: { length: { minPages: 10, maxPages: 50 } },
        evidenceRequired: ['Financial Statements'],
        applicationRequirements: {
          documents: [
            { document_name: 'Application Form', required: true, format: 'pdf', authority: 'provider', reuseable: false }
          ],
          sections: [
            { title: 'Project Description', subsections: [{ title: 'Objectives', required: true }] }
          ],
          financialRequirements: {
            financial_statements_required: ['Balance Sheet', 'Income Statement']
          }
        }
      };
      
      // Update store with program data
      setProgramProfile(mockProgram);
      
      // Simulate document structure generation
      const mockStructure = {
        structureId: 'test-structure-123',
        version: '1.0',
        source: 'program' as const,
        documents: [{ id: 'main', name: 'Main Document', purpose: 'Main document', required: true }],
        sections: [
          { id: 'exec', documentId: 'main', title: 'Executive Summary', type: 'required' as const, required: true, programCritical: true },
          { id: 'budget', documentId: 'main', title: 'Budget Plan', type: 'required' as const, required: true, programCritical: true }
        ],
        requirements: [],
        validationRules: [],
        aiGuidance: [],
        renderingRules: {},
        conflicts: [],
        warnings: [],
        confidenceScore: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'simulation'
      };
      
      setDocumentStructure(mockStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: [],
        missingFields: [],
        confidence: 90
      });
      setInferredProductType('submission');
      
      addResult({ 
        type: 'programFinder', 
        status: 'success', 
        message: 'Program finder simulation completed successfully',
        details: { program: mockProgram.name, sections: mockStructure.sections.length }
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
    addResult({ type: 'templateUpload', status: 'running', message: 'Starting template upload simulation...' });
    
    try {
      // Simulate file upload
      const mockFile = {
        name: 'sample_business_plan.docx',
        size: 2457600, // 2.4 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      // Simulate extracted content from the document
      const extractedContent = {
        title: 'Sample Business Plan',
        sections: [
          { title: 'Title Page', content: 'Business Plan Title Page with company details...', type: 'metadata' },
          { title: 'Table of Contents', content: 'Table of contents with page numbers...', type: 'ancillary' },
          { title: 'Executive Summary', content: 'This is the executive summary...', type: 'executive_summary' },
          { title: 'Company Overview', content: 'About our company...', type: 'company_description' },
          { title: 'Market Analysis', content: 'Market trends and analysis...', type: 'market_analysis' },
          { title: 'Financial Plan', content: 'Financial projections...', type: 'financial_plan' },
          { title: 'Team Structure', content: 'Our team members...', type: 'team_qualifications' },
          { title: 'Tables and Data', content: 'Detailed financial tables and data...', type: 'tables_data' },
          { title: 'Figures and Images', content: 'Charts and graphs...', type: 'figures_images' },
          { title: 'References', content: 'Sources and references used...', type: 'references' },
          { title: 'Appendices', content: 'Additional supporting materials...', type: 'appendices' }
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
  
  const simulateBadTemplateUpload = async () => {
    setIsRunning(true);
    addResult({ type: 'templateUpload', status: 'running', message: 'Starting bad template upload simulation...' });
    
    try {
      // Simulate file upload with problematic data
      const mockFile = {
        name: 'problematic_template.docx',
        size: 102400, // 0.1 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      // Simulate problematic extracted content from the document
      const extractedContent = {
        title: '   ', // Whitespace-only title (effectively empty)
        sections: [
          { title: 'Section 1', content: 'Just some random content...', type: 'unknown_type' },
          { title: 'Section 2', content: '', type: '' }, // Empty content
          { title: '', content: 'Content with no title', type: 'random' }, // No title
          { title: '  ', content: 'Content with whitespace-only title', type: 'random' }, // Whitespace-only title
          { title: 'References', content: 'Some references', type: 'references' },
          { title: 'Appendices', content: 'Some appendices', type: 'appendices' },
          { title: 'Tables and Data', content: '', type: 'tables_data' }, // Empty content for tables
          { title: 'Figures and Images', content: '   ', type: 'figures_images' }, // Whitespace-only content
          { title: 'Another Empty Section', content: '', type: 'unknown' }, // Another empty section
          { title: 'Yet Another Section', content: 'Some content', type: 'undefined_type' }, // Undefined type
          { title: 'Executive Summary', content: 'Executive summary content', type: 'executive_summary' },
          { title: 'Company Overview', content: 'Company overview content', type: 'company_description' },
          { title: 'Market Analysis', content: 'Market analysis content', type: 'market_analysis' },
          { title: 'Financial Plan', content: 'Financial plan content', type: 'financial_plan' }
        ],
        hasTitlePage: false, // Missing title page
        hasTOC: false, // Missing table of contents
        totalPages: 1, // Very short document
        wordCount: 50 // Very few words
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
      
      // Count special sections in the final structure
      const specialSectionsAdded = finalStructure.sections.filter((s: any) => ['metadata', 'ancillary', 'references', 'appendices', 'tables_data', 'figures_images'].includes(s.id)).length;
      
      addResult({ 
        type: 'templateUpload', 
        status: 'success', 
        message: 'Bad template upload simulation completed - tested error handling',
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
        type: 'templateUpload', 
        status: 'error', 
        message: `Bad template upload simulation failed: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const simulateRecoWizard = async () => {
    setIsRunning(true);
    addResult({ type: 'recoWizard', status: 'running', message: 'Starting reco wizard simulation...' });
    
    try {
      // Simulate wizard flow
      const mockAnswers = [
        { question: 'What is your project focus?', answer: 'Digital Innovation' },
        { question: 'What funding range are you seeking?', answer: '50k-100k EUR' },
        { question: 'What stage is your project?', answer: 'Early Development' },
        { question: 'What industry?', answer: 'Technology' }
      ];
      
      // Generate recommendations
      const mockRecommendations = [
        { id: 'rec1', type: 'document', name: 'Business Plan', priority: 'high' },
        { id: 'rec2', type: 'section', name: 'Market Analysis', priority: 'medium' },
        { id: 'rec3', type: 'requirement', name: 'Financial Projections', priority: 'high' }
      ];
      
      // Create structure from recommendations
      const mockStructure = {
        structureId: 'wizard-structure-789',
        version: '1.0',
        source: 'template' as const,
        documents: [{ id: 'main', name: 'Recommended Structure', purpose: 'Generated from wizard answers', required: true }],
        sections: [
          { id: 'exec', documentId: 'main', title: 'Executive Summary', type: 'required' as const, required: true, programCritical: true },
          { id: 'market', documentId: 'main', title: 'Market Analysis', type: 'required' as const, required: true, programCritical: true },
          { id: 'fin', documentId: 'main', title: 'Financial Projections', type: 'required' as const, required: true, programCritical: true }
        ],
        requirements: [],
        validationRules: [],
        aiGuidance: [],
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
    addResult({ type: 'urlParsing', status: 'running', message: 'Starting URL parsing simulation...' });
    
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
          { id: 'app', documentId: 'main', title: 'Application Form', type: 'required' as const, required: true, programCritical: true },
          { id: 'bud', documentId: 'main', title: 'Budget Plan', type: 'required' as const, required: true, programCritical: true },
          { id: 'time', documentId: 'main', title: 'Timeline', type: 'required' as const, required: true, programCritical: true }
        ],
        requirements: [],
        validationRules: [],
        aiGuidance: [],
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
    addResult({ type: 'freeOption', status: 'running', message: 'Starting free option simulation...' });
    
    try {
      // Simulate free option selection
      const mockStructure = {
        structureId: 'standard-structure-xyz',
        version: '1.0',
        source: 'standard' as const,
        documents: [{ id: 'main', name: 'Standard Business Plan', purpose: 'Default structure', required: true }],
        sections: [
          { id: 'exec', documentId: 'main', title: 'Executive Summary', type: 'required' as const, required: true, programCritical: true },
          { id: 'descr', documentId: 'main', title: 'Project Description', type: 'required' as const, required: true, programCritical: true },
          { id: 'fin', documentId: 'main', title: 'Financial Plan', type: 'required' as const, required: true, programCritical: true },
          { id: 'impl', documentId: 'main', title: 'Implementation', type: 'optional' as const, required: false, programCritical: false }
        ],
        requirements: [],
        validationRules: [],
        aiGuidance: [],
        renderingRules: {},
        conflicts: [],
        warnings: [],
        confidenceScore: 95,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'simulation'
      };
      
      setDocumentStructure(mockStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: [],
        missingFields: [],
        confidence: 95
      });
      setInferredProductType('submission');
      
      addResult({ 
        type: 'freeOption', 
        status: 'success', 
        message: 'Free option simulation completed successfully',
        details: { sections: mockStructure.sections.length }
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
    addResult({ type: 'debugCanonicalOrdering', status: 'running', message: 'Starting canonical ordering debug simulation...' });
    
    try {
      // Simulate content that should demonstrate canonical ordering
      const mockContentWithSpecialSections = {
        title: 'Test Business Plan',
        sections: [
          { title: 'Financial Plan', content: 'Financial details...', type: 'financial_plan' },
          { title: 'Market Analysis', content: 'Market research...', type: 'market_analysis' },
          { title: 'Executive Summary', content: 'Executive summary...', type: 'executive_summary' },
          { title: 'Company Overview', content: 'About the company...', type: 'company_description' },
          { title: 'References', content: 'Sources and citations...', type: 'references' },
          { title: 'Appendices', content: 'Additional supporting materials...', type: 'appendices' },
          { title: 'Tables and Data', content: 'Detailed tables...', type: 'tables_data' },
          { title: 'Figures and Images', content: 'Charts and diagrams...', type: 'figures_images' },
          { title: 'Team Structure', content: 'Team member details...', type: 'team_qualifications' },
          { title: 'Title Page', content: 'Document title page...', type: 'metadata' },
          { title: 'Table of Contents', content: 'Table of contents...', type: 'ancillary' },
          { title: '   ', content: 'Empty section with whitespace...', type: 'empty' }, // Whitespace-only title
          { title: '', content: 'Empty section with no title...', type: 'empty' } // No title
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



interface SimulationResult {
  type: 'recoWizard';
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export function simulateRecoWizard(
  setDocumentStructure: (structure: any) => void,
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => void,
  setSetupDiagnostics: (diagnostics: any) => void,

  configuratorActions: any,
  addResult: (result: SimulationResult) => void
) {
  return new Promise<void>(async (resolve) => {
    try {
      addResult({ type: 'recoWizard', status: 'running', message: 'Starting reco wizard simulation with comprehensive test cases...' });
      
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
      resolve();
    }
  });
}
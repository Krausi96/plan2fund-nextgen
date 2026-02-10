import { processDocumentSecurely } from './internal/document-flows/document-flows/processing/documentProcessor';
import type { DocumentStructure } from '../core/types';

export interface DocumentProcessingResult {
  success: boolean;
  documentStructure: DocumentStructure | null;
  inferredProductType: 'submission' | 'upgrade' | null;
  warnings: string[];
  diagnostics: string[];
  confidence: number;
  message?: string;
}

/**
 * Analyzes and processes uploaded documents
 * Single entry point for document upload + template parsing
 * Internally orchestrates processDocumentSecurely and document processing utils
 */
export async function analyzeDocument(
  files: File[],
  mode: 'template' | 'upgrade'
): Promise<{
  documentStructure: DocumentStructure;
  inferredProductType: 'submission' | 'upgrade';
  warnings: string[];
  diagnostics: string[];
  confidence: number;
}> {
  if (files.length === 0) {
    throw new Error('No files provided for processing');
  }

  const file = files[0];

  // Security guard: check file type
  if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('document')) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  try {
    // Call the real orchestrator
    const result = await processDocumentSecurely(file);
    
    if (!result.success || !result.documentStructure) {
      throw new Error(result.message || 'Document processing failed');
    }

    if (mode === 'template') {
      return {
        documentStructure: {
          ...result.documentStructure,
          metadata: {
            ...result.documentStructure.metadata,
            source: 'template',
          },
        },
        inferredProductType: 'submission',
        warnings: result.securityIssues.softWarnings,
        diagnostics: result.securityIssues.softWarnings,
        confidence: result.documentStructure.confidenceScore || 0,
      };
    } else {
      // Upgrade mode: add weakness analysis
      const weaknesses = findWeaknesses(result.documentStructure.sections);
      const missingSections = findMissingSections(result.documentStructure.sections);
      
      const warnings = [
        ...result.securityIssues.softWarnings,
        ...weaknesses,
        ...missingSections.map(s => `Missing section: ${s}`)
      ];

      return {
        documentStructure: {
          ...result.documentStructure,
          metadata: {
            ...result.documentStructure.metadata,
            source: 'document',
          },
          warnings: warnings.map(msg => ({
            id: `warn_${Date.now()}_${Math.random()}`,
            message: msg,
          })),
        },
        inferredProductType: 'upgrade',
        warnings,
        diagnostics: warnings,
        confidence: result.documentStructure.confidenceScore || 0,
      };
    }
  } catch (error) {
    throw new Error(`Document analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Find weaknesses in document sections
 */
function findWeaknesses(sections: any[]): string[] {
  const weaknesses: string[] = [];
  
  // Check for sections with weak content
  sections.forEach((section: any) => {
    if (section.content && section.content.length < 100) {
      weaknesses.push(`${section.title} section needs strengthening`);
    }
  });

  // Check for specific weaknesses
  const titlesLower = sections.map(s => s.title.toLowerCase());
  
  if (!titlesLower.some(t => t.includes('swot'))) {
    weaknesses.push('SWOT Analysis section needs strengthening');
  }
  if (!titlesLower.some(t => t.includes('competitor'))) {
    weaknesses.push('Competitor Analysis lacks detail');
  }
  if (!titlesLower.some(t => t.includes('financial'))) {
    weaknesses.push('Financial projections need more granularity');
  }

  return weaknesses;
}

/**
 * Find missing best practice sections
 */
function findMissingSections(sections: any[]): string[] {
  const sectionTitles = sections.map((s: any) => s.title.toLowerCase());
  const requiredSections = [
    'Marketing Strategy',
    'Operations Plan',
    'Risk Management',
    'Executive Summary',
    'Financial Projections'
  ];
  
  return requiredSections.filter(required => 
    !sectionTitles.some(title => title.includes(required.toLowerCase()))
  );
}
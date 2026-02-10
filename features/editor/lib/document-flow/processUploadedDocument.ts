import { processDocumentSecurely } from '../utils/1-document-flows/document-flows/processing/documentProcessor';
import type { DocumentStructure } from '@/platform/core/types';

/**
 * Process uploaded document with specified mode
 * 
 * @param files - Array of files to process
 * @param mode - Processing mode: 'template' or 'upgrade'
 * @returns Processed document structure with analysis
 */
export async function processUploadedDocument(
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

  const file = files[0]; // Process the first file for now
  
  // Hard guard for security
  if (!file.type.includes("pdf") && !file.type.includes("word")) {
    throw new Error("Unsupported file type");
  }
  
  // Process document ONCE
  const result = await processDocumentSecurely(file);
  
  if (!result.success || !result.documentStructure) {
    throw new Error(`Failed to process file: ${result.message}`);
  }

  if (mode === 'template') {
    // Template mode: process as a template for blueprint creation
    const warnings = result.securityIssues.softWarnings;
    
    return {
      documentStructure: {
        ...result.documentStructure,
        metadata: {
          ...(result.documentStructure as any).metadata,
          source: 'template',
          generatedAt: new Date().toISOString(),
          version: '1.0',
        },
      } as unknown as DocumentStructure,
      inferredProductType: 'submission' as const,
      warnings,
      diagnostics: warnings, // Same array reference
      confidence: result.documentStructure.confidenceScore || 0,
    };
  } else {
    // Upgrade mode: process for plan upgrade analysis
    const base = result.documentStructure;
    
    // Perform upgrade-specific analysis directly on base sections
    const weaknesses = findWeaknesses(base.sections);
    const missingSections = findMissingSections(base.sections);
    // modernizationFlags not used yet - reserved for future analysis
    findModernizationFlags(base.sections);
    
    const warnings = [
      ...result.securityIssues.softWarnings,
      ...weaknesses,
      ...missingSections.map(s => `Missing section: ${s}`)
    ];

    return {
      documentStructure: {
        ...base,
        metadata: {
          ...(base as any).metadata,
          source: 'document',
          generatedAt: new Date().toISOString(),
          version: '1.0',
        },
        warnings: warnings.map(msg => ({
          id: `warn_${Date.now()}_${Math.random()}`,
          message: msg,
        })),
      } as unknown as DocumentStructure,
      inferredProductType: 'upgrade' as const,
      warnings,
      diagnostics: warnings, // Same array reference
      confidence: base.confidenceScore || 0,
    };
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
  if (!sections.some((s: any) => s.title.toLowerCase().includes('swot'))) {
    weaknesses.push('SWOT Analysis section needs strengthening');
  }
  if (!sections.some((s: any) => s.title.toLowerCase().includes('competitor'))) {
    weaknesses.push('Competitor Analysis lacks detail');
  }
  if (!sections.some((s: any) => s.title.toLowerCase().includes('financial'))) {
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

/**
 * Find modernization flags
 */
function findModernizationFlags(sections: any[]): string[] {
  const flags: string[] = [];
  
  // Check for modernization opportunities
  if (!sections.some((s: any) => 
    s.title.toLowerCase().includes('digital') || 
    s.title.toLowerCase().includes('transformation')
  )) {
    flags.push('Consider adding digital transformation section');
  }
  
  if (!sections.some((s: any) => 
    s.title.toLowerCase().includes('sustainability') || 
    s.title.toLowerCase().includes('environmental')
  )) {
    flags.push('Update sustainability considerations');
  }
  
  if (!sections.some((s: any) => 
    s.title.toLowerCase().includes('esg')
  )) {
    flags.push('Include ESG factors');
  }

  return flags;
}
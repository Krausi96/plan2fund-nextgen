/**
 * Document Processor
 * Consolidated from features/editor/lib/document-flow/processUploadedDocument.ts
 */

import type { DocumentStructure, WarningItem } from '../../core/types';

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
 * Process uploaded document with specified mode
 */
export async function processUploadedDocument(
  files: File[],
  mode: 'template' | 'upgrade'
): Promise<DocumentProcessingResult> {
  if (files.length === 0) {
    return {
      success: false,
      documentStructure: null,
      inferredProductType: null,
      warnings: ['No files provided for processing'],
      diagnostics: [],
      confidence: 0,
      message: 'No files provided',
    };
  }

  const file = files[0];

  // Hard guard for security
  if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('document')) {
    return {
      success: false,
      documentStructure: null,
      inferredProductType: null,
      warnings: ['Unsupported file type'],
      diagnostics: [],
      confidence: 0,
      message: `Unsupported file type: ${file.type}`,
    };
  }

  try {
    // Create base document structure
    const baseStructure = createBaseStructure(file.name);

    if (mode === 'template') {
      return processAsTemplate(baseStructure, file.name);
    } else {
      return processForUpgrade(baseStructure, file.name);
    }
  } catch (error) {
    return {
      success: false,
      documentStructure: null,
      inferredProductType: null,
      warnings: [`Processing error: ${(error as Error).message}`],
      diagnostics: [],
      confidence: 0,
      message: `Failed to process document: ${(error as Error).message}`,
    };
  }
}

function createBaseStructure(fileName: string): DocumentStructure {
  return {
    documents: [
      {
        id: 'main_document',
        name: fileName.replace(/\.[^/.]+$/, ''),
        purpose: 'Primary document',
        required: true,
        type: 'core',
      },
    ],
    sections: [],
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 75,
    metadata: {
      source: 'template',
      generatedAt: new Date().toISOString(),
      version: '1.0',
    },
  };
}

function processAsTemplate(
  structure: DocumentStructure,
  fileName: string
): DocumentProcessingResult {
  const warnings: string[] = [];

  // Template mode: process as a template for blueprint creation
  return {
    success: true,
    documentStructure: {
      ...structure,
      metadata: {
        ...structure.metadata,
        source: 'template',
      },
    },
    inferredProductType: 'submission',
    warnings,
    diagnostics: warnings,
    confidence: structure.confidenceScore || 75,
  };
}

function processForUpgrade(
  structure: DocumentStructure,
  fileName: string
): DocumentProcessingResult {
  const warnings: string[] = [];
  const weaknesses: string[] = [];
  const missingSections: string[] = [];

  // Check for common weaknesses
  weaknesses.push(...findWeaknesses(structure.sections));
  missingSections.push(...findMissingSections(structure.sections));

  if (weaknesses.length > 0) {
    warnings.push(...weaknesses.map(w => `${w} needs strengthening`));
  }
  if (missingSections.length > 0) {
    warnings.push(...missingSections.map(s => `Missing section: ${s}`));
  }

  // Upgrade mode: process for plan upgrade analysis
  return {
    success: true,
    documentStructure: {
      ...structure,
      metadata: {
        ...structure.metadata,
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
    confidence: structure.confidenceScore || 75,
  };
}

function findWeaknesses(sections: { title: string; content?: string }[]): string[] {
  const weaknesses: string[] = [];

  // Check for sections with weak content
  sections.forEach(section => {
    if (section.content && section.content.length < 100) {
      weaknesses.push(`${section.title}`);
    }
  });

  // Check for specific weaknesses
  const titlesLower = sections.map(s => s.title.toLowerCase());
  
  if (!titlesLower.some(t => t.includes('swot'))) {
    weaknesses.push('SWOT Analysis');
  }
  if (!titlesLower.some(t => t.includes('competitor'))) {
    weaknesses.push('Competitor Analysis');
  }
  if (!titlesLower.some(t => t.includes('financial'))) {
    weaknesses.push('Financial projections');
  }

  return weaknesses;
}

function findMissingSections(sections: { title: string }[]): string[] {
  const sectionTitles = sections.map(s => s.title.toLowerCase());
  const requiredSections = [
    'Marketing Strategy',
    'Operations Plan',
    'Risk Management',
    'Executive Summary',
    'Financial Projections',
  ];

  return requiredSections.filter(required =>
    !sectionTitles.some(title => title.includes(required.toLowerCase()))
  );
}

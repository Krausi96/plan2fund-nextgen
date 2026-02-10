/**
 * Document Analyzer
 * Analyzes uploaded documents and extracts insights
 */

import type { DocumentStructure, Section } from '../../core/types';
import type { DocumentAnalysisResult, SectionInfo } from '../types';

import { v4 as uuidv4 } from 'uuid';

/**
 * Analyze an uploaded document
 */
export async function analyzeUploadedDocument(
  file: File
): Promise<DocumentAnalysisResult> {
  const documentId = uuidv4();
  
  // Extract basic metadata
  const metadata = await extractDocumentMetadata(file);
  
  // Analyze structure
  const structure = await analyzeDocumentStructure(file);
  
  // Assess quality
  const quality = assessQuality(structure.sections, metadata.wordCount);
  
  return {
    documentId,
    structure,
    quality,
    metadata,
  };
}

/**
 * Analyze document quality
 */
export function analyzeDocumentQuality(
  documentStructure: DocumentStructure
): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check for required sections
  const requiredSections = ['Executive Summary', 'Market Analysis', 'Financial Projections', 'Team'];
  const sectionTitles = documentStructure.sections.map(s => s.title.toLowerCase());
  
  for (const required of requiredSections) {
    if (!sectionTitles.some(t => t.includes(required.toLowerCase()))) {
      issues.push(`Missing required section: ${required}`);
      score -= 10;
      suggestions.push(`Add a ${required} section to improve completeness`);
    }
  }

  // Check section count
  if (documentStructure.sections.length < 5) {
    issues.push('Document has too few sections');
    score -= 15;
    suggestions.push('Consider adding more sections for a comprehensive document');
  } else if (documentStructure.sections.length > 20) {
    issues.push('Document has many sections - consider consolidating');
    score -= 5;
  }

  // Check for AI guidance
  if (documentStructure.aiGuidance.length === 0) {
    suggestions.push('Add AI guidance to sections for better content generation');
  }

  // Check confidence score
  if (documentStructure.confidenceScore < 70) {
    issues.push('Low confidence in document structure');
    score -= 10;
  }

  // Check for warnings
  if (documentStructure.warnings.length > 0) {
    const warningMessages = documentStructure.warnings.slice(0, 3).map(w => w.message);
    issues.push(...warningMessages);
    score -= documentStructure.warnings.length * 2;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions,
  };
}

/**
 * Extract insights from document
 */
export function extractDocumentInsights(
  documentStructure: DocumentStructure
): {
  keyTopics: string[];
  documentType: string;
  completenessScore: number;
  recommendations: string[];
} {
  const keyTopics: string[] = [];
  const recommendations: string[] = [];
  
  // Extract topics from section titles
  const topicKeywords = [
    { keywords: ['market', 'competitor', 'customer'], topic: 'Market Analysis' },
    { keywords: ['financial', 'revenue', 'cost', 'budget'], topic: 'Financial Planning' },
    { keywords: ['team', 'founder', 'hiring', 'org'], topic: 'Team & Organization' },
    { keywords: ['product', 'technology', 'development'], topic: 'Product & Technology' },
    { keywords: ['risk', 'mitigation', 'challenge'], topic: 'Risk Assessment' },
    { keywords: ['marketing', 'sales', 'growth'], topic: 'Marketing Strategy' },
  ];

  const sectionTitles = documentStructure.sections.map(s => s.title.toLowerCase());
  
  for (const { keywords, topic } of topicKeywords) {
    if (keywords.some(k => sectionTitles.some(t => t.includes(k)))) {
      keyTopics.push(topic);
    }
  }

  // Determine document type
  let documentType = 'Business Plan';
  if (sectionTitles.some(t => t.includes('executive summary'))) {
    documentType = 'Executive Summary';
  } else if (sectionTitles.some(t => t.includes('financial'))) {
    documentType = 'Financial Document';
  } else if (sectionTitles.some(t => t.includes('pitch'))) {
    documentType = 'Pitch Deck';
  }

  // Calculate completeness
  const requiredSections = 8;
  const completenessScore = Math.min(100, 
    (documentStructure.sections.length / requiredSections) * 100
  );

  // Generate recommendations
  if (documentStructure.sections.length < 5) {
    recommendations.push('Consider adding more sections for a comprehensive document');
  }
  if (!documentStructure.requirements || documentStructure.requirements.length === 0) {
    recommendations.push('Define document requirements for better structure');
  }
  if (documentStructure.confidenceScore < 80) {
    recommendations.push('Review and improve section detection confidence');
  }

  return {
    keyTopics,
    documentType,
    completenessScore,
    recommendations,
  };
}

// Helper functions

async function extractDocumentMetadata(file: File): Promise<{
  wordCount: number;
  hasTitlePage: boolean;
  hasTOC: boolean;
  detectedType: string;
}> {
  // Basic metadata extraction
  const hasTitlePage = file.name.toLowerCase().includes('title') || 
    file.name.toLowerCase().includes('cover');
  const hasTOC = file.name.toLowerCase().includes('toc') ||
    file.name.toLowerCase().includes('contents');
  
  // Estimate word count based on file size (rough estimate)
  const estimatedWordCount = Math.round(file.size / 6);
  
  // Detect document type from filename
  let detectedType = 'Business Plan';
  const lowerName = file.name.toLowerCase();
  if (lowerName.includes('executive') || lowerName.includes('summary')) {
    detectedType = 'Executive Summary';
  } else if (lowerName.includes('financial') || lowerName.includes('finance')) {
    detectedType = 'Financial Document';
  } else if (lowerName.includes('pitch')) {
    detectedType = 'Pitch Deck';
  } else if (lowerName.includes('proposal')) {
    detectedType = 'Business Proposal';
  }

  return {
    wordCount: estimatedWordCount,
    hasTitlePage,
    hasTOC,
    detectedType,
  };
}

async function analyzeDocumentStructure(file: File): Promise<{
  sections: SectionInfo[];
  confidence: number;
}> {
  // Basic structure analysis - would use actual document parsing in production
  const sections: SectionInfo[] = [
    {
      id: 'intro',
      title: 'Introduction',
      type: 'normal',
      confidence: 85,
      wordCount: 0,
    },
  ];

  return {
    sections,
    confidence: 75,
  };
}

function assessQuality(sections: SectionInfo[], wordCount: number): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check word count
  if (wordCount < 500) {
    issues.push('Document appears to be very short');
    score -= 20;
    suggestions.push('Consider adding more content');
  } else if (wordCount < 2000) {
    suggestions.push('Document could benefit from more detail');
    score -= 5;
  }

  // Check section count
  if (sections.length < 3) {
    issues.push('Few sections detected');
    score -= 15;
    suggestions.push('Consider structuring content into more sections');
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

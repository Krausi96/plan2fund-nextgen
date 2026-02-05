import type { PlanSection } from '../../../../../types/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../../../../constants';

/**
 * Extracts sections from raw document content using simple heuristics
 * 
 * @param content - Raw text content of the document
 * @param fileName - Name of the file being processed
 * @returns Array of sections with title and content
 */
export function extractSectionsFromFileContent(content: string, fileName: string): PlanSection[] {
  const sections: PlanSection[] = [];
  
  // Split content by common section delimiters
  const lines = content.split('\n');
  let currentSection: {
    title: string;
    content: string;
    type: string;
  } | null = null;
  
  // Common section headers that might appear in business documents
  const sectionHeaders = [
    'executive summary',
    'company description',
    'market analysis',
    'products services',
    'marketing strategy',
    'operations plan',
    'management team',
    'financial plan',
    'risk analysis',
    'conclusion',
    'appendices',
    'references',
    'introduction',
    'background',
    'objectives',
    'methodology',
    'results',
    'discussion',
    'recommendations',
    'title page',
    'table of contents',
    'abstract',
    'acknowledgements',
    'glossary',
    'bibliography'
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for numbered headings pattern (e.g., "3. Market Analysis", "3.1.2 Subsection")
    const numberedHeadingMatch = trimmedLine.match(/^\d+(\.\d+)*\s+(.*)/);
    
    // Check if this line looks like a section header
    const isSectionHeader = sectionHeaders.some(header => 
      trimmedLine.toLowerCase().includes(header) || 
      trimmedLine.toLowerCase().startsWith(header) ||
      trimmedLine.toLowerCase().endsWith(header)
    ) || !!numberedHeadingMatch;
    
    if (isSectionHeader && trimmedLine.length <= 100) { // Reasonable title length
      // Save previous section if exists
      if (currentSection) {
        sections.push(createPlanSection(currentSection));
      }
      
      // Use numbered heading if found, otherwise use original
      const sectionTitle = numberedHeadingMatch ? numberedHeadingMatch[2] : trimmedLine;
      
      // Create new section
      currentSection = {
        title: sectionTitle,
        content: '',
        type: determineSectionType(sectionTitle)
      };
    } else if (currentSection) {
      // Add content to current section
      if (currentSection.content) {
        currentSection.content += '\n' + trimmedLine;
      } else {
        currentSection.content = trimmedLine;
      }
    }
  }
  
  // Add the last section if exists
  if (currentSection) {
    sections.push(createPlanSection(currentSection));
  }
  
  // If no sections were identified, create a single section with the whole content
  if (sections.length === 0) {
    sections.push(createPlanSection({
      title: fileName.replace(/\.[^/.]+$/, "") || 'Untitled Document',
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), // Limit content
      type: 'general'
    }));
  }
  
  return sections;
}

/**
 * Creates a PlanSection object with proper structure
 */
export function createPlanSection(sectionData: { title: string; content: string; type: string }): PlanSection {
  // Map special section types to their canonical IDs
  let sectionId: string;
  
  // Create a more unique sectionId by using the section title as well
  if (sectionData.title.toLowerCase().includes('metadata') || sectionData.title.toLowerCase().includes('title')) {
    sectionId = METADATA_SECTION_ID;
  } else if (sectionData.title.toLowerCase().includes('ancillary') || sectionData.title.toLowerCase().includes('toc') || sectionData.title.toLowerCase().includes('table of contents')) {
    sectionId = ANCILLARY_SECTION_ID;
  } else if (sectionData.title.toLowerCase().includes('references') || sectionData.title.toLowerCase().includes('bibliography')) {
    sectionId = REFERENCES_SECTION_ID;
  } else if (sectionData.title.toLowerCase().includes('appendices') || sectionData.title.toLowerCase().includes('appendix')) {
    sectionId = APPENDICES_SECTION_ID;
  } else if (sectionData.title.toLowerCase().includes('tables') || sectionData.title.toLowerCase().includes('data')) {
    sectionId = TABLES_DATA_SECTION_ID;
  } else if (sectionData.title.toLowerCase().includes('figures') || sectionData.title.toLowerCase().includes('images')) {
    sectionId = FIGURES_IMAGES_SECTION_ID;
  } else {
    sectionId = `${sectionData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
  
  return {
    key: sectionId,
    id: sectionId,
    title: sectionData.title,
    content: sectionData.content,
    rawSubsections: [
      {
        id: `${sectionData.type}-overview-${Date.now()}`,
        title: `Overview of ${sectionData.title}`,
        rawText: sectionData.content.substring(0, 500) + (sectionData.content.length > 500 ? '...' : '')
      }
    ]
  };
}

/**
 * Determines the likely type of a section based on its title
 * 
 * @param title - Title of the section
 * @returns Type of the section
 */
export function determineSectionType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('executive') || lowerTitle.includes('summary')) {
    return 'executive_summary';
  } else if (lowerTitle.includes('company') || lowerTitle.includes('description')) {
    return 'company_description';
  } else if (lowerTitle.includes('market') || lowerTitle.includes('analysis')) {
    return 'market_analysis';
  } else if (lowerTitle.includes('financial') || lowerTitle.includes('finance')) {
    return 'financial_plan';
  } else if (lowerTitle.includes('team') || lowerTitle.includes('management')) {
    return 'team_qualifications';
  } else if (lowerTitle.includes('risk')) {
    return 'risk_assessment';
  } else if (lowerTitle.includes('reference')) {
    return 'references';
  } else if (lowerTitle.includes('appendix') || lowerTitle.includes('appendices')) {
    return 'appendices';
  } else if (lowerTitle.includes('title') || lowerTitle.includes('cover')) {
    return 'metadata';
  } else if (lowerTitle.includes('table of contents') || lowerTitle.includes('toc')) {
    return 'ancillary';
  } else if (lowerTitle.includes('introduction')) {
    return 'introduction';
  } else if (lowerTitle.includes('conclusion') || lowerTitle.includes('closing')) {
    return 'conclusion';
  } else {
    return 'general';
  }
}
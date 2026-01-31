import { 
  METADATA_SECTION_ID, 
  ANCILLARY_SECTION_ID, 
  REFERENCES_SECTION_ID, 
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../constants';
import type { SectionTemplate } from '../types/types';
import type { DocumentStructure } from '../types/Program-Types';
import type { Translations } from '@/shared/contexts/I18nContext';

// Define the canonical section order
const CANONICAL_SECTION_ORDER = [
  METADATA_SECTION_ID,      // Title Page - must be first
  ANCILLARY_SECTION_ID,     // Table of Contents - must be second
  'executive_summary',
  'project_description',
  'market_analysis',
  'financial_plan',
  'team_qualifications',
  'risk_assessment',
  'business_model_canvas',
  'go_to_market_strategy',
  'unit_economics',
  'milestones_next_steps',
  REFERENCES_SECTION_ID,    // References
  TABLES_DATA_SECTION_ID,   // Tables/Data
  FIGURES_IMAGES_SECTION_ID, // Figures/Images
  APPENDICES_SECTION_ID     // Appendices
];

// Create a map for fast lookup
const SECTION_ORDER_MAP = new Map(CANONICAL_SECTION_ORDER.map((id, index) => [id, index]));

/**
 * Sort sections according to canonical order
 * Ensures Title Page is first, TOC is second, and sections follow the defined order
 */
export function sortSectionsByCanonicalOrder<T extends { id: string }>(sections: T[]): T[] {
  return [...sections].sort((a, b) => {
    const orderA = SECTION_ORDER_MAP.get(a.id);
    const orderB = SECTION_ORDER_MAP.get(b.id);
    
    // If both sections are in the canonical order, sort by their defined positions
    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }
    
    // If only one section is in canonical order, it comes first
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;
    
    // If neither is in canonical order, maintain original order
    return 0;
  });
}

type TranslationFunction = (key: keyof Translations) => string;

/**
 * Convert SectionTemplate to document structure section format
 */
function convertSectionTemplate(template: SectionTemplate): any {
  return {
    id: template.id,
    documentId: 'main_document',
    title: template.title || template.name || '',
    type: (template.required ? 'required' : 'optional') as 'required' | 'optional' | 'conditional',
    required: template.required !== false,
    programCritical: false,
    aiPrompt: template.aiPrompt || `Write detailed content for ${template.title || template.name}`,
    checklist: template.checklist || [`Address ${template.title || template.name} requirements`]
  };
}

/**
 * Enhance document structure with special sections
 * Adds Title Page, TOC, References, and Appendices to any document structure
 * Ensures all components have access to complete section list
 * 
 * @param documentStructure - Original document structure
 * @param t - Translation function
 * @returns Enhanced document structure with special sections
 */
export function enhanceWithSpecialSections(
  documentStructure: DocumentStructure | null,
  t: TranslationFunction
): DocumentStructure | null {
  if (!documentStructure) return null;
  
  // Convert template sections if needed
  const baseSections = Array.isArray(documentStructure.sections) 
    ? documentStructure.sections.map(section => 
        typeof section === 'object' && 'id' in section && 'title' in section
          ? section
          : convertSectionTemplate(section as unknown as SectionTemplate)
      )
    : [];
  
  // Check if this structure already comes from MASTER_SECTIONS (contains ALL special sections)
  // If it has any special sections, don't add them again
  const hasAnySpecialSections = baseSections.some(s => 
    s.id === METADATA_SECTION_ID || 
    s.id === ANCILLARY_SECTION_ID ||
    s.id === REFERENCES_SECTION_ID ||
    s.id === TABLES_DATA_SECTION_ID ||
    s.id === FIGURES_IMAGES_SECTION_ID ||
    s.id === APPENDICES_SECTION_ID
  );
  
  // Only add special sections if they don't already exist
  const leadingSpecialSections = [];
  
  if (!hasAnySpecialSections) {
    leadingSpecialSections.push({
      id: METADATA_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.metadata' as any) || 'Title Page',
      type: 'required' as const,
      required: true,
      programCritical: false,
      icon: '📕'
    }, {
      id: ANCILLARY_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.ancillary' as any) || 'Table of Contents',
      type: 'required' as const,
      required: true,
      programCritical: false,
      icon: '📑'
    });
  }
  
  // All special sections are now handled via MASTER_SECTIONS
  // No need for inline trailing sections
  const trailingSpecialSections: any[] = []; // Deprecated - kept for backward compatibility
  
  const result = {
    ...documentStructure,
    sections: [
      ...leadingSpecialSections,
      ...baseSections,
      ...trailingSpecialSections
    ]
  };
  
  return result;
}

/**
 * Get complete section list including special sections for display purposes
 * Combines template sections with special sections (Title Page, TOC, References, Appendices)
 * 
 * @param templateSections - Sections from MASTER_SECTIONS or document structure
 * @param t - Translation function
 * @returns Complete section list with proper icons and ordering
 */
export function getCompleteSectionList(
  templateSections: SectionTemplate[]): SectionTemplate[] {
  // All special sections are now included in templateSections via MASTER_SECTIONS
  // No need for separate specialSections or trailingSections arrays
  
  // Add icons to all sections
  const sectionsWithIcons = templateSections.map(section => ({
    ...section,
    icon: section.icon || '🧾' // Default icon for sections without specific icons
  }));
  
  return sectionsWithIcons;
}

/**
 * Get section icon by section ID
 * Maps section IDs to appropriate emoji icons
 * 
 * @param sectionId - Section identifier
 * @returns Emoji icon string
 */
export function getSectionIcon(sectionId: string): string {
  const iconMap: Record<string, string> = {
    [METADATA_SECTION_ID]: '📕',
    [ANCILLARY_SECTION_ID]: '📑',
    [REFERENCES_SECTION_ID]: '📚',
    'tables_data': '📊',
    'figures_images': '🖼️',
    [APPENDICES_SECTION_ID]: '📎',
    // Default for regular sections
    'default': '🧾'
  };
  
  return iconMap[sectionId] || iconMap['default'];
}

/**
 * Check if section is a special section
 * 
 * @param sectionId - Section identifier
 * @returns boolean indicating if it's a special section
 */
export function isSpecialSection(sectionId: string): boolean {
  return [
    METADATA_SECTION_ID,
    ANCILLARY_SECTION_ID,
    REFERENCES_SECTION_ID,
    APPENDICES_SECTION_ID,
    'tables_data',
    'figures_images'
  ].includes(sectionId);
}
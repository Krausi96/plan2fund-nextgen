import { 
  METADATA_SECTION_ID, 
  ANCILLARY_SECTION_ID, 
  REFERENCES_SECTION_ID, 
  APPENDICES_SECTION_ID 
} from '../constants';
import type { SectionTemplate } from '../types/types';
import type { DocumentStructure } from '../types/Program-Types';
import type { Translations } from '@/shared/contexts/I18nContext';

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
  
  console.log('🔍 enhanceWithSpecialSections input sections:', documentStructure.sections?.length, documentStructure.sections?.map(s => s.id));
  console.log('🔍 enhanceWithSpecialSections input documents:', documentStructure.documents);
  console.log('🔍 enhanceWithSpecialSections input full structure:', JSON.stringify(documentStructure, null, 2));
  
  // Convert template sections if needed
  const baseSections = Array.isArray(documentStructure.sections) 
    ? documentStructure.sections.map(section => 
        typeof section === 'object' && 'id' in section && 'title' in section
          ? section
          : convertSectionTemplate(section as unknown as SectionTemplate)
      )
    : [];
  
  console.log('🔄 baseSections after conversion:', baseSections.length, baseSections.map(s => s.id));
  
  // Create special sections in correct order
  const leadingSpecialSections = [
    {
      id: METADATA_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.metadata' as any) || 'Title Page',
      type: 'required' as const,
      required: true,
      programCritical: false,
      icon: '📕'
    },
    {
      id: ANCILLARY_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.ancillary' as any) || 'Table of Contents',
      type: 'required' as const,
      required: true,
      programCritical: false,
      icon: '📑'
    }
  ];
  
  const trailingSpecialSections = [
    {
      id: REFERENCES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.references' as any) || 'References',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📚'
    },
    {
      id: 'tables_data',
      documentId: 'main_document',
      title: t('editor.desktop.program.document.tablesData' as any) || 'Tables/Data',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📊'
    },
    {
      id: 'figures_images',
      documentId: 'main_document',
      title: t('editor.desktop.program.document.figuresImages' as any) || 'Figures/Images',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '🖼️'
    },
    {
      id: APPENDICES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.appendices' as any) || 'Appendices',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📎'
    }
  ];
  
  console.log('✨ leadingSpecialSections created:', leadingSpecialSections.map(s => ({id: s.id, title: s.title})));
  console.log('✨ trailingSpecialSections created:', trailingSpecialSections.map(s => ({id: s.id, title: s.title})));
  
  const result = {
    ...documentStructure,
    sections: [
      ...leadingSpecialSections,
      ...baseSections,
      ...trailingSpecialSections
    ]
  };
  
  console.log('✅ Final enhanced sections:', result.sections.length, result.sections.map(s => ({id: s.id, title: s.title})));
  console.log('✅ Final enhanced documents:', result.documents);
  console.log('✅ Final enhanced full structure:', JSON.stringify(result, null, 2));
  
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
  templateSections: SectionTemplate[], 
  t: TranslationFunction
): SectionTemplate[] {
  // Define special sections with proper metadata
  const specialSections: SectionTemplate[] = [
    {
      id: METADATA_SECTION_ID,
      title: t('editor.section.metadata' as any) || 'Title Page',
      description: 'Document title page with company information',
      required: true,
      category: 'general',
      origin: 'template',
      icon: '📕'
    },
    {
      id: ANCILLARY_SECTION_ID,
      title: t('editor.section.ancillary' as any) || 'Table of Contents',
      description: 'Automatically generated table of contents',
      required: true,
      category: 'general',
      origin: 'template',
      icon: '📑'
    }
  ];

  // Add template sections in the middle
  const mainSections = templateSections.map(section => ({
    ...section,
    icon: '🧾' // Default icon for regular sections
  }));

  // Add trailing special sections
  const trailingSections: any[] = [
    {
      id: REFERENCES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.references' as any) || 'References',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📚'
    },
    {
      id: 'tables_data',
      documentId: 'main_document',
      title: t('editor.desktop.program.document.tablesData' as any) || 'Tables/Data',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📊'
    },
    {
      id: 'figures_images',
      documentId: 'main_document',
      title: t('editor.desktop.program.document.figuresImages' as any) || 'Figures/Images',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '🖼️'
    },
    {
      id: APPENDICES_SECTION_ID,
      documentId: 'main_document',
      title: t('editor.section.appendices' as any) || 'Appendices',
      type: 'optional' as const,
      required: false,
      programCritical: false,
      icon: '📎'
    }
  ];

  return [
    ...specialSections,
    ...mainSections,
    ...trailingSections
  ];
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
    APPENDICES_SECTION_ID
  ].includes(sectionId);
}
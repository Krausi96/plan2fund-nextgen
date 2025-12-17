/**
 * ============================================================================
 * SECTION BUILDERS
 * ============================================================================
 * 
 * Functions for building sections with metadata for different views.
 * 
 * USED BY:
 *   - Selectors (useEditorSelectors.ts)
 *   - Components that need section lists (Sidebar, Configurator, etc.)
 * ============================================================================
 */

import type { PlanSection, SectionTemplate } from '../types/types';
import type { SectionWithMetadata } from './editorStore';
import { isSpecialSectionId, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '../constants/editorConstants';

export type { SectionWithMetadata } from './editorStore';

type BuildSectionsForSidebarParams = {
  planSections?: PlanSection[] | null;
  allSections: SectionTemplate[];
  disabledSectionIds: string[];
  filteredSectionIds?: string[] | null;
  selectedProduct?: string | null;
  isNewUser?: boolean;
  getTitle: (sectionId: string, originalTitle: string) => string;
};

/**
 * Build sections list for sidebar navigation view.
 * 
 * Combines plan sections with template sections, applies disabled state,
 * and handles special cases for new users. Used by Sidebar component.
 * 
 * @param params - Configuration object
 * @param params.planSections - Sections from current plan (optional)
 * @param params.allSections - All available section templates
 * @param params.disabledSectionIds - IDs of disabled sections
 * @param params.filteredSectionIds - Optional filter for specific section IDs
 * @param params.isNewUser - If `true`, only shows plan sections
 * @param params.getTitle - Function to get translated section title
 * @returns Array of sections with metadata (id, title, isDisabled, origin, etc.)
 * 
 * @example
 * ```tsx
 * const sections = buildSectionsForSidebar({
 *   planSections: plan.sections,
 *   allSections: templates,
 *   disabledSectionIds: ['section-1'],
 *   isNewUser: false,
 *   getTitle: (id, title) => getSectionTitle(id, title, t)
 * });
 * ```
 */
export function buildSectionsForSidebar(params: BuildSectionsForSidebarParams): SectionWithMetadata[] {
  const {
    planSections = [],
    allSections,
    disabledSectionIds,
    filteredSectionIds,
    isNewUser = false,
    getTitle
  } = params;

  if (isNewUser || !allSections.length) {
    return (planSections || []).map(section => ({
      id: section.id,
      title: getTitle(section.id, section.title),
      isDisabled: disabledSectionIds.includes(section.id),
      origin: 'template' as const,
      isSpecial: isSpecialSectionId(section.id),
      required: false
    }));
  }

  const sections: SectionWithMetadata[] = [];
  const processedIds = new Set<string>();

  // Add plan sections first
  (planSections || []).forEach(section => {
    if (!filteredSectionIds || filteredSectionIds.includes(section.id)) {
      const template = allSections.find(s => s.id === section.id);
      sections.push({
        id: section.id,
        title: getTitle(section.id, section.title),
        isDisabled: disabledSectionIds.includes(section.id),
        origin: template?.origin || 'template',
        isSpecial: isSpecialSectionId(section.id),
        required: template?.required ?? false
      });
      processedIds.add(section.id);
    }
  });

  // Add template sections not in plan
  allSections.forEach(template => {
    if (!processedIds.has(template.id)) {
      if (!filteredSectionIds || filteredSectionIds.includes(template.id)) {
        sections.push({
          id: template.id,
          title: getTitle(template.id, template.title),
          isDisabled: disabledSectionIds.includes(template.id),
          origin: template.origin || 'template',
          isSpecial: isSpecialSectionId(template.id),
          required: template.required ?? false
        });
      }
    }
  });

  return sections;
}

/**
 * Calculate section counts (enabled and total).
 * 
 * Counts how many sections are enabled (not disabled) and total count.
 * Used to display counts in UI (e.g., "Sections (5/10)").
 * 
 * @param allSections - All available section templates
 * @param disabledSectionIds - IDs of disabled sections
 * @returns Object with `enabledCount` and `totalCount`
 * 
 * @example
 * ```tsx
 * const counts = getSectionCounts(allSections, ['section-1', 'section-2']);
 * // Returns: { enabledCount: 8, totalCount: 10 }
 * 
 * <span>Sections ({counts.enabledCount}/{counts.totalCount})</span>
 * ```
 */
export function getSectionCounts(
  allSections: SectionTemplate[],
  disabledSectionIds: string[]
): { enabledCount: number; totalCount: number } {
  return {
    enabledCount: allSections.filter(section => !disabledSectionIds.includes(section.id)).length,
    totalCount: allSections.length
  };
}

type BuildSectionsForConfigParams = {
  allSections: SectionTemplate[];
  disabledSectionIds: string[];
  includeAncillary?: boolean;
  includeReferences?: boolean;
  includeAppendices?: boolean;
  getTitle: (sectionId: string, originalTitle: string) => string;
};

/**
 * Build sections list for configuration/management view.
 * 
 * Combines normal sections with special sections (ancillary, references, appendices)
 * in correct order. Used in SectionsDocumentsManagement component.
 * 
 * @param params - Configuration object
 * @param params.allSections - All available section templates
 * @param params.disabledSectionIds - IDs of disabled sections
 * @param params.includeAncillary - Include ancillary section (table of contents)
 * @param params.includeReferences - Include references section
 * @param params.includeAppendices - Include appendices section
 * @param params.getTitle - Function to get translated section title
 * @returns Array of sections with metadata, filtered and ordered
 * 
 * @example
 * ```tsx
 * const sections = buildSectionsForConfig({
 *   allSections: templates,
 *   disabledSectionIds: [],
 *   includeAncillary: true,
 *   includeReferences: true,
 *   includeAppendices: true,
 *   getTitle: (id, title) => getSectionTitle(id, title, t)
 * });
 * ```
 */
export function buildSectionsForConfig(params: BuildSectionsForConfigParams): SectionWithMetadata[] {
  const {
    allSections,
    disabledSectionIds,
    includeAncillary = false,
    includeReferences = false,
    includeAppendices = false,
    getTitle
  } = params;

  return allSections
    .filter(section => {
      if (section.id === ANCILLARY_SECTION_ID && !includeAncillary) return false;
      if (section.id === REFERENCES_SECTION_ID && !includeReferences) return false;
      if (section.id === APPENDICES_SECTION_ID && !includeAppendices) return false;
      return true;
    })
    .map(section => ({
      id: section.id,
      title: getTitle(section.id, section.title),
      isDisabled: disabledSectionIds.includes(section.id),
      origin: section.origin || 'template',
      isSpecial: isSpecialSectionId(section.id),
      required: section.required ?? false
    }));
}

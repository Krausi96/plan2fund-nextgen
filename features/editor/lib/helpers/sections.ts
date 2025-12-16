/**
 * CENTRALIZED SECTION LOGIC
 * 
 * This module provides a single source of truth for:
 * - What sections exist (normal + special)
 * - How they are ordered
 * - Which are enabled/disabled
 * - Section metadata (origin, required, etc.)
 */

import type { SectionTemplate } from '@templates';
import type { BusinessPlan } from '@/features/editor/lib/types';

// ============================================================================
// SPECIAL SECTION IDS
// ============================================================================

export const METADATA_SECTION_ID = 'metadata';
export const ANCILLARY_SECTION_ID = 'ancillary';
export const REFERENCES_SECTION_ID = 'references';
export const APPENDICES_SECTION_ID = 'appendices';

export const SPECIAL_SECTION_IDS = [
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
] as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSpecialSectionId(sectionId: string): boolean {
  return SPECIAL_SECTION_IDS.includes(sectionId as any);
}

export function isMetadataSection(sectionId: string): boolean {
  return sectionId === METADATA_SECTION_ID;
}

export function isAncillarySection(sectionId: string): boolean {
  return sectionId === ANCILLARY_SECTION_ID;
}

export function isReferencesSection(sectionId: string): boolean {
  return sectionId === REFERENCES_SECTION_ID;
}

export function isAppendicesSection(sectionId: string): boolean {
  return sectionId === APPENDICES_SECTION_ID;
}

// ============================================================================
// SECTION TITLE HELPERS
// ============================================================================

type TranslationFunction = (key: any) => string;

/**
 * Gets the translated title for a special section
 */
export function getSpecialSectionTitleFromT(
  t: TranslationFunction,
  sectionId: string
): string {
  const keyMap: Record<string, string> = {
    [METADATA_SECTION_ID]: 'editor.section.metadata.title',
    [ANCILLARY_SECTION_ID]: 'editor.section.ancillary.title',
    [REFERENCES_SECTION_ID]: 'editor.section.references.title',
    [APPENDICES_SECTION_ID]: 'editor.section.appendices.title',
  };

  const key = keyMap[sectionId];
  if (!key) return sectionId;

  const translated = t(key as any);
  return translated !== key ? translated : sectionId;
}

/**
 * Gets the translated title for any section
 */
export function getSectionTitle(
  sectionId: string,
  originalTitle: string,
  t: TranslationFunction
): string {
  // Special sections use special title helper
  if (isSpecialSectionId(sectionId)) {
    return getSpecialSectionTitleFromT(t, sectionId);
  }

  // Try translation key pattern
  if (originalTitle.startsWith('editor.section.')) {
    const translated = t(originalTitle as any) as string;
    return translated || originalTitle;
  }

  // Try section ID translation
  const translationKey = `editor.section.${sectionId}` as any;
  const translated = t(translationKey) as string;
  if (translated === translationKey && originalTitle.startsWith('editor.')) {
    const titleTranslated = t(originalTitle as any) as string;
    return titleTranslated !== originalTitle ? titleTranslated : originalTitle;
  }

  return translated !== translationKey ? translated : originalTitle;
}

// ============================================================================
// SECTION CREATION HELPERS
// ============================================================================

type SectionTitleGetter = (sectionId: string, originalTitle: string) => string;

/**
 * Creates a simplified metadata section object
 */
export function createMetadataSectionSimplified(
  getTitle: SectionTitleGetter
): SectionTemplate {
  return {
    id: METADATA_SECTION_ID,
    title: getTitle(METADATA_SECTION_ID, 'metadata'),
    origin: 'core',
    required: true,
  };
}

/**
 * Creates a simplified ancillary section object
 */
export function createAncillarySectionSimplified(
  getTitle: SectionTitleGetter
): SectionTemplate {
  return {
    id: ANCILLARY_SECTION_ID,
    title: getTitle(ANCILLARY_SECTION_ID, 'ancillary'),
    origin: 'core',
    required: true,
  };
}

/**
 * Creates a simplified references section object
 */
export function createReferencesSectionSimplified(
  getTitle: SectionTitleGetter
): SectionTemplate {
  return {
    id: REFERENCES_SECTION_ID,
    title: getTitle(REFERENCES_SECTION_ID, 'references'),
    origin: 'core',
    required: true,
  };
}

/**
 * Creates a simplified appendices section object
 */
export function createAppendicesSectionSimplified(
  getTitle: SectionTitleGetter
): SectionTemplate {
  return {
    id: APPENDICES_SECTION_ID,
    title: getTitle(APPENDICES_SECTION_ID, 'appendices'),
    origin: 'core',
    required: true,
  };
}

// ============================================================================
// SECTION ORDERING & COMBINATION
// ============================================================================

export interface BuildSectionsOptions {
  allSections: SectionTemplate[];
  planSections?: BusinessPlan['sections'];
  disabledSectionIds: string[];
  filteredSectionIds?: string[] | null;
  selectedProduct?: string | null;
  isNewUser?: boolean;
  includeAncillary?: boolean;
  includeReferences?: boolean;
  includeAppendices?: boolean;
  getTitle: SectionTitleGetter;
}

export interface SectionWithMetadata extends SectionTemplate {
  isSpecial: boolean;
  isEnabled: boolean;
  isDisabled: boolean;
}

/**
 * Builds sections for configuration view
 * Combines normal sections with special sections in correct order
 */
export function buildSectionsForConfig(
  options: BuildSectionsOptions
): SectionWithMetadata[] {
  const {
    allSections,
    disabledSectionIds,
    includeAncillary = true,
    includeReferences = true,
    includeAppendices = true,
    getTitle,
  } = options;

  const disabledSet = new Set(disabledSectionIds);

  // Create special sections
  const metadataSection = createMetadataSectionSimplified(getTitle);
  const specialSections: SectionTemplate[] = [metadataSection];

  if (includeAncillary) {
    specialSections.push(createAncillarySectionSimplified(getTitle));
  }

  // Normal sections (from templates)
  const normalSections = [...allSections];

  if (includeReferences) {
    specialSections.push(createReferencesSectionSimplified(getTitle));
  }
  if (includeAppendices) {
    specialSections.push(createAppendicesSectionSimplified(getTitle));
  }

  // Combine: metadata, [ancillary], normal sections, [references], [appendices]
  const combined: SectionTemplate[] = [
    metadataSection,
    ...(includeAncillary ? [createAncillarySectionSimplified(getTitle)] : []),
    ...normalSections,
    ...(includeReferences ? [createReferencesSectionSimplified(getTitle)] : []),
    ...(includeAppendices ? [createAppendicesSectionSimplified(getTitle)] : []),
  ];

  // Add metadata and return
  return combined.map((section) => ({
    ...section,
    isSpecial: isSpecialSectionId(section.id),
    isEnabled: !disabledSet.has(section.id),
    isDisabled: disabledSet.has(section.id),
  }));
}

/**
 * Builds sections for sidebar view
 * Handles core product vs additional document logic
 */
export function buildSectionsForSidebar(
  options: BuildSectionsOptions
): SectionWithMetadata[] {
  const {
    planSections = [],
    allSections,
    disabledSectionIds,
    filteredSectionIds,
    selectedProduct,
    isNewUser = false,
    getTitle,
  } = options;

  if (isNewUser) return [];

  const disabledSet = new Set(disabledSectionIds);
  const hasNoProduct = !selectedProduct;
  const isAdditionalDocument =
    filteredSectionIds &&
    filteredSectionIds.includes(METADATA_SECTION_ID) &&
    filteredSectionIds.length >= 1;

  // Filter plan sections to show
  const planSectionsToShow =
    filteredSectionIds === null || filteredSectionIds === undefined
      ? planSections
      : planSections.filter((section) => filteredSectionIds.includes(section.id));

  // Create metadata section
  const metadataSection = createMetadataSectionSimplified(getTitle);

  // Map document sections with template info
  const documentSections = planSectionsToShow.map((section) => {
    const templateInfo = allSections.find((s) => s.id === section.id);
    return {
      ...section,
      title: getTitle(section.id, section.title),
      origin: templateInfo?.origin || section.origin,
      required: templateInfo?.required ?? section.required ?? false,
    };
  });

  // For additional documents or no product, return metadata + document sections only
  if (isAdditionalDocument || hasNoProduct) {
    return [
      { ...metadataSection, isSpecial: true, isEnabled: !disabledSet.has(metadataSection.id), isDisabled: disabledSet.has(metadataSection.id) },
      ...documentSections.map((section) => ({
        ...section,
        isSpecial: false,
        isEnabled: !disabledSet.has(section.id),
        isDisabled: disabledSet.has(section.id),
      })),
    ];
  }

  // For core product, include all special sections
  const ancillarySection = createAncillarySectionSimplified(getTitle);
  const referencesSection = createReferencesSectionSimplified(getTitle);
  const appendicesSection = createAppendicesSectionSimplified(getTitle);

  return [
    { ...metadataSection, isSpecial: true, isEnabled: !disabledSet.has(metadataSection.id), isDisabled: disabledSet.has(metadataSection.id) },
    { ...ancillarySection, isSpecial: true, isEnabled: !disabledSet.has(ancillarySection.id), isDisabled: disabledSet.has(ancillarySection.id) },
    ...documentSections.map((section) => ({
      ...section,
      isSpecial: false,
      isEnabled: !disabledSet.has(section.id),
      isDisabled: disabledSet.has(section.id),
    })),
    { ...referencesSection, isSpecial: true, isEnabled: !disabledSet.has(referencesSection.id), isDisabled: disabledSet.has(referencesSection.id) },
    { ...appendicesSection, isSpecial: true, isEnabled: !disabledSet.has(appendicesSection.id), isDisabled: disabledSet.has(appendicesSection.id) },
  ];
}

/**
 * Combines section templates with special sections (legacy helper for migration)
 */
export function combineSectionTemplatesWithSpecial(
  allSections: SectionTemplate[],
  t: TranslationFunction,
  includeAncillary = true,
  includeReferences = true,
  includeAppendices = true
): SectionTemplate[] {
  const getTitle: SectionTitleGetter = (sectionId, originalTitle) =>
    getSectionTitle(sectionId, originalTitle, t);

  const result = buildSectionsForConfig({
    allSections,
    disabledSectionIds: [],
    includeAncillary,
    includeReferences,
    includeAppendices,
    getTitle,
  });

  // Return just the SectionTemplate parts (without metadata)
  return result.map(({ isSpecial, isEnabled, isDisabled, ...section }) => section);
}

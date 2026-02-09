import type { DocumentStructure } from '../../../../../types/types';
import { BUSINESS_PLAN_SECTIONS, STRATEGY_SECTIONS, UPGRADE_SECTIONS } from '@/features/editor/lib/templates';



/**
 * EDITOR MEANING + DOC TYPE + TEMPLATE MATCHING
 * ------------------------------------------------
 * Safe semantic enrichment layer
 * - template aware
 * - detects doc type
 * - suggests missing sections
 * - translation ready
 * - NO structural mutations
 */

export interface MeaningOptions {
  templateSections?: string[];
  language?: string;
  t?: (key: string) => string; // translation function
}

/* =========================================================
   MAIN ENTRY
========================================================= */

export async function enrichSectionsWithMeaning(
  structure: DocumentStructure,
  options: MeaningOptions = {}
): Promise<DocumentStructure> {

  if (!structure?.sections?.length) return structure;

  // Get template sections from actual template data if not provided
  const templateSections = options.templateSections || [
    ...BUSINESS_PLAN_SECTIONS,
    ...STRATEGY_SECTIONS,
    ...UPGRADE_SECTIONS
  ].map(section => section.title);

  const enrichedSections = structure.sections.map((section: any) => {

    const semantic = matchSectionToTemplate(
      section.title || '',
      section.content || '',
      templateSections
    );

    return {
      ...section,
      semantic
    };
  });

  // Since we can't add documentSemantic to DocumentStructure, 
  // we could add it to the warnings array as metadata
  const docType = detectDocumentType(enrichedSections);
  const missing = suggestMissingSections(enrichedSections, templateSections);

  return {
    ...structure,
    sections: enrichedSections,
    warnings: [
      ...(structure.warnings || []),
      `Document Type Detected: ${docType}`,
      ...(missing.length > 0 ? [`Missing Recommended Sections: ${missing.join(', ')}`] : [])
    ]
  };
}

/* =========================================================
   TEMPLATE MATCHING
========================================================= */

function matchSectionToTemplate(
  title: string,
  content: string,
  templateSections: string[]
) {
  const text = (title + ' ' + content.slice(0, 400)).toLowerCase();

  let bestMatch = 'general';
  let bestScore = 0;

  for (const tpl of templateSections) {
    const score = similarity(text, tpl.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tpl;
    }
  }

  if (bestScore > 0.45) {
    return {
      type: bestMatch,
      confidence: Math.min(0.95, bestScore)
    };
  }

  return fallbackMeaning(text);
}

/* =========================================================
   DOCUMENT TYPE DETECTION
========================================================= */

function detectDocumentType(sections: any[]): string {

  let score = {
    business_plan: 0,
    pitch: 0,
    grant: 0,
    general: 0
  };

  for (const s of sections) {

    const t = (s.title + ' ' + (s.content || '').slice(0,200)).toLowerCase();

    if (containsAny(t,['market','financial','revenue','competition']))
      score.business_plan += 2;

    if (containsAny(t,['problem','solution','traction','pitch']))
      score.pitch += 2;

    if (containsAny(t,['funding','grant','impact','proposal']))
      score.grant += 2;
  }

  const best = Object.entries(score).sort((a,b)=>b[1]-a[1])[0];

  if (!best || best[1] === 0) return 'general';
  return best[0];
}

/* =========================================================
   MISSING SECTION SUGGESTIONS
========================================================= */

function suggestMissingSections(
  sections: any[],
  templateSections: string[]
) {

  if (!templateSections?.length) return [];

  const existing = sections.map(s => s.semantic?.type?.toLowerCase());
  return templateSections.filter(t =>
    !existing.some(e => e && e.includes(t.toLowerCase()))
  ).slice(0,6);
}

/* =========================================================
   FALLBACK SEMANTIC MEANING
========================================================= */

function fallbackMeaning(text: string) {

  if (containsAny(text,['financial','revenue','profit','budget']))
    return { type:'financials', confidence:0.7 };
  if (containsAny(text,['market','customer','competition']))
    return { type:'market', confidence:0.7 };

  if (containsAny(text,['team','management','founder']))
    return { type:'team', confidence:0.7 };

  if (containsAny(text,['appendix','anhang','annex']))
    return { type:'appendix', confidence:0.9 };

  if (containsAny(text,['reference','bibliography','quellen']))
    return { type:'references', confidence:0.9 };

  return { type:'general', confidence:0.4 };
}

/* =========================================================
   HELPERS
========================================================= */

function containsAny(text: string, arr: string[]) {
  return arr.some(w => text.includes(w));
}

function similarity(text: string, template: string) {
  const words = template.split(/\s+/);
  let hits = 0;

  for (const w of words) {
    if (text.includes(w)) hits++;
  }

  return hits / words.length;
}
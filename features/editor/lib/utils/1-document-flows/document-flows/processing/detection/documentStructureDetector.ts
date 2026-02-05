/**
 * DOCUMENT STRUCTURE DETECTION — SINGLE PASS
 *
 * One unified structure scan:
 * - Detect headings
 * - Detect structural special sections (TOC, appendix etc.)
 * - Provide fallback chunking
 *
 * NO semantic interpretation
 * NO business/domain guessing
 */

import type { DetectionMap, DetectionResult } from '../../sections/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

/* -------------------------------------------------------
 * CONFIG
 * ----------------------------------------------------- */

const MIN_CHUNK_WORDS = 800;
const MAX_CHUNK_WORDS = 1200;

/* -------------------------------------------------------
 * HELPERS
 * ----------------------------------------------------- */

function toText(content: any): string {
  return typeof content === 'string'
    ? content
    : JSON.stringify(content);
}

function hasAlias(text: string, aliases: string[]) {
  const lower = text.toLowerCase();
  return aliases.some(a => lower.includes(a.toLowerCase()));
}

/* -------------------------------------------------------
 * MAIN STRUCTURE PASS
 * ----------------------------------------------------- */

export function detectDocumentStructure(content: any): DetectionMap {
  const result: DetectionMap = {};
  const text = toText(content);

  /* -----------------------------
   * HEADINGS
   * --------------------------- */

  result['heading-numbered-patterns'] = detectNumberedHeadings(text);
  result['heading-styling-cues'] = detectStylingHeadings(text);

  /* -----------------------------
   * SPECIAL STRUCTURAL SECTIONS
   * --------------------------- */

  result[METADATA_SECTION_ID] = detectTitlePage(text);
  result[ANCILLARY_SECTION_ID] = detectTOC(text);
  result[REFERENCES_SECTION_ID] = detectReferences(text);
  result[APPENDICES_SECTION_ID] = detectAppendices(text);
  result[TABLES_DATA_SECTION_ID] = detectTables(text);
  result[FIGURES_IMAGES_SECTION_ID] = detectFigures(text);
  result['special-section-executive-summary'] = detectExecutiveSummary(text);

  /* -----------------------------
   * FALLBACK CHUNKING
   * --------------------------- */

  const hasHeadings =
    result['heading-numbered-patterns'].found ||
    result['heading-styling-cues'].found;

  if (!hasHeadings) {
    result['fallback-chunks'] = generateFallbackChunks(text);
  }

  return result;
}

/* =======================================================
   HEADING DETECTION (STRUCTURE ONLY)
======================================================= */

function detectNumberedHeadings(text: string): DetectionResult {
  const pattern =
    /^(\d+(\.\d+)*\s+.+|[IVX]+\.\s+.+)/gm;

  const matches = text.match(pattern) || [];

  if (matches.length > 0) {
    return {
      found: true,
      confidence: 0.85,
      content: {
        type: 'numbered_headings',
        matches: matches.slice(0, 10)
      }
    };
  }

  return { found: false, confidence: 0.1 };
}

function detectStylingHeadings(text: string): DetectionResult {
  const lines = text.split(/\r?\n/);
  const matches: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const words = t.split(/\s+/).length;

    if (
      words <= 6 &&
      (
        t === t.toUpperCase() ||
        /^[A-ZÄÖÜ][^.!?]{3,60}$/.test(t)
      )
    ) {
      matches.push(t);
    }
  }

  if (matches.length > 3) {
    return {
      found: true,
      confidence: 0.65,
      content: {
        type: 'styling_headings',
        matches: matches.slice(0, 10)
      }
    };
  }

  return { found: false, confidence: 0.1 };
}

/* =======================================================
   SPECIAL STRUCTURE SECTIONS
======================================================= */

function detectTitlePage(text: string): DetectionResult {
  const lower = text.toLowerCase();

  if (
    hasAlias(lower, [
      'business plan',
      'geschäftsplan',
      'company',
      'unternehmen',
      'proposal',
      'cover page',
      'title page'
    ]) &&
    !hasAlias(lower, ['table of contents', 'inhaltsverzeichnis'])
  ) {
    return { found: true, confidence: 0.8, content:{ type:'title_page' }};
  }

  return { found:false, confidence:0.1 };
}

function detectTOC(text: string): DetectionResult {
  const lower = text.toLowerCase();

  if (
    hasAlias(lower, ['table of contents','inhaltsverzeichnis','toc']) ||
    /\w+\s*\.{2,}\s*\d+/.test(lower)
  ) {
    return { found:true, confidence:0.9, content:{ type:'toc' }};
  }

  return { found:false, confidence:0.1 };
}

function detectReferences(text: string): DetectionResult {
  if (
    hasAlias(text.toLowerCase(), [
      'references','literatur','bibliography',
      'works cited','sources','quellen'
    ])
  ) {
    return { found:true, confidence:0.85, content:{ type:'references' }};
  }

  return { found:false, confidence:0.1 };
}

function detectAppendices(text: string): DetectionResult {
  const lower = text.toLowerCase();

  if (
    hasAlias(lower,['appendix','appendices','anhang','annex','anlage']) ||
    /(appendix|anhang|anlage)\s+[a-z\d]/i.test(lower)
  ) {
    return { found:true, confidence:0.85, content:{ type:'appendices' }};
  }

  return { found:false, confidence:0.1 };
}

function detectTables(text: string): DetectionResult {
  const lower = text.toLowerCase();

  if (
    hasAlias(lower,['tables','tabellen']) ||
    /(table|tabelle)\s+\d+/i.test(lower)
  ) {
    return { found:true, confidence:0.75, content:{ type:'tables_data' }};
  }

  return { found:false, confidence:0.1 };
}

function detectFigures(text: string): DetectionResult {
  const lower = text.toLowerCase();

  if (
    hasAlias(lower,['figures','abbildungen','charts','graphs']) ||
    /(figure|abbildung|fig)\s+\d+/i.test(lower)
  ) {
    return { found:true, confidence:0.75, content:{ type:'figures_images' }};
  }

  return { found:false, confidence:0.1 };
}

function detectExecutiveSummary(text: string): DetectionResult {
  const lower = text.toLowerCase();
  const idx = lower.indexOf('executive summary');

  if (idx !== -1 && idx < lower.length * 0.25) {
    return {
      found:true,
      confidence:0.8,
      content:{ type:'executive_summary' }
    };
  }

  return { found:false, confidence:0.1 };
}

/* =======================================================
   FALLBACK CHUNKING
======================================================= */

function generateFallbackChunks(text: string): DetectionResult {
  const words = text.split(/\s+/);

  if (words.length < MIN_CHUNK_WORDS) {
    return {
      found:true,
      confidence:0.6,
      content:{
        type:'fallback_chunks',
        chunks:[{ title:'Section 1', content:text }]
      }
    };
  }

  const chunks:any[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + MAX_CHUNK_WORDS, words.length);

    chunks.push({
      title:`Section ${chunks.length+1}`,
      content: words.slice(start,end).join(' ')
    });

    start = end;
  }

  return {
    found:true,
    confidence:0.6,
    content:{ type:'fallback_chunks', chunks }
  };
}
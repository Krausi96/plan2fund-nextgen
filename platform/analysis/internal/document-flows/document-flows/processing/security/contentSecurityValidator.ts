import DOMPurify from 'isomorphic-dompurify';

/**
 * SIMPLE + SAFE SECURITY VALIDATOR
 * - Remove dangerous HTML / scripts
 * - Prevent extreme payloads
 * - Light prompt injection detection (flag only)
 * - No over-engineering / no noisy heuristics
 */

export interface SecurityValidationResult {
  isValid: boolean;
  shouldReject: boolean;
  sanitizedContent: string;
  warnings: string[];
  confidence: number;
  promptInjectionWarning?: boolean;
}

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOKEN = 1000;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
const CONTROL = /[\x00-\x1F\x7F-\x9F]/g;

/* =========================================================
   MAIN VALIDATOR
========================================================= */

export function validateDocumentContent(
  content: string,
  title?: string
): SecurityValidationResult {

  const warnings: string[] = [];
  let reject = false;
  let promptInjectionWarning = false;

  if (!content || typeof content !== 'string') {
    // Empty content is valid - sections without headings are OK
    return {
      isValid: true,
      shouldReject: false,
      sanitizedContent: '',
      warnings: [],
      confidence: 100
    };
  }

  /* ---------- size guard ---------- */
  if (content.length > MAX_DOC_SIZE) {
    reject = true;
    warnings.push('Document too large');
  }

  /* ---------- strip invisible ---------- */
  let cleaned = content
    .replace(ZERO_WIDTH, '')
    .replace(CONTROL, '');

  /* ---------- trim extreme tokens ---------- */
  cleaned = cleaned
    .split(/\s+/)
    .map(t => t.length > MAX_TOKEN ? t.slice(0, MAX_TOKEN) : t)
    .join(' ');

  /* ---------- executable detection ---------- */
  if (/<script|javascript:|<iframe|<object|<embed/i.test(cleaned)) {
    reject = true;
    warnings.push('Executable HTML detected');
  }

  if (/on\w+\s*=|<form|srcdoc=/i.test(cleaned)) {
    reject = true;
    warnings.push('Inline script handlers detected');
  }

  /* ---------- prompt injection (flag only) ---------- */
  if (
    /(ignore previous instructions|system override|bypass security|disable safety)/i
      .test(cleaned + ' ' + (title || ''))
  ) {
    promptInjectionWarning = true;
    warnings.push('Possible prompt injection');
  }

  /* ---------- sanitize html ---------- */
  let sanitized = cleaned;

  if (!reject && /<[^>]+>/.test(cleaned)) {
    sanitized = DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS: [
        'p','br','strong','em','u','s',
        'h1','h2','h3','h4','h5','h6',
        'ul','ol','li','blockquote',
        'table','thead','tbody','tr','th','td',
        'a','img','figure','figcaption',
        'pre','code','div','span'
      ],
      ALLOWED_ATTR: [
        'href','target','rel','src','alt',
        'title','width','height','colspan','rowspan'
      ],
      FORBID_TAGS: ['script','iframe','object','embed','form'],
      FORBID_ATTR: ['onerror','onload','onclick','style','srcdoc']
    });
  }

  /* ---------- final ---------- */

  if (reject) {
    return {
      isValid: false,
      shouldReject: true,
      sanitizedContent: 'Removed for security reasons',
      warnings,
      confidence: 0,
      promptInjectionWarning
    };
  }

  const confidence = Math.max(60, 100 - warnings.length * 5);

  return {
    isValid: true,
    shouldReject: false,
    sanitizedContent: sanitized,
    warnings,
    confidence,
    promptInjectionWarning
  };
}

/**
 * Detects if content has multiple sections without titles
 * Used to determine if manual split is needed
 */
export function detectMultipleSectionsWithoutTitles(content: string): boolean {
  // Look for patterns that suggest multiple untitled sections
  const sectionMarkers = content.match(/^[\-\*]\s+(.+)$/gm);
  const numberedItems = content.match(/^\d+\.\s+(.+)$/gm);
  
  // If we have multiple bullet points or numbered items with short content,
  // it might indicate multiple untitled sections
  const hasManyShortItems = (sectionMarkers && sectionMarkers.length > 5) || 
                           (numberedItems && numberedItems.length > 5);
  
  if (hasManyShortItems) {
    // Check if the content seems to lack proper headings
    const headingPattern = /^(#+\s+|\d+\.\s+|[A-Z][A-Z\s&]+:?)$/gm;
    const headings = content.match(headingPattern);
    
    // If there are many items but few proper headings, 
    // it might need manual splitting
    if (headings && headings.length < 3) {
      return true;
    }
  }
  
  return false;
}

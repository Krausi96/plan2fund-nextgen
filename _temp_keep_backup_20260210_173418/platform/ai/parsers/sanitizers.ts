/**
 * OUTPUT SANITIZERS
 * LLM response sanitization
 * Consolidates: blueprintUtils.ts sanitization functions
 */

/**
 * Sanitize blueprint data for safe use
 * Removes potentially unsafe properties
 */
export function sanitizeBlueprint(blueprint: any): Record<string, any> {
  if (!blueprint || typeof blueprint !== 'object') {
    return {};
  }

  const sanitized: Record<string, any> = {};

  // Whitelist safe properties
  if (blueprint.sections && Array.isArray(blueprint.sections)) {
    sanitized.sections = blueprint.sections.map((s: any) => ({
      sectionId: String(s.sectionId || '').slice(0, 100),
      title: String(s.title || '').slice(0, 200),
      requirements: Array.isArray(s.requirements) ? s.requirements.slice(0, 50) : [],
      aiPrompt: String(s.aiPrompt || '').slice(0, 2000),
      checklist: Array.isArray(s.checklist) ? s.checklist.slice(0, 20) : [],
      difficulty: ['easy', 'medium', 'hard'].includes(s.difficulty) ? s.difficulty : 'medium',
    }));
  }

  if (blueprint.validation && typeof blueprint.validation === 'object') {
    sanitized.validation = blueprint.validation;
  }

  if (blueprint.guidance && Array.isArray(blueprint.guidance)) {
    sanitized.guidance = blueprint.guidance.slice(0, 50);
  }

  if (blueprint.diagnostics && typeof blueprint.diagnostics === 'object') {
    sanitized.diagnostics = {
      confidence: Number(blueprint.diagnostics.confidence) || 0,
      warnings: Array.isArray(blueprint.diagnostics.warnings) ? blueprint.diagnostics.warnings.slice(0, 20) : [],
      suggestions: Array.isArray(blueprint.diagnostics.suggestions) ? blueprint.diagnostics.suggestions.slice(0, 20) : [],
    };
  }

  return sanitized;
}

/**
 * Sanitize program data for safe use
 */
export function sanitizeProgram(program: any): Record<string, any> {
  if (!program || typeof program !== 'object') {
    return {};
  }

  return {
    id: String(program.id || '').slice(0, 100),
    name: String(program.name || '').slice(0, 300),
    description: String(program.description || '').slice(0, 1000),
    url: String(program.url || '').slice(0, 500),
    location: String(program.location || '').slice(0, 100),
    funding_types: Array.isArray(program.funding_types) ? program.funding_types.filter((t: any) => typeof t === 'string').slice(0, 10) : [],
    funding_amount_min: Number(program.funding_amount_min) || 0,
    funding_amount_max: Number(program.funding_amount_max) || 0,
    currency: String(program.currency || 'EUR').slice(0, 10),
  };
}

/**
 * Sanitize HTML/script in text content
 */
export function sanitizeText(text: string, maxLength: number = 5000): string {
  if (typeof text !== 'string') {
    return '';
  }

  // Remove script tags and dangerous attributes
  let sanitized = text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

  // Truncate if too long
  return sanitized.slice(0, maxLength);
}

/**
 * Validate and sanitize JSON structure
 */
export function sanitizeJSON(obj: any, maxDepth: number = 5, currentDepth: number = 0): any {
  if (currentDepth > maxDepth) {
    return null;
  }

  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj, 2000);
  }

  if (typeof obj === 'number') {
    return Number.isFinite(obj) ? obj : 0;
  }

  if (typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJSON(item, maxDepth, currentDepth + 1)).filter((item) => item !== null);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && typeof key === 'string' && key.length < 100) {
        const value = sanitizeJSON(obj[key], maxDepth, currentDepth + 1);
        if (value !== null) {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  return null;
}

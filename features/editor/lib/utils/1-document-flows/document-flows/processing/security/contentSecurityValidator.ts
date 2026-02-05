import DOMPurify from 'isomorphic-dompurify';

// Define constants for security validation
const MAX_TOKEN_LENGTH = 1000; // Maximum length for a single token to prevent overflows
const MAX_REPEAT_SEQUENCE = 100; // Maximum allowed repeated characters

// Define patterns for zero-width and non-printing Unicode characters
const ZERO_WIDTH_CHARS_REGEX = /[\u200B-\u200D\uFEFF]/g; // Zero-width space, zero-width non-joiner, zero-width joiner, zero-width no-break space
const NON_PRINTING_UNICODE_REGEX = /[\x00-\x1F\x7F-\x9F]/g; // Control characters and C1 control codes
const BASE64_EMBEDDED_REGEX = /(?:^|\s)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?(?:\s|$)/g; // Basic base64 pattern

/**
 * Security validation results for document content
 */
export interface SecurityValidationResult {
  isValid: boolean;
  hardRejections: string[];
  softWarnings: string[];
  sanitizedContent: string;
  shouldReject: boolean;
  confidence: number;
  promptInjectionWarning?: boolean; // Flag to indicate if prompt injection was detected
}

/**
 * Comprehensive security validation for document content
 * Implements both hard rejection and soft handling strategies
 */
export function validateDocumentContent(
  content: string, 
  title?: string
): SecurityValidationResult {
  const hardRejections: string[] = [];
  const softWarnings: string[] = [];
  let promptInjectionWarning = false;
  
  // Enforce file size limits at high level
  if (content.length > 10 * 1024 * 1024) { // 10MB in characters
    hardRejections.push('Content exceeds maximum size limit of 10 MB');
  }
  
  // Strip invisible or malicious content
  let processedContent = stripInvisibleAndMaliciousContent(content);
  
  // Hard reject checks (immediate rejection)
  const executableCodeFound = detectExecutableCode(processedContent, title);
  if (executableCodeFound.length > 0) {
    hardRejections.push(...executableCodeFound);
  }
  
  const promptInjectionFound = detectPromptInjection(processedContent, title);
  if (promptInjectionFound.length > 0) {
    hardRejections.push(...promptInjectionFound);
    promptInjectionWarning = true; // Set flag when prompt injection is detected
  }
  
  const hiddenMarkupFound = detectHiddenMarkup(processedContent, title);
  if (hiddenMarkupFound.length > 0) {
    hardRejections.push(...hiddenMarkupFound);
  }
  
  const malwareExploitsFound = detectMalwareExploits(processedContent, title);
  if (malwareExploitsFound.length > 0) {
    hardRejections.push(...malwareExploitsFound);
  }
  
  // Soft handle checks (warnings but allow)
  const badWritingFound = detectBadWriting(processedContent);
  if (badWritingFound.length > 0) {
    softWarnings.push(...badWritingFound);
  }
  
  const nonsenseTextFound = detectNonsenseText(processedContent);
  if (nonsenseTextFound.length > 0) {
    softWarnings.push(...nonsenseTextFound);
  }
  
  const qualityIssuesFound = detectQualityIssues(processedContent);
  if (qualityIssuesFound.length > 0) {
    softWarnings.push(...qualityIssuesFound);
  }
  
  // Detect repeated characters (long sequences of repeating characters)
  const repeatedCharsFound = detectRepeatedCharacters(processedContent);
  if (repeatedCharsFound.length > 0) {
    softWarnings.push(...repeatedCharsFound);
  }
  
  // Determine validity based on hard rejections
  const shouldReject = hardRejections.length > 0;
  const isValid = !shouldReject;
  
  // Calculate confidence based on issues found
  const totalIssues = hardRejections.length + softWarnings.length;
  const confidence = Math.max(0, 100 - (totalIssues * 5)); // Each issue reduces confidence by 5%
  
  // Sanitize content if it passes hard rejection checks
  let sanitizedContent = processedContent;
  if (isValid) {
    // Apply DOMPurify only when HTML is present (conditionally)
    if (processedContent.includes('<') && processedContent.includes('>')) {
      sanitizedContent = sanitizeDocumentContent(processedContent);
    } else {
      sanitizedContent = processedContent;
    }
  } else {
    // For hard rejections, replace with security placeholder
    sanitizedContent = 'Removed for security reasons';
  }
  
  return {
    isValid,
    hardRejections,
    softWarnings,
    sanitizedContent,
    shouldReject,
    confidence,
    promptInjectionWarning // Include the flag in the result
  };
}

/**
 * Detect executable code / scripts
 */
function detectExecutableCode(content: string, title?: string): string[] {
  const issues: string[] = [];
  
  // Script tags (various types)
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    issues.push('JavaScript script tag detected');
  }
  
  if (/<iframe[^>]*src\s*=\s*["'][^"']*javascript:/gi.test(content)) {
    issues.push('JavaScript in iframe src attribute detected');
  }
  
  // Event handlers in HTML attributes
  if (/(on\w+\s*=\s*["'][^"']*(javascript:|<|>|script))/gi.test(content)) {
    issues.push('Event handler with JavaScript detected');
  }
  
  // JavaScript protocol in href/src attributes
  if (/href\s*=\s*["']javascript:/gi.test(content) || /src\s*=\s*["']javascript:/gi.test(content)) {
    issues.push('JavaScript protocol in href/src detected');
  }
  
  // VBScript and other executable content
  if (/<embed[^>]*src\s*=\s*["'][^"']*vbscript:/gi.test(content)) {
    issues.push('VBScript in embed tag detected');
  }
  
  if (/<object[^>]*data\s*=\s*["'][^"']*javascript:/gi.test(content)) {
    issues.push('JavaScript in object data attribute detected');
  }
  
  // Check title as well
  if (title) {
    if (/<script/i.test(title)) {
      issues.push('Script tag in title detected');
    }
    if (/javascript:/i.test(title)) {
      issues.push('JavaScript protocol in title detected');
    }
  }
  
  return issues;
}

/**
 * Detect prompt injection attempts
 */
function detectPromptInjection(content: string, title?: string): string[] {
  const issues: string[] = [];
  
  // Common prompt injection phrases
  const injectionPatterns = [
    /ignore\s+(previous|above|earlier)\s+(instructions|commands|input)/gi,
    /disregard\s+(previous|above|earlier)\s+(instructions|commands|input)/gi,
    /forget\s+(previous|above|earlier)\s+(instructions|commands|input)/gi,
    /system\s+override/gi,
    /execute\s+this\s+instead/gi,
    /bypass\s+security/gi,
    /skip\s+validation/gi,
    /disable\s+safety/gi
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(content)) {
      issues.push(`Prompt injection attempt detected: ${pattern.toString()}`);
    }
  }
  
  // Check title as well
  if (title) {
    for (const pattern of injectionPatterns) {
      if (pattern.test(title)) {
        issues.push(`Prompt injection attempt in title detected: ${pattern.toString()}`);
      }
    }
  }
  
  return issues;
}

/**
 * Detect hidden markup / HTML meant to execute
 */
function detectHiddenMarkup(content: string, title?: string): string[] {
  const issues: string[] = [];
  
  // Data URIs with executable content
  if (/data:\s*text\/html/gi.test(content)) {
    issues.push('Data URI with HTML content detected');
  }
  
  if (/data:\s*application\/javascript/gi.test(content)) {
    issues.push('Data URI with JavaScript content detected');
  }
  
  // CSS expressions (potential security risk)
  if (/expression\s*\(/gi.test(content)) {
    issues.push('CSS expression detected (potential security risk)');
  }
  
  // Base64 encoded JavaScript
  if (/(?:^|\s)(?:PHNjcmlwdHxqYXZhc2NyaXB0Onx2YnNjcmlwdDp8ZGF0YTphcHBsaWNhdGlvbi9qYXZhc2NyaXB0)/gi.test(content)) {
    issues.push('Base64 encoded executable content detected');
  }
  
  // Check title as well
  if (title) {
    if (/(expression\s*\()/gi.test(title)) {
      issues.push('CSS expression in title detected');
    }
  }
  
  return issues;
}

/**
 * Detect malware / exploit patterns
 */
function detectMalwareExploits(content: string, title?: string): string[] {
  const issues: string[] = [];
  
  // SQL injection patterns
  if (/(DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|UPDATE.*SET|DELETE\s+FROM)/gi.test(content)) {
    issues.push('SQL injection attempt detected');
  }
  
  // Command injection patterns
  if (/(rm\s+-rf|chmod\s+\d+|chown|sudo|exec\s*\(|eval\s*\()/gi.test(content)) {
    issues.push('Command injection attempt detected');
  }
  
  // Path traversal
  if (/\.\.\/\.\.\//g.test(content)) {
    issues.push('Path traversal attempt detected');
  }
  
  // PHP/Server-side code injection
  if (/<\?(php|=)/gi.test(content)) {
    issues.push('Server-side code injection attempt detected');
  }
  
  // Check title as well
  if (title) {
    if (/(DROP\s+TABLE|UNION\s+SELECT)/gi.test(title)) {
      issues.push('SQL injection attempt in title detected');
    }
    if (/(rm\s+-rf|exec\s*\()/gi.test(title)) {
      issues.push('Command injection attempt in title detected');
    }
  }
  
  return issues;
}

/**
 * Detect bad writing (soft handle)
 */
function detectBadWriting(content: string): string[] {
  const issues: string[] = [];
  
  // Very short content
  if (content.trim().split(/\s+/).length < 5) {
    issues.push('Content is very short (possible placeholder text)');
  }
  
  // Repetitive text
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const repetitiveWords = Object.entries(wordCounts)
    .filter(([word, count]) => count > 10 && word.length > 3) // Words repeated more than 10 times
    .map(([word]) => word);
  
  if (repetitiveWords.length > 0) {
    issues.push(`Repetitive content detected: ${repetitiveWords.slice(0, 3).join(', ')}`);
  }
  
  return issues;
}

/**
 * Detect nonsense text (soft handle)
 */
function detectNonsenseText(content: string): string[] {
  const issues: string[] = [];
  
  // Random character sequences
  if (/[xzqj]{3,}/gi.test(content)) {
    issues.push('Random character sequences detected (possible nonsense text)');
  }
  
  // Repeated character patterns
  if (/(.)\1{5,}/g.test(content)) {
    issues.push('Repeated character patterns detected');
  }
  
  return issues;
}

/**
 * Detect long sequences of repeating characters
 */
function detectRepeatedCharacters(content: string): string[] {
  const issues: string[] = [];
  
  // Check for long sequences of repeating characters (e.g., aaaaaa...)
  const repeatPattern = /(.)\1{5,}/g; // 6 or more repeated characters
  let match;
  while ((match = repeatPattern.exec(content)) !== null) {
    const char = match[1];
    const sequence = match[0];
    if (sequence.length >= MAX_REPEAT_SEQUENCE) {
      issues.push(`Long sequence of repeating characters detected: ${char} repeated ${sequence.length} times`);
    } else if (sequence.length > 10) { // More reasonable threshold for warning
      issues.push(`Long sequence of repeating characters detected: ${char} repeated ${sequence.length} times`);
    }
  }
  
  return issues;
}

/**
 * Detect quality issues (soft handle)
 */
function detectQualityIssues(content: string): string[] {
  const issues: string[] = [];
  
  // All caps text (might indicate shouting or poor formatting)
  const allCapsMatches = content.match(/[A-Z\s]{20,}/g) || [];
  if (allCapsMatches.length > 0) {
    issues.push(`All-caps text detected (${allCapsMatches.length} instances)`);
  }
  
  // Excessive punctuation
  if (/(.)\1{4,}/g.test(content)) {
    issues.push('Excessive repeated punctuation detected');
  }
  
  // Check for missing spaces after periods
  const noSpaceAfterPeriods = content.match(/\w\.[A-Z]/g) || [];
  if (noSpaceAfterPeriods.length > 5) {
    issues.push(`${noSpaceAfterPeriods.length} instances of missing spaces after periods detected`);
  }
  
  return issues;
}

/**
 * Sanitize content using DOMPurify with strict settings
 */
/**
 * Strip invisible or malicious content from text
 */
function stripInvisibleAndMaliciousContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  let cleaned = content;
  
  // Remove zero-width spaces and non-printing Unicode characters
  cleaned = cleaned.replace(ZERO_WIDTH_CHARS_REGEX, '');
  cleaned = cleaned.replace(NON_PRINTING_UNICODE_REGEX, '');
  
  // Remove base64 embedded objects (basic detection)
  // Note: This is a simplified approach - full base64 validation would be more complex
  cleaned = cleaned.replace(BASE64_EMBEDDED_REGEX, (match) => {
    // Check if the match is actually a legitimate base64-like string (e.g., a hash)
    // For now, we'll just check if it's mixed with regular text
    if (match.trim().length > 50 && !/[a-zA-Z0-9+/=]/.test(match)) {
      return ''; // Remove if it looks like a long base64 sequence
    }
    return match; // Keep if it might be legitimate
  });
  
  // Cap token length per section to prevent overflows
  const tokens = cleaned.split(/\s+/);
  const processedTokens = tokens.map(token => {
    if (token.length > MAX_TOKEN_LENGTH) {
      return token.substring(0, MAX_TOKEN_LENGTH); // Truncate long tokens
    }
    return token;
  });
  
  return processedTokens.join(' ');
}

export function sanitizeDocumentContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // First pass: Remove obvious threats
  let cleaned = content;
  
  // Remove script tags and event handlers
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe[^>]*src\s*=\s*["'][^"']*javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*/gi, '');
  
  // Second pass: Use DOMPurify for remaining sanitization
  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption',
      'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 
      'src', 'alt', 'title', 'width', 'height',
      'colspan', 'rowspan'
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['srcdoc', 'data', 'formaction', 'form', 'manifest']
  });
}

/**
 * Check if a document has multiple sections but no clear titles
 */
export function detectMultipleSectionsWithoutTitles(content: string): boolean {
  // Look for patterns that suggest multiple sections without clear titles
  // This could be multiple paragraph blocks, page breaks, or other section indicators
  const paragraphCount = (content.match(/<p[^>]*>/gi) || []).length;
  const pageBreaks = (content.match(/(\f|\x0c|\\f|page-break|seite|pagina)/gi) || []).length;
  const sectionMarkers = (content.match(/(chapter|section|part|abschnitt|teil)\s+\d+/gi) || []).length;
  
  // If there are multiple paragraphs or page breaks but no clear section titles
  return (paragraphCount > 5 || pageBreaks > 0 || sectionMarkers > 0) && 
         !hasClearSectionTitles(content);
}

/**
 * Check if content has clear section titles
 */
function hasClearSectionTitles(content: string): boolean {
  // Look for common section title patterns
  const titlePatterns = [
    /executive\s+summary/i,
    /company\s+overview/i,
    /market\s+analysis/i,
    /financial\s+plan/i,
    /risk\s+assessment/i,
    /team\s+qualifications/i,
    /conclusion/i,
    /introduction/i,
    /methodology/i,
    /results/i,
    /^.*\n(?:={3,}|-{3,})/m,  // Underlined titles
    /<h[1-3][^>]*>.*<\/h[1-3]>/i,  // HTML headings
    /^\s*[A-Z][A-Z\s]+\s*$/gm,  // All caps titles
    /^\s*\d[\d\.\s]*[A-Z].*$/gm  // Numbered titles
  ];
  
  return titlePatterns.some(pattern => pattern.test(content));
}
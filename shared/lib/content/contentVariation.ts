/**
 * Content Variation Service
 * Ensures additional documents don't sound generic when auto-populated
 * Uses LLM to transform and vary content based on document type
 */

import OpenAI from 'openai';

// Lazy initialization - only create client when actually needed (not during build)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface VariationOptions {
  documentType: string; // e.g., 'pitch_deck', 'application_form', 'work_plan'
  documentName: string;
  sourceContent: string;
  sourceSection?: string;
  tone?: 'professional' | 'persuasive' | 'technical' | 'concise';
  targetLength?: number; // Target word count
  avoidRepetition?: boolean; // Ensure this doesn't repeat other documents
  otherDocuments?: string[]; // Content from other documents to avoid repeating
}

export interface VariationResult {
  variedContent: string;
  wordCount: number;
  variations: string[]; // List of variations made
}

/**
 * Vary content using LLM to ensure uniqueness
 */
export async function varyContentForDocument(
  options: VariationOptions
): Promise<VariationResult> {
  // If no API key, return original content with minimal variation
  if (!process.env.OPENAI_API_KEY) {
    return {
      variedContent: applyBasicVariation(options.sourceContent, options.documentType),
      wordCount: countWords(options.sourceContent),
      variations: ['Basic text transformation (LLM unavailable)']
    };
  }

  try {
    const systemPrompt = createVariationSystemPrompt(options);
    const userPrompt = createVariationUserPrompt(options);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Higher temperature for more variation
      max_tokens: options.targetLength ? Math.min(2000, options.targetLength * 2) : 1500,
    });

    const variedContent = completion.choices[0]?.message?.content || options.sourceContent;
    
    // Extract variations made (if LLM provides them)
    const variations = extractVariations(variedContent, options.sourceContent);

    return {
      variedContent: variedContent.trim(),
      wordCount: countWords(variedContent),
      variations
    };
  } catch (error: any) {
    console.error('Content variation failed:', error?.message || String(error));
    // Fallback to basic variation
    return {
      variedContent: applyBasicVariation(options.sourceContent, options.documentType),
      wordCount: countWords(options.sourceContent),
      variations: ['Basic text transformation (LLM error)']
    };
  }
}

/**
 * Create system prompt for content variation
 */
function createVariationSystemPrompt(options: VariationOptions): string {
  const toneGuidance = getToneGuidance(options.tone || 'professional');
  const documentGuidance = getDocumentTypeGuidance(options.documentType);

  return `You are a professional business writing assistant specializing in funding applications for Austrian and EU programs.

Your task is to transform and vary content from a business plan section into content appropriate for a ${options.documentName} (${options.documentType}).

${documentGuidance}

${toneGuidance}

Key requirements:
1. Transform the content to match the document type's format and style
2. Vary sentence structure, word choice, and phrasing to avoid repetition
3. Maintain all key facts, numbers, and important information
4. Ensure the content is appropriate for the target document type
5. ${options.targetLength ? `Target approximately ${options.targetLength} words.` : 'Maintain similar length to source.'}
${options.avoidRepetition && options.otherDocuments && options.otherDocuments.length > 0 ? `
6. IMPORTANT: Avoid repeating content from these other documents:
${options.otherDocuments.map((doc, i) => `   Document ${i + 1}: ${doc.substring(0, 200)}...`).join('\n')}
` : ''}

Return ONLY the transformed content, no explanations or metadata.`;
}

/**
 * Create user prompt with source content
 */
function createVariationUserPrompt(options: VariationOptions): string {
  return `Transform this content from the "${options.sourceSection || 'business plan'}" section for use in a ${options.documentName}:

${options.sourceContent}

Requirements:
- Match the ${options.documentType} format and style
- Vary phrasing and structure while keeping key information
- ${options.targetLength ? `Target ${options.targetLength} words.` : 'Maintain similar length.'}
- Make it sound natural and appropriate for this document type`;
}

/**
 * Get tone-specific guidance
 */
function getToneGuidance(tone: string): string {
  const guidance: Record<string, string> = {
    professional: 'Use professional, clear language suitable for official applications.',
    persuasive: 'Use persuasive language that highlights benefits and value proposition.',
    technical: 'Use technical language appropriate for R&D and innovation programs.',
    concise: 'Be concise and direct, focusing on key points without unnecessary detail.'
  };
  return guidance[tone] || guidance.professional;
}

/**
 * Get document type-specific guidance
 */
function getDocumentTypeGuidance(documentType: string): string {
  const guidance: Record<string, string> = {
    pitch_deck: 'Format as presentation slides: concise bullet points, clear headings, visual-friendly language. Focus on value proposition and impact.',
    application_form: 'Format as form responses: direct answers, specific details, official language. Follow form structure if provided.',
    work_plan: 'Format as project plan: structured timeline, clear milestones, specific deliverables. Use action-oriented language.',
    budget_breakdown: 'Format as financial document: clear categories, specific amounts, justification for each line item.',
    ethics_risk_assessment: 'Format as assessment document: structured analysis, clear risk identification, mitigation strategies.',
    financial_plan: 'Format as financial document: projections, assumptions, clear financial narrative.',
    team_description: 'Format as team overview: roles, qualifications, relevant experience, contribution to project.'
  };

  return guidance[documentType] || 'Format appropriately for the document type, maintaining professional standards.';
}

/**
 * Apply basic variation without LLM (fallback)
 */
function applyBasicVariation(content: string, documentType: string): string {
  let varied = content;

  // Basic sentence restructuring
  // Replace common phrases with variations
  const variations: [RegExp, string][] = [
    [/Our company/g, 'We'],
    [/Our team/g, 'The team'],
    [/Our product/g, 'The product'],
    [/We are/g, 'The company is'],
    [/We have/g, 'The company has'],
    [/We will/g, 'The company will'],
  ];

  for (const [pattern, replacement] of variations) {
    varied = varied.replace(pattern, replacement);
  }

  // For pitch decks, make more concise
  if (documentType === 'pitch_deck') {
    // Split long sentences
    varied = varied.replace(/\. /g, '.\n\n');
  }

  return varied;
}

/**
 * Extract variations made (simple heuristic)
 */
function extractVariations(varied: string, original: string): string[] {
  const variations: string[] = [];
  
  // Check if length changed significantly
  const lengthDiff = Math.abs(varied.length - original.length);
  if (lengthDiff > original.length * 0.2) {
    variations.push(`Length adjusted by ${Math.round((lengthDiff / original.length) * 100)}%`);
  }

  // Check for sentence structure changes
  const originalSentences = original.split(/[.!?]+/).length;
  const variedSentences = varied.split(/[.!?]+/).length;
  if (Math.abs(originalSentences - variedSentences) > 2) {
    variations.push('Sentence structure reorganized');
  }

  return variations.length > 0 ? variations : ['Content transformed for document type'];
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Batch vary multiple documents to ensure they don't repeat each other
 */
export async function varyMultipleDocuments(
  documents: Array<{ id: string; type: string; name: string; content: string; sourceSection?: string }>
): Promise<Record<string, VariationResult>> {
  const results: Record<string, VariationResult> = {};
  
  // Process documents sequentially to avoid repetition
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    
    // Get content from already-processed documents
    const otherDocuments = documents
      .slice(0, i)
      .map(d => results[d.id]?.variedContent || d.content)
      .filter(c => c && c.length > 50);

    const result = await varyContentForDocument({
      documentType: doc.type,
      documentName: doc.name,
      sourceContent: doc.content,
      sourceSection: doc.sourceSection,
      avoidRepetition: true,
      otherDocuments
    });

    results[doc.id] = result;
  }

  return results;
}




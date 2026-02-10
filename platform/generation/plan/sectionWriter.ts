import { callAI } from '@/platform/ai/orchestrator';
import type { DocumentStructure, PlanSection } from '@/platform/core/types';

/**
 * Writes individual sections using AI
 */
export async function writeSection(
  section: PlanSection,
  documentStructure: DocumentStructure,
  context?: any
): Promise<string> {
  // Prepare prompt for the specific section
  const prompt = prepareSectionPrompt(section, documentStructure, context);
  
  // Use orchestrator to generate content
  const result = await callAI({
    type: 'writeSection',
    payload: {
      sectionTitle: section.title,
      context: {
        section,
        documentStructure,
        ...context
      },
      guidance: `You are an expert business plan writer. Write a professional, compelling section for a business plan.`
    }
  });
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to generate section');
  }
  
  return result.data.content || '';
}

/**
 * Prepares the prompt for a specific section
 */
function prepareSectionPrompt(
  section: PlanSection,
  documentStructure: DocumentStructure,
  context?: any
): string {
  return `
    Write content for the section titled "${section.title}".
    
    Section details:
    - Purpose: ${section.title}
    - Required: ${section.required ? 'Yes' : 'No'}
    - Type: ${section.type || 'standard'}
    
    Document context:
    - Document name: ${documentStructure.documents?.[0]?.name || 'Untitled'}
    
    Additional context: ${JSON.stringify(context, null, 2)}
    
    Provide comprehensive, professional content for this section.
  `;
}
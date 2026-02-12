/**
 * SECTION WRITING PROMPTS
 * Prompts for AI-assisted content generation
 */

export function buildSectionWritingPrompt(sectionTitle: string, guidance?: string, hints?: string[], aiPrompt?: string | null, requirements?: any[]): string {
  let prompt = 'Write a compelling, professional section titled "' + sectionTitle + '" for a business plan.\n\n';

  // Add blueprint aiPrompt if available (highest priority)
  if (aiPrompt) {
    prompt += 'KEY GUIDANCE:\n' + aiPrompt + '\n\n';
  } else if (guidance) {
    // Fall back to general guidance parameter
    prompt += 'Guidance:\n' + guidance + '\n\n';
  }

  // Add requirements if available
  if (requirements && requirements.length > 0) {
    prompt += 'MANDATORY REQUIREMENTS:\n';
    requirements.forEach((req: any) => {
      const title = req.title || req.description || req;
      prompt += '- ' + title + '\n';
    });
    prompt += '\n';
  }

  prompt += 'WRITING STANDARDS:\n- Professional tone, business language\n- Specific examples and data where relevant\n- Clear structure with logical flow\n- Address all key points for funding applications\n- 400-800 words';

  if (hints && hints.length > 0) {
    prompt += '\n\nHINTS:\n' + hints.map((h) => '- ' + h).join('\n');
  }

  return prompt;
}

export function buildSectionImprovementPrompt(sectionTitle: string, currentContent: string): string {
  return 'Improve this "' + sectionTitle + '" section for a business plan:\n\nCURRENT CONTENT:\n' + currentContent + '\n\nImprovements needed:\n- Enhance clarity and professionalism\n- Strengthen key arguments\n- Add specific metrics or data where appropriate\n- Improve structure and flow\n- Ensure compliance with funding requirements\n- Maintain or increase word count\n\nReturn only the improved content, no explanations.';
}

export function buildComplianceCheckPrompt(sectionTitle: string, content: string, requirements: string[]): string {
  const requirementsList = requirements.map((r) => '- ' + r).join('\n');

  return 'Check this "' + sectionTitle + '" section for compliance with funding requirements:\n\nCONTENT:\n' + content + '\n\nREQUIREMENTS TO CHECK:\n' + requirementsList + '\n\nProvide:\n1. Compliance score (0-100)\n2. Which requirements are met\n3. Which requirements are missing\n4. Specific suggestions for improvement\n5. Any common mistakes detected\n\nReturn as JSON: { "score": number, "met": [...], "missing": [...], "suggestions": [...], "mistakes": [...] }';
}

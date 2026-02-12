import { validateDocumentContent } from './contentSecurityValidator';

/**
 * Helper function for validating structure
 */
export async function validateStructure(unvalidatedStructure: any) {
  const validatedSections: any[] = [];
  const sectionSecurityIssues: string[] = [];

  for (const section of unvalidatedStructure.sections || []) {
    // Use section.content directly (rawTextToSections maps sections with content, not rawSubsections)
    const sectionContent = section.content || '';
    const sectionValidation = validateDocumentContent(sectionContent, (section.title as string) || '');

    if (sectionValidation.shouldReject) {
      // Hard rejection - only for actual security issues, not empty content
      sectionSecurityIssues.push(`Section '${section.title}' removed for security reasons: ${sectionValidation.warnings.join(', ')}`);
    } else {
      // Section passed security validation, add it with sanitized content
      validatedSections.push({
        ...section,
        content: sectionValidation.sanitizedContent,
        rawSubsections: section.rawSubsections?.map((subsection: any) => ({
          ...subsection,
          rawText: sectionValidation.sanitizedContent
        })) || [{
          id: `${section.id}-content`,
          title: section.title,
          rawText: sectionValidation.sanitizedContent
        }]
      });
    }
  }

  const validatedStructure = {
    ...unvalidatedStructure,
    sections: validatedSections,
    warnings: [...(unvalidatedStructure.warnings || []), ...sectionSecurityIssues]
  };

  return { validatedStructure, sectionSecurityIssues };
}
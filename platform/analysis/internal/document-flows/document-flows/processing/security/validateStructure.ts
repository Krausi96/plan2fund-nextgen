import { validateDocumentContent } from './contentSecurityValidator';

/**
 * Helper function for validating structure
 */
export async function validateStructure(unvalidatedStructure: any) {
  const validatedSections = [];
  const sectionSecurityIssues = [];
  
  for (const section of unvalidatedStructure.sections) {
    // Extract content from rawSubsections if available, otherwise use empty string
    const sectionContent = section.rawSubsections && section.rawSubsections.length > 0 
      ? section.rawSubsections[0]?.rawText || '' 
      : '';
    const sectionValidation = validateDocumentContent(sectionContent, (section.title as string) || '');
    
    if (sectionValidation.shouldReject) {
      // Hard rejection - this section should be completely dropped
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
    warnings: [...unvalidatedStructure.warnings, ...sectionSecurityIssues]
  };
  
  return { validatedStructure, sectionSecurityIssues };
}
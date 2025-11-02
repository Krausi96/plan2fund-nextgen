// Library Extractor - Extracts eligibility, funding and procedural details from unstructured text
import { LibraryRequirement } from '@/shared/types/requirements';

export class LibraryExtractor {
  /**
   * Extract comprehensive library requirements from unstructured text
   */
  static extractLibraryRequirements(text: string, programId: string): LibraryRequirement {
    return {
      id: `lib_${programId}`,
      program_id: programId,
      eligibility_text: this.extractEligibilityText(text),
      documents: this.extractRequiredDocuments(text),
      funding_amount: this.extractFundingAmount(text),
      deadlines: this.extractDeadlines(text),
      application_procedures: this.extractApplicationProcedures(text),
      compliance_requirements: this.extractComplianceRequirements(text),
      contact_info: this.extractContactInfo(text)
    };
  }

  /**
   * Extract eligibility criteria from text
   */
  private static extractEligibilityText(text: string): string {
    const eligibilityPatterns = [
      /eligibility criteria[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /voraussetzungen[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /target group[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /zielgruppe[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /who can apply[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is,
      /wer kann sich bewerben[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is
    ];

    for (const pattern of eligibilityPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Extract required documents from text
   */
  private static extractRequiredDocuments(text: string): string[] {
    const documents: string[] = [];
    
    // Common document patterns
    const documentPatterns = [
      /business plan|geschäftsplan/gi,
      /financial statements|finanzbericht/gi,
      /project description|projektbeschreibung/gi,
      /team cv|lebenslauf/gi,
      /company registration|firmenbuch/gi,
      /tax certificate|steuerbescheid/gi,
      /bank statements|kontoauszüge/gi,
      /insurance certificate|versicherungsnachweis/gi,
      /technical specifications|technische spezifikationen/gi,
      /market analysis|marktanalyse/gi
    ];

    documentPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!documents.includes(match)) {
            documents.push(match);
          }
        });
      }
    });

    // Extract from bullet points or lists
    const listPatterns = [
      /required documents[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      /erforderliche dokumente[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
    ];

    listPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const listItems = match[1].split('\n').filter(item => item.trim());
        listItems.forEach(item => {
          const cleanItem = item.replace(/^[-•*]\s*/, '').trim();
          if (cleanItem && !documents.includes(cleanItem)) {
            documents.push(cleanItem);
          }
        });
      }
    });

    return documents;
  }

  /**
   * Extract funding amount from text
   */
  private static extractFundingAmount(text: string): string {
    const fundingPatterns = [
      /up to.*?€\s*(\d+[km]?)/i,
      /bis zu.*?€\s*(\d+[km]?)/i,
      /funding.*?€\s*(\d+[km]?)/i,
      /förderung.*?€\s*(\d+[km]?)/i,
      /maximum.*?€\s*(\d+[km]?)/i,
      /maximal.*?€\s*(\d+[km]?)/i,
      /grant.*?€\s*(\d+[km]?)/i,
      /zuwendung.*?€\s*(\d+[km]?)/i
    ];

    for (const pattern of fundingPatterns) {
      const match = text.match(pattern);
      if (match) {
        return `€${match[1]}`;
      }
    }

    return '';
  }

  /**
   * Extract deadlines from text
   */
  private static extractDeadlines(text: string): string[] {
    const deadlines: string[] = [];
    
    // Date patterns
    const datePatterns = [
      /deadline.*?(\d{1,2}\.\d{1,2}\.\d{4})/gi,
      /frist.*?(\d{1,2}\.\d{1,2}\.\d{4})/gi,
      /application.*?(\d{1,2}\.\d{1,2}\.\d{4})/gi,
      /bewerbung.*?(\d{1,2}\.\d{1,2}\.\d{4})/gi,
      /submission.*?(\d{1,2}\.\d{1,2}\.\d{4})/gi,
      /einreichung.*?(\d{1,2}\.\d{1,2}\.\d{4})/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const dateMatch = match.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
          if (dateMatch && !deadlines.includes(dateMatch[1])) {
            deadlines.push(dateMatch[1]);
          }
        });
      }
    });

    return deadlines;
  }

  /**
   * Extract application procedures from text
   */
  private static extractApplicationProcedures(text: string): string[] {
    const procedures: string[] = [];
    
    // Procedure patterns
    const procedurePatterns = [
      /online application|online bewerbung/gi,
      /consultation|beratung/gi,
      /expert review|gutachten/gi,
      /pre-application|voranmeldung/gi,
      /registration|registrierung/gi,
      /documentation|dokumentation/gi,
      /interview|gespräch/gi,
      /presentation|präsentation/gi
    ];

    procedurePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (!procedures.includes(cleanMatch)) {
            procedures.push(cleanMatch);
          }
        });
      }
    });

    // Extract from structured sections
    const procedureSections = [
      /application process[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      /bewerbungsverfahren[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      /how to apply[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i,
      /wie bewerben[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i
    ];

    procedureSections.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const steps = match[1].split('\n').filter(step => step.trim());
        steps.forEach(step => {
          const cleanStep = step.replace(/^\d+\.\s*/, '').trim();
          if (cleanStep && !procedures.includes(cleanStep)) {
            procedures.push(cleanStep);
          }
        });
      }
    });

    return procedures;
  }

  /**
   * Extract compliance requirements from text
   */
  private static extractComplianceRequirements(text: string): string[] {
    const compliance: string[] = [];
    
    // Compliance patterns
    const compliancePatterns = [
      /gdp|dsgvo/gi,
      /tax compliance|steuerliche compliance/gi,
      /environmental compliance|umweltcompliance/gi,
      /data protection|datenschutz/gi,
      /privacy|privatsphäre/gi,
      /security|sicherheit/gi,
      /quality standards|qualitätsstandards/gi,
      /certification|zertifizierung/gi
    ];

    compliancePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (!compliance.includes(cleanMatch)) {
            compliance.push(cleanMatch);
          }
        });
      }
    });

    return compliance;
  }

  /**
   * Extract contact information from text
   */
  private static extractContactInfo(text: string): {
    email?: string;
    phone?: string;
    website?: string;
  } {
    const contactInfo: { email?: string; phone?: string; website?: string } = {};

    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      contactInfo.email = emailMatch[1];
    }

    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
    if (phoneMatch) {
      contactInfo.phone = phoneMatch[1];
    }

    // Extract website
    const websiteMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (websiteMatch) {
      contactInfo.website = websiteMatch[1];
    }

    return contactInfo;
  }
}

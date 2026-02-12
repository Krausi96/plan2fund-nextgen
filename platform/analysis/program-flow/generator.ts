/**
 * STRUCTURE GENERATION UTILITIES
 * 
 * Contains functions for generating DocumentStructures from program data.
 */

// @ts-ignore - Legacy code with evolved API
import type { FundingProgram, DocumentStructure } from '@/platform/core/types';

/**
 * Generate DocumentStructure from FundingProgram
 * Creates complete document structure for generation
 * 
 * @ts-ignore - Type mismatches due to FundingProgram API evolution
 */
export function generateDocumentStructureFromProfile(profile: any): any {
  // Generate documents from parsed requirements
  const documents = profile.applicationRequirements.documents.length > 0 
    ? profile.applicationRequirements.documents.map((doc, index) => ({
        id: `doc_${index}_${doc.document_name.replace(/\s+/g, '_').toLowerCase()}`,
        name: doc.document_name,
        purpose: `Required for ${profile.name}`,
        required: doc.required,
        templateId: doc.format === 'pdf' ? 'pdf_template' : 'default_template'
      }))
    : [{
        id: 'main_document',
        name: `${profile.name} Application`,
        purpose: `Main document for ${profile.name}`,
        required: true
      }];

  // Determine the primary document ID for sections
  const primaryDocumentId = documents[0].id;
  
  // Generate sections from parsed requirements
  let sections = profile.applicationRequirements.sections.map((section, sectionIndex) => {
    // Create subsections for this section (optional, may be undefined)
    const rawSubsections = (section.subsections || []).map((subsection, subIndex) => ({
      id: `subsec_${sectionIndex}_${subIndex}_${subsection.title.replace(/\s+/g, '_').toLowerCase()}`,
      title: subsection.title,
      rawText: '' // Initially empty, will be filled by the AI or user
    }));
    
    // Generate requirements owned by this section (OPTION A - requirements attached to section)
    const sectionRequirements = (section.requirements || []).map((req, reqIndex) => ({
      id: `req_section_${sectionIndex}_${reqIndex}`,
      category: req.category || 'market',
      title: req.title || req.description || '',
      description: req.description || '',
      priority: req.priority || 'high',
      examples: req.examples || []
    }));
    
    // Determine appropriate document for this section based on content
    let sectionDocumentId = primaryDocumentId; // Default to primary document
    
    // Map sections to appropriate documents based on keywords and business logic
    const sectionLower = section.title.toLowerCase();
    
    // Try to find a document that matches the section content
    if (sectionLower.includes('financial') || sectionLower.includes('finance')) {
      // Try to find Financial Statements document
      const financialDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('financial') || 
        doc.name.toLowerCase().includes('statement')
      );
      if (financialDoc) {
        sectionDocumentId = financialDoc.id;
      }
    } else if (sectionLower.includes('project') || sectionLower.includes('business') || sectionLower.includes('description')) {
      // Try to find Business Plan document
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    } else if (sectionLower.includes('market') || sectionLower.includes('competition')) {
      // Try to find a suitable document for market sections
      const marketDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan') ||
        doc.name.toLowerCase().includes('marketing')
      );
      if (marketDoc) {
        sectionDocumentId = marketDoc.id;
      }
    } else if (sectionLower.includes('team') || sectionLower.includes('qualification') || sectionLower.includes('personnel')) {
      // Team sections often go in business plan
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    } else if (sectionLower.includes('innovation') || sectionLower.includes('technology') || sectionLower.includes('patent')) {
      // Innovation sections might go in proof of innovation or business plan
      const innovationDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('innovation') || 
        doc.name.toLowerCase().includes('patent') ||
        doc.name.toLowerCase().includes('technical')
      );
      if (innovationDoc) {
        sectionDocumentId = innovationDoc.id;
      } else {
        // Default to business plan if no specific innovation document
        const businessPlanDoc = documents.find(doc => 
          doc.name.toLowerCase().includes('business') || 
          doc.name.toLowerCase().includes('plan')
        );
        if (businessPlanDoc) {
          sectionDocumentId = businessPlanDoc.id;
        }
      }
    } else if (sectionLower.includes('objective') || sectionLower.includes('goal') || sectionLower.includes('summary')) {
      // Executive summaries and objectives often go in business plan
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    }
    
    // If no specific document found and we have a business plan document, default to business plan
    // Otherwise, fall back to primary document
    if (sectionDocumentId === primaryDocumentId) {
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    }
    
    // OPTION A: Requirements owned directly by section
    return {
      id: `sec_${sectionIndex}_${section.title.replace(/\s+/g, '_').toLowerCase()}`,
      documentId: sectionDocumentId, // Associate section with appropriate document
      title: section.title,
      type: section.required ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
      required: section.required,
      programCritical: true,
      content: '',
      aiGuidance: [],
      // OPTION A: Requirements owned directly by section (not at DocumentStructure level)
      requirements: sectionRequirements,
      // Preserve subsections
      rawSubsections: rawSubsections
    };
  });
  
  // After initial assignment, handle empty documents without disrupting semantic assignments
  const documentIds = documents.map(doc => doc.id);
  if (documentIds.length > 1 && sections.length > 0) {
    // Group sections by document to identify empty documents
    const sectionsByDocument: Record<string, any[]> = {};
    documentIds.forEach(id => sectionsByDocument[id] = []);
    
    sections.forEach(section => {
      if (sectionsByDocument[section.documentId]) {
        sectionsByDocument[section.documentId].push(section);
      } else {
        // If section doesn't match any known document, assign to first document
        sectionsByDocument[documentIds[0]].push(section);
      }
    });
    
    // Identify documents with no sections
    const emptyDocuments = documentIds.filter(id => sectionsByDocument[id].length === 0);
    
    // Only add placeholder sections to truly empty documents without disturbing semantic assignments
    if (emptyDocuments.length > 0) {
      // For each empty document, add a placeholder section if needed
      emptyDocuments.forEach(emptyDocId => {
        const emptyDoc = documents.find(doc => doc.id === emptyDocId);
        if (emptyDoc) {
          // Add a placeholder section that makes sense for this document type
          const placeholderSection = {
            id: `placeholder_${emptyDocId}_intro`,
            documentId: emptyDocId,
            title: `Introduction to ${emptyDoc.name}`,
            type: 'optional' as const,
            required: false,
            programCritical: false,
            content: '',
            aiGuidance: [],
            // No requirements for placeholder sections
            requirements: [],
            rawSubsections: []
          };
          
          // Add the placeholder section to the sections array
          sections.push(placeholderSection);
        }
      });
    }
  }
  
  // Generate validation rules (not tied to specific sections)
  const validationRules = [
    // Presence validation for required documents
    ...profile.applicationRequirements.documents.filter(doc => doc.required).map((doc, index) => ({
      id: `val_doc_presence_${index}`,
      type: 'presence' as const,
      sectionId: '', // Document-level rule
      rule: `${doc.document_name} is required and must be submitted`,
      severity: 'error' as const
    })),
    // Financial statement validation
    ...(profile.applicationRequirements.financialRequirements?.financial_statements_required || []).map((stmt, index) => ({
      id: `val_financial_${index}`,
      type: 'presence' as const,
      sectionId: '', // Document-level rule
      rule: `${stmt} statement is required for financial evaluation`,
      severity: 'error' as const
    }))
  ];
  
  // Generate AI guidance (per-section)
  const aiGuidance = sections.map(section => ({
    sectionId: section.id,
    prompt: `Write professional content for ${section.title}`,
    checklist: [`Cover all ${section.title} aspects`, `Maintain professional tone`],
    examples: [`Example content for ${section.title}...`]
  }));
  
  // OPTION A: No global requirements array anymore
  // Requirements are owned by sections directly
  return {
    structureId: `structure_${profile.id}_${Date.now()}`,
    version: '1.0',
    source: 'program' as const,
    documents,
    sections, // Each section now contains its own requirements array
    // NO requirements array here - moved to section level
    validationRules,
    aiGuidance,
    renderingRules: {
      titlePage: { includeLogo: true, includeDate: true },
      tableOfContents: { autoGenerate: true },
      references: { citationStyle: 'APA' },
      appendices: { autoNumber: true }
    },
    conflicts: [],
    warnings: profile.applicationRequirements.documents.some(doc => !doc.reuseable) ? 
      ['Some documents cannot be reused for other applications'] : [],
    confidenceScore: profile.applicationRequirements.documents.length > 0 && 
                    profile.applicationRequirements.sections.length > 0 ? 90 : 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'program_utils'
  };
}

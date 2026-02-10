/**
 * STRUCTURE GENERATION UTILITIES
 * 
 * Contains functions for generating DocumentStructures from program data.
 */

import type { FundingProgram, DocumentStructure } from '@/platform/core/types';

/**
 * Generate DocumentStructure from FundingProgram
 * Creates complete document structure for generation
 */
export function generateDocumentStructureFromProfile(profile: FundingProgram): DocumentStructure {
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
    // Create subsections for this section
    const rawSubsections = section.subsections.map((subsection, subIndex) => ({
      id: `subsec_${sectionIndex}_${subIndex}_${subsection.title.replace(/\s+/g, '_').toLowerCase()}`,
      title: subsection.title,
      rawText: '' // Initially empty, will be filled by the AI or user
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
    
    return {
      id: `sec_${sectionIndex}_${section.title.replace(/\s+/g, '_').toLowerCase()}`,
      documentId: sectionDocumentId, // Associate section with appropriate document
      title: section.title,
      type: section.required ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
      required: section.required,
      programCritical: true,
      isRequirement: true, // Mark this section as a requirement
      aiPrompt: `Write detailed content for ${section.title} in the context of ${profile.name}`,
      checklist: [`Address ${section.title} requirements`, `Include relevant details`, `Follow program guidelines`],
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
            isRequirement: false, // This is not a requirement
            aiPrompt: `Provide introductory content for the ${emptyDoc.name} document`,
            checklist: [`Introduce the purpose of ${emptyDoc.name}`, `Outline key considerations for this document`],
            rawSubsections: []
          };
          
          // Add the placeholder section to the sections array
          sections.push(placeholderSection);
        }
      });
    }
  }
  
  const requirements = [
    // Financial requirements
    ...profile.applicationRequirements.financialRequirements.financial_statements_required.map((stmt, index) => ({
      id: `req_financial_${index}`,
      scope: 'section' as const,
      category: 'financial' as const,
      severity: 'major' as const,
      rule: `Must include ${stmt} statement`,
      target: stmt,
      evidenceType: 'financial_document'
    })),
    // Document requirements
    ...profile.applicationRequirements.documents.filter(doc => doc.required).map((doc, index) => ({
      id: `req_doc_${index}`,
      scope: 'document' as const,
      category: 'formatting' as const,
      severity: 'blocker' as const,
      rule: `Document must be in ${doc.format} format from ${doc.authority}`,
      target: doc.document_name,
      evidenceType: 'document_submission'
    })),
    // Program-level requirements
    ...(profile.requirements || []).map((req, index) => ({
      id: `req_program_${index}`,
      scope: 'section' as const,
      category: 'market' as const, // Using 'market' as a general category for program requirements
      severity: 'major' as const,
      rule: `Must address ${req} requirement`,
      target: req,
      evidenceType: 'content'
    }))
  ];
  
  // Generate validation rules
  const validationRules = [
    // Presence validation for required documents
    ...profile.applicationRequirements.documents.filter(doc => doc.required).map((doc, index) => ({
      id: `val_doc_presence_${index}`,
      type: 'presence' as const,
      scope: doc.document_name,
      errorMessage: `${doc.document_name} is required and must be submitted`
    })),
    // Financial statement validation
    ...profile.applicationRequirements.financialRequirements.financial_statements_required.map((stmt, index) => ({
      id: `val_financial_${index}`,
      type: 'presence' as const,
      scope: stmt,
      errorMessage: `${stmt} statement is required for financial evaluation`
    }))
  ];
  
  // Generate AI guidance
  const aiGuidance = sections.map(section => ({
    sectionId: section.id,
    prompt: section.aiPrompt || `Write professional content for ${section.title}`,
    checklist: section.checklist || [`Cover all ${section.title} aspects`, `Maintain professional tone`],
    examples: [`Example content for ${section.title}...`]
  }));
  
  return {
    structureId: `structure_${profile.id}_${Date.now()}`,
    version: '1.0',
    source: 'program' as const,
    documents,
    sections,
    requirements,
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


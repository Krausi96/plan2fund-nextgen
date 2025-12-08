import type { ConversationMessage, QuestionStatus, Section, Dataset, KPI, MediaAsset } from '@/features/editor/lib/types/plan';

type SectionAiProgram = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
};

type SectionAiQuestionMeta = {
  questionPrompt?: string;
  questionStatus?: QuestionStatus;
  questionMode?: 'guidance' | 'critique';
  attachmentSummary?: string[];
  requirementHints?: string[];
};

export type SectionAiRequest = {
  sectionTitle: string;
  context: string;
  program: SectionAiProgram;
  conversationHistory?: ConversationMessage[];
  questionMeta?: SectionAiQuestionMeta;
  maxWords?: number;
  tone?: 'neutral' | 'formal' | 'concise';
  language?: 'de' | 'en';
  documentType?: 'business-plan' | 'proposal' | 'report' | 'application';
  assistantContext?: AIContext;
  sectionType?: 'normal' | 'metadata' | 'references' | 'appendices' | 'ancillary';
  sectionOrigin?: 'template' | 'custom';
  sectionEnabled?: boolean;
};

export type SectionAiResponse = {
  content: string;
  suggestions?: string[];
  citations?: string[];
  recommendedActions?: Array<{
    type: 'create_table' | 'create_kpi' | 'add_image' | 'add_reference' | 'configure_formatting';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  suggestedKPIs?: Array<{
    name: string;
    value: number;
    unit?: string;
    description?: string;
  }>;
};

// AI Context Types
export type AIContext = 'content' | 'design' | 'references' | 'questions';

// AI Action Types
export type AIAction = {
  label: string;
  action: string;
  icon?: string;
  onClick: () => void;
};

// Callbacks for action creation
export type AIActionCallbacks = {
  onDatasetCreate?: (dataset: Dataset) => void;
  onKpiCreate?: (kpi: KPI) => void;
  onMediaCreate?: (asset: MediaAsset) => void;
  onReferenceAdd?: (reference: any) => void;
};

/**
 * Detects AI context from user message based on keywords
 * @param message - User's message text
 * @returns Detected context: 'content', 'design', 'references', or 'questions'
 */
export function detectAIContext(message: string): AIContext {
  const lowerMessage = message.toLowerCase();
  
  // Design context keywords (title page + general document design)
  const designKeywords = [
    // Title page design
    'design', 'format', 'formatting', 'title page', 'logo', 'header', 'footer', 'font', 'style', 'layout', 'appearance', 'visual',
    // General document design (NEW)
    'page number', 'page numbers', 'page numbering', 'start number', 'page format',
    'extra page', 'extra pages', 'blank page', 'section separator', 'story separation', 'separation line',
    'document format', 'document formatting', 'page layout', 'page size', 'orientation', 'margins',
    'page break', 'page breaks', 'section break'
  ];
  if (designKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'design';
  }
  
  // References context keywords (references section + content sections)
  const referencesKeywords = [
    'reference', 'references', 'citation', 'citations', 'cite', 'source', 'sources', 
    'bibliography', 'attach', 'attachment', 'link', 'url', 'add reference', 'add citation',
    'how to cite', 'citation format', 'reference format'
  ];
  if (referencesKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'references';
  }
  
  // Questions context keywords
  const questionsKeywords = ['question', 'questions', 'hide', 'show', 'reorder', 'customize', 'edit prompt', 'change question', 'remove question', 'add question'];
  if (questionsKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'questions';
  }
  
  // Default to content context
  return 'content';
}

/**
 * Parses AI response to extract actionable suggestions
 * Prioritizes structured JSON output over keyword matching
 * @param response - AI response object (may contain recommendedActions)
 * @param content - AI response text (fallback for keyword matching)
 * @param section - Current section (can be null for special sections)
 * @param callbacks - Callback functions for creating actions
 * @param options - Additional options (section type flags)
 * @returns Array of actionable items
 */
export function parseAIActions(
  response: SectionAiResponse | string,
  section: Section | null,
  callbacks: AIActionCallbacks,
  options?: {
    isMetadataSection?: boolean;
    isReferencesSection?: boolean;
  }
): AIAction[] {
  const actions: AIAction[] = [];
  
  if (!section) return actions;
  
  const { onDatasetCreate, onKpiCreate, onMediaCreate, onReferenceAdd } = callbacks;
  const { isMetadataSection = false, isReferencesSection = false } = options || {};
  
  // Extract response object and content string
  let responseObj: SectionAiResponse;
  let contentString: string;
  
  if (typeof response === 'string') {
    // Legacy: string response, use keyword matching
    contentString = response;
    responseObj = { content: response };
  } else {
    // Modern: structured response object
    responseObj = response;
    contentString = response.content || '';
  }
  
  // Priority 1: Use structured recommendedActions from JSON response
  if (responseObj.recommendedActions && Array.isArray(responseObj.recommendedActions) && responseObj.recommendedActions.length > 0) {
    responseObj.recommendedActions.forEach((recommendedAction) => {
      const { type } = recommendedAction;
      
      switch (type) {
        case 'create_table':
          actions.push({
            label: 'Create Table',
            action: 'create_table',
            icon: '📊',
            onClick: () => {
              if (onDatasetCreate && section) {
                const newDataset: Dataset = {
                  id: `dataset_${Date.now()}`,
                  name: 'New Dataset',
                  columns: [],
                  rows: [],
                  sectionId: section.id
                };
                onDatasetCreate(newDataset);
              }
            }
          });
          break;
          
        case 'create_kpi':
          actions.push({
            label: 'Create KPI',
            action: 'create_kpi',
            icon: '📈',
            onClick: () => {
              if (onKpiCreate && section) {
                const newKpi: KPI = {
                  id: `kpi_${Date.now()}`,
                  name: 'New KPI',
                  value: 0,
                  unit: '',
                  sectionId: section.id
                };
                onKpiCreate(newKpi);
              }
            }
          });
          break;
          
        case 'add_image':
          actions.push({
            label: 'Add Image',
            action: 'add_image',
            icon: '🖼️',
            onClick: () => {
              if (onMediaCreate && section) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        const mediaAsset: MediaAsset = {
                          id: `media_${Date.now()}`,
                          type: 'image',
                          title: file.name,
                          uri: reader.result,
                          description: `Uploaded: ${file.name}`,
                          sectionId: section.id
                        };
                        onMediaCreate(mediaAsset);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }
            }
          });
          break;
          
        case 'add_reference':
          actions.push({
            label: isReferencesSection ? 'Add Citation' : 'Add Reference',
            action: 'add_reference',
            icon: '📚',
            onClick: () => {
              if (onReferenceAdd) {
                onReferenceAdd({
                  id: `ref_${Date.now()}`,
                  title: 'New Reference',
                  authors: '',
                  year: new Date().getFullYear(),
                  url: '',
                  type: 'article'
                });
              }
            }
          });
          break;
          
        case 'configure_formatting':
          if (isMetadataSection) {
            actions.push({
              label: 'Configure Formatting',
              action: 'configure_formatting',
              icon: '🎨',
              onClick: () => {
                // Formatting configuration would be handled by the parent component
                console.log('Configure formatting requested');
              }
            });
          }
          break;
      }
    });
    
    // If we have structured actions, return them (no keyword fallback)
    return actions;
  }
  
  // Priority 2: Fallback to keyword matching (for backward compatibility)
  const lowerContent = contentString.toLowerCase();
  
  // Check for table/dataset suggestions
  if (lowerContent.includes('table') || lowerContent.includes('dataset') || lowerContent.includes('data table') || lowerContent.includes('spreadsheet')) {
    actions.push({
      label: 'Create Table',
      action: 'create_table',
      icon: '📊',
      onClick: () => {
        if (onDatasetCreate && section) {
          const newDataset: Dataset = {
            id: `dataset_${Date.now()}`,
            name: 'New Dataset',
            columns: [],
            rows: [],
            sectionId: section.id
          };
          onDatasetCreate(newDataset);
        }
      }
    });
  }
  
  // Check for KPI suggestions
  if (lowerContent.includes('kpi') || lowerContent.includes('metric') || lowerContent.includes('indicator') || lowerContent.includes('measure')) {
    actions.push({
      label: 'Create KPI',
      action: 'create_kpi',
      icon: '📈',
      onClick: () => {
        if (onKpiCreate && section) {
          const newKpi: KPI = {
            id: `kpi_${Date.now()}`,
            name: 'New KPI',
            value: 0,
            unit: '',
            sectionId: section.id
          };
          onKpiCreate(newKpi);
        }
      }
    });
  }
  
  // Check for image/media suggestions
  if (lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('chart') || lowerContent.includes('graph') || lowerContent.includes('visual') || lowerContent.includes('logo')) {
    actions.push({
      label: 'Add Image',
      action: 'add_image',
      icon: '🖼️',
      onClick: () => {
        if (onMediaCreate && section) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  const mediaAsset: MediaAsset = {
                    id: `media_${Date.now()}`,
                    type: 'image',
                    title: file.name,
                    uri: reader.result,
                    description: `Uploaded: ${file.name}`,
                    sectionId: section.id
                  };
                  onMediaCreate(mediaAsset);
                }
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
      }
    });
  }
  
  // For metadata sections, add design-related actions
  if (isMetadataSection) {
    if (lowerContent.includes('page number') || lowerContent.includes('formatting') || lowerContent.includes('design')) {
      actions.push({
        label: 'Configure Formatting',
        action: 'configure_formatting',
        icon: '🎨',
        onClick: () => {
          console.log('Configure formatting requested');
        }
      });
    }
  }
  
  // For references sections, add citation actions
  if (isReferencesSection) {
    if (lowerContent.includes('citation') || lowerContent.includes('reference') || lowerContent.includes('cite')) {
      actions.push({
        label: 'Add Citation',
        action: 'add_citation',
        icon: '📚',
        onClick: () => {
          if (onReferenceAdd) {
            onReferenceAdd({
              id: `ref_${Date.now()}`,
              title: 'New Reference',
              authors: '',
              year: new Date().getFullYear(),
              url: '',
              type: 'article'
            });
          }
        }
      });
    }
  }
  
  // For content sections, detect references context and suggest adding reference
  if (section && !isReferencesSection) {
    if (lowerContent.includes('citation') || lowerContent.includes('reference') || 
        lowerContent.includes('cite') || lowerContent.includes('source') ||
        lowerContent.includes('add reference') || lowerContent.includes('add citation') ||
        lowerContent.includes('how to cite')) {
      actions.push({
        label: 'Add Reference',
        action: 'add_reference',
        icon: '📚',
        onClick: () => {
          if (onReferenceAdd) {
            onReferenceAdd({
              id: `ref_${Date.now()}`,
              title: 'New Reference',
              authors: '',
              year: new Date().getFullYear(),
              url: '',
              type: 'article'
            });
          }
        }
      });
    }
  }
  
  return actions;
}

/**
 * Builds section-specific system prompt based on section type and context
 */
function buildSectionSpecificPrompt(
  sectionTitle: string,
  assistantContext: AIContext,
  sectionType?: 'normal' | 'metadata' | 'references' | 'appendices' | 'ancillary',
  programType?: string,
  documentType?: string
): string {
  let basePrompt = '';
  
  // Section-specific prompts
  if (sectionType === 'metadata') {
    basePrompt = `You are an expert document design assistant specializing in title page formatting and document structure.

Your expertise includes:
- Title page design: logo placement, title formatting, subtitle hierarchy, visual balance
- Document formatting: page numbering, page breaks, section separators, margins
- Visual hierarchy: font sizes, spacing, alignment, professional appearance
- Document structure: table of contents, page organization, extra pages, blank pages

Current focus: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with design:
- Suggest specific formatting options (font sizes, spacing, alignment)
- Recommend visual hierarchy improvements
- Provide guidance on professional document appearance
- Help with page numbering and document structure
- Suggest when to add extra pages or section separators`;
    
  } else if (sectionType === 'references') {
    basePrompt = `You are an expert citation and reference management assistant.

Your expertise includes:
- Citation formats: APA, MLA, Chicago, IEEE, and other academic/business formats
- Bibliography management: organizing references, proper formatting, consistency
- Reference types: articles, books, websites, reports, patents, etc.
- Attachment management: linking references to content, file organization
- Citation best practices: when to cite, how to cite, avoiding plagiarism

Current focus: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with references:
- Suggest appropriate citation formats based on document type
- Help organize and format bibliographies
- Guide on when and how to add citations
- Assist with reference attachment and linking
- Provide citation format examples`;
    
  } else if (sectionType === 'appendices') {
    basePrompt = `You are an expert document organization assistant specializing in appendices and supplementary materials.

Your expertise includes:
- File organization: naming conventions, categorization, logical grouping
- Appendix structure: ordering, numbering, cross-referencing
- Document types: charts, tables, images, legal documents, certificates
- Best practices: what to include, what to exclude, when to reference

Current focus: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with appendices:
- Suggest file naming conventions and organization
- Help categorize and group related materials
- Guide on what should be included in appendices
- Assist with cross-referencing from main document
- Provide organization best practices`;
    
  } else if (sectionType === 'ancillary') {
    basePrompt = `You are an expert document list management assistant specializing in table of contents, lists of tables, and document navigation.

Your expertise includes:
- Table of Contents (TOC): structure, formatting, page numbering, hierarchy
- List of Tables: organization, numbering, cross-referencing
- List of Figures/Illustrations: categorization, labeling, placement
- Document navigation: improving readability, logical flow
- List customization: showing/hiding entries, custom formatting, manual overrides

Current focus: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with ancillary content:
- Suggest TOC structure and hierarchy improvements
- Help organize lists of tables and figures
- Guide on when to include/exclude entries
- Assist with custom formatting and styling
- Provide best practices for document navigation
- Help with manual entry management and overrides`;
    
  } else {
    // Normal content sections - context-aware prompts
    if (assistantContext === 'design') {
      basePrompt = `You are an expert document design assistant helping with general document formatting and structure.

Your expertise includes:
- Page numbering: start numbers, format, placement
- Page breaks and section separators: when to add, how to format
- Document-wide formatting: margins, spacing, consistency
- Visual elements: charts, tables, images placement
- Document structure: extra pages, blank pages, story separation lines

Current section: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with design:
- Suggest page numbering options and formats
- Recommend when to add extra pages or section separators
- Provide guidance on document-wide formatting consistency
- Help with visual element placement
- Suggest improvements to document structure`;
      
    } else if (assistantContext === 'references') {
      basePrompt = `You are an expert citation assistant helping with references in content sections.

Your expertise includes:
- Adding citations: how to cite sources within content
- Linking references: connecting citations to reference list
- Citation formats: appropriate formats for different source types
- When to cite: best practices for citation placement

Current section: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with citations:
- Guide on how to add citations to content
- Suggest when citations are needed
- Help link citations to reference list
- Provide citation format examples
- Assist with citation placement and formatting`;
      
    } else if (assistantContext === 'questions') {
      basePrompt = `You are an expert question management assistant.

Your expertise includes:
- Question customization: editing prompts, changing wording
- Question visibility: showing/hiding questions
- Question organization: reordering, grouping
- Question requirements: understanding what's needed

Current section: ${sectionTitle}
Document type: ${documentType || 'business-plan'}
Program type: ${programType || 'grant'}

When helping with questions:
- Guide on customizing question prompts
- Help with question organization and ordering
- Assist with question visibility settings
- Provide guidance on question requirements`;
      
    } else {
      // Default: content writing assistance
      basePrompt = `You are an expert business plan writing assistant specializing in ${programType || 'grant'} applications.

Current section: ${sectionTitle}
Document type: ${documentType || 'business-plan'}

When helping with content:
- Provide specific, professional, and tailored content
- Suggest improvements for clarity and impact
- Recommend data, KPIs, and metrics where relevant
- Help structure content effectively
- Ensure content meets program requirements`;
    }
  }
  
  return basePrompt;
}

export async function generateSectionContent({
  sectionTitle,
  context,
  program,
  conversationHistory,
  questionMeta,
  maxWords = 400,
  tone = 'neutral',
  language = 'en',
  documentType,
  assistantContext = 'content',
  sectionType,
  sectionOrigin,
  sectionEnabled
}: SectionAiRequest): Promise<SectionAiResponse> {
  // Build section-specific system prompt
  const sectionSpecificGuidance = buildSectionSpecificPrompt(
    sectionTitle,
    assistantContext,
    sectionType,
    program.type ?? 'grant',
    documentType ?? 'business-plan'
  );
  
  const payload = {
    message: context,
    context: {
      sectionId: sectionTitle,
      sectionTitle,
      currentContent: context,
      programType: program.type ?? 'grant',
      programName: program.name ?? undefined,
      documentType: documentType ?? 'business-plan',
      questionPrompt: questionMeta?.questionPrompt,
      questionStatus: questionMeta?.questionStatus,
      questionMode: questionMeta?.questionMode,
      attachmentSummary: questionMeta?.attachmentSummary,
      requirementHints: questionMeta?.requirementHints,
      maxWords,
      tone,
      language,
      // Phase 2: Enhanced context
      sectionGuidance: sectionSpecificGuidance ? [sectionSpecificGuidance] : undefined,
      sectionType,
      sectionOrigin,
      sectionEnabled
    },
    conversationHistory: conversationHistory ?? [],
    action: 'generate'
  };

  try {
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI Assistant API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      content: result.content || '',
      suggestions: result.suggestions || [],
      citations: result.citations || [],
      recommendedActions: result.recommendedActions,
      suggestedKPIs: result.suggestedKPIs
    };
  } catch (error) {
    console.error('Section AI request failed:', error);
    return {
      content: [
        'AI generation temporarily unavailable. Please try again soon.',
        '',
        `Section: ${sectionTitle}`,
        'In the meantime, draft a short outline covering:',
        '- Key objectives',
        '- Supporting data/KPIs',
        '- Next actions'
      ].join('\n'),
      suggestions: ['Retry in a moment', 'Draft manually', 'Check connectivity']
    };
  }
}


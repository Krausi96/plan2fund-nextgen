type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  [key: string]: any;
};

type QuestionStatus = 'pending' | 'answered' | 'skipped' | 'hidden';

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
  aiPrompt?: string | null;
  requirements?: any[];
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
  sectionEnabled,
  aiPrompt,
  requirements
}: SectionAiRequest): Promise<SectionAiResponse> {
  
  // VERIFY: SectionEditor now passes requirements from Plan.sections
  console.log('[WRITER INPUT]', {
    section: sectionTitle,
    requirementsCount: requirements?.length || 0,
    aiPromptExists: !!aiPrompt,
    source: 'PLAN_RUNTIME', // CONFIRM: Reading from Plan, not DocumentStructure
    status: (requirements?.length || 0) > 0 && aiPrompt ? 'OK' : 'MISSING'
  });
  
  const payload = {
    message: context,
    context: {
      sectionId: sectionTitle,
      sectionTitle,
      currentContent: context,
      programType: program.type ?? 'grant',
      programName: program.name ?? undefined,
      documentType: documentType ?? 'business-plan',
      aiPrompt: aiPrompt || undefined,
      requirements: requirements || [],
      questionPrompt: questionMeta?.questionPrompt,
      questionStatus: questionMeta?.questionStatus,
      questionMode: questionMeta?.questionMode,
      attachmentSummary: questionMeta?.attachmentSummary,
      requirementHints: questionMeta?.requirementHints,
      maxWords,
      tone,
      language,
      // Phase 2: Enhanced context
      sectionType,
      sectionOrigin,
      sectionEnabled,
      assistantContext
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

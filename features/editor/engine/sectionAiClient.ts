import type { ConversationMessage, QuestionStatus } from '@/features/editor/types/plan';

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
};

export type SectionAiResponse = {
  content: string;
  suggestions?: string[];
  citations?: string[];
};

export async function generateSectionContent({
  sectionTitle,
  context,
  program,
  conversationHistory,
  questionMeta,
  maxWords = 400,
  tone = 'neutral',
  language = 'en'
}: SectionAiRequest): Promise<SectionAiResponse> {
  const payload = {
    message: context,
    context: {
      sectionId: sectionTitle,
      sectionTitle,
      currentContent: context,
      programType: program.type ?? 'grant',
      programName: program.name ?? undefined,
      questionPrompt: questionMeta?.questionPrompt,
      questionStatus: questionMeta?.questionStatus,
      questionMode: questionMeta?.questionMode,
      attachmentSummary: questionMeta?.attachmentSummary,
      requirementHints: questionMeta?.requirementHints,
      maxWords,
      tone,
      language
    },
    conversationHistory: conversationHistory ?? [],
    action: 'generate'
  };

  try {
    const response = await fetch('/api/ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      content: result.content || '',
      suggestions: result.suggestions || [],
      citations: result.citations || []
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


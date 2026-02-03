export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  [key: string]: any;
}

export type QuestionStatus = 'pending' | 'answered' | 'skipped' | 'hidden';
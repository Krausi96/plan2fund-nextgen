// ========= PLAN2FUND — OPENAI INTEGRATION =========
// OpenAI API integration for AI Assistant
// Provides real LLM responses for creative writing help

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIRequest {
  message: string;
  context: {
    sectionId: string;
    sectionTitle: string;
    currentContent: string;
    programType: string;
    programName?: string;
    sectionGuidance?: string[];
    hints?: string[];
  };
  action: 'generate' | 'improve' | 'compliance' | 'suggest';
}

interface AIResponse {
  content: string;
  wordCount: number;
  suggestions: string[];
  citations: string[];
  programSpecific: boolean;
  sectionGuidance: string[];
  complianceTips: string[];
  readinessScore: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, action }: AIRequest = req.body;

    if (!message || !context) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Generate AI response based on action
    const response = await generateAIResponse(message, context, action);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response'
    });
  }
}

async function generateAIResponse(
  message: string,
  context: AIRequest['context'],
  action: string
): Promise<AIResponse> {
  // Create system prompt based on action and context
  const systemPrompt = createSystemPrompt(action, context);
  
  // Create user prompt
  const userPrompt = createUserPrompt(message, context);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiContent = completion.choices[0]?.message?.content || '';
    
    // Parse the AI response and extract structured data
    return parseAIResponse(aiContent);
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}

function createSystemPrompt(action: string, context: AIRequest['context']): string {
  const { sectionTitle, programType, programName, sectionGuidance, hints } = context;
  
  let basePrompt = `You are an expert business plan writing assistant specializing in ${programType} applications.`;
  
  if (programName) {
    basePrompt += ` You are specifically helping with the ${programName} program.`;
  }
  
  basePrompt += `\n\nCurrent section: ${sectionTitle}`;
  
  if (sectionGuidance && sectionGuidance.length > 0) {
    basePrompt += `\n\nSection guidance: ${sectionGuidance.join(', ')}`;
  }
  
  if (hints && hints.length > 0) {
    basePrompt += `\n\nWriting hints: ${hints.join(', ')}`;
  }
  
  switch (action) {
    case 'generate':
      basePrompt += `\n\nGenerate new content for this section. Be specific, professional, and tailored to ${programType} requirements.`;
      break;
    case 'improve':
      basePrompt += `\n\nImprove the existing content. Make it more compelling, clear, and professional.`;
      break;
    case 'compliance':
      basePrompt += `\n\nCheck compliance and suggest improvements to meet ${programType} requirements.`;
      break;
    case 'suggest':
      basePrompt += `\n\nProvide specific suggestions for improving this section.`;
      break;
  }
  
  basePrompt += `\n\nRespond in JSON format with: {"content": "your response", "suggestions": ["suggestion1", "suggestion2"], "complianceTips": ["tip1", "tip2"]}`;
  
  return basePrompt;
}

function createUserPrompt(message: string, context: AIRequest['context']): string {
  const { currentContent, sectionTitle } = context;
  
  let prompt = `User request: ${message}\n\n`;
  
  if (currentContent) {
    prompt += `Current content in ${sectionTitle}:\n${currentContent}\n\n`;
  }
  
  prompt += `Please help with this section.`;
  
  return prompt;
}

function parseAIResponse(aiContent: string): AIResponse {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiContent);
    return {
      content: parsed.content || aiContent,
      wordCount: (parsed.content || aiContent).split(' ').length,
      suggestions: parsed.suggestions || [],
      citations: [],
      programSpecific: true,
      sectionGuidance: parsed.complianceTips || [],
      complianceTips: parsed.complianceTips || [],
      readinessScore: 85
    };
  } catch {
    // If not JSON, treat as plain text
    return {
      content: aiContent,
      wordCount: aiContent.split(' ').length,
      suggestions: ['Add more specific examples', 'Include data and metrics', 'Strengthen your value proposition'],
      citations: [],
      programSpecific: true,
      sectionGuidance: ['Focus on clarity and impact', 'Use concrete examples'],
      complianceTips: ['Ensure all requirements are met', 'Check word count limits'],
      readinessScore: 80
    };
  }
}

// ========= PLAN2FUND — OPENAI INTEGRATION =========
// OpenAI API integration for AI Assistant
// Provides real LLM responses for creative writing help
// Supports custom LLM endpoints with OpenAI fallback

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import type { ConversationMessage } from '@/features/editor/types/plan';
import { isCustomLLMEnabled, callCustomLLM } from '@/shared/lib/ai/customLLM';

// Initialize OpenAI client (only if API key is set)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

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
    questionPrompt?: string;
    questionStatus?: string;
    questionMode?: 'guidance' | 'critique';
    attachmentSummary?: string[];
    requirementHints?: string[];
    sectionType?: 'normal' | 'metadata' | 'references' | 'appendices' | 'ancillary';
    sectionOrigin?: 'template' | 'custom';
    sectionEnabled?: boolean;
  };
  conversationHistory?: ConversationMessage[];
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
  suggestedKPIs?: Array<{
    name: string;
    value: number;
    unit?: string;
    description?: string;
  }>;
  recommendedActions?: Array<{
    type: 'create_table' | 'create_kpi' | 'add_image' | 'add_reference' | 'configure_formatting';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, conversationHistory, action }: AIRequest = req.body;

    if (!message || !context) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if we're in test mode (no API key or custom LLM configured)
    const hasLLM = isCustomLLMEnabled() || openai;
    const isTestMode = !hasLLM || process.env.NODE_ENV === 'development';
    
    if (isTestMode && !hasLLM) {
      console.log('🧪 Running in test mode - returning mock AI response');
      const mockResponse = generateMockAIResponse(message, context, action);
      return res.status(200).json(mockResponse);
    }

    // Generate AI response based on action (tries custom LLM first, then OpenAI)
    const response = await generateAIResponse(message, context, action, conversationHistory);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response'
    });
  }
}

function generateMockAIResponse(
  _message: string,
  context: AIRequest['context'],
  action: string
): AIResponse {
  // Generate realistic mock responses for testing
  const mockResponses = {
    generate: `Based on your ${context.sectionTitle} section, here's a professional business plan section:

**${context.sectionTitle}**

Your ${context.sectionTitle.toLowerCase()} should clearly articulate your value proposition and market positioning. Focus on:

1. **Clear Problem Statement**: Define the specific problem your solution addresses
2. **Solution Overview**: Explain how your product/service solves this problem
3. **Market Opportunity**: Quantify the market size and growth potential
4. **Competitive Advantage**: Highlight what makes you unique

**Key Points to Include:**
- Use specific data and metrics where possible
- Address potential investor concerns
- Keep language professional but accessible
- Include relevant industry terminology

This section is crucial for demonstrating market understanding and business viability.`,
    
    improve: `Here's an improved version of your ${context.sectionTitle} section:

**Enhanced ${context.sectionTitle}**

[Improved content would go here based on your current content]

**Improvements Made:**
- Strengthened value proposition clarity
- Added specific market data
- Improved flow and readability
- Enhanced professional tone
- Addressed potential gaps

**Additional Recommendations:**
- Consider adding customer testimonials
- Include more specific financial projections
- Expand on competitive analysis`,
    
    compliance: `Compliance check for ${context.sectionTitle}:

✅ **Compliant Elements:**
- Professional tone and structure
- Clear business objectives
- Appropriate length and detail

⚠️ **Areas for Improvement:**
- Add more specific financial data
- Include risk assessment
- Strengthen market analysis

**Compliance Score: 7.5/10**

**Next Steps:**
1. Add detailed financial projections
2. Include competitive analysis
3. Address regulatory requirements
4. Add supporting documentation references`,
    
    suggest: `Suggestions for ${context.sectionTitle}:

**Content Suggestions:**
1. Add customer persona analysis
2. Include market research data
3. Expand on revenue model
4. Add competitive positioning

**Structure Suggestions:**
1. Use more bullet points for clarity
2. Add subheadings for better organization
3. Include visual elements (charts, graphs)
4. Add executive summary at the top

**Tone Suggestions:**
1. More confident and assertive
2. Use active voice
3. Include specific examples
4. Add compelling statistics`
  };

  return {
    content: mockResponses[action as keyof typeof mockResponses] || mockResponses.generate,
    wordCount: 250,
    suggestions: [
      'Add specific market data',
      'Include customer testimonials',
      'Expand on competitive analysis',
      'Add financial projections'
    ],
    citations: [
      'Austrian Business Development Agency',
      'EU Innovation Fund Guidelines',
      'Industry Market Research 2024'
    ],
    programSpecific: true,
    sectionGuidance: [
      'Focus on innovation aspects',
      'Highlight market potential',
      'Include team expertise',
      'Address funding requirements'
    ],
    complianceTips: [
      'Ensure all claims are substantiated',
      'Include relevant metrics',
      'Address potential risks',
      'Follow program guidelines'
    ],
    readinessScore: 7.5
  };
}

async function generateAIResponse(
  message: string,
  context: AIRequest['context'],
  action: string,
  conversationHistory?: ConversationMessage[]
): Promise<AIResponse> {
  // Create system prompt based on action and context
  const systemPrompt = createSystemPrompt(action, context);
  
  // Create user prompt
  const userPrompt = createUserPrompt(message, context);

  // Build messages array with conversation history
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Add current user message
  messages.push({ role: "user", content: userPrompt });

  let aiContent = '';

  // Try custom LLM first if enabled
  if (isCustomLLMEnabled()) {
    try {
      console.log('[Editor AI] Attempting custom LLM...');
      const customResponse = await callCustomLLM({
        messages: messages,
        temperature: 0.7,
        maxTokens: 1000,
      });
      aiContent = customResponse.output;
      console.log(`[Editor AI] Custom LLM succeeded (${customResponse.latencyMs}ms)`);
      
      // Parse and return response
      return parseAIResponse(aiContent);
    } catch (customError: any) {
      console.warn('[Editor AI] Custom LLM failed, falling back to OpenAI:', customError.message);
      // Continue to OpenAI fallback below
    }
  }

  // Fallback to OpenAI if custom LLM not enabled or failed
  if (openai) {
    try {
      console.log('[Editor AI] Using OpenAI...');
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      aiContent = completion.choices[0]?.message?.content || '';
      console.log('[Editor AI] OpenAI succeeded');
      
      // Parse the AI response and extract structured data
      return parseAIResponse(aiContent);
    } catch (error) {
      console.error('[Editor AI] OpenAI API call failed:', error);
      throw error;
    }
  }

  // If both failed and no LLM configured, return mock
  throw new Error('No LLM configured. Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT');
}

function createSystemPrompt(action: string, context: AIRequest['context']): string {
  const { sectionTitle, programType, programName, sectionGuidance, hints, sectionType, sectionOrigin, sectionEnabled } = context;
  
  // Phase 2: Use section-specific guidance if provided (from sectionAiClient.ts)
  let basePrompt = '';
  
  if (sectionGuidance && sectionGuidance.length > 0 && sectionGuidance[0]) {
    // Use section-specific prompt from sectionAiClient.ts
    basePrompt = sectionGuidance[0];
  } else {
    // Fallback to generic prompt
    basePrompt = `You are an expert business plan writing assistant specializing in ${programType} applications.`;
    
    if (programName) {
      basePrompt += ` You are specifically helping with the ${programName} program.`;
    }
    
    basePrompt += `\n\nCurrent section: ${sectionTitle}`;
  }
  
  // Add section metadata context
  if (sectionType) {
    basePrompt += `\n\nSection type: ${sectionType}`;
  }
  if (sectionOrigin) {
    basePrompt += `\n\nSection origin: ${sectionOrigin === 'template' ? 'Template-based' : 'Custom'}`;
  }
  if (sectionEnabled !== undefined) {
    basePrompt += `\n\nSection status: ${sectionEnabled ? 'Enabled' : 'Disabled'}`;
  }
  
  // Add additional hints if provided
  if (hints && hints.length > 0) {
    basePrompt += `\n\nWriting hints: ${hints.join(', ')}`;
  }
  
  // Add action-specific instructions
  switch (action) {
    case 'generate':
      if (!sectionGuidance || sectionGuidance.length === 0) {
        basePrompt += `\n\nGenerate new content for this section. Be specific, professional, and tailored to ${programType} requirements.`;
      }
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
  
  basePrompt += `\n\nWhen the section involves metrics, financial data, or measurable outcomes, you can suggest KPIs in your response.`;
  basePrompt += `\n\nWhen you identify opportunities for data visualization, tables, images, or references, suggest them as recommended actions.`;
  basePrompt += `\n\nRespond in JSON format with: {"content": "your response", "suggestions": ["suggestion1", "suggestion2"], "complianceTips": ["tip1", "tip2"], "suggestedKPIs": [{"name": "KPI name", "value": 0, "unit": "€", "description": "KPI description"}], "recommendedActions": [{"type": "create_table" | "create_kpi" | "add_image" | "add_reference" | "configure_formatting", "reason": "why this action is helpful", "priority": "high" | "medium" | "low"}]}`;
  
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
    
    // Validate and normalize recommendedActions
    const recommendedActions: Array<{
      type: 'create_table' | 'create_kpi' | 'add_image' | 'add_reference' | 'configure_formatting';
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions
          .filter((action: any) => 
            action && 
            typeof action === 'object' &&
            ['create_table', 'create_kpi', 'add_image', 'add_reference', 'configure_formatting'].includes(action.type) &&
            typeof action.reason === 'string' &&
            ['high', 'medium', 'low'].includes(action.priority)
          )
          .map((action: any) => ({
            type: action.type as 'create_table' | 'create_kpi' | 'add_image' | 'add_reference' | 'configure_formatting',
            reason: action.reason,
            priority: action.priority as 'high' | 'medium' | 'low'
          }))
      : [];
    
    // Validate and normalize suggestedKPIs
    const suggestedKPIs: Array<{
      name: string;
      value: number;
      unit?: string;
      description?: string;
    }> = Array.isArray(parsed.suggestedKPIs)
      ? parsed.suggestedKPIs
          .filter((kpi: any) => 
            kpi && 
            typeof kpi === 'object' &&
            typeof kpi.name === 'string' &&
            typeof kpi.value === 'number'
          )
          .map((kpi: any) => ({
            name: kpi.name,
            value: kpi.value,
            unit: typeof kpi.unit === 'string' ? kpi.unit : undefined,
            description: typeof kpi.description === 'string' ? kpi.description : undefined
          }))
      : [];
    
    const response: AIResponse = {
      content: parsed.content || aiContent,
      wordCount: (parsed.content || aiContent).split(' ').length,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      citations: [],
      programSpecific: true,
      sectionGuidance: Array.isArray(parsed.complianceTips) ? parsed.complianceTips : [],
      complianceTips: Array.isArray(parsed.complianceTips) ? parsed.complianceTips : [],
      readinessScore: typeof parsed.readinessScore === 'number' ? parsed.readinessScore : 85
    };
    
    // Only add optional fields if they have values
    if (suggestedKPIs.length > 0) {
      response.suggestedKPIs = suggestedKPIs;
    }
    if (recommendedActions.length > 0) {
      response.recommendedActions = recommendedActions;
    }
    
    return response;
  } catch (error) {
    // If not JSON, treat as plain text
    console.warn('[AI Response Parser] Failed to parse JSON, using plain text fallback:', error);
    return {
      content: aiContent,
      wordCount: aiContent.split(' ').length,
      suggestions: ['Add more specific examples', 'Include data and metrics', 'Strengthen your value proposition'],
      citations: [],
      programSpecific: true,
      sectionGuidance: ['Focus on clarity and impact', 'Use concrete examples'],
      complianceTips: ['Ensure all requirements are met', 'Check word count limits'],
      readinessScore: 80,
      suggestedKPIs: undefined,
      recommendedActions: undefined
    };
  }
}


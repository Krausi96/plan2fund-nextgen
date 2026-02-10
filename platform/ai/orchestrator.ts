/**
 * AI ORCHESTRATOR
 * Single entry point for all AI/LLM operations
 * Routes different request types to appropriate handlers
 * All LLM calls must go through this
 */

import { callLLM } from './llmClient';

export type AITaskType =
  | 'recommendPrograms'
  | 'generateBlueprint'
  | 'analyzeBusiness'
  | 'writeSection'
  | 'improveSection';

export interface AIRequest {
  type: AITaskType;
  payload: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  llmStats?: {
    provider: 'custom' | 'openai';
    latencyMs: number;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

/**
 * Main orchestrator function
 * Routes AI requests to appropriate handlers
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  try {
    switch (request.type) {
      case 'recommendPrograms':
        return await handleRecommendPrograms(request.payload);
      case 'generateBlueprint':
        return await handleGenerateBlueprint(request.payload);
      case 'analyzeBusiness':
        return await handleAnalyzeBusiness(request.payload);
      case 'writeSection':
        return await handleWriteSection(request.payload);
      case 'improveSection':
        return await handleImproveSection(request.payload);
      default:
        return {
          success: false,
          error: `Unknown AI task type: ${request.type}`,
        };
    }
  } catch (error) {
    console.error('[orchestrator] AI call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle program recommendation requests
 */
async function handleRecommendPrograms(payload: any): Promise<AIResponse> {
  const { answers, maxResults = 10 } = payload;

  if (!answers) {
    return {
      success: false,
      error: 'Missing user answers in payload',
    };
  }

  // Build user profile from answers
  const profile = [
    answers.location && `Location: ${answers.location}`,
    answers.organisation_type && `Organisation type: ${answers.organisation_type}`,
    answers.company_stage && `Company stage: ${answers.company_stage}`,
    answers.funding_amount && `Funding need: €${answers.funding_amount}`,
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = 'You are an expert on European funding programs. Return funding programs as JSON only.';
  const userPrompt = `Return up to ${maxResults} programs matching this profile:

${profile}

JSON STRUCTURE:
{
  "programs": [{"id": "string", "name": "string", "funding_types": ["grant","loan"]}]
}`;

  try {
    const llmResponse = await callLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 6000,
    });

    const parsed = JSON.parse(llmResponse.output);
    return {
      success: true,
      data: parsed.programs || [],
      llmStats: {
        provider: llmResponse.provider,
        latencyMs: llmResponse.latencyMs,
        tokens: llmResponse.usage
          ? {
              prompt: llmResponse.usage.promptTokens || 0,
              completion: llmResponse.usage.completionTokens || 0,
              total: llmResponse.usage.totalTokens || 0,
            }
          : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to recommend programs: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Handle blueprint generation requests
 */
async function handleGenerateBlueprint(payload: any): Promise<AIResponse> {
  const { documentStructure, userContext } = payload;

  if (!documentStructure) {
    return {
      success: false,
      error: 'Missing documentStructure in payload',
    };
  }

  const systemPrompt = 'You are an expert business plan generator. Generate comprehensive requirements for each section.';
  const userPrompt = `Generate blueprint for document structure:\n${JSON.stringify(documentStructure, null, 2)}\n\nUser context: ${JSON.stringify(userContext)}`;

  try {
    const llmResponse = await callLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 8000,
    });

    const blueprint = JSON.parse(llmResponse.output);
    return {
      success: true,
      data: blueprint,
      llmStats: {
        provider: llmResponse.provider,
        latencyMs: llmResponse.latencyMs,
        tokens: llmResponse.usage
          ? {
              prompt: llmResponse.usage.promptTokens || 0,
              completion: llmResponse.usage.completionTokens || 0,
              total: llmResponse.usage.totalTokens || 0,
            }
          : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Handle business analysis requests
 */
async function handleAnalyzeBusiness(payload: any): Promise<AIResponse> {
  const { businessData } = payload;

  if (!businessData) {
    return {
      success: false,
      error: 'Missing businessData in payload',
    };
  }

  const systemPrompt = 'You are a business analyst. Analyze the provided business information and identify key strengths and gaps.';
  const userPrompt = `Analyze this business:\n${JSON.stringify(businessData)}`;

  try {
    const llmResponse = await callLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      responseFormat: 'json',
      temperature: 0.5,
      maxTokens: 4000,
    });

    const analysis = JSON.parse(llmResponse.output);
    return {
      success: true,
      data: analysis,
      llmStats: {
        provider: llmResponse.provider,
        latencyMs: llmResponse.latencyMs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to analyze business: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Handle section writing requests
 */
async function handleWriteSection(payload: any): Promise<AIResponse> {
  const { sectionTitle, context, guidance } = payload;

  if (!sectionTitle || !context) {
    return {
      success: false,
      error: 'Missing sectionTitle or context in payload',
    };
  }

  const systemPrompt = guidance
    ? guidance
    : `You are an expert business plan writer. Write a professional, compelling section for a business plan.`;
  const userPrompt = `Write the "${sectionTitle}" section for this context:\n${JSON.stringify(context)}`;

  try {
    const llmResponse = await callLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      success: true,
      data: { content: llmResponse.output },
      llmStats: {
        provider: llmResponse.provider,
        latencyMs: llmResponse.latencyMs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to write section: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Handle section improvement requests
 */
async function handleImproveSection(payload: any): Promise<AIResponse> {
  const { sectionTitle, currentContent } = payload;

  if (!sectionTitle || !currentContent) {
    return {
      success: false,
      error: 'Missing sectionTitle or currentContent in payload',
    };
  }

  const systemPrompt = 'You are an expert editor. Improve the given section for clarity, impact, and professionalism.';
  const userPrompt = `Improve this "${sectionTitle}" section:\n\n${currentContent}`;

  try {
    const llmResponse = await callLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      maxTokens: 2000,
    });

    return {
      success: true,
      data: { improvedContent: llmResponse.output },
      llmStats: {
        provider: llmResponse.provider,
        latencyMs: llmResponse.latencyMs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to improve section: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

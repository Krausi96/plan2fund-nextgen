// AI Assistant API - Enhanced with Phase 3 Features
// Integrates Dynamic Decision Trees and Program-Specific Templates

import { NextApiRequest, NextApiResponse } from 'next';
import { createEnhancedAIHelper } from '@/lib/aiHelper';
import { ProgramTemplate, TemplateSection } from '@/lib/programTemplates';

interface AIAssistantRequest {
  action: 'generate' | 'improve' | 'compliance' | 'template' | 'decision-tree';
  sectionId: string;
  content: string;
  context?: string;
  // Phase 3 Enhancements
  decisionTreeAnswers?: Record<string, any>;
  programTemplate?: ProgramTemplate;
  currentTemplateSection?: TemplateSection;
  aiGuidance?: {
    context: string;
    tone: 'professional' | 'academic' | 'enthusiastic' | 'technical';
    key_points: string[];
    prompts?: Record<string, string>;
  };
  // Standard parameters
  programHints?: any;
  userAnswers?: Record<string, any>;
  maxWords?: number;
  tone?: 'neutral' | 'formal' | 'concise';
  language?: 'de' | 'en';
}

interface AIAssistantResponse {
  success: boolean;
  content?: string;
  wordCount?: number;
  suggestions?: string[];
  citations?: string[];
  // Phase 3 Enhancements
  programSpecific?: boolean;
  sectionGuidance?: string[];
  complianceTips?: string[];
  readinessScore?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIAssistantResponse>
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      action,
      sectionId,
      content,
      context,
      decisionTreeAnswers,
      programTemplate,
      currentTemplateSection,
      aiGuidance,
      programHints = {},
      userAnswers = {},
      maxWords = 200,
      tone = 'neutral',
      language = 'en'
    }: AIAssistantRequest = req.body;

    if (!action || !sectionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: action, sectionId'
      });
    }

    // Create enhanced AI helper with error handling
    let aiHelper;
    try {
      aiHelper = createEnhancedAIHelper(
        userAnswers,
        programHints,
        maxWords,
        tone,
        language,
        decisionTreeAnswers,
        programTemplate,
        currentTemplateSection,
        aiGuidance
      );
    } catch (helperError) {
      console.error('AI Helper creation error:', helperError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create AI helper',
        details: String(helperError)
      });
    }

    let response;

    try {
      switch (action) {
      case 'generate':
        // Generate new content
        response = await aiHelper.generateSectionContent(
          sectionId,
          context || content,
          {
            id: 'unknown',
            name: 'Unknown Program',
            type: 'grant',
            amount: '€0',
            eligibility: [],
            requirements: [],
            score: 0,
            reasons: [],
            risks: []
          }
        );
        break;

      case 'improve':
        // Improve existing content
        response = await aiHelper.generateSectionContent(
          sectionId,
          `Improve this content: ${content}\n\nContext: ${context || ''}`,
          {
            id: 'unknown',
            name: 'Unknown Program',
            type: 'grant',
            amount: '€0',
            eligibility: [],
            requirements: [],
            score: 0,
            reasons: [],
            risks: []
          }
        );
        break;

      case 'compliance':
        // Make content compliant
        response = await aiHelper.generateSectionContent(
          sectionId,
          `Make this content compliant with program requirements: ${content}\n\nContext: ${context || ''}`,
          {
            id: 'unknown',
            name: 'Unknown Program',
            type: 'grant',
            amount: '€0',
            eligibility: [],
            requirements: [],
            score: 0,
            reasons: [],
            risks: []
          }
        );
        break;

      case 'template':
        // Generate using program template
        if (!programTemplate || !currentTemplateSection) {
          return res.status(400).json({
            success: false,
            error: 'Program template and current section required for template generation'
          });
        }
        response = await aiHelper.generateTemplateBasedContent(
          sectionId,
          context || content,
          {
            id: 'unknown',
            name: programTemplate.program_name,
            type: 'grant',
            amount: '€0',
            eligibility: [],
            requirements: programTemplate.sections.map(s => s.id),
            score: 0,
            reasons: [],
            risks: []
          }
        );
        break;

      case 'decision-tree':
        // Generate using decision tree answers
        if (!decisionTreeAnswers) {
          return res.status(400).json({
            success: false,
            error: 'Decision tree answers required for decision tree generation'
          });
        }
        response = await aiHelper.generateDecisionTreeBasedContent(
          sectionId,
          context || content,
          {
            id: 'unknown',
            name: 'Unknown Program',
            type: 'grant',
            amount: '€0',
            eligibility: [],
            requirements: [],
            score: 0,
            reasons: [],
            risks: []
          },
          decisionTreeAnswers
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: generate, improve, compliance, template, decision-tree'
        });
      }
    } catch (actionError) {
      console.error('Action processing error:', actionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process action',
        details: String(actionError)
      });
    }

    return res.status(200).json({
      success: true,
      content: response.content,
      wordCount: response.wordCount,
      suggestions: response.suggestions,
      citations: response.citations,
      programSpecific: response.programSpecific,
      sectionGuidance: response.sectionGuidance,
      complianceTips: response.complianceTips,
      readinessScore: response.readinessScore
    });

  } catch (error) {
    console.error('AI Assistant API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

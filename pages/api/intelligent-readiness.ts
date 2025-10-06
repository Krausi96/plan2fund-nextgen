// Intelligent Readiness Check API - Phase 3 Step 4
// Enhanced readiness checking with Dynamic Decision Trees and Program-Specific Templates

import { NextApiRequest, NextApiResponse } from 'next';
import { ReadinessValidator, getProgramRequirements } from '@/lib/readiness';
import { ProgramTemplate, TemplateSection } from '@/lib/programTemplates';
import { DecisionTreeResult } from '@/lib/dynamicDecisionTree';

interface IntelligentReadinessRequest {
  action: 'check' | 'summary' | 'validate';
  programId: string;
  planContent: Record<string, any>;
  // Phase 3 Enhancements
  decisionTreeAnswers?: Record<string, any>;
  programTemplate?: ProgramTemplate;
  aiGuidance?: {
    context: string;
    tone: 'professional' | 'academic' | 'enthusiastic' | 'technical';
    key_points: string[];
    prompts?: Record<string, string>;
  };
}

interface IntelligentReadinessResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IntelligentReadinessResponse>
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
      programId,
      planContent,
      decisionTreeAnswers,
      programTemplate,
      aiGuidance
    }: IntelligentReadinessRequest = req.body;

    if (!action || !programId || !planContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: action, programId, planContent'
      });
    }

    // Get program requirements
    const programRequirements = await getProgramRequirements(programId);
    if (!programRequirements) {
      return res.status(404).json({
        success: false,
        error: 'Program requirements not found'
      });
    }

    // Create enhanced readiness validator with Phase 3 features
    const validator = new ReadinessValidator(
      programRequirements,
      planContent,
      decisionTreeAnswers,
      programTemplate,
      aiGuidance
    );

    let response;

    switch (action) {
      case 'check':
        // Perform intelligent readiness check
        response = await validator.performIntelligentReadinessCheck();
        break;

      case 'summary':
        // Get intelligent readiness summary
        response = validator.getIntelligentReadinessSummary();
        break;

      case 'validate':
        // Validate specific section
        const { section } = req.body;
        if (!section) {
          return res.status(400).json({
            success: false,
            error: 'Section parameter required for validate action'
          });
        }
        
        const checks = await validator.performIntelligentReadinessCheck();
        response = checks.find(c => c.section === section) || null;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: check, summary, validate'
        });
    }

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Intelligent Readiness API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

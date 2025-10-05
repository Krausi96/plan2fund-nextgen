// GPT-Enhanced API endpoint for testing new features
import { NextApiRequest, NextApiResponse } from 'next';
import { dataSource } from '../../src/lib/dataSource';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, programId } = req.query;

    switch (action) {
      case 'programs':
        // Get all GPT-enhanced programs
        const programs = await dataSource.getGPTEnhancedPrograms();
        return res.status(200).json({
          success: true,
          data: programs,
          count: programs.length,
          message: `Found ${programs.length} GPT-enhanced programs`
        });

      case 'questions':
        // Get decision tree questions for a specific program
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for questions action' });
        }
        const questions = await dataSource.getDecisionTreeQuestions(programId as string);
        return res.status(200).json({
          success: true,
          data: questions,
          count: questions.length,
          message: `Found ${questions.length} decision tree questions for program ${programId}`
        });

      case 'sections':
        // Get editor sections for a specific program
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for sections action' });
        }
        const sections = await dataSource.getEditorSections(programId as string);
        return res.status(200).json({
          success: true,
          data: sections,
          count: sections.length,
          message: `Found ${sections.length} editor sections for program ${programId}`
        });

      case 'criteria':
        // Get readiness criteria for a specific program
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for criteria action' });
        }
        const criteria = await dataSource.getReadinessCriteria(programId as string);
        return res.status(200).json({
          success: true,
          data: criteria,
          count: criteria.length,
          message: `Found ${criteria.length} readiness criteria for program ${programId}`
        });

      case 'guidance':
        // Get AI guidance for a specific program
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for guidance action' });
        }
        const guidance = await dataSource.getAIGuidance(programId as string);
        return res.status(200).json({
          success: true,
          data: guidance,
          message: guidance ? `Found AI guidance for program ${programId}` : `No AI guidance found for program ${programId}`
        });

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: programs, questions, sections, criteria, or guidance',
          availableActions: ['programs', 'questions', 'sections', 'criteria', 'guidance']
        });
    }
  } catch (error) {
    console.error('GPT-Enhanced API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

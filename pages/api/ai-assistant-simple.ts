// Simple AI Assistant API - Minimal working version
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
    const { action, sectionId, content } = req.body;

    if (!action || !sectionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: action, sectionId'
      });
    }

    // Simple response generator
    const generateResponse = (action: string, sectionId: string, content: string) => {
      return {
        content: `AI-generated content for ${sectionId}: ${content}`,
        wordCount: content.split(' ').length + 15,
        suggestions: ['Add more detail', 'Include examples', 'Strengthen argument'],
        citations: [],
        programSpecific: true,
        sectionGuidance: ['Focus on clarity', 'Use concrete examples'],
        complianceTips: ['Ensure requirements are met'],
        readinessScore: 80
      };
    };

    const response = generateResponse(action, sectionId, content || 'default content');

    return res.status(200).json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('AI Assistant Simple API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(error)
    });
  }
}

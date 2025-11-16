// Template Usage Tracking API
// Tracks which templates are used and how often they're edited
import type { NextApiRequest, NextApiResponse } from 'next';

interface TemplateUsageRequest {
  templateId: string;
  templateType: 'section' | 'document';
  wasEdited: boolean;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateId, templateType, wasEdited, timestamp }: TemplateUsageRequest = req.body;

    if (!templateId || !templateType) {
      return res.status(400).json({ 
        error: 'Missing required fields: templateId and templateType are required' 
      });
    }

    // TODO: Store in database for analytics
    // For now, just log the usage
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Template usage tracked:', {
        templateId,
        templateType,
        wasEdited,
        timestamp: timestamp || new Date().toISOString()
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Template usage tracked'
    });
  } catch (error) {
    console.error('Error tracking template usage:', error);
    return res.status(500).json({
      error: 'Failed to track template usage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


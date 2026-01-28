/**
 * Blueprint Generation API Endpoint
 * Converts FundingProgram to detailed blueprint data
 * Called AFTER program selection, not during recommendation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { generateEnhancedBlueprint } from '../../../features/ai/services/blueprintGenerator';

// Import the actual FundingProgram interface
import type { FundingProgram } from '../../../features/editor/lib/types/Program-Types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fundingProgram, userContext }: { 
      fundingProgram: FundingProgram; 
      userContext: Record<string, any> 
    } = req.body;

    // Validate required fields
    if (!fundingProgram?.id || !fundingProgram?.name) {
      return res.status(400).json({
        error: 'Missing required funding program fields',
        missing: ['id', 'name'].filter(field => !(fundingProgram as any)?.[field])
      });
    }

    console.log(`[blueprint-api] Generating blueprint for: ${fundingProgram.name}`);

    // Convert FundingProgram to the format expected by blueprint generator
    const programInfo = {
      id: fundingProgram.id,
      name: fundingProgram.name,
      description: fundingProgram.rawData?.description || '',
      funding_types: fundingProgram.fundingTypes || [],
      application_requirements: fundingProgram.applicationRequirements
    };

    // Generate enhanced blueprint
    const blueprint = await generateEnhancedBlueprint(programInfo, userContext);

    console.log(`[blueprint-api] Successfully generated blueprint for: ${fundingProgram.name}`);

    return res.status(200).json({
      success: true,
      programId: fundingProgram.id,
      programName: fundingProgram.name,
      blueprint: blueprint,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[blueprint-api] Blueprint generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate blueprint',
      programId: req.body?.fundingProgram?.id
    });
  }
}
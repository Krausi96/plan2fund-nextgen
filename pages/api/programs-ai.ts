// API endpoint for program AI features (questions, sections, criteria, guidance)
// This endpoint provides AI-generated content for programs from database
import { NextApiRequest, NextApiResponse } from 'next';
import { categoryConverter } from '@/features/editor/engine/categoryConverters';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action, programId } = req.query;

  if (!action || !programId || typeof action !== 'string' || typeof programId !== 'string') {
    return res.status(400).json({ error: 'action and programId are required' });
  }

  try {
    // Use scraper-lite database connection
    // Use dynamic import for TypeScript modules (works better with Next.js)
    const { getPool } = await import('../../scraper-lite/db/db');
    const pool = getPool();
    
    // Extract page ID from program ID (format: "page_123" or just "123")
    const pageId = programId.replace('page_', '');
    
    // Get page data
    const pageResult = await pool.query(
      'SELECT id, url, title, description, funding_types FROM pages WHERE id = $1',
      [pageId]
    );
    
    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    const page = pageResult.rows[0];
    
    // Get requirements
    const reqResult = await pool.query(
      'SELECT category, type, value, required, source, description, format FROM requirements WHERE page_id = $1',
      [pageId]
    );
    
    // Transform to categorized_requirements
    const categorizedRequirements: any = {};
    reqResult.rows.forEach((row: any) => {
      if (!categorizedRequirements[row.category]) {
        categorizedRequirements[row.category] = [];
      }
      categorizedRequirements[row.category].push({
        type: row.type,
        value: row.value,
        required: row.required,
        source: row.source,
        description: row.description,
        format: row.format
      });
    });
    
    // Create program-like object
    const programData = {
      id: `page_${page.id}`,
      name: page.title || page.url,
      description: page.description,
      funding_types: page.funding_types || [],
      categorized_requirements: categorizedRequirements
    };
    
    switch (action) {
      case 'questions':
        // Return basic questions (no longer using QuestionEngine)
        const questions = [
          {
            id: 'location',
            label: 'Where is your company based?',
            type: 'single-select',
            options: [
              { value: 'austria', label: 'Austria' },
              { value: 'germany', label: 'Germany' },
              { value: 'eu', label: 'EU' },
              { value: 'international', label: 'International' },
            ],
          },
          {
            id: 'company_type',
            label: 'What type of company are you?',
            type: 'single-select',
            options: [
              { value: 'startup', label: 'Startup' },
              { value: 'sme', label: 'SME' },
              { value: 'large', label: 'Large Company' },
              { value: 'research', label: 'Research Institution' },
            ],
          },
          {
            id: 'funding_amount',
            label: 'How much funding do you need?',
            type: 'single-select',
            options: [
              { value: 'under100k', label: 'Under €100k' },
              { value: '100kto500k', label: '€100k - €500k' },
              { value: '500kto2m', label: '€500k - €2M' },
              { value: 'over2m', label: 'Over €2M' },
            ],
          },
        ];
        return res.status(200).json({
          success: true,
          data: questions
        });
        
      case 'sections':
        // Generate editor sections
        const programType = (page.funding_types && page.funding_types.length > 0) 
          ? page.funding_types[0] 
          : 'grants';
        const editorSections = categoryConverter.convertToEditorSections(categorizedRequirements, programType);
        return res.status(200).json({
          success: true,
          data: editorSections
        });
        
      case 'criteria':
        // Generate readiness criteria (derive from requirements)
        const criteria = Object.entries(categorizedRequirements).map(([category, reqs]: [string, any]) => ({
          category,
          requirements: reqs.map((r: any) => ({
            id: `${category}_${r.type}`,
            description: r.description || `${category} - ${r.type}`,
            required: r.required,
            type: r.type
          }))
        }));
        return res.status(200).json({
          success: true,
          data: criteria
        });
        
      case 'guidance':
        // Generate AI guidance
        const guidance = {
          context: `Program: ${programData.name}`,
          tone: 'professional' as const,
          key_points: Object.keys(categorizedRequirements).slice(0, 5),
          prompts: Object.fromEntries(
            Object.entries(categorizedRequirements).slice(0, 3).map(([cat, reqs]: [string, any]) => [
              cat,
              `${cat} requirements: ${reqs.map((r: any) => r.type).join(', ')}`
            ])
          )
        };
        return res.status(200).json({
          success: true,
          data: guidance
        });
        
      case 'programs':
        // Return program data
        return res.status(200).json({
          success: true,
          data: programData
        });
        
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('Error in programs-ai API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


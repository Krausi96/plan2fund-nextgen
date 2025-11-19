// API endpoint for program requirements (Decision Tree, Editor, Library)
import { NextApiRequest, NextApiResponse } from 'next';

// Database connection handled by scraper-lite/src/db/neon-client.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Program ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get all requirements for a program using new category converters
      const requirements = await getProgramRequirements(id);
      return res.status(200).json(requirements);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in requirements API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getProgramRequirements(programId: string) {
  // Use shared database connection (pages + requirements tables)
  const { getPool } = await import('@/shared/lib/database');
  const pool = getPool();
  
  try {
    // Extract page ID from program ID (format: "page_123" or just "123")
    const pageId = programId.replace('page_', '');
    
    // Get page data from pages table (database schema)
    const pageQuery = `
      SELECT id, url, title, description, funding_amount_min, funding_amount_max,
             currency, deadline, open_deadline, contact_email, contact_phone,
             region, funding_types, program_focus, fetched_at
      FROM pages 
      WHERE id = $1
    `;
    const pageResult = await pool.query(pageQuery, [pageId]);
    
    if (pageResult.rows.length === 0) {
      throw new Error(`Program not found (page_id: ${pageId})`);
    }
    
    const page = pageResult.rows[0];
    
    // Get requirements from requirements table (18 categories)
    const reqQuery = `
      SELECT category, type, value, required, source, description, format, requirements
      FROM requirements
      WHERE page_id = $1
      ORDER BY category, type
    `;
    const reqResult = await pool.query(reqQuery, [pageId]);
    
    // Transform requirements to categorized_requirements format
    const categorizedRequirements: any = {};
    reqResult.rows.forEach((row: any) => {
      if (!categorizedRequirements[row.category]) {
        categorizedRequirements[row.category] = [];
      }
      
      // Parse value if it's JSON stored as TEXT
      let parsedValue: any = row.value;
      try {
        if (typeof row.value === 'string' && (row.value.startsWith('{') || row.value.startsWith('['))) {
          parsedValue = JSON.parse(row.value);
        }
      } catch (e) {
        // Not JSON, use as-is
      }
      
      categorizedRequirements[row.category].push({
        type: row.type,
        value: parsedValue,
        required: row.required,
        source: row.source,
        description: row.description,
        format: row.format,
        // Include nested requirements if present
        requirements: row.requirements ? (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : undefined
      });
    });

    // Check if we have categorized_requirements
    if (Object.keys(categorizedRequirements).length > 0) {
      console.log('🔄 Using categorized_requirements from database');
      
      // Determine program type for template selection
      const programType = (page.funding_types && page.funding_types.length > 0) 
        ? page.funding_types[0] 
        : 'grants';
      
      // Create program-like object for converters
      const programData = {
        id: `page_${page.id}`,
        name: page.title || page.url,
        description: page.description,
        funding_amount_min: page.funding_amount_min,
        funding_amount_max: page.funding_amount_max,
        currency: page.currency || 'EUR',
        deadline: page.deadline,
        open_deadline: page.open_deadline || false,
        contact_email: page.contact_email,
        contact_phone: page.contact_phone,
        source_url: page.url,
        region: page.region,
        funding_types: page.funding_types || [],
        program_focus: page.program_focus || [],
        categorized_requirements: categorizedRequirements
      };
      
      // Return basic questions (no longer using QuestionEngine)
      const decisionTree = [
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
      
      // Use unified template system: Get master + program-specific merge
      const { getDocuments } = await import('@templates');
      
      // Get base URL for server-side API calls
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      
      // Get sections via unified system (already handles master + program-specific merge)
      // const masterSections = await getSections(programType, undefined, baseUrl);
      // const programSections = await getSections(programType, programId, baseUrl);
      
      // Convert to editor format (simplified - using master templates)
      const editor: any[] = []; // Editor sections now come from master templates
      const library = [{
        id: `library_${programId}`,
        eligibility_text: programData.description || '',
        documents: categorizedRequirements.documents || [],
        funding_amount: `${programData.funding_amount_min || 0} - ${programData.funding_amount_max || 0} ${programData.currency || 'EUR'}`,
        deadlines: programData.deadline ? [programData.deadline] : [],
        application_procedures: categorizedRequirements.timeline || [],
        compliance_requirements: categorizedRequirements.compliance || [],
        contact_info: {
          email: programData.contact_email,
          phone: programData.contact_phone
        }
      }];

      // Get documents using unified system (master + program-specific merge)
      const unifiedDocuments = await getDocuments(programType, 'submission', programId, baseUrl);
      
      // Convert unified documents to API format
      const additionalDocuments = unifiedDocuments.map(doc => ({
        id: doc.id,
        title: doc.name,
        description: doc.description,
        format: doc.format.toUpperCase(),
        source: doc.source?.officialProgram ? 'program' : 'master'
      }));
      
      return {
        program_id: programId,
        program_name: programData.name,
        program_type: programType,
        decision_tree: decisionTree,
        editor: editor,
        library: library,
        additionalDocuments,
        data_source: 'database' // Flag to indicate we used database
      };
    } else {
      console.log('⚠️ No categorized_requirements found, using minimal data');
      
      // Fallback: minimal structure if no requirements
      return {
        program_id: programId,
        program_name: page.title || page.url,
        program_type: (page.funding_types && page.funding_types.length > 0) 
          ? page.funding_types[0] 
          : 'grants',
        decision_tree: [],
        editor: [],
        library: [{
          id: 'library_1',
          eligibility_text: page.description || '',
          documents: [],
          funding_amount: `${page.funding_amount_min || 0} - ${page.funding_amount_max || 0} ${page.currency || 'EUR'}`,
          deadlines: page.deadline ? [page.deadline] : [],
          application_procedures: [],
          compliance_requirements: [],
          contact_info: {
            email: page.contact_email,
            phone: page.contact_phone
          }
        }],
        additionalDocuments: [],
        data_source: 'database_minimal'
      };
    }
  } catch (error) {
    console.error('Error fetching program requirements:', error);
    throw error;
  }
}


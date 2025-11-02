// API endpoint for program requirements (Decision Tree, Editor, Library)
import { NextApiRequest, NextApiResponse } from 'next';
import { categoryConverter, CategorizedRequirements } from '@/features/editor/engine/categoryConverters';
import { getDocumentBundle } from '@/shared/data/documentBundles';
import { getDocumentById } from '@/shared/data/documentDescriptions';

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
    } else if (req.method === 'POST') {
      // Update requirements for a program
      const { decisionTree, editor, library } = req.body;
      await updateProgramRequirements(id, { decisionTree, editor, library });
      return res.status(200).json({ success: true });
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
  // Use scraper-lite database connection (pages + requirements tables)
  const { getPool } = require('../../../scraper-lite/src/db/neon-client');
  const pool = getPool();
  
  try {
    // Extract page ID from program ID (format: "page_123" or just "123")
    const pageId = programId.replace('page_', '');
    
    // Get page data from pages table (scraper-lite schema)
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
      SELECT category, type, value, required, source, description, format
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
      categorizedRequirements[row.category].push({
        type: row.type,
        value: row.value,
        required: row.required,
        source: row.source,
        description: row.description,
        format: row.format
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
      
      // Use question engine to generate decision tree questions
      const { QuestionEngine } = await import('@/features/reco/engine/questionEngine');
      const questionEngine = new QuestionEngine([programData as any]);
      const decisionTree = questionEngine.getCoreQuestions();
      
      // Convert to editor and library formats
      const editor = categoryConverter.convertToEditorSections(categorizedRequirements as CategorizedRequirements, programType);
      const library = [categoryConverter.convertToLibraryData(categorizedRequirements as CategorizedRequirements, programData as any)];

      const additionalDocuments = buildAdditionalDocuments(programData, categorizedRequirements);
      
      return {
        program_id: programId,
        decision_tree: decisionTree,
        editor: editor,
        library: library,
        additionalDocuments,
        data_source: 'database' // Flag to indicate we used database
      };
    } else {
      console.log('⚠️ No categorized_requirements found, using minimal data');
      
      // Fallback: minimal structure if no requirements
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
        source_url: page.url
      };
      
      return {
        program_id: programId,
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

function buildAdditionalDocuments(program: any, categorizedRequirements: CategorizedRequirements | null) {
  const product: 'submission' | 'strategy' | 'review' = 'submission';
  
  // Determine route from funding_types or program structure
  const fundingTypes = program.funding_types || [];
  let route: 'grant' | 'loan' | 'equity' | 'visa' | 'bankLoans' | 'grants' = 'grants';
  if (fundingTypes.includes('loan')) route = 'loan';
  else if (fundingTypes.includes('equity')) route = 'equity';

  // Static bundle fallback
  const bundleRoute = route === 'grant' ? 'grants' : route;
  const bundle = getDocumentBundle(product as any, bundleRoute as any);
  const staticDocs = (bundle?.documents || []).map((docId: string) => {
    const spec = getDocumentById(docId);
    return {
      id: docId,
      title: spec?.title || docId,
      description: spec?.short || '',
      format: (spec?.formatHints && spec.formatHints[0]) || 'PDF',
      source: 'bundle'
    };
  });

  // Program-specific docs from categorized data if available
  const programDocs = categorizedRequirements && (categorizedRequirements as any).documents_required
    ? (categorizedRequirements as any).documents_required.map((d: any, idx: number) => ({
        id: d.id || `prog_doc_${idx}`,
        title: d.title || 'Required Document',
        description: d.description || d.note || '',
        format: d.format || 'PDF',
        source: 'program'
      }))
    : [];

  // Merge and dedupe by id
  const byId: Record<string, any> = {};
  [...programDocs, ...staticDocs].forEach(doc => {
    if (!byId[doc.id]) byId[doc.id] = doc; else {
      byId[doc.id] = { ...byId[doc.id], ...doc };
    }
  });
  return Object.values(byId);
}

async function updateProgramRequirements(
  programId: string, 
  requirements: {
    decisionTree?: any[];
    editor?: any[];
    library?: any[];
  }
) {
  // Note: This function updates legacy tables that may not exist in scraper-lite schema
  // Consider deprecating or migrating to pages/requirements schema
  console.warn('updateProgramRequirements: Using legacy schema - consider migration to pages/requirements');
  console.warn('updateProgramRequirements: This function may not work with current database schema');
  
  // TODO: Implement using pages/requirements schema or deprecate this endpoint
  throw new Error('updateProgramRequirements is not yet migrated to pages/requirements schema');
  
  /* Legacy code - disabled until migration
  const { getPool } = require('../../../scraper-lite/src/db/neon-client');
  const pool = getPool();
  
  try {
    await pool.query('BEGIN');

    // Update decision tree questions
    if (requirements.decisionTree) {
      // Delete existing questions
      await client.query('DELETE FROM decision_tree_questions WHERE program_id = $1', [programId]);
      
      // Insert new questions
      for (const question of requirements.decisionTree) {
        await client.query(`
          INSERT INTO decision_tree_questions 
          (program_id, question_text, answer_options, next_question_id, 
           validation_rules, skip_logic, required, category)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          programId,
          question.question_text,
          JSON.stringify(question.answer_options),
          question.next_question_id,
          JSON.stringify(question.validation_rules),
          JSON.stringify(question.skip_logic),
          question.required,
          question.category
        ]);
      }
    }

    // Update editor sections
    if (requirements.editor) {
      // Delete existing sections
      await client.query('DELETE FROM editor_sections WHERE program_id = $1', [programId]);
      
      // Insert new sections
      for (const section of requirements.editor) {
        await client.query(`
          INSERT INTO editor_sections 
          (program_id, section_name, prompt, hints, word_count_min, 
           word_count_max, required, ai_guidance, template)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          programId,
          section.section_name,
          section.prompt,
          JSON.stringify(section.hints),
          section.word_count_min,
          section.word_count_max,
          section.required,
          section.ai_guidance,
          section.template
        ]);
      }
    }

    // Update library details
    if (requirements.library) {
      // Delete existing details
      await client.query('DELETE FROM library_details WHERE program_id = $1', [programId]);
      
      // Insert new details
      for (const detail of requirements.library) {
        await client.query(`
          INSERT INTO library_details 
          (program_id, eligibility_text, documents, funding_amount, 
           deadlines, application_procedures, compliance_requirements, contact_info)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          programId,
          detail.eligibility_text,
          JSON.stringify(detail.documents),
          detail.funding_amount,
          JSON.stringify(detail.deadlines),
          JSON.stringify(detail.application_procedures),
          JSON.stringify(detail.compliance_requirements),
          JSON.stringify(detail.contact_info)
        ]);
      }
    }

    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
  */
}

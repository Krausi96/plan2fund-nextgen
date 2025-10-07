// API endpoint for program requirements (Decision Tree, Editor, Library)
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Program ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get all requirements for a program
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
  const client = await pool.connect();
  
  try {
    // Get decision tree questions
    const decisionTreeQuery = `
      SELECT id, question_text, answer_options, next_question_id, 
             validation_rules, skip_logic, required, category
      FROM decision_tree_questions 
      WHERE program_id = $1 
      ORDER BY id
    `;
    const decisionTreeResult = await client.query(decisionTreeQuery, [programId]);

    // Get editor sections
    const editorQuery = `
      SELECT id, section_name, prompt, hints, word_count_min, 
             word_count_max, required, ai_guidance, template
      FROM editor_sections 
      WHERE program_id = $1 
      ORDER BY id
    `;
    const editorResult = await client.query(editorQuery, [programId]);

    // Get library details
    const libraryQuery = `
      SELECT id, eligibility_text, documents, funding_amount, 
             deadlines, application_procedures, compliance_requirements, contact_info
      FROM library_details 
      WHERE program_id = $1 
      ORDER BY id
    `;
    const libraryResult = await client.query(libraryQuery, [programId]);

    return {
      program_id: programId,
      decision_tree: decisionTreeResult.rows,
      editor: editorResult.rows,
      library: libraryResult.rows
    };
  } finally {
    client.release();
  }
}

async function updateProgramRequirements(
  programId: string, 
  requirements: {
    decisionTree?: any[];
    editor?: any[];
    library?: any[];
  }
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

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

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

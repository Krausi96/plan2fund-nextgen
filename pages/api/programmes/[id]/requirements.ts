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
    // Get program data from main table with JSONB columns
    const programQuery = `
      SELECT id, name, description, program_type, funding_amount_min, funding_amount_max,
             currency, deadline, eligibility_criteria, requirements, contact_info,
             source_url, target_personas, tags, decision_tree_questions, editor_sections, 
             readiness_criteria, ai_guidance
      FROM programs 
      WHERE id = $1 AND is_active = true
    `;
    const programResult = await client.query(programQuery, [programId]);

    if (programResult.rows.length === 0) {
      throw new Error('Program not found');
    }

    const program = programResult.rows[0];

    // Transform decision_tree_questions from JSONB to expected format
    const decisionTree = (program.decision_tree_questions || []).map((q: any, index: number) => ({
      id: q.id || `q_${index}`,
      question_text: q.question,
      answer_options: q.options || [],
      next_question_id: q.follow_up_questions && q.follow_up_questions[0] ? q.follow_up_questions[0].replace('q_', '') : null,
      validation_rules: q.validation_rules || [],
      skip_logic: {},
      required: q.required !== false,
      category: q.ai_guidance || 'eligibility'
    }));

    // Transform editor_sections from JSONB to expected format
    const editor = (program.editor_sections || []).map((s: any, index: number) => ({
      id: s.id || `section_${index}`,
      section_name: s.title,
      prompt: s.guidance || '',
      hints: s.hints || [],
      word_count_min: s.word_count_min,
      word_count_max: s.word_count_max,
      required: s.required !== false,
      ai_guidance: s.guidance,
      template: s.template || ''
    }));

    // Transform library details from program data
    const library = [{
      id: 'library_1',
      eligibility_text: (program.eligibility_criteria && program.eligibility_criteria.text) || program.description || '',
      documents: (program.requirements && program.requirements.documents) || [],
      funding_amount: `${program.funding_amount_min || 0} - ${program.funding_amount_max || 0} ${program.currency || 'EUR'}`,
      deadlines: program.deadline ? [program.deadline] : [],
      application_procedures: (program.requirements && program.requirements.procedures) || [],
      compliance_requirements: (program.requirements && program.requirements.compliance) || [],
      contact_info: program.contact_info || {}
    }];

    return {
      program_id: programId,
      decision_tree: decisionTree,
      editor: editor,
      library: library
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

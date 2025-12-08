// API endpoint for program requirements (Decision Tree, Editor, Library)
// NO DATABASE: Returns minimal structure - Editor uses localStorage data instead
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Program ID is required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return minimal structure - no database needed
  // Editor will use localStorage data (saved by ProgramFinder) instead
  // This endpoint exists for backward compatibility with editor code
  return res.status(200).json({
    program_id: id,
    program_name: id, // Will be overridden by localStorage data in editor
    program_type: 'grants', // Default, will be overridden by localStorage data
    decision_tree: [],
    editor: [],
    library: [{
      id: 'library_1',
      eligibility_text: '',
      documents: [],
      funding_amount: '',
      deadlines: [],
      application_procedures: [],
      compliance_requirements: [],
      contact_info: { email: null, phone: null }
    }],
    additionalDocuments: [],
    data_source: 'localStorage' // Indicates we're using localStorage, not database
  });
}


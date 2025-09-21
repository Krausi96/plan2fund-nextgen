import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  });
}

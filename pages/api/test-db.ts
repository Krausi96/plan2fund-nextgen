import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Temporary: Use hardcoded URL for testing
  const originalUrl = process.env.DATABASE_URL;
  if (!originalUrl) {
    return res.status(500).json({ 
      success: false, 
      message: 'DATABASE_URL not found in environment variables',
      envVars: Object.keys(process.env).filter(key => key.includes('DATABASE'))
    });
  }
  
  const db = new DatabaseService();
  
  try {
    console.log('Testing database connection...');
    
    const connected = await db.testConnection();
    
    if (connected) {
      const count = await db.getProgramCount();
      res.json({ 
        success: true, 
        message: 'Database connected successfully',
        programCount: count
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Database connection failed'
      });
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await db.close();
  }
}

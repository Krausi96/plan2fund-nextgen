import { Pool } from 'pg';

export interface Program {
  id: string;
  name: string;
  description: string;
  program_type: string;
  funding_amount_min: number;
  funding_amount_max: number;
  currency: string;
  deadline: Date | null;
  eligibility_criteria: any;
  requirements: any;
  contact_info: any;
  source_url: string;
  scraped_at: Date;
  confidence_score: number;
  is_active: boolean;
}

export interface ProgramFilters {
  program_type?: string;
  funding_amount_min?: number;
  funding_amount_max?: number;
  location?: string;
}

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async savePrograms(programs: any[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const program of programs) {
        await client.query(`
          INSERT INTO programs (id, name, description, program_type, funding_amount_min, funding_amount_max, currency, deadline, eligibility_criteria, requirements, contact_info, source_url, scraped_at, confidence_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            program_type = EXCLUDED.program_type,
            funding_amount_min = EXCLUDED.funding_amount_min,
            funding_amount_max = EXCLUDED.funding_amount_max,
            currency = EXCLUDED.currency,
            deadline = EXCLUDED.deadline,
            eligibility_criteria = EXCLUDED.eligibility_criteria,
            requirements = EXCLUDED.requirements,
            contact_info = EXCLUDED.contact_info,
            source_url = EXCLUDED.source_url,
            scraped_at = EXCLUDED.scraped_at,
            confidence_score = EXCLUDED.confidence_score
        `, [
          program.id,
          program.name,
          program.description,
          program.program_type,
          program.funding_amount_min,
          program.funding_amount_max,
          program.currency,
          program.deadline,
          JSON.stringify(program.eligibility_criteria),
          JSON.stringify(program.requirements),
          JSON.stringify(program.contact_info),
          program.source_url,
          program.scraped_at,
          program.confidence_score
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Successfully saved ${programs.length} programs to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving programs to database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getPrograms(filters?: ProgramFilters): Promise<Program[]> {
    let query = 'SELECT * FROM programs WHERE is_active = true';
    const params: any[] = [];
    let paramCount = 0;
    
    if (filters?.program_type) {
      paramCount++;
      query += ` AND program_type = $${paramCount}`;
      params.push(filters.program_type);
    }
    
    if (filters?.funding_amount_min) {
      paramCount++;
      query += ` AND funding_amount_max >= $${paramCount}`;
      params.push(filters.funding_amount_min);
    }

    if (filters?.funding_amount_max) {
      paramCount++;
      query += ` AND funding_amount_min <= $${paramCount}`;
      params.push(filters.funding_amount_max);
    }
    
    query += ' ORDER BY scraped_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getProgramById(id: string): Promise<Program | null> {
    const result = await this.pool.query('SELECT * FROM programs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getProgramCount(): Promise<number> {
    const result = await this.pool.query('SELECT COUNT(*) FROM programs WHERE is_active = true');
    return parseInt(result.rows[0].count);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async close() {
    await this.pool.end();
  }
}


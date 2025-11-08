import { Client } from 'pg';

const TABLE_QUERIES = [
  `CREATE TABLE IF NOT EXISTS anonymized_plans (
      id VARCHAR(255) PRIMARY KEY,
      structure JSONB NOT NULL,
      quality_metrics JSONB NOT NULL,
      program_matched JSONB,
      outcome JSONB,
      metadata JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS template_usage (
      id SERIAL PRIMARY KEY,
      template_id VARCHAR(255) NOT NULL,
      template_type VARCHAR(50) NOT NULL,
      was_edited BOOLEAN DEFAULT FALSE,
      used_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(template_id, template_type, used_at)
    )`,
  `CREATE TABLE IF NOT EXISTS scraper_quality_metrics (
      id SERIAL PRIMARY KEY,
      institution VARCHAR(255) NOT NULL,
      page_type VARCHAR(100),
      extraction_method VARCHAR(50) NOT NULL,
      accuracy DECIMAL(3,2) NOT NULL,
      confidence DECIMAL(3,2) NOT NULL,
      extraction_pattern TEXT,
      recorded_at TIMESTAMP DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS user_feedback (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      feedback_type VARCHAR(50) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL,
      rating INTEGER,
      comment TEXT,
      submitted_at TIMESTAMP DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS user_consent (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      consent_type VARCHAR(50) NOT NULL,
      consent BOOLEAN NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, consent_type)
    )`
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database.');

    for (const query of TABLE_QUERIES) {
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
      process.stdout.write(`Ensuring table ${tableName} ... `);
      await client.query(query);
      console.log('OK');
    }

    console.log('All data-collection tables are ready.');
  } catch (error) {
    console.error('Error initializing tables:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

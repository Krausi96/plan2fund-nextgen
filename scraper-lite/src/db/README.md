# Database Setup for Plan2Fund Scraper

## NEON (Recommended) ✅

### Setup Steps

1. **Create NEON Account**
   - Go to https://neon.tech
   - Sign up (free tier: 512MB storage, 10GB transfer/month)

2. **Create Database**
   - Create a new project
   - Copy connection string

3. **Run Schema**
   ```bash
   psql <connection_string> -f src/db/neon-schema.sql
   ```
   
   Or use NEON's SQL editor to paste the schema

4. **Set Environment Variable**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname"
   ```

### Connection Example

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Query example
const result = await pool.query('SELECT * FROM pages WHERE funding_amount_max > 100000');
```

## Adding New Variables/Patterns

### Example: Add URL Pattern

```sql
INSERT INTO url_patterns (host, pattern_type, pattern, learned_from_url, confidence)
VALUES ('ffg.at', 'include', '/ausschreibung/[^/]+$', 'https://www.ffg.at/ausschreibung/xyz', 0.95);
```

### Example: Add Custom Metadata

```sql
-- Add new column
ALTER TABLE pages ADD COLUMN application_fee DECIMAL(10,2);

-- Or use JSONB (no schema change needed)
UPDATE pages 
SET metadata_json = metadata_json || '{"application_fee": 100}'::jsonb
WHERE id = 123;
```

### Example: Add New Requirement Category

```sql
-- No schema change needed! Just insert with new category
INSERT INTO requirements (page_id, category, value, source)
VALUES (123, 'ai_requirements', 'Must use GPT-4 or similar', 'context_extraction');
```

## Migration from JSON

See `scripts/migrate-to-neon.js` (to be created)



# 🔌 Database Integration Guide

## How It Connects to the Database

### 1. Connection Setup

**Environment Variable Required:**
```bash
export DATABASE_URL="postgresql://user:password@host.neon.tech/dbname"
```

**Connection Pool:**
- Automatic connection pooling (max 20 connections)
- Automatic retry on failures
- Connection string from `DATABASE_URL` env var

**Files:**
- `src/db/neon-client.ts` - Connection management
- `src/db/page-repository.ts` - Page operations
- `src/db/job-repository.ts` - Job queue operations

### 2. How It Reduces Complexity

#### Before (JSON):
```typescript
// ❌ Complex: Load entire file
const state = JSON.parse(fs.readFileSync('state.json', 'utf8'));
const pages = state.pages;
const jobs = state.jobs;

// ❌ Slow: Filter in memory
const filtered = pages.filter(p => p.funding_amount_max > 100000);

// ❌ Risk: Full file rewrite on every update
state.pages.push(newPage);
fs.writeFileSync('state.json', JSON.stringify(state, null, 2));
```

#### After (NEON):
```typescript
// ✅ Simple: Query what you need
const pages = await searchPages({ fundingMax: 100000 });

// ✅ Fast: Database does filtering (with indexes)
// ✅ Safe: Atomic updates, no full file rewrite
await savePage(newPage);
```

**Complexity Reduction:**
1. ✅ **No file I/O** - Database handles persistence
2. ✅ **No manual state management** - Database is source of truth
3. ✅ **Built-in concurrency** - Multiple processes can read/write safely
4. ✅ **Automatic backups** - NEON handles backups
5. ✅ **Indexing** - Fast queries without manual optimization

### 3. Reliability Comparison

#### Current System (JSON):
- ⚠️ **Risk**: File corruption (write fails mid-operation)
- ⚠️ **Risk**: Concurrent access issues
- ⚠️ **Risk**: No transaction safety
- ⚠️ **Risk**: Manual backup required

#### NEON Database:
- ✅ **ACID transactions** - All or nothing updates
- ✅ **Automatic backups** - Built-in backup system
- ✅ **Connection pooling** - Handles failures gracefully
- ✅ **Retry logic** - Automatic retry on transient failures
- ✅ **Concurrent access** - Multiple readers/writers safe

**Reliability Features:**
1. **Transaction Safety**: Updates are atomic (all or nothing)
2. **Automatic Retries**: Connection failures auto-retry
3. **Connection Pooling**: Manages connections efficiently
4. **NEON Backups**: Automatic daily backups (paid tier)
5. **Migration Script**: Can restore from JSON backup anytime

### 4. Setup Steps

#### Step 1: Create NEON Database
1. Go to https://neon.tech
2. Create project
3. Copy connection string

#### Step 2: Run Schema
```bash
# Option A: Using psql
psql <connection_string> -f src/db/neon-schema.sql

# Option B: Using NEON SQL Editor
# Paste contents of src/db/neon-schema.sql into NEON's SQL editor
```

#### Step 3: Set Environment Variable
```bash
export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname"
```

#### Step 4: Migrate Existing Data
```bash
node scripts/migrate-to-neon.js
```

#### Step 5: Update Scraper (Dual-Write Mode)
```typescript
// scraper.ts will be updated to write to both JSON and DB
// Once verified, switch to DB-only
```

### 5. Making It Automatic

#### Option A: Update Existing Scraper (Recommended)

**Modify `src/scraper.ts`** to use database:

```typescript
import { savePage, saveRequirements } from './db/page-repository';
import { saveJob, markJobDone, markJobFailed } from './db/job-repository';

// In scrape function:
async function scrape(maxUrls = 10) {
  const jobs = await getQueuedJobs(maxUrls);
  
  for (const job of jobs) {
    try {
      const page = await scrapePage(job.url);
      const pageId = await savePage(page);
      await saveRequirements(pageId, page.categorized_requirements);
      await markJobDone(job.url);
    } catch (e) {
      await markJobFailed(job.url, e.message);
    }
  }
}
```

#### Option B: Keep JSON as Backup (Dual-Write)

**Hybrid approach** - write to both JSON and DB:

```typescript
// Save to both
await savePage(page); // Database
saveState(state); // JSON backup
```

#### Option C: Background Service

**Create background worker:**

```bash
# Install PM2
npm install -g pm2

# Run scraper as background service
pm2 start scraper-lite/run-lite.js --name scraper --interpreter node -- auto-cycle

# Auto-start on boot
pm2 startup
pm2 save
```

### 6. About datasource.ts and API

#### Current Files:
- `pages/api/scraper.ts` - Likely for Next.js API routes
- Possibly `src/lib/datasource.ts` - Data access layer

#### Recommendation:

**Keep them but update to use database:**

```typescript
// src/lib/datasource.ts (or similar)
import { searchPages, getAllPages } from '../scraper-lite/src/db/page-repository';

export async function getPrograms(filters) {
  return await searchPages(filters);
}

// pages/api/scraper.ts (Next.js API)
import { getPrograms } from '@/lib/datasource';

export default async function handler(req, res) {
  const programs = await getPrograms(req.query);
  res.json(programs);
}
```

**They're NOT redundant:**
- ✅ API layer: Serves data to frontend
- ✅ Datasource: Abstraction layer (can switch DB backends)
- ✅ Database: Storage layer

**Architecture:**
```
Frontend → API Route → Datasource → Database
                         ↓
                      (abstraction)
```

### 7. Migration Strategy

#### Phase 1: Setup & Migrate (Now)
1. ✅ Create NEON database
2. ✅ Run schema
3. ✅ Migrate existing data
4. ✅ Verify data integrity

#### Phase 2: Dual-Write (Week 1)
1. ✅ Update scraper to write to both JSON and DB
2. ✅ Monitor for issues
3. ✅ Verify DB data matches JSON

#### Phase 3: Switch Reads (Week 2)
1. ✅ Update API/datasource to read from DB
2. ✅ Keep JSON as backup
3. ✅ Monitor performance

#### Phase 4: DB-Only (Week 3)
1. ✅ Switch scraper to DB-only
2. ✅ Keep JSON export for backups
3. ✅ Remove JSON write code

### 8. Backup Strategy

**Automatic:**
- NEON provides automatic backups (paid tier)
- Or use `pg_dump` for manual backups

**Manual Backup to JSON:**
```bash
node scripts/export-from-neon.js > backup-$(date +%Y%m%d).json
```

### 9. Testing Connection

```bash
node -e "
const { testConnection } = require('./src/db/neon-client.ts');
testConnection().then(result => {
  console.log(result ? '✅ Connected' : '❌ Failed');
  process.exit(result ? 0 : 1);
});
"
```


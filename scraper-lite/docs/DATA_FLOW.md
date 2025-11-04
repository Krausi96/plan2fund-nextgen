# Scraper Lite Data Flow

## Complete Data Journey: From Scraping to Frontend

### 1. **Data Storage (Where it goes)**

When the scraper saves data, it goes into **two PostgreSQL tables** in your NEON database:

#### 📊 `pages` Table
Stores the main program information:
- `id` - Unique database ID (primary key)
- `url` - Program page URL (unique)
- `title` - Program title
- `description` - Program description
- `funding_amount_min` / `funding_amount_max` - Funding range
- `currency` - Currency (default: EUR)
- `deadline` - Application deadline
- `open_deadline` - Boolean if deadline is open
- `contact_email` / `contact_phone` - Contact information
- `funding_types` - Array of funding types (grant, loan, equity, etc.)
- `program_focus` - Array of focus areas
- `region` - Geographic region
- `metadata_json` - Flexible JSONB field for additional metadata
- `raw_html_path` - Path to saved HTML file
- `fetched_at` - Timestamp when scraped
- `updated_at` - Last update timestamp

#### 📋 `requirements` Table
Stores detailed requirements in 18+ categories:
- `id` - Unique requirement ID
- `page_id` - Foreign key to `pages.id` (links requirement to page)
- `category` - One of 18 categories: eligibility, financial, documents, project, timeline, team, geographic, technical, etc.
- `type` - Specific type within category (e.g., 'revenue_range', 'max_company_age')
- `value` - The actual requirement value (can be text, number, or JSON)
- `required` - Boolean if requirement is mandatory
- `source` - Where it was extracted from (context_extraction, structured, etc.)
- `description` - Human-readable description
- `format` - Format specification (e.g., 'PDF', 'max 10 pages')
- `requirements` - Nested requirements as JSONB
- `meaningfulness_score` - Quality score (0-100)

**Relationship:** `requirements.page_id` → `pages.id` (one page has many requirements)

---

### 2. **Data Retrieval (How it comes back)**

#### API Endpoint: `/api/programs`

**Location:** `pages/api/programs.ts`

**Flow:**
1. **Query Database:**
   ```typescript
   // Get all pages or filtered pages
   const pages = await getAllPages(1000);
   // OR
   const pages = await searchPages({ region: type, limit: 1000 });
   ```

2. **Join Requirements:**
   For each page, query its requirements:
   ```sql
   SELECT category, type, value, required, source, description, format, requirements 
   FROM requirements 
   WHERE page_id = $1
   ```

3. **Transform to Program Format:**
   - Group requirements by category → `categorized_requirements`
   - Build `eligibility_criteria` for backward compatibility
   - Parse JSON fields (metadata_json, requirements)
   - Create program object with ID `page_{id}`

4. **Return JSON Response:**
   ```json
   {
     "success": true,
     "programs": [
       {
         "id": "page_123",
         "name": "Program Title",
         "type": "grant",
         "description": "...",
         "funding_amount_min": 10000,
         "funding_amount_max": 50000,
         "categorized_requirements": {
           "eligibility": [...],
           "financial": [...],
           "documents": [...]
         },
         ...
       }
     ]
   }
   ```

#### API Endpoint: `/api/programmes/[id]/requirements`

**Location:** `pages/api/programmes/[id]/requirements.ts`

Returns requirements for a specific program by ID.

---

### 3. **Data Consumption (Where it's used)**

#### Frontend Components:

1. **ProgramSelector** (`features/editor/components/ProgramSelector.tsx`)
   - Fetches: `GET /api/programs?enhanced=true`
   - Displays programs in UI
   - Used for program selection

2. **HybridDataSource** (`features/editor/engine/dataSource.ts`)
   - Fetches: `GET /api/programs`
   - Provides programs to recommendation engine
   - Used by question engine and matching logic

3. **Question Engine** (`features/reco/engine/questionEngine.ts`)
   - Uses `categorized_requirements` to generate dynamic questions
   - Analyzes all 18-19 categories from database

4. **Recommendation System**
   - Matches user answers against requirements
   - Scores programs based on requirements

---

### 4. **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCRAPER LITE                                 │
│  scraper-lite/src/scraper.ts                                    │
│  - Scrapes URLs                                                 │
│  - Extracts metadata & requirements                             │
└────────────────────────┬────────────────────────────────────────┘
                        │
                        │ savePageWithRequirements()
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEON DATABASE (PostgreSQL)                   │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────┐           │
│  │  pages table     │◄─────┤  requirements table  │           │
│  │                  │      │                      │           │
│  │  id (PK)         │      │  id (PK)             │           │
│  │  url             │      │  page_id (FK) ───────┘           │
│  │  title           │      │  category                         │
│  │  description     │      │  type                            │
│  │  funding_*       │      │  value                           │
│  │  ...             │      │  ...                             │
│  └──────────────────┘      └──────────────────────┘           │
└────────────────────────┬────────────────────────────────────────┘
                        │
                        │ getAllPages() / searchPages()
                        │ + JOIN requirements
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                                │
│                                                                 │
│  GET /api/programs                                              │
│  - Queries pages table                                          │
│  - Queries requirements table (per page)                       │
│  - Transforms to program format                                 │
│  - Returns JSON                                                 │
│                                                                 │
│  GET /api/programmes/[id]/requirements                          │
│  - Gets specific program requirements                            │
└────────────────────────┬────────────────────────────────────────┘
                        │
                        │ fetch('/api/programs')
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                          │
│                                                                 │
│  - ProgramSelector.tsx                                          │
│  - HybridDataSource.ts                                         │
│  - QuestionEngine.ts                                            │
│  - Recommendation System                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. **Key Points**

1. **Two-Table Design:**
   - `pages` = Main program data (one row per program)
   - `requirements` = Detailed requirements (many rows per program)

2. **Atomic Saves:**
   - `savePageWithRequirements()` uses a transaction
   - Both page AND requirements are saved together
   - If one fails, both are rolled back

3. **API Retrieval:**
   - API queries both tables
   - Joins requirements to pages
   - Transforms to frontend format

4. **ID Format:**
   - Database ID: `123` (integer)
   - API ID: `page_123` (string)
   - Frontend uses `page_123` format

5. **Fallback:**
   - If database fails, falls back to JSON file
   - JSON stored in `scraper-lite/data/lite/state.json`

---

### 6. **Verification**

To verify data is being saved correctly:

```bash
# Test database connection
node scripts/test-db-connection.js

# Check data in database
node scripts/check-data-completeness.js

# Test API endpoint
curl http://localhost:3000/api/programs
```

You should see:
- Pages in `pages` table
- Requirements in `requirements` table linked by `page_id`
- API returning programs with requirements


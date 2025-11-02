-- NEON Database Schema for Plan2Fund Scraper
-- Hybrid approach: Normalized tables + JSONB for flexibility

-- ============================================================================
-- PAGES TABLE (Core program data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  
  -- Funding metadata
  funding_amount_min DECIMAL(15,2),
  funding_amount_max DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'EUR',
  deadline DATE,
  open_deadline BOOLEAN DEFAULT FALSE,
  
  -- Contact info
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Program classification
  funding_types TEXT[],
  program_focus TEXT[],
  region TEXT,
  
  -- Timestamps
  fetched_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Flexible metadata (can add any fields here)
  metadata_json JSONB DEFAULT '{}',
  raw_html_path TEXT,
  
  -- Schema version for migrations
  schema_version VARCHAR(10) DEFAULT '1.0'
);

-- ============================================================================
-- REQUIREMENTS TABLE (Normalized requirement data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS requirements (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  
  category VARCHAR(50) NOT NULL, -- 'eligibility', 'financial', 'documents', etc.
  type VARCHAR(100), -- 'eligibility_criteria', 'funding_amount_max', etc.
  value TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  source VARCHAR(50), -- 'context_extraction', 'structured', 'heading', etc.
  
  -- Additional flexible fields
  description TEXT,
  format TEXT, -- For documents: 'PDF', 'max 10 pages', etc.
  requirements JSONB, -- For nested requirements
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- URL PATTERNS TABLE (Learned patterns from scraping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS url_patterns (
  id SERIAL PRIMARY KEY,
  host TEXT NOT NULL,
  pattern_type VARCHAR(20) NOT NULL, -- 'include' or 'exclude'
  pattern TEXT NOT NULL,
  learned_from_url TEXT,
  confidence DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage of successful matches
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(host, pattern_type, pattern)
);

-- ============================================================================
-- SCRAPING JOBS TABLE (Queue management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'running', 'done', 'failed'
  depth INTEGER DEFAULT 1,
  seed_url TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  last_fetched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(url)
);

-- ============================================================================
-- SEEN URLS TABLE (URL discovery tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seen_urls (
  url TEXT PRIMARY KEY,
  discovered_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  source_url TEXT, -- Where it was discovered from
  depth INTEGER DEFAULT 0
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Pages indexes
CREATE INDEX IF NOT EXISTS idx_pages_url ON pages(url);
CREATE INDEX IF NOT EXISTS idx_pages_funding_min ON pages(funding_amount_min);
CREATE INDEX IF NOT EXISTS idx_pages_funding_max ON pages(funding_amount_max);
CREATE INDEX IF NOT EXISTS idx_pages_funding_range ON pages(funding_amount_min, funding_amount_max);
CREATE INDEX IF NOT EXISTS idx_pages_deadline ON pages(deadline);
CREATE INDEX IF NOT EXISTS idx_pages_open_deadline ON pages(open_deadline);
CREATE INDEX IF NOT EXISTS idx_pages_fetched_at ON pages(fetched_at);
CREATE INDEX IF NOT EXISTS idx_pages_region ON pages(region);

-- Requirements indexes
CREATE INDEX IF NOT EXISTS idx_reqs_page_id ON requirements(page_id);
CREATE INDEX IF NOT EXISTS idx_reqs_category ON requirements(category);
CREATE INDEX IF NOT EXISTS idx_reqs_category_page ON requirements(category, page_id);
CREATE INDEX IF NOT EXISTS idx_reqs_type ON requirements(type);
CREATE INDEX IF NOT EXISTS idx_reqs_source ON requirements(source);

-- URL patterns indexes
CREATE INDEX IF NOT EXISTS idx_url_patterns_host ON url_patterns(host);
CREATE INDEX IF NOT EXISTS idx_url_patterns_type ON url_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_url_patterns_host_type ON url_patterns(host, pattern_type);
CREATE INDEX IF NOT EXISTS idx_url_patterns_confidence ON url_patterns(confidence DESC);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_url ON scraping_jobs(url);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON scraping_jobs(status, created_at);

-- Seen URLs indexes
CREATE INDEX IF NOT EXISTS idx_seen_urls_processed ON seen_urls(processed);
CREATE INDEX IF NOT EXISTS idx_seen_urls_discovered ON seen_urls(discovered_at);

-- Full-text search indexes (optional - for advanced search)
-- CREATE INDEX IF NOT EXISTS idx_pages_title_fts ON pages USING GIN(to_tsvector('english', COALESCE(title, '')));
-- CREATE INDEX IF NOT EXISTS idx_pages_desc_fts ON pages USING GIN(to_tsvector('english', COALESCE(description, '')));
-- CREATE INDEX IF NOT EXISTS idx_reqs_value_fts ON requirements USING GIN(to_tsvector('english', value));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for pages table
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for url_patterns table
CREATE TRIGGER update_url_patterns_updated_at BEFORE UPDATE ON url_patterns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for scraping_jobs table
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON scraping_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Pages with requirement counts
CREATE OR REPLACE VIEW pages_with_counts AS
SELECT 
  p.*,
  COUNT(DISTINCT r.id) as total_requirements,
  COUNT(DISTINCT CASE WHEN r.category = 'eligibility' THEN r.id END) as eligibility_count,
  COUNT(DISTINCT CASE WHEN r.category = 'financial' THEN r.id END) as financial_count,
  COUNT(DISTINCT CASE WHEN r.category = 'documents' THEN r.id END) as documents_count
FROM pages p
LEFT JOIN requirements r ON r.page_id = p.id
GROUP BY p.id;

-- View: Statistics by category
CREATE OR REPLACE VIEW requirement_stats AS
SELECT 
  category,
  COUNT(*) as total_items,
  COUNT(DISTINCT page_id) as pages_with_category,
  AVG(LENGTH(value)) as avg_length
FROM requirements
GROUP BY category;



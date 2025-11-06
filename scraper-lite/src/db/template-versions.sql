-- ========= PLAN2FUND — TEMPLATE VERSIONING =========
-- Stores LLM-generated and manually edited templates with version tracking
-- Part of Area 3: Editor Entry (template versioning)

-- Template versions table
CREATE TABLE IF NOT EXISTS template_versions (
  id SERIAL PRIMARY KEY,
  program_id TEXT NOT NULL, -- Reference to program/page ID
  section_id TEXT NOT NULL, -- Section ID (e.g., 'executive_summary', 'market_opportunity')
  
  -- Template content (stored as JSONB for flexibility)
  template_data JSONB NOT NULL, -- Full SectionTemplate as JSON
  
  -- Version metadata
  version_number INTEGER DEFAULT 1,
  version_type VARCHAR(20) DEFAULT 'llm-generated', -- 'llm-generated', 'manual-edit', 'rule-based'
  model_version VARCHAR(50), -- e.g., 'gpt-4o-mini-v1'
  prompt_version VARCHAR(50), -- e.g., 'template-prompt-v1'
  
  -- Source tracking
  generated_by VARCHAR(50) DEFAULT 'llm', -- 'llm', 'rule-based', 'admin'
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_from_requirements_hash TEXT, -- Hash of requirements used to generate
  
  -- Admin editing
  edited_by TEXT, -- User ID if manually edited
  edited_at TIMESTAMP,
  edit_notes TEXT, -- Notes about why template was edited
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE, -- Only active version is used
  is_verified BOOLEAN DEFAULT FALSE, -- Admin-verified templates
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one active version per program+section
  UNIQUE(program_id, section_id, is_active) WHERE is_active = TRUE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_template_versions_program_section 
  ON template_versions(program_id, section_id) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_template_versions_program 
  ON template_versions(program_id) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_template_versions_generated_at 
  ON template_versions(generated_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_template_versions_updated_at
  BEFORE UPDATE ON template_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_template_versions_updated_at();

-- Template requirements hash table (for change detection)
CREATE TABLE IF NOT EXISTS template_requirements_hash (
  id SERIAL PRIMARY KEY,
  program_id TEXT NOT NULL,
  requirements_hash TEXT NOT NULL, -- Hash of categorized_requirements
  requirements_snapshot JSONB, -- Full snapshot of requirements at generation time
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(program_id, requirements_hash)
);

-- Index for hash lookups
CREATE INDEX IF NOT EXISTS idx_template_requirements_hash_program 
  ON template_requirements_hash(program_id, created_at DESC);


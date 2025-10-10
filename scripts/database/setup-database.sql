-- Plan2Fund Database Schema for Neon
-- Run this in your Neon SQL editor

-- Create programs table with GPT enhancements
CREATE TABLE IF NOT EXISTS programs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  program_type VARCHAR(100),
  funding_amount_min INTEGER,
  funding_amount_max INTEGER,
  currency VARCHAR(3) DEFAULT 'EUR',
  deadline DATE,
  eligibility_criteria JSONB,
  requirements JSONB,
  contact_info JSONB,
  source_url VARCHAR(500),
  scraped_at TIMESTAMP DEFAULT NOW(),
  confidence_score FLOAT DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  -- GPT-Recommended Enhancements:
  target_personas JSONB, -- ["solo", "sme", "startup", "researcher"]
  tags JSONB, -- ["innovation", "startup", "non-dilutive", "biotech"]
  decision_tree_questions JSONB, -- Generated questions for wizard
  editor_sections JSONB, -- Program-specific business plan sections
  readiness_criteria JSONB, -- Automated compliance checks
  ai_guidance JSONB, -- AI assistant context and prompts
  -- Enhanced Requirements Fields:
  institution VARCHAR(255), -- Source institution name
  program_category VARCHAR(255), -- Category like 'austrian_grants'
  comprehensive_requirements JSONB, -- Full extracted requirements
  requirements_extraction_metadata JSONB, -- Extraction confidence, patterns used, etc.
  categorized_requirements JSONB -- 18 categories with extracted requirements
);

-- Create program_requirements table
CREATE TABLE IF NOT EXISTS program_requirements (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id) ON DELETE CASCADE,
  section_key VARCHAR(255),
  label VARCHAR(255),
  required BOOLEAN DEFAULT false,
  constraints JSONB,
  attachments JSONB,
  validation_rules JSONB,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Create rubrics table
CREATE TABLE IF NOT EXISTS rubrics (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id) ON DELETE CASCADE,
  criteria JSONB,
  program_type VARCHAR(100),
  target_group VARCHAR(100),
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_programs_type ON programs(program_type);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_deadline ON programs(deadline);
CREATE INDEX IF NOT EXISTS idx_programs_scraped_at ON programs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_requirements_program_id ON program_requirements(program_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_program_id ON rubrics(program_id);
-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_programs_categorized_requirements ON programs USING gin (categorized_requirements);
CREATE INDEX IF NOT EXISTS idx_programs_eligibility_criteria ON programs USING gin (eligibility_criteria);
CREATE INDEX IF NOT EXISTS idx_programs_requirements ON programs USING gin (requirements);

-- Insert sample data with GPT enhancements
INSERT INTO programs (
  id, name, description, program_type, funding_amount_min, funding_amount_max, 
  source_url, scraped_at, target_personas, tags, decision_tree_questions, 
  editor_sections, readiness_criteria, ai_guidance
) VALUES
(
  'aws_preseed_sample', 
  'AWS Preseed - Sample Program', 
  'Sample AWS Preseed program for testing', 
  'grant', 
  50000, 
  200000, 
  'https://aws.at/preseed', 
  NOW(),
  '["startup", "solo"]',
  '["innovation", "startup", "non-dilutive"]',
  '[{"id": "q_company_stage", "question": "What is your company stage?", "type": "single", "options": [{"value": "PRE_COMPANY", "label": "Just an idea or team forming"}, {"value": "INC_LT_6M", "label": "Recently started (less than 6 months)"}]}]',
  '[{"id": "executive_summary", "title": "Executive Summary", "required": true, "template": "Our innovative project [PROJECT_NAME] seeks [FUNDING_AMOUNT] in funding to [PROJECT_GOAL].", "guidance": "Keep concise but compelling. Highlight innovation and impact."}]',
  '[{"id": "criterion_1", "title": "Company Stage Eligibility", "description": "Verify company is within 6 months of registration", "checkType": "validation", "weight": 1.0}]',
  '{"context": "AWS Preseed program focuses on innovative startups", "tone": "professional", "key_points": ["innovation", "market potential", "team expertise"]}'
),
(
  'ffg_basis_sample', 
  'FFG Basis - Sample Program', 
  'Sample FFG Basis program for testing', 
  'grant', 
  25000, 
  100000, 
  'https://ffg.at/basis', 
  NOW(),
  '["sme", "researcher"]',
  '["research", "innovation", "academic"]',
  '[{"id": "q_research_focus", "question": "What is your research focus area?", "type": "single", "options": [{"value": "TECH", "label": "Technology and Engineering"}, {"value": "BIO", "label": "Biotechnology and Life Sciences"}]}]',
  '[{"id": "project_description", "title": "Project Description", "required": true, "template": "This research project [PROJECT_NAME] aims to [RESEARCH_GOAL] through [METHODOLOGY].", "guidance": "Include technical details and implementation approach."}]',
  '[{"id": "criterion_1", "title": "Research Innovation", "description": "Verify project demonstrates scientific innovation", "checkType": "content_analysis", "weight": 0.8}]',
  '{"context": "FFG Basis program supports fundamental research", "tone": "academic", "key_points": ["scientific merit", "innovation", "feasibility"]}'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample requirements
INSERT INTO program_requirements (program_id, section_key, label, required, constraints, attachments) VALUES
('aws_preseed_sample', 'business_plan', 'Business Plan', true, '{"max_pages": 10, "format": "PDF"}', '["budget", "cv"]'),
('aws_preseed_sample', 'innovation_description', 'Innovation Description', true, '{"max_words": 1000}', '[]'),
('ffg_basis_sample', 'project_description', 'Project Description', true, '{"max_pages": 5, "format": "PDF"}', '["budget", "timeline"]')
ON CONFLICT DO NOTHING;

-- Insert sample rubrics
INSERT INTO rubrics (program_id, criteria, program_type, target_group) VALUES
('aws_preseed_sample', '[{"name": "Innovation Level", "desc": "High innovation required", "section_hint": "Focus on technological innovation", "weight": 0.4, "validation_type": "text_analysis"}]', 'grant', 'startup'),
('ffg_basis_sample', '[{"name": "Technical Feasibility", "desc": "Project must be technically feasible", "section_hint": "Include technical details and milestones", "weight": 0.3, "validation_type": "technical_check"}]', 'grant', 'sme')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENHANCED REQUIREMENT TABLES (System Analysis Implementation)
-- ============================================================================

-- Decision Tree Questions Table
CREATE TABLE IF NOT EXISTS decision_tree_questions (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_options JSONB,
  next_question_id INTEGER,
  validation_rules JSONB,
  skip_logic JSONB,
  required BOOLEAN DEFAULT true,
  category VARCHAR(100) DEFAULT 'eligibility',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Editor Sections Table
CREATE TABLE IF NOT EXISTS editor_sections (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id) ON DELETE CASCADE,
  section_name VARCHAR(255) NOT NULL,
  prompt TEXT,
  hints JSONB,
  word_count_min INTEGER,
  word_count_max INTEGER,
  required BOOLEAN DEFAULT true,
  ai_guidance TEXT,
  template TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Library Details Table
CREATE TABLE IF NOT EXISTS library_details (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id) ON DELETE CASCADE,
  eligibility_text TEXT,
  documents JSONB,
  funding_amount VARCHAR(255),
  deadlines JSONB,
  application_procedures JSONB,
  compliance_requirements JSONB,
  contact_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Program Categories Table
CREATE TABLE IF NOT EXISTS program_categories (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id) ON DELETE CASCADE,
  category VARCHAR(255) NOT NULL,
  subcategory VARCHAR(255),
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_decision_tree_program_id ON decision_tree_questions(program_id);
CREATE INDEX IF NOT EXISTS idx_editor_sections_program_id ON editor_sections(program_id);
CREATE INDEX IF NOT EXISTS idx_library_details_program_id ON library_details(program_id);
CREATE INDEX IF NOT EXISTS idx_program_categories_program_id ON program_categories(program_id);
CREATE INDEX IF NOT EXISTS idx_program_categories_category ON program_categories(category);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(program_category);


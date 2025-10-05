-- Plan2Fund Database Schema for Neon
-- Run this in your Neon SQL editor

-- Create programs table
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
  is_active BOOLEAN DEFAULT true
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

-- Insert some sample data for testing
INSERT INTO programs (id, name, description, program_type, funding_amount_min, funding_amount_max, source_url, scraped_at) VALUES
('aws_preseed_sample', 'AWS Preseed - Sample Program', 'Sample AWS Preseed program for testing', 'grant', 50000, 200000, 'https://aws.at/preseed', NOW()),
('ffg_basis_sample', 'FFG Basis - Sample Program', 'Sample FFG Basis program for testing', 'grant', 25000, 100000, 'https://ffg.at/basis', NOW())
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


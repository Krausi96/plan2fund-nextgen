-- Migration: Add Enhanced Requirements Fields
-- Run this in your Neon SQL editor to add new fields for comprehensive requirements extraction

-- Add new columns to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS institution VARCHAR(255),
ADD COLUMN IF NOT EXISTS program_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS comprehensive_requirements JSONB,
ADD COLUMN IF NOT EXISTS requirements_extraction_metadata JSONB;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_programs_institution ON programs(institution);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(program_category);

-- Update existing sample data with new fields
UPDATE programs 
SET 
  institution = CASE 
    WHEN id LIKE 'aws_%' THEN 'Austria Wirtschaftsservice'
    WHEN id LIKE 'ffg_%' THEN 'Austrian Research Promotion Agency'
    ELSE 'Unknown Institution'
  END,
  program_category = CASE 
    WHEN id LIKE 'aws_%' THEN 'austrian_grants'
    WHEN id LIKE 'ffg_%' THEN 'austrian_research'
    ELSE 'other'
  END,
  comprehensive_requirements = '{}',
  requirements_extraction_metadata = '{"extraction_method": "manual", "confidence": 0.8, "last_updated": "' || NOW() || '"}'
WHERE institution IS NULL;

-- Add sample comprehensive requirements for existing programs
UPDATE programs 
SET comprehensive_requirements = '{
  "eligibility": [
    {
      "id": "company_age",
      "name": "Company Age",
      "description": "Company must be less than 5 years old",
      "mandatory": true,
      "weight": 0.8,
      "category": "eligibility",
      "subcategory": "business_requirements",
      "evidence": ["company registration date"],
      "alternatives": ["startup certificate", "business registration"]
    }
  ],
  "documents": [
    {
      "id": "business_plan",
      "name": "Business Plan",
      "description": "Comprehensive business plan required",
      "mandatory": true,
      "weight": 1.0,
      "category": "documents",
      "subcategory": "core_documents",
      "evidence": ["business plan template", "submission guidelines"],
      "alternatives": ["executive summary", "pitch deck"]
    }
  ],
  "financial": [
    {
      "id": "financial_projections",
      "name": "Financial Projections",
      "description": "3-year financial projections required",
      "mandatory": true,
      "weight": 0.9,
      "category": "financial",
      "subcategory": "projections",
      "evidence": ["financial model template", "projection guidelines"],
      "alternatives": ["budget plan", "cash flow forecast"]
    }
  ]
}'::jsonb
WHERE id = 'aws_preseed_sample';

UPDATE programs 
SET comprehensive_requirements = '{
  "eligibility": [
    {
      "id": "research_focus",
      "name": "Research Focus",
      "description": "Project must have clear research focus",
      "mandatory": true,
      "weight": 0.9,
      "category": "eligibility",
      "subcategory": "research_requirements",
      "evidence": ["research proposal", "scientific methodology"],
      "alternatives": ["technical specification", "innovation description"]
    }
  ],
  "documents": [
    {
      "id": "project_description",
      "name": "Project Description",
      "description": "Detailed project description required",
      "mandatory": true,
      "weight": 1.0,
      "category": "documents",
      "subcategory": "research_documents",
      "evidence": ["project template", "research guidelines"],
      "alternatives": ["technical proposal", "research outline"]
    }
  ],
  "technical": [
    {
      "id": "technical_feasibility",
      "name": "Technical Feasibility",
      "description": "Project must be technically feasible",
      "mandatory": true,
      "weight": 0.8,
      "category": "technical",
      "subcategory": "feasibility",
      "evidence": ["technical analysis", "implementation plan"],
      "alternatives": ["proof of concept", "prototype"]
    }
  ]
}'::jsonb
WHERE id = 'ffg_basis_sample';

-- Create a view for easy querying of enhanced requirements
CREATE OR REPLACE VIEW programs_enhanced AS
SELECT 
  p.*,
  pr.section_key,
  pr.label as requirement_label,
  pr.required as requirement_mandatory,
  pr.constraints as requirement_constraints,
  pr.attachments as requirement_attachments,
  pr.validation_rules as requirement_validation_rules
FROM programs p
LEFT JOIN program_requirements pr ON p.id = pr.program_id;

-- Create a function to get program requirements by category
CREATE OR REPLACE FUNCTION get_program_requirements_by_category(
  program_id_param VARCHAR(255),
  category_param VARCHAR(50)
)
RETURNS TABLE (
  requirement_id VARCHAR(255),
  requirement_name VARCHAR(255),
  requirement_description TEXT,
  mandatory BOOLEAN,
  weight FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (req->>'id')::VARCHAR(255) as requirement_id,
    (req->>'name')::VARCHAR(255) as requirement_name,
    (req->>'description')::TEXT as requirement_description,
    (req->>'mandatory')::BOOLEAN as mandatory,
    (req->>'weight')::FLOAT as weight
  FROM programs p,
       jsonb_array_elements(p.comprehensive_requirements->category_param) as req
  WHERE p.id = program_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to search programs by requirements
CREATE OR REPLACE FUNCTION search_programs_by_requirement(
  requirement_name_param VARCHAR(255),
  requirement_category_param VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  program_id VARCHAR(255),
  program_name VARCHAR(255),
  institution VARCHAR(255),
  requirement_found JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as program_id,
    p.name as program_name,
    p.institution,
    req as requirement_found
  FROM programs p,
       jsonb_array_elements(p.comprehensive_requirements) as category_reqs,
       jsonb_array_elements(category_reqs) as req
  WHERE 
    (req->>'name') ILIKE '%' || requirement_name_param || '%'
    AND (requirement_category_param IS NULL OR (category_reqs::text) ILIKE '%' || requirement_category_param || '%');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON programs_enhanced TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_program_requirements_by_category TO PUBLIC;
GRANT EXECUTE ON FUNCTION search_programs_by_requirement TO PUBLIC;

-- Insert some test data to verify the migration
INSERT INTO programs (
  id, name, description, program_type, funding_amount_min, funding_amount_max, 
  source_url, institution, program_category, comprehensive_requirements,
  requirements_extraction_metadata, target_personas, tags
) VALUES (
  'test_enhanced_requirements',
  'Test Enhanced Requirements Program',
  'Test program to verify enhanced requirements extraction',
  'grant',
  10000,
  50000,
  'https://test.example.com',
  'Test Institution',
  'test_category',
  '{
    "eligibility": [
      {
        "id": "test_eligibility",
        "name": "Test Eligibility",
        "description": "Test eligibility requirement",
        "mandatory": true,
        "weight": 0.9,
        "category": "eligibility",
        "subcategory": "test",
        "evidence": ["test evidence"],
        "alternatives": ["test alternative"]
      }
    ]
  }'::jsonb,
  '{"extraction_method": "test", "confidence": 0.95, "last_updated": "' || NOW() || '"}'::jsonb,
  '["test"]'::jsonb,
  '["test", "example"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Verify the migration worked
SELECT 
  id, 
  name, 
  institution, 
  program_category,
  jsonb_array_length(comprehensive_requirements->'eligibility') as eligibility_count,
  requirements_extraction_metadata->>'extraction_method' as extraction_method
FROM programs 
WHERE institution IS NOT NULL;

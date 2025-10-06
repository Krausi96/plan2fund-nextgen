-- Fix JSON data format in programs table
-- Run this in your Neon SQL editor

-- Fix the JSON data format for existing programs
UPDATE programs 
SET 
  target_personas = '["startup", "sme"]'::jsonb,
  tags = '["innovation", "startup", "non-dilutive"]'::jsonb,
  decision_tree_questions = '[
    {
      "id": "q1",
      "question": "What is your company stage?",
      "type": "single",
      "options": [
        {"value": "idea", "label": "Idea Stage"},
        {"value": "mvp", "label": "MVP/Prototype"},
        {"value": "revenue", "label": "Generating Revenue"}
      ]
    }
  ]'::jsonb,
  editor_sections = '[
    {
      "id": "executive_summary",
      "title": "Executive Summary",
      "required": true,
      "ai_prompts": ["Summarize your business idea in 2-3 sentences"]
    }
  ]'::jsonb,
  readiness_criteria = '[
    {
      "id": "business_plan",
      "description": "Complete business plan required",
      "required": true
    }
  ]'::jsonb,
  ai_guidance = '{
    "context": "This program supports early-stage startups with innovative ideas",
    "suggestions": ["Focus on market validation", "Prepare financial projections"]
  }'::jsonb
WHERE id IN ('aws_preseed_sample', 'ffg_basis_sample');

-- Verify the fix
SELECT id, name, target_personas, tags FROM programs;

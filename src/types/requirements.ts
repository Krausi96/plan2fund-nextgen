// ========= PLAN2FUND — PROGRAM REQUIREMENTS SCHEMA =========
// Comprehensive schema for program requirements and eligibility
// Enhanced with 3 structured requirement types: Decision Tree, Editor, Library

export interface ProgramRequirement {
  id: string;
  category: RequirementCategory;
  type: RequirementType;
  title: string;
  description: string;
  isRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  validationRules: ValidationRule[];
  alternatives?: string[]; // Alternative ways to fulfill this requirement
  examples?: string[];
  guidance?: string;
  estimatedTime?: string; // How long it takes to fulfill
  cost?: number; // Associated cost if any
}

export type RequirementCategory = 
  | 'eligibility'      // Who can apply
  | 'documents'        // Required documents
  | 'financial'        // Financial requirements
  | 'technical'        // Technical specifications
  | 'legal'           // Legal requirements
  | 'timeline'        // Time-based requirements
  | 'geographic'      // Location requirements
  | 'team'            // Team requirements
  | 'project'         // Project-specific requirements
  | 'compliance'      // Regulatory compliance
  | 'impact'          // Environmental, social, economic impact
  | 'capex_opex'      // Capital expenditure vs operating expenditure
  | 'use_of_funds'    // How funding will be used
  | 'revenue_model'   // Business model and revenue generation
  | 'market_size'     // Market potential and size
  | 'co_financing'    // Co-financing requirements and ratios
  | 'trl_level'       // Technology readiness level (1-9)
  | 'consortium'      // Partnership and consortium requirements
  | 'funding_type'    // Type of funding (grant, loan, equity, etc.)
  | 'program_category' // Program category (research, startup, etc.)
  | 'target_group'    // Target audience (startups, SMEs, etc.)
  | 'industry';       // Industry-specific requirements

export type RequirementType = 
  | 'boolean'         // Yes/No requirement
  | 'numeric'         // Number-based requirement
  | 'text'           // Text-based requirement
  | 'document'       // Document upload
  | 'date'           // Date requirement
  | 'selection'      // Multiple choice
  | 'file_upload'    // File upload requirement
  | 'url'            // URL requirement
  | 'calculation';   // Calculated requirement

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'required' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ProgramRequirements {
  programId: string;
  programName: string;
  programType: 'grant' | 'loan' | 'equity' | 'visa' | 'ams' | 'mixed';
  targetPersonas: ('solo' | 'sme' | 'advisor' | 'university')[];
  
  // Core eligibility requirements
  eligibility: ProgramRequirement[];
  
  // Required documents
  documents: ProgramRequirement[];
  
  // Financial requirements
  financial: ProgramRequirement[];
  
  // Technical requirements
  technical: ProgramRequirement[];
  
  // Legal requirements
  legal: ProgramRequirement[];
  
  // Timeline requirements
  timeline: ProgramRequirement[];
  
  // Geographic requirements
  geographic: ProgramRequirement[];
  
  // Team requirements
  team: ProgramRequirement[];
  
  // Project-specific requirements
  project: ProgramRequirement[];
  
  // Compliance requirements
  compliance: ProgramRequirement[];
  
  // Impact requirements
  impact: ProgramRequirement[];
  
  // CAPEX/OPEX requirements
  capex_opex: ProgramRequirement[];
  
  // Use of funds requirements
  use_of_funds: ProgramRequirement[];
  
  // Revenue model requirements
  revenue_model: ProgramRequirement[];
  
  // Market size requirements
  market_size: ProgramRequirement[];
  
  // Co-financing requirements
  co_financing: ProgramRequirement[];
  
  // TRL level requirements
  trl_level: ProgramRequirement[];
  
  // Consortium requirements
  consortium: ProgramRequirement[];
  
  // Scoring weights for each category
  scoringWeights: {
    eligibility: number;
    documents: number;
    financial: number;
    technical: number;
    legal: number;
    timeline: number;
    geographic: number;
    team: number;
    project: number;
    compliance: number;
    impact: number;
    capex_opex: number;
    use_of_funds: number;
    revenue_model: number;
    market_size: number;
    co_financing: number;
    trl_level: number;
    consortium: number;
  };
  
  // Decision tree questions derived from requirements
  decisionTreeQuestions: DecisionTreeQuestion[];
  
  // Editor sections that should be pre-filled
  editorSections: EditorSection[];
  
  // Readiness check criteria
  readinessCriteria: ReadinessCriterion[];
  
  metadata: {
    lastUpdated: string;
    source: string;
    confidence: 'high' | 'medium' | 'low';
    verified: boolean;
  };
}

export interface DecisionTreeQuestion {
  id: string;
  requirementId: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'number' | 'date' | 'file';
  options?: Array<{ value: string; label: string; score?: number }>;
  validation?: ValidationRule[];
  followUpQuestions?: string[]; // IDs of questions to ask based on answer
  skipConditions?: Array<{
    condition: string;
    skipTo: string;
  }>;
}

export interface EditorSection {
  id: string;
  title: string;
  required: boolean;
  template: string;
  guidance: string;
  requirements: string[]; // Requirement IDs that this section addresses
  prefillData: Record<string, any>;
}

export interface ReadinessCriterion {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  checkType: 'document' | 'calculation' | 'validation' | 'manual';
  validator: (data: any) => { passed: boolean; message: string; score: number };
  weight: number;
}

// Scoring system for requirements
export interface RequirementScore {
  requirementId: string;
  score: number; // 0-100
  status: 'met' | 'partial' | 'not_met' | 'not_applicable';
  message: string;
  suggestions: string[];
}

export interface ProgramScore {
  programId: string;
  overallScore: number; // 0-100
  categoryScores: Record<RequirementCategory, number>;
  requirementScores: RequirementScore[];
  eligibility: 'eligible' | 'not_eligible' | 'conditional';
  gaps: string[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
}

// Template for manual data extraction
export interface ProgramExtractionTemplate {
  programId: string;
  programName: string;
  programType: string;
  sourceUrl: string;
  
  // Basic info
  basicInfo: {
    description: string;
    amount: string;
    duration: string;
    deadline: string;
    eligibility: string[];
  };
  
  // Requirements by category
  requirements: {
    eligibility: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      priority: string;
      examples?: string[];
    }>;
    documents: Array<{
      title: string;
      description: string;
      format?: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    financial: Array<{
      title: string;
      description: string;
      amount?: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    technical: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    legal: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    timeline: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    geographic: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    team: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    project: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    compliance: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    impact: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    capex_opex: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    use_of_funds: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    revenue_model: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    market_size: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    co_financing: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    trl_level: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    consortium: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    funding_type: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    program_category: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    target_group: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
    industry: Array<{
      title: string;
      description: string;
      isRequired: boolean;
      examples?: string[];
    }>;
  };
  
  // Decision tree questions
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    required: boolean;
  }>;
  
  // Editor sections
  editorSections: Array<{
    title: string;
    content: string;
    required: boolean;
  }>;
}

// ========= ENHANCED REQUIREMENT TYPES (System Analysis) =========

// Confidence scoring for pattern matches
export interface ConfidenceScore {
  overall: number; // 0-1
  pattern_matches: number; // 0-1
  context_accuracy: number; // 0-1
  extraction_method: 'regex' | 'nlp' | 'manual' | 'hybrid';
  evidence: string[]; // Text snippets that support the categorization
}

// Austrian/EU specific requirement patterns
export interface AustrianEUPatterns {
  co_financing: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  trl_level: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  impact: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  consortium: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  capex_opex: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  use_of_funds: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  revenue_model: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
  market_size: {
    patterns: RegExp[];
    examples: string[];
    institutions: string[];
  };
}

// Enhanced requirement with confidence scoring
export interface EnhancedRequirement {
  id: string;
  category: RequirementCategory;
  type: RequirementType;
  title: string;
  description: string;
  isRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  validationRules: ValidationRule[];
  alternatives?: string[];
  examples?: string[];
  guidance?: string;
  estimatedTime?: string;
  cost?: number;
  confidence: ConfidenceScore;
  source_institution: string;
  source_url: string;
  extracted_at: Date;
}

// Program Types (7 total) - Consolidated from src/types.ts
export type ProgramType = 
  | 'grant'        // Non-repayable funding
  | 'loan'         // Repayable funding with interest
  | 'equity'       // Investment funding
  | 'visa'         // Immigration programs
  | 'consulting'   // Advisory services
  | 'service'      // Support services
  | 'other';       // Hybrid or specialized instruments

// Consolidated from src/types.ts
export type Program = {
  id: string;
  name: string;
  type: ProgramType;
  program_type: ProgramType;
  program_category: string;
  requirements: Record<string, any>;
  notes?: string;
  maxAmount?: number;
  link?: string;
  // GPT-enhanced fields
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: any[];
  editor_sections?: any[];
  readiness_criteria?: any[];
  ai_guidance?: any;
  // Layer 1&2 categorized requirements
  categorized_requirements?: any;
};

export type ScoredProgram = Program & {
  score: number;
  reason: string;
  eligibility: string;
  confidence: "High" | "Medium" | "Low";
  unmetRequirements?: string[];
  source?: string;
  scores?: {
    fit: number;
    readiness: number;
    effort: number;
    confidence: number;
  };
  why?: string[];
};

// Program Categories (50+ total)
export type ProgramCategory = 
  | 'digitalization' | 'energy' | 'environment' | 'life_sciences' | 'mobility'
  | 'climate' | 'research' | 'startup' | 'sme' | 'regional' | 'international'
  | 'specialized' | 'austrian_grants' | 'research_grants' | 'eu_programs'
  | 'banking' | 'health' | 'tech_sectors' | 'environmental' | 'business_grants'
  | 'employment_grants' | 'consulting_services' | 'regional_grants';

// 1. Decision Tree Requirements
export interface DecisionTreeRequirement {
  id: string;
  program_id: string;
  question_text: string;
  answer_options: string[];
  next_question_id?: string;
  validation_rules: ValidationRule[];
  skip_logic?: {
    condition: string;
    skip_to_question_id: string;
  }[];
  required: boolean;
  category: RequirementCategory;
}

// 2. Editor Requirements
export interface EditorRequirement {
  id: string;
  program_id: string;
  section_name: string;
  prompt: string;
  hints: string[];
  word_count_min?: number;
  word_count_max?: number;
  required: boolean;
  ai_guidance?: string;
  template?: string;
}

// 3. Library Requirements
export interface LibraryRequirement {
  id: string;
  program_id: string;
  eligibility_text: string;
  documents: string[];
  funding_amount: string;
  deadlines: string[];
  application_procedures: string[];
  compliance_requirements: string[];
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

// Enhanced Program Requirements (combines all 3 types)
export interface EnhancedProgramRequirements {
  program_id: string;
  program_name: string;
  program_type: ProgramType;
  program_category: ProgramCategory[];
  decision_tree_requirements: DecisionTreeRequirement[];
  editor_requirements: EditorRequirement[];
  library_requirements: LibraryRequirement[];
  created_at: Date;
  updated_at: Date;
}

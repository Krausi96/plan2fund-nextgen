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
  | 'compliance';     // Regulatory compliance

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

// Program Types (7 total)
export type ProgramType = 
  | 'grant'        // Non-repayable funding
  | 'loan'         // Repayable funding with interest
  | 'equity'       // Investment funding
  | 'visa'         // Immigration programs
  | 'consulting'   // Advisory services
  | 'service'      // Support services
  | 'other';       // Hybrid or specialized instruments

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

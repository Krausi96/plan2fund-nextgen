/**
 * Scraped Program Data Models
 * Centralized data structures for scraped funding programs
 */

export interface ScrapedProgram {
  id: string;
  name: string;
  description: string;
  type: 'grant' | 'loan' | 'equity' | 'visa' | 'consulting' | 'service' | 'other';
  program_type: 'grant' | 'loan' | 'equity' | 'visa' | 'consulting' | 'service' | 'other';
  funding_amount_min?: number;
  funding_amount_max?: number;
  currency?: string;
  deadline?: Date;
  source_url: string;
  institution: string;
  program_category: string;
  eligibility_criteria: any;
  requirements: any;
  contact_info: any;
  scraped_at: Date;
  confidence_score: number;
  is_active: boolean;
  
  // GPT-enhanced fields
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: any[];
  editor_sections?: any[];
  readiness_criteria?: any[];
  ai_guidance?: any;
}

export interface ScraperConfig {
  institution: string;
  category: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  retryAttempts: number;
  timeout: number;
}

export interface ScraperResult {
  institution: string;
  category: string;
  programs: ScrapedProgram[];
  success: boolean;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface ScraperStats {
  lastRun: Date | null;
  successCount: number;
  errorCount: number;
}

export interface ScraperError {
  message: string;
  code: string;
  timestamp: Date;
  context?: any;
}

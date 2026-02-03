// Import the actual Program-Types file that was moved
// Define the diagnostic-related types that were originally in the main types file

export interface SetupDiagnostics {
  warnings: string[];
  missingFields: string[];
  confidence: number;
}

export type SetupStatus = 'none' | 'draft' | 'confirmed' | 'locked';
export type SetupSource = 'program' | 'template' | 'standard';
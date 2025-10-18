// ========= PLAN2FUND — EDITOR NORMALIZATION =========
// Data normalization system for all entry points
// Converts all entry point data to consistent format while preserving all information

import { Product, Route } from '../../types/plan';

// Normalized editor input interface
export interface NormalizedEditorInput {
  product: Product;
  route: Route;
  programId: string | null;
  answers: Record<string, any>;
  payload: Record<string, any>;
  allData: {
    wizardAnswers: Record<string, any>;
    programData: Record<string, any>;
    selectedProgram: string | null;
    entryPoint: string;
  };
}

// Entry point types
export type EntryPoint = 
  | 'wizard-results'
  | 'advanced-search-results' 
  | 'program-detail'
  | 'pricing'
  | 'library'
  | 'dashboard'
  | 'home'
  | 'direct';

export class EditorNormalization {
  // Normalize data from any entry point
  static normalizeInput(props: {
    programId?: string;
    route?: string;
    product?: string;
    answers?: Record<string, any>;
    payload?: Record<string, any>;
    restore?: boolean;
    entryPoint?: EntryPoint;
  }): NormalizedEditorInput {
    const {
      programId,
      route,
      product,
      answers = {},
      payload = {},
      entryPoint = 'direct'
    } = props;

    // Determine product with fallback logic
    const normalizedProduct = this.normalizeProduct(product, entryPoint);
    
    // Determine route with fallback logic
    const normalizedRoute = this.normalizeRoute(route, programId, normalizedProduct);
    
    // Determine program ID
    const normalizedProgramId = programId || null;
    
    // Preserve all data
    const normalizedAnswers = this.normalizeAnswers(answers);
    const normalizedPayload = this.normalizePayload(payload, normalizedProgramId);

    return {
      product: normalizedProduct,
      route: normalizedRoute,
      programId: normalizedProgramId,
      answers: normalizedAnswers,
      payload: normalizedPayload,
      allData: {
        wizardAnswers: normalizedAnswers,
        programData: normalizedPayload,
        selectedProgram: normalizedProgramId,
        entryPoint
      }
    };
  }

  // Normalize product with smart fallbacks
  private static normalizeProduct(
    product?: string, 
    entryPoint?: EntryPoint
  ): Product {
    // If product explicitly provided, use it
    if (product && ['strategy', 'review', 'submission'].includes(product)) {
      return product as Product;
    }

    // Smart fallbacks based on entry point
    switch (entryPoint) {
      case 'wizard-results':
      case 'advanced-search-results':
        return 'submission'; // Wizard typically leads to submission
      case 'program-detail':
        return 'submission'; // Program detail typically leads to submission
      case 'pricing':
        return 'strategy'; // Pricing typically shows strategy first
      case 'library':
        return 'submission'; // Library typically leads to submission
      case 'dashboard':
      case 'home':
      case 'direct':
      default:
        return 'submission'; // Default to most complete product
    }
  }

  // Normalize route with smart fallbacks
  private static normalizeRoute(
    route?: string, 
    programId?: string, 
    product?: Product
  ): Route {
    // If route explicitly provided, use it
    if (route && ['grant', 'loan', 'equity', 'visa'].includes(route)) {
      return route as Route;
    }

    // Try to derive from program ID (if available)
    if (programId) {
      const derivedRoute = this.deriveRouteFromProgramId(programId);
      if (derivedRoute) return derivedRoute;
    }

    // Fallback based on product
    switch (product) {
      case 'strategy':
        return 'grant'; // Strategy typically uses grants
      case 'review':
        return 'grant'; // Review typically uses grants
      case 'submission':
      default:
        return 'grant'; // Default to most common
    }
  }

  // Derive route from program ID
  private static deriveRouteFromProgramId(programId: string): Route | null {
    // Simple pattern matching for common program IDs
    if (programId.includes('grant') || programId.includes('aws') || programId.includes('ffg')) {
      return 'grant';
    }
    if (programId.includes('loan') || programId.includes('bank') || programId.includes('ams')) {
      return 'loan';
    }
    if (programId.includes('equity') || programId.includes('investor')) {
      return 'equity';
    }
    if (programId.includes('visa') || programId.includes('rwr')) {
      return 'visa';
    }
    return null;
  }

  // Normalize answers data
  private static normalizeAnswers(
    answers: Record<string, any>
  ): Record<string, any> {
    // Preserve all wizard answers
    if (typeof answers === 'object' && answers !== null) {
      return { ...answers };
    }
    
    // Return empty object if no answers
    return {};
  }

  // Normalize payload data
  private static normalizePayload(
    payload: Record<string, any>, 
    programId: string | null
  ): Record<string, any> {
    // Preserve all payload data
    if (typeof payload === 'object' && payload !== null) {
      return { ...payload };
    }
    
    // Create minimal payload if none provided
    return {
      programId,
      timestamp: new Date().toISOString()
    };
  }

  // Extract prefilled data for sections
  static extractPrefillData(
    sectionKey: string, 
    allData: NormalizedEditorInput['allData']
  ): Record<string, any> {
    const { wizardAnswers, programData } = allData;
    
    // Map wizard answers to section content
    const sectionMapping: Record<string, string[]> = {
      'execSummary': ['execSummary', 'executive_summary', 'summary'],
      'companyTeam': ['companyTeam', 'team', 'company_overview'],
      'productOverview': ['productOverview', 'product', 'solution'],
      'marketCompetition': ['marketCompetition', 'market', 'competition'],
      'financials': ['financials', 'financial_plan', 'budget'],
      'risksMitigation': ['risksMitigation', 'risks', 'mitigation']
    };
    
    const possibleKeys = sectionMapping[sectionKey] || [sectionKey];
    
    // Look for matching data in wizard answers
    for (const key of possibleKeys) {
      if (wizardAnswers[key]) {
        return { content: wizardAnswers[key] };
      }
    }
    
    // Look for matching data in program data
    for (const key of possibleKeys) {
      if (programData[key]) {
        return { content: programData[key] };
      }
    }
    
    return {};
  }
}

// Export convenience function
export const normalizeEditorInput = EditorNormalization.normalizeInput;

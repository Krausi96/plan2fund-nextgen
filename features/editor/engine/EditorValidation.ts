// ========= PLAN2FUND — EDITOR VALIDATION =========
// Dynamic validation system for product/route/program dependencies
// Loads validation rules from actual program data for foolproof operation

import { Product, Route } from '@/shared/types/plan';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}

// Program data interface (simplified)
export interface ProgramData {
  id: string;
  name: string;
  type: string;
  program_type: string;
  supports_products?: string[];
  target_groups?: string[];
}

// Validation rules loaded from actual data
export class EditorValidation {
  private programs: ProgramData[] = [];
  private isLoaded = false;

  // Load programs from API
  async loadPrograms(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const response = await fetch('/api/programs?enhanced=true');
      if (!response.ok) throw new Error('Failed to load programs');
      
      const data = await response.json();
      this.programs = data.programs || [];
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading programs for validation:', error);
      // Fallback to empty array
      this.programs = [];
      this.isLoaded = true;
    }
  }

  // Get valid routes for a product (dynamic)
  async getValidRoutes(product: Product): Promise<Route[]> {
    await this.loadPrograms();
    
    // Get all unique program types that support this product
    const validTypes = this.programs
      .filter(program => this.supportsProduct(program, product))
      .map(program => program.program_type || program.type)
      .filter(type => ['grant', 'loan', 'equity', 'visa'].includes(type))
      .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates
    
    return validTypes as Route[];
  }

  // Get valid programs for a route (dynamic)
  async getValidPrograms(route: Route): Promise<ProgramData[]> {
    await this.loadPrograms();
    
    return this.programs.filter(program => 
      (program.program_type || program.type) === route
    );
  }

  // Check if program supports product
  private supportsProduct(program: ProgramData, product: Product): boolean {
    // If program has explicit product support, use that
    if (program.supports_products) {
      return program.supports_products.includes(product);
    }
    
    // Fallback to business logic
    switch (product) {
      case 'strategy':
        return ['grant', 'equity'].includes(program.program_type || program.type);
      case 'review':
        return true; // All programs support review
      case 'submission':
        return true; // All programs support submission
      default:
        return true;
    }
  }

  // Validate product/route combination (permissive)
  async validateProductRoute(product: Product, route: Route): Promise<ValidationResult> {
    const validRoutes = await this.getValidRoutes(product);
    const isValid = validRoutes.includes(route);
    
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (!isValid) {
      warnings.push(`Product "${product}" typically doesn't work with "${route}" funding`);
      suggestions.push(`Consider using: ${validRoutes.join(', ')}`);
    }
    
    return {
      isValid: true, // Always allow (permissive)
      warnings,
      suggestions
    };
  }

  // Validate product/route/program combination (permissive)
  async validateProductRouteProgram(
    product: Product, 
    route: Route, 
    programId: string | null
  ): Promise<ValidationResult> {
    const productRouteResult = await this.validateProductRoute(product, route);
    const warnings = [...productRouteResult.warnings];
    const suggestions = [...productRouteResult.suggestions];
    
    if (programId) {
      const validPrograms = await this.getValidPrograms(route);
      const program = validPrograms.find(p => p.id === programId);
      
      if (!program) {
        warnings.push(`Program "${programId}" not found for "${route}" funding`);
        suggestions.push(`Available programs: ${validPrograms.map(p => p.name).join(', ')}`);
      }
    }
    
    return {
      isValid: true, // Always allow (permissive)
      warnings,
      suggestions
    };
  }

  // Get all available products
  getAvailableProducts(): Product[] {
    return ['strategy', 'review', 'submission'];
  }

  // Get all available routes
  getAvailableRoutes(): Route[] {
    return ['grant', 'loan', 'equity', 'visa'];
  }
}

// Singleton instance
export const editorValidation = new EditorValidation();

/**
 * Program Manager
 * Utility functions to manage the mock funding program repository
 */

import { MOCK_FUNDING_PROGRAMS } from './index';

export interface ProgramManager {
  /**
   * Get all mock funding programs
   */
  getAllPrograms: () => any[];

  /**
   * Get a specific program by ID
   */
  getProgramById: (id: string) => any | null;

  /**
   * Add a new program to the repository
   */
  addProgram: (program: any) => void;

  /**
   * Remove a program by ID
   */
  removeProgram: (id: string) => void;

  /**
   * Update an existing program
   */
  updateProgram: (id: string, updatedProgram: any) => void;

  /**
   * Search programs by criteria
   */
  searchPrograms: (criteria: Partial<any>) => any[];
}

// In-memory storage for programs (in a real scenario, this would be persistent)
let programsDb = [...MOCK_FUNDING_PROGRAMS];

export const programManager: ProgramManager = {
  getAllPrograms: (): any[] => {
    return [...programsDb];
  },

  getProgramById: (id: string): any | null => {
    return programsDb.find(program => program.id === id) || null;
  },

  addProgram: (program: any): void => {
    // Validate program structure
    if (!program.id || !program.name) {
      throw new Error('Program must have id and name');
    }

    // Check if program with same ID already exists
    if (programsDb.some(p => p.id === program.id)) {
      throw new Error(`Program with ID ${program.id} already exists`);
    }

    programsDb.push(program);
  },

  removeProgram: (id: string): void => {
    const initialLength = programsDb.length;
    programsDb = programsDb.filter(program => program.id !== id);
    
    if (programsDb.length === initialLength) {
      throw new Error(`Program with ID ${id} not found`);
    }
  },

  updateProgram: (id: string, updatedProgram: any): void => {
    const index = programsDb.findIndex(program => program.id === id);
    if (index === -1) {
      throw new Error(`Program with ID ${id} not found`);
    }

    programsDb[index] = { ...programsDb[index], ...updatedProgram };
  },

  searchPrograms: (criteria: Partial<any>): any[] => {
    return programsDb.filter(program => {
      let matches = true;

      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined && value !== null) {
          const programValue = program[key];
          
          if (typeof value === 'string' && typeof programValue === 'string') {
            // Case-insensitive partial match for strings
            if (!programValue.toLowerCase().includes(value.toLowerCase())) {
              matches = false;
              break;
            }
          } else if (Array.isArray(value) && Array.isArray(programValue)) {
            // Check if all criteria values are included in program values
            const hasAllValues = value.every(v => programValue.includes(v));
            if (!hasAllValues) {
              matches = false;
              break;
            }
          } else if (programValue !== value) {
            matches = false;
            break;
          }
        }
      }

      return matches;
    });
  }
};

/**
 * Reset the program database to initial state
 */
export const resetProgramDatabase = (): void => {
  programsDb = [...MOCK_FUNDING_PROGRAMS];
};

/**
 * Get program count by region
 */
export const getProgramCountByRegion = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  programsDb.forEach(program => {
    const region = program.region || 'Unknown';
    counts[region] = (counts[region] || 0) + 1;
  });
  
  return counts;
};

/**
 * Get program count by type
 */
export const getProgramCountByType = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  programsDb.forEach(program => {
    const types = Array.isArray(program.funding_types) ? program.funding_types : [program.type || 'Unknown'];
    
    types.forEach((type: string) => {
      counts[type] = (counts[type] || 0) + 1;
    });
  });
  
  return counts;
};
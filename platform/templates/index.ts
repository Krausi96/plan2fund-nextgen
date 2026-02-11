// Re-export template constants and collections from general folder
export { 
  SHARED_SPECIAL_SECTIONS,
  MASTER_SECTIONS,
  MASTER_DOCUMENTS_BY_PRODUCT
} from './general/templateConstants';

// Export individual section catalogs
export { BUSINESS_PLAN_SECTIONS } from './catalog/products/business_plan';
export { STRATEGY_SECTIONS } from './catalog/products/strategy';


// Export program catalogs
import { awsSeedfinancing } from './catalog/programs/individual/aws-seedfinancing';
import { ffgBasisprogramm } from './catalog/programs/individual/ffg-basisprogramm';
import { eicAccelerator } from './catalog/programs/individual/eic-accelerator';

// Import program manager that includes all programs
import { programManager, resetProgramDatabase, getProgramCountByRegion, getProgramCountByType } from './catalog/programs/programManager';

export { 
  awsSeedfinancing,
  ffgBasisprogramm,
  eicAccelerator,
  // Export program manager and utilities
  programManager,
  resetProgramDatabase,
  getProgramCountByRegion,
  getProgramCountByType
};

// Use program manager to get all programs
export const MOCK_FUNDING_PROGRAMS = programManager.getAllPrograms();

// Export action functions
export { addCustomDocument } from './actions/addCustomDocument';
export { addCustomSection } from './actions/addCustomSection';
export { addCustomSubsection } from './actions/addCustomSubsection';


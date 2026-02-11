// LEGACY REDIRECT: Templates have been moved to platform/templates
// This file is maintained for backward compatibility

export { 
  SHARED_SPECIAL_SECTIONS,
  MASTER_SECTIONS,
  MASTER_DOCUMENTS_BY_PRODUCT
} from '@/platform/templates/general/templateConstants';

// Export individual section catalogs
export { BUSINESS_PLAN_SECTIONS } from '@/platform/templates/catalog/products/business_plan';
export { STRATEGY_SECTIONS } from '@/platform/templates/catalog/products/strategy';


// Export program catalogs
import { awsSeedfinancing } from '@/platform/templates/catalog/programs/individual/aws-seedfinancing';
import { ffgBasisprogramm } from '@/platform/templates/catalog/programs/individual/ffg-basisprogramm';
import { eicAccelerator } from '@/platform/templates/catalog/programs/individual/eic-accelerator';

// Import program manager that includes all programs
import { programManager, resetProgramDatabase, getProgramCountByRegion, getProgramCountByType } from '@/platform/templates/catalog/programs/programManager';

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
export { addCustomDocument } from '@/platform/templates/actions/addCustomDocument';
export { addCustomSection } from '@/platform/templates/actions/addCustomSection';
export { addCustomSubsection } from '@/platform/templates/actions/addCustomSubsection';


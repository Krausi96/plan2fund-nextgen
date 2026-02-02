// Re-export template constants and collections from general folder
export { 
  SHARED_SPECIAL_SECTIONS,
  MASTER_SECTIONS,
  MASTER_DOCUMENTS_BY_PRODUCT
} from './general/templateConstants';

// Export individual section catalogs
export { BUSINESS_PLAN_SECTIONS } from './catalog/products/business_plan';
export { STRATEGY_SECTIONS } from './catalog/products/strategy';
export { UPGRADE_SECTIONS } from './catalog/products/upgrade';

// Export program catalogs
import { awsSeedfinancing } from './catalog/programs/individual/aws-seedfinancing';
import { ffgBasisprogramm } from './catalog/programs/individual/ffg-basisprogramm';
import { eicAccelerator } from './catalog/programs/individual/eic-accelerator';

export { 
  awsSeedfinancing,
  ffgBasisprogramm,
  eicAccelerator
};

export const MOCK_FUNDING_PROGRAMS = [
  awsSeedfinancing,
  ffgBasisprogramm,
  eicAccelerator
];

// Export action functions
export { addCustomDocument } from './actions/addCustomDocument';
export { addCustomSection } from './actions/addCustomSection';
export { addCustomSubsection } from './actions/addCustomSubsection';

// Export service functions
export { createBlueprint } from './services/blueprint/createBlueprint';
export { normalizeTemplate } from './services/blueprint/normalizeTemplate';

// Export state interfaces
export type { BlueprintState, BlueprintStore } from './state/blueprint';
export { initialBlueprintState } from './state/blueprint';
export type { PlanInstanceState, PlanInstanceStore } from './state/planInstance';
export { initialPlanInstanceState } from './state/planInstance';
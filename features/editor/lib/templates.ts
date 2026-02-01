// Main export file for templates module
// Re-exports all template-related functionality

// Export individual section catalogs
export { BUSINESS_PLAN_SECTIONS } from './catalog/products/business_plan';
export { STRATEGY_SECTIONS } from './catalog/products/strategy';
export { UPGRADE_SECTIONS } from './catalog/products/upgrade';

// Export shared special sections
export { SHARED_SPECIAL_SECTIONS } from './shared';

// Export the master sections collection
export { MASTER_SECTIONS } from './master';

// Export document templates
export { MASTER_DOCUMENTS_BY_PRODUCT } from './documents';

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
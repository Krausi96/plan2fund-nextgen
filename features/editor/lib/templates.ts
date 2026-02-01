// Root templates file
// This file has been cleared as per requirements and will serve as the main templates file
// containing consolidated content from all template subdirectories

// Export all template functionality
export * from './templates/catalog/products/business_plan';
export * from './templates/catalog/products/strategy';
export * from './templates/catalog/products/upgrade';
export * from './templates/shared';
export * from './templates/master';
export * from './templates/documents';

// Export action functions
export { addCustomDocument } from './templates/actions/addCustomDocument';
export { addCustomSection } from './templates/actions/addCustomSection';
export { addCustomSubsection } from './templates/actions/addCustomSubsection';

// Export service functions
export { createBlueprint } from './templates/services/blueprint/createBlueprint';
export { normalizeTemplate } from './templates/services/blueprint/normalizeTemplate';

// Export state interfaces
export type { BlueprintState, BlueprintStore } from './templates/state/blueprint';
export { initialBlueprintState } from './templates/state/blueprint';
export type { PlanInstanceState, PlanInstanceStore } from './templates/state/planInstance';
export { initialPlanInstanceState } from './templates/state/planInstance';

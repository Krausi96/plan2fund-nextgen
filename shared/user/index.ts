// User module exports
export * from './storage/planStore'; // Includes documentStore, paymentStore, and multiUser
// Export userProfile types but exclude PlanSection (already in planStore)
export type { UserProfile, RecoContext, PlanDocument } from './schemas/userProfile';
export * from './context/UserContext';
export * from './database/repository';
export * from './auth/withAuth'; // Includes auth utils

// Analytics - export default and named exports
export { default as analytics } from './analytics/analytics';
export * from './analytics/analytics';

// Segmentation - export all
export * from './segmentation/targetGroupDetection';
export * from './segmentation/personaMapping';


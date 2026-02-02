/**
 * Export all mock funding programs
 * Individual program files for better maintainability
 */

export { awsSeedfinancing } from './aws-seedfinancing';
export { ffgBasisprogramm } from './ffg-basisprogramm';
export { eicAccelerator } from './eic-accelerator';

// Aggregate all programs for easy import
export const MOCK_FUNDING_PROGRAMS = [
  awsSeedfinancing,
  ffgBasisprogramm,
  eicAccelerator
];
/**
 * ============================================================================
 * CENTRALIZED TYPE EXPORTS
 * ============================================================================
 * 
 * This file re-exports all TypeScript type definitions from specialized files.
 * It serves as the main entry point for importing types throughout the editor.
 * 
 * USAGE:
 *   Import types from here: import type { ProductType, PlanSection } from '@/features/editor/lib';
 * 
 * ============================================================================
 */

// Core types
export type { ProductType, ProductOption } from './core/product-types';
export type { SubsectionTemplate, SectionTemplate, DocumentTemplate } from './core/template-types';

// Document types
export type { TitlePage, PlanSection, PlanDocument, BusinessPlan, SectionWithMetadata, DocumentWithMetadata } from '@/platform/core/types';

// Program types
export type { FundingProgram, DocumentStructure, ProgramSummary, SetupDiagnostics, SetupStatus, SetupSource } from './program/program-types';

// Workflow types
export type { ProjectProfile, DocumentTemplateId, SetupWizardState } from '@/platform/core/types';

// Navigation types
export type { TreeNode } from './ui/navigation-types';
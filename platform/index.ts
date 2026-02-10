/**
 * PLATFORM LAYER - Unified Core Infrastructure
 * 
 * Central entry point for all platform services:
 * - core: types, validation, context, store
 * - ai: LLM orchestration, prompts, parsers
 * - analysis: program and document analysis
 * - generation: document structure and content generation
 * - api: utilities and middleware
 * - reco: recommendation/program finder components
 */

// Core layer: types, validation, context, store
export * from './core/types';
export * from './core/validation';
export * from './core/context';
export { useProjectStore, type ProjectStore, type ProjectStoreState, type ProjectStoreActions } from './core/store/useProjectStore';

// AI layer: LLM orchestration
export { callLLM, type LLMRequest, type LLMResponse } from './ai/llmClient';
export * from './ai/orchestrator';

// Analysis layer: program and document analysis
export * from './analysis';

// Generation layer: document structure and content
export { buildDocumentStructure, generateBlueprint } from './generation';

// API layer: utilities and middleware
export * from './api';

// Reco layer: program recommendation components (re-exports)
export type { ProgramSummary } from './core/types';

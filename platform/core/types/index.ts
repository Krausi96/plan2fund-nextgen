// Central type exports for the entire application
// All types must be defined in separate files for maintainability

export type { UserProfile, UserContextValue } from './user';
export type {
  ProjectProfile,
  EditorMeta,
  FundingProfile,
  Plan,
  BusinessPlan,
  TitlePage,
  PlanSection,
  PlanDocument,
  SectionWithMetadata,
  DocumentWithMetadata,
  DocumentStructure,
  Document,
  Section,
  Requirement,
  ValidationRule,
  AIGuidance,
  RenderingRules,
  ConflictItem,
  WarningItem,
  SetupWizardState,
  DocumentTemplateId,
  ProductType,
  DocumentTemplate,
  SectionTemplate,
  SubsectionTemplate,
  ProductOption,
} from './project';
export type {
  Program,
  FundingProgram,
  ProgramSummary,
  FundingType,
  DocumentRequirement,
  SectionRequirement,
  FinancialRequirement,
  ProgramFinderProps,
} from './program';
export type {
  Blueprint,
  BlueprintRequest,
  RequirementItem,
  ChecklistItem,
} from './blueprint';

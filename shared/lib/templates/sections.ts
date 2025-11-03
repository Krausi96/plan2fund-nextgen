// ========= PLAN2FUND — MASTER SECTION TEMPLATES =========
// Master templates - base structure for all programs
// Program-specific sections override these

import { SectionTemplate } from './types';

// Import from existing file (will migrate)
import { STANDARD_SECTIONS } from '../../standardSectionTemplates';

// Convert STANDARD_SECTIONS to new format (temporary bridge)
export const MASTER_SECTIONS = {
  grants: STANDARD_SECTIONS.grants,
  bankLoans: STANDARD_SECTIONS.bankLoans,
  equity: STANDARD_SECTIONS.equity,
  visa: STANDARD_SECTIONS.visa
};


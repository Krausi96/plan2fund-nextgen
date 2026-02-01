// Master sections collection
import type { SectionTemplate } from '../types/types';
import { SHARED_SPECIAL_SECTIONS } from './shared';
import { STRATEGY_SECTIONS } from './catalog/products/strategy';
import { BUSINESS_PLAN_SECTIONS } from './catalog/products/business_plan';
import { UPGRADE_SECTIONS } from './catalog/products/upgrade';

export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: [...STRATEGY_SECTIONS, ...SHARED_SPECIAL_SECTIONS], // Strategy now uses strategy-specific sections + shared special sections
  submission: [...BUSINESS_PLAN_SECTIONS, ...SHARED_SPECIAL_SECTIONS],
  upgrade: [...BUSINESS_PLAN_SECTIONS, ...UPGRADE_SECTIONS, ...SHARED_SPECIAL_SECTIONS]
};
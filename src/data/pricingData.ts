// Minimal data for pricing components
// This replaces the fake data from basisPack.ts

import { type Product, type FundingType } from '@/types/plan';
import { type TargetGroup } from '@/lib/targetGroupDetection';

export interface FundingPack {
  included: string[];
  youProvide: string[];
  description?: string;
}

export interface DocSpec {
  id: string;
  name: string;
  description: string;
  purpose?: string;
  formatLength?: string;
  customization?: string;
  limits?: string;
  coreSections: any[];
  inputs: any[];
  outputs: any[];
  complianceChecklist: any[];
  fundingTypes: string[];
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  scope: string;
  deliverables?: string[];
  turnaround?: string;
}

// Placeholder functions - these return empty data
export function getFundingPack(_targetGroup: TargetGroup, _fundingType: FundingType, _product: Product): FundingPack {
  return {
    included: [],
    youProvide: []
  };
}

export function getDocSpec(docId: string): DocSpec | null {
  return {
    id: docId,
    name: 'Document',
    description: 'Document description',
    coreSections: [],
    inputs: [],
    outputs: [],
    complianceChecklist: [],
    fundingTypes: []
  };
}

export function getAddonsForFundingType(_fundingType: FundingType): Addon[] {
  return [];
}

export function getAddonSpec(addonId: string): Addon | null {
  return {
    id: addonId,
    name: 'Addon',
    description: 'Addon description',
    price: 0,
    scope: 'Basic'
  };
}

/**
 * Shared types for section detection functionality
 */

// Types for detection results
export type SectionType = 'title_page' | 'toc' | 'references' | 'appendices' | 'tables_data' | 'figures_images';

export interface DetectionResult {
  found: boolean;
  confidence: number;
  content?: any;
}

export interface DetectionMap {
  [key: string]: DetectionResult;
}

export interface DetectionInfo {
  source: 'upload' | 'ocr' | 'program';
  confidence: number;
  payload?: any;
}

export type TranslationFunction = (key: any) => string;
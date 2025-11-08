/**
 * Overview Page Filter Exploration
 * Extracts filter combinations from overview pages (e.g., FFG filter pages)
 * to discover new programs
 */

import * as cheerio from 'cheerio';

export interface FilterOption {
  name: string;
  value: string;
  label: string;
}

export interface FilterCombination {
  filters: Record<string, string[]>;
  url: string;
}

/**
 * Extract filter options from an overview page
 */
export function extractFilterOptions(html: string, _baseUrl: string): Record<string, FilterOption[]> {
  const $ = cheerio.load(html);
  const filters: Record<string, FilterOption[]> = {};
  
  // Extract select elements (dropdowns)
  $('select[name*="field_"], select[name*="filter"], select[name*="type"]').each((_, el) => {
    const name = $(el).attr('name') || '';
    if (!name) return;
    
    const options: FilterOption[] = [];
    $(el).find('option').each((_, opt) => {
      const value = $(opt).attr('value') || '';
      const label = $(opt).text().trim();
      if (value && value !== '' && value !== 'all' && value !== '-') {
        options.push({ name, value, label });
      }
    });
    
    if (options.length > 0) {
      filters[name] = options;
    }
  });
  
  // Extract checkbox/radio groups
  $('input[type="checkbox"][name*="field_"], input[type="radio"][name*="field_"]').each((_, el) => {
    const name = $(el).attr('name') || '';
    const value = $(el).attr('value') || '';
    const label = $(el).next('label').text().trim() || $(el).attr('title') || value;
    
    if (name && value && value !== 'all' && value !== '-') {
      if (!filters[name]) {
        filters[name] = [];
      }
      // Avoid duplicates
      if (!filters[name].some(opt => opt.value === value)) {
        filters[name].push({ name, value, label });
      }
    }
  });
  
  return filters;
}

/**
 * Generate filter combinations strategically
 * Returns a limited set of combinations to avoid too many URLs
 */
export function generateFilterCombinations(
  filters: Record<string, FilterOption[]>,
  maxCombinations: number = 10
): Record<string, string[]>[] {
  const combinations: Record<string, string[]>[] = [];
  
  // Strategy: Take first option from each filter type
  // This gives us a representative sample without explosion
  const filterNames = Object.keys(filters);
  
  if (filterNames.length === 0) {
    return [];
  }
  
  // Generate combinations: one filter at a time, then pairs, then triples
  // Stop when we reach maxCombinations
  
  // Single filters (one option per filter type)
  for (const filterName of filterNames) {
    const options = filters[filterName];
    if (options.length > 0) {
      combinations.push({
        [filterName]: [options[0].value]
      });
      if (combinations.length >= maxCombinations) break;
    }
  }
  
  // Pairs (if we have space)
  if (combinations.length < maxCombinations && filterNames.length >= 2) {
    for (let i = 0; i < filterNames.length - 1 && combinations.length < maxCombinations; i++) {
      for (let j = i + 1; j < filterNames.length && combinations.length < maxCombinations; j++) {
        const name1 = filterNames[i];
        const name2 = filterNames[j];
        const options1 = filters[name1];
        const options2 = filters[name2];
        
        if (options1.length > 0 && options2.length > 0) {
          combinations.push({
            [name1]: [options1[0].value],
            [name2]: [options2[0].value]
          });
        }
      }
    }
  }
  
  return combinations;
}

/**
 * Build URL with filter parameters
 */
export function buildFilterUrl(baseUrl: string, combination: Record<string, string[]>): string {
  const url = new URL(baseUrl);
  
  // Clear existing filter params
  const paramsToRemove: string[] = [];
  url.searchParams.forEach((_, key) => {
    if (key.includes('field_') || key.includes('filter') || key.includes('type')) {
      paramsToRemove.push(key);
    }
  });
  paramsToRemove.forEach(key => url.searchParams.delete(key));
  
  // Add new filter params
  for (const [filterName, values] of Object.entries(combination)) {
    values.forEach((value, index) => {
      // Handle array-style params: field_funding_type[0]=grant
      const paramName = filterName.includes('[') ? filterName : `${filterName}[${index}]`;
      url.searchParams.set(paramName, value);
    });
  }
  
  return url.toString();
}

/**
 * Extract all filter URLs from an overview page
 */
export function extractFilterUrls(html: string, baseUrl: string, maxUrls: number = 10): string[] {
  const filters = extractFilterOptions(html, baseUrl);
  const combinations = generateFilterCombinations(filters, maxUrls);
  
  return combinations.map(combo => buildFilterUrl(baseUrl, combo));
}


/**
 * Date Normalization Utilities
 * Converts various date formats to ISO format (YYYY-MM-DD)
 * Filters out past dates (deadlines <= today)
 */

/**
 * Normalize date string to ISO format (YYYY-MM-DD)
 * Handles: DD.MM.YYYY, MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
 * 
 * @param dateStr - Date string to normalize
 * @param filterPast - If true, returns null for dates <= today (default: true for deadlines)
 * @returns Normalized date in YYYY-MM-DD format, or null if invalid/past
 */
export function normalizeDate(dateStr: string | null | undefined, filterPast: boolean = true): string | null {
  if (!dateStr || dateStr === 'null' || dateStr.toLowerCase() === 'null') {
    return null;
  }
  
  const trimmed = String(dateStr).trim();
  if (!trimmed || trimmed.length === 0) {
    return null;
  }
  
  // Already in ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // Filter past dates if requested
    if (filterPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(trimmed);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        console.warn(`⚠️  Deadline is in the past or today: "${trimmed}" - excluding`);
        return null;
      }
    }
    return trimmed;
  }
  
  // DD.MM.YYYY format (e.g., "18.11.2025")
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Filter past dates if requested
    if (filterPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(normalized);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        console.warn(`⚠️  Deadline is in the past or today: "${normalized}" - excluding`);
        return null;
      }
    }
    
    return normalized;
  }
  
  // DD/MM/YYYY format (e.g., "18/11/2025")
  const ddmmyyyySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyySlash) {
    const [, day, month, year] = ddmmyyyySlash;
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Filter past dates if requested
    if (filterPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(normalized);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        console.warn(`⚠️  Deadline is in the past or today: "${normalized}" - excluding`);
        return null;
      }
    }
    
    return normalized;
  }
  
  // MM/DD/YYYY format (e.g., "11/18/2025")
  const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Filter past dates if requested
    if (filterPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(normalized);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        console.warn(`⚠️  Deadline is in the past or today: "${normalized}" - excluding`);
        return null;
      }
    }
    
    return normalized;
  }
  
  // DD-MM-YYYY format (e.g., "18-11-2025")
  const ddmmyyyyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyDash) {
    const [, day, month, year] = ddmmyyyyDash;
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Filter past dates if requested
    if (filterPast) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(normalized);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate <= today) {
        console.warn(`⚠️  Deadline is in the past or today: "${normalized}" - excluding`);
        return null;
      }
    }
    
    return normalized;
  }
  
  // Try to parse as Date object
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const normalized = `${year}-${month}-${day}`;
      
      // Filter out past dates if requested (for deadlines)
      if (filterPast) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day
        
        const deadlineDate = new Date(normalized);
        deadlineDate.setHours(0, 0, 0, 0);
        
        // If deadline is today or in the past, return null (expired)
        if (deadlineDate <= today) {
          console.warn(`⚠️  Deadline is in the past or today: "${normalized}" - excluding`);
          return null;
        }
      }
      
      return normalized;
    }
  } catch {
    // Invalid date
  }
  
  // If we can't parse it, return null (don't save invalid dates)
  console.warn(`⚠️  Could not parse date format: "${trimmed}"`);
  return null;
}


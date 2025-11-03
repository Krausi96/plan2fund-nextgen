/**
 * SINGLE SOURCE OF TRUTH for all application state
 * Consolidates all localStorage usage into one place
 */

export type PlanSection = { 
  id: string; 
  title: string; 
  content: string; 
  tables?: any; 
  figures?: any[]; 
  sources?: Array<{ title: string; url: string }> 
}

export type UserAnswers = Record<string, any>;
export type EnhancedPayload = Record<string, any>;
export type SelectedProgram = {
  id: string;
  name?: string;
  type?: string;
  route?: string;
};

export type PlanSettings = {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  showPageNumbers?: boolean;
  showTableOfContents?: boolean;
};

export type AppState = {
  planSections: PlanSection[];
  userAnswers: UserAnswers;
  enhancedPayload: EnhancedPayload;
  selectedProgram: SelectedProgram | null;
  planSettings: PlanSettings;
  planSeed?: any; // From intake
};

function getSessionId(): string {
  if (typeof document === "undefined") return "anon";
  const match = document.cookie.split(";").find((c) => c.trim().startsWith("pf_session="));
  return match ? match.split("=")[1] : "anon";
}

function getStorageKey(key: string): string {
  return `pf_${key}_${getSessionId()}`;
}

// ============================================================================
// PLAN SECTIONS (existing planStore functionality)
// ============================================================================

let debounceTimer: any;
export function savePlanSections(sections: PlanSection[]) {
  try {
    const key = getStorageKey('plan_sections');
    const payload = { v: 1, sections };
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(payload));
    }, 300);
  } catch {}
}

export function loadPlanSections(): PlanSection[] {
  try {
    const key = getStorageKey('plan_sections');
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.v === 1 && Array.isArray(parsed.sections)) {
      return parsed.sections;
    }
    if (Array.isArray(parsed)) return parsed as any;
    return [];
  } catch {
    return [];
  }
}

// ============================================================================
// USER ANSWERS (from wizard)
// ============================================================================

export function saveUserAnswers(answers: UserAnswers): void {
  try {
    const key = getStorageKey('userAnswers');
    localStorage.setItem(key, JSON.stringify(answers));
  } catch {}
}

export function loadUserAnswers(): UserAnswers {
  try {
    const key = getStorageKey('userAnswers');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ============================================================================
// ENHANCED PAYLOAD (from results)
// ============================================================================

export function saveEnhancedPayload(payload: EnhancedPayload): void {
  try {
    const key = getStorageKey('enhancedPayload');
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

export function loadEnhancedPayload(): EnhancedPayload {
  try {
    const key = getStorageKey('enhancedPayload');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ============================================================================
// SELECTED PROGRAM
// ============================================================================

export function saveSelectedProgram(program: SelectedProgram): void {
  try {
    const key = getStorageKey('selectedProgram');
    localStorage.setItem(key, JSON.stringify(program));
  } catch {}
}

export function loadSelectedProgram(): SelectedProgram | null {
  try {
    const key = getStorageKey('selectedProgram');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// PLAN SETTINGS
// ============================================================================

export function savePlanSettings(settings: PlanSettings): void {
  try {
    const key = getStorageKey('plan_settings');
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {}
}

export function loadPlanSettings(): PlanSettings {
  try {
    const key = getStorageKey('plan_settings');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ============================================================================
// PLAN SEED (from intake)
// ============================================================================

export function savePlanSeed(seed: any): void {
  try {
    const key = getStorageKey('planSeed');
    localStorage.setItem(key, JSON.stringify(seed));
  } catch {}
}

export function loadPlanSeed(): any {
  try {
    const key = getStorageKey('planSeed');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// COMPLETE STATE (all-in-one)
// ============================================================================

export function saveAppState(state: Partial<AppState>): void {
  if (state.planSections) savePlanSections(state.planSections);
  if (state.userAnswers) saveUserAnswers(state.userAnswers);
  if (state.enhancedPayload) saveEnhancedPayload(state.enhancedPayload);
  if (state.selectedProgram) saveSelectedProgram(state.selectedProgram);
  if (state.planSettings) savePlanSettings(state.planSettings);
  if (state.planSeed) savePlanSeed(state.planSeed);
}

export function loadAppState(): AppState {
  return {
    planSections: loadPlanSections(),
    userAnswers: loadUserAnswers(),
    enhancedPayload: loadEnhancedPayload(),
    selectedProgram: loadSelectedProgram(),
    planSettings: loadPlanSettings(),
    planSeed: loadPlanSeed()
  };
}

export function clearAppState(): void {
  try {
    const keys = [
      getStorageKey('plan_sections'),
      getStorageKey('userAnswers'),
      getStorageKey('enhancedPayload'),
      getStorageKey('selectedProgram'),
      getStorageKey('plan_settings'),
      getStorageKey('planSeed')
    ];
    keys.forEach(key => localStorage.removeItem(key));
  } catch {}
}

// Re-export for backward compatibility (deprecated - use functions above)
export function loadPlanSections(): PlanSection[] {
  return loadAppState().planSections;
}

export function savePlanSections(sections: PlanSection[]): void {
  saveAppState({ planSections: sections });
}


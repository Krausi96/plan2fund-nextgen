export type PlanSection = { id: string; title: string; content: string; tables?: any; figures?: any[]; sources?: Array<{ title: string; url: string }> }
type Stored = { v: number; sections: PlanSection[] }

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

function getSessionId(): string {
  if (typeof document === "undefined") return "anon"
  const match = document.cookie.split(";").find((c) => c.trim().startsWith("pf_session="))
  return match ? match.split("=")[1] : "anon"
}

function getStorageKey(key: string): string {
  return `pf_${key}_${getSessionId()}`;
}


let debounceTimer: any
export function savePlanSections(sections: PlanSection[]) {
  try {
    const key = getStorageKey('plan_sections')
    const payload: Stored = { v: 1, sections }
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(payload))
    }, 300)
  } catch {}
}

export function loadPlanSections(): PlanSection[] {
  try {
    const key = getStorageKey('plan_sections')
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: Stored = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && parsed.v === 1 && Array.isArray(parsed.sections)) {
      return parsed.sections
    }
    // migrate unknown to v1 by keeping array
    if (Array.isArray(parsed)) return parsed as any
    return []
  } catch {
    return []
  }
}

// ============================================================================
// ADDED: User Answers (from wizard)
// ============================================================================

export function saveUserAnswers(answers: UserAnswers): void {
  try {
    const key = getStorageKey('userAnswers')
    localStorage.setItem(key, JSON.stringify(answers))
  } catch {}
}

export function loadUserAnswers(): UserAnswers {
  try {
    const key = getStorageKey('userAnswers')
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ============================================================================
// ADDED: Enhanced Payload (from results)
// ============================================================================

export function saveEnhancedPayload(payload: EnhancedPayload): void {
  try {
    const key = getStorageKey('enhancedPayload')
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {}
}

export function loadEnhancedPayload(): EnhancedPayload {
  try {
    const key = getStorageKey('enhancedPayload')
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ============================================================================
// ADDED: Selected Program
// ============================================================================

export function saveSelectedProgram(program: SelectedProgram): void {
  try {
    const key = getStorageKey('selectedProgram')
    localStorage.setItem(key, JSON.stringify(program))
  } catch {}
}

export function loadSelectedProgram(): SelectedProgram | null {
  try {
    const key = getStorageKey('selectedProgram')
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ============================================================================
// ADDED: Plan Settings
// ============================================================================

export function savePlanSettings(settings: PlanSettings): void {
  try {
    const key = getStorageKey('plan_settings')
    localStorage.setItem(key, JSON.stringify(settings))
  } catch {}
}

export function loadPlanSettings(): PlanSettings {
  try {
    const key = getStorageKey('plan_settings')
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ============================================================================
// ADDED: Plan Seed (from intake)
// ============================================================================

export function savePlanSeed(seed: any): void {
  try {
    const key = getStorageKey('planSeed')
    localStorage.setItem(key, JSON.stringify(seed))
  } catch {}
}

export function loadPlanSeed(): any {
  try {
    const key = getStorageKey('planSeed')
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}



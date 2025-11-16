import type { ConversationMessage } from '@/features/editor/types/plan';

export type PlanSection = { 
  id: string; 
  title: string; 
  content: string; 
  tables?: Record<string, any>; // Allow any table keys (revenue, costs, risks, competitors, timeline, ratios, team, etc.)
  figures?: any[]; // Allow any figure array structure (FigureRef[] or any other format)
  sources?: Array<{ title: string; url: string }>;
  fields?: Record<string, any>; // Allow any field properties (teamMembers, etc.)
}
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

// Dashboard integration types
export type DashboardPlan = {
  id: string;
  userId: string;
  clientId?: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed';
  lastModified: string;
  programType: string;
  progress: number;
  isPaid?: boolean;
  paidAt?: string;
};

export type DashboardRecommendation = {
  id: string;
  userId: string;
  clientId?: string;
  name: string;
  type: string;
  status: 'pending' | 'applied' | 'rejected' | 'approved';
  amount: string;
  deadline?: string;
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
// ADDED: Dashboard Integration - Save plans for dashboard display
// ============================================================================

/**
 * Save a plan to userPlans for dashboard display
 */
export function savePlanToDashboard(plan: {
  id: string;
  userId: string;
  clientId?: string;
  title: string;
  programType?: string;
  programId?: string;
  sections?: any[];
  status?: 'draft' | 'in_progress' | 'completed';
}): void {
  try {
    if (!plan.userId) {
      console.warn('Cannot save plan to dashboard: userId is required');
      return;
    }

    const plans: DashboardPlan[] = JSON.parse(localStorage.getItem('userPlans') || '[]');
    
    // Calculate progress based on sections
    const totalSections = plan.sections?.length || 0;
    const completedSections = plan.sections?.filter((s: any) => s.content && s.content.trim().length > 0).length || 0;
    const progress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
    
    // Determine status
    let status: 'draft' | 'in_progress' | 'completed' = plan.status || 'draft';
    if (progress === 100 && status !== 'completed') {
      status = 'completed';
    } else if (progress > 0 && status === 'draft') {
      status = 'in_progress';
    }

    const dashboardPlan: DashboardPlan = {
      id: plan.id,
      userId: plan.userId,
      clientId: plan.clientId,
      title: plan.title || 'Untitled Plan',
      status,
      lastModified: new Date().toISOString(),
      programType: plan.programType || 'GRANT',
      progress
    };

    // Update existing plan or add new
    const existingIndex = plans.findIndex(p => p.id === plan.id && p.userId === plan.userId);
    if (existingIndex >= 0) {
      plans[existingIndex] = { ...plans[existingIndex], ...dashboardPlan };
    } else {
      plans.push(dashboardPlan);
    }

    localStorage.setItem('userPlans', JSON.stringify(plans));
  } catch (error) {
    console.error('Error saving plan to dashboard:', error);
  }
}

/**
 * Save a recommendation to userRecommendations for dashboard display
 */
export function saveRecommendationToDashboard(recommendation: {
  id: string;
  userId: string;
  clientId?: string;
  name: string;
  type: string;
  amount?: string;
  deadline?: string;
  status?: 'pending' | 'applied' | 'rejected' | 'approved';
}): void {
  try {
    if (!recommendation.userId) {
      console.warn('Cannot save recommendation to dashboard: userId is required');
      return;
    }

    const recommendations: DashboardRecommendation[] = JSON.parse(localStorage.getItem('userRecommendations') || '[]');
    
    const dashboardRec: DashboardRecommendation = {
      id: recommendation.id,
      userId: recommendation.userId,
      clientId: recommendation.clientId,
      name: recommendation.name,
      type: recommendation.type,
      status: recommendation.status || 'pending',
      amount: recommendation.amount || '',
      deadline: recommendation.deadline
    };

    // Update existing recommendation or add new
    const existingIndex = recommendations.findIndex(r => r.id === recommendation.id && r.userId === recommendation.userId);
    if (existingIndex >= 0) {
      recommendations[existingIndex] = { ...recommendations[existingIndex], ...dashboardRec };
    } else {
      recommendations.push(dashboardRec);
    }

    localStorage.setItem('userRecommendations', JSON.stringify(recommendations));
  } catch (error) {
    console.error('Error saving recommendation to dashboard:', error);
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

// ============================================================================
// ADDED: Plan Conversations (AI Assistant conversation history)
// ============================================================================

/**
 * Save conversation history for a specific section
 */
export function savePlanConversations(
  sectionId: string,
  messages: ConversationMessage[]
): void {
  try {
    const key = getStorageKey('plan_conversations');
    const existing = loadPlanConversations();
    const updated = { ...existing, [sectionId]: messages };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving plan conversations:', error);
  }
}

/**
 * Load all conversation histories (keyed by sectionId)
 */
export function loadPlanConversations(): Record<string, ConversationMessage[]> {
  try {
    const key = getStorageKey('plan_conversations');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error loading plan conversations:', error);
    return {};
  }
}



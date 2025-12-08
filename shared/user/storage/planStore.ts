import type { ConversationMessage, QuestionStatus } from '@/features/editor/lib/types/plan';

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

export type QuestionStateSnapshot = {
  status: QuestionStatus;
  note?: string;
  lastUpdatedAt?: string;
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
// ADDED: Question States (status/notes per prompt)
// ============================================================================

type QuestionStatesStorage = Record<string, QuestionStateSnapshot>;

export function saveQuestionStates(states: QuestionStatesStorage): void {
  try {
    const key = getStorageKey('question_states');
    localStorage.setItem(key, JSON.stringify(states));
  } catch {}
}

export function loadQuestionStates(): QuestionStatesStorage {
  try {
    const key = getStorageKey('question_states');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
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

export function clearSelectedProgram(): void {
  try {
    const key = getStorageKey('selectedProgram')
    localStorage.removeItem(key)
  } catch {}
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

// ============================================================================
// DOCUMENT STORE - Track exported documents for users
// ============================================================================

export interface ExportedDocument {
  id: string;
  userId: string;
  planId?: string;
  paymentId?: string;
  name: string;
  type: 'plan' | 'additional' | 'addon';
  format: 'PDF' | 'DOCX' | 'JSON';
  fileName: string;
  fileSize?: number;
  downloadUrl?: string; // For email links
  exportedAt: string;
  status: 'exported' | 'email_sent' | 'downloaded';
}

/**
 * Save exported document record
 */
export function saveExportedDocument(document: ExportedDocument): void {
  if (typeof window === 'undefined') return;
  
  try {
    const documents: ExportedDocument[] = JSON.parse(localStorage.getItem('userDocuments') || '[]');
    
    // Update existing or add new
    const existingIndex = documents.findIndex(d => d.id === document.id);
    if (existingIndex >= 0) {
      documents[existingIndex] = document;
    } else {
      documents.push(document);
    }
    
    localStorage.setItem('userDocuments', JSON.stringify(documents));
  } catch (error) {
    console.error('Error saving exported document:', error);
  }
}

/**
 * Get all exported documents for a user
 */
export function getUserDocuments(userId: string, planId?: string): ExportedDocument[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const documents: ExportedDocument[] = JSON.parse(localStorage.getItem('userDocuments') || '[]');
    let filtered = documents.filter(d => d.userId === userId);
    
    if (planId) {
      filtered = filtered.filter(d => d.planId === planId);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime()
    );
  } catch (error) {
    console.error('Error loading exported documents:', error);
    return [];
  }
}

/**
 * Mark document as email sent
 */
export function markDocumentEmailSent(documentId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const documents: ExportedDocument[] = JSON.parse(localStorage.getItem('userDocuments') || '[]');
    const document = documents.find(d => d.id === documentId);
    if (document) {
      document.status = 'email_sent';
      localStorage.setItem('userDocuments', JSON.stringify(documents));
    }
  } catch (error) {
    console.error('Error marking document email sent:', error);
  }
}

/**
 * Mark document as downloaded
 */
export function markDocumentDownloaded(documentId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const documents: ExportedDocument[] = JSON.parse(localStorage.getItem('userDocuments') || '[]');
    const document = documents.find(d => d.id === documentId);
    if (document) {
      document.status = 'downloaded';
      localStorage.setItem('userDocuments', JSON.stringify(documents));
    }
  } catch (error) {
    console.error('Error marking document downloaded:', error);
  }
}

// ============================================================================
// PAYMENT STORE - Track payment status for plans
// ============================================================================

export interface PaymentRecord {
  id: string;
  userId: string;
  planId?: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  items: string; // JSON string
  createdAt: string;
  completedAt?: string;
}

/**
 * Save payment record to localStorage
 */
export function savePaymentRecord(payment: PaymentRecord): void {
  if (typeof window === 'undefined') return;
  
  try {
    const payments: PaymentRecord[] = JSON.parse(localStorage.getItem('userPayments') || '[]');
    
    // Update existing or add new
    const existingIndex = payments.findIndex(p => p.id === payment.id);
    if (existingIndex >= 0) {
      payments[existingIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    localStorage.setItem('userPayments', JSON.stringify(payments));
    
    // If payment is completed and has planId, mark plan as paid
    if (payment.status === 'completed' && payment.planId) {
      markPlanAsPaid(payment.planId, payment.userId);
    }
  } catch (error) {
    console.error('Error saving payment record:', error);
  }
}

/**
 * Get payment records for a user
 */
export function getUserPayments(userId: string): PaymentRecord[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const payments: PaymentRecord[] = JSON.parse(localStorage.getItem('userPayments') || '[]');
    return payments.filter(p => p.userId === userId);
  } catch (error) {
    console.error('Error loading payment records:', error);
    return [];
  }
}

/**
 * Get payment record by ID
 */
export function getPaymentRecord(paymentId: string): PaymentRecord | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const payments: PaymentRecord[] = JSON.parse(localStorage.getItem('userPayments') || '[]');
    return payments.find(p => p.id === paymentId) || null;
  } catch (error) {
    console.error('Error loading payment record:', error);
    return null;
  }
}

/**
 * Check if a plan is paid
 */
export function isPlanPaid(planId: string, userId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const payments: PaymentRecord[] = JSON.parse(localStorage.getItem('userPayments') || '[]');
    return payments.some(p => 
      p.planId === planId && 
      p.userId === userId && 
      p.status === 'completed'
    );
  } catch (error) {
    console.error('Error checking plan payment status:', error);
    return false;
  }
}

/**
 * Mark plan as paid in userPlans
 */
function markPlanAsPaid(planId: string, userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const plans: DashboardPlan[] = JSON.parse(localStorage.getItem('userPlans') || '[]');
    const planIndex = plans.findIndex(p => p.id === planId && p.userId === userId);
    
    if (planIndex >= 0) {
      plans[planIndex] = {
        ...plans[planIndex],
        ...(plans[planIndex] as any),
        isPaid: true,
        paidAt: new Date().toISOString()
      };
      localStorage.setItem('userPlans', JSON.stringify(plans));
    }
  } catch (error) {
    console.error('Error marking plan as paid:', error);
  }
}

/**
 * Get payment status for a plan
 */
export function getPlanPaymentStatus(planId: string, userId: string): {
  isPaid: boolean;
  paymentId?: string;
  amount?: number;
  currency?: string;
  paidAt?: string;
} {
  if (typeof window === 'undefined') {
    return { isPaid: false };
  }
  
  try {
    const payments: PaymentRecord[] = JSON.parse(localStorage.getItem('userPayments') || '[]');
    const payment = payments.find(p => 
      p.planId === planId && 
      p.userId === userId && 
      p.status === 'completed'
    );
    
    if (payment) {
      return {
        isPaid: true,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.completedAt || payment.createdAt
      };
    }
    
    return { isPaid: false };
  } catch (error) {
    console.error('Error getting plan payment status:', error);
    return { isPaid: false };
  }
}

// ============================================================================
// MULTI-USER STORE - Client management for advisors
// ============================================================================

export type Client = { id: string; name: string };
export type Plan = { id: string; clientId?: string };

class MultiUserDataManager {
  private static instance: MultiUserDataManager;
  private constructor() {}
  static getInstance() {
    if (!this.instance) this.instance = new MultiUserDataManager();
    return this.instance;
  }
  listClients(): Client[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('pf_clients') || '[]'); } catch { return []; }
  }
  saveClient(client: Client) {
    if (typeof window === 'undefined') return;
    const all = this.listClients();
    const idx = all.findIndex(c => c.id === client.id);
    if (idx >= 0) all[idx] = client; else all.push(client);
    localStorage.setItem('pf_clients', JSON.stringify(all));
  }
  assignPlanToClient(plan: Plan, clientId: string) {
    if (typeof window === 'undefined') return;
    try {
      const plans: any[] = JSON.parse(localStorage.getItem('userPlans') || '[]');
      const idx = plans.findIndex(p => p.id === plan.id);
      if (idx >= 0) plans[idx].clientId = clientId;
      localStorage.setItem('userPlans', JSON.stringify(plans));
    } catch {}
  }
}

export const multiUserDataManager = MultiUserDataManager.getInstance();



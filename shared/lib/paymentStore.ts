// Payment Store - Track payment status for plans
import { DashboardPlan } from './planStore';

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
        // Add payment status to plan metadata (extend type if needed)
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


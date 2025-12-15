// LocalStorage-backed helpers for storing plan- and program-related selections.
// This mirrors the shape expected by dashboard, payments, and dev tools.

export interface SelectedProgram {
  id: string;
  name: string;
  amountRange?: string | null;
}

const SELECTED_PROGRAM_KEY = 'selectedProgram';

export function getSelectedProgram(): SelectedProgram | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SELECTED_PROGRAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SelectedProgram;
  } catch {
    return null;
  }
}

export function setSelectedProgram(program: SelectedProgram | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!program) {
      window.localStorage.removeItem(SELECTED_PROGRAM_KEY);
      return;
    }
    window.localStorage.setItem(SELECTED_PROGRAM_KEY, JSON.stringify(program));
  } catch {
    // ignore storage failures
  }
}

export function clearSelectedProgram(): void {
  setSelectedProgram(null);
}

// Simple multi-client data manager used by the dashboard/client manager.
export interface ClientSummary {
  id: string;
  name: string;
}

const CLIENTS_KEY = 'pf_clients';

function readClients(): ClientSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CLIENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ClientSummary[];
  } catch {
    return [];
  }
}

function writeClients(clients: ClientSummary[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch {
    // ignore storage failures
  }
}

export const multiUserDataManager = {
  listClients(): ClientSummary[] {
    return readClients();
  },
  saveClient(client: ClientSummary): void {
    const existing = readClients();
    const updated = [...existing.filter((c) => c.id !== client.id), client];
    writeClients(updated);
  },
};

// ---------------------------------------------------------------------------
// Payments and documents – localStorage-backed helpers used by dashboard
// ---------------------------------------------------------------------------

export interface PaymentRecord {
  id: string;
  userId: string;
  planId?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
}

export interface ExportedDocument {
  id: string;
  userId: string;
  name: string;
  format: string;
  type: 'plan' | 'additional' | 'add_on';
  exportedAt: string;
  status?: 'ready' | 'email_sent' | 'downloaded';
  downloadUrl?: string;
}

const PAYMENTS_KEY = 'pf_payments';
const DOCUMENTS_KEY = 'pf_documents';

function readPayments(): PaymentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PaymentRecord[];
  } catch {
    return [];
  }
}

function readDocuments(): ExportedDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExportedDocument[];
  } catch {
    return [];
  }
}

export function getUserPayments(userId: string): PaymentRecord[] {
  if (!userId) return [];
  return readPayments().filter((p) => p.userId === userId);
}

export function getPlanPaymentStatus(
  planId: string,
  userId: string
): { isPaid: boolean; paidAt?: string } {
  if (!planId || !userId) return { isPaid: false };

  const payment = readPayments().find(
    (p) => p.userId === userId && p.planId === planId && p.status === 'completed'
  );

  if (!payment) return { isPaid: false };

  return {
    isPaid: true,
    paidAt: payment.completedAt ?? payment.createdAt,
  };
}

export function getUserDocuments(userId: string): ExportedDocument[] {
  if (!userId) return [];
  return readDocuments().filter((d) => d.userId === userId);
}


// Document Store - Track exported documents for users
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


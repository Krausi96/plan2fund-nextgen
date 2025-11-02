/**
 * Payload handling for editor routing and data hydration
 * Handles pf= parameter decoding and answer hydration
 */

export interface PayloadData {
  answers_v1: Record<string, any>;
  fundingMode: string;
  top3: any[];
  trace: any[];
  program?: any;
  timestamp?: string;
}

export interface DocumentState {
  answers_v1: Record<string, any>;
  fundingMode: string;
  top3: any[];
  trace: any[];
  program?: any;
  content?: string;
  metadata?: Record<string, any>;
}

/**
 * Decode payload from URL parameter
 */
export function decodePayload(pfParam: string): PayloadData | null {
  try {
    const decoded = decodeURIComponent(pfParam);
    const payload = JSON.parse(decoded);
    
    // Validate required fields
    if (!payload.answers_v1 || !payload.fundingMode || !payload.top3) {
      console.warn('Invalid payload: missing required fields');
      return null;
    }
    
    return {
      answers_v1: payload.answers_v1,
      fundingMode: payload.fundingMode,
      top3: payload.top3,
      trace: payload.trace || [],
      program: payload.program,
      timestamp: payload.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to decode payload:', error);
    return null;
  }
}

/**
 * Encode payload for URL parameter
 */
export function encodePayload(payload: PayloadData): string {
  try {
    const encoded = JSON.stringify(payload);
    return encodeURIComponent(encoded);
  } catch (error) {
    console.error('Failed to encode payload:', error);
    return '';
  }
}

/**
 * Hydrate document state from payload
 */
export function hydrateDocumentState(payload: PayloadData): DocumentState {
  return {
    answers_v1: payload.answers_v1,
    fundingMode: payload.fundingMode,
    top3: payload.top3,
    trace: payload.trace,
    program: payload.program,
    content: '',
    metadata: {
      createdAt: payload.timestamp,
      source: 'reco_flow'
    }
  };
}

/**
 * Validate payload structure
 */
export function validatePayload(payload: any): payload is PayloadData {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.answers_v1 === 'object' &&
    typeof payload.fundingMode === 'string' &&
    Array.isArray(payload.top3)
  );
}

/**
 * Create payload from user answers and program data
 */
export function createPayload(
  answers: Record<string, any>,
  fundingMode: string,
  top3: any[],
  program?: any,
  trace: any[] = []
): PayloadData {
  return {
    answers_v1: answers,
    fundingMode,
    top3,
    trace,
    program,
    timestamp: new Date().toISOString()
  };
}

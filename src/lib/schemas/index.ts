// Lightweight “schema” validators without external deps

export type ProgramInput = {
  id: string
  title?: string
  name?: string
  authority?: string
  country?: string
  tags?: string[]
  eligibility?: string[] | { rules?: string[] }
  effort?: number
  docs_required?: string[]
  weights?: { fit?: number; readiness?: number; effort?: number; confidence?: number }
}

export type SignalsInput = Record<string, any>
export type AnswersInput = Record<string, any>

export function programSchemaParse(p: any): ProgramInput | null {
  if (!p || typeof p !== "object") return null
  if (typeof p.id !== "string" || p.id.length === 0) return null
  if (p.tags && !Array.isArray(p.tags)) return null
  if (p.eligibility && !Array.isArray(p.eligibility) && !Array.isArray(p.eligibility?.rules || [])) return null
  if (p.effort !== undefined && (typeof p.effort !== "number" || p.effort < 1 || p.effort > 5)) return null
  if (p.docs_required && !Array.isArray(p.docs_required)) return null
  if (p.weights) {
    const w = p.weights
    const ok = ["fit", "readiness", "effort", "confidence"].every((k) => typeof w[k] === "number")
    if (!ok) return null
  }
  return p as ProgramInput
}

export function signalsSchemaParse(s: any): SignalsInput {
  if (!s || typeof s !== "object") return {}
  return s as SignalsInput
}

export function answersSchemaParse(a: any): AnswersInput {
  if (!a || typeof a !== "object") return {}
  return a as AnswersInput
}

// Consolidated from src/types.ts
export type UserAnswers = Record<string, any>;




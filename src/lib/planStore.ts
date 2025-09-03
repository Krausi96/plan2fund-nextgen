export type PlanSection = { id: string; title: string; content: string }
type Stored = { v: number; sections: PlanSection[] }

function getSessionId(): string {
  if (typeof document === "undefined") return "anon"
  const match = document.cookie.split(";").find((c) => c.trim().startsWith("pf_session="))
  return match ? match.split("=")[1] : "anon"
}

export function loadPlanSections(): PlanSection[] {
  try {
    const key = `plan_sections_${getSessionId()}`
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

let debounceTimer: any
export function savePlanSections(sections: PlanSection[]) {
  try {
    const key = `plan_sections_${getSessionId()}`
    const payload: Stored = { v: 1, sections }
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(payload))
    }, 300)
  } catch {}
}



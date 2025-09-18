// Import removed - will load data dynamically
import { programSchemaParse, signalsSchemaParse, answersSchemaParse } from "@/lib/schemas"

type Signals = Record<string, any>
type Answers = Record<string, any>

type ScoreBreakdown = {
  fit: number
  readiness: number
  effort: number
  confidence: number
}

export async function scorePrograms({
  signals,
  answers,
  programs,
}: {
  signals?: Signals
  answers?: Answers
  programs?: any[]
}): Promise<Array<{ id: string; scores: ScoreBreakdown; why: string[]; eligibility: string; confidence: "High" | "Medium" | "Low" }>> {
  let source: any[] = [];
  
  if (programs) {
    source = programs;
  } else {
    try {
      const response = await fetch('/programs.json');
      const data = await response.json();
      source = data.programs || [];
    } catch (error) {
      console.error('Error loading programs for scoring:', error);
      return [];
    }
  }
  const safeSignals = signalsSchemaParse(signals)
  const safeAnswers = answersSchemaParse(answers)

  const mapped = (source.map((raw) => {
    if (!raw || typeof raw !== 'object') {
      console.warn("Invalid program entry skipped - not an object", raw);
      return null;
    }
    
    const p = programSchemaParse(raw)
    if (!p) {
      try { console.warn("Invalid program entry skipped", raw?.id || "<no-id>") } catch {}
      return null
    }
    const weights = p.weights || { fit: 0.4, readiness: 0.3, effort: 0.2, confidence: 0.1 }
    const rules: string[] = Array.isArray(p.eligibility) ? p.eligibility : (p.eligibility?.rules || [])
    const ruleGroups = (p as any).rule_groups || []

    const why: string[] = []
    let hardRuleFailures = 0
    let softRuleMatches = 0

    // Apply HARD rules as filters
    for (const group of ruleGroups) {
      if (group.type === "HARD") {
        for (const rule of group.rules || []) {
          const r = rule.toLowerCase()
          const text = JSON.stringify({ signals: safeSignals, answers: safeAnswers }).toLowerCase()
          let matches = false
          
          if (r.includes("country:") && text.includes(r.split(":")[1])) matches = true
          if (r.includes("stage:") && text.includes(r.split(":")[1])) matches = true
          if (r.includes("trl>=") && text.includes("trl")) matches = true
          if (r.includes("age<") && text.includes("startup")) matches = true
          if (r.includes("sector:") && text.includes(r.split(":")[1])) matches = true
          
          if (!matches) {
            hardRuleFailures++
            why.push(`Hard rule failed: ${rule}`)
          }
        }
      } else if (group.type === "SOFT") {
        for (const rule of group.rules || []) {
          const r = rule.toLowerCase()
          const text = JSON.stringify({ signals: safeSignals, answers: safeAnswers }).toLowerCase()
          
          if (r.includes("sector:") && text.includes(r.split(":")[1])) {
            softRuleMatches++
            why.push(`Soft match: ${rule}`)
          }
          if (r.includes("size:") && text.includes(r.split(":")[1])) {
            softRuleMatches++
            why.push(`Soft match: ${rule}`)
          }
        }
      }
    }

    // Legacy rule matching for backward compatibility
    for (const rule of rules) {
      const r = rule.toLowerCase()
      const text = JSON.stringify({ signals: safeSignals, answers: safeAnswers }).toLowerCase()
      if (text.includes("vienna") && r.includes("vienna")) { softRuleMatches += 1; why.push("Matches location: Vienna") }
      if (text.includes("austria") && r.includes("at")) { softRuleMatches += 1; why.push("Eligible country: AT") }
      if (text.includes("startup") && r.includes("< 3 years")) { softRuleMatches += 1; why.push("Startup age under 3 years") }
      if (text.includes("grant") && r.includes("grant")) { softRuleMatches += 1; why.push("Grant purpose aligns") }
      if (text.includes("loan") && r.includes("loan")) { softRuleMatches += 1; why.push("Loan purpose aligns") }
      if (text.includes("prototype") && r.includes("trl")) { softRuleMatches += 1; why.push("TRL requirement suggested by prototype") }
    }

    // Fit: based on soft rule matches
    const fit = Math.min(100, Math.round((softRuleMatches / Math.max(1, rules.length + softRuleMatches)) * 100))

    // Readiness: fewer missing required docs => higher readiness, penalize skipped questions
    const docs: string[] = p.docs_required || []
    const providedDocs = 0 // no actual uploads yet
    const skippedQuestions = Object.keys(safeAnswers).filter(k => safeAnswers[k] === null).length
    const readiness = docs.length === 0 ? 60 : Math.round(((providedDocs + 1) / (docs.length + 1)) * 100) - (skippedQuestions * 5)

    // Effort: invert the program "effort" (1 easier, 5 harder)
    const effortScore = p.effort ? Math.max(0, 100 - (p.effort - 1) * 20) : 60

    // Confidence: blend of fit + rule density, penalize hard rule failures
    const confidence = Math.round((fit * 0.7) + (rules.length > 3 ? 20 : 10) - (hardRuleFailures * 10))

    // Eligibility: based on hard rule failures
    const eligibility = hardRuleFailures === 0 ? "Eligible" : "Not eligible"

    // Confidence level: High/Medium/Low
    const confidenceLevel = confidence >= 70 ? "High" : confidence >= 40 ? "Medium" : "Low"

    const weighted = Math.round(
      fit * (weights.fit ?? 0.4) +
      readiness * (weights.readiness ?? 0.3) +
      effortScore * (weights.effort ?? 0.2) +
      confidence * (weights.confidence ?? 0.1)
    )

    why.push(`Weighted score=${weighted} (fit=${fit}, readiness=${readiness}, effort=${effortScore}, confidence=${confidence})`)

    return {
      id: p.id,
      scores: { fit, readiness, effort: effortScore, confidence },
      why,
      eligibility,
      confidence: confidenceLevel as "High" | "Medium" | "Low",
      title: p.title || p.name || p.id,
    }
  }) as Array<any>)
  .filter(Boolean)
  .sort((a: any, b: any) => {
    // Stable sort by composite then tie-break by title asc
    const aComp = a.scores.fit + a.scores.readiness + a.scores.effort + a.scores.confidence
    const bComp = b.scores.fit + b.scores.readiness + b.scores.effort + b.scores.confidence
    if (bComp !== aComp) return bComp - aComp
    return String(a.title).localeCompare(String(b.title))
  })
  return mapped.map((m: any) => ({ id: m.id, scores: m.scores, why: m.why, eligibility: m.eligibility, confidence: m.confidence }))
}



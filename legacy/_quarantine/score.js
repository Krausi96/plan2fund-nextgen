const path = require("path")
const programs = require(path.join(__dirname, "../../data/programs.json"))

// Minimal inline scorer copy to avoid build step
function scoreProgramsInline({ signals = {}, answers = {}, programs = [] }) {
  const items = programs.map((p) => {
    const weights = p.weights || { fit: 0.4, readiness: 0.3, effort: 0.2, confidence: 0.1 }
    const rules = (p.eligibility && p.eligibility.rules) || []
    const text = JSON.stringify({ signals, answers }).toLowerCase()
    let fitRaw = 0
    const why = []
    rules.forEach((r0) => {
      const r = String(r0).toLowerCase()
      if (text.includes("vienna") && r.includes("vienna")) { fitRaw++; why.push("Matches location: Vienna") }
      if (text.includes("austria") && r.includes("at")) { fitRaw++; why.push("Eligible country: AT") }
      if (text.includes("startup") && r.includes("< 3 years")) { fitRaw++; why.push("Startup age under 3 years") }
      if (text.includes("grant") && r.includes("grant")) { fitRaw++; why.push("Grant purpose aligns") }
      if (text.includes("loan") && r.includes("loan")) { fitRaw++; why.push("Loan purpose aligns") }
      if (text.includes("prototype") && r.includes("trl")) { fitRaw++; why.push("TRL requirement suggested by prototype") }
    })
    const fit = Math.min(100, Math.round((fitRaw / Math.max(1, rules.length)) * 100))
    const docs = p.docs_required || []
    const readiness = docs.length === 0 ? 60 : Math.round((1 / (docs.length + 1)) * 100)
    const effortScore = p.effort ? Math.max(0, 100 - (p.effort - 1) * 20) : 60
    const confidence = Math.round((fit * 0.7) + (rules.length > 3 ? 20 : 10))
    const composite = Math.round(
      fit * (weights.fit ?? 0.4) +
      readiness * (weights.readiness ?? 0.3) +
      effortScore * (weights.effort ?? 0.2) +
      confidence * (weights.confidence ?? 0.1)
    )
    return { id: p.id, title: p.title || p.name || p.id, composite }
  })
  return items.sort((a, b) => (b.composite - a.composite) || String(a.title).localeCompare(String(b.title)))
}

const fixtures = [
  { signals: { country: "AT", purpose: "grant", city: "Vienna" }, answers: { stage: "Startup" } },
  { signals: { country: "EU", purpose: "grant" }, answers: { sector: "Technology" } },
]

fixtures.forEach((fx, idx) => {
  const scored = scoreProgramsInline({ signals: fx.signals, answers: fx.answers, programs })
  const top3 = scored.slice(0, 3).map((s) => s.id)
  console.log(`#${idx + 1}`, top3.join(","))
})



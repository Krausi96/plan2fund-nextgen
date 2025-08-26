# 🚀 Plan2Fund NextGen → Developer Guide (Updated)

This guide tracks **progress, pending tasks, and known issues** so development stays consistent across sessions.

---

## ✅ Completed

* `MASTER_PROMPT.md` created → defines repo rules and workflow.
* `User_journey.md` updated (V12) → synced with PDF, includes Benchmark Compliance.
* Landing Page (Step 1) implemented with all blocks, animations, compliance sections.

---

## 📦 Pending Work Packages

### Step 2: Funding Recommendation Engine (3a)

1. **Dynamic NavBar** → must progress indicator (past/active/future).
2. **Persona-driven UI logic**:
   - **Frustrated Persona**: bulk upload option (PDF, Word, text) → system auto-fills defaults.
   - **Newbie Persona**: guided wizard with hints, tooltips, explanations.
   - **Expert Persona**: direct form fields, minimal hints, expert shortcuts.
   - **Idea-stage Persona**: scaffolding prompts to gradually build a model.
3. **Funding Results Output**:
   - Top 5 programs ranked (card layout like Stripe pricing).
   - Each card shows **score, reason, eligibility badge**.
   - Manual “Exploration Mode” → user can add missing program manually.
4. **Readiness Meter**:
   - Checklist + traffic-light (green/orange/red).
   - Inline validation for form inputs.
5. **Trust Section**:
   - Compliance badges (GDPR, EU, Funding Logos).
   - Testimonials placeholder.
6. **Animations**:
   - Section fade-up on scroll (framer-motion).
   - Subtle hover scaling for program cards.

---

## 🔑 Known Issues

* Reference repo (`plan2fund-webapp`) had partial persona handling → must be fully mapped in NextGen.
* NavBar currently static on Landing → dynamic state integration pending.
* Checkout flow not mobile-optimized.

---

## 📝 Notes for Developers

* Always cross-check with **User_journey.md** before coding.
* Implement in **small work packages (1–2 steps max)**.
* Always run `npm run build` locally before committing.
* Push commits via PowerShell with clear messages.
* If tokens run high → restart GPT session with `MASTER_PROMPT.md`.

---

## 📂 Repo Paths

* Active repo: `plan2fund-nextgen`
* Reference repo: `plan2fund-webapp`
* Docs folder: `plan2fund-nextgen/docs/`

This guide must be updated **after each package** to keep continuity flawless.

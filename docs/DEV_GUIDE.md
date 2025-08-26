# 🛠️ Plan2Fund NextGen – Developer Guide

This guide tracks **progress, pending tasks, and known issues** so development stays consistent across sessions.

---

## ✅ Completed

* `MASTER_PROMPT.md` created – defines repo rules and workflow.
* `User_journey.md` updated (V12) – synced with PDF, includes Benchmark Compliance.

---

## 🚧 Pending Work Packages

1. **Dynamic NavBar** – progress indicators (past/active/future).
2. **Persona-driven UI logic** – conditional tooltips, defaults, expert shortcuts.
3. **Funding Readiness Meter** – checklist + traffic light system.
4. **Pricing Toggle** – Revolut-style Standard vs. Priority.
5. **Fallback Handling** – manual program add, offline mode, retry uploads.
6. **Mobile-first Checkout** – one-column layout, Apple Pay/Google Pay.
7. **Trust UI patterns** – badges, testimonials, compliance stamps on Pricing + Checkout.
8. **Inline Validation** – real-time error handling in forms.
9. **After-Sales Upsell** – revision requests + coaching upsell.
10. **Animation Mapping** – define animations per step.

---

## 🐞 Known Issues

* Current repo (`plan2fund-webapp`) has partial persona handling but not mapped clearly.
* NavBar is static – must be redesigned for dynamic progress.
* Inconsistent animation usage – motion.css exists but lacks system mapping.
* Checkout flow not mobile-optimized.

---

## 📋 Notes for Developers

* Always cross-check with **User\_journey.md** before coding.
* Use **small work packages** (1–2 steps at a time).
* Always run `npm run build` locally before committing.
* Push changes via GitHub with clear sequential commits.
* If tokens run high → restart GPT session with **MASTER\_PROMPT.md**.

---

## 🔄 Repo Paths

* Active repo: `plan2fund-nextgen`
* Reference repo: `plan2fund-webapp`
* Docs folder: `plan2fund-nextgen/docs/`

This guide must be updated **after each package** to keep continuity flawless.

# 🤖 Agent Loop — Execution & Update Cycle

**Core rule:** Work from the **repo**. Do not request extra instructions from chat unless a secret or external approval is required.

## 0) Pre-flight (once per session)
- Confirm access: GitHub (repo read/write), Vercel (env), Supabase (URL/keys), Stripe (test), Resend (domain), optional LLM.
- Read **[docs/tech/README.md](../tech/README.md)** and **[docs/product/README.md](../product/README.md)**.
- Verify \.env\ via \.env.local\ or Vercel env (mirror of \.env.example\).

## 1) Sync
- \git pull --rebase\
- Scan **BACKLOG.md** and **CHANGELOG.md**. Update your plan in a new branch if needed.

## 2) Build Steps (MVP scope)
- **Reco (3a)** — Survey + Canva-like Free-Text Intake → Signals + EduPanel → \eco_*\, \intake_submissions\
- **Plan (3b)** — Canva-like Intake → chapter skeletons → Editor autosave/snapshots → Preview metrics
- **Platform** — Cookie middleware (\pf_session\), Supabase migrations + RLS, Stripe Checkout (flag), Export (flag), Resend emails

## 3) Flags & Compliance
- Feature flags: \CHECKOUT_ENABLED\, \EXPORT_ENABLED\, \AI_ENABLED\ (keep false in production until legal OK).
- GDPR: pseudonymous \pf_session\, no PII before checkout, DSR via support email, no trackers.

## 4) CI/CD
- Commit in small, testable slices. Keep \main\ deployable.
- If Vercel build fails: read logs, fix, re-commit, re-deploy.

## 5) Update Loop
- After each change set:
  - Update **CHANGELOG.md** (what/why/how to verify).
  - Update **BACKLOG.md** (move Done → link to PR/commit; add next TODOs).
  - Keep docs as the **single source of truth**.

## 6) Acceptance (MVP)
- Reco: ≤8 Qs, reasons + unmet reqs, Canva-like Intake + Signals + EduPanel
- Plan: Intake → editable chapters, autosave + snapshots, calculators, preview metrics
- Pricing/Checkout/Export behind flags; GDPR-safe; confirmation email on paid
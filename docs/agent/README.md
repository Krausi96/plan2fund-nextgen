# Agent Instructions

## Operating Loop
1. Read docs sequentially (README ? product ? tech ? legal ? BACKLOG ? sql/migrations).
2. Plan a small slice of work.
3. Apply changes as PowerShell commits (git add/commit/push).
4. Watch Vercel build logs, fix errors until green.
5. Update docs/CHANGELOG.md and docs/BACKLOG.md after each slice.

## Acceptance Criteria
- **Reco**: =8 questions, Canva-style free-text intake, output = ranked programs + reasons + unmet reqs.
- **Plan**: Intake ? editable chapter skeletons, autosave snapshots every 5s.
- **Stripe**: Checkout flow with webhook at /pages/api/stripe/webhook.ts.
- **Resend**: Send thank-you email on successful paid checkout.
- **RLS**: All tables (intake_submissions, eco_signals, plan_documents, plan_versions) isolated by x-pf-session.
- **Flags respected**: NEXT_PUBLIC_AI_ENABLED, NEXT_PUBLIC_CHECKOUT_ENABLED, NEXT_PUBLIC_EXPORT_ENABLED.
- **GDPR baseline**: Data map + cookie banner.

## Smoke Tests
- /api/recommend/free-text ? returns signals JSON.
- /api/recommend ? returns ranked programs + persists submission.
- /api/intake/plan ? creates doc + autosaves versions.
- Stripe webhook receives checkout.session.completed.
- Resend test email sent.
- Verify rows are isolated per session_id.
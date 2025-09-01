# 🧩 Tech — Architecture & Operations

## Short Data Path
Client sets \pf_session\ cookie → UI writes/reads in Supabase (RLS by \session_id\).  
Reco has Survey + Free-Text Intake; Plan has Intake → chapter drafts → Editor; Pricing → Checkout → Export.

## APIs (pages-router)
- \/pages/api/recommend.ts\ — survey pipeline
- \/pages/api/recommend/free-text.ts\ — Canva-like intake → signals extraction
- \/pages/api/intake/plan.ts\ — plan intake → chapter skeleton JSON
- \/pages/api/stripe/webhook.ts\ — finalize payments
- \/lib/email.ts\ — Resend helpers

## Environment
See \.env.example\. Mirror values in Vercel:
- \NEXT_PUBLIC_SITE_URL\, \NEXT_PUBLIC_SUPABASE_URL\, \NEXT_PUBLIC_SUPABASE_ANON_KEY\
- \NEXT_PUBLIC_CHECKOUT_ENABLED\, \NEXT_PUBLIC_EXPORT_ENABLED\, \NEXT_PUBLIC_AI_ENABLED\
- \STRIPE_SECRET_KEY\, \NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\, \STRIPE_WEBHOOK_SECRET\
- \RESEND_API_KEY\, \RESEND_FROM\, \SESSION_COOKIE_NAME=pf_session\
- Optional LLM: \LLM_PROVIDER\, \OPENAI_API_KEY\ or Azure/Vertex equivalents

## LLM (behind \AI_ENABLED\)
- EU region only; no streaming; prompts in \/data/intake/prompts/*.md\
- Heuristics fallback when disabled (regex for € amounts, durations, country, team size; TRL/topic tags mapping)

## Storage
- Supabase Storage bucket \exports\ (signed URLs only)

## RLS Strategy (no sign-in at MVP)
- All app tables include \session_id text\.
- RLS compares \session_id\ to header \x-pf-session\ (client supplies it via Supabase global headers).
- Optional: if using custom JWT, compare to claim \pf_session\.

## Deployment
- Vercel (Node 18+), \pnpm build\.
- Keep \main\ deployable; feature-flag risky surfaces (Checkout/Export/AI).

## Logging
- \journey_events\ for page milestones
- Minimal server logs in API routes; no 3rd-party trackers at MVP
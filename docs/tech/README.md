# Tech Overview

## Framework
- **Next.js (Pages Router)**
- API routes under /pages/api/*
- Middleware: /middleware.ts creates pf_session cookie
- Deployment: Vercel auto-deploy on push to main

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- RESEND_FROM
- NEXT_PUBLIC_CHECKOUT_ENABLED
- NEXT_PUBLIC_EXPORT_ENABLED
- NEXT_PUBLIC_AI_ENABLED
- SESSION_COOKIE_NAME=pf_session

## Database
- Supabase with RLS (x-pf-session)
- Tables: intake_submissions, reco_signals, plan_documents, plan_versions

## Notes
- All previous Vite references removed.  
- Env variables must use NEXT_PUBLIC_* for client-side use.  
# 🛠 Tech Stack & Architektur

## Stack
- Next.js 14 (Pages Router)
- Supabase (DB + Auth später)
- Stripe (Checkout)
- Resend (Emails)
- Vercel (Deploy)

## Datenfluss
User → Reco-Wizard (/pages/reco.tsx) → Save Answers (Supabase)  
→ Plan Generator (/pages/plan.tsx) → Preview → Checkout → AfterSales

## Feature Flags
- CHECKOUT_ENABLED
- EXPORT_ENABLED
- TURNSTILE_ENABLED

## .env Beispiel
SUPABASE_URL=your-url  
SUPABASE_KEY=your-key  
STRIPE_SECRET_KEY=your-key  
RESEND_FROM=noreply@yourdomain.dev  
SESSION_COOKIE_NAME=pf_session  

## API Endpoints
- /api/reco – RecoEngine  
- /api/plan – Plan Generator  

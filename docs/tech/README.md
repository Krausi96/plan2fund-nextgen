# 🛠 Tech Stack & Architektur

## Stack
- Next.js 14 (Pages Router)
- Supabase (DB, Auth später)
- Stripe (Checkout, Pricing)
- Resend (Email Versand)
- Vercel (CI/CD Deployment)
- Optional: Mistral LLM

## Datenfluss
User → Reco-Wizard (/pages/reco.tsx) → Save Answers (Supabase)  
→ Plan Generator (/pages/plan.tsx) → Preview → Checkout → AfterSales

## Feature Flags
- NEXT_PUBLIC_CHECKOUT_ENABLED
- NEXT_PUBLIC_EXPORT_ENABLED
- NEXT_PUBLIC_AI_ENABLED
- CHECKOUT_ENABLED

## Environment Variables

| Variable                          | Zweck / Quelle                               |
|-----------------------------------|----------------------------------------------|
| NEXT_PUBLIC_SITE_URL              | Basis-URL der App                            |
| NEXT_PUBLIC_SUPABASE_URL          | Supabase → Project Settings → API            |
| NEXT_PUBLIC_SUPABASE_ANON_KEY     | Supabase Public Anon Key                     |
| SUPABASE_SERVICE_ROLE_KEY         | Supabase Service Role Key (Server only)      |
| STRIPE_SECRET_KEY                 | Stripe Secret Key                            |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY| Stripe Publishable Key                       |
| STRIPE_WEBHOOK_SECRET             | Stripe Webhook Endpoint Secret               |
| STRIPE_PRICE_*                    | Preis IDs aus Stripe → Products              |
| RESEND_API_KEY                    | Resend API Key                               |
| RESEND_FROM                       | Verifizierter Sender (Resend)                |
| SESSION_COOKIE_NAME               | Session Management                           |
| LLM_PROVIDER / MISTRAL_*          | Optional LLM Keys                            |
| VERCEL_*                          | Vercel Deploy Config                         |
| GH_PAT                            | GitHub PAT für CI/Agent                      |

👉 Echte .env bleibt **lokal** oder im Vercel Dashboard.  
👉 .env.example dient als Vorlage im Repo.

## CI/CD & Deploy Checklist
- [ ] .env lokal gepflegt (niemals committen)
- [ ] .env.example aktuell (alle benötigten Variablen als Platzhalter)
- [ ] Vercel Project → **Environment Variables** gesetzt (Production/Preview/Development)
- [ ] 
pm run build lokal grün
- [ ] Push auf main → Vercel Deploy prüft Logs
- [ ] Feature Flags gesetzt (NEXT_PUBLIC_* & CHECKOUT_ENABLED) passend zum Stage


**Hinweis:** Alle benötigten Variablen sind in .env.example beschrieben; echte Werte nur lokal oder in Vercel setzen.


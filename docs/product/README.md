# 🧭 User Journey (Business → Data)

**Stack:** Next.js 14 (pages-router) · Tailwind · Supabase · Stripe · Resend  
**Lang:** EN / DE · **Auth:** none at MVP (pseudonymous \pf_session\)

## Flow
- **Landing (/)** → value prop + Choose Path → create \pf_session\ if missing → \journey_events('landing_view')\
- **Reco (/reco)**
  - **Survey**: information-gain Qs from program requirements; skip allowed
  - **Free-Text Intake (Canva-like)**: user brief; sidebar **Signals** (extracted fields); **EduPanel** hints
  - Data: \eco_sessions\, \eco_answers\, \eco_results\; API: \/api/recommend\, \/api/recommend/free-text\
- **Plan (/plan)**
  - **Canva-like Intake** → draft chapter skeletons → **Chapter Editor** with autosave + snapshots
  - **CoachPanel** calculators (TAM/SAM/SOM, depreciation, ICP, responsibilities)
  - Data: \plan_documents\, \plan_versions\, \uploads\; API: \/api/intake/plan\
- **Preview (/preview)** → **Completeness** + **Complexity**; logs \journey_events('preview_view')\
- **Pricing (/pricing)** → draft \orders\ (\status='draft'\, \	ier\, \mount_cents\)
- **Checkout (/checkout)** *(flag)* → Stripe Checkout + webhook → \payments\, update \orders.status='paid'\
- **Export (/export)** *(flag)* → PDF/DOCX → Supabase Storage \exports\ → signed URLs
- **Thank You (/thank-you)** → Download links + Resend email

## Feature Flags
\CHECKOUT_ENABLED\=\alse\ · \EXPORT_ENABLED\=\alse\ · \AI_ENABLED\=\alse\

## Tables (Supabase)
profiles (reserved) · reco_sessions · reco_answers · reco_results · plan_documents · plan_versions · uploads · orders · payments · exports · journey_events · **intake_submissions**

## Components
Global: Header, Footer, LanguageSwitcher, ProgressBar  
Reco: WizardStep, ResultsList, ProgramDetailsDialog, **RecoIntake**, EduPanel, SignalsPanel  
Plan: PlanShell, EditorArea, Sidebar, **PlanIntake**, CoachPanel, AutosaveBadge  
Checkout: OrderSummary, PayButton (flag) · Export: ExportLocker, PreviewPane
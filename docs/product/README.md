# Product Specification

## Reco (Funding Recommendation Engine)
- Up to 8 structured questions (country, stage, amount, company form, sector, instrument preference, etc.).
- Canva-style free-text intake to extract signals.
- Output: Ranked funding programs with reasons + unmet requirements.
- Programs dataset: /data/programs.json.

## Plan (Business Plan Generator)
- Intake signals + free-text ? chapter skeletons.
- Chapters: Executive Summary, Problem, Solution, Market, Competition, Business Model, Go-To-Market, Operations, Team, Financials, Milestones & Risks.
- Autosave snapshots every 5s to plan_versions.

## Pricing / Checkout
- Free tier: Reco + draft Plan.
- Paid tier: Export features + thank-you email via Resend.
- Stripe Checkout used for one-time payments.

## Export
- Gated behind NEXT_PUBLIC_EXPORT_ENABLED.
- Formats: PDF, DOCX (future task).
# 🌍 Plan2Fund NextGen → User Journey (V13)

This is the **structured, developer-ready** version of the User Journey. Always cross-check with `User_journey.pdf`.

---

## 1. Overview

The user journey defines how different users interact with the Plan2Fund NextGen webapp. It describes each step, the expected behaviors, fallbacks, and requirements. Personas (Frustrated, Newbie, Expert, Idea-stage) are **lenses/requirements**, not content blocks, and must be respected in logic & UI.

---

## 2. Learnings

### Issues in Earlier Journey
- Too text-heavy, unclear UI mapping.
- Missing clear separation of blocks vs. pages.
- Ambiguity on personas → clarified now as functional requirements.
- Missing animations, trust-building, and global navigation patterns.

### Benchmark Adjustments (Stripe / Revolut / Apple)
- Atomic, reusable components.
- Progressive disclosure (simple first, advanced later).
- Meaningful animations (fade-up, subtle hover).
- Persona-driven CTAs.
- Trust stacking (compliance, testimonials, logos).
- Global nav consistency (sticky nav, breadcrumbs, footer).
- Mobile-first by design.

---

## 3. Global Rules

- **Navigation**: Sticky NavBar with progress state.
- **Inputs**: Mandatory at least one per section. Optional auto-fill + flagged.
- **Uploads**: Drag & drop zones, types: PDF, DOCX, XLSX.
- **Persistence**: Local auto-save, drafts.
- **Layout**: `Layout.tsx` wraps NavBar + Footer.
- **Footer**: Terms, Privacy, GDPR, Contact.
- **Trust**: Compliance badges + testimonials.
- **Animations**: Fade-up, tooltip slide, hover-lift.
- **Responsiveness**: Mobile-first NavBar collapse, vertical stack on small devices.
- **Accessibility**: WAI-ARIA compliant.

---

## 4. Step-by-Step Journey

### Step 1 → Landing / Choose Path
- Hero + Info section.
- CTAs: **Find Funding (3a)** or **Generate Plan (3b)**.
- Dynamic NavBar appears after scroll.
- Trust-building (logos, testimonials).
- Footer compliance links.

### Step 3a → Funding Recommendation Engine
- **Wizard flow** with 3 key questions (Sector, Location, Stage).
- 1 question at a time, next disabled until answered.
- Results: **Top 5 program cards** (score + reason + eligibility badge).
- Manual “Exploration Mode” to add program.
- CTA: Continue to Plan Generator.
- Education: short text explaining relevance.
- Components: `RecoPage.tsx`, `QuestionWizard.tsx`, `ProgramCard.tsx`.
- **Persona Logic**:
  - Frustrated → upload file, auto-fill answers.
  - Newbie → wizard with hints/tooltips.
  - Expert → advanced fields, skip wizard.
  - Idea-stage → scaffolding prompts.

### Step 3b → Plan Generator
- SideNav + Main Editor.
- Blocks: Vision, Market, Finance.
- Features: mandatory + optional inputs, file uploads, tooltips, “Mark Complete”.
- Personas affect UI (defaulting, hints, expert shortcuts).
- Components: `PlanPage.tsx`, `BlockEditor.tsx`, `TooltipSidebar.tsx`, `ChapterNav.tsx`.

### Step 4 → Funding Readiness
- Advisor-only.
- Checklist + traffic-light indicator (Green/Orange/Red).
- Components: `ReadinessPage.tsx`, `Checklist.tsx`, `Meter.tsx`.

### Step 5 → Preview + Pricing
- Doc viewer + completeness meter.
- Auto-flagged as “auto-generated”.
- Uploaded files shown.
- Pricing block with add-ons.
- CTA: Checkout.
- Components: `PreviewPage.tsx`, `DocViewer.tsx`, `FileList.tsx`, `PricingBlock.tsx`.

### Step 6 → Pricing
- Pricing cards (Stripe/Revolut-style).
- Toggle: Standard vs Priority.
- CTA: Checkout.
- Components: `PricingPage.tsx`, `PricingCard.tsx`.

### Step 7 → Checkout
- Stripe integration.
- Mandatory email.
- Optional final upload.
- Priority toggle.
- Components: `CheckoutPage.tsx`.

### Step 8 → Confirmation
- On-site confirmation page + email.
- CTA: Request Revision.
- Components: `ConfirmationPage.tsx`.

### Step 9 → After-Sales
- Support form for revisions.
- Optional upsells: coaching.
- Components: `AfterSalesPage.tsx`.

### Step 10 → AI Plan Machine (Future)
- Placeholder teaser.

---

## 5. Subpages
- Terms & Conditions: General, Liability, Governing Law.
- Privacy Policy: GDPR compliant.
- GDPR Info: Data stored securely, deletable.
- Contact: Simple form (Name, Email, Message).

---

## 6. Fallbacks & Edge Cases
- Skipped inputs auto-flagged.
- No results → add program manually.
- Readiness advisor-only.
- Preview incomplete warning banner.
- Checkout fail → retry or alternate.
- Confirmation email fail → fallback web confirmation.
- Uploads fail → retry option.
- Offline mode → save locally.

---

## 7. Benchmark Compliance

### Stripe / Revolut / Apple Alignment
- Dynamic navigation with progress.
- Revolut-style pricing toggle.
- Trust stacking.
- Progressive disclosure.
- Meaningful animations.
- Mobile-first consistency.
- Accessibility baked in.

---

## 8. Developer Notes
- Work in **small packages** only.
- Always run `npm run build` before commit.
- Update `DEV_GUIDE.md` after each package.
- Personas applied as **functional UI logic**.
- Animations mapped step-by-step.
- Branding + unified NavBar enforced.
- Guest path always available.
- Accessibility compliance mandatory.

---

## 9. File Management
- `docs/User_journey.pdf` → canonical design doc (visual reference).
- `docs/User-journey.md` → structured doc (this file).
- `docs/MASTER_PROMPT.md` → workflow + rules.
- `docs/DEV_GUIDE.md` → progress tracker.

---
